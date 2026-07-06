// =============================================================
// MOTOR DINÁMICO - LECTURA AUTOMÁTICA DE SCAD (ANTI-CACHÉ)
// =============================================================

let openscadInstance = null;
let archivoSvgContenido = "";
let scriptOriginal = "";
let parametrosVariables = []; 

// Nombre ultra simplificado para evitar errores de Windows
const NOMBRE_ARCHIVO_SCAD = "letras.scad";

window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Descargando código Neón Flex...";

    // Agregamos "?v=" + fecha para obligar al navegador a descargar la versión más nueva de tu archivo y evadir el caché
    try {
        const response = await fetch(NOMBRE_ARCHIVO_SCAD + "?v=" + new Date().getTime());
        if (!response.ok) throw new Error("No se encontró el archivo SCAD");
        scriptOriginal = await response.text();
        
        construirInterfazDesdeSCAD(scriptOriginal);
    } catch (err) {
        console.error(err);
        loader.innerHTML = `Error crítico: Por favor, asegúrate de que tu archivo se llame exactamente <b>${NOMBRE_ARCHIVO_SCAD}</b> en GitHub.`;
        return;
    }

    try {
        loader.innerText = "Iniciando motor matemático 3D...";
        openscadInstance = await OpenSCAD({
            id: "viewer",
            container: document.getElementById("viewer")
        });
        loader.style.display = "none";
    } catch (err) {
        console.error("Error al iniciar OpenSCAD WASM:", err);
        loader.innerText = "Error en el visualizador 3D.";
    }
});

// Analizador de texto que lee tu código SCAD y dibuja la botonera
function construirInterfazDesdeSCAD(scadText) {
    const contenedor = document.getElementById('dynamic-params');
    contenedor.innerHTML = "";
    parametrosVariables = []; 

    const lineas = scadText.split('\n');

    lineas.forEach(linea => {
        linea = linea.trim();
        
        if (linea.startsWith("/* [") && linea.includes("] */")) {
            const h2 = document.createElement('h2');
            h2.innerText = linea.replace("/* [", "").replace("] */", "");
            contenedor.appendChild(h2);
            return;
        }

        if (linea.includes("=") && linea.includes(";")) {
            let partes = linea.split(";");
            let declaracion = partes[0].split("=");
            let nombreVar = declaracion[0].trim();
            let valorDefecto = declaracion[1].trim().replace(/"/g, "");
            let comentario = partes[1] ? partes[1].replace("//", "").trim() : "";

            if (!comentario.startsWith("[") || nombreVar === "archivo_svg") return;

            parametrosVariables.push(nombreVar); 

            const divGrupo = document.createElement('div');
            divGrupo.className = "control-group";
            const label = document.createElement('label');
            label.id = `lbl-${nombreVar}`;
            label.innerText = `${nombreVar.replace(/_/g, ' ')}: ${valorDefecto}`;
            divGrupo.appendChild(label);

            if (comentario.includes(",") && !comentario.includes(":")) {
                let opciones = comentario.replace("[", "").replace("]", "").split(",");
                let select = document.createElement('select');
                select.id = `param-${nombreVar}`;
                
                opciones.forEach(opt => {
                    let o = opt.trim();
                    let option = document.createElement('option');
                    option.value = o;
                    option.innerText = o.replace(/_/g, ' ');
                    if (o === valorDefecto) option.selected = true;
                    select.appendChild(option);
                });

                select.addEventListener('change', () => {
                    label.innerText = `${nombreVar.replace(/_/g, ' ')}: ${select.value}`;
                    compilarDisenoReal();
                });
                divGrupo.appendChild(select);
            } 
            else if (comentario.includes(":")) {
                let rango = comentario.replace("[", "").replace("]", "").split(":");
                let min = 0, step = 1, max = 100;
                
                if (rango.length === 3) { [min, step, max] = rango; } 
                else if (rango.length === 2) { [min, max] = rango; }

                let slider = document.createElement('input');
                slider.type = "range";
                slider.id = `param-${nombreVar}`;
                slider.min = min;
                slider.max = max;
                slider.step = step;
                slider.value = parseFloat(valorDefecto);
                
                slider.addEventListener('input', () => {
                    label.innerText = `${nombreVar.replace(/_/g, ' ')}: ${slider.value}`;
                });
                slider.addEventListener('change', () => {
                    compilarDisenoReal();
                });
                divGrupo.appendChild(slider);
            }

            contenedor.appendChild(divGrupo);
        }
    });
}

// Lectura de Archivo SVG
const fileInput = document.getElementById('svg-file');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            archivoSvgContenido = event.target.result;
            if (openscadInstance && openscadInstance.FS) {
                openscadInstance.FS.writeFile("diseno.svg", archivoSvgContenido);
                alert(`¡Vector de Neón '${file.name}' vinculado con éxito!`);
                compilarDisenoReal();
            }
        };
        reader.readAsText(file);
    });
}

// Generador de compilación final
async function compilarDisenoReal() {
    if (!openscadInstance || !archivoSvgContenido || !scriptOriginal) return;
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Calculando canales de Neón Flex...";

    let variablesInyectadas = "$fn = 60;\narchivo_svg = \"diseno.svg\";\n";
    
    parametrosVariables.forEach(idVar => {
        const input = document.getElementById(`param-${idVar}`);
        if (input) {
            let valor = input.value;
            if (isNaN(valor)) { valor = `"${valor}"`; } 
            variablesInyectadas += `${idVar} = ${valor};\n`;
        }
    });

    try {
        const codigoFinalParaCompilar = variablesInyectadas + "\n" + scriptOriginal;
        openscadInstance.FS.writeFile("input.scad", codigoFinalParaCompilar);
        await openscadInstance.compile("input.scad");
        loader.style.display = "none";
    } catch (err) {
        console.error("Error al renderizar mallas:", err);
        loader.innerText = "Error geométrico: Revisa las esquinas de tu SVG.";
    }
}

document.getElementById('btn-render').addEventListener('click', compilarDisenoReal);

document.getElementById('btn-export').addEventListener('click', async () => {
    if (!openscadInstance || !archivoSvgContenido) {
        alert("Primero sube un archivo SVG.");
        return;
    }
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Exportando canales a STL...";

    try {
        await openscadInstance.generateSTL("input.scad", "produccion.stl");
        const stlBuffer = openscadInstance.FS.readFile("produccion.stl");
        const blob = new Blob([stlBuffer], { type: "application/octet-stream" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "Letrero_NeonFlex_Plus.stl";
        link.click();
    } catch (err) {
        console.error(err);
        alert("Error al exportar STL.");
    }
    loader.style.display = "none";
});
