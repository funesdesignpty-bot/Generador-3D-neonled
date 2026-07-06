/// =============================================================
// GENERADOR DE LETREROS NEON FLEX PRO PLUS - V5.5 (PERFECCIONADO)
// Funes Design 360 David, Chiriquí
// =============================================================

/* [1. SELECCIÓN DE MODO] */
Modo_de_Renderizado = "Con_Base_de_Union"; // [Solo_Letras, Con_Base_de_Union]
Ver = "completo"; // [completo, solo_base, solo_letras]

/* [2. ENTRADA DE DISEÑO] */
// RUTA ABSOLUTA CORREGIDA: Apunta exactamente a tu carpeta en el Escritorio de OneDrive
archivo_svg = "C:/Users/funes/OneDrive/Desktop/Proyecto Letras/diseno.svg"; 
Espejo = "no"; // [si, no]

/* [3. PARÁMETROS DEL CANAL NEON] */
Ancho_Canal = 6.2; // [5:0.1:10]
Profundidad_Canal = 12.5; // [5:0.5:20]
Grosor_Pared_Canal = 1.5; // [1:0.1:5]
Fondo_Canal = 1.0; // [0.5:0.1:5]

/* [4. PUENTES ESTRUCTURALES (5 SLIDERS)] */
Activar_P1 = "no"; // [si, no]
Ancho_P1 = 2.0; // [0.5:0.5:50]
Largo_P1 = 400; // [10:1:1000]
P1_X = 0; // [-500:1:500]
P1_Y = 60; // [-500:1:500]
R1 = 0; // [0:1:359]

Activar_P2 = "no"; // [si, no]
Ancho_P2 = 2.0; // [0.5:0.5:50]
Largo_P2 = 400; // [10:1:1000]
P2_X = 0; // [-500:1:500]
P2_Y = -60; // [-500:1:500]
R2 = 0; // [0:1:359]

Activar_P3 = "no"; // [si, no]
Ancho_P3 = 2.0; // [0.5:0.5:50]
Largo_P3 = 400; // [10:1:1000]
P3_X = 0; // [-500:1:500]
P3_Y = 0; // [-500:1:500]
R3 = 0; // [0:1:359]

Activar_P4 = "no"; // [si, no]
Ancho_P4 = 2.0; // [0.5:0.5:50]
Largo_P4 = 400; // [10:1:1000]
P4_X = 0; // [-500:1:500]
P4_Y = 0; // [-500:1:500]
R4 = 0; // [0:1:359]

Activar_P5 = "no"; // [si, no]
Ancho_P5 = 2.0; // [0.5:0.5:50]
Largo_P5 = 400; // [10:1:1000]
P5_X = 0; // [-500:1:500]
P5_Y = 0; // [-500:1:500]
R5 = 0; // [0:1:359]

/* [5. ANCLAJES PERFORANTES (4 SLIDERS)] */
Tipo_de_Anclaje = "Keyhole"; // [Circulo, Keyhole]
Diam_Anclaje = 4.0; // [2:0.1:15]
L_Keyhole = 10.0; // [5:1:40]
H_Oreja = 5.0; // [1:0.5:20]

Activar_A1 = "si"; // [si, no]
A1_X = -80; // [-500:1:500]
A1_Y = 50; // [-500:1:500]
Activar_A2 = "si"; // [si, no]
A2_X = 80; // [-500:1:500]
A2_Y = 50; // [-500:1:500]
Activar_A3 = "no"; // [si, no]
A3_X = -80; // [-500:1:500]
A3_Y = -50; // [-500:1:500]
Activar_A4 = "no"; // [si, no]
A4_X = 80; // [-500:1:500]
A4_Y = -50; // [-500:1:500]

/* [6. PASACABLES PERFORANTES (8 SLIDERS)] */
Diam_Pasacables = 3.5; // [1:0.1:10]

Activar_C1 = "no"; // [si, no]
C1_X = 0; // [-500:1:500]
C1_Y = 0; // [-500:1:500]
Activar_C2 = "no"; // [si, no]
C2_X = 10; // [-500:1:500]
C2_Y = 10; // [-500:1:500]
Activar_C3 = "no"; // [si, no]
C3_X = 0; // [-500:1:500]
C3_Y = 0; // [-500:1:500]
Activar_C4 = "no"; // [si, no]
C4_X = 0; // [-500:1:500]
C4_Y = 0; // [-500:1:500]
Activar_C5 = "no"; // [si, no]
C5_X = 0; // [-500:1:500]
C5_Y = 0; // [-500:1:500]
Activar_C6 = "no"; // [si, no]
C6_X = 0; // [-500:1:500]
C6_Y = 0; // [-500:1:500]
Activar_C7 = "no"; // [si, no]
C7_X = 0; // [-500:1:500]
C7_Y = 0; // [-500:1:500]
Activar_C8 = "no"; // [si, no]
C8_X = 0; // [-500:1:500]
C8_Y = 0; // [-500:1:500]

/* [7. CALIDAD Y BASE] */
Margen_Base = 8.0; // [0:0.5:50]
Alt_Base = 3.0; // [1:0.1:15]
Resolucion = 150; // [20:10:300]

