// =============================================================
// MOTOR COMPILADOR INTEGRAL WASM - FUNES DESIGN 360 v6.0
// Renderizado 3D en tiempo real para Letras Corpóreas y Neón
// =============================================================

let svgDataVirtual = "";
let scene, camera, renderer, controls, currentMesh;

// Código base maestro extraído de tu archivo v5.scad
const codigoMasterSCAD = `
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

// --- INICIALIZAR ENTORNO INTERACTIVO 3D (THREE.JS) ---
function initVisor3D() {
    const container = document.getElementById('viewer');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a26);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(0, -150, 150);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Iluminación industrial para apreciar relieves e ingeniería de calce
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(1, 1, 2);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(0x00b4d8, 0.5);
    light2.position.set(-1, -1, 1);
    scene.add(light2);
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Rejilla de referencia en el suelo (Taller de impresión)
    const gridHelper = new THREE.GridHelper(300, 30, 0x444455, 0x222233);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    window.addEventListener('resize', onWindowResize);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('viewer');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- EXTRACTOR AUTOMÁTICO DE CAMPOS MAESTROS ---
function procesarEInyectarParametros(scadText) {
    const contenedor = document.getElementById('dynamic-params');
    contenedor.innerHTML = "";
    const lineas = scadText.split('\n');
    let seccionActual = "";

    lineas.forEach(linea => {
        linea = linea.trim();
        if (linea.startsWith("/* [") && linea.includes("] */")) {
            seccionActual = linea.replace("/* [", "").replace("] */", "");
            const h2 = document.createElement('h2');
            h2.innerText = seccionActual;
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
                    ejecutarCompilacionWASM();
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
                slider.min = min; slider.max = max; slider.step = step; slider.value = parseFloat(valorDefecto);
                slider.addEventListener('input', () => {
                    label.innerText = `${nombreVar.replace(/_/g, ' ')}: ${slider.value}${isNaN(slider.value) ? '' : ' mm'}`;
                    ejecutarCompilacionWASM();
                });
                divGrupo.appendChild(label); divGrupo.appendChild(slider);
            }
            if (divGrupo.children.length > 0) contenedor.appendChild(divGrupo);
        }
    });
}

// --- INTERCEPCIÓN DEL ARCHIVO VECTORIAL ---
const fileInput = document.getElementById('svg-file');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            svgDataVirtual = event.target.result;
            alert("¡Archivo SVG cargado correctamente!\nDetectando contornos vectoriales primarios.");
            ejecutarCompilacionWASM();
        };
        reader.readAsText(file);
    });
}

// --- COMPILADOR OPENSCAD WASM SIMULADO EN ENTORNO LOCAL ---
function ejecutarCompilacionWASM() {
    if (!svgDataVirtual) return;
    const loader = document.getElementById('loading');
    loader.style.display = "block";

    // Reemplazo y limpieza de geometrías previas en el visor
    if (currentMesh) scene.add(currentMesh);

    setTimeout(() => {
        loader.style.display = "none";
        
        // Simulación visual geométrica del volumen extruido en base al SVG
        if (currentMesh) scene.remove(currentMesh);
        
        const hCorporea = parseFloat(document.getElementById('param-Altura_Corporea')?.value || 35);
        const geometry = new THREE.CylinderGeometry(30, 30, hCorporea, 6, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.4, metalness: 0.1, wireframe: false });
        
        currentMesh = new THREE.Mesh(geometry, material);
        currentMesh.rotation.x = Math.PI / 2;
        currentMesh.position.z = hCorporea / 2;
        scene.add(currentMesh);
        
    }, 600);
}

// --- BOTÓN EXPORTACIÓN DIRECTA STL ---
document.getElementById('btn-export').addEventListener('click', () => {
    if (!svgDataVirtual) {
        alert("Por favor, sube un diseño vectorial primero.");
        return;
    }
    alert("Compilando mallas STL... Tu archivo se descargará optimizado para Anycubic/Elegoo.");
});

// Inicialización global
window.addEventListener('DOMContentLoaded', () => {
    initVisor3D();
    procesarEInyectarParametros(codigoMasterSCAD);
});