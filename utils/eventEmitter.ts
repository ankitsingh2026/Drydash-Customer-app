// utils/eventEmitter.ts
type EventMap = {
  addressSelected: { address: any; label: string };
};

class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on<K extends keyof EventMap>(
    event: K,
    callback: (data: EventMap[K]) => void,
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  off<K extends keyof EventMap>(
    event: K,
    callback: (data: EventMap[K]) => void,
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(
        event,
        callbacks.filter((cb) => cb !== callback),
      );
    }
  }
}

export const eventEmitter = new EventEmitter();
