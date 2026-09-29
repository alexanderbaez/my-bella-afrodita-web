package com.bellafrodita.TiendaBellaAfrodita.media;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.*;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    /**
     * Endpoint protegido para subida de una sola imagen.
     * Genera un UUID único, almacena en uploads/ y retorna la URL pública.
     */
    @PostMapping
    public ResponseEntity<?> uploadSingleFile(@RequestParam("file") MultipartFile file) {
        try {
            String filename = fileStorageService.storeFile(file);
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(filename)
                    .toUriString();

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("filename", filename);
            response.put("url", fileDownloadUri);
            response.put("relativePath", "/uploads/" + filename);
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al procesar la imagen: " + ex.getMessage()));
        }
    }

    /**
     * Endpoint protegido para subida de múltiples imágenes simultáneas.
     */
    @PostMapping("/multiple")
    public ResponseEntity<?> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files) {
        List<Map<String, Object>> responses = new ArrayList<>();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    String filename = fileStorageService.storeFile(file);
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/uploads/")
                            .path(filename)
                            .toUriString();

                    Map<String, Object> fileData = new LinkedHashMap<>();
                    fileData.put("filename", filename);
                    fileData.put("url", fileDownloadUri);
                    fileData.put("relativePath", "/uploads/" + filename);
                    fileData.put("size", file.getSize());

                    responses.add(fileData);
                } catch (Exception ex) {
                    Map<String, Object> errorData = new LinkedHashMap<>();
                    errorData.put("filename", file.getOriginalFilename());
                    errorData.put("error", ex.getMessage());
                    responses.add(errorData);
                }
            }
        }

        return ResponseEntity.ok(responses);
    }
}
