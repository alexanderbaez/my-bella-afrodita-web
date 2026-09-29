package com.bellafrodita.TiendaBellaAfrodita.model;

import com.fasterxml.jackson.annotation.JsonFormat;
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "producto_talles", joinColumns = @JoinColumn(name = "producto_id"))
    @Column(name = "talle")
    private List<String> talles = new ArrayList<>();

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
                    Double precioMayorista, List<String> talles, List<String> imagenes, String etiqueta, Boolean stock) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.precioMinorista = precioMinorista;
        this.precioMayorista = precioMayorista;
        this.talles = talles != null ? talles : new ArrayList<>();
        this.imagenes = imagenes != null ? imagenes : new ArrayList<>();
        this.etiqueta = etiqueta;
        this.stock = stock != null ? stock : true;
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

    public List<String> getTalles() {
        return talles;
    }

    public void setTalles(List<String> talles) {
        this.talles = talles;
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
