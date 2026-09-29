package com.bellafrodita.TiendaBellaAfrodita.producto.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoVarianteDto {
    private Long id;
    private String talle;
    private Integer stock;
    private String sku;
}
