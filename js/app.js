/* ==========================================
   SALUD 360°
   APLICACIÓN PRINCIPAL
========================================== */

import { auth, db } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ELEMENTOS */

const page = document.getElementById("pageContent");
const nav = document.getElementById("mainNav");
const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");
const logoutButton = document.getElementById("logoutButton");
const profileShortcut = document.getElementById("profileShortcut");

let rolActual = "";
let uidActual = null;
let sesionLista = false;

let usuario = {
  nombre: "",
  iniciales: "U",
  rol: ""
};

/* ALMACENAMIENTO DE DOCUMENTOS PENDIENTE */

async function guardarDocumento() {

  throw new Error(
    "El almacenamiento de documentos todavía no está habilitado."
  );

}

async function obtenerDocumentos() {

  return [];

}

async function obtenerDocumento() {

  throw new Error(
    "El almacenamiento de documentos todavía no está habilitado."
  );

}

async function eliminarDocumento() {

  throw new Error(
    "El almacenamiento de documentos todavía no está habilitado."
  );

}

function formatoPeso(bytes) {

  return (Number(bytes) / 1024).toFixed(2) + " KB";

}

/* UTILIDADES */

function escapar(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    caracter => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caracter]
  );
}

function obtenerIniciales(nombre) {
  return String(nombre || "Usuario")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join("");
}

function encabezado(titulo, descripcion = "") {
  return `
    <div class="page-heading">
      <h1>${escapar(titulo)}</h1>
      <p>${escapar(descripcion)}</p>
    </div>
  `;
}

function tarjeta(titulo, contenido) {
  return `
    <article class="card">
      <h2>${escapar(titulo)}</h2>
      ${contenido}
    </article>
  `;
}

function boton(texto, ruta) {
  return `
    <a href="#${ruta}" class="btn primary">
      ${escapar(texto)}
    </a>
  `;
}

function acceso(icono, titulo, ruta) {
  return `
    <a href="#${ruta}" class="quick-card">
      <span class="quick-icon">
        <i class="fa-solid fa-${icono}"></i>
      </span>
      <strong>${escapar(titulo)}</strong>
    </a>
  `;
}

/* MENÚ DE NAVEGACIÓN */

const menuItems = [

  ["inicio", "house", "Inicio"],

  ["disponibilidad", "calendar-week", "Mi Disponibilidad"],

  ["citas", "calendar-check", "Citas Médicas"],

  ["directorio", "hospital", "Directorio y Seguros"],

  ["expediente", "file-medical", "Expediente Clínico"],

  ["vinculos", "user-doctor", "Mis Médicos"],

  ["chat", "comments", "Chat Médico"],

  ["farmacia", "capsules", "Farmacia"],

  ["perfil", "user-gear", "Perfil y Plan"]

];

/* CREAR MENÚ SEGÚN EL ROL */

function crearMenu() {

  if (!nav) return;

  nav.innerHTML = menuItems

    .filter(([ruta]) => {

      if (ruta === "disponibilidad") {

        return rolActual === "medico";

      }

      return true;

    })

    .map(([ruta, icono, nombre]) => {

      let titulo = nombre;

      if (rolActual === "medico") {

        if (ruta === "vinculos") {
          titulo = "Mis Pacientes";
        }

        if (ruta === "citas") {
          titulo = "Agenda Médica";
        }

        if (ruta === "perfil") {
          titulo = "Perfil Profesional";
        }

      }

      return `

        <a href="#${ruta}"
           class="nav-link"
           data-nav="${ruta}">

          <i class="fa-solid fa-${icono}"
             aria-hidden="true"></i>

          <span>${escapar(titulo)}</span>

        </a>

      `;

    }).join("");

}
/* INICIO PACIENTE */

function inicioPaciente() {
  page.innerHTML = `
    <section class="hero">
      <span class="hero-badge">
        Plan Salud 360° - Demostración
      </span>

      <h1>Hola, ${escapar(usuario.nombre)}</h1>

      <p>
        Bienvenido a tu espacio de atención médica.
        Consulta tus citas, médicos y servicios.
      </p>

      <div class="hero-actions">
        ${boton("Agendar cita", "citas")}
      </div>
    </section>

    <h2 class="section-title">Accesos rápidos</h2>

    <div class="quick-grid">
      ${acceso("calendar-plus", "Agendar Cita", "citas")}
      ${acceso("hospital", "Hospitales y Labs", "directorio")}
      ${acceso("comments", "Chat Médico", "chat")}
      ${acceso("file-medical", "Mis Resultados", "expediente")}
    </div>

    <div class="two-grid section-space">
      ${tarjeta("Mi próxima cita", `
        <span class="pill">Sin citas confirmadas</span>
        <p>Cuando tengas una cita aparecerá aquí.</p>
        ${boton("Ver mis citas", "citas")}
      `)}

      ${tarjeta("Mi salud", `
        <p>Consulta tu expediente y documentos.</p>
        ${boton("Ver expediente", "expediente")}
      `)}
    </div>
  `;
}


/* ==========================================
   INICIO DEL MÉDICO
   PANEL PRINCIPAL DE SALUD 360°
========================================== */

function inicioMedico() {

  // OBTENER FECHA ACTUAL

  const fechaActual = new Date().toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

  // ESTADO DE VERIFICACIÓN PROFESIONAL

  const verificado = usuario.verificado === true;

  const estadoProfesional = verificado
    ? "Profesional verificado"
    : "Verificación pendiente";

  // INDICADORES DEL PANEL MÉDICO
  // Se conectarán a Firebase en etapas posteriores.

  const indicadores = [

    {
      titulo: "Pacientes vinculados",
      icono: "users",
      valor: "—",
      detalle: "Vinculación pendiente",
      ruta: "vinculos",
      color: "azul"
    },

    {
      titulo: "Citas de hoy",
      icono: "calendar-check",
      valor: "—",
      detalle: "Agenda pendiente",
      ruta: "citas",
      color: "verde"
    },

    {
      titulo: "Citas pendientes",
      icono: "clock",
      valor: "—",
      detalle: "Solicitudes de consulta",
      ruta: "citas",
      color: "naranja"
    },

    {
      titulo: "Mensajes nuevos",
      icono: "comments",
      valor: "—",
      detalle: "Chat pendiente",
      ruta: "chat",
      color: "violeta"
    }

  ];

  // GENERAR INTERFAZ DEL MÉDICO

  page.innerHTML = `

    <div class="panel-medico">

      <!-- ENCABEZADO PRINCIPAL -->

      <div class="medico-encabezado">

        <div>

          <h1>Panel del médico</h1>

          <p>
            Consulta y administra tu actividad profesional.
          </p>

        </div>

        <div class="medico-fecha">

          <i class="fa-solid fa-calendar-days"
             aria-hidden="true"></i>

          ${escapar(fechaActual)}

        </div>

      </div>

      <!-- BANNER DE BIENVENIDA -->

      <section class="medico-bienvenida">

        <div class="medico-bienvenida-contenido">

          <span class="medico-etiqueta">

            Portal Médico | Demostración

          </span>

          <h2>
            Bienvenido, ${escapar(usuario.nombre)}
          </h2>

          <p>
            ${escapar(
              usuario.especialidad || "Profesional de salud"
            )}
          </p>

          <p>
            Administra tus consultas, pacientes,
            expedientes y servicios desde un solo lugar.
          </p>

          <div class="medico-bienvenida-acciones">

            <a href="#citas"
               class="medico-btn-blanco">

              <i class="fa-solid fa-calendar-check"
                 aria-hidden="true"></i>

              Ver agenda

            </a>

            <a href="#perfil"
               class="medico-btn-transparente">

              <i class="fa-solid fa-user-gear"
                 aria-hidden="true"></i>

              Mi perfil

            </a>

          </div>

        </div>

        <div class="medico-bienvenida-icono"
             aria-hidden="true">

          <i class="fa-solid fa-user-doctor"></i>

        </div>

      </section>

      <!-- RESUMEN DE ACTIVIDAD -->

      <div class="medico-titulo-seccion">

        <h2>Resumen de actividad</h2>

        <span>Panel de demostración</span>

      </div>

      <div class="medico-estadisticas">

        ${indicadores.map(item => `

          <a href="#${item.ruta}"
             class="medico-estadistica">

            <div class="medico-estadistica-superior">

              <span class="medico-estadistica-icono
                           medico-color-${item.color}">

                <i class="fa-solid fa-${item.icono}"
                   aria-hidden="true"></i>

              </span>

              <i class="fa-solid fa-arrow-up-right-from-square
                        medico-flecha"
                 aria-hidden="true"></i>

            </div>

            <p>${escapar(item.titulo)}</p>

            <strong>${escapar(item.valor)}</strong>

            <small>${escapar(item.detalle)}</small>

          </a>

        `).join("")}

      </div>

      <!-- AGENDA Y ESTADO PROFESIONAL -->

      <div class="medico-dos-columnas">

        <article class="card medico-tarjeta">

          <div class="medico-tarjeta-encabezado">

            <h2>Próximas citas</h2>

            <a href="#citas"
               class="medico-enlace">

              Ver agenda

            </a>

          </div>

          <div class="medico-vacio">

            <span class="medico-vacio-icono">

              <i class="fa-solid fa-calendar-days"
                 aria-hidden="true"></i>

            </span>

            <h3>Agenda médica</h3>

            <p>
              Las próximas consultas aparecerán
              cuando se habilite el módulo de citas.
            </p>

            ${boton("Consultar agenda", "citas")}

          </div>

        </article>

        <!-- ESTADO DEL PERFIL -->

        <article class="card medico-tarjeta">

          <h2>Estado profesional</h2>

          <div class="medico-perfil-resumen">

            <div class="medico-avatar">

              ${escapar(usuario.iniciales || "MD")}

            </div>

            <div>

              <h3>${escapar(usuario.nombre)}</h3>

              <p>
                ${escapar(
                  usuario.especialidad || "Sin especialidad"
                )}
              </p>

            </div>

          </div>

          <div class="medico-estado">

            <i class="fa-solid ${
              verificado
                ? "fa-circle-check"
                : "fa-clock"
            }" aria-hidden="true"></i>

            ${escapar(estadoProfesional)}

          </div>

          <div class="medico-dato">

            <span>Tipo de cuenta</span>

            <strong>Médico</strong>

          </div>

          <div class="medico-dato">

            <span>Modalidad</span>

            <strong>Demostración</strong>

          </div>

          ${boton("Editar perfil profesional", "perfil")}

        </article>

      </div>

      <!-- ACCESOS RÁPIDOS -->

      <div class="medico-titulo-seccion">

        <h2>Accesos rápidos</h2>

      </div>

      <div class="quick-grid medico-accesos">

        ${acceso(
          "calendar-check",
          "Agenda médica",
          "citas"
        )}

        ${acceso(
          "users",
          "Mis pacientes",
          "vinculos"
        )}

        ${acceso(
          "file-medical",
          "Expediente clínico",
          "expediente"
        )}

        ${acceso(
          "comments",
          "Chat médico",
          "chat"
        )}

        ${acceso(
          "hospital",
          "Red de servicios",
          "directorio"
        )}

        ${acceso(
          "capsules",
          "Farmacia",
          "farmacia"
        )}

        ${acceso(
          "user-gear",
          "Perfil profesional",
          "perfil"
        )}

        ${acceso(
          "calendar-week",
          "Mi disponibilidad",
          "disponibilidad"
        )}

      </div>

      <!-- DISPONIBILIDAD MÉDICA -->

      <article class="card medico-disponibilidad">

        <div class="medico-disponibilidad-icono">

          <i class="fa-solid fa-calendar-week"
             aria-hidden="true"></i>

        </div>

        <div class="medico-disponibilidad-info">

          <h2>Mi disponibilidad</h2>

          <p>
            Configura los días y horarios
            disponibles para atender consultas.
          </p>

        </div>

        <a href="#disponibilidad"
           class="btn primary">

          <i class="fa-solid fa-calendar-week"
             aria-hidden="true"></i>

          Configurar disponibilidad

        </a>

      </article>

      <!-- AVISO DE DEMOSTRACIÓN -->

      <div class="medico-aviso">

        <i class="fa-solid fa-circle-info"
           aria-hidden="true"></i>

        <p>
          Salud 360° se encuentra en fase de prototipo.
          Utiliza únicamente información ficticia.
        </p>

      </div>

    </div>

  `;
}
/* ==========================================
   DISPONIBILIDAD DEL MÉDICO
   SALUD 360°
========================================== */

