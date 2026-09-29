package com.bellafrodita.TiendaBellaAfrodita.orden.dto;

import com.bellafrodita.TiendaBellaAfrodita.orden.model.MetodoPago;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String clienteNombre;

    @NotBlank(message = "El teléfono del cliente es obligatorio")
    private String clienteTelefono;

    private String clienteDireccion;

    private MetodoPago metodoPago;

    @NotEmpty(message = "El carrito debe contener al menos un producto")
    @Valid
    private List<CheckoutItemRequest> items;
}
