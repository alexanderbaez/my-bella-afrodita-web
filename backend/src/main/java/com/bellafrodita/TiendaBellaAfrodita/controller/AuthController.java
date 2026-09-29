package com.bellafrodita.TiendaBellaAfrodita.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verificarCredenciales(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return ResponseEntity.ok(Map.of(
                "autenticado", true,
                "usuario", authentication.getName()
            ));
        }
        return ResponseEntity.status(401).body(Map.of("autenticado", false));
    }
}
