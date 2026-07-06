let openscadInstance = null;
const NOMBRE_ARCHIVO_SCAD = "letras.scad";

// 1. Inicialización ultra simple
window.addEventListener('DOMContentLoaded', async () => {
    openscadInstance = await OpenSCAD({ id: "viewer", container: document.getElementById("viewer") });
    
    // Cargamos el archivo SCAD base inmediatamente
    const response = await fetch(NOMBRE_ARCHIVO_SCAD);
    const script = await response.text();
    
    // Guardamos el script en el motor inmediatamente
    openscadInstance.FS.writeFile("input.scad", script);
    
    // Listener para el SVG
    document.getElementById('svg-file').addEventListener('change', handleFile);
});

// 2. Función para manejar el SVG y renderizar
async function handleFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
        // Guardamos el SVG como el archivo que el SCAD espera
        openscadInstance.FS.writeFile("diseno.svg", event.target.result);
        
        // ¡ESTO ES LO QUE FALTABA! El comando para renderizar
        await openscadInstance.compile("input.scad");
        console.log("Renderizado ejecutado");
    };
    reader.readAsText(file);
}
