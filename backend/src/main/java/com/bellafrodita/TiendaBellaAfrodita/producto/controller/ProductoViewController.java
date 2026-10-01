package com.bellafrodita.TiendaBellaAfrodita.producto.controller;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.plugins.jpeg.JPEGImageWriteParam;
import javax.imageio.stream.ImageOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Controlador de vistas para Social Previews de Productos (Open Graph / Twitter Cards).
 * Atiende peticiones a /producto.html y /producto/{id} para inyectar dinámicamente metatags
 * para bots crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn) sin sobrecarga de memoria.
 * Incluye generador bajo demanda y cache en disco de thumbnails ligeros (< 150 KB, JPEG 85%, max 800px).
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ProductoViewController {

    private static final String START_TAG = "<!-- METATAGS_PRODUCTO_START -->";
    private static final String END_TAG = "<!-- METATAGS_PRODUCTO_END -->";

    private final ProductoRepository productoRepository;
    private final ResourceLoader resourceLoader;

    @Value("${app.base-url:https://bellaafrodita.baezpos.com}")
    private String configuredBaseUrl = "https://bellaafrodita.baezpos.com";

    @Value("${file.images-dir:src/main/resources/static/images}")
    private String imagesDir = "src/main/resources/static/images";

    @Value("${file.upload-dir:uploads}")
    private String uploadDir = "uploads";

    @Value("${file.thumbnails-dir:thumbnails}")
    private String thumbnailsDir = "thumbnails";

    private String cachedHtmlTemplate;

    @PostConstruct
    public void initTemplate() {
        System.setProperty("java.awt.headless", "true");
        try {
            if (resourceLoader != null) {
                Resource resource = resourceLoader.getResource("classpath:/static/producto.html");
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        this.cachedHtmlTemplate = StreamUtils.copyToString(is, StandardCharsets.UTF_8);
                        log.info("[SOCIAL-PREVIEW] Template producto.html precargado en memoria ({} bytes)", cachedHtmlTemplate.length());
                    }
                } else {
                    log.warn("[SOCIAL-PREVIEW] No se encontro producto.html en classpath:/static/");
                }
            }
        } catch (IOException e) {
            log.error("[SOCIAL-PREVIEW] Error cargando producto.html para OpenGraph:", e);
        }
    }

    @GetMapping(value = {"/producto.html", "/producto"}, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> verProducto(
            @RequestParam(name = "id", required = false) Long id,
            HttpServletRequest request) {
        return renderizarFichaConOpenGraph(id, request);
    }

    @GetMapping(value = "/producto/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> verProductoPermalink(
            @PathVariable("id") Long id,
            HttpServletRequest request) {
        return renderizarFichaConOpenGraph(id, request);
    }

    /**
     * Sirve los thumbnails generados en disco o los genera bajo demanda si la URL es accedida directamente.
     */
    @GetMapping(value = "/thumbnails/{filename:.+}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<Resource> servirThumbnail(@PathVariable("filename") String filename) {
        Path thumbDir = getThumbnailsDirectory();
        Path thumbFile = thumbDir.resolve(filename).normalize();

        // Protección contra Directory Traversal
        if (!thumbFile.startsWith(thumbDir)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (Files.exists(thumbFile) && Files.isRegularFile(thumbFile)) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=604800, immutable")
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(new FileSystemResource(thumbFile));
        }

        // Si no existe, intentar generarlo buscando la imagen original con extensiones comunes
        String baseName = filename.replaceFirst("(?i)\\.jpg$", "");
        String[] possibleExtensions = {".png", ".jpg", ".jpeg", ".webp"};
        for (String ext : possibleExtensions) {
            String candidate = "/images/" + baseName + ext;
            if (generarThumbnailEnDisco(candidate, thumbFile) && Files.exists(thumbFile)) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=604800, immutable")
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(new FileSystemResource(thumbFile));
            }
        }

        // Fallback a logo por defecto si no se pudo generar
        if (resourceLoader != null) {
            Resource defaultLogo = resourceLoader.getResource("classpath:/static/images/LOGO.png");
            if (defaultLogo.exists()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                        .contentType(MediaType.IMAGE_PNG)
                        .body(defaultLogo);
            }
        }

        return ResponseEntity.notFound().build();
    }

    private ResponseEntity<String> renderizarFichaConOpenGraph(Long id, HttpServletRequest request) {
        String template = getTemplate();
        if (template == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("<h1>Error cargando plantilla de producto</h1>");
        }

        if (id == null) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "text/html; charset=UTF-8")
                    .body(template);
        }

        Optional<Producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "text/html; charset=UTF-8")
                    .body(template);
        }

        Producto p = productoOpt.get();
        String htmlEnriquecido = inyectarOpenGraph(template, p, id, request);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/html; charset=UTF-8")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=60")
                .body(htmlEnriquecido);
    }

    String inyectarOpenGraph(String template, Producto p, Long id, HttpServletRequest request) {
        int startIdx = template.indexOf(START_TAG);
        int endIdx = template.indexOf(END_TAG);

        if (startIdx == -1 || endIdx == -1) {
            return template;
        }

        String baseUrl = resolveBaseUrl(request);
        String canonicalUrl = baseUrl + "/producto.html?id=" + id;

        String nombre = p.getNombre() != null ? p.getNombre().trim() : "Prenda Exclusiva";
        String rawDesc = p.getDescripcion() != null ? p.getDescripcion().trim() : "";
        String cleanDesc = rawDesc.replaceAll("<[^>]*>", "").replaceAll("\\s+", " ").trim();
        if (cleanDesc.length() > 140) {
            cleanDesc = cleanDesc.substring(0, 137) + "...";
        }
        if (cleanDesc.isBlank()) {
            cleanDesc = "Lencería boutique de alta costura en San Juan. Encajes importados, satén y calce refinado.";
        }

        BigDecimal precio = p.getPrecioMinorista() != null ? p.getPrecioMinorista() : BigDecimal.ZERO;
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("es", "AR"));
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        DecimalFormat df = new DecimalFormat("#,##0", symbols);
        String precioFormateado = df.format(precio);

        String descFinal = cleanDesc + " - $" + precioFormateado;

        // Thumbnail optimizado para WhatsApp / Facebook / Twitter (< 150 KB, max 800px, JPEG)
        List<String> imagenes = p.getImagenes();
        String fotoPrincipal = (imagenes != null && !imagenes.isEmpty()) ? imagenes.get(0) : null;
        String absoluteThumbnailUrl = resolverOGenerarThumbnail(fotoPrincipal, baseUrl);

        // Escape seguro para atributos HTML
        String escNombre = escapeAttr(nombre);
        String escDesc = escapeAttr(descFinal);
        String escTitle = escNombre + " | Mi Bella Afrodita";

        StringBuilder ogTags = new StringBuilder(1024);
        ogTags.append("<title>").append(escTitle).append("</title>\n");
        ogTags.append("    <meta name=\"description\" content=\"").append(escDesc).append("\">\n\n");
        ogTags.append("    <!-- Open Graph Canónico para WhatsApp / Facebook / Twitter -->\n");
        ogTags.append("    <meta property=\"og:site_name\" content=\"Mi Bella Afrodita\">\n");
        ogTags.append("    <meta property=\"og:type\" content=\"product\">\n");
        ogTags.append("    <meta property=\"og:title\" content=\"").append(escTitle).append("\">\n");
        ogTags.append("    <meta property=\"og:description\" content=\"").append(escDesc).append("\">\n");
        ogTags.append("    <meta property=\"og:image\" content=\"").append(absoluteThumbnailUrl).append("\">\n");
        ogTags.append("    <meta property=\"og:image:secure_url\" content=\"").append(absoluteThumbnailUrl).append("\">\n");
        ogTags.append("    <meta property=\"og:image:type\" content=\"image/jpeg\">\n");
        ogTags.append("    <meta property=\"og:image:width\" content=\"800\">\n");
        ogTags.append("    <meta property=\"og:image:alt\" content=\"").append(escNombre).append("\">\n");
        ogTags.append("    <meta property=\"og:url\" content=\"").append(canonicalUrl).append("\">\n");
        ogTags.append("    <meta property=\"product:price:amount\" content=\"").append(precio.toPlainString()).append("\">\n");
        ogTags.append("    <meta property=\"product:price:currency\" content=\"ARS\">\n\n");
        ogTags.append("    <!-- Twitter Cards -->\n");
        ogTags.append("    <meta name=\"twitter:card\" content=\"summary_large_image\">\n");
        ogTags.append("    <meta name=\"twitter:title\" content=\"").append(escNombre).append("\">\n");
        ogTags.append("    <meta name=\"twitter:description\" content=\"").append(escDesc).append("\">\n");
        ogTags.append("    <meta name=\"twitter:image\" content=\"").append(absoluteThumbnailUrl).append("\">");

        String before = template.substring(0, startIdx);
        String after = template.substring(endIdx + END_TAG.length());

        return before + START_TAG + "\n    " + ogTags.toString() + "\n    " + END_TAG + after;
    }

    /**
     * Resuelve o genera bajo demanda el thumbnail optimizado para WhatsApp.
     * Retorna la URL absoluta lista con RFC 3986 encoding.
     */
    public String resolverOGenerarThumbnail(String originalImagePath, String baseUrl) {
        if (originalImagePath == null || originalImagePath.isBlank()) {
            originalImagePath = "/images/LOGO.png";
        }

        String thumbFileName = obtenerNombreArchivoThumbnail(originalImagePath);
        Path thumbDir = getThumbnailsDirectory();
        Path thumbFile = thumbDir.resolve(thumbFileName);

        // a) Verificar si ya existe en disco
        if (Files.exists(thumbFile)) {
            try {
                if (Files.size(thumbFile) > 0) {
                    return construirUrlAbsoluta("/thumbnails/" + thumbFileName, baseUrl);
                }
            } catch (IOException ignored) {}
        }

        // b) Generar bajo demanda (reescalado proporcional max 800px, JPEG 85%, < 150 KB)
        try {
            boolean generado = generarThumbnailEnDisco(originalImagePath, thumbFile);
            if (generado && Files.exists(thumbFile) && Files.size(thumbFile) > 0) {
                log.info("[SOCIAL-PREVIEW] Thumbnail generado en disco: {} ({} bytes)",
                        thumbFileName, Files.size(thumbFile));
                return construirUrlAbsoluta("/thumbnails/" + thumbFileName, baseUrl);
            }
        } catch (Exception e) {
            log.warn("[SOCIAL-PREVIEW] Error generando thumbnail para {}: {}", originalImagePath, e.getMessage());
        }

        // Fallback: Si no se pudo generar, utiliza la URL original con encoding
        return construirUrlAbsoluta(originalImagePath, baseUrl);
    }

    /**
     * Lee la imagen original, la reescala proporcionalmente a un máximo de 800px
     * y la comprime a JPEG con calidad 85% liberando los DataBuffers de inmediato.
     */
    public boolean generarThumbnailEnDisco(String originalImagePath, Path targetFile) {
        try (InputStream is = abrirStreamImagenOriginal(originalImagePath)) {
            if (is == null) {
                log.warn("[SOCIAL-PREVIEW] Imagen original no encontrada: {}", originalImagePath);
                return false;
            }

            BufferedImage original = ImageIO.read(is);
            if (original == null) {
                log.warn("[SOCIAL-PREVIEW] ImageIO no pudo decodificar la imagen: {}", originalImagePath);
                return false;
            }

            int origWidth = original.getWidth();
            int origHeight = original.getHeight();
            int maxDim = 800;
            int targetWidth = origWidth;
            int targetHeight = origHeight;

            if (origWidth > maxDim || origHeight > maxDim) {
                if (origWidth >= origHeight) {
                    targetWidth = maxDim;
                    targetHeight = Math.max(1, (int) Math.round((double) origHeight * maxDim / origWidth));
                } else {
                    targetHeight = maxDim;
                    targetWidth = Math.max(1, (int) Math.round((double) origWidth * maxDim / origHeight));
                }
            }

            // TYPE_INT_RGB para compatibilidad limpia con JPEG
            BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = resized.createGraphics();
            try {
                // Fondo blanco por si la imagen original contiene transparencias (PNG)
                g2d.setColor(Color.WHITE);
                g2d.fillRect(0, 0, targetWidth, targetHeight);
                g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2d.drawImage(original, 0, 0, targetWidth, targetHeight, null);
            } finally {
                g2d.dispose();
                original.flush(); // Liberar búfer original de inmediato
            }

            // Escribir a archivo temporal y mover atómicamente
            Files.createDirectories(targetFile.getParent());
            Path tempFile = Files.createTempFile(targetFile.getParent(), "thumb_", ".tmp");
            try {
                Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
                if (!writers.hasNext()) {
                    throw new IllegalStateException("No se encontro ImageWriter para formato JPEG");
                }
                ImageWriter writer = writers.next();
                try (ImageOutputStream ios = ImageIO.createImageOutputStream(tempFile.toFile())) {
                    writer.setOutput(ios);
                    JPEGImageWriteParam param = (JPEGImageWriteParam) writer.getDefaultWriteParam();
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(0.85f); // 85% de calidad: excelente nitidez y < 150 KB
                    writer.write(null, new IIOImage(resized, null, null), param);
                } finally {
                    writer.dispose();
                }
                Files.move(tempFile, targetFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                return true;
            } finally {
                Files.deleteIfExists(tempFile);
                resized.flush(); // Liberar búfer reescalado de inmediato
            }
        } catch (Exception e) {
            log.warn("[SOCIAL-PREVIEW] Excepción durante compresión de thumbnail {}: {}", targetFile.getFileName(), e.getMessage());
            return false;
        }
    }

    /**
     * Abre un InputStream para la imagen original buscando en sistema de archivos,
     * uploads, classpath o URL externa.
     */
    private InputStream abrirStreamImagenOriginal(String imagePath) throws IOException {
        if (imagePath == null || imagePath.isBlank()) {
            if (resourceLoader != null) {
                Resource defaultLogo = resourceLoader.getResource("classpath:/static/images/LOGO.png");
                if (defaultLogo.exists()) {
                    return defaultLogo.getInputStream();
                }
            }
            return null;
        }

        String path = imagePath.trim();

        // 1. Si es URL absoluta externa http:// o https://
        if (path.startsWith("http://") || path.startsWith("https://")) {
            if (path.contains("/images/")) {
                path = path.substring(path.indexOf("/images/"));
            } else if (path.contains("/uploads/")) {
                path = path.substring(path.indexOf("/uploads/"));
            } else {
                try {
                    URI uri = URI.create(path);
                    URLConnection conn = uri.toURL().openConnection();
                    conn.setConnectTimeout(3000);
                    conn.setReadTimeout(3000);
                    return conn.getInputStream();
                } catch (Exception e) {
                    log.warn("[SOCIAL-PREVIEW] No se pudo descargar imagen remota {}: {}", path, e.getMessage());
                    return null;
                }
            }
        }

        // 2. Si es /images/... o images/...
        if (path.startsWith("/images/") || path.startsWith("images/")) {
            String rel = path.replaceFirst("^/?images/", "");
            if (imagesDir != null && !imagesDir.isBlank()) {
                Path localFile = Paths.get(imagesDir, rel);
                if (Files.exists(localFile) && Files.isRegularFile(localFile)) {
                    return Files.newInputStream(localFile);
                }
            }
            if (resourceLoader != null) {
                Resource resource = resourceLoader.getResource("classpath:/static/images/" + rel);
                if (resource.exists()) {
                    return resource.getInputStream();
                }
            }
        }

        // 3. Si es /uploads/... o uploads/...
        if (path.startsWith("/uploads/") || path.startsWith("uploads/")) {
            String rel = path.replaceFirst("^/?uploads/", "");
            if (uploadDir != null && !uploadDir.isBlank()) {
                Path localFile = Paths.get(uploadDir, rel);
                if (Files.exists(localFile) && Files.isRegularFile(localFile)) {
                    return Files.newInputStream(localFile);
                }
            }
        }

        // 4. Intentar resolver directamente como archivo local si existe
        try {
            Path directPath = Paths.get(path);
            if (Files.exists(directPath) && Files.isRegularFile(directPath)) {
                return Files.newInputStream(directPath);
            }
        } catch (Exception ignored) {}

        // Fallback a logo si existe en classpath
        if (resourceLoader != null) {
            Resource fallback = resourceLoader.getResource("classpath:/static/images/LOGO.png");
            if (fallback.exists()) {
                return fallback.getInputStream();
            }
        }

        return null;
    }

    /**
     * Deriva el nombre del thumbnail a formato {nombre-limpio}.jpg evitando colisiones o caracteres ilegales.
     */
    public String obtenerNombreArchivoThumbnail(String imagePath) {
        if (imagePath == null || imagePath.isBlank()) {
            return "LOGO.jpg";
        }
        int qIdx = imagePath.indexOf('?');
        String clean = (qIdx != -1) ? imagePath.substring(0, qIdx) : imagePath;
        clean = clean.trim();

        int lastSlash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
        String fileName = (lastSlash != -1) ? clean.substring(lastSlash + 1) : clean;
        fileName = fileName.trim();

        if (fileName.isBlank()) {
            return "thumbnail.jpg";
        }

        int lastDot = fileName.lastIndexOf('.');
        String baseName = (lastDot > 0) ? fileName.substring(0, lastDot) : fileName;
        baseName = baseName.replace("..", "").replaceAll("[/\\\\]", "_").trim();
        if (baseName.isBlank()) {
            baseName = "thumbnail";
        }

        return baseName + ".jpg";
    }

    public Path getThumbnailsDirectory() {
        Path path = (thumbnailsDir != null && !thumbnailsDir.isBlank())
                ? Paths.get(thumbnailsDir).toAbsolutePath().normalize()
                : Paths.get("thumbnails").toAbsolutePath().normalize();
        try {
            Files.createDirectories(path);
        } catch (IOException e) {
            log.error("[SOCIAL-PREVIEW] No se pudo crear directorio de thumbnails: {}", path, e);
        }
        return path;
    }

    public String construirUrlAbsoluta(String foto, String baseUrl) {
        if (foto == null || foto.isBlank()) {
            return baseUrl + "/images/LOGO.png";
        }
        String trimmed = foto.trim();
        String encodedPath = encodeUriPath(trimmed);
        if (encodedPath.startsWith("http://") || encodedPath.startsWith("https://")) {
            return encodedPath;
        }
        if (encodedPath.startsWith("/")) {
            return baseUrl + encodedPath;
        }
        return baseUrl + "/" + encodedPath;
    }

    /**
     * Codifica los segmentos de ruta de la imagen según RFC 3986 (espacios a %20, eñes y tildes a %XX)
     * preservando el esquema (http/https) y las barras de separación sin generar doble encoding (%2520).
     */
    public String encodeUriPath(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        if (path.startsWith("http://") || path.startsWith("https://")) {
            try {
                int schemeEnd = path.indexOf("://");
                int pathStart = path.indexOf('/', schemeEnd + 3);
                if (pathStart == -1) {
                    return path;
                }
                String origin = path.substring(0, pathStart);
                String pathAndQuery = path.substring(pathStart);
                return origin + encodePathSegments(pathAndQuery);
            } catch (Exception e) {
                log.warn("[SOCIAL-PREVIEW] Error codificando URL absoluta {}: {}", path, e.getMessage());
                return path;
            }
        }
        return encodePathSegments(path);
    }

    public String encodePathSegments(String path) {
        if (path == null) return "";
        String query = "";
        int queryIdx = path.indexOf('?');
        if (queryIdx != -1) {
            query = path.substring(queryIdx);
            path = path.substring(0, queryIdx);
        }

        boolean startsWithSlash = path.startsWith("/");
        String[] segments = path.split("/");
        StringBuilder sb = new StringBuilder();
        if (startsWithSlash) {
            sb.append("/");
        }
        boolean first = true;
        for (String segment : segments) {
            if (segment.isEmpty()) continue;
            if (!first) {
                sb.append("/");
            }
            try {
                String decoded = URLDecoder.decode(segment, StandardCharsets.UTF_8);
                String encoded = URLEncoder.encode(decoded, StandardCharsets.UTF_8).replace("+", "%20");
                sb.append(encoded);
            } catch (Exception e) {
                sb.append(URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"));
            }
            first = false;
        }
        return sb.toString() + query;
    }

    private String resolveBaseUrl(HttpServletRequest request) {
        if (configuredBaseUrl != null && !configuredBaseUrl.isBlank() && !configuredBaseUrl.contains("localhost")) {
            return configuredBaseUrl.replaceAll("/+$", "");
        }
        String proto = request.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) {
            proto = request.getScheme();
        }
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getHeader("Host");
        }
        if (host != null && !host.isBlank()) {
            return proto + "://" + host;
        }
        return "https://bellaafrodita.baezpos.com";
    }

    private String escapeAttr(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private String getTemplate() {
        if (cachedHtmlTemplate != null) {
            return cachedHtmlTemplate;
        }
        initTemplate();
        return cachedHtmlTemplate;
    }
}
