package com.bellafrodita.TiendaBellaAfrodita.producto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "producto_variantes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"producto_id", "talle"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoVariante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El talle es obligatorio")
    @Column(nullable = false, length = 50)
    private String talle;

    @NotNull(message = "El stock numérico es obligatorio")
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(length = 100)
    private String sku;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    @JsonIgnore
    private Producto producto;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (this.stock == null || this.stock < 0) {
            this.stock = 0;
        }
        if (this.talle != null) {
            this.talle = this.talle.trim();
        }
        if ((this.sku == null || this.sku.isBlank()) && this.talle != null) {
            String prodIdStr = (this.producto != null && this.producto.getId() != null)
                    ? String.valueOf(this.producto.getId())
                    : "PRD";
            this.sku = prodIdStr + "-" + this.talle.toUpperCase().replaceAll("\\s+", "");
        }
    }
}
