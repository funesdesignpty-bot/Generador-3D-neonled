// =============================================================
// MOTOR DE INTEGRACIÓN TOTAL OPENSCAD WASM - FUNES DESIGN 360
// Corrección de renderizado y lectura dinámica de variables v5.8
// =============================================================

let openscadInstance = null;
let archivoSvgContenido = "";
let scriptBaseOriginal = "";

// Clonamos exactamente los parámetros de tu archivo v5.8 para armar el panel izquierdo
scriptBaseOriginal = `
/* [1. ARCHIVO VECTORIAL] */
archivo_svg = "diseno.svg"; 

/* [2. SELECCIÓN DE PIEZA Y MODO] */
Renderizar = "Letra_Principal"; // [Letra_Principal, Tapa_Frontal_Para_Muesca, Tapa_Trasera_Encajable, Bloqueador_Luz_Antifuga, Vector_Corte_Base_CNC]
Tipo_de_Proyecto = "Pared_Continua_Frontal"; // [Pared_Continua_Frontal, Efecto_Infinito, Ajuste_Trasero_Muesca, Soporte_Triangular_Simple, Apoyo_Doble, Muesca_Plana_Frontal]

/* [3. DIMENSIONES GLOBALES Y BASE] */
Altura_Corporea = 35; // [5:1:150]
Pared_Externa = 2.0; // [0.8:0.1:10]
Tolerancia_Calce = 0.15; // [0:0.01:1]
Grosor_Base_Solida = 0.0; // [0:0.4:10]
Espejo = 0; // [0:1]

/* [4. CONFIG: SOPORTE DE PARED (FRONTAL / INFINITO)] */
Grosor_Acrilico_Frontal = 3.0; // [1:0.1:10]
Grosor_Acrilico_Trasero = 3.0; // [1:0.1:10]
Ancho_Soporte_Interno = 2.5; // [1:0.1:15]

/* [5. CONFIG: MUESCA PLANA AJUSTABLE (TRASERA Y FRONTAL)] */
Ancho_Muesca_X = 2.5; // [1:0.1:15]
Altura_Muesca_Z = 1.6; // [0.4:0.1:20]

/* [6. CONFIG: SOPORTE TRIANGULARES] */
Tamano_Triangulo = 3.6; // [1:0.1:15]
Grosor_Material_Acrilico = 3.0; // [1:0.1:10]
Altura_Soporte_Inf = 3.0; // [1:0.1:20]

/* [7. CONFIG: TAPA FRONTAL CON ENCASTE] */
Grosor_Base_Tapa_Frontal = 3.0; // [0.5:0.1:10]
Altura_Pestana_Frontal = 4.0; // [0:0.1:30]
Grosor_Pestana_Frontal = 1.5; // [0.5:0.1:5]
Distancia_Borde_Pestana_Frontal = 2.0; // [0:0.1:10]
Holgura_Tapa_Frontal = 0.15; // [0:0.05:1]

/* [8. CONFIG: TAPA TRASERA ENCAJABLE TRADICIONAL] */
Grosor_Base_Tapa = 2.0; // [0.5:0.1:10]
Altura_Pared_Tapa = 5.0; // [1:0.1:30]
Grosor_Pared_Tapa = 1.5; // [0.5:0.1:5]
Holgura_Tapa = 0.2; // [0:0.05:1]

/* [9. CONFIG: BLOQUEADOR DE LUZ] */
Pared_Bloqueador = 0.8; // [0.4:0.1:2]
Holgura_Bloqueador = 0.15; // [0:0.05:1]

/* [10. CONFIG: HUECO DE ENCASTRADO PARA BASE CNC] */
Holgura_Corte_Base_CNC = 0.25; // [0:0.05:2]
`;

// Inicializar el entorno WebAssembly de OpenSCAD
window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    
    try {
        openscadInstance = await OpenSCAD({
            id: "viewer",
            container: document.getElementById("viewer")
        });
        loader.style.display = "none";
        procesarEInyectarParametros(scriptBaseOriginal);
    } catch (err) {
        console.error("Error al arrancar OpenSCAD WASM:", err);
        loader.innerText = "Error al iniciar el motor matemático 3D.";
    }
});

