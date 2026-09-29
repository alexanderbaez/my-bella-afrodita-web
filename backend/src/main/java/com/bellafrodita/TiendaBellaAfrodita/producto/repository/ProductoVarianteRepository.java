package com.bellafrodita.TiendaBellaAfrodita.producto.repository;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.ProductoVariante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoVarianteRepository extends JpaRepository<ProductoVariante, Long> {

    List<ProductoVariante> findByProductoId(Long productoId);

    Optional<ProductoVariante> findByProductoIdAndTalleIgnoreCase(Long productoId, String talle);

    Optional<ProductoVariante> findByProductoIdAndTalle(Long productoId, String talle);
}
