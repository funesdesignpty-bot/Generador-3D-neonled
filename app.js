// MOTOR DE EMERGENCIA - LECTURA TOTAL
let openscadInstance = null;
const NOMBRE_ARCHIVO_SCAD = "letras.scad";

async function iniciarMotor() {
    const contenedor = document.getElementById('dynamic-params');
    const loader = document.getElementById('loading');
    
    try {
        const response = await fetch(NOMBRE_ARCHIVO_SCAD + "?nocache=" + Math.random());
        const sc = await response.text();
        
        // Iniciamos el motor SIEMPRE, aunque el SCAD falle
        openscadInstance = await OpenSCAD({ id: "viewer", container: document.getElementById("viewer") });
        
        // Construcción forzada
        const lineas = sc.split('\n');
        lineas.forEach(linea => {
            if (linea.includes("=") && linea.includes("// [") && !linea.startsWith("//")) {
                let [izq, der] = linea.split("=");
                let nombre = izq.trim();
                let configuracion = der.split("//")[1].replace(/[\[\]]/g, "").trim();
                let valor = der.split("//")[0].replace(";", "").trim();

                const div = document.createElement('div');
                div.className = "control-group";
                div.innerHTML = `<label>${nombre}</label>`;
                
                if (configuracion.includes(":")) {
                    let [min, step, max] = configuracion.split(":");
                    div.innerHTML += `<input type="range" id="p-${nombre}" min="${min}" max="${max}" step="${step}" value="${valor}">`;
                } else {
                    div.innerHTML += `<select id="p-${nombre}">` + configuracion.split(",").map(o => `<option value="${o.trim()}">${o.trim()}</option>`).join("") + `</select>`;
                }
                contenedor.appendChild(div);
            }
        });
        
        document.getElementById('btn-render').addEventListener('click', compilarForzado);
        loader.style.display = "none";
    } catch(e) {
        console.error("Error crítico:", e);
    }
}

async function compilarForzado() {
    let inputs = document.querySelectorAll('input, select');
    let nuevoScad = await (await fetch(NOMBRE_ARCHIVO_SCAD)).text();
    inputs.forEach(el => {
        let nombre = el.id.replace("p-", "");
        let valor = isNaN(el.value) ? `"${el.value}"` : el.value;
        nuevoScad = nuevoScad.replace(new RegExp(`${nombre}\\s*=\\s*[^;]+;`), `${nombre} = ${valor};`);
    });
    openscadInstance.FS.writeFile("input.scad", nuevoScad);
    await openscadInstance.compile("input.scad");
}

iniciarMotor();
