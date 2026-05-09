import { WebSocketGateway, OnGatewayConnection, WebSocketServer, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './services/socket.service';
import { Logger } from '@nestjs/common';
import { SessionRegistryService } from 'src/session/session-registry.service';

@WebSocketGateway()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  private readonly logger = new Logger('ChatGateway');

  constructor(
    private readonly socketService: SocketService,
    private readonly sessionRegistry: SessionRegistryService,
  ) {}

  afterInit(server: Server): void {
    this.socketService.setServer(server);
    this.logger.log('ChatGateway initialized');
    this.socketService.deleteAll();
  }

  async handleDisconnect(socket: Socket) {
    this.socketService.delete(socket.id);
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  handleConnection(socket: Socket): void {
    this.socketService.handleConnection(socket);
    this.logger.log(`Client connected: ${socket.id}`);
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @ConnectedSocket() socket: Socket,
    @MessageBody() sessionId: string,
  ): { success: boolean } {
    if (!this.sessionRegistry.exists(sessionId)) {
      this.logger.warn(`Client ${socket.id} attempted to join invalid/expired session: ${sessionId}`);
      return { success: false };
    }

    const previousSession = this.socketService.getActiveSession(socket.id);
    if (previousSession) {
      socket.leave(previousSession);
      this.logger.log(`Client ${socket.id} left session room: ${previousSession}`);
    }

    socket.join(sessionId);
    this.socketService.setActiveSession(socket.id, sessionId);
    this.logger.log(`Client ${socket.id} joined session room: ${sessionId}`);
    return { success: true };
  }
}