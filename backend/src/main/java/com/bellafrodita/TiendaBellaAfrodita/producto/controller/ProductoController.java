package com.bellafrodita.TiendaBellaAfrodita.producto.controller;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<Producto>> obtenerTodos(
            @RequestParam(required = false) String categoria) {
        return ResponseEntity.ok(productoService.listarTodos(categoria));
    }

    @GetMapping("/destacados")
    public ResponseEntity<List<Producto>> obtenerDestacados() {
        return ResponseEntity.ok(productoService.listarDestacados());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerPorId(@PathVariable Long id) {
        return productoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-destacado")
    public ResponseEntity<Producto> alternarDestacado(@PathVariable Long id) {
        return productoService.alternarDestacadoInicio(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Producto> crearProducto(@Valid @RequestBody Producto producto) {
        Producto guardado = productoService.crearProducto(producto);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(
            @PathVariable Long id,
            @Valid @RequestBody Producto datos) {
        return productoService.actualizarProducto(id, datos)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-stock")
    public ResponseEntity<Producto> alternarStock(@PathVariable Long id) {
        return productoService.alternarStock(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarProducto(@PathVariable Long id) {
        boolean eliminado = productoService.eliminarProducto(id);
        if (eliminado) {
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Producto eliminado correctamente");
            respuesta.put("id", id);
            return ResponseEntity.ok(respuesta);
        }
        return ResponseEntity.notFound().build();
    }
}