// DÍAS DE LA SEMANA

const diasDisponibilidad = [

  ["lunes", "Lunes"],
  ["martes", "Martes"],
  ["miercoles", "Miércoles"],
  ["jueves", "Jueves"],
  ["viernes", "Viernes"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"]

];


/* MOSTRAR INTERFAZ DE DISPONIBILIDAD */

async function disponibilidad() {

  // VALIDAR ROL DEL USUARIO

  if (rolActual !== "medico" || !uidActual) {

    page.innerHTML = encabezado(
      "Acceso restringido",
      "Este apartado pertenece al portal médico."
    );

    return;

  }

  const medicoId = uidActual;

  // MOSTRAR ESTADO DE CARGA

  page.innerHTML = `

    ${encabezado(
      "Mi disponibilidad",
      "Configura tus horarios de atención médica"
    )}

    <article class="card">

      <p>Cargando disponibilidad...</p>

    </article>

  `;

  // CONFIGURACIÓN INICIAL

  let horario = {

    activo: false,

    dias: [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes"
    ],

    horaInicio: "09:00",

    horaFin: "17:00",

    duracion: 30

  };

  try {

    // CONSULTAR FIRESTORE

    const referencia = doc(
      db,
      "disponibilidad",
      medicoId
    );

    const resultado = await getDoc(referencia);

    if (resultado.exists()) {

      horario = {
        ...horario,
        ...resultado.data()
      };

    }

  } catch (error) {

    console.error(
      "Error al consultar disponibilidad:",
      error
    );

    if (
      uidActual === medicoId &&
      window.location.hash === "#disponibilidad"
    ) {

      page.innerHTML = `

        ${encabezado(
          "Mi disponibilidad",
          "No se pudo consultar la información"
        )}

        <div class="notice">

          Revisa tu conexión y los permisos
          de Firestore.

        </div>

        <button
          id="reintentarDisponibilidad"
          class="btn primary"
          type="button">

          Reintentar

        </button>

      `;

      document
        .getElementById("reintentarDisponibilidad")
        .addEventListener("click", disponibilidad);

    }

    return;

  }

  // EVITAR MOSTRAR DATOS SI CAMBIÓ LA SESIÓN O PÁGINA

  if (
    uidActual !== medicoId ||
    rolActual !== "medico" ||
    window.location.hash !== "#disponibilidad"
  ) {

    return;

  }

  // GENERAR INTERFAZ

  page.innerHTML = `

    ${encabezado(
      "Mi disponibilidad",
      "Organiza tus días y horarios de consulta"
    )}

    <section class="disponibilidad-banner">

      <div>

        <h2>Horario de atención</h2>

        <p>
          Configura tu disponibilidad profesional
          dentro del prototipo Salud 360°.
        </p>

      </div>

      <i class="fa-solid fa-calendar-week"
         aria-hidden="true"></i>

    </section>

    <div class="disponibilidad-grid">

      <!-- FORMULARIO -->

      <article class="card">

        <h2>Configuración semanal</h2>

        <form id="formDisponibilidad">

          <!-- ESTADO -->

          <label class="disponibilidad-estado">

            <input
              type="checkbox"
              id="disponibilidadActiva"
              ${horario.activo ? "checked" : ""}>

            <span>
              Disponible para consultas
            </span>

          </label>

          <!-- DÍAS DE ATENCIÓN -->

          <h3 class="disponibilidad-subtitulo">

            Días de atención

          </h3>

          <div class="disponibilidad-dias">

            ${diasDisponibilidad.map(
              ([valor, nombre]) => `

              <label class="disponibilidad-dia">

                <input
                  type="checkbox"
                  name="diasAtencion"
                  value="${valor}"
                  ${horario.dias.includes(valor)
                    ? "checked"
                    : ""}>

                <span>${nombre}</span>

              </label>

            `).join("")}

          </div>

          <!-- HORARIOS -->

          <h3 class="disponibilidad-subtitulo">

            Horario de consulta

          </h3>

          <div class="disponibilidad-horas">

            <div class="form-field">

              <label for="horaInicio">

                Hora de inicio

              </label>

              <input
                type="time"
                id="horaInicio"
                value="${escapar(horario.horaInicio)}"
                required>

            </div>

            <div class="form-field">

              <label for="horaFin">

                Hora de término

              </label>

              <input
                type="time"
                id="horaFin"
                value="${escapar(horario.horaFin)}"
                required>

            </div>

          </div>

          <!-- DURACIÓN -->

          <div class="form-field">

            <label for="duracionConsulta">

              Duración de cada consulta

            </label>

            <select id="duracionConsulta">

              ${[15, 20, 30, 45, 60].map(
                minutos => `

                <option
                  value="${minutos}"
                  ${horario.duracion === minutos
                    ? "selected"
                    : ""}>

                  ${minutos} minutos

                </option>

              `).join("")}

            </select>

          </div>

          <!-- BOTÓN GUARDAR -->

          <button
            type="submit"
            class="btn primary full">

            <i class="fa-solid fa-floppy-disk"
               aria-hidden="true"></i>

            Guardar disponibilidad

          </button>

          <p id="mensajeDisponibilidad"
             role="status"
             aria-live="polite"></p>

        </form>

      </article>

      <!-- RESUMEN SEMANAL -->

      <div class="disponibilidad-lateral">

        <article class="card">

          <h2>Resumen semanal</h2>

          <div id="resumenDisponibilidad"></div>

        </article>

        <article class="card">

          <h2>Información de consulta</h2>

          <div class="disponibilidad-informacion">

            <p>

              <strong>Modalidad:</strong>

              Demostración

            </p>

            <p>

              <strong>Zona horaria:</strong>

              Centro de México

            </p>

            <p>

              <strong>Duración:</strong>

              <span id="resumenDuracion"></span>

            </p>

          </div>

          <p class="demo-note">

            La disponibilidad se utilizará
            posteriormente en la agenda médica.

          </p>

        </article>

      </div>

    </div>

  `;

  // EVENTOS DEL FORMULARIO

  const formulario = document.getElementById(
    "formDisponibilidad"
  );

  formulario.addEventListener(
    "input",
    actualizarResumenDisponibilidad
  );

  formulario.addEventListener(
    "submit",
    guardarDisponibilidad
  );

  actualizarResumenDisponibilidad();

}


/* OBTENER DATOS DEL FORMULARIO */

function obtenerHorarioDisponibilidad() {

  const dias = Array.from(

    document.querySelectorAll(
      'input[name="diasAtencion"]:checked'
    )

  ).map(campo => campo.value);

  return {

    activo: document.getElementById(
      "disponibilidadActiva"
    ).checked,

    dias,

    horaInicio: document.getElementById(
      "horaInicio"
    ).value,

    horaFin: document.getElementById(
      "horaFin"
    ).value,

    duracion: Number(
      document.getElementById(
        "duracionConsulta"
      ).value
    )

  };

}


/* ACTUALIZAR RESUMEN SEMANAL */

function actualizarResumenDisponibilidad() {

  const resumen = document.getElementById(
    "resumenDisponibilidad"
  );

  if (!resumen) return;

  const horario = obtenerHorarioDisponibilidad();

  resumen.innerHTML = diasDisponibilidad.map(
    ([valor, nombre]) => {

      const disponible = horario.activo
        && horario.dias.includes(valor);

      return `

        <div class="disponibilidad-resumen-dia">

          <strong>${nombre}</strong>

          <span class="${
            disponible
              ? "horario-activo"
              : "horario-inactivo"
          }">

            ${disponible

              ? escapar(
                  horario.horaInicio +
                  " - " +
                  horario.horaFin
                )

              : "No disponible"

            }

          </span>

        </div>

      `;

    }
  ).join("");

  document.getElementById(
    "resumenDuracion"
  ).textContent = horario.duracion + " minutos";

}


/* GUARDAR DISPONIBILIDAD EN FIRESTORE */

async function guardarDisponibilidad(evento) {

  evento.preventDefault();

  if (rolActual !== "medico" || !uidActual) {

    return;

  }

  const medicoId = uidActual;

  const horario = obtenerHorarioDisponibilidad();

  const mensaje = document.getElementById(
    "mensajeDisponibilidad"
  );

  const botonGuardar = evento.target.querySelector(
    '[type="submit"]'
  );

  // VALIDAR DÍAS

  if (horario.activo && horario.dias.length === 0) {

    mensaje.textContent =
      "Selecciona al menos un día de atención.";

    mensaje.className = "disponibilidad-error";

    return;

  }

  // VALIDAR HORARIOS

  if (
    !horario.horaInicio ||
    !horario.horaFin ||
    horario.horaInicio >= horario.horaFin
  ) {

    mensaje.textContent =
      "La hora de término debe ser posterior a la de inicio.";

    mensaje.className = "disponibilidad-error";

    return;

  }

  // VALIDAR DURACIÓN

  const convertirMinutos = hora => {

    const [h, m] = hora.split(":").map(Number);

    return h * 60 + m;

  };

  const minutosDisponibles =
    convertirMinutos(horario.horaFin) -
    convertirMinutos(horario.horaInicio);

  if (
    ![15, 20, 30, 45, 60].includes(horario.duracion) ||
    minutosDisponibles < horario.duracion
  ) {

    mensaje.textContent =
      "Selecciona una duración compatible con tu horario.";

    mensaje.className = "disponibilidad-error";

    return;

  }

  botonGuardar.disabled = true;

  mensaje.textContent = "Guardando disponibilidad...";

  mensaje.className = "";

  try {

    // GUARDAR HORARIO DEL MÉDICO

    await setDoc(

      doc(
        db,
        "disponibilidad",
        medicoId
      ),

      {

        medicoId,

        ...horario,

        actualizado: serverTimestamp()

      }

    );

    mensaje.textContent =
      "Disponibilidad guardada correctamente.";

    mensaje.className = "disponibilidad-exito";

    if (
      uidActual === medicoId &&
      evento.target.isConnected
    ) {

      actualizarResumenDisponibilidad();

    }

  } catch (error) {

    console.error(
      "Error al guardar disponibilidad:",
      error
    );

    mensaje.textContent =
      "No se pudo guardar. Revisa la conexión y los permisos.";

    mensaje.className = "disponibilidad-error";

  } finally {

    botonGuardar.disabled = false;

  }

}


/* ==========================================
   AGENDA MÉDICA Y GESTIÓN DE CITAS
   SALUD 360°
========================================== */

let disponibilidadCita = null;

const estadosCitas = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
  cancelada: "Cancelada"
};


