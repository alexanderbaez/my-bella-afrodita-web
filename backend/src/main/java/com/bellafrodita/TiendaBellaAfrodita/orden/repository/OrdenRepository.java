package com.bellafrodita.TiendaBellaAfrodita.orden.repository;

import com.bellafrodita.TiendaBellaAfrodita.orden.model.Orden;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdenRepository extends JpaRepository<Orden, Long> {

    @EntityGraph(attributePaths = {"items"})
    List<Orden> findAllByOrderByFechaCreacionDesc();

    @EntityGraph(attributePaths = {"items"})
    Optional<Orden> findByCodigoSeguimiento(String codigo);

    @EntityGraph(attributePaths = {"items"})
    Optional<Orden> findById(Long id);
}
