package com.bellafrodita.TiendaBellaAfrodita.orden.service;

import com.bellafrodita.TiendaBellaAfrodita.orden.dto.*;
import com.bellafrodita.TiendaBellaAfrodita.orden.exception.StockInsuficienteException;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.EstadoOrden;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.MetodoPago;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.Orden;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.OrdenItem;
import com.bellafrodita.TiendaBellaAfrodita.orden.model.TipoEntrega;
import com.bellafrodita.TiendaBellaAfrodita.orden.repository.OrdenRepository;
import com.bellafrodita.TiendaBellaAfrodita.producto.dto.ProductoVarianteDto;
import com.bellafrodita.TiendaBellaAfrodita.producto.model.Producto;
import com.bellafrodita.TiendaBellaAfrodita.producto.repository.ProductoRepository;
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
    public static final BigDecimal COSTO_SAN_JUAN = new BigDecimal("2500.00");
    public static final BigDecimal COSTO_NACIONAL = new BigDecimal("6500.00");

    private final OrdenRepository ordenRepository;
    private final ProductoRepository productoRepository;

    public OrdenService(OrdenRepository ordenRepository,
                        ProductoRepository productoRepository) {
        this.ordenRepository = ordenRepository;
        this.productoRepository = productoRepository;
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

        // 2. Determinar tipo de entrega y costo logístico (100% Online San Juan)
        TipoEntrega tipoEntrega = request.getTipoEntrega() != null ? request.getTipoEntrega() : TipoEntrega.ENVIO_MOTO_SAN_JUAN;
        BigDecimal costoEnvio = (request.getCostoEnvio() != null && request.getCostoEnvio().compareTo(BigDecimal.ZERO) >= 0)
                ? request.getCostoEnvio()
                : BigDecimal.ZERO;

        // 3. Generar código de seguimiento único
        String timestampPart = String.valueOf(System.currentTimeMillis()).substring(7);
        String randomPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String codigoSeguimiento = "BA-" + timestampPart + "-" + randomPart;

        Orden orden = Orden.builder()
                .codigoSeguimiento(codigoSeguimiento)
                .clienteNombre(request.getClienteNombre().trim())
                .clienteTelefono(request.getClienteTelefono().trim())
                .clienteEmail(request.getClienteEmail() != null && !request.getClienteEmail().isBlank() ? request.getClienteEmail().trim() : null)
                .clienteDireccion(request.getClienteDireccion() != null ? request.getClienteDireccion().trim() : null)
                .metodoPago(request.getMetodoPago() != null ? request.getMetodoPago() : MetodoPago.WHATSAPP_EFECTIVO)
                .tipoEntrega(tipoEntrega)
                .costoEnvio(costoEnvio)
                .estado(EstadoOrden.PENDIENTE_COTIZACION)
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

            // Validar stock físico disponible por variante en el JSON de Producto
            ProductoVarianteDto variante = null;
            if (producto.getVariantes() != null && !producto.getVariantes().isEmpty()) {
                variante = producto.getVariantes().stream()
                        .filter(v -> v.getTalle() != null && v.getTalle().equalsIgnoreCase(talleSolicitado))
                        .findFirst()
                        .orElse(null);
            }

            if (variante != null) {
                int stockDisponible = variante.getStock() != null ? variante.getStock() : 0;
                if (stockDisponible < cantidad) {
                    throw new StockInsuficienteException(
                            "Stock insuficiente para el producto '" + producto.getNombre() +
                            "' en talle '" + talleSolicitado + "'. Disponibles: " + stockDisponible +
                            ", solicitados: " + cantidad + "."
                    );
                }

                // Descuento atómico de stock directamente en la fila del producto
                variante.setStock(stockDisponible - cantidad);

                // Actualizar bandera de stock general y persistir producto
                producto.setStock(producto.tieneStockGeneral());
                productoRepository.save(producto);
            }

            BigDecimal precioMinorista = producto.getPrecioMinorista() != null ? producto.getPrecioMinorista() : BigDecimal.ZERO;
            BigDecimal precioMayorista = (producto.getPrecioMayorista() != null && producto.getPrecioMayorista().compareTo(BigDecimal.ZERO) > 0)
                    ? producto.getPrecioMayorista()
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

        BigDecimal totalConEnvio = totalCalculado.add(costoEnvio);

        orden.setSubtotal(subtotalCalculado.setScale(2, RoundingMode.HALF_UP));
        orden.setTotal(totalConEnvio.setScale(2, RoundingMode.HALF_UP));
        orden.setDescuentoMayorista(descuentoMayorista.setScale(2, RoundingMode.HALF_UP));
        orden.setCostoEnvio(costoEnvio.setScale(2, RoundingMode.HALF_UP));
        orden.setTipoEntrega(tipoEntrega);

        Orden ordenGuardada = ordenRepository.save(orden);

        // 4. Generar enlace codificado de WhatsApp
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

    @Transactional
    public OrdenResponse cotizarEnvio(Long ordenId, BigDecimal costoEnvio) {
        if (costoEnvio == null || costoEnvio.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El costo de envío debe ser mayor o igual a cero.");
        }

        Orden orden = ordenRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada con ID: " + ordenId));

        orden.setCostoEnvio(costoEnvio);

        // Subtotal de prendas menos descuento mayorista
        BigDecimal subtotal = orden.getSubtotal() != null ? orden.getSubtotal() : BigDecimal.ZERO;
        BigDecimal descuento = orden.getDescuentoMayorista() != null ? orden.getDescuentoMayorista() : BigDecimal.ZERO;
        BigDecimal subtotalPrendas = subtotal.subtract(descuento);
        if (subtotalPrendas.compareTo(BigDecimal.ZERO) < 0) {
            subtotalPrendas = BigDecimal.ZERO;
        }

        orden.setTotal(subtotalPrendas.add(costoEnvio));

        // Si estaba pendiente de cotización, avanza a PENDIENTE
        if (orden.getEstado() == EstadoOrden.PENDIENTE_COTIZACION) {
            orden.setEstado(EstadoOrden.PENDIENTE);
        }

        Orden actualizada = ordenRepository.save(orden);
        return mapearAResponse(actualizada, generarEnlaceWhatsApp(actualizada));
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
        if (orden.getClienteEmail() != null && !orden.getClienteEmail().isBlank()) {
            sb.append("✉️ *Email:* ").append(orden.getClienteEmail()).append("\n");
        }

        // Requerimiento exacto: 🛵 Entrega: Envío en Moto a [Departamento] - Dirección: [Calle, Nro, Entrecalles] (Costo de envío a coordinar)
        String dirCliente = (orden.getClienteDireccion() != null && !orden.getClienteDireccion().isBlank())
                ? orden.getClienteDireccion()
                : "San Juan";
        if (dirCliente.toLowerCase().startsWith("envío en moto a ") || dirCliente.toLowerCase().startsWith("envio en moto a ")) {
            sb.append("🛵 *Entrega:* ").append(dirCliente).append(" (Costo de envío a coordinar)\n");
        } else {
            sb.append("🛵 *Entrega:* Envío en Moto a ").append(dirCliente).append(" (Costo de envío a coordinar)\n");
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
        sb.append("📦 *Envío:* A cotizar por zona (se abona al recibir o con el pago)\n");
        sb.append("💰 *TOTAL PRENDAS: $").append(df.format(orden.getTotal())).append("*\n");

        if (orden.isEsMayorista() && orden.getDescuentoMayorista().compareTo(BigDecimal.ZERO) > 0) {
            sb.append("✨ _Beneficio mayorista aplicado por llevar 3 o más prendas._\n");
            sb.append("🎉 _¡Ahorro total de esta compra: $")
                    .append(df.format(orden.getDescuentoMayorista())).append("!_\n");
        }

        sb.append("\n📍 _San Juan, Argentina • Operación 100% Online_");

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
                .clienteEmail(orden.getClienteEmail())
                .clienteDireccion(orden.getClienteDireccion())
                .total(orden.getTotal())
                .subtotal(orden.getSubtotal())
                .descuentoMayorista(orden.getDescuentoMayorista())
                .costoEnvio(orden.getCostoEnvio())
                .tipoEntrega(orden.getTipoEntrega())
                .esMayorista(orden.isEsMayorista())
                .estado(orden.getEstado())
                .metodoPago(orden.getMetodoPago())
                .items(itemsResponse)
                .whatsappUrl(whatsappUrl)
                .build();
    }
}
