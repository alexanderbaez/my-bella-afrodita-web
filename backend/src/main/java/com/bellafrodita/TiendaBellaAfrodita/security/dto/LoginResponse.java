package com.bellafrodita.TiendaBellaAfrodita.security.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private boolean authenticated;
    private String email;
    private String nombre;
    private String rol;
}
