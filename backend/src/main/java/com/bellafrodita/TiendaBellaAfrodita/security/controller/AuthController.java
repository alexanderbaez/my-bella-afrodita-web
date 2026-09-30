package com.bellafrodita.TiendaBellaAfrodita.security.controller;

import com.bellafrodita.TiendaBellaAfrodita.security.dto.LoginRequest;
import com.bellafrodita.TiendaBellaAfrodita.security.dto.LoginResponse;
import com.bellafrodita.TiendaBellaAfrodita.usuario.model.Usuario;
import com.bellafrodita.TiendaBellaAfrodita.usuario.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;

    public AuthController(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Inicio de sesión con autenticación DaoAuthenticationProvider y persistencia en sesión.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            HttpSession session = request.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            Usuario usuario = usuarioRepository.findByEmail(loginRequest.getEmail()).orElse(null);
            String nombre = usuario != null ? usuario.getNombre() : authentication.getName();
            String rol = usuario != null ? usuario.getRol() : "ROLE_CLIENTE";

            LoginResponse response = LoginResponse.builder()
                    .authenticated(true)
                    .email(authentication.getName())
                    .nombre(nombre)
                    .rol(rol)
                    .build();

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("authenticated", false, "error", "Credenciales incorrectas"));
        } catch (DisabledException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("authenticated", false, "error", "La cuenta de usuario está desactivada"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("authenticated", false, "error", "Error durante el inicio de sesión: " + ex.getMessage()));
        }
    }

    /**
     * Consulta el estado de autenticación de la sesión activa.
     */
    @GetMapping("/status")
    public ResponseEntity<LoginResponse> status(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            Usuario usuario = usuarioRepository.findByEmail(authentication.getName()).orElse(null);
            String nombre = usuario != null ? usuario.getNombre() : authentication.getName();
            String rol = usuario != null ? usuario.getRol() : "ROLE_CLIENTE";

            return ResponseEntity.ok(LoginResponse.builder()
                    .authenticated(true)
                    .email(authentication.getName())
                    .nombre(nombre)
                    .rol(rol)
                    .build());
        }

        return ResponseEntity.ok(LoginResponse.builder()
                .authenticated(false)
                .build());
    }

    /**
     * Endpoint /api/auth/me para obtener los datos de sesión activa o 401 si no está autenticado.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            Usuario usuario = usuarioRepository.findByEmail(authentication.getName()).orElse(null);
            String nombre = usuario != null ? usuario.getNombre() : authentication.getName();
            String rol = usuario != null ? usuario.getRol() : "ROLE_CLIENTE";

            return ResponseEntity.ok(LoginResponse.builder()
                    .authenticated(true)
                    .email(authentication.getName())
                    .nombre(nombre)
                    .rol(rol)
                    .build());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("authenticated", false, "error", "No autorizado"));
    }

    /**
     * Endpoint para compatibilidad previa.
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verificarCredenciales(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.ok(Map.of(
                    "autenticado", true,
                    "usuario", authentication.getName()
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("autenticado", false));
    }

    /**
     * Cierre de sesión y destrucción de contexto.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of("authenticated", false, "message", "Sesión cerrada exitosamente"));
    }
}
