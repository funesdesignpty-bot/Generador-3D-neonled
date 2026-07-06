// =============================================================
// GENERADOR DE LETRAS CORPÓREAS PRO - V5.8 (VERSION FIEL ORIGINAL)
// Funes Design & Marketing Solutions - David, Chiriquí
// =============================================================

/* [1. ARCHIVO VECTORIAL] */
// Nombre exacto del archivo SVG que debe estar en la misma carpeta
archivo_svg = "diseno.svg"; 

/* [2. SELECCIÓN DE PIEZA Y MODO] */
// Qué pieza deseas generar, imprimir o exportar como vector en este momento
Renderizar = "Letra_Principal"; // [Letra_Principal, Tapa_Frontal_Para_Muesca, Tapa_Trasera_Encajable, Bloqueador_Luz_Antifuga, Vector_Corte_Base_CNC]
// Configuración estructural y de ensamble de la letra principal
Tipo_de_Proyecto = "Pared_Continua_Frontal"; // [Pared_Continua_Frontal, Efecto_Infinito, Ajuste_Trasero_Muesca, Soporte_Triangular_Simple, Apoyo_Doble, Muesca_Plana_Frontal]

/* [3. DIMENSIONES GLOBALES Y BASE] */
// Altura total del cuerpo de la letra corpórea (Eje Z)
Altura_Corporea = 35; // [5:1:150]
// Grosor de la pared exterior de la letra principal
Pared_Externa = 2.0; // [0.8:0.1:10]
// Tolerancia general de calce entre piezas mecánicas (unión holgada base)
Tolerancia_Calce = 0.15; // [0:0.01:1]
// Grosor del fondo de la letra (0 = Hueca / Sin fondo para albergar LEDs)
Grosor_Base_Solida = 0.0; // [0:0.4:10]
// Activar efecto espejo para impresión invertida o moldes
Espejo = 0; // [0:1]

/* [4. CONFIG: SOPORTE DE PARED (FRONTAL / INFINITO)] */
// Grosor del acrílico o cara de la tapa frontal (Ej: 2mm o 3mm)
Grosor_Acrilico_Frontal = 3.0; // [1:0.1:10]
// Grosor del acrílico trasero (Exclusivo para Modo Efecto Infinito)
Grosor_Acrilico_Trasero = 3.0; // [1:0.1:10]
// Distancia que extruye la pestaña interna hacia el centro para soportar las tapas
Ancho_Soporte_Interno = 2.5; // [1:0.1:15]

/* [5. CONFIG: MUESCA PLANA AJUSTABLE (TRASERA Y FRONTAL)] */
// Ancho o profundidad horizontal de la pestaña de la muesca (Para el modo Muesca Plana Frontal)
Ancho_Muesca_X = 2.5; // [1:0.1:15]
// Altura o grosor del escalón de la muesca desde su base de apoyo (Modo Ajuste Trasero)
Altura_Muesca_Z = 1.6; // [0.4:0.1:20]

/* [6. CONFIG: SOPORTE TRIANGULARES] */
// Cateto horizontal y vertical del refuerzo triangular interno
Tamano_Triangulo = 3.6; // [1:0.1:15]
// Espesor del material frontal para nivelación del soporte triangular superior
Grosor_Material_Acrilico = 3.0; // [1:0.1:10]
// Altura de posicionamiento del soporte inferior (Solo en Apoyo Doble)
Altura_Soporte_Inf = 3.0; // [1:0.1:20]

/* [7. CONFIG: TAPA FRONTAL CON ENCASTE] */
// Grosor de la base de la tapa frontal (Cara vista exterior)
Grosor_Base_Tapa_Frontal = 3.0; // [0.5:0.1:10]
// Altura de la pared/pestaña de encaste que entra al cuerpo de la letra
Altura_Pestana_Frontal = 4.0; // [0:0.1:30]
// Espesor de la pared de la pestaña de encaste frontal
Grosor_Pestana_Frontal = 1.5; // [0.5:0.1:5]
// Distancia horizontal desde el borde hacia adentro para la pestaña
Distancia_Borde_Pestana_Frontal = 2.0; // [0:0.1:10]
// Holgura perimetral específica para la tapa frontal
Holgura_Tapa_Frontal = 0.15; // [0:0.05:1]

