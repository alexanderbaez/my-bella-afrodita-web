package com.bellafrodita.TiendaBellaAfrodita.producto.repository;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByCategoriaIgnoreCase(String categoria);
}
