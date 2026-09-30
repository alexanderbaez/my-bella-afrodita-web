package com.bellafrodita.TiendaBellaAfrodita.orden.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TipoEntrega {
    RETIRO_SHOWROOM,
    ENVIO_MOTO_SAN_JUAN,
    ENVIO_SAN_JUAN,
    ENVIO_NACIONAL;

    @JsonCreator
    public static TipoEntrega fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return ENVIO_MOTO_SAN_JUAN;
        }
        String normalizado = value.trim().toUpperCase().replace(" ", "_");
        if (normalizado.equals("ENVIO_SAN_JUAN")) {
            return ENVIO_MOTO_SAN_JUAN;
        }
        for (TipoEntrega t : TipoEntrega.values()) {
            if (t.name().equalsIgnoreCase(normalizado)) {
                return t;
            }
        }
        return ENVIO_MOTO_SAN_JUAN;
    }
}
