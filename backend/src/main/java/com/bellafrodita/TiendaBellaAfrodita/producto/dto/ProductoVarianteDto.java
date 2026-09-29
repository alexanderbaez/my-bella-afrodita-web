package com.bellafrodita.TiendaBellaAfrodita.producto.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductoVarianteDto implements Serializable {

    private Long id;
    private String talle;
    private Integer stock;
    private String sku;

    public ProductoVarianteDto(String talle, Integer stock) {
        this.talle = talle;
        this.stock = stock != null ? stock : 0;
    }
}
