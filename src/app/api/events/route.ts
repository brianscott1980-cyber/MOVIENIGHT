import { computeSessionResponseFromDB } from '@/lib/db';
import { broadcaster } from '@/lib/broadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  let unsubscribe: (() => void) | null = null;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') || 'session-main';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 1. Immediately send current session state for this sessionId
      try {
        const initialData = await computeSessionResponseFromDB(sessionId);
        const payload = `data: ${JSON.stringify(initialData)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      } catch (err) {
        console.error('Failed to send initial SSE payload:', err);
      }

      // 2. Subscribe to real-time broadcasts for this session
      unsubscribe = broadcaster.subscribe(sessionId, controller);
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering (e.g. NGINX)
    },
  });
}
