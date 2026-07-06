// =============================================================
// GENERADOR DE LETRAS CORPÓREAS PRO - V5.2 (ULTRA-PARAMETRIC)
// Funes Design & Marketing Solutions - David, Chiriquí
// =============================================================

/* [1. SELECCIÓN DE PIEZA Y MODO] */
// Qué pieza deseas generar e imprimir en este momento
Renderizar = "Letra_Principal"; // [Letra_Principal, Tapa_Frontal_Para_Muesca, Tapa_Trasera_Encajable, Bloqueador_Luz_Antifuga]
// Configuración estructural y de ensamble de la letra principal
Tipo_de_Proyecto = "Pared_Continua_Frontal"; // [Pared_Continua_Frontal, Efecto_Infinito, Ajuste_Trasero_Muesca, Soporte_Triangular_Simple, Apoyo_Doble, Muesca_Plana_Frontal]

/* [2. DIMENSIONES GLOBALES Y BASE] */
// Altura total del cuerpo de la letra corpórea (Eje Z)
Altura_Corporea = 35; // [5:1:150]
// Grosor de la pared exterior de la letra
Pared_Externa = 2.0; // [0.8:0.1:10]
// Tolerancia general de calce entre piezas mecánicas (unión holgada base)
Tolerancia_Calce = 0.15; // [0:0.01:1]
// Grosor del fondo de la letra (0 = Hueca / Sin fondo para albergar LEDs)
Grosor_Base_Solida = 0.0; // [0:0.4:10]
// Activar efecto espejo para impresión invertida o moldes
Espejo = 0; // [0:1]

/* [3. CONFIG: SOPORTE DE PARED (FRONTAL / INFINITO)] */
// Grosor del acrílico o tapa frontal liso
Grosor_Acrilico_Frontal = 3.0; // [1:0.1:10]
// Grosor del acrílico trasero (Exclusivo para Modo Efecto Infinito)
Grosor_Acrilico_Trasero = 3.0; // [1:0.1:10]
// Distancia que extruye la pestaña interna hacia el centro para soportar las tapas
Ancho_Soporte_Interno = 2.5; // [1:0.1:15]

/* [4. CONFIG: MUESCA PLANA AJUSTABLE (TRASERA Y FRONTAL)] */
// Altura o grosor del escalón de la muesca desde su base de apoyo
Altura_Muesca_Z = 1.6; // [0.4:0.1:20]
// Ancho o profundidad horizontal de la pestaña de la muesca
Ancho_Muesca_X = 2.5; // [1:0.1:15]

/* [5. CONFIG: SOPORTES TRIANGULARES] */
// Cateto horizontal y vertical del refuerzo triangular interno
Tamano_Triangulo = 3.6; // [1:0.1:15]
// Espesor del material frontal para nivelación del soporte triangular superior
Grosor_Material_Acrilico = 3.0; // [1:0.1:10]
// Altura de posicionamiento del soporte inferior (Solo en Apoyo Doble)
Altura_Soporte_Inf = 3.0; // [1:0.1:20]

/* [6. CONFIG: TAPAS IMPRESAS (TRASERA / FRONTAL)] */
// Grosor de la base/cara plana de la tapa (Frontal o Trasera)
Grosor_Base_Tapa = 3.0; // [0.5:0.1:10]
// Altura de la pestaña/pared de fricción (Solo para Tapa Trasera Encajable)
Altura_Pared_Tapa = 5.0; // [1:0.1:30]
// Grosor de la pestaña/pared de fricción (Solo para Tapa Trasera Encajable)
Grosor_Pared_Tapa = 1.5; // [0.5:0.1:5]
// Holgura perimetral extra para asegurar que entren sin limar (Compensación de filamento)
Holgura_Tapa = 0.15; // [0:0.05:1]

/* [7. CONFIG: NUEVOS PARÁMETROS - BLOQUEADOR DE LUZ] */
// Espesor de la pared de la inserción bloqueadora (Debe ser delgada para no quitar espacio al LED)
Pared_Bloqueador = 0.8; // [0.4:0.1:2]
// Holgura perimetral para que el bloqueador deslice perfectamente dentro del cuerpo principal
Holgura_Bloqueador = 0.15; // [0:0.05:1]

/* [8. CALIDAD] */
// Definición de fragmentación para curvas (Resolución del círculo)
$fn = 100;

// =============================================================
// MÓDULOS DE GEOMETRÍA VECTORIAL Y AUXILIARES
// =============================================================

// --- MÓDULO BASE VECTORIAL ---
module mi_diseno(offset_r = 0) {
    mirror([(Espejo == 1 ? 1 : 0), 0, 0]) {
        offset(r = offset_r) import("diseno.svg", center = true);
    }
}

