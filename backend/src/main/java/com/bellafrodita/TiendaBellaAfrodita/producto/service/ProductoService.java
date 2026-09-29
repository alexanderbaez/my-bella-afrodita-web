package com.bellafrodita.TiendaBellaAfrodita.producto.service;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    @Transactional(readOnly = true)
    public List<Producto> listarTodos(String categoria) {
        if (categoria != null && !categoria.isBlank()) {
            return productoRepository.findByCategoriaIgnoreCase(categoria.trim());
        }
        return productoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Producto> buscarPorId(Long id) {
        return productoRepository.findById(id);
    }

    @Transactional
    public Producto crearProducto(Producto producto) {
        producto.setId(null);
        if (producto.getStock() == null) {
            producto.setStock(producto.tieneStockGeneral());
        }
        return productoRepository.save(producto);
    }

    @Transactional
    public Optional<Producto> actualizarProducto(Long id, Producto datos) {
        return productoRepository.findById(id).map(producto -> {
            producto.setNombre(datos.getNombre());
            producto.setDescripcion(datos.getDescripcion());
            producto.setCategoria(datos.getCategoria());
            producto.setPrecioMinorista(datos.getPrecioMinorista());
            producto.setPrecioMayorista(datos.getPrecioMayorista());
            producto.setImagenes(datos.getImagenes() != null ? datos.getImagenes() : new ArrayList<>());
            producto.setEtiqueta(datos.getEtiqueta());
            producto.setVariantes(datos.getVariantes() != null ? datos.getVariantes() : new ArrayList<>());

            if (datos.getStock() != null) {
                producto.setStock(datos.getStock());
            } else {
                producto.setStock(producto.tieneStockGeneral());
            }

            return productoRepository.save(producto);
        });
    }

    @Transactional
    public Optional<Producto> alternarStock(Long id) {
        return productoRepository.findById(id).map(producto -> {
            boolean nuevoEstado = !Boolean.TRUE.equals(producto.getStock());
            producto.setStock(nuevoEstado);
            return productoRepository.save(producto);
        });
    }

    @Transactional
    public boolean eliminarProducto(Long id) {
        return productoRepository.findById(id).map(producto -> {
            productoRepository.delete(producto);
            return true;
        }).orElse(false);
    }
}
