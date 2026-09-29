package com.bellafrodita.TiendaBellaAfrodita.orden.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutItemRequest {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    private String talle;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad mínima por prenda es 1")
    private Integer cantidad;
}
