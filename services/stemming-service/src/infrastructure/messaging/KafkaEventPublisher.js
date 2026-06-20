import { Kafka, logLevel } from 'kafkajs';

export class KafkaEventPublisher {
  constructor({ brokers, clientId, retry = { retries: 8, initialRetryTime: 300, multiplier: 2 } }) {
    this.brokers = (brokers || 'localhost:9092').split(',');
    this.clientId = clientId || 'publisher';
    this.kafka = new Kafka({ clientId: this.clientId, brokers: this.brokers, logLevel: logLevel.WARN, retry });
    this.producer = null;
  }

  async connect() {
    if (!this.producer) {
      this.producer = this.kafka.producer();
      await this.producer.connect();
    }
  }

  async publish({ topic, key, value }) {
    await this.connect();
    await retryKafka(`publish ${topic}`, () => this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(value) }]
    }));
  }

  async disconnect() {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
  }
}

async function retryKafka(label, operation) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      console.error(`[kafka-publisher] ${label} failed attempt ${attempt}:`, error.message);
      if (attempt === 8) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.min(30000, 500 * 2 ** (attempt - 1))));
    }
  }
}
