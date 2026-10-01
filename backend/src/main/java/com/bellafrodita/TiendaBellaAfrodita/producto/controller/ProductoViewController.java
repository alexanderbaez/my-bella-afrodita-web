package com.bellafrodita.TiendaBellaAfrodita.producto.controller;

import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Controlador de vistas para Social Previews de Productos (Open Graph / Twitter Cards).
 * Atiende peticiones a /producto.html y /producto/{id} para inyectar dinámicamente metatags
 * para bots crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn) sin sobrecarga de memoria.
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
    private String configuredBaseUrl;

    private String cachedHtmlTemplate;

    @PostConstruct
    public void initTemplate() {
        try {
            Resource resource = resourceLoader.getResource("classpath:/static/producto.html");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    this.cachedHtmlTemplate = StreamUtils.copyToString(is, StandardCharsets.UTF_8);
                    log.info("[SOCIAL-PREVIEW] Template producto.html precargado en memoria ({} bytes)", cachedHtmlTemplate.length());
                }
            } else {
                log.warn("[SOCIAL-PREVIEW] No se encontro producto.html en classpath:/static/");
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

        // Imagen principal absoluta para WhatsApp
        List<String> imagenes = p.getImagenes();
        String fotoPrincipal = (imagenes != null && !imagenes.isEmpty()) ? imagenes.get(0) : null;
        String absoluteImageUrl = construirUrlAbsoluta(fotoPrincipal, baseUrl);
        String imageType = detectarTipoImagen(absoluteImageUrl);

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
        ogTags.append("    <meta property=\"og:image\" content=\"").append(absoluteImageUrl).append("\">\n");
        ogTags.append("    <meta property=\"og:image:secure_url\" content=\"").append(absoluteImageUrl).append("\">\n");
        ogTags.append("    <meta property=\"og:image:type\" content=\"").append(imageType).append("\">\n");
        ogTags.append("    <meta property=\"og:image:alt\" content=\"").append(escNombre).append("\">\n");
        ogTags.append("    <meta property=\"og:url\" content=\"").append(canonicalUrl).append("\">\n");
        ogTags.append("    <meta property=\"product:price:amount\" content=\"").append(precio.toPlainString()).append("\">\n");
        ogTags.append("    <meta property=\"product:price:currency\" content=\"ARS\">\n\n");
        ogTags.append("    <!-- Twitter Cards -->\n");
        ogTags.append("    <meta name=\"twitter:card\" content=\"summary_large_image\">\n");
        ogTags.append("    <meta name=\"twitter:title\" content=\"").append(escNombre).append("\">\n");
        ogTags.append("    <meta name=\"twitter:description\" content=\"").append(escDesc).append("\">\n");
        ogTags.append("    <meta name=\"twitter:image\" content=\"").append(absoluteImageUrl).append("\">");

        String before = template.substring(0, startIdx);
        String after = template.substring(endIdx + END_TAG.length());

        return before + START_TAG + "\n    " + ogTags.toString() + "\n    " + END_TAG + after;
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
                // Decodificar previamente para evitar doble encoding (%2520) si ya contenía partes codificadas
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

    private String detectarTipoImagen(String url) {
        String lower = url.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return "image/jpeg";
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
