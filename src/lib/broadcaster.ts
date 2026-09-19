import { SessionResponse } from '@/types';

type SubscriberController = ReadableStreamDefaultController<Uint8Array>;

declare global {
  // eslint-disable-next-line no-var
  var __movieNightSubscribers: Set<SubscriberController> | undefined;
  // eslint-disable-next-line no-var
  var __movieNightHeartbeat: NodeJS.Timeout | undefined;
}

class BroadcasterHub {
  private get subscribers(): Set<SubscriberController> {
    if (!global.__movieNightSubscribers) {
      global.__movieNightSubscribers = new Set();
    }
    return global.__movieNightSubscribers;
  }

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    if (global.__movieNightHeartbeat) return;

    global.__movieNightHeartbeat = setInterval(() => {
      const ping = new TextEncoder().encode(': keepalive\n\n');
      this.subscribers.forEach((controller) => {
        try {
          controller.enqueue(ping);
        } catch {
          this.subscribers.delete(controller);
        }
      });
    }, 15000);
  }

  public subscribe(controller: SubscriberController): () => void {
    this.subscribers.add(controller);

    // Return unsubscribe callback
    return () => {
      this.subscribers.delete(controller);
    };
  }

  public broadcast(data: SessionResponse): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(payload);

    this.subscribers.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch {
        this.subscribers.delete(controller);
      }
    });
  }

  public get subscriberCount(): number {
    return this.subscribers.size;
  }
}

export const broadcaster = new BroadcasterHub();

