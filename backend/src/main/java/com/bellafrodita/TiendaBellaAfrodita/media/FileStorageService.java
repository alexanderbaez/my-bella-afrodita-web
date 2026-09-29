package com.bellafrodita.TiendaBellaAfrodita.media;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private Path fileStorageLocation;

    private static final List<String> ALLOWED_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp");

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(this.uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo inicializar la carpeta de almacenamiento de archivos: " + this.fileStorageLocation, ex);
        }
    }

    /**
     * Guarda el archivo MultipartFile en disco generando un nombre único con UUID
     * tras validar su extensión.
     *
     * @param file Archivo subido por el cliente
     * @return Nombre del archivo único almacenado
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo subido se encuentra vacío.");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        // Validación de extensión segura
        String extension = "";
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            extension = originalFilename.substring(lastDotIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Extensión de archivo '" + extension + "' no admitida. Extensiones permitidas: " + ALLOWED_EXTENSIONS);
        }

        // Generar nombre único con UUID para evitar colisiones
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename).normalize();

            // Verificación de seguridad de path traversal
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Ruta no autorizada para almacenar el archivo.");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            return uniqueFilename;
        } catch (IOException ex) {
            throw new RuntimeException("Error al guardar el archivo " + uniqueFilename, ex);
        }
    }

    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }
}
