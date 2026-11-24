
import { auth, db } from "./firebase.js";
import {
  collection, query, where, getDocs, getDoc,
  doc, setDoc, addDoc, updateDoc,
  serverTimestamp, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export async function buscarMedicos() {
  const consulta = query(
    collection(db, "usuarios"),
    where("rolSolicitado", "==", "medico"),
    where("verificacionProfesional", "==", "aprobado"),
    limit(30)
  );
  const resultado = await getDocs(consulta);
  return resultado.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function misVinculos() {
  const uid = auth.currentUser.uid;
  const consulta = query(
    collection(db, "vinculos"),
    where("participantes", "array-contains", uid),
    limit(50)
  );
  const resultado = await getDocs(consulta);
  return resultado.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function solicitarVinculo(medicoId) {
  const pacienteId = auth.currentUser.uid;
  if (pacienteId === medicoId) throw Error("Vínculo inválido");

  const medico = await getDoc(doc(db, "usuarios", medicoId));
  if (!medico.exists() ||
      medico.data().rolSolicitado !== "medico" ||
      medico.data().verificacionProfesional !== "aprobado") {
    throw Error("El profesional no está verificado");
  }

  const id = `${pacienteId}_${medicoId}`;
  await setDoc(doc(db, "vinculos", id), {
    pacienteId, medicoId,
    participantes: [pacienteId, medicoId],
    estado: "pendiente",
    creadoEn: serverTimestamp()
  });
}

export async function responderVinculo(id, aceptar) {
  await updateDoc(doc(db, "vinculos", id), {
    estado: aceptar ? "activo" : "rechazado"
  });
}

export async function obtenerMensajes(vinculoId) {
  const consulta = query(
    collection(db, "vinculos", vinculoId, "mensajes"),
    orderBy("creadoEn", "asc"),
    limit(100)
  );
  const resultado = await getDocs(consulta);
  return resultado.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function enviarMensaje(vinculoId, texto) {
  const contenido = texto.trim();
  if (!contenido || contenido.length > 2000) {
    throw Error("El mensaje debe contener entre 1 y 2000 caracteres");
  }
  await addDoc(collection(db, "vinculos", vinculoId, "mensajes"), {
    emisorId: auth.currentUser.uid,
    texto: contenido,
    creadoEn: serverTimestamp()
  });
}
