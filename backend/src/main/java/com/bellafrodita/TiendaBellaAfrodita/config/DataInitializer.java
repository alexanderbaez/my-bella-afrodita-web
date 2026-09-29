package com.bellafrodita.TiendaBellaAfrodita.config;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.model.ProductoVariante;
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
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(ProductoRepository productoRepository,
                                          UsuarioRepository usuarioRepository,
                                          PasswordEncoder passwordEncoder,
                                          JdbcTemplate jdbcTemplate) {
        return args -> {
            // 1. SEEDER DE USUARIO ADMINISTRADOR EN MYSQL
            String adminEmail = "admin@bellafrodita.com";
            if (!usuarioRepository.existsByEmail(adminEmail)) {
                Usuario admin = Usuario.builder()
                        .email(adminEmail)
                        .password(passwordEncoder.encode("AdminAfrodita2026!"))
                        .nombre("Administrador Bella Afrodita")
                        .rol("ROLE_ADMIN")
                        .activo(true)
                        .fechaCreacion(LocalDateTime.now())
                        .build();

                usuarioRepository.save(admin);
                System.out.println(">>> [DataInitializer] ¡ÉXITO! Usuario administrador inicializado en MySQL: " + adminEmail);
            } else {
                System.out.println(">>> [DataInitializer] Usuario administrador (" + adminEmail + ") ya verificado en base de datos.");
            }

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
                            ProductoVariante variante = ProductoVariante.builder()
                                    .talle(talle.trim())
                                    .stock(5) // Stock inicial por defecto
                                    .producto(p)
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

            if (productosMigrados > 0) {
                System.out.println(">>> [DataInitializer] Migración de inventario completada: " + variantesCreadasTotal +
                        " variantes creadas con stock inicial (5 u.) en " + productosMigrados + " productos.");
            } else {
                System.out.println(">>> [DataInitializer] Inventario de variantes ya se encuentra inicializado y sincronizado.");
            }
        };
    }
}
