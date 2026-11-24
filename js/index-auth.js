
/* ==========================================
   SALUD 360° - CONTROL DE ACCESO
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ELEMENTOS */

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const overlay = document.getElementById("sidebarOverlay");

const btnCerrarSesion =
    document.getElementById("btnCerrarSesion");

const nombreUsuario =
    document.getElementById("nombreUsuario");

const avatarUsuario =
    document.getElementById("avatarUsuario");

const planUsuario =
    document.getElementById("planUsuario");

/* ==========================================
   VERIFICAR SESIÓN
========================================== */

onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {

        window.location.replace("./login.html");
        return;

    }

    try {

        const referencia = doc(
            db,
            "usuarios",
            usuario.uid
        );

        const documento = await getDoc(referencia);

        if (!documento.exists()) {
            console.error("Perfil no encontrado");

            await signOut(auth);
            window.location.replace("./login.html");
            return;
        }

        const datos = documento.data();

        const nombre = datos.nombre ||
            usuario.displayName ||
            "Usuario";

        const rol = datos.rol;

        if (rol !== "paciente" && rol !== "medico" &&
            rol !== "médico") {

            console.error("Rol no válido");
            await signOut(auth);
            window.location.replace("./login.html");
            return;
        }

        if (nombreUsuario) {
            nombreUsuario.textContent = nombre;
        }

        if (avatarUsuario) {
            avatarUsuario.textContent =
                nombre.charAt(0).toUpperCase();
        }

        if (planUsuario) {
            planUsuario.textContent =
                rol === "medico" || rol === "médico"
                    ? "Panel Médico"
                    : "Panel Paciente";
        }

        console.log("Sesión activa");

    } catch (error) {

        console.error(
            "Error al verificar perfil:",
            error
        );

        // No se cierra sesión por un error temporal
        // de conexión o de lectura de Firestore.
        if (planUsuario) {
            planUsuario.textContent =
                "No se pudo cargar el perfil";
        }
    }

});

/* ==========================================
   CERRAR SESIÓN
========================================== */

if (btnCerrarSesion) {

    btnCerrarSesion.addEventListener(
        "click",
        async () => {

            try {

                btnCerrarSesion.disabled = true;

                await signOut(auth);

                window.location.replace("./login.html");

            } catch (error) {

                console.error(
                    "Error al cerrar sesión:",
                    error
                );

                btnCerrarSesion.disabled = false;

                alert(
                    "No se pudo cerrar sesión. Intenta de nuevo."
                );
            }

        }
    );

}

/* ==========================================
   MENÚ RESPONSIVE
========================================== */

function cerrarMenu() {

    sidebar.classList.remove("active");
    overlay.classList.remove("active");

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );
}

if (sidebar && menuToggle && overlay) {

    menuToggle.addEventListener("click", () => {

        const abierto =
            sidebar.classList.toggle("active");

        overlay.classList.toggle("active", abierto);

        menuToggle.setAttribute(
            "aria-expanded",
            String(abierto)
        );

    });

    overlay.addEventListener("click", cerrarMenu);

    document.addEventListener("keydown", (evento) => {

        if (evento.key === "Escape") {
            cerrarMenu();
        }

    });

}

/* ==========================================
   BOTÓN SOS
========================================== */

const btnSOS = document.getElementById("btnSOS");

if (btnSOS) {

    btnSOS.addEventListener("click", () => {

        alert(
            "En una emergencia real en México, llama al 911."
        );

    });

}
