import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "padel-api" });
});

app.post("/api/registrations", (req, res) => {
  const {
    categoria,
    capitan_nombre,
    capitan_email,
    companero_nombre,
    companero_email,
    nivel,
    observaciones,
    tipo, // "pareja" | "individual" (opcional en MVP)
  } = req.body || {};

  if (!categoria || !capitan_nombre || !capitan_email) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  // ID simple temporal para MVP
  const id = `reg_${Date.now()}`;

  return res.status(201).json({
    id,
    estado: "PENDIENTE",
    categoria,
    capitan_nombre,
    capitan_email,
    companero_nombre,
    companero_email,
    nivel,
    observaciones,
    tipo: tipo || "pareja",
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
