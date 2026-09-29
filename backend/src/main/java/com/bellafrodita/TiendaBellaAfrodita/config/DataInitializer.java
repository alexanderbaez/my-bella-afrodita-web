package com.bellafrodita.TiendaBellaAfrodita.config;

import com.bellafrodita.TiendaBellaAfrodita.producto.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.ProductoRepository;
import com.bellafrodita.TiendaBellaAfrodita.usuario.Usuario;
import com.bellafrodita.TiendaBellaAfrodita.usuario.UsuarioRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(ProductoRepository productoRepository,
                                          UsuarioRepository usuarioRepository,
                                          PasswordEncoder passwordEncoder) {
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

            // 2. SEEDER DE PRODUCTOS:
            // Si productoRepository.count() > 0, NO ejecuta ninguna inserción ni lee productos_reales.json. MySQL es la única fuente de verdad.
            if (productoRepository.count() > 0) {
                System.out.println(">>> [DataInitializer] MySQL contiene " + productoRepository.count() + " productos. Fuente de verdad activa, omitiendo carga de JSON.");
                return;
            }

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
        };
    }
}
