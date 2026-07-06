const PRODUCTOS = [
    // --- BOMBACHAS ---
    {
        id: "prod-b1",
        nombre: "Bombacha de Señora con Encaje",
        precioMinorista: 2500,
        precioMayorista: 2000,
        imagenes: [
            "../images/Bombacha de Señora con Encaje1.jpg",
            "../images/Bombachas encaje FRENTE.png",
            "../images/Bombacha encaje DORSAL.png"],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Diseño de encaje de alta calidad, tiro alto y corte clasico."
    },
    {
        id: "prod-b2",
        nombre: "Culote de Algodón",
        precioMinorista: 2500,
        precioMayorista: 1500,
        imagenes: [
            "../images/Culote de Algodón1.png",
            "../images/Culote de Algodón2.png",
            "../images/Culote algodon FRENTE.png", 
            "../images/Culote algodon DORSAL.png"],
        categoria: "bombachas",
        stock: false,
        descripcion: "Modelo de tiro medio en algodón suave. Ideal para el confort de cada día."
    },
    {
        id: "prod-b3",
        nombre: "Culote de Encaje",
        precioMinorista: 2500,
        precioMayorista: 1500,
        imagenes: [
            "../images/Culote de Encaje1.jpg",
            "../images/Culote encaje FRENTE.png",
            "../images/Culote encaje DORSAL.png"],
        categoria: "bombachas",
        //stock: false,
        etiqueta: "🔥 MÁS VENDIDO", // 🚀 Estrategia: Destacar el encaje sensual
        descripcion: "Sin costuras, no se marca. Perfecto para sentirte comoda y sensual."
    },
    {
        id: "prod-b4",
        nombre: "Less de Algodón",
        precioMinorista: 1670,
        precioMayorista: 1250,
        imagenes: [
            "../images/Less de Algodón1.jpg",
            "../images/Less de Algodón2.jpg",
            "../images/Less algodon FRENTE.png",
            "../images/Less algodon DORSAL.png"],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Tejido de algodón con terminaciones ultra-comoda y estampada en corazones."
    },
    {
        id: "prod-b5-puntilla",
        nombre: "Less de Algodón y Puntilla",
        precioMinorista: 1670,
        precioMayorista: 1250,
        imagenes: [
            "../images/Less de Algodón y Puntilla0.1.jpg",
            "../images/Less de Algodón y Puntilla1.jpg",
            "../images/Less de Algodón y Puntilla2.jpg",
            "../images/Less algodon y puntilla FRENTE.png",
            "../images/Less algodon puntilla DORSAL.png"],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Máxima cobertura frontal con un toque de sensualidad y cómodidad."
    },
    {
        id: "prod-b-especial",
        nombre: "Less de Algodón en Talles Especiales",
        precioMinorista: 1670,
        precioMayorista: 1250,
        imagenes: [
            "../images/Less de Algodón en Talles Especiales1.png",
            "../images/Less de Algodón en Talles Especiales2.png",
            "../images/Less Frente.png", 
            "../images/Less Dorsal.png"],
        categoria: "bombachas",
        stock: false,
        etiqueta: "⚡ POCO STOCK", // 🚀 Estrategia: Apurar la compra en talles específicos
        descripcion: "Con su tejido de algodon otorgan un toque de sensualidad y comodidad."
    },
    {
        id: "prod-b5",
        nombre: "Less Regulables",
        precioMinorista: 1770,
        precioMayorista: 1240,
        imagenes: ["../images/Less Regulables3.png", "../images/Less Regulables1.jpeg", "../images/Less Regulables2.jpeg",
            "../images/Less regulable FRENTE.png"
        ],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b6",
        nombre: "Bombachas de Algodon con detalles de encaje",
        precioMinorista: 2500,
        precioMayorista: 2000,
        imagenes: [
            "../images/Bombachas de Algodon con detalles de encaje1.jpg",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje1 (1).png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje1.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje3.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje4.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje5.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje6.png",
        ],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b7",
        nombre: "Less Calvin Klein",
        precioMinorista: 2000,
        precioMayorista: 1740,
        imagenes: [
            "../images/Less Calvin Klein1.jpeg",
            "../images/Less Calvin Klein2.png",
            "../images/Less-calvin-klein2.png",
            "../images/Less-calvin-klein3.png",
            "../images/Less-calvin-klein4.png",
            "../images/Less-calvin-klein5.png",
        ],
        categoria: "bombachas",
        //stock: false,
        etiqueta: "🔥 TENDENCIA", // 🚀 Estrategia: Aprovechar el peso de la marca famosa
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b8",
        nombre: "Vedetina",
        precioMinorista: 1740,
        precioMayorista: 1460,
        imagenes: [
            "../images/Vedetina1.jpg",
            "../images/vedetina1.png",
            "../images/vedetina2.png",
            "../images/vedetina3.png",
            "../images/vedetina4.png",
            "../images/vedetina5.png",
            "../images/vedetina6.png",
        ],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b9",
        nombre: "Boxers Dama con Faja",
        precioMinorista: 4500,
        precioMayorista: 3000,
        imagenes: [
            "../images/Boxers Dama con Faja0.1.png",
            "../images/Boxers Dama con Faja1.png",
            "../images/Boxers Dama con Faja2.png",
            "../images/Boxers Dama con Faja3.png",
            "../images/boxer-dama-con-faja1.png",
            "../images/boxer-dama-con-faja2.png",
        ],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
    {
        id: "prod-b10",
        nombre: "Bombacha Juvenil",
        precioMinorista: 1700,
        precioMayorista: 1300,
        imagenes: ["../images/Bombacha-juvenil.jpg"],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Confeccionadas en algodon con diseño de guerreras K-pop"
    },
    {
        id: "prod-b11",
        nombre: "Smart Sexi",
        precioMinorista: 2250,
        precioMayorista: 1860,
        imagenes: [
            "../images/Smart Sexi1.png",
            "../images/Smart Sexi.jpg"],
        categoria: "bombachas",
        stock: false,
        descripcion: "Confeccionadas en morley, brinda confort, Disponibles en colores tendencia"
    },
    {
        id: "prod-b12",
        nombre: "Culote Less Con Faja",
        precioMinorista: 3000,
        precioMayorista: 2000,
        imagenes: [
            "../images/Culote Less Con Faja0.1.png",
            "../images/Culote Less Con Faja1.png",
            "../images/Culote Less Con Faja2.png",
            "../images/Culote Less Faja1.jpg",
            "../images/Culote Less Faja2.png"
        ],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Confeccionadas en morley, brinda confort, Disponibles en colores tendencia"
    },

    {
        id: "prod-b13",
        nombre: "Boxers De Dama",
        precioMinorista: 4000,
        precioMayorista: 3000,
        imagenes: [
            "../images/BoxersDeDama1.jpg",
            "../images/BoxerDeDama2.jpg",
            "../images/BoxersDeDama3.jpg",
            "../images/BoxersDeDama4.jpg",
        ],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Boxers de dama hechos de suave algodón con detalles de puntilla, ideales para el uso diario."
    },
    {
        id: "prod-b14",
        nombre: "Less Taller Especiales",
        precioMinorista: 4500,
        precioMayorista: 3000,
        imagenes: [
            "../images/Less Taller Especiales1.jpg",
            "../images/Less Taller Especiales2.jpg",
            "../images/Less Taller Especiales3.jpg",
            "../images/Less Taller Especiales4.jpg",
        ],
        categoria: "bombachas",
        //stock: false,
        descripcion: "Hechos de suave algodón con detalles de puntilla, ideales para el uso diario"
    },

    // --- CONJUNTOS ---
    {
        id: "conj-01",
        nombre: "Red Velvet",
        precioMinorista: 15000,
        precioMayorista: 12000,
        imagenes: ["../images/Red Velvet0.jpeg",
            "../images/Red Velvet1.jpeg",
            "../images/Red Velvet2.jpeg",
            "../images/Red Velvet3.jpeg",
        ],
        categoria: "conjuntos",
        //stock: false,
        etiqueta: "🔥 IMPERDIBLE", // 🚀 Estrategia: Llamar la atención sobre el producto premium estrella
        descripcion: "Colección Intimate La sofisticación del encaje se combina con un diseño tipo longline para ofrecerte un ajuste impecable. El conjunto Red Velvet destaca por su acabado artesanal y tirantes ajustables, pensado para quienes buscan sentirse especiales en su día a día sin perder el confort."
    },
    {
        id: "conj-02",
        nombre: "Combo Alo - Remera + top + calza + medias",
        precioMinorista: 25000,
        precioMayorista: 20000,
        imagenes: [
            "../images/Combo Alo - Remera + top + calza + medias1.jpg",
            "../images/Combo Alo - Remera + top + calza + medias2.jpg",
            "../images/Combo Alo - Remera + top + calza + medias3.jpg",
            "../images/Combo alo 1.png",
            "../images/Combo alo 2.png"],
        categoria: "conjuntos",
        //stock: false,
        etiqueta: "⚡ ÚLTIMOS COMBOS", // 🚀 Estrategia: Generar urgencia por volumen
        descripcion: "Combo de lycra que incluye remera, top, medias y short de lycra sin frunce."
    },
    {
        id: "conj-03",
        nombre: "Conjunto D'lirio con tazas desmontables",
        precioMinorista: 10500,
        precioMayorista: 8500,
        imagenes: [
            "../images/Conjunto D'lirio con tazas desmontables1.png",
            "../images/Conjunto D'lirio con tazas desmontables2.png",
            "../images/Conjunto D_lirio top + calza FRENTE 1.png",
            "../images/Conjunto D_lirio top + calza FRENTE 2.png",
            "../images/Conjunto D_lirio top + calza DORSAL 2.png"
        ],
        categoria: "conjuntos",
        stock: false,
        descripcion: "Diseño del top de morley con tazas desmontables y calza con frunce, faja y levanta gluteos."
    },
    {
        id: "conj-04",
        nombre: "Conjunto Persefone",
        precioMinorista: 7000,
        precioMayorista: 6330,
        imagenes: [
            "../images/Conjunto Persefone1.jpg",
            "../images/Conjunto parsefone FRENTE.png",
            "../images/Conjunto parsefone DORSAL.png",
            "../images/conjunto parsefone FRENTE 2.png",
            "../images/conjunto parsefone DORSAL 2.png"
        ],
        categoria: "conjuntos",
        stock: false,
        descripcion: "La base perfecta. Cómodo morley y puntilla, ideal para usar bajo cualquier prenda."
    },
    {
        id: "conj-05",
        nombre: "Conjunto Roma",
        precioMinorista: 10000,
        precioMayorista: 8000,
        imagenes: ["../images/Conjunto Roma FRENTE.png", "../images/Conjunto roma DORSAL.png"],
        categoria: "conjuntos",
        stock: false,
        descripcion: "Copas triangulares de algodón con delicados detalle de encaje. Ideal para la mujer romantica."
    },
    {
        id: "conj-06",
        nombre: "Calza (Lycra)",
        precioMinorista: 4500,
        precioMayorista: 3500,
        imagenes: [
            "../images/Calza (Lycra)1.png",
            "../images/Conjunto Top + calza  1.png",
            "../images/Conjunto Top + calza  2.png",
            "../images/Conjunto Top + calza  3.png"
        ],
        categoria: "conjuntos",
        //stock: false,
        descripcion: "Color de tendencia. Confeccionado en lycra, sin frunce. Ideal para confort y sosten al entrenar."
    },
    {
        id: "conj-07",
        nombre: "Conjunto Top + Calza (Negro)",
        precioMinorista: 10000,
        precioMayorista: 8000,
        imagenes: [
            "../images/Conjunto Top + Calza (Negro)1.png",
            "../images/Conjunto Top + calza con frunce.png"],
        categoria: "conjuntos",
        //stock: false,
        etiqueta: "⚡ ¡VUELA!", // 🚀 Estrategia: Indicar alta rotación por el color básico
        descripcion: "Ultimos en color negro. De morley con un top de tazas desmontables y calza con frunce."
    },
    {
        id: "conj-08",
        nombre: "Conjunto Top + Pollera Pantalon",
        precioMinorista: 16500,
        precioMayorista: null,
        imagenes: [
            "../images/Conjunto Top + Pollera Pantalon0.1.png",
            "../images/Conjunto top + pollera pantalon 1.png",
            "../images/Conjunto top + pollera pantalon 2.png",
            "../images/Conjunto top + pollera pantalon 3.png"
        ],
        categoria: "conjuntos",
        //stock: false,
        descripcion: "Color de tendencia. Confeccionado en lycra, con un diseño que ofrece elegancia y comodidad."
    },
    {
        id: "conj-09",
        nombre: "Conjunto Vicblack",
        precioMinorista: 7500,
        precioMayorista: 6450,
        imagenes: [
            "../images/Conjunto Vicblack1.png",
            "../images/Conjunto Vicblack2.jpg",
            "../images/Conjunto vicblack FRENTE 1.png",
            "../images/Conjunto-Vicblack-detalle1.png",
            "../images/Conjunto-Vicblack-detalle2.png",
            "../images/Conjunto-Vicblack-detalle3.png",
            "../images/Conjunto vicblack DORSAL 1.png",
            "../images/Conjunto vicblack FRENTE 2.png",
            "../images/Conjunto vicblack FRENTE 3.png",
            "../images/Conjunto vicblack FRENTE 4.png",
            "../images/Conjunto vicblack FRENTE 5.png",
            "../images/Conjunto vicblack FRENTE 6.png"
        ],
        categoria: "conjuntos",
        //stock: false,
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla."
    },
    {
        id: "conj-10",
        nombre: "Conjunto Inicial Nena",
        precioMinorista: 3800,
        precioMayorista: 3200,
        imagenes: [
            "../images/Conjunto Inicial Nena1.jpeg",
            "../images/Conjunto Inicial Nena2.jpeg",
            "../images/Conjunto-inicial-nena1.png",
            "../images/Conjunto-inicial-nena2.png",
            "../images/Conjunto-inicial-nena3.png",
            "../images/Conjunto-inicial-nena4.png"
        ],
        categoria: "conjuntos",
        //stock: false,
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla."
    },
    {
        id: "conj-011",
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
        //stock: false,
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla."
    },
    {
        id: "conj-012",
        nombre: "Conjunto Deportivo",
        precioMinorista: 7000,
        precioMayorista: 6330,
        imagenes: ["../images/Conjunto Deportivo1.jpeg",
            "../images/Conjunto Deportivo2.jpeg",
            "../images/Conjunto Deportivo3.jpeg",
            "../images/1.1.png",
        ],
        categoria: "conjuntos",
        //stock: false,
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla y tazas desmontables."
    },
    {
        id: "conj-013",
        nombre: "Sports Bell",
        precioMinorista: 6500,
        precioMayorista: 5880,
        imagenes: [
            "../images/Sports Bell1.jpg",
            "../images/Sports Bell2.jpg",
            "../images/Sports Bell3.jpg",
            "../images/Sports Bell4.jpg",
            "../images/Sports-Bell1.png",
            "../images/Sports-Bell2.png",
            "../images/Sports-Bell2.2.png",
            "../images/Sports-Bell3.png",
            "../images/Sports-Bell4.png",
        ],
        categoria: "conjuntos",
        stock: false,
        descripcion: "Corpiño importado armado sin aro y con 4 broches para mayor ajuste y comodidad."
    },
    {
        id: "conj-014",
        nombre: "Top Segunda Piel",
        precioMinorista: 6000,
        precioMayorista: 4500,
        imagenes: [
            "../images/Top Segunda Piel1.png",
            "../images/Top Segunda Piel2.png",
        ],
        categoria: "conjuntos",
        //stock: false,
        descripcion: "Su tela premium se adapta a cada uno de tus movimientos sin marcar ni lastimar."
    },

    {
        id: "conj-015",
        nombre: "Top Deportivo Curvas Reales",
        precioMinorista: 7000,
        precioMayorista: 5500,
        imagenes: [
            "../images/Top Deportivo Curvas Reales1.jpg",
            "../images/Top Deportivo Curvas Reales2.jpg",
            "../images/Top Deportivo Curvas Reales3.jpg",
        ],
        categoria: "conjuntos",
        //stock: false,
        descripcion: "¡Tu nuevo aliado diario! Un top pensado para darte la máxima libertad y un calce perfecto!"
    },

    // --- PRODUCTOS DE HOMBRE ---
    {
        id: "masc-01",
        nombre: "Boxer uomo",
        precioMinorista: 4000,
        precioMayorista: 3000,
        imagenes: [
            "../images/Boxer uomo1.jpg",
            "../images/Boxer uomo2.png",
            "../images/Boxer uomo3.png",
            "../images/Boxer uomo4.png",
        ],
        categoria: "hombres",
        //stock: false,
        descripcion: "Boxer de algodón con lycra, elástico suave con logo de marca."
    },
    {
        id: "masc-02",
        nombre: "Boxers de Algodón Zantino",
        precioMinorista: 2200,
        precioMayorista: 1800,
        imagenes: ["../images/Boxers Niño1.jpg",
            "../images/Boxers Niño2.png",
            "../images/Boxers Niño3.png"
        ],
        categoria: "hombres",
        //stock: false,
        descripcion: "Boxer de algodón con lycra, elástico suave con logo de marca."
    },
    {
        id: "masc-03",
        nombre: "Slip Algodón Clásico",
        precioMinorista: 3000,
        precioMayorista: 2000,
        imagenes: [
            "../images/Slip Algodón Clásico1.png",
            "../images/Slip Adulto1.jpg",
            "../images/Slip Adulto2.png"
        ],
        categoria: "hombres",
        //stock: false,
        descripcion: "Corte clásico, máxima comodidad y ajuste perfecto."
    },
    {
        id: "masc-04",
        nombre: "Slip Algodón niño",
        precioMinorista: 1833,
        precioMayorista: 1000,
        imagenes: ["../images/Slip Niño1.jpg",
            "../images/Slip Niño2.png",
            "../images/Slip Niño3.png"
        ],
        categoria: "hombres",
        //stock: false,
        descripcion: "Corte clásico, máxima comodidad y ajuste perfecto."
    },

    // --- SECCIÓN MEDIAS ---
    {
        id: "acc-01",
        nombre: "Medias Escolares ",
        precioMinorista: 2000,
        precioMayorista: null,
        imagenes: ["../images/Medias-escolares-blanca.jpg"],
        categoria: "medias",
        //stock: false,
        descripcion: "Par de medias escolares blanca"
    },
    {
        id: "acc-02",
        nombre: "Pack Medias Alo Dama (x3)",
        precioMinorista: 5500,
        precioMayorista: null,
        imagenes: ["../images/Medias-Alo-dama.jpg"],
        categoria: "medias",
        //stock: false,
        descripcion: "Pack de 3 pares de medias con orejitas para niños"
    },
    {
        id: "acc-03",
        nombre: "Pack Medias Con Orejitas Niños (x3)",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/Medias con orejita1.1.png",
            "../images/medias-orejita2.png",
            "../images/medias-orejita3.png",
            "../images/medias-orejita4.png",
        ],
        categoria: "medias",
        //stock: false,
        descripcion: "Pack de 3 pares de medias con orejitas para niños"
    },
    {
        id: "acc-med-04",
        nombre: "Medias con dibujitos",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-niñas.png"],
        categoria: "medias",
        //stock: false,
        descripcion: "Medias de algodón con tus dibujito preferido."
    },
    {
        id: "acc-med-05",
        nombre: "Medias Sport Girls Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-femenina.png"],
        categoria: "medias",
        //stock: false,
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },
    {
        id: "acc-med-06",
        nombre: "Medias Fasihon women's Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-femenina2.png"],
        categoria: "medias",
        //stock: false,
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },
    {
        id: "acc-med-07",
        nombre: "Medias Women's Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-femenina-sport.png"],
        categoria: "medias",
        //stock: false,
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },
    {
        id: "acc-med-08",
        nombre: "Medias Men",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-hombres.png"],
        categoria: "medias",
        //stock: false,
        descripcion: "Diseño urbano, suaves y super balance."
    },
    {
        id: "acc-med-09",
        nombre: "Medias Men's Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/medias-hombre.sport.png"],
        categoria: "medias",
        //stock: false,
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },
    {
        id: "acc-med-10",
        nombre: "Medias For Girls Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/Medias Niña1.png",
            "../images/Medias Niña2.png"
        ],
        categoria: "medias",
        //stock: false,
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    },
    {
        id: "acc-med-11",
        nombre: "Medias For Boys Socks",
        precioMinorista: 1500,
        precioMayorista: null,
        imagenes: ["../images/Medias Niño1.png",
            "../images/Medias niño2.png"
        ],
        categoria: "medias",
        //stock: false,
        descripcion: "Diseño urbano, suaves y cómodas para el uso diario."
    }
];