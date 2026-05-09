import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { VerifyDto } from 'src/verifier/dtos/verify.dto';

@Injectable()
export class SocketService {
  private server: Server;
  private readonly connectedClients: Map<string, Socket> = new Map();
  private readonly socketSession: Map<string, string> = new Map(); // socketId → sessionId
  private readonly logger = new Logger('SocketService');

  setServer(server: Server): void {
    this.server = server;
  }

  handleConnection(socket: Socket): void {
    const clientId = socket.id;
    this.connectedClients.set(clientId, socket);
    this.logger.log('conected: ' + clientId);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
      this.socketSession.delete(clientId);
    });

    // Handle other events and messages from the client
  }

  getActiveSession(socketId: string): string | undefined {
    return this.socketSession.get(socketId);
  }

  setActiveSession(socketId: string, sessionId: string): void {
    this.socketSession.set(socketId, sessionId);
  }

  vpInserted(verify: VerifyDto, sessionId?: string) {
    if (sessionId && this.server) {
      this.server.to(sessionId).emit('vp_inserted', verify);
    } else {
      this.connectedClients.forEach(socket => {
        socket.emit('vp_inserted', verify);
      });
    }
  }

  deleteAll() {
    this.connectedClients.clear();
    this.socketSession.clear();
  }

  delete(id: string) {
    this.connectedClients.delete(id);
    this.socketSession.delete(id);
  }
}
