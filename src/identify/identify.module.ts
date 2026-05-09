import { Module } from '@nestjs/common';
import { IdentifyController } from './identify.controller';
import { IdentifyService } from './identify.service';
import { VerifierModule } from 'src/verifier/verifier.module';
import { SessionModule } from 'src/session/session.module';

@Module({
  imports: [VerifierModule, SessionModule],
  controllers: [IdentifyController],
  providers: [IdentifyService],
})
export class IdentifyModule {}
