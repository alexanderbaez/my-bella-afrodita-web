package com.bellafrodita.TiendaBellaAfrodita.orden.dto;

import com.bellafrodita.TiendaBellaAfrodita.orden.model.EstadoOrden;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActualizarEstadoRequest {

    @NotNull(message = "El nuevo estado es obligatorio")
    private EstadoOrden estado;
}
