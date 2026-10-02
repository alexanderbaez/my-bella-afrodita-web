package com.bellafrodita.TiendaBellaAfrodita.orden;

import com.bellafrodita.TiendaBellaAfrodita.orden.dto.CheckoutItemRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.dto.CheckoutRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.TipoEntrega;
import com.bellafrodita.TiendaBellaAfrodita.producto.dto.ProductoVarianteDto;
import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class OrdenSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductoRepository productoRepository;

    private Producto productoTest;

    @BeforeEach
    public void setup() {
        Producto prod = Producto.builder()
                .nombre("Conjunto Encaje Test Security")
                .descripcion("Para test de checkout sin autenticación")
                .categoria("conjuntos")
                .precioMinorista(new BigDecimal("15000.00"))
                .precioMayorista(new BigDecimal("12000.00"))
                .stock(true)
                .variantes(List.of(
                        ProductoVarianteDto.builder()
                                .talle("90")
                                .stock(10)
                                .build()
                ))
                .build();
        productoTest = productoRepository.save(prod);
    }

    @Test
    @DisplayName("1. POST /api/ordenes/checkout debe ser PÚBLICO y permitir compras anónimas sin 401")
    public void testCheckoutPublicoAnonimo() throws Exception {
        CheckoutRequest request = CheckoutRequest.builder()
                .clienteNombre("Cliente Anónimo Test")
                .clienteTelefono("2644112233")
                .clienteDireccion("Capital, San Juan - Dirección: Calle Mendoza 123, Entrecalles: Mitre y Santa Fe")
                .tipoEntrega(TipoEntrega.ENVIO_MOTO_SAN_JUAN)
                .costoEnvio(BigDecimal.ZERO)
                .items(List.of(
                        CheckoutItemRequest.builder()
                                .productoId(productoTest.getId())
                                .talle("90")
                                .cantidad(1)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/ordenes/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.codigoSeguimiento").isNotEmpty())
                .andExpect(jsonPath("$.whatsappUrl").isNotEmpty());
    }

    @Test
    @DisplayName("2. POST /api/ordenes debe ser PÚBLICO y permitir registrar compras sin 401")
    public void testCrearOrdenRutaRaizPublica() throws Exception {
        CheckoutRequest request = CheckoutRequest.builder()
                .clienteNombre("Cliente Raiz Test")
                .clienteTelefono("2644998877")
                .clienteDireccion("Rivadavia, San Juan")
                .tipoEntrega(TipoEntrega.ENVIO_MOTO_SAN_JUAN)
                .items(List.of(
                        CheckoutItemRequest.builder()
                                .productoId(productoTest.getId())
                                .talle("90")
                                .cantidad(1)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/ordenes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigoSeguimiento").isNotEmpty());
    }

    @Test
    @DisplayName("3. GET /api/ordenes (listado general) debe exigir autenticación ROLE_ADMIN y devolver 401 para anónimos")
    public void testListarOrdenesRequiereAutenticacionAdmin() throws Exception {
        mockMvc.perform(get("/api/ordenes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("4. PATCH /api/ordenes/{id}/estado debe exigir ROLE_ADMIN y rechazar anónimos con 401")
    public void testActualizarEstadoRequiereAdmin() throws Exception {
        mockMvc.perform(patch("/api/ordenes/1/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"ENTREGADA\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. GET /api/ordenes con ROLE_ADMIN debe permitir consultar el listado con 200 OK")
    @WithMockUser(username = "admin@bellafrodita.com", roles = {"ADMIN"})
    public void testListarOrdenesConRolAdminExitoso() throws Exception {
        mockMvc.perform(get("/api/ordenes"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("6. GET /api/ordenes/tracking/{codigo} debe ser PÚBLICO y permitir consultar tracking sin 401")
    public void testTrackingPublicoAnonimo() throws Exception {
        // Primero creamos una orden
        CheckoutRequest request = CheckoutRequest.builder()
                .clienteNombre("Tracking User")
                .clienteTelefono("2645000000")
                .tipoEntrega(TipoEntrega.ENVIO_MOTO_SAN_JUAN)
                .items(List.of(
                        CheckoutItemRequest.builder()
                                .productoId(productoTest.getId())
                                .talle("90")
                                .cantidad(1)
                                .build()
                ))
                .build();

        String responseJson = mockMvc.perform(post("/api/ordenes/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        com.bellafrodita.TiendaBellaAfrodita.orden.dto.OrdenResponse ordenCreada =
                objectMapper.readValue(responseJson, com.bellafrodita.TiendaBellaAfrodita.orden.dto.OrdenResponse.class);

        // Consultamos por tracking sin credenciales
        mockMvc.perform(get("/api/ordenes/tracking/" + ordenCreada.getCodigoSeguimiento()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoSeguimiento").value(ordenCreada.getCodigoSeguimiento()))
                .andExpect(jsonPath("$.clienteNombre").value("Tracking User"));
    }
}
