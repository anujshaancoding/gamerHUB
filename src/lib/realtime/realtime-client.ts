"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- the handler signatures
   intentionally mirror socket.io's loose `(...args: any[])` Socket API so this
   adapter is structurally assignable to it and accepts the app's typed
   listeners (e.g. socket.on("message:new", (d: {message}) => ...)). */

/**
 * Minimal WebSocket client for the Cloudflare DO realtime hub, exposing the
 * subset of the socket.io Socket API the app actually uses (on/off/emit) so it
 * drops into SocketProvider without touching any consumer.
 *
 * Wire protocol (symmetric with the DO): every frame is JSON {type, data}.
 * - server->client: fire listeners registered for `type` with `data`.
 * - client->server emit(event, payload): send {type: event, data: payload}.
 *
 * Reconnect refetches a fresh handshake token, so an expired token self-heals.
 */

export interface RealtimeSocket {
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler?: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

type Handler = (...args: any[]) => void;

export class RealtimeClient implements RealtimeSocket {
  private url: string;
  private getToken: () => Promise<string | null>;
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Handler>>();
  private closed = false;
  private reconnectDelay = 1000;
  connected = false;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    // http(s)://host -> ws(s)://host
    this.url = baseUrl.replace(/\/+$/, "").replace(/^http/, "ws");
    this.getToken = getToken;
    void this.connect();
  }

  private async connect(): Promise<void> {
    if (this.closed) return;
    const token = await this.getToken();
    if (this.closed || !token) {
      if (!this.closed) this.scheduleReconnect();
      return;
    }
    const ws = new WebSocket(`${this.url}/ws?token=${encodeURIComponent(token)}`);
    this.ws = ws;

    ws.onopen = () => {
      this.connected = true;
      this.reconnectDelay = 1000;
      this.fire("connect", undefined);
    };
    ws.onmessage = (e) => {
      let msg: { type?: unknown; data?: unknown };
      try {
        msg = JSON.parse(e.data as string);
      } catch {
        return;
      }
      if (typeof msg.type === "string") this.fire(msg.type, msg.data);
    };
    ws.onclose = () => {
      this.connected = false;
      this.fire("disconnect", undefined);
      this.scheduleReconnect();
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* already closing */
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    setTimeout(() => void this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
  }

  private fire(event: string, data: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const h of set) {
      try {
        h(data);
      } catch {
        /* a bad listener must not break the others */
      }
    }
  }

  on(event: string, handler: Handler): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler?: Handler): void {
    const set = this.listeners.get(event);
    if (!set) return;
    if (handler) set.delete(handler);
    else set.clear();
  }

  emit(event: string, ...args: unknown[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, data: args[0] }));
    }
  }

  disconnect(): void {
    this.closed = true;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
  }
}
