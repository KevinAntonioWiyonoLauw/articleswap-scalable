import { json, type RequestHandler } from '@sveltejs/kit';
import { getProducer } from '$lib/kafka';
import dotenv from 'dotenv';

dotenv.config();

const topic = process.env.KAFKA_TOPIC || 'article-submissions';

/**
 * Handle POST request for submitting articles.
 * Publishes the article payload to Kafka for pipeline processing.
 *
 * @param event SvelteKit RequestEvent containing request payload.
 * @returns Promise resolving to a Response object with status 202 (Accepted) or 400/500 on failure.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, content, fileData, fileName, sender, receiver } = body;

    // Validation (must have text content OR fileData)
    if (!title || (!content && !fileData) || !sender || !receiver) {
      return json(
        { error: 'Missing required fields: title, sender, receiver, and either content or a file' },
        { status: 400 }
      );
    }

    const articleId = crypto.randomUUID();
    const articlePayload = {
      id: articleId,
      title,
      content: content || '',
      file: fileData ? { name: fileName, data: fileData } : null,
      sender,
      receiver,
      timestamp: new Date().toISOString()
    };

    // Get connection and publish
    const producer = await getProducer();
    await producer.send({
      topic,
      messages: [
        {
          key: articleId,
          value: JSON.stringify(articlePayload)
        }
      ]
    });

    // In local development/fallback mode, simulate worker processing & push directly to receiver
    if (process.env.KAFKA_BROKERS === 'localhost:9092') {
      Promise.all([
        import('$lib/receiverRegistry'),
        import('$lib/mockPipeline')
      ]).then(([{ sendToReceiver }, { generateMockAnalysis }]) => {
        setTimeout(() => {
          const analysis = generateMockAnalysis(title, content);
          sendToReceiver(receiver, {
            ...articlePayload,
            title: `[PROCESSED] ${articlePayload.title}`,
            content: articlePayload.content,
            status: 'pipeline_processed',
            stemmed: analysis.stemmed,
            wordCloud: analysis.wordCloud
          });
        }, 1500); // 1.5s simulated pipeline lag
      });
    }

    return json(
      {
        message: 'Article submitted successfully to processing pipeline',
        articleId
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Error submitting article:', error);
    return json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
};


