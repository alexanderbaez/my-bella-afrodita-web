package com.bellafrodita.TiendaBellaAfrodita.producto.controller;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductoViewControllerTest {

    private ProductoViewController controller;

    @BeforeEach
    void setUp() {
        controller = new ProductoViewController(null, null);
    }

    @Test
    void testEncodeUriPath_WithSpacesAndAccents() {
        String input = "/images/Less de Algodón en Talles Especiales1.png";
        String encoded = controller.encodeUriPath(input);
        assertEquals("/images/Less%20de%20Algod%C3%B3n%20en%20Talles%20Especiales1.png", encoded);
    }

    @Test
    void testEncodeUriPath_AbsoluteUrlPreservesHost() {
        String input = "https://bellaafrodita.baezpos.com/images/Less de Algodón en Talles Especiales1.png";
        String encoded = controller.encodeUriPath(input);
        assertEquals("https://bellaafrodita.baezpos.com/images/Less%20de%20Algod%C3%B3n%20en%20Talles%20Especiales1.png", encoded);
    }

    @Test
    void testEncodeUriPath_NoDoubleEncoding() {
        String input = "/images/Less%20de%20Algod%C3%B3n.png";
        String encoded = controller.encodeUriPath(input);
        assertEquals("/images/Less%20de%20Algod%C3%B3n.png", encoded);
    }

    @Test
    void testConstruirUrlAbsoluta_RelativePath() {
        String baseUrl = "https://bellaafrodita.baezpos.com";
        String input = "/images/Less de Algodón en Talles Especiales1.png";
        String result = controller.construirUrlAbsoluta(input, baseUrl);
        assertEquals("https://bellaafrodita.baezpos.com/images/Less%20de%20Algod%C3%B3n%20en%20Talles%20Especiales1.png", result);
    }

    @Test
    void testConstruirUrlAbsoluta_EmptyImageFallsBackToLogo() {
        String baseUrl = "https://bellaafrodita.baezpos.com";
        String result = controller.construirUrlAbsoluta(null, baseUrl);
        assertEquals("https://bellaafrodita.baezpos.com/images/LOGO.png", result);
    }

    @Test
    void testInyectarOpenGraph_AllImageTagsContainEncodedUrl() {
        String template = "<html><head><!-- METATAGS_PRODUCTO_START --><!-- METATAGS_PRODUCTO_END --></head><body></body></html>";
        Producto p = new Producto();
        p.setId(42L);
        p.setNombre("Conjunto Encaje & Satén");
        p.setDescripcion("Hermoso diseño con detalles");
        p.setPrecioMinorista(new BigDecimal("18500"));
        p.setImagenes(List.of("/images/Less de Algodón en Talles Especiales1.png"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("https");
        request.setServerName("bellaafrodita.baezpos.com");
        request.setServerPort(443);

        String result = controller.inyectarOpenGraph(template, p, 42L, request);

        String expectedEncodedUrl = "https://bellaafrodita.baezpos.com/images/Less%20de%20Algod%C3%B3n%20en%20Talles%20Especiales1.png";

        assertTrue(result.contains("<meta property=\"og:image\" content=\"" + expectedEncodedUrl + "\">"),
                "og:image must contain encoded URL");
        assertTrue(result.contains("<meta property=\"og:image:secure_url\" content=\"" + expectedEncodedUrl + "\">"),
                "og:image:secure_url must contain encoded URL");
        assertTrue(result.contains("<meta name=\"twitter:image\" content=\"" + expectedEncodedUrl + "\">"),
                "twitter:image must contain encoded URL");
    }
}
