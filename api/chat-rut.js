// POST /api/chat-rut   cuerpo: { message: "texto", history: [{ role: "user"|"rut", text: "…" }] }
//                      respuesta: { reply: "texto de Rut", whatsapp: true|false }
// Pensado solo para la tienda EMUNAH. La clave de la IA vive únicamente en la variable de entorno ANTHROPIC_API_KEY.
const { leerCatalogo } = require('../lib/catalogo');
const { preguntarARut, tieneClaveIA } = require('../lib/rut');

const MAX_CARACTERES = 300;                                           // un mensaje más largo ni siquiera sale hacia la API de Anthropic
const MAX_POR_MINUTO = Number(process.env.RUT_RATE_PER_MIN || 5);     // mensajes por minuto y por IP
const ORIGENES = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);   // ej: https://tu-dominio.com

// Mensajes que ve el cliente cuando se bloquea algo (no revelan qué regla se activó)
const MSG_LARGO = `Tu mensaje es muy largo. Por favor escríbelo en menos de ${MAX_CARACTERES} caracteres.`;
const MSG_FUERA = 'Solo puedo ayudarte con el catálogo de EMUNAH: camisetas, termos, tazas y más. ¿Qué producto te gustaría conocer? Bendiciones.';
const MSG_RAPIDO = 'Estás escribiendo muy rápido. Espera un momento y vuelve a intentarlo, por favor.';

// ---------------------------------------------------------------- Filtro anti-inyección de instrucciones
// Lista negra de frases típicas de manipulación. Es una capa extra (se evade con facilidad): la defensa principal es
// el diseño del sistema (historial nunca como turnos de Rut, reglas fijas, tope de tokens y límite por IP).
const PROHIBIDAS = [
  /\bignore\b/,                                                        // "ignore previous instructions"
  /\bignora(r|d|s)?\b.*\b(instruccion(es)?|anterior(es)?|reglas?|prompt|todo)\b/,
  /\bolvida\b.*\b(lo anterior|todo|tus instrucciones|las instrucciones|tus reglas)\b/,
  /\bolvid(a|ar|en)\b.*\b(lo que te dijeron|lo anterior)\b/,
  /\b(dame|dime|muestra(me)?|revela(me)?|repite|imprime|escribe)\b.*\b(tu|tus|el)\b.*\b(prompt|instrucciones|configuracion)\b/,
  /system\s*prompt/,
  /prompt (del|de) sistema/,
  /instrucciones (del|de) sistema/,
  /\bactua como\b/,
  /\bactuar como\b/,
  /\bhacker\b/,
  /\bjailbreak\b/,
  /\bmodo (desarrollador|dios|dan)\b/,
  /\bdeveloper mode\b/,
];

function normalizar(texto) {
  return String(texto)
    .normalize('NFKC')
    .replace(/[​-‏⁠﻿]/g, '')          // caracteres invisibles usados para saltarse filtros
    .normalize('NFD').replace(/[̀-ͯ]/g, '')      // sin tildes
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
function esManipulacion(mensaje) {
  const t = normalizar(mensaje);
  return PROHIBIDAS.some(re => re.test(t));
}

// ---------------------------------------------------------------- Límite por IP (en memoria)
// Barrera básica: cada instancia de Vercel lleva su propia cuenta. Se complementa con la regla de Vercel Firewall.
const visitas = new Map();
function demasiados(ip) {
  const ahora = Date.now();
  const lista = (visitas.get(ip) || []).filter(t => ahora - t < 60000);
  lista.push(ahora); visitas.set(ip, lista);
  if (visitas.size > 3000) for (const [k, v] of visitas) if (!v.some(t => ahora - t < 60000)) visitas.delete(k);
  return lista.length > MAX_POR_MINUTO;
}
function ipDe(req) {
  const h = req.headers;
  const ip = h['x-vercel-forwarded-for'] || h['x-real-ip'] || h['x-forwarded-for'] || req.socket?.remoteAddress || 'x';
  return String(ip).split(',')[0].trim();
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

  // C. Límite por IP: más de 5 mensajes por minuto → 429 (se cuenta antes de cualquier otra validación)
  if (demasiados(ipDe(req))) return res.status(429).json({ error: 'demasiados mensajes', reply: MSG_RAPIDO });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 10000) return res.status(400).json({ error: 'solicitud inválida' });

  // A. Sanitización por longitud: nada de recortar en silencio, la petición se aborta
  if (typeof body.message !== 'string') return res.status(400).json({ error: 'mensaje vacío' });
  const mensaje = body.message.trim();
  if (!mensaje) return res.status(400).json({ error: 'mensaje vacío' });
  if (mensaje.length > MAX_CARACTERES) return res.status(400).json({ error: 'mensaje demasiado largo', reply: MSG_LARGO });

  // B. Filtro anti-prompt-injection: si coincide, no se envía nada a la API de Anthropic
  if (esManipulacion(mensaje)) return res.status(400).json({ error: 'mensaje no permitido', reply: MSG_FUERA });

  try {
    const catalogo = await leerCatalogo().catch(() => null);
    const out = await preguntarARut(body.history, mensaje, catalogo);
    return res.status(200).json(out);
  } catch (e) {
    console.error('rut:', e.message);
    return res.status(503).json({ error: 'no disponible' });   // la tienda usa entonces las respuestas locales
  }
};