/* INTERFAZ PRINCIPAL DE CITAS */

function citas() {

  const medico = rolActual === "medico";

  disponibilidadCita = null;

  page.innerHTML = `

    ${encabezado(
      medico ? "Agenda Médica" : "Mis Citas Médicas",
      medico
        ? "Administra tus solicitudes de consulta"
        : "Solicita y consulta tus citas médicas"
    )}

    <section class="citas-banner">

      <div>

        <h2>
          ${medico
            ? "Organiza tus consultas"
            : "Agenda tu próxima consulta"}
        </h2>

        <p>
          Gestiona tus citas desde Salud 360°.
        </p>

      </div>

      <i class="fa-solid fa-calendar-check"></i>

    </section>

    ${!medico ? `

      <article class="card section-space">

        <h2>Solicitar nueva cita</h2>

        <form id="formCita">

          <div class="form-field">

            <label for="medicoCita">
              Identificador del médico
            </label>

            <input
              type="text"
              id="medicoCita"
              maxlength="128"
              placeholder="Ingresa el UID del médico"
              required>

          </div>

          <button
            type="button"
            id="consultarDisponibilidadCita"
            class="btn primary">

            Consultar disponibilidad

          </button>

          <div id="resultadoDisponibilidadCita"></div>

          <div class="form-field">

            <label for="fechaCita">
              Fecha de consulta
            </label>

            <input
              type="date"
              id="fechaCita"
              min="${fechaLocalCitas()}"
              required
              disabled>

          </div>

          <div class="form-field">

            <label for="horaCita">
              Horario disponible
            </label>

            <select id="horaCita" required disabled>

              <option value="">
                Selecciona una fecha
              </option>

            </select>

          </div>

          <button
            type="submit"
            id="solicitarCita"
            class="btn primary full"
            disabled>

            <i class="fa-solid fa-calendar-plus"></i>

            Solicitar cita

          </button>

          <p id="mensajeCita"
             role="status"
             aria-live="polite"></p>

        </form>

      </article>

    ` : ""}

    <article class="card section-space">

      <div class="citas-encabezado">

        <h2>
          ${medico
            ? "Solicitudes y consultas"
            : "Mis citas registradas"}
        </h2>

        <button
          type="button"
          id="actualizarCitas"
          class="btn">

          <i class="fa-solid fa-rotate"></i>

          Actualizar

        </button>

      </div>

      <div class="form-field">

        <label for="filtroCitas">
          Filtrar por estado
        </label>

        <select id="filtroCitas">

          <option value="todas">Todas las citas</option>
          <option value="pendiente">Pendientes</option>
          <option value="confirmada">Confirmadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="cancelada">Canceladas</option>

        </select>

      </div>

      <div id="listaCitas">

        <p>Cargando citas...</p>

      </div>

    </article>

    <p class="demo-note">

      Módulo de demostración.
      Utiliza únicamente información ficticia.

    </p>

  `;

  cargarCitas();
  /* CARGAR MÉDICO DESDE EL DIRECTORIO */

if (rolActual === "paciente") {

  cargarMedicoSeleccionadoCita();

}/* CARGAR MÉDICO DESDE EL DIRECTORIO */

if (rolActual === "paciente") {

  cargarMedicoSeleccionadoCita();

}

}


/* OBTENER FECHA LOCAL */

function fechaLocalCitas() {

  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;

}


/* CONSULTAR DISPONIBILIDAD DEL MÉDICO */

async function consultarDisponibilidadCita() {

  if (rolActual !== "paciente" || !uidActual) return;

  const campoMedico =
    document.getElementById("medicoCita");

  const resultado =
    document.getElementById("resultadoDisponibilidadCita");

  const fecha =
    document.getElementById("fechaCita");

  const hora =
    document.getElementById("horaCita");

  const boton =
    document.getElementById("solicitarCita");

  const medicoId = campoMedico.value.trim();

  const uid = uidActual;

  disponibilidadCita = null;

  fecha.disabled = true;
  hora.disabled = true;
  boton.disabled = true;

  fecha.value = "";

  hora.innerHTML = `
    <option value="">Selecciona una fecha</option>
  `;

  if (!medicoId || medicoId.includes("/")) {

    resultado.textContent =
      "Ingresa un identificador válido.";

    return;

  }

  resultado.textContent =
    "Consultando disponibilidad...";

  try {

    const referencia = doc(
      db,
      "disponibilidad",
      medicoId
    );

    const snapshot = await getDoc(referencia);

    if (
      uidActual !== uid ||
      !campoMedico.isConnected ||
      campoMedico.value.trim() !== medicoId
    ) return;

    if (!snapshot.exists() ||
        snapshot.data().activo !== true) {

      resultado.textContent =
        "El médico no tiene disponibilidad activa.";

      return;

    }

    disponibilidadCita = {

      ...snapshot.data(),

      medicoId

    };

    resultado.innerHTML = `

      <div class="cita-disponibilidad">

        <h3>Disponibilidad encontrada</h3>

        <p>

          Días:
          ${escapar(
            disponibilidadCita.dias.join(", ")
          )}

        </p>

        <p>

          Horario:
          ${escapar(disponibilidadCita.horaInicio)}
          -
          ${escapar(disponibilidadCita.horaFin)}

        </p>

        <p>

          Duración:
          ${escapar(disponibilidadCita.duracion)}
          minutos

        </p>

      </div>

    `;

    fecha.disabled = false;

  } catch (error) {

    console.error(
      "Error al consultar disponibilidad:",
      error
    );

    if (!resultado.isConnected) return;

    resultado.textContent =
      "No se encontró disponibilidad accesible para ese médico.";

  }

}


/* GENERAR HORARIOS DE CONSULTA */

function generarHorariosCita() {

  const campoFecha =
    document.getElementById("fechaCita");

  const campoHora =
    document.getElementById("horaCita");

  const boton =
    document.getElementById("solicitarCita");

  const mensaje =
    document.getElementById("mensajeCita");

  if (!campoFecha || !campoHora || !boton) return;

  campoHora.innerHTML = `
    <option value="">Selecciona un horario</option>
  `;

  campoHora.disabled = true;
  boton.disabled = true;

  mensaje.textContent = "";

  if (!disponibilidadCita || !campoFecha.value) return;

  const fecha = campoFecha.value;

  if (fecha < fechaLocalCitas()) {

    mensaje.textContent =
      "No puedes seleccionar una fecha pasada.";

    return;

  }

  const dias = [

    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado"

  ];

  const fechaSeleccionada =
    new Date(fecha + "T12:00:00");

  const diaSeleccionado =
    dias[fechaSeleccionada.getDay()];

  if (!disponibilidadCita.dias.includes(
    diaSeleccionado
  )) {

    mensaje.textContent =
      "El médico no atiende ese día.";

    return;

  }

  const convertirMinutos = horario => {

    const [h, m] = horario.split(":").map(Number);

    return h * 60 + m;

  };

  const inicio = convertirMinutos(
    disponibilidadCita.horaInicio
  );

  const fin = convertirMinutos(
    disponibilidadCita.horaFin
  );

  const duracion = Number(
    disponibilidadCita.duracion
  );

  if (![15, 20, 30, 45, 60].includes(duracion)) {

    mensaje.textContent =
      "La duración de consulta no es válida.";

    return;

  }

  const horarios = [];

  for (
    let minuto = inicio;
    minuto + duracion <= fin;
    minuto += duracion
  ) {

    const h = String(
      Math.floor(minuto / 60)
    ).padStart(2, "0");

    const m = String(
      minuto % 60
    ).padStart(2, "0");

    const horario = `${h}:${m}`;

    const momento = new Date(
      fecha + "T" + horario + ":00"
    );

    if (momento <= new Date()) continue;

    horarios.push(horario);

  }

  if (horarios.length === 0) {

    mensaje.textContent =
      "No hay horarios para esta fecha.";

    return;

  }

  campoHora.innerHTML += horarios.map(horario => `

    <option value="${horario}">

      ${horario}

    </option>

  `).join("");

  campoHora.disabled = false;

  boton.disabled = false;

}


/* REGISTRAR SOLICITUD DE CITA */

async function guardarCita(evento) {

  evento.preventDefault();

  if (
    rolActual !== "paciente" ||
    !uidActual ||
    !disponibilidadCita
  ) return;

  const formulario = evento.target;

  const pacienteId = uidActual;

  const medicoId = formulario
    .querySelector("#medicoCita").value.trim();

  const fecha = formulario
    .querySelector("#fechaCita").value;

  const hora = formulario
    .querySelector("#horaCita").value;

  const mensaje = formulario
    .querySelector("#mensajeCita");

  const boton = formulario
    .querySelector("#solicitarCita");

  if (
    medicoId !== disponibilidadCita.medicoId ||
    !fecha ||
    !hora
  ) {

    mensaje.textContent =
      "Consulta la disponibilidad y completa los datos.";

    return;

  }

  if (
    new Date(fecha + "T" + hora + ":00")
      <= new Date()
  ) {

    mensaje.textContent =
      "Selecciona una fecha y hora futuras.";

    return;

  }

  boton.disabled = true;

  mensaje.textContent =
    "Registrando solicitud...";

  try {

    await addDoc(

      collection(db, "citas"),

      {

        pacienteId,

        medicoId,

        fecha,

        hora,

        estado: "pendiente",

        creado: serverTimestamp(),

        actualizado: serverTimestamp()

      }

    );

    if (
      uidActual !== pacienteId ||
      !formulario.isConnected
    ) return;

    formulario.reset();

    disponibilidadCita = null;

    formulario.querySelector("#fechaCita")
      .disabled = true;

    formulario.querySelector("#horaCita")
      .disabled = true;

    formulario.querySelector(
      "#resultadoDisponibilidadCita"
    ).textContent = "";

    mensaje.textContent =
      "Solicitud registrada correctamente.";

    await cargarCitas();

  } catch (error) {

    console.error(
      "Error al registrar cita:",
      error
    );

    mensaje.textContent =
      "No se pudo registrar la cita. Revisa Firebase.";

    boton.disabled = false;

  }

}


/* CONSULTAR CITAS REGISTRADAS */

