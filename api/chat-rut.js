import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Se leerá de forma segura desde el panel de Vercel
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
  }

  const { mensajeUsuario, tiendaId } = req.body;

  // BLINDAJE: Controlar que no inyecten textos gigantescos para vaciar tu saldo de Anthropic
  if (!mensajeUsuario || mensajeUsuario.length > 300) {
      return res.status(400).json({ error: 'Mensaje inválido o demasiado largo.' });
  }

  try {
      // Llamada segura a Claude 3.5 Haiku
      const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 250, // Limita el costo máximo por cada respuesta dada
          system: "Eres Rut, la asesora virtual de EMUNAH. Responde de forma cordial, corta y basada en la fe. No respondas preguntas ajenas a la tienda.",
          messages: [{ role: 'user', content: mensajeUsuario }],
      });

      return res.status(200).json({ respuesta: response.content[0].text });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error interno procesando la Inteligencia Artificial' });
  }
}
