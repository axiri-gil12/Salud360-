
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const esPaginaMedico =
  window.location.pathname.endsWith("medico.html");

const rolEsperado = esPaginaMedico ? "medico" : "paciente";

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    window.location.replace("./login.html");
    return;
  }

  try {
    const perfil = await getDoc(doc(db, "usuarios", usuario.uid));

    if (!perfil.exists()) {
      await signOut(auth);
      window.location.replace("./login.html");
      return;
    }

    const datos = perfil.data();

    if (datos.rol !== rolEsperado) {
      window.location.replace(
        datos.rol === "medico"
          ? "./medico.html"
          : "./paciente.html"
      );
      return;
    }

    document.getElementById("nombreUsuario").textContent =
      datos.nombre || "Usuario";

    document.getElementById("correoUsuario").textContent =
      "Correo: " + usuario.email;

    if (esPaginaMedico) {
      document.getElementById("especialidadUsuario").textContent =
        "Especialidad: " + (datos.especialidad || "Sin registrar");

      document.getElementById("estadoVerificacion").textContent =
        datos.verificado
          ? "Cuenta profesional verificada"
          : "Verificación profesional pendiente";
    }

  } catch (error) {
    console.error(error);
    alert("No se pudo cargar tu perfil.");
  }
});

document.getElementById("cerrarSesion")
  .addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("./login.html");
  });
