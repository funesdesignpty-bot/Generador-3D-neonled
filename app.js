// =============================================================
// MOTOR DE LECTURA DE NEON FLEX PRO PLUS - V5.5 (CORREGIDO)
// =============================================================

let openscadInstance = null;
let scriptOriginal = "";
const NOMBRE_ARCHIVO_SCAD = "letras.scad";

window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";

    try {
        // Cargar SCAD
        const response = await fetch(NOMBRE_ARCHIVO_SCAD + "?v=" + new Date().getTime());
        scriptOriginal = await response.text();
        
        // Iniciar OpenSCAD
        openscadInstance = await OpenSCAD({
            id: "viewer",
            container: document.getElementById("viewer")
        });

        // Construir interfaz
        construirInterfaz(scriptOriginal);

        // Eventos de botones
        document.getElementById('btn-render').addEventListener('click', compilar);
        document.getElementById('btn-export').addEventListener('click', exportarSTL);

        // Manejo de subida de SVG
        setupSvgUpload();

        // Render inicial automático
        loader.style.display = "none";
        setTimeout(() => {
            compilar(); // Primer render
        }, 800);

    } catch (err) {
        console.error(err);
        loader.innerText = "Error al cargar el archivo. Verifica que letras.scad exista.";
    }
});

function setupSvgUpload() {
    const svgInput = document.getElementById('svg-file');
    svgInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const loader = document.getElementById('loading');
        loader.style.display = "block";
        loader.innerText = "Procesando SVG...";

        try {
            // Crear archivo diseno.svg en el sistema de archivos virtual de OpenSCAD
            const arrayBuffer = await file.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);
            
            if (openscadInstance.FS) {
                openscadInstance.FS.writeFile("diseno.svg", uint8);
                console.log("✅ SVG cargado correctamente");
                compilar(); // Re-renderizar
            } else {
                alert("El visor OpenSCAD no está listo aún. Intenta de nuevo.");
            }
        } catch (err) {
            console.error(err);
            alert("Error al procesar el SVG");
        } finally {
            loader.style.display = "none";
        }
    });
}

function obtenerParametrosActuales() {
    const params = [];
    document.querySelectorAll('#dynamic-params input, #dynamic-params select').forEach(el => {
        const id = el.id;
        if (id.startsWith('param-')) {
            const nombre = id.replace('param-', '');
            let valor = el.value;
            
            // Mantener comillas en strings
            if (isNaN(valor) && !["si", "no"].includes(valor)) {
                valor = `"${valor}"`;
            }
            params.push({ nombre, valor });
        }
    });
    return params;
}

async function compilar() {
    if (!openscadInstance) {
        console.error("OpenSCAD no está inicializado");
        return;
    }

    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Generando modelo 3D...";

    try {
        let scriptModificado = scriptOriginal;
        const parametros = obtenerParametrosActuales();

        parametros.forEach(({ nombre, valor }) => {
            const regex = new RegExp(`${nombre}\\s*=\\s*[^;]+;`, 'g');
            scriptModificado = scriptModificado.replace(regex, `${nombre} = ${valor};`);
        });

        await openscadInstance.setScript(scriptModificado);
        await openscadInstance.render();

    } catch (err) {
        console.error("Error en compilación:", err);
        alert("Error al generar el modelo 3D. Revisa la consola.");
    } finally {
        loader.style.display = "none";
    }
}

async function exportarSTL() {
    if (!openscadInstance) return;
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Exportando STL...";

    try {
        const stlData = await openscadInstance.exportSTL();
        const blob = new Blob([stlData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'neon_flex_pro_plus.stl';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error(err);
        alert("Error al exportar STL");
    } finally {
        loader.style.display = "none";
    }
}

// Mantener la función original de construcción de interfaz
function construirInterfaz(scadText) {
    const contenedor = document.getElementById('dynamic-params');
    contenedor.innerHTML = ''; // Limpiar por si acaso
    const lineas = scadText.split('\n');

    lineas.forEach(linea => {
        if (linea.includes("=") && linea.includes("// [") && !linea.startsWith("//")) {
            let partes = linea.split("=");
            let nombre = partes[0].trim();
            let resto = partes[1].split("//")[1].replace("[", "").replace("]", "").trim();
            let valorActual = partes[1].split("//")[0].replace(";", "").trim();

            const div = document.createElement('div');
            div.className = "control-group";
            
            const label = document.createElement('label');
            label.innerText = nombre.replace(/_/g, " ");
            div.appendChild(label);

            if (resto.includes(":")) { // Slider
                let [min, step, max] = resto.split(":");
                let input = document.createElement('input');
                input.type = "range";
                input.min = min; 
                input.max = max; 
                input.step = step;
                input.value = valorActual;
                input.id = `param-${nombre}`;
                input.addEventListener('input', () => { /* debounce opcional */ });
                input.addEventListener('change', compilar);
                div.appendChild(input);
            } else { // Selector
                let opciones = resto.split(",");
                let select = document.createElement('select');
                select.id = `param-${nombre}`;
                opciones.forEach(op => {
                    let opt = document.createElement('option');
                    opt.value = op.trim();
                    opt.innerText = op.trim();
                    if (op.trim() === valorActual.replace(/"/g, "")) opt.selected = true;
                    select.appendChild(opt);
                });
                select.addEventListener('change', compilar);
                div.appendChild(select);
            }
            contenedor.appendChild(div);
        }
    });
}
