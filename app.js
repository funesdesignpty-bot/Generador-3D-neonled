// =============================================================
// MOTOR DE INTEGRACIÓN OPENSCAD WASM - EDICIÓN NEÓN FLEX
// Funes Design 360 - Réplica exacta de parámetros JSON
// =============================================================

let openscadInstance = null;
let archivoSvgContenido = "";

// Definición exacta basada en tu set de valores predeterminados de Neón Flex
const configuracionNeonValores = [
    { tipo: "seccion", titulo: "Configuración de Archivo" },
    { id: "archivo_svg", etiqueta: "Archivo SVG", tipo: "texto", defecto: "diseno.svg" },
    
    { tipo: "seccion", titulo: "Selección de Pieza y Modo" },
    { id: "Tipo_de_Proyecto", etiqueta: "Tipo de Proyecto", tipo: "lista", opciones: ["Neon_Flex", "Acrilica_Fondo_Hueco", "Ajuste_Trasero_Muesca"], defecto: "Neon_Flex" },
    { id: "Exportar_Seccion", etiqueta: "Exportar Sección", tipo: "lista", opciones: ["completa", "cortada"], defecto: "completa" },
    { id: "Activar_Base_Union", etiqueta: "Activar Base Unión", tipo: "lista", opciones: ["no", "si"], defecto: "no" },
    { id: "Espejo", etiqueta: "Espejo", tipo: "lista", opciones: ["no", "si"], defecto: "no" },

    { tipo: "seccion", titulo: "Dimensiones del Canal de Neón" },
    { id: "Ancho_Canal_Neon", etiqueta: "Ancho Canal Neón", tipo: "rango", min: 3, max: 12, paso: 0.1, defecto: 6.0 },
    { id: "Profundidad_Canal", etiqueta: "Profundidad Canal", tipo: "rango", min: 5, max: 20, paso: 0.5, defecto: 11.0 },
    { id: "Pared_Neon", etiqueta: "Pared Neón", tipo: "rango", min: 1, max: 5, paso: 0.1, defecto: 2.3 },
    { id: "Fondo_Neon", etiqueta: "Fondo Neón", tipo: "rango", min: 0.5, max: 5, paso: 0.1, defecto: 1.5 },

    { tipo: "seccion", titulo: "Dimensiones de la Base Corpórea" },
    { id: "Altura_Corporea", etiqueta: "Altura Corpórea", tipo: "rango", min: 10, max: 100, paso: 1, defecto: 35 },
    { id: "Pared_Externa_Corp", etiqueta: "Pared Externa Corpórea", tipo: "rango", min: 1, max: 5, paso: 0.1, defecto: 2.0 },
    { id: "Soporte_Interno_Corp", etiqueta: "Soporte Interno", tipo: "rango", min: 1, max: 5, paso: 0.1, defecto: 2.5 },
    { id: "Distancia_Acritico_Tope", etiqueta: "Distancia Acrílico Tope", tipo: "rango", min: 1, max: 10, paso: 0.5, defecto: 5.0 },

    { tipo: "seccion", titulo: "Estructura de Unión y Cama" },
    { id: "Altura_Base_Union", etiqueta: "Altura Base Unión", tipo: "rango", min: 1, max: 10, paso: 0.5, defecto: 2.0 },
    { id: "Margen_Base_Union", etiqueta: "Margen Base Unión", tipo: "rango", min: 0, max: 20, paso: 1, defecto: 0 },
    { id: "Tamano_Cama", etiqueta: "Tamaño de Cama Impresora", tipo: "rango", min: 100, max: 500, paso: 10, defecto: 220 }
];

// Inicializar el compilador WebAssembly
window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    
    try {
        openscadInstance = await OpenSCAD({
            id: "viewer",
            container: document.getElementById("viewer")
        });
        loader.style.display = "none";
        generarInterfazControles();
    } catch (err) {
        console.error("Error al iniciar OpenSCAD WASM:", err);
        loader.innerText = "Error crítico al iniciar el motor de renderizado 3D.";
    }
});

