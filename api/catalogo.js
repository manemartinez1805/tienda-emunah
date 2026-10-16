// VERSIÓN TEMPORAL DE DIAGNÓSTICO: muestra solo un código corto del motivo del fallo.
// Cuando el catálogo funcione, se vuelve a la versión normal (que no muestra motivo).
const { leerCatalogo } = require('../lib/catalogo');

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'método no permitido' });
  }
  try {
    const rows = await leerCatalogo();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(rows);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    const m = String((e && e.message) || '');
    let motivo = 'otro';
    if (/faltan/i.test(m)) motivo = 'faltan_variables';
    else if (/^HTTP (\d{3})/.test(m)) motivo = m.slice(0, 8);
    else if (/fetch failed|invalid url|ENOTFOUND|URL/i.test(m)) motivo = 'url_invalida';
    else if (/abort|timeout/i.test(m)) motivo = 'tiempo_agotado';
    return res.status(503).json({ error: 'no disponible', motivo });
  }
};