// --- LÓGICA DE PROCESAMIENTO ---
$fn = Resolucion;
H_Total_Neon = Profundidad_Canal + Fondo_Canal;

// CORRECCIÓN REDONDEADA: Se fuerza el uso de offset(r) para puntas semicirculares perfectas
module motor_svg(dist) {
    mirror([(Espejo == "si" ? 1 : 0), 0, 0]) {
        offset(r = dist) import(archivo_svg, center = true);
    }
}

module draw_puente(act, w, l, x, y, r) {
    if (act == "si") {
        translate([x, y, 0]) rotate([0, 0, r])
            translate([-l/2, -w/2, 0]) cube([l, w, Alt_Base]);
    }
}

module draw_oreja_solida(act, x, y) {
    if (act == "si") {
        translate([x, y, 0]) {
            if (Tipo_de_Anclaje == "Keyhole") {
                hull() { 
                    cylinder(d=Diam_Anclaje+6, h=H_Oreja);
                    translate([0, L_Keyhole-5, 0]) cylinder(d=Diam_Anclaje+6, h=H_Oreja); 
                }
            } else { 
                cylinder(d=Diam_Anclaje+6, h=H_Oreja);
            }
        }
    }
}

// ENSAMBLE FINAL CON DIFERENCIA
difference() {
    union() {
        // PARTE 1: BASE Y PUENTES
        if (Ver != "solo_letras") {
            color("GhostWhite", 0.4) union() {
                linear_extrude(height = Alt_Base) motor_svg(Margen_Base);
                draw_puente(Activar_P1, Ancho_P1, Largo_P1, P1_X, P1_Y, R1);
                draw_puente(Activar_P2, Ancho_P2, Largo_P2, P2_X, P2_Y, R2);
                draw_puente(Activar_P3, Ancho_P3, Largo_P3, P3_X, P3_Y, R3);
                draw_puente(Activar_P4, Ancho_P4, Largo_P4, P4_X, P4_Y, R4);
                draw_puente(Activar_P5, Ancho_P5, Largo_P5, P5_X, P5_Y, R5);
                draw_oreja_solida(Activar_A1, A1_X, A1_Y);
                draw_oreja_solida(Activar_A2, A2_X, A2_Y);
                draw_oreja_solida(Activar_A3, A3_X, A3_Y);
                draw_oreja_solida(Activar_A4, A4_X, A4_Y);
            }
        }
        
        // PARTE 2: LETRAS NEON
        if (Ver != "solo_base") {
            color("DeepSkyBlue") translate([0, 0, (Ver == "solo_letras" ? 0 : Alt_Base)]) {
                difference() {
                    // Pared exterior del canal (Redondeada)
                    linear_extrude(height = H_Total_Neon) motor_svg((Ancho_Canal/2) + Grosor_Pared_Canal);
                    
                    // Vaciado interior usando el mismo motor_svg redondeado
                    translate([0, 0, Fondo_Canal]) linear_extrude(height = H_Total_Neon + 1) motor_svg(Ancho_Canal/2);
                    
                    // Limpieza externa de centros huérfanos
                    translate([0, 0, -1]) linear_extrude(height = H_Total_Neon + 2) difference() {
                        motor_svg((Ancho_Canal/2) + Grosor_Pared_Canal + 300);
                        motor_svg((Ancho_Canal/2) + Grosor_Pared_Canal);
                    }
                }
            }
        }
    }
    
    // PERFORACIONES GLOBALES (RESTAN A TODO EL UNION ANTERIOR)
    
    // Agujeros Anclajes
    anclajes = [[Activar_A1,A1_X,A1_Y],[Activar_A2,A2_X,A2_Y],[Activar_A3,A3_X,A3_Y],[Activar_A4,A4_X,A4_Y]];
    for(a=anclajes) if(a[0]=="si") translate([a[1], a[2], -5]) {
        if (Tipo_de_Anclaje == "Keyhole") {
            cylinder(d=Diam_Anclaje+3.5, h=H_Oreja+Alt_Base+20);
            hull() { 
                cylinder(d=Diam_Anclaje, h=H_Oreja+Alt_Base+20); 
                translate([0, L_Keyhole-5, 0]) cylinder(d=Diam_Anclaje, h=H_Oreja+Alt_Base+20); 
            }
        } else { 
            cylinder(d=Diam_Anclaje, h=H_Oreja+Alt_Base+20);
        }
    }

    // Agujeros Pasacables (Perforación profunda Z-10 a +30)
    cables = [[Activar_C1,C1_X,C1_Y],[Activar_C2,C2_X,C2_Y],[Activar_C3,C3_X,C3_Y],[Activar_C4,C4_X,C4_Y],
              [Activar_C5,C5_X,C5_Y],[Activar_C6,C6_X,C6_Y],[Activar_C7,C7_X,C7_Y],[Activar_C8,C8_X,C8_Y]];
    for(c=cables) if(c[0]=="si") translate([c[1], c[2], -10]) 
        cylinder(d=Diam_Pasacables, h=H_Total_Neon + Alt_Base + 30);
}