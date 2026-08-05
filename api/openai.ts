import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API Route: /api/claude
 * Intermediaria segura para llamadas a Claude (Anthropic)
 * La key se usa SOLO en el servidor, nunca se expone al cliente
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('[API] CLAUDE_API_KEY not configured');
    return res.status(500).json({ error: 'Claude API key not configured' });
  }

  try {
    const { messages, model = 'claude-3-5-sonnet-20241022', temperature = 0.6, max_tokens = 1024 } = req.body;

    console.log('[API] Claude request:', { model, messagesCount: messages?.length });

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Llamar a Claude desde el servidor (SEGURO - la key no viaja por internet)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[API] Claude error:', response.status, error.substring(0, 200));
      return res.status(response.status).json({
        error: `Claude API error: ${response.status}`,
        details: error.substring(0, 200)
      });
    }

    const data = await response.json();
    console.log('[API] ✅ Claude response received');

    // Retornar SOLO la respuesta de Claude (nunca la key)
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[API] Error:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
