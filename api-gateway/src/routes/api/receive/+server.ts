import type { RequestHandler } from '@sveltejs/kit';
import { clients } from '$lib/receiverRegistry';


/**
 * Handle GET request to establish a Server-Sent Events stream for a specific receiver.
 *
 * @param event SvelteKit RequestEvent containing query search params.
 * @returns Promise resolving to a Response object with stream headers or 400 on error.
 */
export const GET: RequestHandler = ({ url, request }) => {
  const receiver = url.searchParams.get('receiver');
  if (!receiver) {
    return new Response(JSON.stringify({ error: 'Receiver query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const clientId = crypto.randomUUID();
  const receiverKey = receiver.toLowerCase();

  const stream = new ReadableStream({
    start(controller) {
      const active = clients.get(receiverKey) || [];
      active.push({ id: clientId, controller });
      clients.set(receiverKey, active);
      console.log(`SSE connection established for client: ${receiverKey} (${clientId})`);
    },
    cancel() {
      const active = clients.get(receiverKey) || [];
      const updated = active.filter((c) => c.id !== clientId);
      if (updated.length > 0) {
        clients.set(receiverKey, updated);
      } else {
        clients.delete(receiverKey);
      }
      console.log(`SSE connection closed for client: ${receiverKey} (${clientId})`);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
};

