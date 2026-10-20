// EMUNAH · filtros compartidos por el chat de la página (api/chat-rut.js) y el de WhatsApp (api/whatsapp.js)
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

module.exports = { normalizar, esManipulacion };
