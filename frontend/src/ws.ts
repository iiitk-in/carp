enum ConnectionState {
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  RECONNECTING = "RECONNECTING",
}
//eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageHandler = (data: any) => void;
type StateChangeHandler = (state: ConnectionState) => void;

class WebSocketAPI {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateChangeHandlers: Set<StateChangeHandler> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private baseReconnectDelay: number = 1000; // Start with 1 second
  private heartbeatInterval: number | null = null;
  private lastPongTime: number = Date.now();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;

  constructor(url: string) {
    this.url = url;
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.stateChangeHandlers.forEach((handler) => handler(state));
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  public sendMessage(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      throw new Error("WebSocket is not connected");
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Check if we haven't received a pong in more than 35 seconds
        if (Date.now() - this.lastPongTime > 35000) {
          console.warn("No pong received, reconnecting...");
          this.reconnect();
          return;
        }
        this.ws.send("ping");
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async reconnect(): Promise<void> {
    if (this.connectionState === ConnectionState.RECONNECTING) {
      return;
    }

    this.setConnectionState(ConnectionState.RECONNECTING);
    this.stopHeartbeat();

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      throw new Error("Max reconnection attempts reached");
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    ); // Cap at 30 seconds

    await new Promise((resolve) => setTimeout(resolve, delay));
    this.reconnectAttempts++;

    try {
      await this.connect();
    } catch {
      this.reconnect();
    }
  }

  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setConnectionState(ConnectionState.CONNECTED);
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };

      this.ws.onclose = () => {
        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.reconnect().catch(console.error);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        // Handle pong messages
        if (event.data === "pong") {
          this.lastPongTime = Date.now();
          return;
        }

        this.messageHandlers.forEach((handler) => handler(event));
      };
    });
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.messageHandlers.clear();
    this.stateChangeHandlers.clear();
  }
}

export { WebSocketAPI, ConnectionState };

const ws = new WebSocketAPI(import.meta.env.VITE_BACKEND_URL + "/api/ws");
export default ws;
