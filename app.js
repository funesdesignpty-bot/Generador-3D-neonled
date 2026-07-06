let openscad = null;
let scriptBase = "";
const SCAD_FILE = "letras.scad";

// 1. Inicialización del motor
window.addEventListener('DOMContentLoaded', async () => {
    openscad = await OpenSCAD({ id: "viewer", container: document.getElementById("viewer") });
    
    // Cargar archivo SCAD
    const resp = await fetch(SCAD_FILE + "?t=" + Date.now());
    scriptBase = await resp.text();
    
    // Crear UI automáticamente
    crearInterfaz(scriptBase);
    
    // Cargar SVG listener
    document.getElementById('svg-file').addEventListener('change', manejarSVG);
});

function crearInterfaz(scad) {
    const contenedor = document.getElementById('dynamic-params');
    const lineas = scad.split('\n');
    
    lineas.forEach(linea => {
        // Busca lineas tipo: Nombre = Valor; // [min:step:max] o // [opcion1, opcion2]
        if (linea.includes("=") && linea.includes("// [") && !linea.startsWith("//")) {
            const [izq, der] = linea.split("=");
            const nombre = izq.trim();
            const valorDefault = der.split("//")[0].replace(";", "").trim();
            const config = der.split("//")[1].replace(/[\[\]]/g, "").trim();

            const div = document.createElement('div');
            div.className = "control-group";
            div.innerHTML = `<label>${nombre.replace(/_/g, ' ')}</label>`;

            if (config.includes(":")) {
                const [min, step, max] = config.split(':');
                div.innerHTML += `<input type="range" id="p-${nombre}" min="${min}" max="${max}" step="${step}" value="${valorDefault}">`;
            } else {
                const opts = config.split(',');
                div.innerHTML += `<select id="p-${nombre}">` + opts.map(o => `<option value="${o.trim()}">${o.trim()}</option>`).join('') + `</select>`;
            }
            contenedor.appendChild(div);
            div.querySelector('input, select').addEventListener('change', actualizarRender);
        }
    });
}

async function manejarSVG(e) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        openscad.FS.writeFile("diseno.svg", ev.target.result);
        actualizarRender();
    };
    reader.readAsText(e.target.files[0]);
}

async function actualizarRender() {
    let scriptModificado = scriptBase;
    document.querySelectorAll('#dynamic-params input, #dynamic-params select').forEach(el => {
        const nombre = el.id.replace('p-', '');
        const valor = isNaN(el.value) ? `"${el.value}"` : el.value;
        scriptModificado = scriptModificado.replace(new RegExp(`${nombre}\\s*=\\s*[^;]+;`), `${nombre} = ${valor};`);
    });
    
    openscad.FS.writeFile("input.scad", scriptModificado);
    await openscad.compile("input.scad");
}
