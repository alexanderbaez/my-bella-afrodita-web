package com.bellafrodita.TiendaBellaAfrodita.orden.dto;

import com.bellafrodita.TiendaBellaAfrodita.orden.model.EstadoOrden;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.MetodoPago;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenResponse {

    private Long id;
    private String codigoSeguimiento;
    private LocalDateTime fechaCreacion;
    private String clienteNombre;
    private String clienteTelefono;
    private String clienteDireccion;
    private BigDecimal total;
    private BigDecimal subtotal;
    private BigDecimal descuentoMayorista;
    private boolean esMayorista;
    private EstadoOrden estado;
    private MetodoPago metodoPago;
    private List<OrdenItemResponse> items;
    private String whatsappUrl;
}