async function cargarCitas() {

  const contenedor =
    document.getElementById("listaCitas");

  if (!contenedor || !uidActual) return;

  const uid = uidActual;

  const medico = rolActual === "medico";

  const filtro =
    document.getElementById("filtroCitas")?.value
      || "todas";

  contenedor.textContent =
    "Cargando citas...";

  try {

    const consulta = query(

      collection(db, "citas"),

      where(
        medico ? "medicoId" : "pacienteId",
        "==",
        uid
      )

    );

    const resultado = await getDocs(consulta);

    if (
      uidActual !== uid ||
      !contenedor.isConnected
    ) return;

    let registros = resultado.docs.map(item => ({

      ...item.data(),

      id: item.id

    }));

    if (filtro !== "todas") {

      registros = registros.filter(
        item => item.estado === filtro
      );

    }

    registros.sort((a, b) => {

      return (a.fecha + a.hora).localeCompare(
        b.fecha + b.hora
      );

    });

    if (registros.length === 0) {

      contenedor.innerHTML = `

        <div class="empty-state">

          No hay citas registradas para este estado.

        </div>

      `;

      return;

    }

    contenedor.innerHTML = registros.map(item => `

      <article class="cita-item">

        <div class="cita-icono">

          <i class="fa-solid fa-calendar-check"></i>

        </div>

        <div class="cita-informacion">

          <h3>Consulta médica</h3>

          <p>

            Fecha: ${escapar(item.fecha)}

          </p>

          <p>

            Hora: ${escapar(item.hora)}

          </p>

          <small>

            ${medico ? "Paciente" : "Médico"}:

            ${escapar(
              medico
                ? item.pacienteId
                : item.medicoId
            )}

          </small>

          <span class="cita-estado
                       cita-${escapar(item.estado)}">

            ${escapar(
              estadosCitas[item.estado]
              || item.estado
            )}

          </span>

        </div>

        <div class="cita-acciones">

          ${medico && item.estado === "pendiente" ? `

            <button
              type="button"
              class="btn primary"
              data-cita="${escapar(item.id)}"
              data-estado-cita="confirmada">

              Confirmar

            </button>

            <button
              type="button"
              class="btn"
              data-cita="${escapar(item.id)}"
              data-estado-cita="rechazada">

              Rechazar

            </button>

          ` : ""}

          ${(
            item.estado === "confirmada" ||
            (!medico && item.estado === "pendiente")
          ) ? `

            <button
              type="button"
              class="btn cita-btn-cancelar"
              data-cita="${escapar(item.id)}"
              data-estado-cita="cancelada">

              Cancelar

            </button>

          ` : ""}

        </div>

      </article>

    `).join("");

  } catch (error) {

    console.error(
      "Error al consultar citas:",
      error
    );

    contenedor.textContent =
      "No se pudieron consultar las citas.";

  }

}


/* ACTUALIZAR ESTADO DE UNA CITA */

async function actualizarEstadoCita(
  citaId,
  estado,
  boton
) {

  if (!uidActual || !sesionLista) return;

  if (![
    "confirmada",
    "rechazada",
    "cancelada"
  ].includes(estado)) return;

  const confirmar = window.confirm(

    "¿Deseas cambiar el estado de esta cita a " +
    estadosCitas[estado].toLowerCase() + "?"

  );

  if (!confirmar) return;

  const uid = uidActual;

  boton.disabled = true;

  try {

    await updateDoc(

      doc(db, "citas", citaId),

      {

        estado,

        actualizado: serverTimestamp()

      }

    );

    if (uidActual === uid) {

      await cargarCitas();

    }

  } catch (error) {

    console.error(
      "Error al actualizar cita:",
      error
    );

    alert(
      "No se pudo actualizar el estado de la cita."
    );

  } finally {

    boton.disabled = false;

  }

}
/* DIRECTORIO */

/* ==========================================
   DIRECTORIO MÉDICO CONECTADO A FIREBASE
   SALUD 360°
========================================== */


/* ALMACENAMIENTO TEMPORAL DEL DIRECTORIO */

let medicosDirectorio = [];

/* MÉDICO SELECCIONADO PARA SOLICITAR CITA */

let medicoSeleccionadoCita = null;


/* INTERFAZ PRINCIPAL DEL DIRECTORIO */

function directorio() {

  medicosDirectorio = [];

  page.innerHTML = `

    ${encabezado(
      "Directorio médico",
      "Consulta los profesionales registrados en Salud 360°"
    )}

    <section class="directorio-banner">

      <div>

        <h2>Encuentra a tu especialista</h2>

        <p>
          Conoce los perfiles profesionales
          publicados en Salud 360°.
        </p>

      </div>

      <i class="fa-solid fa-stethoscope"></i>

    </section>


    <article class="card section-space">

      <div class="directorio-encabezado">

        <div>

          <h2>Profesionales registrados</h2>

          <p id="totalMedicosDirectorio">

            Consultando profesionales...

          </p>

        </div>

        <button
          type="button"
          id="actualizarDirectorio"
          class="btn">

          <i class="fa-solid fa-rotate"></i>

          Actualizar

        </button>

      </div>


      <!-- ==========================================
     BÚSQUEDA Y FILTROS DEL DIRECTORIO
========================================== -->

<div class="directorio-filtros">

  <!-- BUSCADOR DE MÉDICOS -->

  <div class="form-field">

    <label for="buscarMedicoDirectorio">

      Buscar profesional

    </label>

    <div class="directorio-buscador">

      <i class="fa-solid fa-magnifying-glass"></i>

      <input
        type="search"
        id="buscarMedicoDirectorio"
        placeholder="Nombre, especialidad o consultorio"
        maxlength="100"
        autocomplete="off">

    </div>

  </div>


  <!-- FILTRO POR ESPECIALIDAD -->

  <div class="form-field">

    <label for="filtroEspecialidadDirectorio">

      Especialidad médica

    </label>

    <select id="filtroEspecialidadDirectorio">

      <option value="todas">

        Todas las especialidades

      </option>

    </select>

  </div>


  <!-- ORDENAR PROFESIONALES -->

  <div class="form-field">

    <label for="ordenDirectorio">

      Ordenar por

    </label>

    <select id="ordenDirectorio">

      <option value="az">

        Nombre: A - Z

      </option>

      <option value="za">

        Nombre: Z - A

      </option>

      <option value="experiencia">

        Mayor experiencia

      </option>

      <option value="menor-experiencia">

        Menor experiencia

      </option>

    </select>

  </div>


  <!-- LIMPIAR FILTROS -->

  <button
    type="button"
    id="limpiarFiltrosDirectorio"
    class="btn directorio-limpiar">

    <i class="fa-solid fa-filter-circle-xmark"></i>

    Limpiar filtros

  </button>

</div>

      <div id="listaDirectorioMedico"
           class="directorio-grid"
           aria-live="polite">

        <div class="empty-state">

          Cargando directorio médico...

        </div>

      </div>

    </article>


    <section id="detalleMedicoDirectorio"
             hidden>
    </section>


    <p class="demo-note">

      Directorio de demostración.
      Los perfiles no representan profesionales
      cuya identidad haya sido comprobada.

    </p>

  `;

  cargarDirectorioMedico();

}


/* ==========================================
   CONSULTAR MÉDICOS DESDE FIREBASE
========================================== */

