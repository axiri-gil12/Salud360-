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
  updateDoc
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

/* IMPORTAR ALMACENAMIENTO LOCAL */

import {
  guardarDocumento,
  obtenerDocumentos,
  obtenerDocumento,
  eliminarDocumento,
  formatoPeso
} from "./archivos.js";

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

/* MENÚ */

const menuItems = [
  ["inicio", "house", "Inicio"],
  ["citas", "calendar-check", "Citas Médicas"],
  ["directorio", "hospital", "Directorio y Seguros"],
  ["expediente", "file-medical", "Expediente Clínico"],
  ["vinculos", "user-doctor", "Mis Médicos"],
  ["chat", "comments", "Chat Médico"],
  ["farmacia", "capsules", "Farmacia"],
  ["perfil", "user-gear", "Perfil y Plan"]
];

function crearMenu() {
  if (!nav) return;

  nav.innerHTML = menuItems.map(([ruta, icono, nombre]) => {
    let titulo = nombre;

    if (rolActual === "medico") {
      if (ruta === "vinculos") titulo = "Mis Pacientes";
      if (ruta === "citas") titulo = "Agenda Médica";
      if (ruta === "perfil") titulo = "Perfil Profesional";
    }

    return `
      <a href="#${ruta}"
         class="nav-link"
         data-nav="${ruta}">
        <i class="fa-solid fa-${icono}"></i>
        <span>${titulo}</span>
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

/* INICIO MÉDICO */

function inicioMedico() {
  page.innerHTML = `
    <section class="hero">
      <span class="hero-badge">
        Panel Médico - Demostración
      </span>

      <h1>Hola, ${escapar(usuario.nombre)}</h1>

      <p>
        Administra tus consultas, pacientes,
        mensajes y documentos profesionales.
      </p>

      <div class="hero-actions">
        ${boton("Ver agenda", "citas")}
      </div>
    </section>

    <h2 class="section-title">Accesos rápidos</h2>

    <div class="quick-grid">
      ${acceso("calendar-check", "Agenda Médica", "citas")}
      ${acceso("users", "Mis Pacientes", "vinculos")}
      ${acceso("comments", "Chat Médico", "chat")}
      ${acceso("file-medical", "Expedientes", "expediente")}
    </div>

    <div class="two-grid section-space">
      ${tarjeta("Consultas programadas", `
        <span class="pill">Agenda de demostración</span>
        <p>Las próximas consultas aparecerán aquí.</p>
        ${boton("Abrir agenda", "citas")}
      `)}

      ${tarjeta("Pacientes vinculados", `
        <p>Consulta tus pacientes registrados.</p>
        ${boton("Ver pacientes", "vinculos")}
      `)}
    </div>
  `;
}

/* CITAS */

function citas() {
  const medico = rolActual === "medico";

  page.innerHTML = `
    ${encabezado(
      medico ? "Agenda Médica" : "Citas y Telemedicina",
      "Administración de consultas"
    )}

    <div class="two-grid">
      ${tarjeta(
        medico ? "Mi agenda" : "Agendar nueva cita",
        `
          <p>
            ${medico
              ? "Aquí aparecerán las solicitudes de consulta."
              : "Selecciona un médico vinculado para solicitar una consulta."}
          </p>
          <span class="pill">Próximamente</span>
        `
      )}

      ${tarjeta("Historial de citas", `
        <p>Las citas registradas aparecerán aquí.</p>
      `)}
    </div>
  `;
}

/* DIRECTORIO */

function directorio() {
  page.innerHTML = `
    ${encabezado(
      "Red de Servicios Salud 360°",
      "Hospitales, laboratorios y seguros médicos"
    )}

    <div class="results-grid">
      ${tarjeta("Hospitales y Clínicas", `
        <p>Directorio de instituciones médicas.</p>
        <span class="pill">Catálogo de demostración</span>
      `)}

      ${tarjeta("Laboratorios", `
        <p>Consulta servicios de análisis clínicos.</p>
        <span class="pill">Catálogo de demostración</span>
      `)}

      ${tarjeta("Seguros Médicos", `
        <p>Información sobre coberturas y aseguradoras.</p>
        <span class="pill">Catálogo de demostración</span>
      `)}
    </div>
  `;
}

/* EXPEDIENTE */

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
  citas,
  directorio,
  expediente,
  vinculos,
  chat,
  farmacia,
  perfil
};

function cerrarMenu() {
  if (!sidebar) return;

  sidebar.classList.remove("open");

  if (menuButton) {
    menuButton.setAttribute("aria-expanded", "false");
  }
}

function navegar() {
  if (!sesionLista || !page) return;

  const ruta = window.location.hash.replace("#", "") || "inicio";

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
    const abierto = sidebar.classList.toggle("open");

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

  if (logoutButton) logoutButton.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("./login.html");

  } catch (error) {
    console.error("Error al cerrar sesión:", error);

    alert("No se pudo cerrar la sesión.");

    if (logoutButton) logoutButton.disabled = false;
  }
}

if (logoutButton) {
  logoutButton.addEventListener("click", cerrarSesion);
}

/* EVENTOS */

window.addEventListener("hashchange", navegar);

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

  const roleLabel = document.getElementById("roleLabel");
  const sidebarRole = document.getElementById("sidebarRole");

  if (roleLabel) roleLabel.textContent = etiqueta;
  if (sidebarRole) sidebarRole.textContent = etiqueta;

  if (profileShortcut) {
    profileShortcut.textContent = usuario.iniciales;
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
      console.error("Error al cargar perfil:", error);

      page.textContent =
        "No se pudo cargar tu perfil. Revisa Firebase.";
    }
  },
  error => {
    console.error("Error de sesión:", error);

    page.textContent =
      "No se pudo verificar la sesión.";
  }
);

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