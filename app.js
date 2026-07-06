// =============================================================
// MOTOR INTEGRAL: LECTOR + CARGADOR SVG + COMPILADOR
// =============================================================

let openscadInstance = null;
let scriptOriginal = "";
const NOMBRE_ARCHIVO_SCAD = "letras.scad";

window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Inicializando motor 3D...";

    // 1. Cargar el SCAD base
    const response = await fetch(NOMBRE_ARCHIVO_SCAD + "?v=" + new Date().getTime());
    scriptOriginal = await response.text();

    // 2. Iniciar OpenSCAD
    openscadInstance = await OpenSCAD({ id: "viewer", container: document.getElementById("viewer") });

    // 3. Crear la interfaz
    construirInterfaz(scriptOriginal);

    // 4. Listeners para botones
    document.getElementById('btn-render').addEventListener('click', compilar);
    document.getElementById('svg-file').addEventListener('change', manejarSubidaSVG);
    document.getElementById('btn-export').addEventListener('click', exportarSTL);

    loader.style.display = "none";
});

function construirInterfaz(scadText) {
    const contenedor = document.getElementById('dynamic-params');
    const lineas = scadText.split('\n');
    lineas.forEach(linea => {
        if (linea.includes("=") && linea.includes("// [") && !linea.startsWith("//")) {
            let partes = linea.split("=");
            let nombre = partes[0].trim();
            let resto = partes[1].split("//")[1].replace("[", "").replace("]", "").trim();
            let valorActual = partes[1].split("//")[0].replace(";", "").trim();

            const div = document.createElement('div');
            div.className = "control-group";
            div.innerHTML = `<label>${nombre.replace(/_/g, " ")}</label>`;
            
            if (resto.includes(":")) {
                div.innerHTML += `<input type="range" id="param-${nombre}" min="${resto.split(":")[0]}" max="${resto.split(":")[2]}" step="${resto.split(":")[1]}" value="${valorActual}">`;
            } else {
                let options = resto.split(",").map(o => `<option value="${o.trim()}" ${o.trim() == valorActual.replace(/"/g,"") ? "selected" : ""}>${o.trim()}</option>`).join("");
                div.innerHTML += `<select id="param-${nombre}">${options}</select>`;
            }
            contenedor.appendChild(div);
        }
    });
}

async function manejarSubidaSVG(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
        openscadInstance.FS.writeFile("diseno.svg", ev.target.result);
        alert("SVG cargado en el motor.");
        compilar();
    };
    reader.readAsText(file);
}

async function compilar() {
    let scriptModificado = scriptOriginal;
    // Inyectar valores de la interfaz
    document.querySelectorAll('#dynamic-params input, #dynamic-params select').forEach(el => {
        let nombreVar = el.id.replace("param-", "");
        let valor = isNaN(el.value) ? `"${el.value}"` : el.value;
        let regex = new RegExp(`${nombreVar}\\s*=\\s*[^;]+;`, 'g');
        scriptModificado = scriptModificado.replace(regex, `${nombreVar} = ${valor};`);
    });

    try {
        openscadInstance.FS.writeFile("input.scad", scriptModificado);
        await openscadInstance.compile("input.scad");
        console.log("Compilación exitosa");
    } catch(e) {
        console.error("Error al renderizar:", e);
    }
}

async function exportarSTL() {
    await openscadInstance.generateSTL("input.scad", "modelo.stl");
    const data = openscadInstance.FS.readFile("modelo.stl");
    const blob = new Blob([data], {type: "application/octet-stream"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "letra_neon.stl";
    link.click();
}
