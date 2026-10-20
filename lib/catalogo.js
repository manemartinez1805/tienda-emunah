// EMUNAH · lectura del catálogo desde Supabase (solo en el servidor de Vercel)
// Las claves salen de las variables de entorno de Vercel, NUNCA del navegador.
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.DB_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.DB_KEY || '';   // clave de LECTURA (anon). Nunca la service_role.
const TABLA = process.env.CATALOGO_TABLA || 'productos_emunah';

// Campos públicos que usa la tienda (nada más sale del servidor)
const CAMPOS = ['id', 'nombre', 'precio_cop', 'descripcion', 'categoria', 'disponibilidad', 'imagen_url', 'etiqueta'];

let copia = { at: 0, rows: null };   // última copia buena, por si la base falla un momento

// Las claves nuevas de Supabase (sb_publishable_...) van SOLO en 'apikey'; las antiguas (JWT, empiezan por eyJ) también en Authorization.
function cabeceras() {
  const h = { apikey: SUPABASE_KEY, Accept: 'application/json' };
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

async function leerCatalogo() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('faltan SUPABASE_URL / SUPABASE_ANON_KEY');
  if (copia.rows && Date.now() - copia.at < 30000) return copia.rows;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${TABLA}?select=*&order=id.asc`, {
      signal: AbortSignal.timeout(8000),
      headers: cabeceras(),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const rows = await r.json();
    copia = {
      at: Date.now(),
      rows: rows.filter(x => x.activo !== false).map(x => Object.fromEntries(CAMPOS.map(c => [c, x[c] ?? null]))),
    };
  } catch (e) {
    console.error('catálogo:', e.message);
    if (!copia.rows) throw e;
  }
  return copia.rows;
}

module.exports = { leerCatalogo };
