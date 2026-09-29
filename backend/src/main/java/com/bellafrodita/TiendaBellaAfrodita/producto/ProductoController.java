package com.bellafrodita.TiendaBellaAfrodita.producto;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    private final ProductoRepository productoRepository;

    public ProductoController(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @GetMapping
    public ResponseEntity<List<Producto>> listarProductos(
            @RequestParam(required = false) String categoria) {
        if (categoria != null && !categoria.isBlank()) {
            return ResponseEntity.ok(productoRepository.findByCategoriaIgnoreCase(categoria.trim()));
        }
        return ResponseEntity.ok(productoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerPorId(@PathVariable Long id) {
        return productoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Producto> crearProducto(@Valid @RequestBody Producto producto) {
        producto.setId(null);
        if (producto.getStock() == null) {
            producto.setStock(true);
        }
        Producto guardado = productoRepository.save(producto);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(
            @PathVariable Long id,
            @Valid @RequestBody Producto datos) {
        return productoRepository.findById(id)
                .map(producto -> {
                    producto.setNombre(datos.getNombre());
                    producto.setDescripcion(datos.getDescripcion());
                    producto.setCategoria(datos.getCategoria());
                    producto.setPrecioMinorista(datos.getPrecioMinorista());
                    producto.setPrecioMayorista(datos.getPrecioMayorista());
                    producto.setTalles(datos.getTalles());
                    producto.setImagenes(datos.getImagenes());
                    producto.setEtiqueta(datos.getEtiqueta());
                    if (datos.getStock() != null) {
                        producto.setStock(datos.getStock());
                    }
                    Producto actualizado = productoRepository.save(producto);
                    return ResponseEntity.ok(actualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-stock")
    public ResponseEntity<Producto> alternarStock(@PathVariable Long id) {
        return productoRepository.findById(id)
                .map(producto -> {
                    boolean nuevoEstado = !Boolean.TRUE.equals(producto.getStock());
                    producto.setStock(nuevoEstado);
                    Producto actualizado = productoRepository.save(producto);
                    return ResponseEntity.ok(actualizado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarProducto(@PathVariable Long id) {
        return productoRepository.findById(id)
                .map(producto -> {
                    productoRepository.delete(producto);
                    Map<String, Object> respuesta = new HashMap<>();
                    respuesta.put("mensaje", "Producto eliminado correctamente");
                    respuesta.put("id", id);
                    return ResponseEntity.ok(respuesta);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
