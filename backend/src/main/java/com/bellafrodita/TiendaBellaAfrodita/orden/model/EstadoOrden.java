package com.bellafrodita.TiendaBellaAfrodita.orden.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum EstadoOrden {
    PENDIENTE_COTIZACION,
    PENDIENTE,
    PAGADO,
    EN_PREPARACION,
    ENVIADO,
    ENTREGADO,
    CANCELADO;

    @JsonCreator
    public static EstadoOrden fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return PENDIENTE_COTIZACION;
        }
        String normalizado = value.trim().toUpperCase()
                .replace(" ", "_")
                .replace("Ó", "O")
                .replace("Á", "A")
                .replace("É", "E")
                .replace("Í", "I")
                .replace("Ú", "U");
        for (EstadoOrden estado : EstadoOrden.values()) {
            if (estado.name().equalsIgnoreCase(normalizado)) {
                return estado;
            }
        }
        return PENDIENTE_COTIZACION;
    }
}
