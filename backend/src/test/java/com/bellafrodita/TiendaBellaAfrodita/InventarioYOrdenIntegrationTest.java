package com.bellafrodita.TiendaBellaAfrodita;

import com.bellafrodita.TiendaBellaAfrodita.orden.dto.CheckoutItemRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.dto.CheckoutRequest;
import com.bellafrodita.TiendaBellaAfrodita.orden.dto.OrdenResponse;
import com.bellafrodita.TiendaBellaAfrodita.orden.exception.StockInsuficienteException;
import com.bellafrodita.TiendaBellaAfrodita.orden.service.OrdenService;
import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.model.ProductoVariante;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoVarianteRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@SpringBootTest
public class InventarioYOrdenIntegrationTest {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProductoVarianteRepository varianteRepository;

    @Autowired
    private OrdenService ordenService;

    @Test
    @DisplayName("Debe descontar stock de variante atómicamente al crear una orden")
    @Transactional
    public void testDescuentoAtomicoDeStock() {
        // Crear un producto de prueba con una variante de 10 unidades
        Producto producto = new Producto();
        producto.setNombre("Conjunto Test Stock");
        producto.setDescripcion("Prueba de inventario real");
        producto.setCategoria("conjuntos");
        producto.setPrecioMinorista(15000.0);
        producto.setPrecioMayorista(11000.0);
        producto.setStock(true);

        ProductoVariante variante = ProductoVariante.builder()
                .talle("90")
                .stock(10)
                .build();

        producto.addVariante(variante);
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

        // Verificar que el stock remanente sea 7
        ProductoVariante varianteActualizada = varianteRepository
                .findByProductoIdAndTalleIgnoreCase(prodId, "90")
                .orElseThrow();

        Assertions.assertEquals(7, varianteActualizada.getStock());
    }

    @Test
    @DisplayName("Debe lanzar StockInsuficienteException si la cantidad solicitada excede el stock disponible")
    @Transactional
    public void testStockInsuficienteLanzaExcepcion() {
        // Crear producto con variante de solo 2 unidades
        Producto producto = new Producto();
        producto.setNombre("Bombacha Test Stock Insuficiente");
        producto.setDescripcion("Prueba rechazo stock");
        producto.setCategoria("bombachas");
        producto.setPrecioMinorista(8000.0);
        producto.setStock(true);

        ProductoVariante variante = ProductoVariante.builder()
                .talle("1")
                .stock(2)
                .build();

        producto.addVariante(variante);
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

        // Asegurar que el stock se mantiene en 2 unidades intactas
        ProductoVariante varianteSinModificar = varianteRepository
                .findByProductoIdAndTalleIgnoreCase(prodId, "1")
                .orElseThrow();

        Assertions.assertEquals(2, varianteSinModificar.getStock());
    }
}
