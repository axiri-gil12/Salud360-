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

function expediente() {
  page.innerHTML = `
    ${encabezado(
      "Expediente Clínico Digital",
      "Información y documentos médicos"
    )}

    <div class="notice">
      Esta sección utiliza información de demostración.
      No ingreses datos clínicos reales.
    </div>

    <div class="two-grid">
      ${tarjeta("Información médica", `
        <p>
          Aquí se mostrarán los datos clínicos
          autorizados del paciente.
        </p>
      `)}

      ${tarjeta("Documentos", `
        <p>
          Resultados de laboratorio, estudios,
          recetas y archivos médicos.
        </p>
        ${boton("Ir a mi perfil", "perfil")}
      `)}
    </div>
  `;
}

/* MÉDICOS Y PACIENTES */

function vinculos() {
  const medico = rolActual === "medico";

  page.innerHTML = `
    ${encabezado(
      medico ? "Mis Pacientes" : "Mis Médicos",
      "Conexiones entre médicos y pacientes"
    )}

    ${tarjeta(
      medico ? "Pacientes registrados" : "Buscar médicos",
      `
        <p>
          ${medico
            ? "Aquí podrás revisar solicitudes y pacientes vinculados."
            : "Aquí podrás buscar médicos y solicitar una vinculación."}
        </p>
        <span class="pill">
          Pendiente de conexión con Firebase
        </span>
      `
    )}
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

/* PERFIL */

function perfil() {
  const medico = rolActual === "medico";

  page.innerHTML = `
    ${encabezado(
      medico ? "Perfil Profesional" : "Mi Perfil",
      "Datos personales y configuración"
    )}

    <section class="profile-banner">
      <div class="profile-photo">
        ${escapar(usuario.iniciales)}
      </div>

      <div>
        <h2>${escapar(usuario.nombre)}</h2>
        <p>${medico ? "Médico" : "Paciente"}</p>
        <span class="pill">Perfil de demostración</span>
      </div>
    </section>

    <div class="two-grid section-space">
      ${tarjeta("Datos personales", `
        <form id="formPerfil">
          <div class="form-field">
            <label for="nombrePerfil">
              Nombre completo
            </label>

            <input id="nombrePerfil"
                   value="${escapar(usuario.nombre)}"
                   maxlength="100"
                   autocomplete="name"
                   required>
          </div>

          <button class="btn primary" type="submit">
            Guardar nombre
          </button>
        </form>
      `)}

      ${tarjeta("Fotografía y documentos", `
        <div class="form-field">
          <label for="fotoPerfil">
            Fotografía de perfil
          </label>

          <input type="file"
                 id="fotoPerfil"
                 accept="image/png,image/jpeg,image/webp">
        </div>

        <div class="form-field">
          <label for="archivoPerfil">
            Documento
          </label>

          <input type="file"
                 id="archivoPerfil"
                 accept=".pdf,.png,.jpg,.jpeg">
        </div>

        <p class="demo-note">
          Los archivos no se subirán hasta conectar
          Firebase Storage. No selecciones documentos reales.
        </p>
      `)}
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

  const campo = document.getElementById("nombrePerfil");
  const nombre = campo?.value.trim();

  if (!nombre || !uidActual) {
    alert("Ingresa un nombre válido.");
    return;
  }

  const botonGuardar = evento.target.querySelector(
    '[type="submit"]'
  );

  if (botonGuardar) botonGuardar.disabled = true;

  try {
    await updateDoc(
      doc(db, "usuarios", uidActual),
      { nombre }
    );

    usuario.nombre = nombre;
    usuario.iniciales = obtenerIniciales(nombre);

    if (profileShortcut) {
      profileShortcut.textContent = usuario.iniciales;
    }

    perfil();

    alert("Nombre guardado correctamente.");

  } catch (error) {
    console.error("Error al guardar perfil:", error);

    alert(
      "No se pudo guardar. Revisa los permisos de Firestore."
    );

    if (botonGuardar) botonGuardar.disabled = false;
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

      usuario = {
        nombre,
        iniciales: obtenerIniciales(nombre),
        rol
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