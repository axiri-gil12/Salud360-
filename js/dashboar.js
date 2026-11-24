
// =====================================
// SALUD 360°
// FUNCIONES DEL DASHBOARD
// =====================================

// MENÚ RESPONSIVE

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  const abierto = sidebar.classList.toggle("open");

  menuToggle.setAttribute(
    "aria-expanded",
    String(abierto)
  );
});

// Cerrar menú al hacer clic fuera

document.addEventListener("click", (event) => {
  if (
    window.innerWidth <= 900 &&
    !sidebar.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    sidebar.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

// =====================================
// DATOS DE EJEMPLO
// Reemplazar por información de Firebase
// =====================================

const citaEjemplo = {
  especialidad: "CARDIOLOGÍA",
  medico: "Dr. Roberto Mendoza",
  cedula: "Céd. Prof. 6184920",
  fecha: "16 Nov 2026",
  hora: "10:30 AM",
  lugar: "Hospital Star Médica Morelia",
  estado: "Confirmada"
};

// Activar en true para mostrar el ejemplo.
// En producción, cargar la cita desde Firebase.

const mostrarEjemplo = true;

if (mostrarEjemplo) {
  mostrarCita(citaEjemplo);
}

function mostrarCita(cita) {
  document.getElementById("especialidadCita")
    .textContent = cita.especialidad;

  document.getElementById("nombreMedico")
    .textContent = cita.medico;

  document.getElementById("cedulaMedico")
    .textContent = cita.cedula;

  document.getElementById("fechaCita")
    .textContent = cita.fecha;

  document.getElementById("horaCita")
    .textContent = cita.hora;

  document.getElementById("lugarCita")
    .textContent = cita.lugar;

  document.getElementById("estadoCita")
    .textContent = cita.estado;
}

// =====================================
// MEDICAMENTOS DE EJEMPLO
// =====================================

const medicamentos = [
  {
    id: 1,
    nombre: "Losartán 50 mg",
    indicacion: "1 tableta con agua",
    hora: "08:00 AM",
    tomado: true
  },
  {
    id: 2,
    nombre: "Vitamina D3 2000 UI",
    indicacion: "1 cápsula después de comer",
    hora: "02:00 PM",
    tomado: false
  },
  {
    id: 3,
    nombre: "Omega 3 Cardioprotector",
    indicacion: "1 cápsula blanda",
    hora: "09:00 PM",
    tomado: false
  }
];

// =====================================
// MOSTRAR MEDICAMENTOS
// =====================================

function mostrarMedicamentos() {
  const contenedor =
    document.getElementById("listaMedicamentos");

  contenedor.innerHTML = "";

  if (medicamentos.length === 0) {
    contenedor.textContent =
      "No hay medicamentos registrados.";
    actualizarProgreso();
    return;
  }

  medicamentos.forEach((medicamento) => {
    const item = document.createElement("div");

    item.className = "medication-item";

    if (medicamento.tomado) {
      item.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = medicamento.tomado;
    checkbox.setAttribute(
      "aria-label",
      "Marcar toma de " + medicamento.nombre
    );

    checkbox.addEventListener("change", () => {
      medicamento.tomado = checkbox.checked;
      mostrarMedicamentos();
    });

    const info = document.createElement("div");
    info.className = "medication-info";

    const nombre = document.createElement("h4");
    nombre.textContent = medicamento.nombre;

    const indicacion = document.createElement("p");
    indicacion.textContent = medicamento.indicacion;

    info.append(nombre, indicacion);

    const hora = document.createElement("span");
    hora.className = "medication-time";

    hora.textContent = medicamento.tomado
      ? "Tomada ✓"
      : medicamento.hora;

    item.append(checkbox, info, hora);
    contenedor.appendChild(item);
  });

  actualizarProgreso();
}

// =====================================
// ACTUALIZAR PROGRESO
// =====================================

function actualizarProgreso() {
  const total = medicamentos.length;

  const tomadas = medicamentos.filter(
    (medicamento) => medicamento.tomado
  ).length;

  const porcentaje = total === 0
    ? 0
    : Math.round((tomadas / total) * 100);

  document.getElementById("medicamentosContador")
    .textContent =
    `${tomadas}/${total} tomas (${porcentaje}%)`;

  document.getElementById("progresoMedicamentos")
    .style.width = `${porcentaje}%`;
}

// =====================================
// BOTÓN SOS
// =====================================

const btnSOS = document.getElementById("btnSOS");

btnSOS.addEventListener("click", () => {
  const confirmar = confirm(
    "¿Necesitas comunicarte con emergencias?"
  );

  if (confirmar) {
    window.location.href = "tel:911";
  }
});

// =====================================
// INICIALIZAR DASHBOARD
// =====================================

mostrarMedicamentos();