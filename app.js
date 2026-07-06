// =============================================================
// MOTOR DE LECTURA DE NEON FLEX PRO PLUS - V5.4
// =============================================================

let openscadInstance = null;
const NOMBRE_ARCHIVO_SCAD = "letras.scad";

window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";

    try {
        // Obtenemos el archivo SCAD con un sello de tiempo para evitar caché
        const response = await fetch(NOMBRE_ARCHIVO_SCAD + "?v=" + new Date().getTime());
        const scriptOriginal = await response.text();
        
        // Iniciamos el motor 3D
        openscadInstance = await OpenSCAD({
            id: "viewer",
            container: document.getElementById("viewer")
        });

        // Construimos la interfaz basados SOLO en lo que hay en el SCAD
        construirInterfaz(scriptOriginal);
        loader.style.display = "none";
    } catch (err) {
        console.error(err);
        loader.innerText = "Error al cargar el archivo. Verifica que letras.scad exista.";
    }
});

function construirInterfaz(scadText) {
    const contenedor = document.getElementById('dynamic-params');
    const lineas = scadText.split('\n');

    lineas.forEach(linea => {
        // Filtramos solo líneas que tengan asignación de valor y comentario de configuración
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

            if (resto.includes(":")) { // Es un slider
                let [min, step, max] = resto.split(":");
                let input = document.createElement('input');
                input.type = "range";
                input.min = min; input.max = max; input.step = step;
                input.value = valorActual;
                input.id = `param-${nombre}`;
                input.addEventListener('change', compilar);
                div.appendChild(input);
            } else { // Es un selector (tipo si/no)
                let opciones = resto.split(",");
                let select = document.createElement('select');
                select.id = `param-${nombre}`;
                opciones.forEach(op => {
                    let opt = document.createElement('option');
                    opt.value = op.trim();
                    opt.innerText = op.trim();
                    if(op.trim() === valorActual.replace(/"/g,"")) opt.selected = true;
                    select.appendChild(opt);
                });
                select.addEventListener('change', compilar);
                div.appendChild(select);
            }
            contenedor.appendChild(div);
        }
    });
}

async function compilar() {
    // Aquí el motor compila tomando los valores actuales de los inputs
    // (Lógica de compilación igual a la anterior)
}