async function cargarDirectorioMedico() {

  if (!uidActual || !sesionLista) return;

  const uid = uidActual;

  const contenedor = document.getElementById(
    "listaDirectorioMedico"
  );

  const contador = document.getElementById(
    "totalMedicosDirectorio"
  );

  const boton = document.getElementById(
    "actualizarDirectorio"
  );

  if (!contenedor || !contador || !boton) return;

  boton.disabled = true;

  medicosDirectorio = [];

  contador.textContent =
    "Consultando profesionales...";

  contenedor.innerHTML = `

    <div class="empty-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      Cargando directorio médico...

    </div>

  `;

  try {

    /* CONSULTAR ÚNICAMENTE PERFILES VISIBLES */

    const consulta = query(

      collection(db, "directorioMedico"),

      where("visible", "==", true)

    );

    const resultado = await getDocs(consulta);


    /* COMPROBAR SESIÓN Y NAVEGACIÓN */

    if (
      uidActual !== uid ||
      !contenedor.isConnected
    ) return;


    /* ORGANIZAR LOS DOCUMENTOS */

    medicosDirectorio = resultado.docs.map(
      documento => ({

        ...documento.data(),

        id: documento.id

      })
    );


    /* ORDENAR ALFABÉTICAMENTE */

    medicosDirectorio.sort((a, b) => {

      return String(a.nombre || "")
        .localeCompare(
          String(b.nombre || ""),
          "es",
          { sensitivity: "base" }
        );

    });


    /* CARGAR ESPECIALIDADES DISPONIBLES */

cargarEspecialidadesDirectorio();


/* HABILITAR CONSULTA DE RESULTADOS */

boton.disabled = false;


/* APLICAR BÚSQUEDA Y FILTROS */

aplicarFiltrosDirectorio();

  } catch (error) {

    console.error(
      "Error al consultar directorio médico:",
      error
    );

    if (
      uidActual !== uid ||
      !contenedor.isConnected
    ) return;

    contador.textContent =
      "No se pudo consultar el directorio.";

    contenedor.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-circle-exclamation"></i>

        <h3>Error de conexión</h3>

        <p>

          No fue posible cargar los perfiles
          profesionales. Intenta nuevamente.

        </p>

      </div>

    `;

  } finally {

    boton.disabled = false;

  }

}

/* ==========================================
   BÚSQUEDA Y FILTROS DEL DIRECTORIO MÉDICO
   SALUD 360°
========================================== */


/* NORMALIZAR TEXTOS PARA LAS BÚSQUEDAS */

function normalizarTextoDirectorio(texto) {

  return String(texto || "")

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toLowerCase()

    .trim();

}


/* ==========================================
   GENERAR ESPECIALIDADES AUTOMÁTICAMENTE
========================================== */

function cargarEspecialidadesDirectorio() {

  const selector = document.getElementById(
    "filtroEspecialidadDirectorio"
  );

  if (!selector) return;


  /* CONSERVAR ESPECIALIDAD SELECCIONADA */

  const seleccionAnterior = selector.value;


  /* OBTENER ESPECIALIDADES SIN DUPLICADOS */

  const especialidades = new Map();

  medicosDirectorio.forEach(medico => {

    const especialidad = String(
      medico.especialidad || ""
    ).trim();

    if (!especialidad) return;

    const clave = normalizarTextoDirectorio(
      especialidad
    );

    if (!especialidades.has(clave)) {

      especialidades.set(
        clave,
        especialidad
      );

    }

  });


  /* ORDENAR ESPECIALIDADES */

  const listaEspecialidades = Array.from(
    especialidades.entries()
  );

  listaEspecialidades.sort((a, b) => {

    return a[1].localeCompare(
      b[1],
      "es",
      { sensitivity: "base" }
    );

  });


  /* LIMPIAR OPCIONES ANTERIORES */

  selector.innerHTML = "";


  /* AGREGAR OPCIÓN GENERAL */

  const opcionTodas =
    document.createElement("option");

  opcionTodas.value = "todas";

  opcionTodas.textContent =
    "Todas las especialidades";

  selector.appendChild(opcionTodas);


  /* AGREGAR ESPECIALIDADES DE FIREBASE */

  listaEspecialidades.forEach(
    ([clave, especialidad]) => {

      const opcion =
        document.createElement("option");

      opcion.value = "especialidad:" + clave;

      opcion.textContent = especialidad;

      selector.appendChild(opcion);

    }
  );


  /* RECUPERAR SELECCIÓN SI TODAVÍA EXISTE */

  const existeSeleccion = Array.from(
    selector.options
  ).some(opcion => {

    return opcion.value === seleccionAnterior;

  });

  selector.value = existeSeleccion

    ? seleccionAnterior

    : "todas";

}


/* ==========================================
   APLICAR BÚSQUEDA Y FILTROS
========================================== */

function aplicarFiltrosDirectorio() {

  if (!sesionLista || !uidActual) return;

  const buscador = document.getElementById(
    "buscarMedicoDirectorio"
  );

  const filtro = document.getElementById(
    "filtroEspecialidadDirectorio"
  );

  const orden = document.getElementById(
    "ordenDirectorio"
  );

  const contenedor = document.getElementById(
    "listaDirectorioMedico"
  );

  const contador = document.getElementById(
    "totalMedicosDirectorio"
  );

  const actualizar = document.getElementById(
    "actualizarDirectorio"
  );

  if (
    !buscador ||
    !filtro ||
    !orden ||
    !contenedor ||
    !contador
  ) return;


  /* EVITAR FILTRAR DURANTE LA CARGA */

  if (actualizar?.disabled) return;


  /* OBTENER CRITERIOS DE BÚSQUEDA */

  const texto = normalizarTextoDirectorio(
    buscador.value
  );

  const especialidadSeleccionada =
    filtro.value;

  const tipoOrden = orden.value;


  /* SEPARAR PALABRAS DE BÚSQUEDA */

  const palabras = texto
    .split(/\s+/)
    .filter(Boolean);


  /* FILTRAR PROFESIONALES */

  let resultados = medicosDirectorio.filter(
    medico => {

      const nombre = normalizarTextoDirectorio(
        medico.nombre
      );

      const especialidad =
        normalizarTextoDirectorio(
          medico.especialidad
        );

      const consultorio =
        normalizarTextoDirectorio(
          medico.consultorio
        );


      /* COMBINAR CAMPOS DE BÚSQUEDA */

      const contenido = [

        nombre,

        especialidad,

        consultorio

      ].join(" ");


      /* COMPROBAR TODAS LAS PALABRAS */

      const coincideBusqueda = palabras.every(
        palabra => contenido.includes(palabra)
      );


      /* COMPROBAR ESPECIALIDAD */

      const coincideEspecialidad =

        especialidadSeleccionada === "todas"

        || especialidadSeleccionada ===
          "especialidad:" + especialidad;


      return coincideBusqueda

        && coincideEspecialidad;

    }
  );


  /* ==========================================
     ORDENAR RESULTADOS
  ========================================== */

  resultados.sort((a, b) => {

    const nombreA = String(a.nombre || "");

    const nombreB = String(b.nombre || "");

    const experienciaA =
      Number.isInteger(a.experiencia)
        ? a.experiencia
        : 0;

    const experienciaB =
      Number.isInteger(b.experiencia)
        ? b.experiencia
        : 0;

    const ordenNombre = nombreA.localeCompare(
      nombreB,
      "es",
      { sensitivity: "base" }
    );


    /* NOMBRE DE Z A A */

    if (tipoOrden === "za") {

      return -ordenNombre;

    }


    /* MAYOR EXPERIENCIA */

    if (tipoOrden === "experiencia") {

      return experienciaB - experienciaA

        || ordenNombre;

    }


    /* MENOR EXPERIENCIA */

    if (tipoOrden === "menor-experiencia") {

      return experienciaA - experienciaB

        || ordenNombre;

    }


    /* NOMBRE DE A A Z */

    return ordenNombre;

  });


  /* CERRAR DETALLE DEL MÉDICO ANTERIOR */

  cerrarPerfilMedicoDirectorio();


  /* MOSTRAR RESULTADOS */

  mostrarMedicosDirectorio(resultados);


  /* ACTUALIZAR CONTADOR DE RESULTADOS */

  contador.textContent =

    `${resultados.length} de ` +

    `${medicosDirectorio.length} profesionales`;


  /* MENSAJE CUANDO NO EXISTEN COINCIDENCIAS */

  if (
    resultados.length === 0 &&
    medicosDirectorio.length > 0
  ) {

    contenedor.innerHTML = `

      <div class="empty-state
                  directorio-sin-resultados">

        <i class="fa-solid
                  fa-magnifying-glass"></i>

        <h3>

          No se encontraron profesionales

        </h3>

        <p>

          Intenta con otro nombre,
          especialidad o consultorio.

        </p>

        <button
          type="button"
          class="btn primary"
          data-limpiar-directorio>

          Limpiar búsqueda

        </button>

      </div>

    `;

  }

}


/* ==========================================
   LIMPIAR FILTROS DEL DIRECTORIO
========================================== */

function limpiarFiltrosDirectorio() {

  const buscador = document.getElementById(
    "buscarMedicoDirectorio"
  );

  const especialidad = document.getElementById(
    "filtroEspecialidadDirectorio"
  );

  const orden = document.getElementById(
    "ordenDirectorio"
  );

  if (!buscador || !especialidad || !orden) {

    return;

  }


  /* RESTABLECER VALORES */

  buscador.value = "";

  especialidad.value = "todas";

  orden.value = "az";


  /* MOSTRAR TODOS LOS PROFESIONALES */

  aplicarFiltrosDirectorio();

}

/* ==========================================
   MOSTRAR TARJETAS DE LOS MÉDICOS
========================================== */

function mostrarMedicosDirectorio(medicos) {

  const contenedor = document.getElementById(
    "listaDirectorioMedico"
  );

  const contador = document.getElementById(
    "totalMedicosDirectorio"
  );

  if (!contenedor || !contador) return;


  /* ACTUALIZAR CONTADOR */

  contador.textContent = medicos.length === 1

    ? "1 profesional registrado"

    : `${medicos.length} profesionales registrados`;


  /* DIRECTORIO SIN REGISTROS */

  if (medicos.length === 0) {

    contenedor.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-user-doctor"></i>

        <h3>No hay médicos publicados</h3>

        <p>

          Los profesionales aparecerán aquí
          cuando publiquen su perfil médico.

        </p>

      </div>

    `;

    return;

  }


  /* GENERAR TARJETAS PROFESIONALES */

  contenedor.innerHTML = medicos.map(medico => {

    const nombre =
      medico.nombre || "Profesional médico";

    const especialidad =
      medico.especialidad || "Sin especialidad registrada";

    const iniciales = obtenerIniciales(nombre);

    const experiencia =
      Number.isInteger(medico.experiencia)
        ? medico.experiencia
        : 0;

    return `

      <article class="directorio-card">

        <div class="directorio-perfil">

          <div class="directorio-avatar">

            ${escapar(iniciales)}

          </div>

          <div class="directorio-identidad">

            <h3>

              ${escapar(nombre)}

            </h3>

            <p class="directorio-especialidad">

              ${escapar(especialidad)}

            </p>

            <span class="directorio-no-verificado">

              <i class="fa-solid fa-circle-info"></i>

              Perfil de demostración

            </span>

          </div>

        </div>


        <div class="directorio-informacion">

          <p>

            <i class="fa-solid fa-briefcase-medical"></i>

            ${escapar(experiencia)}
            años de experiencia declarada

          </p>

          <p>

            <i class="fa-solid fa-location-dot"></i>

            ${escapar(
              medico.consultorio ||
              "Consultorio no especificado"
            )}

          </p>

        </div>


        <div class="directorio-acciones">

  <!-- CONSULTAR PERFIL PROFESIONAL -->

  <button
    type="button"
    class="btn"
    data-ver-medico="${escapar(medico.id)}">

    <i class="fa-solid fa-user-doctor"></i>

    Ver perfil profesional

  </button>


  <!-- SOLICITAR CITA MÉDICA -->

  ${rolActual === "paciente" ? `

    <button
      type="button"
      class="btn primary"
      data-solicitar-cita="${escapar(medico.id)}">

      <i class="fa-solid fa-calendar-check"></i>

      Solicitar cita

    </button>

  ` : ""}

</div>

      </article>

    `;

  }).join("");

}


/* ==========================================
   CONSULTAR PERFIL PROFESIONAL INDIVIDUAL
========================================== */

async function verPerfilMedicoDirectorio(medicoId) {

  if (!uidActual || !sesionLista) return;

  if (!medicoId || medicoId.includes("/")) return;

  const uid = uidActual;

  const contenedor = document.getElementById(
    "detalleMedicoDirectorio"
  );

  if (!contenedor) return;

  contenedor.hidden = false;

  contenedor.dataset.medicoId = medicoId;

  contenedor.innerHTML = `

    <article class="card section-space">

      <p>Cargando perfil profesional...</p>

      <button
        type="button"
        id="cerrarPerfilDirectorio"
        class="btn">

        Cerrar

      </button>

    </article>

  `;

  try {

    const referencia = doc(
      db,
      "directorioMedico",
      medicoId
    );

    const resultado = await getDoc(referencia);


    /* COMPROBAR QUE LA CONSULTA SIGA VIGENTE */

    if (
      uidActual !== uid ||
      !contenedor.isConnected ||
      contenedor.hidden ||
      contenedor.dataset.medicoId !== medicoId
    ) return;


    /* COMPROBAR VISIBILIDAD DEL PERFIL */

    if (
      !resultado.exists() ||
      resultado.data().visible !== true
    ) {

      throw new Error(
        "El perfil ya no está disponible."
      );

    }

    const medico = resultado.data();

    const nombre =
      medico.nombre || "Profesional médico";

    const iniciales =
      obtenerIniciales(nombre);


    /* MOSTRAR INFORMACIÓN PROFESIONAL */

    contenedor.innerHTML = `

      <article class="card section-space
                      directorio-detalle">

        <div class="directorio-detalle-encabezado">

          <h2>Perfil profesional</h2>

          <button
            type="button"
            id="cerrarPerfilDirectorio"
            class="btn"
            aria-label="Cerrar perfil profesional">

            <i class="fa-solid fa-xmark"></i>

            Cerrar

          </button>

        </div>


        <div class="directorio-perfil">

          <div class="directorio-avatar">

            ${escapar(iniciales)}

          </div>

          <div class="directorio-identidad">

            <h3>${escapar(nombre)}</h3>

            <p class="directorio-especialidad">

              ${escapar(
                medico.especialidad ||
                "Sin especialidad registrada"
              )}

            </p>

            <span class="directorio-no-verificado">

              Perfil de demostración sin verificar

            </span>

          </div>

        </div>


        <div class="directorio-descripcion">

          <h3>Acerca del profesional</h3>

          <p>

            ${escapar(
              medico.descripcion ||
              "No hay descripción profesional."
            )}

          </p>

        </div>


        <div class="directorio-informacion">

          <h3>Información profesional</h3>

          <p>

            <i class="fa-solid fa-briefcase-medical"></i>

            Experiencia declarada:

            ${escapar(medico.experiencia || 0)}
            años

          </p>

          <p>

            <i class="fa-solid fa-location-dot"></i>

            Consultorio:

            ${escapar(
              medico.consultorio ||
              "No especificado"
            )}

          </p>

        </div>


        <!-- DISPONIBILIDAD DEL PROFESIONAL -->

${rolActual === "paciente" ? `

  <div class="directorio-disponibilidad"
       id="disponibilidadPerfilDirectorio">

    <h3>Disponibilidad médica</h3>

    <p>Consultando horarios de atención...</p>

  </div>

  <div class="directorio-acciones">

    <button
      type="button"
      class="btn primary"
      data-solicitar-cita="${escapar(medicoId)}">

      <i class="fa-solid fa-calendar-check"></i>

      Solicitar cita médica

    </button>

  </div>

` : ""}
      </article>

    `;

    /* CONSULTAR DISPONIBILIDAD DEL MÉDICO */

if (rolActual === "paciente") {

  cargarDisponibilidadPerfilDirectorio(
    medicoId
  );

}

    contenedor.scrollIntoView({

      block: "start"

    });

  } catch (error) {

    console.error(
      "Error al consultar perfil profesional:",
      error
    );

    if (
      uidActual !== uid ||
      !contenedor.isConnected ||
      contenedor.hidden ||
      contenedor.dataset.medicoId !== medicoId
    ) return;

    contenedor.innerHTML = `

      <article class="card section-space">

        <p>

          El perfil profesional no está disponible
          o no pudo consultarse.

        </p>

        <button
          type="button"
          id="cerrarPerfilDirectorio"
          class="btn">

          Cerrar

        </button>

      </article>

    `;

  }

}