// --- MÓDULO: SOPORTES INTERNOS ---
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

// --- CONSTRUCCIÓN DE CUERPO PRINCIPAL ---
module cuerpo_letra() {
    R_Int = Tolerancia_Calce;
    union() {
        // BASE SÓLIDA (Si el grosor configurado es mayor a 0)
        if (Grosor_Base_Solida > 0) {
            linear_extrude(height = Grosor_Base_Solida) 
                mi_diseno(Pared_Externa + R_Int);
        }

        difference() {
            // PARED EXTERIOR TOTAL
            linear_extrude(height = Altura_Corporea) 
                mi_diseno(Pared_Externa + R_Int);
            
            // VACIADOS SEGÚN EL MODO SELECCIONADO
            if (Tipo_de_Proyecto == "Pared_Continua_Frontal") {
                // Vaciado del acrílico superior
                translate([0,0, Altura_Corporea - Grosor_Acrilico_Frontal])
                    linear_extrude(height = Grosor_Acrilico_Frontal + 1) mi_diseno(R_Int);
                // Vaciado del centro interior (deja la pestaña interna de soporte)
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
                // Vaciado principal interno de la letra
                translate([0,0, Altura_Muesca_Z + Grosor_Base_Solida])
                    linear_extrude(height = Altura_Corporea + 1) mi_diseno(R_Int);
                // Vaciado del escalón inferior para la muesca
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Altura_Muesca_Z + 1) mi_diseno(R_Int - Ancho_Muesca_X);
            }
            
            else if (Tipo_de_Proyecto == "Muesca_Plana_Frontal") {
                // CORTE ESTILO CREALITY: El rebaje frontal se auto-ajusta exactamente al Grosor_Acrilico_Frontal
                translate([0,0, Altura_Corporea - Grosor_Acrilico_Frontal])
                    linear_extrude(height = Grosor_Acrilico_Frontal + 1) mi_diseno(R_Int);
                // Vaciado central interno libre, respetando el ancho de la muesca configurado
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Altura_Corporea + 2) mi_diseno(R_Int - Ancho_Muesca_X);
            }

            else {
                // Modos Triangulares (Vaciado limpio completo desde la base)
                translate([0,0, Grosor_Base_Solida - 1])
                    linear_extrude(height = Altura_Corporea + 2) mi_diseno(R_Int);
            }
        }

        // AGREGAR SOPORTES TRIANGULARES (Si aplica)
        if (Tipo_de_Proyecto == "Soporte_Triangular_Simple" || Tipo_de_Proyecto == "Apoyo_Doble") {
            // Nivelación automática superior
            Z_Sup = Altura_Corporea - Grosor_Material_Acrilico - Tamano_Triangulo;
            dibujar_triangulos(Z_Sup, Tamano_Triangulo, R_Int);
            
            if (Tipo_de_Proyecto == "Apoyo_Doble") {
                // Posición manual inferior
                dibujar_triangulos(Altura_Soporte_Inf + Grosor_Base_Solida, Tamano_Triangulo, R_Int, invert=true);
            }
        }
    }
}

// --- MÓDULO: TAPA FRONTAL LISA PARA MUESCA ---
module tapa_frontal_lisa() {
    // Calculamos el radio de la tapa restando la holgura para un calce perfecto en la muesca
    R_TF = Tolerancia_Calce - Holgura_Tapa;
    
    // Extruye la tapa lisa con el espesor configurado para las tapas impresas
    linear_extrude(height = Grosor_Base_Tapa)
        mi_diseno(R_TF);
}

// --- MÓDULO: TAPA TRASERA ENCAJABLE TRADICIONAL ---
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

// --- MÓDULO: BLOQUEADOR DE LUZ ULTRA-FINO (SHROUD INTERNO) ---
module bloqueador_luz() {
    // Ajuste perimetral interno considerando la holgura asignada al bloqueador
    R_B = Tolerancia_Calce - Holgura_Bloqueador;
    // La altura se calcula restando la muesca frontal y la base sólida para que quede oculto debajo de la tapa
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
// LOGICA DE CONTROL DE INTERFAZ Y REQUERIMIENTO DE RENDERS
// =============================================================

if (Renderizar == "Letra_Principal") {
    cuerpo_letra();
} else if (Renderizar == "Tapa_Frontal_Para_Muesca") {
    tapa_frontal_lisa();
} else if (Renderizar == "Tapa_Trasera_Encajable") {
    tapa_encajable();
} else if (Renderizar == "Bloqueador_Luz_Antifuga") {
    bloqueador_luz();
}