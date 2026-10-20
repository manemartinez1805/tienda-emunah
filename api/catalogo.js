// GET /api/catalogo  →  [{ id, nombre, precio_cop, descripcion, categoria, disponibilidad, imagen_url }, ...]
const { leerCatalogo } = require('../lib/catalogo');

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'método no permitido' });
  }
  try {
    const rows = await leerCatalogo();
    // La red de Vercel guarda la respuesta 60 s: menos consultas a la base y tienda más rápida
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(rows);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'no disponible' });   // mensaje genérico: no revela detalles internos
  }
};