/* ==========================================
   INTEGRACIÓN DEL DIRECTORIO CON LAS CITAS
   SALUD 360°
========================================== */


/* CONSULTAR DISPONIBILIDAD DEL PROFESIONAL */

async function cargarDisponibilidadPerfilDirectorio(
  medicoId
) {

  if (
    rolActual !== "paciente" ||
    !uidActual ||
    !medicoId
  ) return;

  const uid = uidActual;

  const contenedor = document.getElementById(
    "disponibilidadPerfilDirectorio"
  );

  if (!contenedor) return;

  try {

    const resultado = await getDoc(

      doc(db, "disponibilidad", medicoId)

    );


    /* COMPROBAR SESIÓN Y NAVEGACIÓN */

    if (
      uidActual !== uid ||
      !contenedor.isConnected
    ) return;


    /* COMPROBAR DISPONIBILIDAD ACTIVA */

    if (
      !resultado.exists() ||
      resultado.data().activo !== true
    ) {

      contenedor.innerHTML = `

        <h3>Disponibilidad médica</h3>

        <p class="directorio-sin-disponibilidad">

          El profesional no tiene horarios
          de atención disponibles.

        </p>

      `;

      return;

    }

    const horario = resultado.data();


    /* FORMATEAR DÍAS DE ATENCIÓN */

    const nombresDias = {

      lunes: "Lunes",

      martes: "Martes",

      miercoles: "Miércoles",

      jueves: "Jueves",

      viernes: "Viernes",

      sabado: "Sábado",

      domingo: "Domingo"

    };

    const dias = Array.isArray(horario.dias)

      ? horario.dias.map(
          dia => nombresDias[dia] || dia
        ).join(", ")

      : "No especificados";


    /* MOSTRAR HORARIOS */

    contenedor.innerHTML = `

      <h3>Disponibilidad médica</h3>

      <span class="directorio-disponible">

        <i class="fa-solid fa-circle-check"></i>

        Disponibilidad activa

      </span>

      <p>

        <i class="fa-solid fa-calendar-days"></i>

        <strong>Días de atención:</strong>

        ${escapar(dias)}

      </p>

      <p>

        <i class="fa-solid fa-clock"></i>

        <strong>Horario:</strong>

        ${escapar(horario.horaInicio)}

        a

        ${escapar(horario.horaFin)}

      </p>

      <p>

        <i class="fa-solid fa-hourglass-half"></i>

        <strong>Duración de consulta:</strong>

        ${escapar(horario.duracion)} minutos

      </p>

    `;

  } catch (error) {

    console.error(
      "Error al consultar disponibilidad:",
      error
    );

    if (
      uidActual !== uid ||
      !contenedor.isConnected
    ) return;

    contenedor.innerHTML = `

      <h3>Disponibilidad médica</h3>

      <p class="directorio-sin-disponibilidad">

        No fue posible consultar los horarios
        del profesional.

      </p>

    `;

  }

}


/* ==========================================
   SELECCIONAR MÉDICO PARA UNA CITA
========================================== */

function solicitarCitaDesdeDirectorio(medicoId) {

  if (
    rolActual !== "paciente" ||
    !sesionLista ||
    !uidActual
  ) return;


  /* BUSCAR MÉDICO SELECCIONADO */

  const medico = medicosDirectorio.find(

    profesional => profesional.id === medicoId

  );

  if (!medico) {

    window.alert(

      "No se encontró el perfil profesional."

    );

    return;

  }


  /* GUARDAR SELECCIÓN TEMPORAL */

  medicoSeleccionadoCita = {

    pacienteId: uidActual,

    medicoId: medico.id,

    nombre: medico.nombre ||
      "Profesional médico",

    especialidad: medico.especialidad ||
      "Sin especialidad registrada"

  };


  /* NAVEGAR AL MÓDULO DE CITAS */

  location.hash = "#citas";

}


/* ==========================================
   CARGAR MÉDICO SELECCIONADO EN CITAS
========================================== */

async function cargarMedicoSeleccionadoCita() {

  if (
    rolActual !== "paciente" ||
    !uidActual ||
    !medicoSeleccionadoCita
  ) return;

  const uid = uidActual;

  const seleccion = medicoSeleccionadoCita;


  /* EVITAR REUTILIZAR SELECCIONES ANTERIORES */

  medicoSeleccionadoCita = null;

  if (seleccion.pacienteId !== uid) return;


  /* LOCALIZAR FORMULARIO DE CITAS */

  const formulario = document.getElementById(
    "formCita"
  );

  const campoMedico = document.getElementById(
    "medicoCita"
  );

  const botonConsultar = document.getElementById(
    "consultarDisponibilidadCita"
  );

  if (
    !formulario ||
    !campoMedico ||
    !botonConsultar
  ) return;


  /* COMPROBAR QUE EL PERFIL SIGA PUBLICADO */

  try {

    const resultado = await getDoc(

      doc(
        db,
        "directorioMedico",
        seleccion.medicoId
      )

    );

    if (
      uidActual !== uid ||
      !formulario.isConnected
    ) return;

    if (
      !resultado.exists() ||
      resultado.data().visible !== true
    ) {

      throw new Error(
        "El perfil ya no está publicado."
      );

    }

    const medico = resultado.data();


    /* ASIGNAR UID AUTOMÁTICAMENTE */

    campoMedico.value = seleccion.medicoId;

    campoMedico.readOnly = true;


    /* MOSTRAR INFORMACIÓN DEL PROFESIONAL */

    const tarjeta = document.createElement(
      "div"
    );

    tarjeta.className =
      "cita-medico-seleccionado";

    tarjeta.id =
      "medicoSeleccionadoTarjeta";

    tarjeta.innerHTML = `

      <div class="directorio-avatar">

        ${escapar(
          obtenerIniciales(medico.nombre)
        )}

      </div>

      <div>

        <span>Médico seleccionado</span>

        <h3>${escapar(medico.nombre)}</h3>

        <p>

          ${escapar(
            medico.especialidad ||
            "Sin especialidad registrada"
          )}

        </p>

        <small>

          Perfil de demostración

        </small>

      </div>

      <button
        type="button"
        id="cambiarMedicoCita"
        class="btn">

        Cambiar médico

      </button>

    `;

    formulario.prepend(tarjeta);


    /* OCULTAR EL CAMPO TÉCNICO DEL UID */

    campoMedico.hidden = true;

    const etiqueta = formulario.querySelector(
      'label[for="medicoCita"]'
    );

    if (etiqueta) {

      etiqueta.hidden = true;

    }


    /* CONSULTAR HORARIOS AUTOMÁTICAMENTE */

    await consultarDisponibilidadCita();

  } catch (error) {

    console.error(
      "Error al seleccionar médico:",
      error
    );

    if (
      uidActual !== uid ||
      !formulario.isConnected
    ) return;

    const mensaje = document.getElementById(
      "mensajeCita"
    );

    if (mensaje) {

      mensaje.textContent =

        "El perfil seleccionado ya no está " +

        "disponible. Selecciona otro médico " +

        "desde el directorio.";

    }

  }

}


/* ==========================================
   CAMBIAR MÉDICO SELECCIONADO
========================================== */

function cambiarMedicoCita() {

  medicoSeleccionadoCita = null;

  location.hash = "#directorio";

}


/* ==========================================
   CERRAR PERFIL PROFESIONAL
========================================== */

function cerrarPerfilMedicoDirectorio() {

  const contenedor = document.getElementById(
    "detalleMedicoDirectorio"
  );

  if (!contenedor) return;

  contenedor.hidden = true;

  contenedor.innerHTML = "";

  delete contenedor.dataset.medicoId;

}



/* EXPEDIENTE */

function expediente() {

  page.innerHTML = `
    ${encabezado(
      "Expediente Clínico Digital",
      "Administración de documentos"
    )}

    <div class="notice">
      Utiliza únicamente documentos ficticios.
      Los archivos se guardan en este navegador.
    </div>

    <article class="card">

      <h2>Subir documento</h2>

      <form id="formDocumento">

        <div class="upload-area">

          <i class="fa-solid fa-cloud-arrow-up"></i>

          <h3>Seleccionar documento</h3>

          <p>PDF, JPG o PNG. Máximo 5 MB.</p>

          <input
            type="file"
            id="documentoClinico"
            accept=".pdf,.jpg,.jpeg,.png"
            aria-label="Seleccionar documento"
            required>

          <button
            type="submit"
            class="btn primary">

            Guardar documento

          </button>

        </div>

        <p id="mensajeDocumento"
           role="status"
           aria-live="polite"></p>

      </form>

    </article>

    <article class="card section-space">

      <h2>Mis documentos</h2>

      <div id="listaDocumentos">

        <p>Cargando documentos...</p>

      </div>

    </article>
  `;

  cargarDocumentos();
}


/* CARGAR DOCUMENTOS */

async function cargarDocumentos() {

  const contenedor =
    document.getElementById("listaDocumentos");

  if (!contenedor || !uidActual) return;

  const uid = uidActual;

  try {

    const documentos =
      await obtenerDocumentos(uid);

    if (uidActual !== uid ||
        !contenedor.isConnected) return;

    if (documentos.length === 0) {

      contenedor.innerHTML = `
        <div class="empty-state">
          Todavía no tienes documentos guardados.
        </div>
      `;

      return;
    }

    contenedor.innerHTML = documentos.map(doc => `

      <div class="documento-item">

        <div class="documento-icono">

          <i class="fa-solid ${
            doc.tipo === "application/pdf"
              ? "fa-file-pdf"
              : "fa-file-image"
          }"></i>

        </div>

        <div class="documento-info">

          <strong>${escapar(doc.nombre)}</strong>

          <small>
            ${formatoPeso(doc.peso)}
            |
            ${escapar(
              new Date(doc.fecha)
                .toLocaleDateString("es-MX")
            )}
          </small>

        </div>

        <div class="documento-acciones">

          <button
            type="button"
            class="documento-btn"
            data-documento="ver"
            data-id="${doc.id}"
            aria-label="Ver documento">

            <i class="fa-solid fa-eye"></i>

          </button>

          <button
            type="button"
            class="documento-btn"
            data-documento="descargar"
            data-id="${doc.id}"
            aria-label="Descargar documento">

            <i class="fa-solid fa-download"></i>

          </button>

          <button
            type="button"
            class="documento-btn eliminar"
            data-documento="eliminar"
            data-id="${doc.id}"
            aria-label="Eliminar documento">

            <i class="fa-solid fa-trash"></i>

          </button>

        </div>

      </div>

    `).join("");

  } catch (error) {

    console.error(error);

    contenedor.textContent =
      "No se pudieron cargar los documentos.";
  }
}


/* VINCULACIÓN DE MÉDICOS Y PACIENTES */

