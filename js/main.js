// ========================================================
// 1. INICIALIZAR CONEXIÓN PÚBLICA CON SUPABASE
// ========================================================
const SUPABASE_URL = "https://supabase.co"; 
const SUPABASE_KEY = "sb_publishable_7sxze1he_SjEPpqUgX_nJw_WTJl5f09"; // Tu clave pública exacta

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================================================
// 2. FUNCIÓN PARA PINTAR LOS PRODUCTOS EN TU DISEÑO REAL
// ========================================================
async function cargarProductosEmunah() {
    try {
        // Consultamos tus 44 productos en Supabase
        const { data: productos, error } = await supabase
            .from('productos_emunah')
            .select('*');

        if (error) throw error;

        console.log("Catálogo EMUNAH cargado con éxito:", productos);
        
        // Buscamos el contenedor exacto que vimos en tu index.html (Línea 345)
        const contenedor = document.getElementById('productGrid');
        
        if (contenedor) {
            contenedor.innerHTML = ""; // Limpia cualquier mensaje de preparación anterior

            // Recorremos tu inventario y dibujamos las tarjetas comerciales
            productos.forEach(producto => {
                const urlImagen = producto.imagen_url || producto.imagen || 'img/placeholder.jpg';
                
                contenedor.innerHTML += `
                    <div class="tarjeta-producto" style="border: 1px solid #f0f0f0; padding: 15px; border-radius: 12px; text-align: center; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: transform 0.2s;">
                        <img src="${urlImagen}" alt="${producto.nombre}" style="width: 100%; height: 180px; object-fit: contain; margin-bottom: 10px;">
                        <h3 style="font-size: 15px; font-weight: 600; color: #111; margin: 8px 0; min-height: 40px; display: flex; align-items: center; justify-content: center;">${producto.nombre}</h3>
                        <p style="color: #ea580c; font-weight: 700; font-size: 16px; margin: 5px 0;">$${Number(producto.precio).toLocaleString('es-CO')} COP</p>
                        <button style="background: #000; color: #fff; border: none; width: 100%; padding: 10px; border-radius: 8px; font-weight: 500; cursor: pointer; margin-top: 10px;">Agregar</button>
                    </div>
                `;
            });
        }
        
    } catch (err) {
        console.error("Error conectando con el catálogo de Supabase:", err.message);
    }
}

// Ejecutar la carga automáticamente apenas se abra la página web
document.addEventListener('DOMContentLoaded', cargarProductosEmunah);

// ========================================================
// 3. CONECTOR SEGURO DEL CHAT (MANTIENE VIVA A RUT)
// ========================================================
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
        const mensaje = userInput.value.trim();
        if (!mensaje) return;

        chatBox.innerHTML += `<p><b>Tú:</b> ${mensaje}</p>`;
        userInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch('/api/chat-rut', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensajeUsuario: mensaje, tiendaId: "tienda_emunah_01" }) 
            });

            const data = await response.json();
            
            if (data.error) {
                chatBox.innerHTML += `<p style="color: red;"><b>Error:</b> ${data.error}</p>`;
            } else {
                chatBox.innerHTML += `<p><b>Rut:</b> ${data.respuesta}</p>`;
            }
        } catch (error) {
            chatBox.innerHTML += `<p style="color: red;"><b>Error:</b> No se pudo conectar con la asistente.</p>`;
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
}
