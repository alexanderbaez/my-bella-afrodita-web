const PRODUCTOS = [
    // --- BOMBACHAS ---
    {
        id: "prod-b1",
        nombre: "Bombacha de Señora con Encaje",
        precioMinorista: 2500,
        precioMayorista: 2000,
        imagenes: ["../images/Bombachas encaje FRENTE.png", "../images/Bombacha encaje DORSAL.png"],
        categoria: "bombachas",
        descripcion: "Diseño de encaje de alta calidad, tiro alto y corte clasico."
    },
    {
        id: "prod-b2",
        nombre: "Culote de Algodón",
        precioMinorista: 2500,
        precioMayorista: 1500,
        imagenes: ["../images/Culote algodon FRENTE.png", "../images/Culote algodon DORSAL.png"],
        categoria: "bombachas",
        descripcion: "Modelo de tiro medio en algodón suave. Ideal para el confort de cada día."
    },
    {
        id: "prod-b3",
        nombre: "Culote de Encaje",
        precioMinorista: 2500,
        precioMayorista: 1500,
        imagenes: ["../images/Culote encaje FRENTE.png", "../images/Culote encaje DORSAL.png"],
        categoria: "bombachas",
        descripcion: "Sin costuras, no se marca. Perfecto para sentirte comoda y sensual."
    },
    {
        id: "prod-b4",
        nombre: "Less de Algodón",
        precioMinorista: 1670,
        precioMayorista: 1250,
        imagenes: ["../images/Less algodon FRENTE.png", "../images/Less algodon DORSAL.png"],
        categoria: "bombachas",
        descripcion: "Tejido de algodón con terminaciones ultra-comoda y estampada en corazones."
    },
    {
        id: "prod-b5-puntilla",
        nombre: "Less de Algodón y Puntilla",
        precioMinorista: 1670,
        precioMayorista: 1250,
        imagenes: ["../images/Less algodon y puntilla FRENTE.png", "../images/Less algodon puntilla DORSAL.png"],
        categoria: "bombachas",
        descripcion: "Máxima cobertura frontal con un toque de sensualidad y cómodidad."
    },
    {
        id: "prod-b-especial",
        nombre: "Less de Algodón en Talles Especiales",
        precioMinorista: 1670,
        precioMayorista: 1250,
        imagenes: ["../images/Less Frente.png", "../images/Less Dorsal.png"],
        categoria: "bombachas",
        descripcion: "Con su tejido de algodon otorgan un toque de sensualidad y comodidad."
    },
    {
        id: "prod-b5",
        nombre: "Less Regulables",
        precioMinorista: 1770,
        precioMayorista: 1240,
        imagenes: ["../images/Less regulable FRENTE.png", "../images/Less regulable DORSAL.png"],
        categoria: "bombachas",
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b6",
        nombre: "Bombachas de Algodon con detalles de encaje",
        precioMinorista: 2500,
        precioMayorista: 2000,
        imagenes: [
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje1 (1).png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje1.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje3.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje4.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje5.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje6.png",
        ],
        categoria: "bombachas",
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b7",
        nombre: "Less Calvin Klein",
        precioMinorista: 2000,
        precioMayorista: 1740,
        imagenes: [
            "../images/Less-calvin-klein1.png",
            "../images/Less-calvin-klein2.png",
            "../images/Less-calvin-klein3.png",
            "../images/Less-calvin-klein4.png",
            "../images/Less-calvin-klein5.png",
        ],
        categoria: "bombachas",
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b8",
        nombre: "Vedetina",
        precioMinorista: 1740,
        precioMayorista: 1460,
        imagenes: [
            "../images/vedetina1.png",
            "../images/vedetina2.png",
            "../images/vedetina3.png",
            "../images/vedetina4.png",
            "../images/vedetina5.png",
            "../images/vedetina6.png",
        ],
        categoria: "bombachas",
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b9",
        nombre: "Boxers Dama con Faja",
        precioMinorista: 4500,
        precioMayorista: 3000,
        imagenes: [
            "../images/boxer-dama-con-faja1.png",
            "../images/boxer-dama-con-faja2.png",
        ],
        categoria: "bombachas",
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b10",
        nombre: "Bombacha Juvenil",
        precioMinorista: 1700,
        precioMayorista: 1300,
        imagenes: ["../images/Bombacha-juvenil.jpg"],
        categoria: "bombachas",
        descripcion: "Confeccionadas en algodon con diseño de guerreras K-pop"
    },
    {
        id: "prod-b11",
        nombre: "Smart Sexi",
        precioMinorista: 2250,
        precioMayorista: 1860,
        imagenes: ["../images/Smart Sexi.jpg"],
        categoria: "bombachas",
        descripcion: "Confeccionadas en morley, brinda confort, Disponibles en colores tendencia"
    },

    // --- CONJUNTOS ---
    {
        id: "conj-01",
        nombre: "Combo Alo - Remera + top + calza + medias",
        precioMinorista: 23000,
        precioMayorista: 19000,
        imagenes: ["../images/Combo alo 1.png", "../images/Combo alo 2.png"],
        categoria: "conjuntos",
        descripcion: "Combo de lycra que incluye remera, top, medias y short de lycra sin frunce."
    },
    {
        id: "conj-02",
        nombre: "Conjunto D'lirio con tazas desmontables",
        precioMinorista: 10500,
        precioMayorista: 8500,
        imagenes: [
            "../images/Conjunto D_lirio top + calza FRENTE 1.png",
            "../images/Conjunto D_lirio top + calza FRENTE 2.png",
            "../images/Conjunto D_lirio top + calza DORSAL 2.png"
        ],
        categoria: "conjuntos",
        descripcion: "Diseño del top de morley con tazas desmontables y calza con frunce, faja y levanta gluteos."
    },
    {
        id: "conj-03",
        nombre: "Conjunto Persefone",
        precioMinorista: 7000,
        precioMayorista: 6330,
        imagenes: [
            "../images/Conjunto parsefone FRENTE.png",
            "../images/Conjunto parsefone DORSAL.png",
            "../images/conjunto parsefone FRENTE 2.png",
            "../images/conjunto parsefone DORSAL 2.png"
        ],
        categoria: "conjuntos",
        descripcion: "La base perfecta. Cómodo morley y puntilla, ideal para usar bajo cualquier prenda."
    },
    {
        id: "conj-04",
        nombre: "Conjunto Roma",
        precioMinorista: 10000,
        precioMayorista: 8000,
        imagenes: ["../images/Conjunto Roma FRENTE.png", "../images/Conjunto roma DORSAL.png"],
        categoria: "conjuntos",
        descripcion: "Copas triangulares de algodón con delicados detalle de encaje. Ideal para la mujer romantica."
    },
    {
        id: "conj-05",
        nombre: "Conjunto Top + Calza (Lycra)",
        precioMinorista: 12000,
        precioMayorista: 10000,
        imagenes: [
            "../images/Conjunto Top + calza  1.png",
            "../images/Conjunto Top + calza  2.png",
            "../images/Conjunto Top + calza  3.png"
        ],
        categoria: "conjuntos",
        descripcion: "Color de tendencia. Confeccionado en lycra, sin frunce. Ideal para confort y sosten al entrenar."
    },
    {
        id: "conj-06",
        nombre: "Conjunto Top + Calza (Negro)",
        precioMinorista: 10000,
        precioMayorista: 8000,
        imagenes: ["../images/Conjunto Top + calza con frunce.png"],
        categoria: "conjuntos",
        descripcion: "Ultimos en color negro. De morley con un top de tazas desmontables y calza con frunce."
    },
    {
        id: "conj-07",
        nombre: "Conjunto Top + Pollera Pantalon",
        precioMinorista: 16500,
        precioMayorista: null,
        imagenes: [
            "../images/Conjunto top + pollera pantalon 1.png",
            "../images/Conjunto top + pollera pantalon 2.png",
            "../images/Conjunto top + pollera pantalon 3.png"
        ],
        categoria: "conjuntos",
        descripcion: "Color de tendencia. Confeccionado en lycra, con un diseño que ofrece elegancia y comodidad."
    },
    {
        id: "conj-08",
        nombre: "Conjunto Vicblack",
        precioMinorista: 7500,
        precioMayorista: 6450,
        imagenes: [
            "../images/Conjunto vicblack FRENTE 1.png",
            "../images/Conjunto vicblack DORSAL 1.png",
            "../images/Conjunto vicblack FRENTE 2.png",
            "../images/Conjunto vicblack FRENTE 3.png",
            "../images/Conjunto vicblack FRENTE 4.png",
            "../images/Conjunto vicblack FRENTE 5.png",
            "../images/Conjunto vicblack FRENTE 6.png"
        ],
        categoria: "conjuntos",
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla."
    },
    {
        id: "conj-09",
        nombre: "Conjunto Inicial Nena",
        precioMinorista: 3800,
        precioMayorista: 3200,
        imagenes: [
            "../images/Conjunto-inicial-nena1.png",
            "../images/Conjunto-inicial-nena2.png",
            "../images/Conjunto-inicial-nena3.png",
            "../images/Conjunto-inicial-nena4.png"
        ],
        categoria: "conjuntos",
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla."
    },
    {
        id: "conj-010",
        nombre: "Top Inicial Nena",
        precioMinorista: 2000,
        precioMayorista: 1740,
        imagenes: [
            "../images/Topcito-inicial-nena1.png",
            "../images/Topcito-inicial-nena2.png",
            "../images/Topcito-inicial-nena3.png",
            "../images/Topcito-inicial-nena4.png",
        ],
        categoria: "conjuntos",
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla."
    },
    {
        id: "conj-011",
        nombre: "Conjunto Deportivo",
        precioMinorista: 7000,
        precioMayorista: 6330,
        imagenes: ["../images/Conjunto-Deportivo.jpg"],
        categoria: "conjuntos",
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla y tazas desmontables."
    },
    {
        id: "conj-012",
        nombre: "Sports Bell",
        precioMinorista: 6500,
        precioMayorista: 5880,
        imagenes: ["../images/sports bell.jpg"],
        categoria: "conjuntos",
        descripcion: "Corpiño importado armado sin aro y con 4 broches para mayor ajuste y comodidad."
    },

    // --- PRODUCTOS DE HOMBRE ---
    {
        id: "masc-01",
        nombre: "Boxer uomo",
        precioMinorista: 4000,
        precioMayorista: 3000,
        imagenes: ["../images/Boxers1.jpg",
            "../images/Boxers2.jpg",
            "../images/Boxers3.jpg",

        ],
        categoria: "hombres",
        descripcion: "Boxer de algodón con lycra, elástico suave con logo de marca."
    },
    {
        id: "masc-02",
        nombre: "Slip Algodón Clásico",
        precioMinorista: 3900,
        precioMayorista: 3200,
        imagenes: ["../images/slip-1.jpg"],
        categoria: "hombres",
        descripcion: "Corte clásico, máxima comodidad y ajuste perfecto."
    },

    // ---  SECCIÓN MEDIAS (Detectado por el título "Medias") ---
    {
        id: "acc-01",
        nombre: "Pack Medias Con Orejitas Niños (x3)",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-orejita1.png",
            "../images/medias-orejita2.png",
            "../images/medias-orejita3.png",
            "../images/medias-orejita4.png",
        ],
        categoria: "medias",
        descripcion: "Pack de 3 pares de medias con orejitas para niños"
    },
    {
        id: "acc-med-01",
        nombre: "Medias con dibujitos",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-niñas.png"],
        categoria: "medias",
        descripcion: "Medias de algodón con tus dibujito preferido."
    },
    {
        id: "acc-med-02",
        nombre: "Medias Sport Girls Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-femenina.png"],
        categoria: "medias",
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },
    {
        id: "acc-med-03",
        nombre: "Medias Fasihon women's Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-femenina2.png"],
        categoria: "medias",
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },

    {
        id: "acc-med-04",
        nombre: "Medias Women's Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-femenina-sport.png"],
        categoria: "medias",
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },
    {
        id: "acc-med-05",
        nombre: "Medias Men",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-hombres.png"],
        categoria: "medias",
        descripcion: "Diseño urbano, suaves y super balance."
    },
    {
        id: "acc-med-06",
        nombre: "Medias Men's Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-hombre.sport.png"],
        categoria: "medias",
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    }
];