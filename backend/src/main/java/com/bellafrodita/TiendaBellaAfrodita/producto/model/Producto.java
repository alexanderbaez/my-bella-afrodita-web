package com.bellafrodita.TiendaBellaAfrodita.producto.model;

import com.bellafrodita.TiendaBellaAfrodita.producto.dto.ProductoVarianteDto;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "productos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long id;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @NotBlank(message = "La categoría es obligatoria")
    @Column(nullable = false)
    private String categoria;

    @NotNull(message = "El precio minorista es obligatorio")
    @Positive(message = "El precio minorista debe ser mayor a cero")
    @Column(name = "precio_minorista", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioMinorista;

    @Positive(message = "El precio mayorista debe ser mayor a cero")
    @Column(name = "precio_mayorista", precision = 12, scale = 2)
    private BigDecimal precioMayorista;

    @Column(nullable = false)
    @Builder.Default
    private Boolean stock = true;

    private String etiqueta;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "imagenes", columnDefinition = "json")
    @Builder.Default
    private List<String> imagenes = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variantes", columnDefinition = "json")
    @Builder.Default
    private List<ProductoVarianteDto> variantes = new ArrayList<>();

    public boolean tieneStockGeneral() {
        if (variantes == null || variantes.isEmpty()) {
            return Boolean.TRUE.equals(this.stock);
        }
        return variantes.stream().mapToInt(v -> v.getStock() != null ? v.getStock() : 0).sum() > 0;
    }

    @JsonProperty("stockTotal")
    public Integer getStockTotal() {
        if (variantes == null || variantes.isEmpty()) {
            return Boolean.TRUE.equals(this.stock) ? 1 : 0;
        }
        return variantes.stream().mapToInt(v -> v.getStock() != null ? v.getStock() : 0).sum();
    }

    @JsonProperty("talles")
    public List<String> getTalles() {
        if (variantes == null || variantes.isEmpty()) {
            return new ArrayList<>();
        }
        return variantes.stream()
                .map(ProductoVarianteDto::getTalle)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .toList();
    }

    public void addVariante(ProductoVarianteDto variante) {
        if (this.variantes == null) {
            this.variantes = new ArrayList<>();
        }
        if (variante != null) {
            if (variante.getSku() == null || variante.getSku().isBlank()) {
                String idStr = this.id != null ? String.valueOf(this.id) : "PRD";
                String talleNorm = variante.getTalle() != null ? variante.getTalle().trim().toUpperCase().replaceAll("\\s+", "") : "U";
                variante.setSku(idStr + "-" + talleNorm);
            }
            this.variantes.add(variante);
        }
    }
}
