import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { VerifyDto } from 'src/verifier/dtos/verify.dto';

@Injectable()
export class SocketService {
  private server: Server;
  private readonly connectedClients: Map<string, Socket> = new Map();
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
    });

    // Handle other events and messages from the client
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
  }

  delete(id: string) {
    this.connectedClients.delete(id);
  }
}
