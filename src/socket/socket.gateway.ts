import { WebSocketGateway, OnGatewayConnection, WebSocketServer, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './services/socket.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  private readonly logger = new Logger('ChatGateway');

  afterInit(server: Server): void {
    this.socketService.setServer(server);
    this.logger.log('ChatGateway initialized');
    this.socketService.deleteAll();
  }

  constructor(private readonly socketService: SocketService) {}

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
  ): void {
    socket.join(sessionId);
    this.logger.log(`Client ${socket.id} joined session room: ${sessionId}`);
  }
}