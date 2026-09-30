import { SessionResponse } from '@/types';

type SubscriberController = ReadableStreamDefaultController<Uint8Array>;

declare global {
  // eslint-disable-next-line no-var
  var __movieNightSubscribersMap: Map<string, Set<SubscriberController>> | undefined;
  // eslint-disable-next-line no-var
  var __movieNightHeartbeat: NodeJS.Timeout | undefined;
}

class BroadcasterHub {
  private get subscribersMap(): Map<string, Set<SubscriberController>> {
    if (!global.__movieNightSubscribersMap) {
      global.__movieNightSubscribersMap = new Map();
    }
    return global.__movieNightSubscribersMap;
  }

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    if (global.__movieNightHeartbeat) return;

    global.__movieNightHeartbeat = setInterval(() => {
      const ping = new TextEncoder().encode(': keepalive\n\n');
      this.subscribersMap.forEach((subscribers, sessionId) => {
        subscribers.forEach((controller) => {
          try {
            controller.enqueue(ping);
          } catch {
            subscribers.delete(controller);
          }
        });
        if (subscribers.size === 0) {
          this.subscribersMap.delete(sessionId);
        }
      });
    }, 15000);
  }

  public subscribe(sessionId: string, controller: SubscriberController): () => void {
    if (!this.subscribersMap.has(sessionId)) {
      this.subscribersMap.set(sessionId, new Set());
    }
    const sessionSet = this.subscribersMap.get(sessionId)!;
    sessionSet.add(controller);

    // Return unsubscribe callback
    return () => {
      sessionSet.delete(controller);
      if (sessionSet.size === 0) {
        this.subscribersMap.delete(sessionId);
      }
    };
  }

  public broadcast(sessionId: string, data: SessionResponse): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(payload);

    const sessionSet = this.subscribersMap.get(sessionId);
    if (!sessionSet) return;

    sessionSet.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch {
        sessionSet.delete(controller);
      }
    });
  }

  public getSubscriberCount(sessionId?: string): number {
    if (sessionId) {
      return this.subscribersMap.get(sessionId)?.size || 0;
    }
    let total = 0;
    this.subscribersMap.forEach((set) => {
      total += set.size;
    });
    return total;
  }
}

export const broadcaster = new BroadcasterHub();
