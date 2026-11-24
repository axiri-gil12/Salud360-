/* ==========================================
   SALUD 360°
   ALMACENAMIENTO LOCAL DE DOCUMENTOS
   INDEXEDDB
========================================== */

const BASE_DATOS = "Salud360Documentos";
const VERSION = 1;
const ALMACEN = "documentos";

const MAXIMO_ARCHIVO = 5 * 1024 * 1024;

const FORMATOS = [
  "application/pdf",
  "image/jpeg",
  "image/png"
];

/* ABRIR BASE DE DATOS */

function abrirBaseDatos() {

  return new Promise((resolve, reject) => {

    const solicitud = indexedDB.open(
      BASE_DATOS,
      VERSION
    );

    solicitud.onupgradeneeded = evento => {

      const db = evento.target.result;

      if (!db.objectStoreNames.contains(ALMACEN)) {

        const almacen = db.createObjectStore(
          ALMACEN,
          {
            keyPath: "id",
            autoIncrement: true
          }
        );

        almacen.createIndex(
          "usuarioId",
          "usuarioId",
          { unique: false }
        );
      }
    };

    solicitud.onsuccess = () => {
      resolve(solicitud.result);
    };

    solicitud.onerror = () => {
      reject(solicitud.error);
    };
  });
}

/* GUARDAR DOCUMENTO */

export async function guardarDocumento(
  usuarioId,
  archivo
) {

  if (!usuarioId || !archivo) {
    throw new Error("Selecciona un archivo válido.");
  }

  if (!FORMATOS.includes(archivo.type)) {
    throw new Error("Formato de archivo no permitido.");
  }

  if (archivo.size > MAXIMO_ARCHIVO) {
    throw new Error("El archivo supera los 5 MB.");
  }

  const db = await abrirBaseDatos();

  return new Promise((resolve, reject) => {

    const transaccion = db.transaction(
      ALMACEN,
      "readwrite"
    );

    const almacen = transaccion.objectStore(ALMACEN);

    const documento = {
      usuarioId,
      nombre: archivo.name,
      tipo: archivo.type,
      peso: archivo.size,
      fecha: new Date().toISOString(),
      archivo
    };

    const solicitud = almacen.add(documento);

    transaccion.oncomplete = () => {
      db.close();
      resolve(solicitud.result);
    };

    transaccion.onabort = () => {
      db.close();
      reject(transaccion.error);
    };
  });
}

/* CONSULTAR DOCUMENTOS DEL USUARIO */

export async function obtenerDocumentos(usuarioId) {

  if (!usuarioId) {
    throw new Error("Usuario no válido.");
  }

  const db = await abrirBaseDatos();

  return new Promise((resolve, reject) => {

    const transaccion = db.transaction(
      ALMACEN,
      "readonly"
    );

    const almacen = transaccion.objectStore(ALMACEN);

    const indice = almacen.index("usuarioId");

    const solicitud = indice.getAll(usuarioId);

    solicitud.onsuccess = () => {

      const documentos = solicitud.result.sort(
        (a, b) => b.fecha.localeCompare(a.fecha)
      );

      resolve(documentos);
    };

    solicitud.onerror = () => {
      reject(solicitud.error);
    };

    transaccion.oncomplete = () => db.close();
    transaccion.onabort = () => db.close();
  });
}

/* OBTENER UN DOCUMENTO */

export async function obtenerDocumento(
  id,
  usuarioId
) {

  const db = await abrirBaseDatos();

  return new Promise((resolve, reject) => {

    const transaccion = db.transaction(
      ALMACEN,
      "readonly"
    );

    const almacen = transaccion.objectStore(ALMACEN);

    const solicitud = almacen.get(Number(id));

    solicitud.onsuccess = () => {

      const documento = solicitud.result;

      if (!documento ||
          documento.usuarioId !== usuarioId) {

        reject(new Error("Documento no disponible."));
        return;
      }

      resolve(documento);
    };

    solicitud.onerror = () => {
      reject(solicitud.error);
    };

    transaccion.oncomplete = () => db.close();
    transaccion.onabort = () => db.close();
  });
}

/* ELIMINAR DOCUMENTO */

export async function eliminarDocumento(
  id,
  usuarioId
) {

  const db = await abrirBaseDatos();

  return new Promise((resolve, reject) => {

    const transaccion = db.transaction(
      ALMACEN,
      "readwrite"
    );

    const almacen = transaccion.objectStore(ALMACEN);

    const solicitud = almacen.get(Number(id));

    let autorizado = false;

    solicitud.onsuccess = () => {

      const documento = solicitud.result;

      if (!documento ||
          documento.usuarioId !== usuarioId) {

        transaccion.abort();
        return;
      }

      autorizado = true;

      almacen.delete(Number(id));
    };

    transaccion.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaccion.onabort = () => {
      db.close();

      reject(
        autorizado
          ? transaccion.error
          : new Error("Documento no disponible.")
      );
    };
  });
}

/* CONVERTIR TAMAÑO DEL ARCHIVO */

export function formatoPeso(bytes) {

  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}