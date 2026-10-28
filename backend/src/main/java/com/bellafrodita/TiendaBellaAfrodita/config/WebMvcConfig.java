package com.bellafrodita.TiendaBellaAfrodita.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${file.images-dir:}")
    private String imagesDir;

    @Value("${file.thumbnails-dir:thumbnails}")
    private String thumbnailsDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cache-Control: max-age=2592000 (30 días), public para imágenes y thumbnails en uploads
        CacheControl cacheImagenes = CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic();
        // Cache-Control: max-age=604800 (7 días), public para assets estáticos
        CacheControl cacheEstaticos = CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic();

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadResourceLocation = uploadPath.toUri().toString();
        if (!uploadResourceLocation.endsWith("/")) {
            uploadResourceLocation += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadResourceLocation)
                .setCacheControl(cacheImagenes);

        if (imagesDir != null && !imagesDir.trim().isEmpty()) {
            Path imagesPath = Paths.get(imagesDir).toAbsolutePath().normalize();
            String imagesResourceLocation = imagesPath.toUri().toString();
            if (!imagesResourceLocation.endsWith("/")) {
                imagesResourceLocation += "/";
            }
            registry.addResourceHandler("/images/**")
                    .addResourceLocations(imagesResourceLocation, "classpath:/static/images/")
                    .setCacheControl(cacheImagenes);
        }

        if (thumbnailsDir != null && !thumbnailsDir.trim().isEmpty()) {
            Path thumbPath = Paths.get(thumbnailsDir).toAbsolutePath().normalize();
            try {
                java.nio.file.Files.createDirectories(thumbPath);
            } catch (Exception ignored) {}
            String thumbResourceLocation = thumbPath.toUri().toString();
            if (!thumbResourceLocation.endsWith("/")) {
                thumbResourceLocation += "/";
            }
            registry.addResourceHandler("/thumbnails/**")
                    .addResourceLocations(thumbResourceLocation, "classpath:/static/thumbnails/")
                    .setCacheControl(cacheImagenes);
        }

        // Cache para assets, css y js servidos desde classpath
        registry.addResourceHandler("/assets/**", "/css/**", "/js/**")
                .addResourceLocations("classpath:/static/assets/", "classpath:/static/css/", "classpath:/static/js/")
                .setCacheControl(cacheEstaticos);
    }
}