function vinculos() {

  const medico = rolActual === "medico";

  page.innerHTML = `

    ${encabezado(
      medico ? "Mis Pacientes" : "Mis Médicos",
      medico
        ? "Administración de pacientes vinculados"
        : "Administración de médicos vinculados"
    )}

    <div class="notice">
      Las vinculaciones deberán ser autorizadas.
      Utiliza únicamente información ficticia.
    </div>

    <div class="two-grid">

      ${tarjeta(
        medico ? "Pacientes vinculados" : "Médicos vinculados",
        `
          <div class="empty-state">
            ${medico
              ? "Todavía no tienes pacientes vinculados."
              : "Todavía no tienes médicos vinculados."}
          </div>
        `
      )}

      ${tarjeta("Solicitudes de vinculación", `

        <p>
          Aquí aparecerán las solicitudes pendientes.
        </p>

        <span class="pill">
          Pendiente de conexión con Firebase
        </span>

      `)}

    </div>

  `;
}


/* CHAT */

function chat() {
  page.innerHTML = `
    ${encabezado(
      "Chat Médico",
      "Comunicación entre médicos y pacientes"
    )}

    <section class="chat-container">
      <div class="chat-heading">
        <i class="fa-solid fa-comments"></i>
        Conversaciones
      </div>

      <div class="chat-messages">
        <div class="empty-state">
          Cuando tengas un contacto vinculado,
          podrás iniciar una conversación.
        </div>
      </div>

      <div class="chat-compose">
        <input type="text"
               placeholder="Conecta un contacto para enviar mensajes"
               disabled>

        <button class="btn primary"
                type="button"
                aria-label="Enviar mensaje"
                disabled>
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </section>
  `;
}


/* FARMACIA */

const productos = [
  ["Paracetamol", "Analgésicos"],
  ["Suero oral", "Hidratación"],
  ["Gasas estériles", "Material de curación"],
  ["Solución salina", "Cuidado general"]
];

function farmacia() {
  page.innerHTML = `
    ${encabezado(
      "Farmacia Salud 360°",
      "Catálogo informativo de productos"
    )}

    <div class="notice">
      Esta sección es una demostración.
      No realiza ventas ni prescribe medicamentos.
    </div>

    <div class="card">
      <label for="buscarProducto">Buscar producto</label>

      <input id="buscarProducto"
             class="search-input"
             type="search"
             placeholder="Escribe el nombre del producto">
    </div>

    <div class="results-grid section-space"
         id="resultadosFarmacia"></div>
  `;

  mostrarProductos("");
}

function mostrarProductos(busqueda) {
  const area = document.getElementById("resultadosFarmacia");
  if (!area) return;

  const encontrados = productos.filter(producto =>
    producto[0].toLowerCase().includes(
      String(busqueda).toLowerCase()
    )
  );

  area.innerHTML = encontrados.map(producto => `
    <article class="card">
      <h2>${escapar(producto[0])}</h2>
      <span class="pill">${escapar(producto[1])}</span>
      <p>Producto del catálogo de demostración.</p>
    </article>
  `).join("") || `
    <div class="empty-state">
      No se encontraron productos.
    </div>
  `;
}
/* PERFIL PROFESIONAL */

function perfil() {

  const medico = rolActual === "medico";

  const verificado = usuario.verificado === true;

  const soloLectura = verificado ? "readonly" : "";

  page.innerHTML = `

    ${encabezado(
      medico ? "Perfil Profesional" : "Mi Perfil",
      "Administra tu información y configuración"
    )}

    <section class="profile-banner">

      <div class="profile-photo">
        ${escapar(usuario.iniciales)}
      </div>

      <div>

        <h2>${escapar(usuario.nombre)}</h2>

        <p>
          ${medico
            ? escapar(usuario.especialidad || "Médico")
            : "Paciente"}
        </p>

        <span class="pill">
          ${medico
            ? verificado
              ? "Profesional verificado"
              : "Verificación pendiente"
            : "Perfil de demostración"}
        </span>

      </div>

    </section>

    <div class="two-grid section-space">

      ${tarjeta(
        medico ? "Información profesional" : "Datos personales",
        `

        <form id="formPerfil">

          <div class="form-field">

            <label for="nombrePerfil">
              Nombre completo
            </label>

            <input
              id="nombrePerfil"
              value="${escapar(usuario.nombre)}"
              maxlength="100"
              required>

          </div>

          <div class="form-field">

            <label for="correoPerfil">
              Correo electrónico
            </label>

            <input
              id="correoPerfil"
              type="email"
              value="${escapar(usuario.correo)}"
              readonly>

          </div>

          ${medico ? `

            <div class="form-field">

              <label for="especialidadPerfil">
                Especialidad
              </label>

              <input
                id="especialidadPerfil"
                value="${escapar(usuario.especialidad)}"
                maxlength="100"
                ${soloLectura}
                required>

            </div>

            <div class="form-field">

              <label for="cedulaPerfil">
                Cédula profesional
              </label>

              <input
                id="cedulaPerfil"
                value="${escapar(usuario.cedula)}"
                maxlength="30"
                ${soloLectura}
                required>

            </div>

            <div class="form-field">

              <label for="telefonoPerfil">
                Teléfono profesional
              </label>

              <input
                id="telefonoPerfil"
                type="tel"
                value="${escapar(usuario.telefono)}"
                maxlength="20"
                placeholder="Teléfono de demostración">

            </div>

            <div class="form-field">

              <label for="consultorioPerfil">
                Consultorio
              </label>

              <input
                id="consultorioPerfil"
                value="${escapar(usuario.consultorio)}"
                maxlength="200"
                placeholder="Ubicación del consultorio">

            </div>

            <div class="form-field">

              <label for="experienciaPerfil">
                Años de experiencia
              </label>

              <input
                id="experienciaPerfil"
                type="number"
                min="0"
                max="80"
                step="1"
                value="${escapar(usuario.experiencia ?? 0)}"
                required>

            </div>

            <div class="form-field">

              <label for="descripcionPerfil">
                Descripción profesional
              </label>

              <textarea
                id="descripcionPerfil"
                rows="5"
                maxlength="1000"
                placeholder="Describe tus servicios profesionales"
              >${escapar(usuario.descripcion)}</textarea>

            </div>

          ` : ""}

          <button class="btn primary full"
                  type="submit">

            <i class="fa-solid fa-floppy-disk"></i>
            Guardar cambios

          </button>

          <p id="mensajePerfil"
             role="status"
             aria-live="polite"></p>

        </form>

      `)}

      <div class="perfil-complementos">

        ${tarjeta("Fotografía de perfil", `

          <div class="perfil-foto-contenedor">

            <div class="perfil-foto-grande">
              ${escapar(usuario.iniciales)}
            </div>

            <p>Almacenamiento pendiente</p>

            <button
              class="btn primary full"
              type="button"
              disabled>

              <i class="fa-solid fa-camera"></i>
              Cambiar fotografía

            </button>

          </div>

          <p class="demo-note">
            La carga de fotografías se habilitará
            en una etapa posterior.
          </p>

        `)}

        ${tarjeta("Estado de la cuenta", `

          <div class="perfil-estado">

            <p>
              <strong>Tipo de usuario:</strong>
              ${medico ? "Médico" : "Paciente"}
            </p>

            <p>
              <strong>Modalidad:</strong>
              Demostración
            </p>

            ${medico ? `

              <p>
                <strong>Verificación:</strong>
                ${verificado ? "Verificado" : "Pendiente"}
              </p>

            ` : ""}

          </div>

          <p class="demo-note">
            Utiliza únicamente información ficticia.
          </p>

        `)}

        ${tarjeta("Documentos", `

          <p>
            Consulta el apartado de expediente clínico.
          </p>

          ${boton(
            "Ir al expediente clínico",
            "expediente"
          )}

          <p class="demo-note">
            El almacenamiento de archivos está pendiente.
          </p>

        `)}

      </div>

    </div>

  `;
}


/* NAVEGACIÓN */

const paginas = {

  inicio: () => {

    if (rolActual === "medico") {

      inicioMedico();

    } else {

      inicioPaciente();

    }

  },

  disponibilidad,
  citas,
  directorio,
  expediente,
  vinculos,
  chat,
  farmacia,
   perfil: perfilConDirectorio

};


function cerrarMenu() {

  if (!sidebar) return;

  sidebar.classList.remove("open");

  if (menuButton) {

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );

  }

}


function navegar() {

  if (!sesionLista || !page) return;

  const ruta =
    window.location.hash.replace("#", "") || "inicio";

  const pagina = Object.prototype.hasOwnProperty.call(
    paginas,
    ruta
  ) ? ruta : "inicio";

  paginas[pagina]();

  document.querySelectorAll("[data-nav]").forEach(enlace => {

    enlace.classList.toggle(
      "active",
      enlace.dataset.nav === pagina
    );

  });

  cerrarMenu();

}


/* MENÚ MÓVIL */

if (menuButton && sidebar) {

  menuButton.addEventListener("click", () => {

    const abierto =
      sidebar.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      String(abierto)
    );

  });

}


/* ACCESO AL PERFIL */

if (profileShortcut) {

  profileShortcut.addEventListener("click", () => {

    if (!sesionLista) return;

    if (window.location.hash === "#perfil") {

      navegar();

    } else {

      window.location.hash = "perfil";

    }

  });

}


/* CERRAR SESIÓN */

async function cerrarSesion() {

  const confirmar = window.confirm(
    "¿Deseas cerrar tu sesión?"
  );

  if (!confirmar) return;

  if (logoutButton) {

    logoutButton.disabled = true;

  }

  try {

    await signOut(auth);

    window.location.replace("./login.html");

  } catch (error) {

    console.error(
      "Error al cerrar sesión:",
      error
    );

    alert("No se pudo cerrar la sesión.");

    if (logoutButton) {

      logoutButton.disabled = false;

    }

  }

}


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    cerrarSesion
  );

}


/* EVENTOS */

window.addEventListener(
  "hashchange",
  navegar
);


document.addEventListener("input", evento => {

  if (evento.target.id === "buscarProducto") {

    mostrarProductos(evento.target.value);

  }

});


/* GUARDAR PERFIL */