// Construcción dinámica de campos en la barra lateral basándonos en el JSON original
function generarInterfazControles() {
    const contenedor = document.getElementById('dynamic-params');
    contenedor.innerHTML = "";

    configuracionNeonValores.forEach(item => {
        if (item.tipo === "seccion") {
            const h2 = document.createElement('h2');
            h2.innerText = item.titulo;
            contenedor.appendChild(h2);
            return;
        }

        const divGrupo = document.createElement('div');
        divGrupo.className = "control-group";

        const label = document.createElement('label');
        label.id = `lbl-${item.id}`;
        label.innerText = `${item.etiqueta}: ${item.defecto}`;
        divGrupo.appendChild(label);

        if (item.tipo === "lista") {
            const select = document.createElement('select');
            select.id = `param-${item.id}`;
            item.opciones.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.innerText = opt.replace(/_/g, ' ');
                if (opt === item.defecto) option.selected = true;
                select.appendChild(option);
            });
            select.addEventListener('change', () => {
                label.innerText = `${item.etiqueta}: ${select.value}`;
                compilarDisenoReal();
            });
            divGrupo.appendChild(select);
        } 
        else if (item.tipo === "rango") {
            const slider = document.createElement('input');
            slider.type = "range";
            slider.id = `param-${item.id}`;
            slider.min = item.min;
            slider.max = item.max;
            slider.step = item.paso;
            slider.value = item.defecto;
            slider.addEventListener('input', () => {
                label.innerText = `${item.etiqueta}: ${slider.value} mm`;
                compilarDisenoReal();
            });
            divGrupo.appendChild(slider);
        }
        else if (item.tipo === "texto") {
            const inputTexto = document.createElement('select'); // Fijo para mantener la equivalencia del archivo alias
            inputTexto.id = `param-${item.id}`;
            const opt = document.createElement('option');
            opt.value = "diseno.svg"; opt.innerText = "diseno.svg";
            inputTexto.appendChild(opt);
            inputTexto.disabled = true;
            divGrupo.appendChild(inputTexto);
        }

        contenedor.appendChild(divGrupo);
    });
}

// Lector de archivos SVG locales
const fileInput = document.getElementById('svg-file');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            archivoSvgContenido = event.target.result;
            if (openscadInstance) {
                openscadInstance.FS.writeFile("diseno.svg", archivoSvgContenido);
            }
            alert(`¡Base de Neón '${file.name}' vinculada con éxito!`);
            compilarDisenoReal();
        };
        reader.readAsText(file);
    });
}

// Compilador en tiempo real
async function compilarDisenoReal() {
    if (!openscadInstance || !archivoSvgContenido) return;
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Vaciando canales de Neón Flex en el vector 3D...";

    // Armando cadena de variables modificadas para inyectar sobreescribiendo el .scad
    let variablesModificadas = "$fn = 60;\n";
    configuracionNeonValores.forEach(item => {
        if (item.tipo === "seccion") return;
        const input = document.getElementById(`param-${item.id}`);
        if (input) {
            let valor = input.value;
            // Si es un string y no es un número puro, lo envolvemos con comillas para OpenSCAD
            if (isNaN(valor)) {
                valor = `"${valor}"`;
            }
            variablesModificadas += `${item.id} = ${valor};\n`;
        }
    });

    try {
        const response = await fetch('Generador_Letras_PRO_v5.scad');
        const scriptOriginalCompleto = await response.text();
        
        // Unificamos las variables de los deslizadores con la lógica interna del script .scad
        const codigoFinalParaCompilar = variablesModificadas + "\n" + scriptOriginalCompleto;
        
        openscadInstance.FS.writeFile("input.scad", codigoFinalParaCompilar);
        await openscadInstance.compile("input.scad");
        loader.style.display = "none";
    } catch (err) {
        console.error("Error al compilar Neón:", err);
        loader.innerText = "Error matemático en el trazo del SVG.";
    }
}

// Botón de ejecución manual por si no compila automáticamente
const btnRender = document.getElementById('btn-render');
if (btnRender) {
    btnRender.addEventListener('click', () => {
        compilarDisenoReal();
    });
}

// Exportación de STL limpia
document.getElementById('btn-export').addEventListener('click', async () => {
    if (!openscadInstance || !archivoSvgContenido) {
        alert("Primero debes seleccionar un archivo SVG.");
        return;
    }
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Generando archivo STL para impresión 3D...";

    await openscadInstance.generateSTL("input.scad", "produccion.stl");
    loader.style.display = "none";
    
    const stlBuffer = openscadInstance.FS.readFile("produccion.stl");
    const blob = new Blob([stlBuffer], { type: "application/octet-stream" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Letrero_NeonFlex_FunesDesign.stl";
    link.click();
});
