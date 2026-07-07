// =============================================================
// MOTOR DE LECTURA DE NEON FLEX PRO PLUS - V6.0 (MOTOR REAL CONECTADO)
// Funes Design 360 - David, Chiriquí
// =============================================================

import OpenSCAD from "./openscad.js";
import { addFonts } from "./openscad.fonts.js";
import { addMCAD } from "./openscad.mcad.js";

const NOMBRE_ARCHIVO_SCAD = "letras.scad";

let instancia = null;      // El motor OpenSCAD ya cargado y listo
let scadOriginal = "";     // Texto completo del archivo .scad, tal cual se descargó
let svgTexto = null;       // Contenido del SVG que el usuario suba
let ultimoSTL = null;      // Últimos bytes STL generados (para poder descargarlos)
let tiposControl = {};     // nombre_del_parametro -> "number" | "string"

let three = {}; // Guarda escena, cámara, renderer, controles y la malla 3D actual

// -------------------------------------------------------------
// ARRANQUE
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    setEstado("Cargando el motor 3D (puede tardar unos segundos la primera vez)...");

    try {
        const resp = await fetch(NOMBRE_ARCHIVO_SCAD + "?v=" + new Date().getTime());
        if (!resp.ok) throw new Error("No se encontró " + NOMBRE_ARCHIVO_SCAD + " junto a index.html");
        scadOriginal = await resp.text();

        instancia = await OpenSCAD({
            noInitialRun: true,
            print: (msg) => agregarLog(msg),
            printErr: (msg) => agregarLog("⚠️ " + msg),
        });
        addFonts(instancia);
        addMCAD(instancia);

        construirInterfaz(scadOriginal);
        initViewer3D();

        setEstado("Listo. Sube tu archivo SVG y presiona “Generar Modelo 3D”.");
    } catch (err) {
        console.error(err);
        setEstado("❌ Error cargando el motor: " + err.message);
        agregarLog("❌ " + err.message);
    }
});

// -------------------------------------------------------------
// SUBIDA DE SVG
// -------------------------------------------------------------
document.getElementById('svg-file').addEventListener('change', (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
        try {
            const bytes = new Uint8Array(lector.result);
            let texto;

            if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
                texto = new TextDecoder('utf-16le').decode(bytes.slice(2));
            } else if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
                texto = new TextDecoder('utf-16be').decode(bytes.slice(2));
            } else if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
                texto = new TextDecoder('utf-8').decode(bytes.slice(3));
            } else {
                texto = new TextDecoder('utf-8').decode(bytes);
            }

            texto = texto.replace(/encoding="UTF-16"/i, 'encoding="UTF-8"');

            svgTexto = texto;
            setEstado("SVG cargado: " + archivo.name + ". Ya puedes generar el modelo.");
        } catch (e) {
            setEstado("❌ No se pudo interpretar ese SVG: " + e.message);
        }
    };
    lector.onerror = () => setEstado("❌ No se pudo leer ese archivo SVG.");
    lector.readAsArrayBuffer(archivo);
});

// -------------------------------------------------------------
// BOTONES
// -------------------------------------------------------------
document.getElementById('btn-render').addEventListener('click', compilar);
document.getElementById('btn-export').addEventListener('click', exportarSTL);

