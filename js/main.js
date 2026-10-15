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
