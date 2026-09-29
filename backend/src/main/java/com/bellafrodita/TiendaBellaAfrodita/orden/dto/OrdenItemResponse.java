package com.bellafrodita.TiendaBellaAfrodita.orden.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenItemResponse {

    private Long id;
    private Long productoId;
    private String productoNombre;
    private String talle;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
}
