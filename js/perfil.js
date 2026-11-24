
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const formulario = document.getElementById("perfilForm");
const mensaje = document.getElementById("mensajePerfil");

let usuarioActual = null;

function mostrarMensaje(texto) {
  if (mensaje) mensaje.textContent = texto;
}

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.replace("./login.html");
    return;
  }

  usuarioActual = usuario;

  try {
    const referencia = doc(db, "usuarios", usuario.uid);
    const resultado = await getDoc(referencia);

    if (resultado.exists()) {
      const datos = resultado.data();

      for (const campo of ["nombre", "telefono", "direccion"]) {
        const elemento = document.getElementById(campo);

        if (elemento) {
          elemento.value = datos[campo] || "";
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    mostrarMensaje("No se pudo cargar el perfil.");
  }
});

formulario?.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!usuarioActual) {
    mostrarMensaje("Debes iniciar sesión.");
    return;
  }

  const nombre = document.getElementById("nombre")?.value.trim() || "";
  const telefono = document.getElementById("telefono")?.value.trim() || "";
  const direccion = document.getElementById("direccion")?.value.trim() || "";

  if (!nombre) {
    mostrarMensaje("Escribe tu nombre.");
    return;
  }

  try {
    mostrarMensaje("Guardando perfil...");

    await setDoc(
      doc(db, "usuarios", usuarioActual.uid),
      {
        nombre,
        telefono,
        direccion,
        correo: usuarioActual.email
      },
      { merge: true }
    );

    mostrarMensaje("Perfil guardado correctamente.");

  } catch (error) {
    console.error("Error al guardar perfil:", error);
    mostrarMensaje("Error: " + error.message);
  }
});
