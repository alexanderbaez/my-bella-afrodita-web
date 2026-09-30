package com.bellafrodita.TiendaBellaAfrodita.orden.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizarEnvioRequest {

    @NotNull(message = "El costo de envío es obligatorio")
    @PositiveOrZero(message = "El costo de envío debe ser mayor o igual a cero")
    private BigDecimal costoEnvio;
}