/* [8. CONFIG: TAPA TRASERA ENCAJABLE TRADICIONAL] */
// Grosor de la base plana de la tapa trasera
Grosor_Base_Tapa = 2.0; // [0.5:0.1:10]
// Altura de la pared de fricción trasera
Altura_Pared_Tapa = 5.0; // [1:0.1:30]
// Grosor de la pared de la tapa trasera
Grosor_Pared_Tapa = 1.5; // [0.5:0.1:5]
// Holgura perimetral para la tapa trasera
Holgura_Tapa = 0.2; // [0:0.05:1]

/* [9. CONFIG: BLOQUEADOR DE LUZ] */
// Espesor de la pared de la inserción bloqueadora
Pared_Bloqueador = 0.8; // [0.4:0.1:2]
// Holgura perimetral para el bloqueador de luz
Holgura_Bloqueador = 0.15; // [0:0.05:1]

/* [10. CONFIG: HUECO DE ENCASTRADO PARA BASE CNC] */
// Holgura extra en el material de soporte para el encastre de la letra
Holgura_Corte_Base_CNC = 0.25; // [0:0.05:2]

/* [11. CALIDAD] */
$fn = 100;

// =============================================================
// MÓDULOS DE GEOMETRÍA VECTORIAL Y AUXILIARES
// =============================================================

module mi_diseno(offset_r = 0) {
    mirror([(Espejo == 1 ? 1 : 0), 0, 0]) {
        offset(r = offset_r) import(archivo_svg, center = true);
    }
}

module dibujar_triangulos(z, tam, r, invert=false) {
    translate([0,0, z])
    for (i = [0 : 0.4 : tam]) {
        translate([0, 0, invert ? (tam - i) : i])
        linear_extrude(height = 0.41)
            difference() {
                mi_diseno(r + 0.1);
                mi_diseno(r - i);
            }
    }
}

// =============================================================
// MÓDULOS DE PIEZAS GENERABLES (CUERPO Y COMPONENTES)
// =============================================================

module cuerpo_letra() {
    R_Int = Tolerancia_Calce;
    union() {
        if (Grosor_Base_Solida > 0) {
            linear_extrude(height = Grosor_Base_Solida) 
                mi_diseno(Pared_Externa + R_Int);
        }

        difference() {
            linear_extrude(height = Altura_Corporea) 
                mi_diseno(Pared_Externa + R_Int);
            
            if (Tipo_de_Proyecto == "Pared_Continua_Frontal") {
                // TU MODO ORIGINAL PERFECTO: Rebaja el frente para el acrílico y vacía el centro
                translate([0,0, Altura_Corporea - Grosor_Acrilico_Frontal])
                    linear_extrude(height = Grosor_Acrilico_Frontal + 1) mi_diseno(R_Int);
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Altura_Corporea + 2) mi_diseno(R_Int - Ancho_Soporte_Interno);
            }
            
            else if (Tipo_de_Proyecto == "Efecto_Infinito") {
                translate([0,0, Altura_Corporea - Grosor_Acrilico_Frontal])
                    linear_extrude(height = Grosor_Acrilico_Frontal + 1) mi_diseno(R_Int);
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Grosor_Acrilico_Trasero + 1) mi_diseno(R_Int);
                translate([0,0, -1])
                    linear_extrude(height = Altura_Corporea + 2) mi_diseno(R_Int - Ancho_Soporte_Interno);
            }

