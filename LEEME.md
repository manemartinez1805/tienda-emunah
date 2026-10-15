# Tienda EMUNAH en Vercel

```
index.html         tienda (ya llama a js/main.js al final)
js/main.js         navegador: pide /api/catalogo y /api/chat-rut (sin claves)
api/catalogo.js    servidor: lee Supabase y devuelve los productos
api/chat-rut.js    servidor: habla con la IA y devuelve la respuesta de Rut
lib/               código compartido del servidor
vercel.json        cabeceras de seguridad
```

## Puesta en marcha
1. Sube todo a GitHub y conéctalo a Vercel (Import Project). No hace falta configurar compilación.
2. En Vercel > Settings > Environment Variables crea: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
   (opcionales en `.env.example`). Después **redeploy**.
3. En Supabase: la tabla `productos_emunah` debe permitir **solo lectura** al rol anónimo (RLS con SELECT).
   Columnas: nombre, precio_cop, descripcion, categoria, disponibilidad, imagen_url (y opcional `activo`).
4. Prueba: abre `https://tu-sitio.vercel.app/api/catalogo` → debe mostrar los productos en JSON.

## Si algo falla
- «Catálogo en preparación.» → revisa `SUPABASE_URL`, `SUPABASE_ANON_KEY`, la política de lectura y los nombres de columnas.
- Rut responde con sus respuestas de siempre → falta `ANTHROPIC_API_KEY`, no hay saldo, o se superó el límite por minuto. El chat nunca se rompe.
- Mira Vercel > Logs: los errores internos se guardan ahí y no se muestran al visitante.

## Seguridad
- Ninguna clave está en el HTML ni en `js/main.js`.
- `/api/chat-rut` solo acepta peticiones de tu propio sitio, limita mensajes (600 caracteres) y frecuencia (12/min por visitante),
  trata todo lo que escribe el cliente como consulta y no como orden, y nunca acepta turnos falsos de "Rut" desde el navegador.
- El límite por minuto vive en memoria de cada instancia (es una barrera básica). Para algo más fuerte activa
  Vercel Firewall > Rate Limiting sobre `/api/chat-rut`, y pon un tope de gasto en el panel de tu IA.
- Cada respuesta de Rut consume saldo de tu cuenta de la IA.
