import { Module } from '@nestjs/common';
import { SocketService } from './services/socket.service';
import { SocketGateway } from './socket.gateway';
import { SessionModule } from 'src/session/session.module';

@Module({
  imports: [SessionModule],
  providers: [SocketGateway, SocketService],
  exports: [SocketService]
})
export class SocketModule {}
