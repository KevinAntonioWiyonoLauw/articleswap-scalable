import { json, type RequestHandler } from '@sveltejs/kit';
import { sendToReceiver } from '$lib/receiverRegistry';

/**
 * Handle POST request for internal cluster message broadcasting.
 * Used to synchronize Server-Sent Events (SSE) connections across multiple local instances.
 *
 * @param event SvelteKit RequestEvent containing broadcast payload.
 * @returns Promise resolving to a Response object with status 200 on success.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { receiver, article } = await request.json();
    if (receiver && article) {
      sendToReceiver(receiver, article, true);
    }
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};
