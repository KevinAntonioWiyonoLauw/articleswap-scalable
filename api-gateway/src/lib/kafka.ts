import { Kafka, type Producer } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'articles-api-gateway';

const kafka = new Kafka({
  clientId,
  brokers
});

let producer: Producer | null = null;

/**
 * Retrieves the singleton Kafka Producer instance and ensures it is connected.
 * If the connection fails (e.g. ECONNREFUSED), it falls back to print-only Mock mode.
 * 
 * @returns Connected Kafka Producer (either real connection or fallback mock producer).
 *
 * @throws Never throws directly; captures internal connection failures to switch to Mock mode.
 */
export async function getProducer(): Promise<Producer> {
  if (!producer) {
    try {
      const tempProducer = kafka.producer();
      await tempProducer.connect();
      producer = tempProducer;
      console.log('Connected to Kafka Broker successfully');
    } catch (e: any) {
      console.warn('Kafka connection failed, enabling mock/fallback mode:', e.message);
      // Return a mock producer implementation for development
      return {
        send: async (payload: any) => {
          const printableMessages = payload.messages.map((m: any) => {
            try {
              const val = JSON.parse(m.value);
              if (val.file && val.file.data && val.file.data.length > 100) {
                val.file.data = val.file.data.substring(0, 50) + `... [TRUNCATED ${val.file.data.length} chars]`;
              }
              return { ...m, value: JSON.stringify(val) };
            } catch {
              return m;
            }
          });
          console.log('[MOCK KAFKA PRODUCER] Published message to topic:', payload.topic, printableMessages);
          return [{ topicName: payload.topic, partition: 0, baseOffset: '0' }];
        },
        connect: async () => {},
        disconnect: async () => {},
        events: {} as any,
        logger: (() => {}) as any,
      } as unknown as Producer;
    }
  }
  return producer;
}



/**
 * Disconnects the producer from the broker and resets the singleton instance.
 *
 * @returns Resolves when the producer has disconnected successfully.
 */
export async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
    console.log('Disconnected from Kafka Broker');
  }
}
