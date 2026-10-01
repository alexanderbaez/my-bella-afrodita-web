package com.bellafrodita.TiendaBellaAfrodita.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${file.images-dir:}")
    private String imagesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadResourceLocation = uploadPath.toUri().toString();
        if (!uploadResourceLocation.endsWith("/")) {
            uploadResourceLocation += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadResourceLocation);

        if (imagesDir != null && !imagesDir.trim().isEmpty()) {
            Path imagesPath = Paths.get(imagesDir).toAbsolutePath().normalize();
            String imagesResourceLocation = imagesPath.toUri().toString();
            if (!imagesResourceLocation.endsWith("/")) {
                imagesResourceLocation += "/";
            }
            registry.addResourceHandler("/images/**")
                    .addResourceLocations(imagesResourceLocation, "classpath:/static/images/");
        }
    }
}
