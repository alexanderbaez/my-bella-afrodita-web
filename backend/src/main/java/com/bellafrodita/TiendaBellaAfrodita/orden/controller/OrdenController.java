package com.bellafrodita.TiendaBellaAfrodita.orden.controller;

import com.bellafrodita.TiendaBellaAfrodita.orden.dto.ActualizarEstadoRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.dto.CheckoutRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.dto.OrdenResponse;
import com.bellafrodita.TiendaBellaAfrodita.orden.service.OrdenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
@CrossOrigin(origins = "*")
public class OrdenController {

    private final OrdenService ordenService;

    public OrdenController(OrdenService ordenService) {
        this.ordenService = ordenService;
    }

    /**
     * Endpoint PÚBLICO para registrar una orden de compra y generar el link oficial de WhatsApp.
     */
    @PostMapping("/checkout")
    public ResponseEntity<OrdenResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        OrdenResponse response = ordenService.crearOrden(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint PROTEGIDO (ROLE_ADMIN) para listar todas las órdenes registradas en MySQL.
     */
    @GetMapping
    public ResponseEntity<List<OrdenResponse>> listarOrdenes() {
        return ResponseEntity.ok(ordenService.listarOrdenes());
    }

    /**
     * Endpoint PROTEGIDO (ROLE_ADMIN) para consultar el detalle de una orden por ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrdenResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ordenService.obtenerPorId(id));
    }

    /**
     * Endpoint PROTEGIDO (ROLE_ADMIN) para actualizar el estado de una orden.
     */
    @PatchMapping("/{id}/estado")
    public ResponseEntity<OrdenResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoRequest request) {
        return ResponseEntity.ok(ordenService.actualizarEstado(id, request.getEstado()));
    }

    /**
     * Endpoint PROTEGIDO (ROLE_ADMIN) para cotizar el costo del cadete en moto y actualizar el total.
     */
    @PatchMapping("/{id}/cotizar-envio")
    public ResponseEntity<OrdenResponse> cotizarEnvio(
            @PathVariable Long id,
            @Valid @RequestBody com.bellafrodita.TiendaBellaAfrodita.orden.dto.CotizarEnvioRequest request) {
        return ResponseEntity.ok(ordenService.cotizarEnvio(id, request.getCostoEnvio()));
    }
}
