import { NextRequest } from 'next/server'
import { chatImmobilierStream } from '@/lib/ai'
import type { ChatMessage }     from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json() as { messages: ChatMessage[], context?: string }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages requis' }), { status: 400 })
    }

    const stream = await chatImmobilierStream(messages, context)
    
    if (!stream) {
      throw new Error("Impossible de démarrer le flux avec OpenRouter")
    }

    const reader = stream.getReader()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') break
                
                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  // Ignorer les chunks mal formés
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (error: any) {
    console.error("API Chat Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
