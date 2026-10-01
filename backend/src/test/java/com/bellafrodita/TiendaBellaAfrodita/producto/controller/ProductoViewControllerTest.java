package com.bellafrodita.TiendaBellaAfrodita.producto.controller;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
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
        String input = "/thumbnails/Less de Algodón en Talles Especiales1.jpg";
        String encoded = controller.encodeUriPath(input);
        assertEquals("/thumbnails/Less%20de%20Algod%C3%B3n%20en%20Talles%20Especiales1.jpg", encoded);
    }

    @Test
    void testEncodeUriPath_AbsoluteUrlPreservesHost() {
        String input = "https://bellaafrodita.baezpos.com/thumbnails/Less de Algodón en Talles Especiales1.jpg";
        String encoded = controller.encodeUriPath(input);
        assertEquals("https://bellaafrodita.baezpos.com/thumbnails/Less%20de%20Algod%C3%B3n%20en%20Talles%20Especiales1.jpg", encoded);
    }

    @Test
    void testEncodeUriPath_NoDoubleEncoding() {
        String input = "/thumbnails/Less%20de%20Algod%C3%B3n.jpg";
        String encoded = controller.encodeUriPath(input);
        assertEquals("/thumbnails/Less%20de%20Algod%C3%B3n.jpg", encoded);
    }

    @Test
    void testObtenerNombreArchivoThumbnail() {
        assertEquals("Less de Algodón en Talles Especiales1.jpg",
                controller.obtenerNombreArchivoThumbnail("/images/Less de Algodón en Talles Especiales1.png"));
        assertEquals("session-Conjuntos.jpg",
                controller.obtenerNombreArchivoThumbnail("https://bellaafrodita.baezpos.com/images/session-Conjuntos.jpg"));
        assertEquals("LOGO.jpg",
                controller.obtenerNombreArchivoThumbnail(null));
    }

    @Test
    void testConstruirUrlAbsoluta_EmptyImageFallsBackToLogo() {
        String baseUrl = "https://bellaafrodita.baezpos.com";
        String result = controller.construirUrlAbsoluta(null, baseUrl);
        assertEquals("https://bellaafrodita.baezpos.com/images/LOGO.png", result);
    }

    @Test
    void testInyectarOpenGraph_AllImageTagsContainThumbnailAndJpegType() {
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

        String expectedThumbnailUrl = "https://bellaafrodita.baezpos.com/thumbnails/Less%20de%20Algod%C3%B3n%20en%20Talles%20Especiales1.jpg";

        assertTrue(result.contains("<meta property=\"og:image\" content=\"" + expectedThumbnailUrl + "\">"),
                "og:image must contain encoded thumbnail URL");
        assertTrue(result.contains("<meta property=\"og:image:secure_url\" content=\"" + expectedThumbnailUrl + "\">"),
                "og:image:secure_url must contain encoded thumbnail URL");
        assertTrue(result.contains("<meta property=\"og:image:type\" content=\"image/jpeg\">"),
                "og:image:type must be image/jpeg");
        assertTrue(result.contains("<meta name=\"twitter:image\" content=\"" + expectedThumbnailUrl + "\">"),
                "twitter:image must contain encoded thumbnail URL");
    }

    @Test
    void testGenerarThumbnailEnDisco_CompressAndScale(@TempDir Path tempDir) throws Exception {
        // 1. Crear imagen original grande (1200x900)
        BufferedImage bigImage = new BufferedImage(1200, 900, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = bigImage.createGraphics();
        g.setColor(Color.PINK);
        g.fillRect(0, 0, 1200, 900);
        g.setColor(Color.BLACK);
        g.drawString("Test High Res", 100, 100);
        g.dispose();

        File sourceFile = tempDir.resolve("original_test.png").toFile();
        ImageIO.write(bigImage, "png", sourceFile);
        bigImage.flush();

        // 2. Ejecutar generación de thumbnail
        Path targetThumb = tempDir.resolve("original_test.jpg");
        boolean ok = controller.generarThumbnailEnDisco(sourceFile.getAbsolutePath(), targetThumb);

        assertTrue(ok, "Thumbnail generation should return true");
        assertTrue(Files.exists(targetThumb), "Thumbnail file must exist on disk");

        long sizeBytes = Files.size(targetThumb);
        assertTrue(sizeBytes > 0 && sizeBytes < 150 * 1024,
                "Thumbnail size (" + sizeBytes + " bytes) must be less than 150 KB for WhatsApp");

        BufferedImage thumbImage = ImageIO.read(targetThumb.toFile());
        assertTrue(thumbImage.getWidth() <= 800, "Width must be <= 800px");
        assertTrue(thumbImage.getHeight() <= 800, "Height must be <= 800px");
        assertEquals(800, thumbImage.getWidth(), "Width should be scaled to exactly 800px");
        assertEquals(600, thumbImage.getHeight(), "Height should maintain aspect ratio 4:3 (600px)");
        thumbImage.flush();
    }
}
