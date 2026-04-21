import { createClient } from 'redis';
import { ServiceEvent, EventType } from './types';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export class EventBus {
  private publisher;
  private subscriber;

  constructor(private serviceName: string) {
    this.publisher = createClient({ url: REDIS_URL });
    this.subscriber = createClient({ url: REDIS_URL });

    this.publisher.connect().catch(console.error);
    this.subscriber.connect().catch(console.error);
  }

  /**
   * Publish an event (Kafka-ready structure)
   */
  async publish<T>(type: EventType, data: T) {
    const event: ServiceEvent<T> = {
      type,
      version: '1.0',
      timestamp: new Date().toISOString(),
      sender: this.serviceName,
      data
    };

    await this.publisher.publish(type, JSON.stringify(event));
    console.log(`[EventBus] Published ${type} from ${this.serviceName}`);
  }

  /**
   * Subscribe to an event
   */
  async subscribe(type: EventType, callback: (data: any) => void) {
    await this.subscriber.subscribe(type, (message) => {
      const event: ServiceEvent = JSON.parse(message);
      console.log(`[EventBus] Received ${type} (via ${event.sender})`);
      callback(event.data);
    });
  }
}
