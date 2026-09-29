package com.bellafrodita.TiendaBellaAfrodita.orden.service;

import com.bellafrodita.TiendaBellaAfrodita.orden.dto.*;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.EstadoOrden;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.MetodoPago;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.Orden;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.OrdenItem;
import com.bellafrodita.TiendaBellaAfrodita.orden.repository.OrdenRepository;
import com.bellafrodita.TiendaBellaAfrodita.producto.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.ProductoRepository;
import com.bellafrodita.TiendaBellaAfrodita.producto.ProductoVariante;
import com.bellafrodita.TiendaBellaAfrodita.producto.ProductoVarianteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrdenService {

    private static final String WHATSAPP_PHONE = "5492646121771";

    private final OrdenRepository ordenRepository;
    private final ProductoRepository productoRepository;
    private final ProductoVarianteRepository productoVarianteRepository;

    public OrdenService(OrdenRepository ordenRepository,
                        ProductoRepository productoRepository,
                        ProductoVarianteRepository productoVarianteRepository) {
        this.ordenRepository = ordenRepository;
        this.productoRepository = productoRepository;
        this.productoVarianteRepository = productoVarianteRepository;
    }

    @Transactional
    public OrdenResponse crearOrden(CheckoutRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("El carrito no contiene productos.");
        }

        // 1. Contar total de unidades para determinar precio mayorista (>= 3 prendas)
        int totalUnidades = request.getItems().stream()
                .mapToInt(item -> item.getCantidad() != null && item.getCantidad() > 0 ? item.getCantidad() : 1)
                .sum();

        boolean esMayorista = totalUnidades >= 3;

        // 2. Generar código de seguimiento único
        String timestampPart = String.valueOf(System.currentTimeMillis()).substring(7);
        String randomPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String codigoSeguimiento = "BA-" + timestampPart + "-" + randomPart;

        Orden orden = Orden.builder()
                .codigoSeguimiento(codigoSeguimiento)
                .clienteNombre(request.getClienteNombre().trim())
                .clienteTelefono(request.getClienteTelefono().trim())
                .clienteDireccion(request.getClienteDireccion() != null ? request.getClienteDireccion().trim() : null)
                .metodoPago(request.getMetodoPago() != null ? request.getMetodoPago() : MetodoPago.WHATSAPP_EFECTIVO)
                .estado(EstadoOrden.PENDIENTE)
                .esMayorista(esMayorista)
                .items(new ArrayList<>())
                .build();

        BigDecimal subtotalCalculado = BigDecimal.ZERO;
        BigDecimal totalCalculado = BigDecimal.ZERO;

        for (CheckoutItemRequest itemReq : request.getItems()) {
            int cantidad = itemReq.getCantidad() != null && itemReq.getCantidad() > 0 ? itemReq.getCantidad() : 1;

            // Consultar producto real en BD para evitar manipulación de precios
            Producto producto = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + itemReq.getProductoId()));

            String talleSolicitado = itemReq.getTalle() != null && !itemReq.getTalle().isBlank()
                    ? itemReq.getTalle().trim()
                    : "Único";

            // Validar stock físico disponible por variante
            ProductoVariante variante = productoVarianteRepository
                    .findByProductoIdAndTalleIgnoreCase(producto.getId(), talleSolicitado)
                    .orElse(null);

            if (variante == null && producto.getVariantes() != null && !producto.getVariantes().isEmpty()) {
                variante = producto.getVariantes().stream()
                        .filter(v -> v.getTalle() != null && v.getTalle().equalsIgnoreCase(talleSolicitado))
                        .findFirst()
                        .orElse(producto.getVariantes().get(0));
            }

            if (variante != null) {
                if (variante.getStock() < cantidad) {
                    throw new com.bellafrodita.TiendaBellaAfrodita.orden.exception.StockInsuficienteException(
                            "Stock insuficiente para el producto '" + producto.getNombre() +
                            "' en talle '" + talleSolicitado + "'. Disponibles: " + variante.getStock() +
                            ", solicitados: " + cantidad + "."
                    );
                }

                // Descuento atómico de stock
                variante.setStock(variante.getStock() - cantidad);
                productoVarianteRepository.save(variante);

                // Actualizar bandera de stock del producto
                producto.setStock(producto.tieneStockGeneral());
                productoRepository.save(producto);
            }

            BigDecimal precioMinorista = BigDecimal.valueOf(producto.getPrecioMinorista() != null ? producto.getPrecioMinorista() : 0.0);
            BigDecimal precioMayorista = producto.getPrecioMayorista() != null && producto.getPrecioMayorista() > 0
                    ? BigDecimal.valueOf(producto.getPrecioMayorista())
                    : null;

            BigDecimal precioAplicado = (esMayorista && precioMayorista != null) ? precioMayorista : precioMinorista;

            BigDecimal itemSubtotalBase = precioMinorista.multiply(BigDecimal.valueOf(cantidad));
            BigDecimal itemSubtotalFinal = precioAplicado.multiply(BigDecimal.valueOf(cantidad));

            subtotalCalculado = subtotalCalculado.add(itemSubtotalBase);
            totalCalculado = totalCalculado.add(itemSubtotalFinal);

            OrdenItem ordenItem = OrdenItem.builder()
                    .productoId(producto.getId())
                    .productoNombre(producto.getNombre())
                    .talle(talleSolicitado)
                    .cantidad(cantidad)
                    .precioUnitario(precioAplicado.setScale(2, RoundingMode.HALF_UP))
                    .subtotal(itemSubtotalFinal.setScale(2, RoundingMode.HALF_UP))
                    .build();

            orden.addItem(ordenItem);
        }

        BigDecimal descuentoMayorista = subtotalCalculado.subtract(totalCalculado);
        if (descuentoMayorista.compareTo(BigDecimal.ZERO) < 0) {
            descuentoMayorista = BigDecimal.ZERO;
        }

        orden.setSubtotal(subtotalCalculado.setScale(2, RoundingMode.HALF_UP));
        orden.setTotal(totalCalculado.setScale(2, RoundingMode.HALF_UP));
        orden.setDescuentoMayorista(descuentoMayorista.setScale(2, RoundingMode.HALF_UP));

        Orden ordenGuardada = ordenRepository.save(orden);

        // 3. Generar enlace codificado de WhatsApp
        String whatsappUrl = generarEnlaceWhatsApp(ordenGuardada);

        return mapearAResponse(ordenGuardada, whatsappUrl);
    }

    @Transactional
    public OrdenResponse actualizarEstado(Long ordenId, EstadoOrden nuevoEstado) {
        Orden orden = ordenRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada con ID: " + ordenId));

        orden.setEstado(nuevoEstado);
        Orden actualizada = ordenRepository.save(orden);
        return mapearAResponse(actualizada, null);
    }

    @Transactional(readOnly = true)
    public List<OrdenResponse> listarOrdenes() {
        return ordenRepository.findAllByOrderByFechaCreacionDesc()
                .stream()
                .map(o -> mapearAResponse(o, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrdenResponse obtenerPorId(Long ordenId) {
        Orden orden = ordenRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada con ID: " + ordenId));
        return mapearAResponse(orden, generarEnlaceWhatsApp(orden));
    }

    private String generarEnlaceWhatsApp(Orden orden) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("es", "AR"));
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        DecimalFormat df = new DecimalFormat("#,##0", symbols);

        StringBuilder sb = new StringBuilder();
        sb.append("🛍️ *NUEVO PEDIDO: MY BELLA AFRODITA*\n");
        sb.append("🔖 *Código:* #").append(orden.getCodigoSeguimiento()).append("\n");
        sb.append("------------------------------------------\n");
        sb.append("👤 *Cliente:* ").append(orden.getClienteNombre()).append("\n");
        sb.append("📱 *Teléfono:* ").append(orden.getClienteTelefono()).append("\n");
        if (orden.getClienteDireccion() != null && !orden.getClienteDireccion().isBlank()) {
            sb.append("📍 *Dirección:* ").append(orden.getClienteDireccion()).append("\n");
        }
        sb.append("💳 *Método de Pago:* ").append(orden.getMetodoPago()).append("\n");
        sb.append("------------------------------------------\n\n");

        for (OrdenItem item : orden.getItems()) {
            sb.append("• *").append(item.getProductoNombre().toUpperCase()).append("*\n");
            sb.append("   Talle: ").append(item.getTalle() != null ? item.getTalle() : "-").append("\n");
            sb.append("   Cant: ").append(item.getCantidad())
                    .append(" x $").append(df.format(item.getPrecioUnitario()));
            if (orden.isEsMayorista()) {
                sb.append(" (Mayorista)");
            }
            sb.append("\n");
            sb.append("   Subtotal: $").append(df.format(item.getSubtotal())).append("\n\n");
        }

        sb.append("------------------------------------------\n");
        sb.append("💰 *TOTAL: $").append(df.format(orden.getTotal())).append("*\n");

        if (orden.isEsMayorista() && orden.getDescuentoMayorista().compareTo(BigDecimal.ZERO) > 0) {
            sb.append("✨ _Beneficio mayorista aplicado por llevar 3 o más prendas._\n");
            sb.append("🎉 _¡Ahorro total de esta compra: $")
                    .append(df.format(orden.getDescuentoMayorista())).append("!_\n");
        }

        sb.append("\n📍 _San Juan, Argentina_");

        String textoCodificado = URLEncoder.encode(sb.toString(), StandardCharsets.UTF_8);
        return "https://wa.me/" + WHATSAPP_PHONE + "?text=" + textoCodificado;
    }

    private OrdenResponse mapearAResponse(Orden orden, String whatsappUrl) {
        List<OrdenItemResponse> itemsResponse = orden.getItems().stream()
                .map(i -> OrdenItemResponse.builder()
                        .id(i.getId())
                        .productoId(i.getProductoId())
                        .productoNombre(i.getProductoNombre())
                        .talle(i.getTalle())
                        .cantidad(i.getCantidad())
                        .precioUnitario(i.getPrecioUnitario())
                        .subtotal(i.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrdenResponse.builder()
                .id(orden.getId())
                .codigoSeguimiento(orden.getCodigoSeguimiento())
                .fechaCreacion(orden.getFechaCreacion())
                .clienteNombre(orden.getClienteNombre())
                .clienteTelefono(orden.getClienteTelefono())
                .clienteDireccion(orden.getClienteDireccion())
                .total(orden.getTotal())
                .subtotal(orden.getSubtotal())
                .descuentoMayorista(orden.getDescuentoMayorista())
                .esMayorista(orden.isEsMayorista())
                .estado(orden.getEstado())
                .metodoPago(orden.getMetodoPago())
                .items(itemsResponse)
                .whatsappUrl(whatsappUrl)
                .build();
    }
}