// GENERADOR DINÁMICO DE DESLIZADORES E INTERFAZ
function procesarEInyectarParametros(scadText) {
    const contenedor = document.getElementById('dynamic-params');
    contenedor.innerHTML = "";
    const lineas = scadText.split('\n');

    lineas.forEach(linea => {
        linea = linea.trim();
        if (linea.startsWith("/* [") && linea.includes("] */")) {
            const h2 = document.createElement('h2');
            h2.innerText = linea.replace("/* [", "").replace("] */", "");
            contenedor.appendChild(h2);
            return;
        }
        if (!linea || linea.startsWith("//") || linea.startsWith("/*")) return;

        if (linea.includes("=") && linea.includes(";")) {
            const partes = linea.split(";");
            const declaracion = partes[0].split("=");
            const nombreVar = declaracion[0].trim();
            let valorDefecto = declaracion[1].trim().replace(/"/g, "");
            const comentario = partes[1] ? partes[1].replace("//", "").trim() : "";

            const divGrupo = document.createElement('div');
            divGrupo.className = "control-group";
            const label = document.createElement('label');
            label.id = `lbl-${nombreVar}`;
            label.innerText = `${nombreVar.replace(/_/g, ' ')}: ${valorDefecto}`;

            if (comentario.startsWith("[") && comentario.endsWith("]") && !comentario.includes(":")) {
                const opciones = comentario.replace("[", "").replace("]", "").split(",");
                const select = document.createElement('select');
                select.id = `param-${nombreVar}`;
                opciones.forEach(opt => {
                    const o = opt.trim();
                    const op = document.createElement('option');
                    op.value = o; op.innerText = o.replace(/_/g, ' ');
                    if (o === valorDefecto) op.selected = true;
                    select.appendChild(op);
                });
                select.addEventListener('change', () => {
                    label.innerText = `${nombreVar.replace(/_/g, ' ')}: ${select.value}`;
                    compilarDisenoReal();
                });
                divGrupo.appendChild(label); divGrupo.appendChild(select);
            } 
            else if (comentario.startsWith("[") && comentario.endsWith("]")) {
                const rango = comentario.replace("[", "").replace("]", "").split(":");
                let min = 0, step = 1, max = 100;
                if (rango.length === 3) { [min, step, max] = rango; } 
                else if (rango.length === 2) { [min, max] = rango; }

                const slider = document.createElement('input');
                slider.type = "range"; slider.id = `param-${nombreVar}`;
                slider.min = min; slider.max = max; slider.step = step;
                slider.value = parseFloat(valorDefecto);
                slider.addEventListener('input', () => {
                    label.innerText = `${nombreVar.replace(/_/g, ' ')}: ${slider.value}${isNaN(slider.value) ? '' : ' mm'}`;
                    compilarDisenoReal();
                });
                divGrupo.appendChild(label); divGrupo.appendChild(slider);
            }
            if (divGrupo.children.length > 0) contenedor.appendChild(divGrupo);
        }
    });
}

// CAPTURA VIRTUAL DE CUALQUIER SVG SUBIDO
const fileInput = document.getElementById('svg-file');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            archivoSvgContenido = event.target.result;
            if (openscadInstance) {
                // Guarda el SVG en el disco virtual usando siempre el alias interno exigido por tu script
                openscadInstance.FS.writeFile("diseno.svg", archivoSvgContenido);
            }
            alert("¡Archivo '" + file.name + "' cargado de forma correcta!");
            compilarDisenoReal();
        };
        reader.readAsText(file);
    });
}

// EJECUCIÓN DIRECTA DEL MOTOR MATEMÁTICO REAL
async function compilarDisenoReal() {
    if (!openscadInstance || !archivoSvgContenido) return;
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Calculando trayectorias vectoriales y ensambles 3D...";

    // Recolectamos el estado de los controles de la web
    let variablesModificadas = "$fn = 60;\n";
    const inputs = document.querySelectorAll('#sidebar input[type="range"], #sidebar select');
    inputs.forEach(input => {
        const idVar = input.id.replace('param-', '');
        const valor = isNaN(input.value) ? `"${input.value}"` : input.value;
        variablesModificadas += `${idVar} = ${valor};\n`;
    });

    try {
        // Buscamos el archivo estructural .scad que tienes en tu servidor de GitHub
        const response = await fetch('Generador_Letras_PRO_v5.scad');
        const scriptOriginalCompleto = await response.text();
        
        // Unimos tus funciones originales con las variables modificadas por el cliente
        const codigoFinalParaCompilar = variablesModificadas + "\n" + scriptOriginalCompleto;
        
        // Guardamos y ejecutamos la compilación real sin geometrías falsas
        openscadInstance.FS.writeFile("input.scad", codigoFinalParaCompilar);
        
        // El motor procesa el script y dibuja el letrero real en la pantalla derecha
        await openscadInstance.compile("input.scad");
        loader.style.display = "none";
    } catch (err) {
        console.error("Error crítico en compilación OpenSCAD:", err);
        loader.innerText = "Error al procesar el archivo. Verifica los nodos del SVG.";
    }
}

// BOTÓN EXPORTAR STL
document.getElementById('btn-export').addEventListener('click', async () => {
    if (!openscadInstance || !archivoSvgContenido) {
        alert("Por favor, sube primero tu diseño en formato SVG.");
        return;
    }
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Generando malla STL de producción...";

    await openscadInstance.generateSTL("input.scad", "produccion.stl");
    loader.style.display = "none";
    
    const stlBuffer = openscadInstance.FS.readFile("produccion.stl");
    const blob = new Blob([stlBuffer], { type: "application/octet-stream" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Letra_Corporea_FunesDesign.stl";
    link.click();
});
