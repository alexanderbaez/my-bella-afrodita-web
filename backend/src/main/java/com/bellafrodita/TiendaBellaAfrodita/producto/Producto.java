package com.bellafrodita.TiendaBellaAfrodita.producto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "productos")
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
    @Column(nullable = false)
    private Double precioMinorista;

    @Positive(message = "El precio mayorista debe ser mayor a cero")
    private Double precioMayorista;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ProductoVariante> variantes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "producto_imagenes", joinColumns = @JoinColumn(name = "producto_id"))
    @Column(name = "imagen_url", columnDefinition = "TEXT")
    private List<String> imagenes = new ArrayList<>();

    private String etiqueta;

    @Column(nullable = false)
    private Boolean stock = true;

    public Producto() {
    }

    public Producto(Long id, String nombre, String descripcion, String categoria, Double precioMinorista,
                    Double precioMayorista, List<ProductoVariante> variantes, List<String> imagenes, String etiqueta, Boolean stock) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.precioMinorista = precioMinorista;
        this.precioMayorista = precioMayorista;
        this.variantes = variantes != null ? variantes : new ArrayList<>();
        this.imagenes = imagenes != null ? imagenes : new ArrayList<>();
        this.etiqueta = etiqueta;
        this.stock = stock != null ? stock : true;
    }

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
                .map(ProductoVariante::getTalle)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .toList();
    }

    public void addVariante(ProductoVariante variante) {
        if (this.variantes == null) {
            this.variantes = new ArrayList<>();
        }
        this.variantes.add(variante);
        variante.setProducto(this);
    }

    public void removeVariante(ProductoVariante variante) {
        if (this.variantes != null) {
            this.variantes.remove(variante);
            variante.setProducto(null);
        }
    }

    public void clearVariantes() {
        if (this.variantes != null) {
            this.variantes.clear();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public Double getPrecioMinorista() {
        return precioMinorista;
    }

    public void setPrecioMinorista(Double precioMinorista) {
        this.precioMinorista = precioMinorista;
    }

    public Double getPrecioMayorista() {
        return precioMayorista;
    }

    public void setPrecioMayorista(Double precioMayorista) {
        this.precioMayorista = precioMayorista;
    }

    public List<ProductoVariante> getVariantes() {
        return variantes;
    }

    public void setVariantes(List<ProductoVariante> variantes) {
        this.variantes = variantes != null ? variantes : new ArrayList<>();
        for (ProductoVariante v : this.variantes) {
            v.setProducto(this);
        }
    }

    public List<String> getImagenes() {
        return imagenes;
    }

    public void setImagenes(List<String> imagenes) {
        this.imagenes = imagenes;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public Boolean getStock() {
        return stock;
    }

    public void setStock(Boolean stock) {
        this.stock = stock;
    }
}
