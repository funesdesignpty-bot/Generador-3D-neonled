// =============================================================
// WORKER.JS - El motor OpenSCAD corre AQUÍ, en un hilo aparte,
// para que la pantalla principal nunca se sienta "congelada"
// mientras calcula, sin importar cuánto tarde.
// =============================================================

import OpenSCAD from "./openscad.js";
import { addFonts } from "./openscad.fonts.js";
import { addMCAD } from "./openscad.mcad.js";

let instancia = null;

async function iniciarMotor() {
    instancia = await OpenSCAD({
        noInitialRun: true,
        print: (msg) => postMessage({ tipo: "log", texto: msg }),
        printErr: (msg) => postMessage({ tipo: "log", texto: "⚠️ " + msg }),
    });
    addFonts(instancia);
    addMCAD(instancia);
    postMessage({ tipo: "listo" });
}

const motorListo = iniciarMotor().catch((err) => {
    postMessage({ tipo: "error", mensaje: "No se pudo iniciar el motor: " + err.message });
});

self.onmessage = async (evento) => {
    await motorListo; // por si un clic llega antes de que el motor termine de cargar

    if (!instancia) return; // el motor falló al iniciar, ya se avisó arriba

    const { scadTexto, svgTexto } = evento.data;

    try {
        instancia.FS.writeFile("/input.scad", scadTexto);
        instancia.FS.writeFile("/diseno.svg", svgTexto);

        try { instancia.FS.unlink("/output.stl"); } catch (e) {}

        instancia.callMain(["/input.scad", "-o", "/output.stl"]);

        const datos = instancia.FS.readFile("/output.stl");
        postMessage({ tipo: "resultado", datos }, [datos.buffer]);
    } catch (err) {
        const detalle = (err && err.message) ? err.message : "revisa los mensajes de arriba (⚠️), ahí suele estar la causa real.";
        postMessage({ tipo: "error", mensaje: detalle });
    }
};
