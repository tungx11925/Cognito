import { Response } from 'express';

interface SSEClient {
  userId: number;
  res: Response;
}

class SSEService {
  private clients: SSEClient[] = [];

  constructor() {
    // Heartbeat every 25 seconds to keep SSE connection alive
    setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
  }

  public addClient(userId: number, res: Response): void {
    const client: SSEClient = { userId, res };
    this.clients.push(client);

    // Initial connection acknowledgement
    this.sendEventToResponse(res, 'connected', {
      userId,
      message: 'SSE stream connected successfully',
      timestamp: new Date().toISOString()
    });
  }

  public removeClient(res: Response): void {
    this.clients = this.clients.filter(c => c.res !== res);
  }

  public sendToUser(userId: number, event: string, data: any): void {
    const userClients = this.clients.filter(c => c.userId === userId);
    for (const client of userClients) {
      try {
        this.sendEventToResponse(client.res, event, data);
      } catch (err) {
        console.error(`Error sending SSE event to user ${userId}:`, err);
        this.removeClient(client.res);
      }
    }
  }

  public broadcast(event: string, data: any): void {
    for (const client of this.clients) {
      try {
        this.sendEventToResponse(client.res, event, data);
      } catch (err) {
        console.error('Error broadcasting SSE event:', err);
        this.removeClient(client.res);
      }
    }
  }

  private sendEventToResponse(res: Response, event: string, data: any): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private sendHeartbeat(): void {
    for (const client of this.clients) {
      try {
        client.res.write(': ping\n\n');
      } catch {
        this.removeClient(client.res);
      }
    }
  }
}

export const sseService = new SSEService();
