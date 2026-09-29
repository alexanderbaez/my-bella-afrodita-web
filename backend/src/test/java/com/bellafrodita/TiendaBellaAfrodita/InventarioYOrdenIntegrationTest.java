package com.bellafrodita.TiendaBellaAfrodita;

import com.bellafrodita.TiendaBellaAfrodita.orden.dto.CheckoutItemRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.dto.CheckoutRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.dto.OrdenResponse;
import com.bellafrodita.TiendaBellaAfrodita.orden.exception.StockInsuficienteException;
import com.bellafrodita.TiendaBellaAfrodita.orden.service.OrdenService;
import com.bellafrodita.TiendaBellaAfrodita.producto.dto.ProductoVarianteDto;
import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@SpringBootTest
public class InventarioYOrdenIntegrationTest {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private OrdenService ordenService;

    @Test
    @DisplayName("Debe descontar stock de variante atómicamente en la entidad Producto al crear una orden")
    @Transactional
    public void testDescuentoAtomicoDeStock() {
        // Crear un producto de prueba con una variante embebida de 10 unidades
        Producto producto = Producto.builder()
                .nombre("Conjunto Test Stock Aplanado")
                .descripcion("Prueba de inventario en JSON")
                .categoria("conjuntos")
                .precioMinorista(new BigDecimal("15000.00"))
                .precioMayorista(new BigDecimal("11000.00"))
                .stock(true)
                .imagenes(List.of("/images/test1.jpg"))
                .variantes(new ArrayList<>(List.of(
                        ProductoVarianteDto.builder()
                                .talle("90")
                                .stock(10)
                                .sku("TEST-90")
                                .build()
                )))
                .build();

        Producto guardado = productoRepository.save(producto);

        Long prodId = guardado.getId();
        Assertions.assertNotNull(prodId);
        Assertions.assertTrue(guardado.tieneStockGeneral());

        // Crear una orden comprando 3 unidades del talle 90
        CheckoutRequest request = CheckoutRequest.builder()
                .clienteNombre("Ana Compradora")
                .clienteTelefono("2641234567")
                .clienteDireccion("Calle Falsa 123")
                .items(List.of(
                        CheckoutItemRequest.builder()
                                .productoId(prodId)
                                .talle("90")
                                .cantidad(3)
                                .build()
                ))
                .build();

        OrdenResponse respuesta = ordenService.crearOrden(request);

        Assertions.assertNotNull(respuesta);
        Assertions.assertNotNull(respuesta.getId());
        Assertions.assertNotNull(respuesta.getCodigoSeguimiento());

        // Verificar que el stock remanente en la fila del producto sea 7
        Producto productoActualizado = productoRepository.findById(prodId).orElseThrow();

        ProductoVarianteDto varianteActualizada = productoActualizado.getVariantes().stream()
                .filter(v -> v.getTalle() != null && v.getTalle().equalsIgnoreCase("90"))
                .findFirst()
                .orElseThrow();

        Assertions.assertEquals(7, varianteActualizada.getStock());
        Assertions.assertEquals(7, productoActualizado.getStockTotal());
    }

    @Test
    @DisplayName("Debe lanzar StockInsuficienteException si la cantidad solicitada excede el stock disponible")
    @Transactional
    public void testStockInsuficienteLanzaExcepcion() {
        // Crear producto con variante de solo 2 unidades
        Producto producto = Producto.builder()
                .nombre("Bombacha Test Stock Insuficiente")
                .descripcion("Prueba rechazo stock")
                .categoria("bombachas")
                .precioMinorista(new BigDecimal("8000.00"))
                .stock(true)
                .variantes(new ArrayList<>(List.of(
                        ProductoVarianteDto.builder()
                                .talle("1")
                                .stock(2)
                                .sku("TEST-1")
                                .build()
                )))
                .build();

        Producto guardado = productoRepository.save(producto);

        Long prodId = guardado.getId();

        // Intentar comprar 5 unidades cuando solo hay 2
        CheckoutRequest request = CheckoutRequest.builder()
                .clienteNombre("Cliente Stock Insuficiente")
                .clienteTelefono("2649998888")
                .items(List.of(
                        CheckoutItemRequest.builder()
                                .productoId(prodId)
                                .talle("1")
                                .cantidad(5)
                                .build()
                ))
                .build();

        StockInsuficienteException ex = Assertions.assertThrows(StockInsuficienteException.class, () -> {
            ordenService.crearOrden(request);
        });

        Assertions.assertTrue(ex.getMessage().contains("Stock insuficiente"));

        // Asegurar que el stock se mantiene en 2 unidades intactas en la base de datos
        Producto productoSinModificar = productoRepository.findById(prodId).orElseThrow();
        ProductoVarianteDto varianteSinModificar = productoSinModificar.getVariantes().stream()
                .filter(v -> v.getTalle() != null && v.getTalle().equalsIgnoreCase("1"))
                .findFirst()
                .orElseThrow();

        Assertions.assertEquals(2, varianteSinModificar.getStock());
    }

    @Test
    @DisplayName("Debe calcular correctamente el costo logístico de envío y sumarlo al total de la orden")
    @Transactional
    public void testCalculoLogisticoYEntrega() {
        Producto producto = Producto.builder()
                .nombre("Conjunto Prueba Logística")
                .descripcion("Prueba de envío")
                .categoria("conjuntos")
                .precioMinorista(new BigDecimal("20000.00"))
                .stock(true)
                .variantes(new ArrayList<>(List.of(
                        ProductoVarianteDto.builder()
                                .talle("95")
                                .stock(5)
                                .sku("LOG-95")
                                .build()
                )))
                .build();

        Producto guardado = productoRepository.save(producto);

        // Envío a San Juan ($2.500)
        CheckoutRequest request = CheckoutRequest.builder()
                .clienteNombre("Lucía Sanjuanina")
                .clienteTelefono("2645551122")
                .clienteDireccion("Av. Libertador 450, San Juan")
                .tipoEntrega(com.bellafrodita.TiendaBellaAfrodita.orden.model.TipoEntrega.ENVIO_SAN_JUAN)
                .items(List.of(
                        CheckoutItemRequest.builder()
                                .productoId(guardado.getId())
                                .talle("95")
                                .cantidad(1)
                                .build()
                ))
                .build();

        OrdenResponse respuesta = ordenService.crearOrden(request);

        Assertions.assertNotNull(respuesta);
        Assertions.assertEquals(com.bellafrodita.TiendaBellaAfrodita.orden.model.TipoEntrega.ENVIO_SAN_JUAN, respuesta.getTipoEntrega());
        Assertions.assertEquals(new BigDecimal("2500.00"), respuesta.getCostoEnvio());
        Assertions.assertEquals(new BigDecimal("20000.00"), respuesta.getSubtotal());
        Assertions.assertEquals(new BigDecimal("22500.00"), respuesta.getTotal());
        Assertions.assertTrue(respuesta.getWhatsappUrl().contains("TOTAL"));
        Assertions.assertTrue(respuesta.getWhatsappUrl().contains("San+Juan"));
    }
}
