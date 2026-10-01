package com.bellafrodita.TiendaBellaAfrodita.config;

import com.bellafrodita.TiendaBellaAfrodita.producto.dto.ProductoVarianteDto;
import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
import com.bellafrodita.TiendaBellaAfrodita.usuario.model.Usuario;
import com.bellafrodita.TiendaBellaAfrodita.usuario.repository.UsuarioRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import com.bellafrodita.TiendaBellaAfrodita.resena.model.Resena;
import com.bellafrodita.TiendaBellaAfrodita.resena.repository.ResenaRepository;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(ProductoRepository productoRepository,
                                          UsuarioRepository usuarioRepository,
                                          PasswordEncoder passwordEncoder,
                                          JdbcTemplate jdbcTemplate,
                                          ResenaRepository resenaRepository) {
        return args -> {
            // 0. ACTUALIZAR ESQUEMA tipo_entrega EN MYSQL (Soporte ENVIO_MOTO_SAN_JUAN)
            try {
                jdbcTemplate.execute("ALTER TABLE ordenes MODIFY COLUMN tipo_entrega VARCHAR(50) NOT NULL");
                jdbcTemplate.execute("UPDATE ordenes SET tipo_entrega = 'ENVIO_MOTO_SAN_JUAN' WHERE tipo_entrega = 'ENVIO_SAN_JUAN'");
            } catch (Exception e) {
                System.out.println(">>> [DataInitializer] Nota esquema tipo_entrega: " + e.getMessage());
            }

            // 1. SEEDER DE USUARIO ADMINISTRADOR MAESTRO EN MYSQL
            String previousAdminEmail = "admin@bellafrodita.com";
            usuarioRepository.findByEmail(previousAdminEmail).ifPresent(oldAdmin -> {
                usuarioRepository.delete(oldAdmin);
                System.out.println(">>> [DataInitializer] Administrador previo (" + previousAdminEmail + ") removido de MySQL.");
            });

            String masterAdminEmail = "lopezandre26@gmail.com";
            Usuario adminMaster = usuarioRepository.findByEmail(masterAdminEmail).orElseGet(() ->
                    Usuario.builder()
                            .email(masterAdminEmail)
                            .fechaCreacion(LocalDateTime.now())
                            .build()
            );

            adminMaster.setEmail(masterAdminEmail);
            adminMaster.setPassword(passwordEncoder.encode("123456789"));
            adminMaster.setNombre("Andrea López");
            adminMaster.setRol("ROLE_ADMIN");
            adminMaster.setActivo(true);
            usuarioRepository.save(adminMaster);
            System.out.println(">>> [DataInitializer] ¡ÉXITO! Usuario administrador maestro sincronizado en MySQL: " + masterAdminEmail);

            // 2. SEEDER INICIAL DE PRODUCTOS (SI BD ESTÁ COMPLETAMENTE VACÍA)
            if (productoRepository.count() == 0) {
                ClassPathResource resource = new ClassPathResource("productos_reales.json");
                if (resource.exists()) {
                    ObjectMapper mapper = new ObjectMapper();
                    try (InputStream is = resource.getInputStream()) {
                        List<Producto> productosReales = mapper.readValue(is, new TypeReference<List<Producto>>() {});
                        productoRepository.saveAll(productosReales);
                        System.out.println(">>> [DataInitializer] Catálogo inicializado por primera vez con " + productosReales.size() + " productos.");
                    } catch (Exception e) {
                        System.err.println(">>> [DataInitializer] Error al leer productos_reales.json: " + e.getMessage());
                    }
                } else {
                    System.err.println(">>> [DataInitializer] Archivo productos_reales.json no encontrado en classpath.");
                }
            } else {
                System.out.println(">>> [DataInitializer] MySQL contiene " + productoRepository.count() + " productos. Fuente de verdad activa.");
            }

            // 2.1 INICIALIZAR DESTACADOS DE PORTADA SI NINGUNO ESTÁ MARCADO
            if (productoRepository.findByDestacadoInicioTrue().isEmpty() && productoRepository.count() > 0) {
                List<Producto> prods = productoRepository.findAll();
                int destacadosCount = 0;
                for (int i = 0; i < Math.min(8, prods.size()); i++) {
                    prods.get(i).setDestacadoInicio(true);
                    destacadosCount++;
                }
                productoRepository.saveAll(prods);
                System.out.println(">>> [DataInitializer] " + destacadosCount + " productos configurados como destacados de portada.");
            }

            // 3. MIGRACIÓN TRANSPARENTE: CONTROL DE STOCK NUMÉRICO POR VARIANTE (TALLE + CANTIDAD)
            List<Producto> productos = productoRepository.findAll();
            int variantesCreadasTotal = 0;
            int productosMigrados = 0;

            for (Producto p : productos) {
                if (p.getVariantes() == null || p.getVariantes().isEmpty()) {
                    // Consultar tabla histórica producto_talles si existía previamente
                    List<String> tallesDb = new ArrayList<>();
                    try {
                        tallesDb = jdbcTemplate.query(
                                "SELECT talle FROM producto_talles WHERE producto_id = ?",
                                (rs, rowNum) -> rs.getString("talle"),
                                p.getId()
                        );
                    } catch (Exception ignored) {
                    }

                    if (tallesDb == null || tallesDb.isEmpty()) {
                        String cat = p.getCategoria() != null ? p.getCategoria().toLowerCase() : "";
                        if (cat.contains("bombacha")) {
                            tallesDb = List.of("1", "2", "3");
                        } else if (cat.contains("conjunto")) {
                            tallesDb = List.of("85", "90", "95", "100");
                        } else if (cat.contains("hombre") || cat.contains("masculino")) {
                            tallesDb = List.of("M", "L", "XL");
                        } else {
                            tallesDb = List.of("ÚNICO");
                        }
                    }

                    for (String talle : tallesDb) {
                        if (talle != null && !talle.isBlank()) {
                            ProductoVarianteDto variante = ProductoVarianteDto.builder()
                                    .talle(talle.trim())
                                    .stock(5) // Stock inicial por defecto
                                    .build();
                            p.addVariante(variante);
                            variantesCreadasTotal++;
                        }
                    }

                    p.setStock(p.tieneStockGeneral());
                    productoRepository.save(p);
                    productosMigrados++;
                }
            }

            // 4. SEEDER DE RESEÑAS VERIFICADAS INICIALES Y ACTUALIZACIÓN DE NOMBRES
            try {
                jdbcTemplate.execute("UPDATE resenas SET nombre_cliente = 'Camila M.', comentario = 'La suavidad de las telas y el calce son impecables. La atención por WhatsApp para el talle fue excelente.' WHERE nombre_cliente LIKE '%Sofía%' OR nombre_cliente LIKE '%Sofia%'");
                jdbcTemplate.execute("UPDATE resenas SET nombre_cliente = 'Luciana R.', comentario = 'Hermosa lencería, los elásticos no marcan y la puntilla es de primera calidad.' WHERE nombre_cliente LIKE '%Valentina%'");
            } catch (Exception e) {
                System.out.println(">>> [DataInitializer] Nota actualización resenas: " + e.getMessage());
            }

            if (resenaRepository.count() == 0) {
                List<Resena> iniciales = List.of(
                    Resena.builder()
                        .nombreCliente("Camila M.")
                        .departamento("Capital")
                        .estrellas(5)
                        .comentario("La suavidad de las telas y el calce son impecables. La atención por WhatsApp para el talle fue excelente.")
                        .aprobada(true)
                        .destacadaHome(true)
                        .fechaCreacion(LocalDateTime.now().minusDays(2))
                        .build(),
                    Resena.builder()
                        .nombreCliente("Paula V.")
                        .departamento("Rivadavia")
                        .estrellas(5)
                        .comentario("Me llegó en moto súper rápido y el empaque muy cuidado y discreto. Feliz con mi conjunto.")
                        .aprobada(true)
                        .destacadaHome(true)
                        .fechaCreacion(LocalDateTime.now().minusDays(1))
                        .build(),
                    Resena.builder()
                        .nombreCliente("Luciana R.")
                        .departamento("Santa Lucía")
                        .estrellas(5)
                        .comentario("Hermosa lencería, los elásticos no marcan y la puntilla es de primera calidad.")
                        .aprobada(true)
                        .destacadaHome(true)
                        .fechaCreacion(LocalDateTime.now())
                        .build()
                );
                resenaRepository.saveAll(iniciales);
                System.out.println(">>> [DataInitializer] 3 Reseñas verificadas iniciales sembradas en MySQL.");
            }
        };
    }
}
