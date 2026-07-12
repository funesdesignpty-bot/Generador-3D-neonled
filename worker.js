// =============================================================
// WORKER.JS - El motor OpenSCAD corre AQUÍ, en un hilo aparte,
// para que la pantalla principal nunca se sienta "congelada"
// mientras calcula, sin importar cuánto tarde.
//
// IMPORTANTE: el motor OpenSCAD-WASM solo soporta usarse UNA VEZ
// por cada vez que se crea. Por eso creamos una instancia nueva
// en cada solicitud, en vez de reutilizar siempre la misma.
// =============================================================

import OpenSCAD from "./openscad.js";
import { addFonts } from "./openscad.fonts.js";
import { addMCAD } from "./openscad.mcad.js";

// Avisamos de inmediato que el worker ya está listo para recibir trabajos
postMessage({ tipo: "listo" });

self.onmessage = async (evento) => {
    const { scadTexto, svgTexto } = evento.data;

    try {
        postMessage({ tipo: "log", texto: "Iniciando motor 3D..." });

        const instancia = await OpenSCAD({
            noInitialRun: true,
            print: (msg) => postMessage({ tipo: "log", texto: msg }),
            printErr: (msg) => postMessage({ tipo: "log", texto: "⚠️ " + msg }),
        });
        addFonts(instancia);
        addMCAD(instancia);

        instancia.FS.writeFile("/input.scad", scadTexto);
        instancia.FS.writeFile("/diseno.svg", svgTexto);

        instancia.callMain(["/input.scad", "-o", "/output.stl"]);

        const datos = instancia.FS.readFile("/output.stl");
        postMessage({ tipo: "resultado", datos }, [datos.buffer]);
    } catch (err) {
        const detalle = (err && err.message) ? err.message : "revisa los mensajes de arriba (⚠️), ahí suele estar la causa real.";
        postMessage({ tipo: "error", mensaje: detalle });
    }
};
