const PRODUCTOS = [
    // --- BOMBACHAS ---
    {
        id: "prod-b1",
        nombre: "Bombacha de Señora con Encaje",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: ["../images/Bombachas encaje FRENTE.png", "../images/Bombacha encaje DORSAL.png"],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Diseño de encaje de alta calidad, tiro alto y corte clasico."
    },
    {
        id: "prod-b2",
        nombre: "Culote de Algodón",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: ["../images/Culote algodon FRENTE.png", "../images/Culote algodon DORSAL.png"],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Modelo de tiro medio en algodón suave. Ideal para el confort de cada día."
    },
    {
        id: "prod-b3",
        nombre: "Culote de Encaje",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: ["../images/Culote encaje FRENTE.png", "../images/Culote encaje DORSAL.png"],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Sin costuras, no se marca. Perfecto para sentirte comoda y sensual."
    },
    {
        id: "prod-b4",
        nombre: "Less de Algodón",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: ["../images/Less algodon FRENTE.png", "../images/Less algodon DORSAL.png"],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Tejido de algodón con terminaciones ultra-comoda y estampada en corazones."
    },
    {
        id: "prod-b5-puntilla",
        nombre: "Less de Algodón y Puntilla",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: ["../images/Less algodon y puntilla FRENTE.png", "../images/Less algodon puntilla DORSAL.png"],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Máxima cobertura frontal con un toque de sensualidad y cómodidad."
    },
    {
        id: "prod-b-especial",
        nombre: "Less de Algodón en Talles Especiales",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: ["../images/Less Frente.png", "../images/Less Dorsal.png"],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Con su tejido de algodon otorgan un toque de sensualidad y comodidad."
    },
    {
        id: "prod-b5",
        nombre: "Less Regulables",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: ["../images/Less regulable FRENTE.png", "../images/Less regulable DORSAL.png"],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },

    {
        id: "prod-b6",
        nombre: "Bombachas de Algodon con detalles de encaje",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: [
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje1 (1).png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje1.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje3.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje4.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje5.png",
            "../images/Bombachas-de-Algodon-con-detalles-de-encaje6.png",

        ],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },

        {
        id: "prod-b7",
        nombre: "Less Calvin Klein",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: [
            "../images/Less-calvin-klein1.png",
            "../images/Less-calvin-klein2.png",
            "../images/Less-calvin-klein3.png",
            "../images/Less-calvin-klein4.png",
            "../images/Less-calvin-klein5.png",
        ],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },

            {
        id: "prod-b8",
        nombre: "Vedetina",
        precio: 2500,
        infoPromo: "Llevando 2 pagás $4.500",
        imagenes: [
            "../images/vedetina1.png",
            "../images/vedetina2.png",
            "../images/vedetina3.png",
            "../images/vedetina4.png",
            "../images/vedetina5.png",
            "../images/vedetina6.png",
        ],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },
                {
        id: "prod-b9",
        nombre: "Boxers Dama con Faja",
        precio: 2500,
        //infoPromo: "Llevando 2 pagás $4.500",
        imagenes: [
            "../images/boxer-dama-con-faja1.png",
            "../images/boxer-dama-con-faja2.png",
        ],
        categoria: "bombachas",
        esPromo: false,
        descripcion: "Confeccionadas en algodon con encaje ofrecen un toque sexy y comodo."
    },


    // --- CONJUNTOS ---
    {
        id: "conj-01",
        nombre: "Combo Alo - Remera + top + calza + medias",
        precio: 23000,
        //infoPromo: "🚀 ¡Envío GRATIS con este Combo!",
        imagenes: ["../images/Combo alo 1.png", "../images/Combo alo 2.png"],
        categoria: "conjuntos",
        descripcion: "Combo de lycra que incluye remera, top, medias y short de lycra sin frunce."
    },
    {
        id: "conj-02",
        nombre: "Conjunto D'lirio con tazas desmontables",
        precio: 10500,
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
        precio: 10000,
        //infoPromo: "Combo: 2 Conjuntos por $18.000",
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
        precio: 10000,
        //infoPromo: "Combo: 2 Conjuntos por $18.000",
        imagenes: ["../images/Conjunto Roma FRENTE.png", "../images/Conjunto roma DORSAL.png"],
        categoria: "conjuntos",
        descripcion: "Copas triangulares de algodón con delicados detalle de encaje. Ideal para la mujer romantica."
    },
    {
        id: "conj-05",
        nombre: "Conjunto Top + Calza (Lycra)",
        precio: 12000,
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
        precio: 10000,
        //infoPromo: "Combo: 2 Conjuntos por $18.000",
        imagenes: ["../images/Conjunto Top + calza con frunce.png"],
        categoria: "conjuntos",
        descripcion: "Ultimos en color negro. De morley con un top de tazas desmontables y calza con frunce."
    },
    {
        id: "conj-07",
        nombre: "Conjunto Top + Pollera Pantalon",
        precio: 17000,
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
        precio: 7500,
        //infoPromo: "Combo: 2 Conjuntos por $18.000",
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
        precio: 4000,
        // infoPromo: "Combo: 2 Conjuntos por $18.000",
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
        precio: 2000,
        infoPromo: "Combo: 2 Conjuntos por $3.500",
        imagenes: [
            "../images/Topcito-inicial-nena1.png",
            "../images/Topcito-inicial-nena2.png",
            "../images/Topcito-inicial-nena3.png",
            "../images/Topcito-inicial-nena4.png",
        ],
        categoria: "conjuntos",
        descripcion: "Colores de la nueva temporada. Con un diseño comodo en morley con detalles de puntilla."
    }
];