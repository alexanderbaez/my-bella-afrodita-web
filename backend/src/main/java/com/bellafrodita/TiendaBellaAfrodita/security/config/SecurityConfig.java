package com.bellafrodita.TiendaBellaAfrodita.security.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authenticationProvider(authenticationProvider())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 1. Vistas y recursos de administración protegidos estrictamente para ROLE_ADMIN
                .requestMatchers("/admin.html", "/js/admin.js").hasRole("ADMIN")
                .requestMatchers("/api/admin", "/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/ordenes", "/api/ordenes/**").hasRole("ADMIN")
                .requestMatchers("/api/productos/admin", "/api/productos/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/resenas/admin", "/api/resenas/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/upload", "/api/upload/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/productos", "/api/productos/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/productos/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/productos/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/productos/**").hasRole("ADMIN")

                // 2. Endpoints de autenticación públicos
                .requestMatchers("/api/auth/login", "/api/auth/status", "/api/auth/logout", "/api/auth/me", "/api/auth/verify").permitAll()

                // 3. Catálogo público y reseñas destacadas (Lectura GET)
                .requestMatchers(HttpMethod.GET, "/api/productos", "/api/productos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resenas/destacadas").permitAll()

                // 4. Checkout de órdenes y envío público de reseñas
                .requestMatchers(HttpMethod.POST, "/api/ordenes/checkout").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/resenas").permitAll()

                // 5. Recursos estáticos y páginas web públicas (excluyendo admin.html y js/admin.js)
                .requestMatchers("/", "/index.html", "/login.html", "/productos.html", "/producto.html", "/producto", "/producto/**", "/favicon.ico", "/error").permitAll()
                .requestMatchers("/css/**", "/images/**", "/static/**", "/uploads/**").permitAll()
                .requestMatchers("/js/login.js", "/js/script.js", "/js/producto.js").permitAll()

                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                // Si intenta acceder a /admin.html sin autenticación, redirige inmediatamente a /login.html
                // Para llamadas API o recursos protegidos, devuelve 401 Unauthorized
                .authenticationEntryPoint((request, response, authException) -> {
                    String uri = request.getRequestURI();
                    if ("/admin.html".equalsIgnoreCase(uri) || uri.endsWith("/admin.html")) {
                        response.sendRedirect("/login.html");
                    } else {
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No autorizado");
                    }
                })
                // Si no tiene el rol ADMIN para /admin.html, redirige a login con aviso de acceso denegado
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    String uri = request.getRequestURI();
                    if ("/admin.html".equalsIgnoreCase(uri) || uri.endsWith("/admin.html")) {
                        response.sendRedirect("/login.html?error=forbidden");
                    } else {
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Acceso denegado: se requiere rol de administrador");
                    }
                })
            )
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
