/* EMUNAH · js/main.js
   Conecta la tienda con tu backend de Vercel. Corre en el navegador: NO lleva ninguna clave.
   Se carga al final de index.html, después del script principal, y usa sus funciones:
   products, normalizarProducto, renderCatalog, setCatalogMessage, MSG_CATALOGO,
   rutSay, showTypingIndicator, escapeHTML, waButton, buildOrderMessage. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- Catálogo → GET /api/catalogo
  // Reemplaza a cargarProductos() del script principal (esa se llama al abrir la página).
  window.cargarProductos = async function cargarProductos() {
    setCatalogMessage('Cargando catálogo…');
    try {
      const res = await fetch('/api/catalogo', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('catálogo HTTP ' + res.status);
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('respuesta inesperada');
      products = rows.filter(r => r && r.activo !== false).map(normalizarProducto).filter(Boolean);
      if (!products.length) { setCatalogMessage(MSG_CATALOGO); return; }
      renderCatalog();
    } catch (err) {
      setCatalogMessage(MSG_CATALOGO);   // mensaje neutral: el visitante no ve detalles técnicos
    }
  };

  // ---------------------------------------------------------------- Rut → POST /api/chat-rut
  // Intenta con el servidor; si falla (sin clave, caído, límite de mensajes…) usa las respuestas locales de siempre.
  const respuestasLocales = window.processRutAIResponse;   // la versión del script principal
  const historial = [];                                    // últimos turnos, para que Rut recuerde la charla

  const MAX_CARACTERES = 300;   // el servidor rechaza mensajes más largos
  const decir = texto => rutSay('<p>' + escapeHTML(texto) + '</p>', 100);

  window.processRutAIResponse = async function processRutAIResponse(userQuery) {
    if (String(userQuery).length > MAX_CARACTERES) {
      return decir('Tu mensaje es muy largo. Por favor escríbelo en menos de ' + MAX_CARACTERES + ' caracteres.');
    }
    showTypingIndicator(true);
    try {
      const res = await fetch('/api/chat-rut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery, history: historial.slice(-8) })
      });
      // 400 (mensaje no permitido o muy largo) y 429 (demasiados mensajes): el servidor manda el texto que debe ver el cliente
      if (res.status === 400 || res.status === 429) {
        const d = await res.json().catch(() => null);
        if (d && typeof d.reply === 'string' && d.reply.trim()) { showTypingIndicator(false); return decir(d.reply.trim()); }
      }
      if (!res.ok) throw new Error('rut HTTP ' + res.status);
      const data = await res.json();
      const reply = typeof data.reply === 'string' ? data.reply.trim() : '';
      if (!reply) throw new Error('respuesta vacía');
      showTypingIndicator(false);
      historial.push({ role: 'user', text: userQuery }, { role: 'rut', text: reply });
      if (historial.length > 16) historial.splice(0, historial.length - 16);
      // La respuesta se escapa antes de pintarla: nunca se inserta HTML que venga del servidor
      rutSay('<p>' + escapeHTML(reply).replace(/\n/g, '<br>') + '</p>'
        + (data.whatsapp ? waButton('Enviar mi pedido por WhatsApp', buildOrderMessage(userQuery)) : ''), 100);
    } catch (err) {
      showTypingIndicator(false);
      return respuestasLocales(userQuery);
    }
  };
})();