            else if (Tipo_de_Proyecto == "Ajuste_Trasero_Muesca") {
                translate([0,0, Altura_Muesca_Z + Grosor_Base_Solida])
                    linear_extrude(height = Altura_Corporea + 1) mi_diseno(R_Int);
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Altura_Muesca_Z + 1) mi_diseno(R_Int - Ancho_Muesca_X);
            }
            
            else if (Tipo_de_Proyecto == "Muesca_Plana_Frontal") {
                // MODO ALTERNATIVO (Por si quieres usar un ancho de pestaña distinto al "Ancho_Soporte_Interno")
                translate([0,0, Altura_Corporea - Grosor_Acrilico_Frontal])
                    linear_extrude(height = Grosor_Acrilico_Frontal + 1) mi_diseno(R_Int);
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Altura_Corporea + 2) mi_diseno(R_Int - Ancho_Muesca_X);
            }

            else {
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Altura_Corporea + 2) mi_diseno(R_Int);
            }
        }

        if (Tipo_de_Proyecto == "Soporte_Triangular_Simple" || Tipo_de_Proyecto == "Apoyo_Doble") {
            Z_Sup = Altura_Corporea - Grosor_Material_Acrilico - Tamano_Triangulo;
            dibujar_triangulos(Z_Sup, Tamano_Triangulo, R_Int);
            
            if (Tipo_de_Proyecto == "Apoyo_Doble") {
                dibujar_triangulos(Altura_Soporte_Inf + Grosor_Base_Solida, Tamano_Triangulo, R_Int, invert=true);
            }
        }
    }
}

// --- MÓDULO: TAPA FRONTAL CON ENCASTE (RECONSTRUIDO PARA EVITAR ERRORES) ---
module tapa_frontal_con_encaste() {
    R_Outer = Tolerancia_Calce - Holgura_Tapa_Frontal;
    R_Encastre = (R_Outer - Distancia_Borde_Pestana_Frontal > 0) ? R_Outer - Distancia_Borde_Pestana_Frontal : R_Outer * 0.8;
    
    union() {
        linear_extrude(height = Grosor_Base_Tapa_Frontal)
            mi_diseno(R_Outer);
        
        if (Altura_Pestana_Frontal > 0 && (R_Encastre - Grosor_Pestana_Frontal) > 0) {
            translate([0, 0, Grosor_Base_Tapa_Frontal])
                linear_extrude(height = Altura_Pestana_Frontal)
                    difference() {
                        mi_diseno(R_Encastre);
                        mi_diseno(R_Encastre - Grosor_Pestana_Frontal);
                    }
        }
    }
}

// --- MÓDULO: TAPA TRASERA ENCAJABLE ---
module tapa_encajable() {
    R_T = Tolerancia_Calce - Holgura_Tapa;
    union() {
        linear_extrude(height = Grosor_Base_Tapa)
            mi_diseno(Pared_Externa + R_T);
        translate([0, 0, Grosor_Base_Tapa])
        linear_extrude(height = Altura_Pared_Tapa)
            difference() {
                mi_diseno(R_T);
                mi_diseno(R_T - Grosor_Pared_Tapa);
            }
    }
}

// --- MÓDULO: BLOQUEADOR DE LUZ ---
module bloqueador_luz() {
    R_B = Tolerancia_Calce - Holgura_Bloqueador;
    Altura_Bloqueador_Calculada = Altura_Corporea - Grosor_Acrilico_Frontal - Grosor_Base_Solida - 0.2;
    
    translate([0, 0, Grosor_Base_Solida + 0.1]) {
        linear_extrude(height = Altura_Bloqueador_Calculada) {
            difference() {
                mi_diseno(R_B);
                mi_diseno(R_B - Pared_Bloqueador);
            }
        }
    }
}

// =============================================================
// LOGICA DE CONTROL DE INTERFAZ Y RENDERS
// =============================================================

if (Renderizar == "Letra_Principal") {
    cuerpo_letra();
} else if (Renderizar == "Tapa_Frontal_Para_Muesca") {
    tapa_frontal_con_encaste();
} else if (Renderizar == "Tapa_Trasera_Encajable") {
    tapa_encajable();
} else if (Renderizar == "Bloqueador_Luz_Antifuga") {
    bloqueador_luz();
} else if (Renderizar == "Vector_Corte_Base_CNC") {
    projection(cut = false) {
        mi_diseno(Pared_Externa + Tolerancia_Calce + Holgura_Corte_Base_CNC);
    }
}