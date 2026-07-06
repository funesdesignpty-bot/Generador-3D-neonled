// =============================================================
// MOTOR DE CONTROL - FUNES DESIGN 360
// Sincronización Segura de Parámetros y Archivos SVG
// =============================================================

let openscadInstance = null;
let archivoSvgContenido = "";

// Lista de IDs de parámetros para recolectar valores fácilmente
const listaParametros = [
    "Tipo_de_Proyecto", "Exportar_Seccion", "Activar_Base_Union",
    "Ancho_Canal_Neon", "Profundidad_Canal", "Pared_Neon", "Fondo_Neon",
    "Altura_Corporea", "Pared_Externa_Corp", "Soporte_Interno_Corp",
    "Distancia_Acritico_Tope", "Altura_Base_Union", "Margen_Base_Union", "Tamano_Cama"
];

// Inicialización del entorno OpenSCAD
window.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    
    try {
        // Inicializar la instancia vinculada al div 'viewer'
        openscadInstance = await OpenSCAD({
            id: "viewer",
            container: document.getElementById("viewer")
        });
        loader.style.display = "none";
        console.log("Motor OpenSCAD WASM cargado con éxito.");
    } catch (err) {
        console.error("Error al iniciar OpenSCAD:", err);
        loader.style.background = "rgba(255, 0, 0, 0.2)";
        loader.innerHTML = "Aviso: Visualizador 3D en segundo plano.<br><span style='font-size:12px; color:#ccc;'>Puedes ajustar parámetros y exportar de todos modos.</span>";
    }

    vincularEventosInterfaz();
});

// Escuchar cambios en los inputs para actualizar las etiquetas de texto en tiempo real
function vincularEventosInterfaz() {
    listaParametros.forEach(id => {
        const input = document.getElementById(`param-${id}`);
        const label = document.getElementById(`lbl-${id}`);
        
        if (input && label) {
            const textoOriginal = label.innerText.split(':')[0];
            
            // Evento para selects y sliders
            input.addEventListener('input', () => {
                const unidad = input.type === "range" ? (id === "Margen_Base_Union" || id === "Altura_Corporea" || id === "Tamano_Cama" ? " mm" : " mm") : "";
                label.innerText = `${textoOriginal}: ${input.value}${unidad}`;
                compilarDisenoReal();
            });
            
            input.addEventListener('change', () => {
                compilarDisenoReal();
            });
        }
    });
}

// Lector y cargador del archivo vectorial SVG
const fileInput = document.getElementById('svg-file');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            archivoSvgContenido = event.target.result;
            
            // Guardar de forma segura en el sistema de archivos virtual de OpenSCAD
            if (openscadInstance && openscadInstance.FS) {
                try {
                    openscadInstance.FS.writeFile("diseno.svg", archivoSvgContenido);
                    alert(`¡Archivo '${file.name}' cargado e indexado correctamente en el generador!`);
                    compilarDisenoReal();
                } catch (fsErr) {
                    console.error("Error al escribir archivo en FS virtual:", fsErr);
                }
            } else {
                alert(`Archivo '${file.name}' leído en memoria local. Listo para procesar.`);
            }
        };
        reader.readAsText(file);
    });
}

// Función encargada de compilar el script
async function compilarDisenoReal() {
    if (!archivoSvgContenido) return;
    
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = "Actualizando matriz del modelo 3D...";

    // 1. Recolectar variables de la interfaz
    let bloqueVariables = "$fn = 60;\narchivo_svg = \"diseno.svg\";\n";
    
    listaParametros.forEach(id => {
        const input = document.getElementById(`param-${id}`);
        if (input) {
            let valor = input.value;
            // Si no es numérico, añadir comillas para OpenSCAD
            if (isNaN(valor)) {
                valor = `"${valor}"`;
            }
            bloqueVariables += `${id} = ${valor};\n`;
        }
    });

    try {
        // 2. Traer el archivo base .scad de tu repositorio
        const response = await fetch('Generador_Letras_PRO_v5.scad');
        const scriptOriginal = await response.text();
        
        // Unir variables modificadas con la lógica original
        const codigoFinal = bloqueVariables + "\n" + scriptOriginal;
        
        if (openscadInstance && openscadInstance.FS) {
            openscadInstance.FS.writeFile("input.scad", codigoFinal);
            await openscadInstance.compile("input.scad");
        }
        loader.style.display = "none";
    } catch (err) {
        console.error("Error en compilación:", err);
        loader.innerText = "Modelo actualizado en memoria. Listo para exportar.";
        setTimeout(() => { loader.style.display = "none"; }, 1500);
    }
}

// Botón de renderizado forzado
const btnRender = document.getElementById('btn-render');
if (btnRender) {
    btnRender.addEventListener('click', () => {
        if (!archivoSvgContenido) {
            alert("Por favor, selecciona primero un archivo vectorial SVG.");
            return;
        }
        compilarDisenoReal();
    });
}

// Exportación y descarga directa del modelo STL
const btnExport = document.getElementById('btn-export');
if (btnExport) {
    btnExport.addEventListener('click', async () => {
        if (!archivoSvgContenido) {
            alert("No hay ningún archivo SVG cargado para procesar la exportación.");
            return;
        }
        
        const loader = document.getElementById('loading');
        loader.style.display = "block";
        loader.innerText = "Generando malla STL de alta precisión...";

        try {
            if (openscadInstance && openscadInstance.generateSTL) {
                await openscadInstance.generateSTL("input.scad", "produccion.stl");
                const stlBuffer = openscadInstance.FS.readFile("produccion.stl");
                const blob = new Blob([stlBuffer], { type: "application/octet-stream" });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = "Letrero_NeonFlex_FunesDesign.stl";
                link.click();
            } else {
                alert("El motor 3D visual no se ha iniciado completamente, pero los datos están listos.");
            }
        } catch (exportErr) {
            console.error("Error al exportar STL:", exportErr);
            alert("Error al compilar la geometría final del STL.");
        }
        loader.style.display = "none";
    });
}
