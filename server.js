import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Almacenamiento en memoria (MVP)
const registrations = [];

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "padel-api" });
});

// Crear inscripción
app.post("/api/registrations", (req, res) => {
  const {
    torneo_slug,             // ej: "torneo-demo-2025"
    categoria,
    capitan_nombre,
    capitan_email,
    companero_nombre,
    companero_email,
    nivel,
    observaciones,
    tipo,                    // "pareja" | "individual"
  } = req.body || {};

  if (!categoria || !capitan_nombre || !capitan_email) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const reg = {
    id: `reg_${Date.now()}`,
    torneo_slug: torneo_slug || null,
    categoria,
    capitan_nombre,
    capitan_email,
    companero_nombre: companero_nombre || null,
    companero_email: companero_email || null,
    nivel: nivel || null,
    observaciones: observaciones || null,
    tipo: tipo || "pareja",
    estado: "PENDIENTE",
    createdAt: new Date().toISOString(),
  };

  registrations.push(reg);

  // Para el form del front basta con id + estado
  return res.status(201).json({ id: reg.id, estado: reg.estado });
});

// Listar inscripciones (con filtros opcionales)
app.get("/api/registrations", (req, res) => {
  const { torneo_slug, categoria, estado } = req.query;

  let list = registrations.slice();
  if (torneo_slug) list = list.filter(r => r.torneo_slug === torneo_slug);
  if (categoria)   list = list.filter(r => r.categoria === categoria);
  if (estado)      list = list.filter(r => r.estado === estado);

  res.json(list);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
// Cambiar estado de una inscripción
app.patch("/api/registrations/:id", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body || {};

  const ALLOWED = ["PENDIENTE", "CONFIRMADA", "LISTA_ESPERA", "CANCELADA"];
  if (!ALLOWED.includes(estado)) {
    return res.status(400).json({ error: "estado inválido" });
  }

  // Si intentan confirmar, respetar cupo por categoría y torneo
if (estado === "CONFIRMADA") {
  const cupo = getCupo(reg.torneo_slug, reg.categoria);
  const confirmadas = countConfirmed(reg.torneo_slug, reg.categoria);
  if (confirmadas >= cupo) {
    return res.status(409).json({
      error: "CUPO_LLENO",
      detalle: `Cupo ${cupo} alcanzado en ${reg.categoria} para ${reg.torneo_slug}`,
      cupo,
      confirmadas,
    });
  }
}


  const reg = registrations.find((r) => r.id === id);
  if (!reg) return res.status(404).json({ error: "inscripción no encontrada" });

  reg.estado = estado;
  return res.json({ id: reg.id, estado: reg.estado });
});

// Configuración de torneos (MVP en memoria)
const tournamentConfig = {
  "torneo-demo-2025": {
    cupos: {
      "Mixto": 1,   // ← prueba: solo 1 pareja confirmada en Mixto
      "3ª": 16,
      "4ª": 8,
    },
  },
};

function getCupo(torneo_slug, categoria) {
  const t = tournamentConfig[torneo_slug];
  return t?.cupos?.[categoria] ?? Infinity; // si no hay cupo definido, sin límite
}

function countConfirmed(torneo_slug, categoria) {
  return registrations.filter(
    (r) =>
      r.torneo_slug === torneo_slug &&
      r.categoria === categoria &&
      r.estado === "CONFIRMADA"
  ).length;
}
