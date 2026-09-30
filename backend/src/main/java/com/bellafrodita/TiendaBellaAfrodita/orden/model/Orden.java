package com.bellafrodita.TiendaBellaAfrodita.orden.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordenes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_seguimiento", unique = true, nullable = false, length = 60)
    private String codigoSeguimiento;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "cliente_nombre", nullable = false, length = 150)
    private String clienteNombre;

    @Column(name = "cliente_telefono", nullable = false, length = 50)
    private String clienteTelefono;

    @Column(name = "cliente_email", length = 150)
    private String clienteEmail;

    @Column(name = "cliente_direccion", length = 255)
    private String clienteDireccion;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal total;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "descuento_mayorista", precision = 12, scale = 2, nullable = false)
    private BigDecimal descuentoMayorista;

    @Column(name = "es_mayorista", nullable = false)
    private boolean esMayorista;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoOrden estado = EstadoOrden.PENDIENTE_COTIZACION;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 30)
    @Builder.Default
    private MetodoPago metodoPago = MetodoPago.WHATSAPP_EFECTIVO;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_entrega", nullable = false, length = 50)
    @Builder.Default
    private TipoEntrega tipoEntrega = TipoEntrega.ENVIO_MOTO_SAN_JUAN;

    @Column(name = "costo_envio", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal costoEnvio = BigDecimal.ZERO;

    @OneToMany(mappedBy = "orden", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrdenItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = EstadoOrden.PENDIENTE_COTIZACION;
        }
        if (this.metodoPago == null) {
            this.metodoPago = MetodoPago.WHATSAPP_EFECTIVO;
        }
        if (this.tipoEntrega == null) {
            this.tipoEntrega = TipoEntrega.ENVIO_MOTO_SAN_JUAN;
        }
        if (this.costoEnvio == null) {
            this.costoEnvio = BigDecimal.ZERO;
        }
    }

    public void addItem(OrdenItem item) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        this.items.add(item);
        item.setOrden(this);
    }
}
