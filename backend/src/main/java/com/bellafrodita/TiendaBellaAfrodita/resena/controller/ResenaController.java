package com.bellafrodita.TiendaBellaAfrodita.resena.controller;

import com.bellafrodita.TiendaBellaAfrodita.resena.dto.CrearResenaDTO;
import com.bellafrodita.TiendaBellaAfrodita.resena.model.Resena;
import com.bellafrodita.TiendaBellaAfrodita.resena.repository.ResenaRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resenas")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ResenaController {

    private final ResenaRepository resenaRepository;

    public ResenaController(ResenaRepository resenaRepository) {
        this.resenaRepository = resenaRepository;
    }

    /**
     * POST /api/resenas (Público)
     * Permite a las clientas dejar su reseña. Se guarda con moderación previa (aprobada=false, destacadaHome=false)
     * y sanitización XSS de los campos textuales.
     */
    @PostMapping
    public ResponseEntity<?> crearResena(@Valid @RequestBody CrearResenaDTO dto) {
        // Sanitizar entradas para prevenir inyecciones HTML / scripts XSS
        String nombreSanitizado = HtmlUtils.htmlEscape(dto.getNombreCliente().trim());
        String deptoSanitizado = HtmlUtils.htmlEscape(dto.getDepartamento().trim());
        String comentarioSanitizado = HtmlUtils.htmlEscape(dto.getComentario().trim());

        // Asegurar rango de estrellas
        int estrellas = Math.max(1, Math.min(5, dto.getEstrellas()));

        Resena resena = Resena.builder()
                .nombreCliente(nombreSanitizado)
                .departamento(deptoSanitizado)
                .estrellas(estrellas)
                .comentario(comentarioSanitizado)
                .aprobada(false)
                .destacadaHome(false)
                .build();

        Resena guardada = resenaRepository.save(resena);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("mensaje", "¡Gracias por compartir tu experiencia! Tu reseña será visible una vez validada.");
        respuesta.put("id", guardada.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    /**
     * GET /api/resenas/destacadas (Público)
     * Devuelve las reseñas aprobadas y seleccionadas para lucirse en la página principal.
     */
    @GetMapping("/destacadas")
    public ResponseEntity<List<Resena>> obtenerResenasDestacadas() {
        List<Resena> destacadas = resenaRepository.findByDestacadaHomeTrueAndAprobadaTrueOrderByFechaCreacionDesc();
        return ResponseEntity.ok(destacadas);
    }

    /**
     * GET /api/resenas/admin (hasRole('ADMIN'))
     * Lista todas las reseñas ordenadas por fecha reciente para su moderación desde el panel admin.
     */
    @GetMapping("/admin")
    public ResponseEntity<List<Resena>> listarTodasParaAdmin() {
        List<Resena> todas = resenaRepository.findAllByOrderByFechaCreacionDesc();
        return ResponseEntity.ok(todas);
    }

    /**
     * PATCH /api/resenas/admin/{id}/toggle-aprobada (hasRole('ADMIN'))
     * Alterna el estado de aprobación de una reseña.
     */
    @PatchMapping("/admin/{id}/toggle-aprobada")
    public ResponseEntity<?> toggleAprobada(@PathVariable Long id) {
        java.util.Optional<Resena> opt = resenaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Reseña no encontrada con ID: " + id));
        }
        Resena resena = opt.get();
        boolean nuevoEstado = !resena.isAprobada();
        resena.setAprobada(nuevoEstado);
        if (!nuevoEstado) {
            resena.setDestacadaHome(false);
        }
        Resena actualizada = resenaRepository.save(resena);
        return ResponseEntity.ok(actualizada);
    }

    /**
     * PATCH /api/resenas/admin/{id}/toggle-destacada (hasRole('ADMIN'))
     * Alterna si la reseña se muestra en la portada de la tienda.
     */
    @PatchMapping("/admin/{id}/toggle-destacada")
    public ResponseEntity<?> toggleDestacada(@PathVariable Long id) {
        java.util.Optional<Resena> opt = resenaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Reseña no encontrada con ID: " + id));
        }
        Resena resena = opt.get();
        boolean nuevoDestacada = !resena.isDestacadaHome();
        resena.setDestacadaHome(nuevoDestacada);
        if (nuevoDestacada) {
            resena.setAprobada(true);
        }
        Resena actualizada = resenaRepository.save(resena);
        return ResponseEntity.ok(actualizada);
    }

    /**
     * DELETE /api/resenas/admin/{id} (hasRole('ADMIN'))
     * Elimina permanentemente una reseña spam o inapropiada.
     */
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> eliminarResena(@PathVariable Long id) {
        java.util.Optional<Resena> opt = resenaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Reseña no encontrada con ID: " + id));
        }
        resenaRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("mensaje", "Reseña eliminada correctamente.", "id", id));
    }
}
