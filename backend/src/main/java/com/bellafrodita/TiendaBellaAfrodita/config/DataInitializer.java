package com.bellafrodita.TiendaBellaAfrodita.config;

import com.bellafrodita.TiendaBellaAfrodita.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.repository.ProductoRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDatabase(ProductoRepository repository) {
        return args -> {
            ClassPathResource resource = new ClassPathResource("productos_reales.json");
            if (resource.exists()) {
                ObjectMapper mapper = new ObjectMapper();
                try (InputStream is = resource.getInputStream()) {
                    List<Producto> productosReales = mapper.readValue(is, new TypeReference<List<Producto>>() {});
                    
                    // Si la base de datos tiene productos de prueba o rutas ../images/ obsoletas, sincronizamos con el catálogo real normalizado
                    boolean necesitaActualizarRutas = repository.findAll().stream()
                            .anyMatch(p -> p.getImagenes() != null && p.getImagenes().stream().anyMatch(img -> img.startsWith("../images/")));

                    if (repository.count() < 40 || necesitaActualizarRutas) {
                        repository.deleteAll();
                        repository.saveAll(productosReales);
                        System.out.println(">>> [DataInitializer] ¡ÉXITO! Se sincronizaron " + productosReales.size() + " productos reales con rutas normalizadas /images/ en MySQL.");
                    } else {
                        System.out.println(">>> [DataInitializer] Catálogo ya inicializado con " + repository.count() + " productos.");
                    }
                } catch (Exception e) {
                    System.err.println(">>> [DataInitializer] Error al leer productos_reales.json: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.err.println(">>> [DataInitializer] Archivo productos_reales.json no encontrado en classpath.");
            }
        };
    }
}
