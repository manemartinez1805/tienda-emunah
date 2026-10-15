// 1. INICIALIZAR CONEXIÓN PÚBLICA CON SUPABASE
const SUPABASE_URL = "https://topcqcqjzhdglotjtdcn.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_7sxze1he_SjEPpqUgX_nJw_WTJl5f09"; // Tu clave completa real cerrada con comilla

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ========================================================
// 2. FUNCIÓN INTELIGENTE PARA MOSTRAR LOS PRODUCTOS
// ========================================================
async function cargarProductosEmunah() {
    try {
        const { data: productos, error } = await supabase
            .from('productos_emunah')
            .select('*');

        if (error) throw error;

        console.log("Catálogo EMUNAH cargado con éxito:", productos);
        
        // Buscar en toda la página el letrero estático que hizo Claude
        const elementos = document.querySelectorAll('*');
        let contenedorOriginal = null;

        for (let el of elementos) {
            if (el.children.length === 0 && el.textContent.trim() === "Catálogo en preparación.") {
                contenedorOriginal = el;
                break;
            }
        }

        // Si encuentra el texto, inyecta las tarjetas del catálogo
        if (contenedorOriginal) {
            const padre = contenedorOriginal.parentElement;
            
            padre.style.display = "grid";
            padre.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
            padre.style.gap = "20px";
            padre.style.padding = "20px";
            padre.style.width = "100%";
            padre.innerHTML = ""; // Borra el texto de preparación

            productos.forEach(producto => {
                const urlImagen = producto.imagen_url || producto.imagen || 'img/placeholder.jpg';
                
                padre.innerHTML += `
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

document.addEventListener('DOMContentLoaded', cargarProductosEmunah);


// ============================================================================
// ¡ATENCIÓN!: Abajo de esto dejas intacto el código del chat ('send-btn') que guardamos antes
// ============================================================================
// ========================================================
// CONECTOR DEL CHAT - EMUNAH & ANTHROPIC CLAUDE
// ========================================================

const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Escuchar el evento de clic en el botón de enviar
sendBtn.addEventListener('click', async () => {
    const mensaje = userInput.value.trim();
    if (!mensaje) return; // Si está vacío, no hace nada

    // 1. Mostrar en pantalla el mensaje que escribió el cliente
    chatBox.innerHTML += `<p><b>Tú:</b> ${mensaje}</p>`;
    userInput.value = ''; // Limpiar la barra de texto
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scrolling hacia abajo

    try {
        // 2. Envío seguro a nuestra función del servidor en Vercel
        // Reemplaza "tienda_01" por el ID dinámico de la tienda en tu modelo multiusuario
        const response = await fetch('/api/chat-rut', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mensajeUsuario: mensaje, 
                tiendaId: "tienda_emunah_01" 
            }) 
        });

        const data = await response.json();
        
        // 3. Mostrar la respuesta de Rut o el error controlado
        if (data.error) {
            chatBox.innerHTML += `<p style="color: #dc3545;"><b>Error:</b> ${data.error}</p>`;
        } else {
            chatBox.innerHTML += `<p><b>Rut:</b> ${data.respuesta}</p>`;
        }
    } catch (error) {
        chatBox.innerHTML += `<p style="color: #dc3545;"><b>Error:</b> No se pudo conectar con la asistente virtual.</p>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight; // Reajustar scroll
});

// Permitir enviar el mensaje también al presionar la tecla "Enter"
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});
