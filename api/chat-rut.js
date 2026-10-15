// POST /api/chat-rut   cuerpo: { message: "texto", history: [{ role: "user"|"rut", text: "…" }] }
//                      respuesta: { reply: "texto de Rut", whatsapp: true|false }
const { leerCatalogo } = require('../lib/catalogo');
const { preguntarARut, tieneClaveIA } = require('../lib/rut');

const MAX_POR_MINUTO = Number(process.env.RUT_RATE_PER_MIN || 12);
const ORIGENES = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);   // ej: https://tu-dominio.com

// Límite por visitante (en memoria: es una barrera básica; para algo más fuerte usa las reglas de Vercel Firewall)
const visitas = new Map();
function demasiados(ip) {
  const ahora = Date.now();
  const lista = (visitas.get(ip) || []).filter(t => ahora - t < 60000);
  lista.push(ahora); visitas.set(ip, lista);
  if (visitas.size > 3000) for (const [k, v] of visitas) if (!v.some(t => ahora - t < 60000)) visitas.delete(k);
  return lista.length > MAX_POR_MINUTO;
}

// Acepta solo peticiones que vienen de tu propia tienda (evita que otras páginas gasten tu saldo)
function origenPermitido(req) {
  const origen = req.headers.origin;
  if (!origen) return true;                                   // misma página, sin cabecera Origin
  try {
    const host = new URL(origen).host;
    if (host === req.headers.host) return true;               // tu propio dominio (incluye *.vercel.app)
  } catch { return false; }
  return ORIGENES.includes(origen);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'método no permitido' }); }
  if (!origenPermitido(req)) return res.status(403).json({ error: 'no permitido' });
  if (!tieneClaveIA()) return res.status(503).json({ error: 'no disponible' });   // la tienda usa entonces las respuestas locales

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim();
  if (demasiados(ip)) return res.status(429).json({ error: 'demasiados mensajes' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 10000) return res.status(400).json({ error: 'solicitud inválida' });

  const mensaje = typeof body.message === 'string' ? body.message.trim().slice(0, 600) : '';
  if (!mensaje) return res.status(400).json({ error: 'mensaje vacío' });

  try {
    const catalogo = await leerCatalogo().catch(() => null);
    const out = await preguntarARut(body.history, mensaje, catalogo);
    return res.status(200).json(out);
  } catch (e) {
    console.error('rut:', e.message);
    return res.status(503).json({ error: 'no disponible' });   // la tienda usa entonces las respuestas locales
  }
};