// -------------------------------------------------------------
// CONSTRUCCIÓN DE LA INTERFAZ (sliders y selectores) A PARTIR DEL .scad
// -------------------------------------------------------------
function construirInterfaz(scadText) {
    const contenedor = document.getElementById('dynamic-params');
    contenedor.innerHTML = "";
    tiposControl = {};

    const regexParam = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?);\s*\/\/\s*\[(.+?)\]\s*$/;

    scadText.split('\n').forEach((linea) => {
        const m = linea.match(regexParam);
        if (!m) return;

        const nombre = m[1];
        const valorActual = m[2].trim();
        const rango = m[3].trim();

        const div = document.createElement('div');
        div.className = "control-group";

        const label = document.createElement('label');
        label.innerText = nombre.replace(/_/g, " ");
        div.appendChild(label);

        if (rango.includes(":")) {
            const [min, step, max] = rango.split(":").map((s) => s.trim());
            const fila = document.createElement('div');
            fila.style.display = "flex";
            fila.style.gap = "8px";
            fila.style.alignItems = "center";

            const input = document.createElement('input');
            input.type = "range";
            input.min = min; input.max = max; input.step = step;
            input.value = valorActual;
            input.id = "param-" + nombre;

            const valorSpan = document.createElement('span');
            valorSpan.style.minWidth = "42px";
            valorSpan.style.fontSize = "11px";
            valorSpan.style.color = "#00b4d8";
            valorSpan.innerText = valorActual;

            input.addEventListener('input', () => { valorSpan.innerText = input.value; });
            input.addEventListener('change', compilar);

            fila.appendChild(input);
            fila.appendChild(valorSpan);
            div.appendChild(fila);
            tiposControl[nombre] = "number";
        } else {
            const opciones = rango.split(",").map((s) => s.trim());
            const select = document.createElement('select');
            select.id = "param-" + nombre;
            opciones.forEach((op) => {
                const opt = document.createElement('option');
                opt.value = op;
                opt.innerText = op;
                if (op === valorActual.replace(/"/g, "")) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener('change', compilar);
            div.appendChild(select);
            tiposControl[nombre] = "string";
        }

        contenedor.appendChild(div);
    });
}

function reconstruirScad(original) {
    const regexAsignacion = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)(.+?)(;\s*(\/\/.*)?)$/;

    return original.split('\n').map((linea) => {
        const m = linea.match(regexAsignacion);
        if (!m) return linea;

        const nombre = m[2];
        const tipo = tiposControl[nombre];
        if (!tipo) return linea;

        const el = document.getElementById("param-" + nombre);
        if (!el) return linea;

        const nuevoValor = tipo === "string" ? `"${el.value}"` : el.value;
        return `${m[1]}${nombre}${m[3]}${nuevoValor}${m[5]}`;
    }).join('\n');
}

// -------------------------------------------------------------
// COMPILAR (botón "Generar Modelo 3D")
// -------------------------------------------------------------
async function compilar() {
    if (!instancia) { setEstado("El motor todavía no está listo, espera un momento."); return; }
    if (!svgTexto) { setEstado("⚠️ Primero sube tu archivo SVG (arriba a la izquierda)."); return; }

    setEstado("Generando modelo 3D... (puede tardar varios segundos)");
    document.getElementById('btn-render').disabled = true;

    try {
        const scadFinal = reconstruirScad(scadOriginal);

        instancia.FS.writeFile("/input.scad", scadFinal);
        instancia.FS.writeFile("/diseno.svg", svgTexto);

        try { instancia.FS.unlink("/output.stl"); } catch (e) {}

        instancia.callMain(["/input.scad", "-o", "/output.stl"]);

        const datos = instancia.FS.readFile("/output.stl");
        ultimoSTL = datos;
        mostrarSTL(datos);
        setEstado("✅ Modelo generado. Ya puedes descargar el STL.");
    } catch (err) {
        console.error(err);
        const detalle = (err && err.message) ? err.message : "revisa los mensajes de arriba en el registro (⚠️), ahí suele estar la causa real.";
        setEstado("❌ No se pudo generar el modelo. Revisa el registro de abajo.");
        agregarLog("❌ Falló la generación: " + detalle);
    } finally {
        document.getElementById('btn-render').disabled = false;
    }
}

// -------------------------------------------------------------
// EXPORTAR STL (botón "Descargar archivo STL")
// -------------------------------------------------------------
function exportarSTL() {
    if (!ultimoSTL) { setEstado("Primero genera un modelo (botón ⚡)."); return; }
    const blob = new Blob([ultimoSTL], { type: "application/octet-stream" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "letra_funes_design.stl";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// -------------------------------------------------------------
// VISOR 3D (three.js)
// -------------------------------------------------------------
function initViewer3D() {
    const contenedor = document.getElementById('viewer');

    three.scene = new THREE.Scene();
    three.scene.background = new THREE.Color(0x1a1a26);

    three.camera = new THREE.PerspectiveCamera(45, contenedor.clientWidth / contenedor.clientHeight, 0.1, 5000);
    three.camera.position.set(0, -180, 180);

    three.renderer = new THREE.WebGLRenderer({ antialias: true });
    three.renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
    contenedor.appendChild(three.renderer.domElement);

    three.controls = new THREE.OrbitControls(three.camera, three.renderer.domElement);

    three.scene.add(new THREE.AmbientLight(0x909090));
    const luz = new THREE.DirectionalLight(0xffffff, 0.9);
    luz.position.set(1, 1, 1);
    three.scene.add(luz);

    window.addEventListener('resize', () => {
        three.camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
        three.camera.updateProjectionMatrix();
        three.renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
    });

    (function animar() {
        requestAnimationFrame(animar);
        three.controls.update();
        three.renderer.render(three.scene, three.camera);
    })();
}

function mostrarSTL(datosUint8) {
    const loader = new THREE.STLLoader();
    const geometria = loader.parse(datosUint8.buffer);
    geometria.center();

    if (three.mesh) three.scene.remove(three.mesh);

    const material = new THREE.MeshPhongMaterial({ color: 0x00b4d8, specular: 0x222222, shininess: 80 });
    three.mesh = new THREE.Mesh(geometria, material);
    three.scene.add(three.mesh);
}

// -------------------------------------------------------------
// UTILIDADES DE INTERFAZ
// -------------------------------------------------------------
function setEstado(texto) {
    const loader = document.getElementById('loading');
    loader.style.display = "block";
    loader.innerText = texto;
    clearTimeout(setEstado._t);
    setEstado._t = setTimeout(() => { loader.style.display = "none"; }, 4000);
}

function agregarLog(msg) {
    const log = document.getElementById('log');
    if (!log) return;
    const linea = document.createElement('div');
    linea.innerText = msg;
    log.appendChild(linea);
    log.scrollTop = log.scrollHeight;
}
