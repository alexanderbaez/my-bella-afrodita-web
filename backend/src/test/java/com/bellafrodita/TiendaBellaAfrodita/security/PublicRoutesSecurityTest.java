package com.bellafrodita.TiendaBellaAfrodita.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regresión: el catálogo y los recursos públicos NO deben devolver 401/403 a anónimos
 * (incluyendo HEAD, que usan curl -I, health checks y crawlers), y las rutas de
 * administración deben seguir protegidas.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class PublicRoutesSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    private void assertPublic(MvcResult result, String descripcion) {
        int s = result.getResponse().getStatus();
        assertNotEquals(401, s, descripcion + " devolvió 401");
        assertNotEquals(403, s, descripcion + " devolvió 403");
    }

    @Test
    @DisplayName("GET y HEAD /api/productos son públicos")
    void catalogoPublicoGetYHead() throws Exception {
        mockMvc.perform(get("/api/productos")).andExpect(status().isOk());
        mockMvc.perform(head("/api/productos")).andExpect(status().isOk());
        assertPublic(mockMvc.perform(get("/api/productos/destacados")).andReturn(), "GET destacados");
        assertPublic(mockMvc.perform(head("/api/productos/destacados")).andReturn(), "HEAD destacados");
        assertPublic(mockMvc.perform(get("/api/resenas/destacadas")).andReturn(), "GET reseñas destacadas");
    }

    @Test
    @DisplayName("Recursos estáticos nuevos (ux-helpers.js, ux-polish.css) y vistas públicas son accesibles")
    void estaticosPublicos() throws Exception {
        for (String ruta : new String[]{
                "/js/ux-helpers.js", "/js/script.js", "/js/producto.js", "/css/ux-polish.css",
                "/css/index.css", "/", "/index.html", "/productos.html", "/producto.html", "/catalogo.html"}) {
            assertPublic(mockMvc.perform(get(ruta)).andReturn(), "GET " + ruta);
        }
        assertPublic(mockMvc.perform(head("/css/ux-polish.css")).andReturn(), "HEAD /css/ux-polish.css");
    }

    @Test
    @DisplayName("Panel y API de administración siguen protegidos para anónimos")
    void adminSigueProtegido() throws Exception {
        mockMvc.perform(get("/js/admin.js")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/admin.html")).andExpect(status().is3xxRedirection());
        mockMvc.perform(get("/api/ordenes")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/ordenes/1/estado")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/cualquiera")).andExpect(status().isUnauthorized());
    }
}
