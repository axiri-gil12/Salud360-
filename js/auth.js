
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// FORMULARIOS
const registroForm = document.getElementById("registroForm");
const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

// MOSTRAR MENSAJES
function mostrarMensaje(texto) {
  if (mensaje) {
    mensaje.textContent = texto;
  }
}

// REDIRIGIR A LA PÁGINA PRINCIPAL
function redirigir(rol) {

  if (rol !== "medico" && rol !== "paciente") {
    throw new Error("Tipo de usuario no válido");
  }

  // Permitir navegación después de autenticarse
  sessionStorage.setItem("accesoSalud360", "permitido");

  // Abrir la página principal
window.location.replace("./index.html");
}

// REGISTRO DE USUARIOS
if (registroForm) {

  const rol = document.getElementById("rol");
  const camposMedico = document.getElementById("camposMedico");
  const especialidad = document.getElementById("especialidad");
  const cedula = document.getElementById("cedula");

  // MOSTRAR CAMPOS PARA MÉDICOS
  function actualizarCampos() {

    const esMedico = rol.value === "medico";

    camposMedico.hidden = !esMedico;

    especialidad.required = esMedico;
    cedula.required = esMedico;
  }

  rol.addEventListener("change", actualizarCampos);
  actualizarCampos();

  // ENVIAR FORMULARIO DE REGISTRO
  registroForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const boton = registroForm.querySelector("button");
    boton.disabled = true;

    const datos = {
      nombre: document.getElementById("nombre").value.trim(),
      correo: document.getElementById("correo").value.trim(),
      rol: rol.value,
      especialidad: especialidad.value.trim(),
      cedula: cedula.value.trim()
    };

    const password = document.getElementById("password").value;

    try {

      // CREAR USUARIO EN FIREBASE
      const credencial = await createUserWithEmailAndPassword(
        auth,
        datos.correo,
        password
      );

      const uid = credencial.user.uid;

      // GUARDAR DATOS EN FIRESTORE
      await setDoc(doc(db, "usuarios", uid), {

        nombre: datos.nombre,
        correo: datos.correo,
        rol: datos.rol,

        especialidad: datos.rol === "medico"
          ? datos.especialidad
          : "",

        cedula: datos.rol === "medico"
          ? datos.cedula
          : "",

        verificado: false

      });

      // ABRIR INDEX DESPUÉS DEL REGISTRO
      redirigir(datos.rol);

    } catch (error) {

      console.error("Error de registro:", error);

      mostrarMensaje(
        "No se pudo completar el registro: " +
        (error.code || error.message)
      );

      boton.disabled = false;
    }

  });
}

// INICIO DE SESIÓN
if (loginForm) {

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const boton = loginForm.querySelector("button");
    boton.disabled = true;

    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;

    try {

      // AUTENTICAR CON FIREBASE
      const credencial = await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

      // BUSCAR PERFIL DEL USUARIO
      const perfil = await getDoc(
        doc(db, "usuarios", credencial.user.uid)
      );

      if (!perfil.exists()) {

        await signOut(auth);

        throw new Error("No existe el perfil del usuario");
      }

      // ABRIR INDEX DESPUÉS DE INICIAR SESIÓN
      redirigir(perfil.data().rol);

    } catch (error) {

      console.error("Error de inicio de sesión:", error);

      const errores = {

        "auth/network-request-failed":
          "Error de conexión con Firebase.",

        "auth/email-already-in-use":
          "Este correo ya está registrado.",

        "auth/invalid-email":
          "El correo electrónico no es válido.",

        "auth/weak-password":
          "La contraseña es demasiado débil.",

        "auth/invalid-credential":
          "Correo o contraseña incorrectos.",

        "auth/operation-not-allowed":
          "Debes habilitar la autenticación en Firebase.",

        "permission-denied":
          "No tienes permisos para acceder a Firestore."

      };

      mostrarMensaje(
        errores[error.code] ||
        "Error: " + (error.code || error.message)
      );

      boton.disabled = false;
    }

  });
}