document.addEventListener("submit", async evento => {

  if (evento.target.id !== "formPerfil") return;

  evento.preventDefault();

  if (!sesionLista || !uidActual) return;

  const formulario = evento.target;

  const uid = uidActual;

  const mensaje =
    formulario.querySelector("#mensajePerfil");

  const botonGuardar =
    formulario.querySelector('[type="submit"]');

  const nombre =
    formulario.querySelector("#nombrePerfil").value.trim();

  if (!nombre) {

    mensaje.textContent = "Ingresa un nombre válido.";

    return;

  }

  // DATOS QUE SE ACTUALIZARÁN

  const datos = {
    nombre
  };

  // CAMPOS EXCLUSIVOS DEL MÉDICO

  if (rolActual === "medico") {

    if (!usuario.verificado) {

      datos.especialidad =
        formulario.querySelector("#especialidadPerfil")
          .value.trim();

      datos.cedula =
        formulario.querySelector("#cedulaPerfil")
          .value.trim();

      if (!datos.especialidad || !datos.cedula) {

        mensaje.textContent =
          "Completa la especialidad y la cédula.";

        return;

      }

    }

    datos.telefono =
      formulario.querySelector("#telefonoPerfil")
        .value.trim();

    datos.consultorio =
      formulario.querySelector("#consultorioPerfil")
        .value.trim();

    datos.experiencia = Number(
      formulario.querySelector("#experienciaPerfil").value
    );

    datos.descripcion =
      formulario.querySelector("#descripcionPerfil")
        .value.trim();

    if (!Number.isInteger(datos.experiencia)
        || datos.experiencia < 0
        || datos.experiencia > 80) {

      mensaje.textContent =
        "Ingresa un número válido de años de experiencia.";

      return;

    }

  }

  botonGuardar.disabled = true;

  mensaje.textContent = "Guardando información...";

  try {

    // ACTUALIZAR FIRESTORE

    await updateDoc(
      doc(db, "usuarios", uid),
      datos
    );

    // COMPROBAR QUE LA SESIÓN NO CAMBIÓ

    if (uidActual !== uid
        || auth.currentUser?.uid !== uid
        || !sesionLista) return;

    // ACTUALIZAR INFORMACIÓN LOCAL

    usuario = {

      ...usuario,
      ...datos,

      iniciales: obtenerIniciales(nombre)

    };

    // ACTUALIZAR ICONO DEL PERFIL

    if (profileShortcut) {

      profileShortcut.textContent =
        usuario.iniciales;

    }

    // ACTUALIZAR INTERFAZ

    if (formulario.isConnected) {

      perfil();

      const mensajeNuevo =
        document.getElementById("mensajePerfil");

      if (mensajeNuevo) {

        mensajeNuevo.className = "perfil-exito";

        mensajeNuevo.textContent =
          "Información guardada correctamente.";

      }

    }

  } catch (error) {

    console.error(
      "Error al guardar perfil:",
      error
    );

    mensaje.className = "perfil-error";

    mensaje.textContent =
      error.code === "permission-denied"
        ? "Revisa los permisos de Firestore."
        : "No se pudo guardar la información.";

  } finally {

    botonGuardar.disabled = false;

  }

});


/* GUARDAR DOCUMENTOS */

document.addEventListener("submit", async evento => {

  if (evento.target.id !== "formDocumento") return;

  evento.preventDefault();

  if (!sesionLista || !uidActual) return;

  const formulario = evento.target;

  const campo =
    document.getElementById("documentoClinico");

  const mensaje =
    document.getElementById("mensajeDocumento");

  const archivo = campo.files[0];

  const botonGuardar =
    formulario.querySelector('[type="submit"]');

  if (!archivo) {

    mensaje.textContent =
      "Selecciona un documento.";

    return;

  }

  botonGuardar.disabled = true;

  try {

    await guardarDocumento(uidActual, archivo);

    formulario.reset();

    mensaje.textContent =
      "Documento guardado correctamente.";

    await cargarDocumentos();

  } catch (error) {

    console.error(error);

    mensaje.textContent = error.message ||
      "No se pudo guardar el documento.";

  } finally {

    botonGuardar.disabled = false;

  }

});


/* ACCIONES DE DOCUMENTOS */

document.addEventListener("click", async evento => {

  const boton = evento.target.closest(
    "[data-documento]"
  );

  if (!boton || !sesionLista || !uidActual) return;

  const id = Number(boton.dataset.id);

  const accion = boton.dataset.documento;

  const uid = uidActual;

  if (accion === "eliminar") {

    const confirmar = confirm(
      "¿Deseas eliminar este documento?"
    );

    if (!confirmar) return;

  }

  boton.disabled = true;

  try {

    if (accion === "eliminar") {

      await eliminarDocumento(id, uid);

      await cargarDocumentos();

      return;

    }

    const documento =
      await obtenerDocumento(id, uid);

    if (!sesionLista || uidActual !== uid) return;

    const url = URL.createObjectURL(
      documento.archivo
    );

    if (accion === "ver") {

      const enlace = document.createElement("a");

      enlace.href = url;

      enlace.target = "_blank";

      enlace.rel = "noopener noreferrer";

      document.body.appendChild(enlace);

      enlace.click();

      enlace.remove();

    }

    if (accion === "descargar") {

      const enlace = document.createElement("a");

      enlace.href = url;

      enlace.download = documento.nombre;

      document.body.appendChild(enlace);

      enlace.click();

      enlace.remove();

    }

    setTimeout(() => {

      URL.revokeObjectURL(url);

    }, 60000);

  } catch (error) {

    console.error(error);

    alert("No se pudo realizar la operación.");

  } finally {

    boton.disabled = false;

  }

});


/* INICIAR INTERFAZ */

function iniciarApp() {

  const etiqueta = rolActual === "medico"
    ? "Portal del Médico"
    : "Portal del Paciente";

  const roleLabel =
    document.getElementById("roleLabel");

  const sidebarRole =
    document.getElementById("sidebarRole");

  if (roleLabel) {

    roleLabel.textContent = etiqueta;

  }

  if (sidebarRole) {

    sidebarRole.textContent = etiqueta;

  }

  if (profileShortcut) {

    profileShortcut.textContent =
      usuario.iniciales;

  }

  crearMenu();

  sesionLista = true;

  navegar();

}


/* AUTENTICACIÓN Y ROLES */

onAuthStateChanged(

  auth,

  async firebaseUser => {

    sesionLista = false;

    if (!firebaseUser) {

      window.location.replace("./login.html");

      return;

    }

    try {

      uidActual = firebaseUser.uid;

      const referencia = doc(
        db,
        "usuarios",
        uidActual
      );

      const snapshot = await getDoc(referencia);

      if (!snapshot.exists()) {

        page.textContent =
          "No se encontró tu perfil en Firestore.";

        return;

      }

      const datos = snapshot.data();

      const rol = String(datos.rol || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (!["paciente", "medico"].includes(rol)) {

        page.textContent =
          "El rol de tu cuenta no es válido.";

        return;

      }

      rolActual = rol;

      const nombre = String(

        datos.nombre ||
        firebaseUser.displayName ||
        "Usuario"

      );

      // CARGAR INFORMACIÓN DEL USUARIO

      usuario = {

        nombre,

        iniciales: obtenerIniciales(nombre),

        rol,

        correo: datos.correo || firebaseUser.email || "",

        especialidad: datos.especialidad || "",

        cedula: datos.cedula || "",

        telefono: datos.telefono || "",

        consultorio: datos.consultorio || "",

        experiencia: datos.experiencia ?? 0,

        descripcion: datos.descripcion || "",

        verificado: datos.verificado === true

      };

      iniciarApp();

    } catch (error) {

      console.error(
        "Error al cargar perfil:",
        error
      );

      page.textContent =
        "No se pudo cargar tu perfil. Revisa Firebase.";

    }

  },

  error => {

    console.error(
      "Error de sesión:",
      error
    );

    page.textContent =
      "No se pudo verificar la sesión.";

  }

);

/* ==========================================
   EVENTOS DE LA AGENDA MÉDICA
========================================== */


/* EVENTOS DE CLIC */

document.addEventListener("click", evento => {

  if (!sesionLista) return;

  if (
    evento.target.closest(
      "#consultarDisponibilidadCita"
    )
  ) {

    consultarDisponibilidadCita();

  }

  if (
    evento.target.closest("#actualizarCitas")
  ) {

    cargarCitas();

  }

  const boton = evento.target.closest(
    "[data-estado-cita]"
  );

  if (boton) {

    actualizarEstadoCita(

      boton.dataset.cita,

      boton.dataset.estadoCita,

      boton

    );

  }

});


/* CAMBIOS DE FECHA Y FILTROS */

document.addEventListener("change", evento => {

  if (!sesionLista) return;

  if (evento.target.id === "fechaCita") {

    generarHorariosCita();

  }

  if (evento.target.id === "filtroCitas") {

    cargarCitas();

  }

});


/* INVALIDAR DISPONIBILIDAD AL CAMBIAR MÉDICO */

document.addEventListener("input", evento => {

  if (evento.target.id !== "medicoCita") return;

  disponibilidadCita = null;

  document.getElementById("fechaCita")
    .disabled = true;

  document.getElementById("horaCita")
    .disabled = true;

  document.getElementById("solicitarCita")
    .disabled = true;

  document.getElementById(
    "resultadoDisponibilidadCita"
  ).textContent = "";

});


/* REGISTRAR NUEVAS CITAS */

document.addEventListener("submit", evento => {

  if (evento.target.id === "formCita") {

    guardarCita(evento);

  }

});

/* ==========================================
   EVENTOS DE CONSULTA DEL DIRECTORIO MÉDICO
========================================== */

document.addEventListener("click", evento => {

  if (!sesionLista) return;


  /* ACTUALIZAR DIRECTORIO */

  if (
    evento.target.closest(
      "#actualizarDirectorio"
    )
  ) {

    cerrarPerfilMedicoDirectorio();

    cargarDirectorioMedico();

  }


  /* CONSULTAR PERFIL PROFESIONAL */

  const botonMedico = evento.target.closest(
    "[data-ver-medico]"
  );

  if (botonMedico) {

    verPerfilMedicoDirectorio(

      botonMedico.dataset.verMedico

    );

  }


  /* CERRAR PERFIL PROFESIONAL */

  if (
    evento.target.closest(
      "#cerrarPerfilDirectorio"
    )
  ) {

    cerrarPerfilMedicoDirectorio();

  }

});

/* ==========================================
   EVENTOS DE BÚSQUEDA Y FILTROS
   DIRECTORIO MÉDICO
========================================== */


/* BÚSQUEDA MIENTRAS EL USUARIO ESCRIBE */

document.addEventListener("input", evento => {

  if (!sesionLista) return;

  if (
    evento.target.id ===
    "buscarMedicoDirectorio"
  ) {

    aplicarFiltrosDirectorio();

  }

});


/* CAMBIOS DE ESPECIALIDAD Y ORDEN */

document.addEventListener("change", evento => {

  if (!sesionLista) return;

  if (

    evento.target.id ===
      "filtroEspecialidadDirectorio"

    || evento.target.id ===
      "ordenDirectorio"

  ) {

    aplicarFiltrosDirectorio();

  }

});


/* LIMPIAR BÚSQUEDA Y FILTROS */

document.addEventListener("click", evento => {

  if (!sesionLista) return;

  if (

    evento.target.closest(
      "#limpiarFiltrosDirectorio"
    )

    || evento.target.closest(
      "[data-limpiar-directorio]"
    )

  ) {

    limpiarFiltrosDirectorio();

  }

});

/* ==========================================
   EVENTOS DE INTEGRACIÓN CON CITAS MÉDICAS
========================================== */

document.addEventListener("click", evento => {

  if (!sesionLista) return;


  /* SOLICITAR CITA DESDE EL DIRECTORIO */

  const botonSolicitar = evento.target.closest(

    "[data-solicitar-cita]"

  );

  if (botonSolicitar) {

    solicitarCitaDesdeDirectorio(

      botonSolicitar.dataset.solicitarCita

    );

  }


  /* CAMBIAR MÉDICO SELECCIONADO */

  if (
    evento.target.closest(
      "#cambiarMedicoCita"
    )
  ) {

    cambiarMedicoCita();

  }

});

/* SERVICE WORKER */

if ("serviceWorker" in navigator) {

  window.addEventListener("load", async () => {

    try {

      const registro =
        await navigator.serviceWorker.register("./sw.js");

      console.log(
        "Service Worker registrado:",
        registro.scope
      );

      await registro.update();

    } catch (error) {

      console.error(
        "Error al registrar Service Worker:",
        error
      );

    }

  });

}