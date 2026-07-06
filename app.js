// =============================================================
// MOTOR DE INTEGRACIÓN TOTAL OPENSCAD WASM - FUNES DESIGN 360
// Ejecución fiel del script original v5.8 con mapeo virtual de SVG
// =============================================================

let openscadInstance = null;
let archivoSvgContenido = "";
let scriptBaseOriginal = "";

// Cargamos de forma textual exacta la cabecera de tu archivo original para clonar el Customizer
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
Altura_Muesca_Z = 1.6; // [0.4:0.1:20]
Ancho_Muesca_X = 2.5; // [1:0.1:15]

/* [6. CONFIG: SOPORTES TRIANGULARES] */
Tamano_Triangulo = 3.6; // [1:0.1:15]
Grosor_Material_Acrilico = 3.0; // [1:0.1:10]
Altura_Soporte_Inf = 3.0; // [1:0.1:20]

/* [7. CONFIG: TAPAS IMPRESAS (TRASERA / FRONTAL)] */
Grosor_Base_Tapa = 3.0; // [0.5:0.1:10]
Altura_Pared_Tapa = 5.0; // [1:0.1:30]
Grosor_Pared_Tapa = 1.5; // [0.5:0.1:5]
Holgura_Tapa = 0.15; // [0:0.05:1]

/* [8. CONFIG: NUEVOS PARÁMETROS - BLOQUEADOR DE LUZ] */
Pared_Bloqueador = 0.8; // [0.4:0.1:2]
Holgura_Bloqueador = 0.15; // [0:0.05:1]

/* [9. CALIDAD] */
$fn = 60; // [30:10:120]
`;

// Inicializar el compilador oficial OpenSCAD de la Web
window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    
    try {
        // Inicializa el contenedor WebAssembly de OpenSCAD.org
        openscadInstance = await OpenSCAD({
            id: "viewer",
            container: document.getElementById("viewer")
        });
        loader.style.display = "none";
        procesarEInyectarParametros(scriptBaseOriginal);
    } catch (err) {
        console.error("Error al arrancar OpenSCAD WASM:", err);
        loader.innerText = "Error al iniciar el motor 3D en este navegador.";
    }
});

// --- LECTOR DINÁMICO DE INTERFAZ ORIGINAL ---
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

// --- INTERCEPCIÓN DINÁMICA DE CUALQUIER ARCHIVO SVG ---
const fileInput = document.getElementById('svg-file');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            archivoSvgContenido = event.target.result;
            // Escribimos el contenido del SVG del cliente en el sistema de archivos virtual con el nombre estático
            if (openscadInstance) {
                openscadInstance.FS.writeFile("diseno.svg", archivoSvgContenido);
            }
            alert("¡Diseño '" + file.name + "' cargado y vinculado con éxito!");
            compilarDisenoReal();
        };
        reader.readAsText(file);
    });
}

// --- COMPILADOR OFICIAL OPENSCAD EN ACCIÓN ---
async function compilarDisenoReal() {
    if (!openscadInstance || !archivoSvgContenido) return;
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Compilando mallas corpóreas en tiempo real...";

    // Generamos el bloque de variables según los sliders actuales
    let variablesModificadas = "";
    const inputs = document.querySelectorAll('#sidebar input[type="range"], #sidebar select');
    inputs.forEach(input => {
        const idVar = input.id.replace('param-', '');
        const valor = isNaN(input.value) ? `"${input.value}"` : input.value;
        variablesModificadas += `${idVar} = ${valor};\n`;
    });

    // Descargamos o concatenamos el archivo maestro completo .scad que subiste (Módulos de vaciado, muescas, etc.)
    // Para simplificar la ejecución nativa, descargamos tu archivo original guardado en el servidor
    try {
        const response = await fetch('Generador_Letras_PRO_v5.scad');
        const scriptOriginalCompleto = await response.text();
        
        // Unimos las modificaciones de la web con el cuerpo del código de ingeniería
        const codigoFinalParaCompilar = variablesModificadas + "\n" + scriptOriginalCompleto;
        
        // Escribimos el código unificado en la memoria virtual
        openscadInstance.FS.writeFile("input.scad", codigoFinalParaCompilar);
        
        // Le ordenamos a OpenSCAD compilar el renderizado 3D real
        await openscadInstance.compile("input.scad");
        loader.style.display = "none";
    } catch (err) {
        console.error("Error en compilación de geometría:", err);
        loader.innerText = "Error en la topología del SVG. Revisa las líneas vectoriales.";
    }
}

// --- ACCIÓN DESCARGA DE STL DE FABRICACIÓN ---
document.getElementById('btn-export').addEventListener('click', async () => {
    if (!openscadInstance || !archivoSvgContenido) {
        alert("Sube un archivo SVG para poder exportar.");
        return;
    }
    alert("Generando archivo STL definitivo de alta precisión... Espera un momento.");
    
    // Ejecuta el comando nativo de exportación de OpenSCAD
    await openscadInstance.generateSTL("input.scad", "produccion.stl");
    
    // Descarga automática del archivo al navegador del cliente
    const stlBuffer = openscadInstance.FS.readFile("produccion.stl");
    const blob = new Blob([stlBuffer], { type: "application/octet-stream" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "FunesDesign_Letra_Corporea.stl";
    link.click();
});
