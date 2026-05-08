import { Module } from '@nestjs/common';
import { IdentifyController } from './identify.controller';
import { IdentifyService } from './identify.service';
import { VerifierModule } from 'src/verifier/verifier.module';

@Module({
  imports: [VerifierModule],
  controllers: [IdentifyController],
  providers: [IdentifyService],
})
export class IdentifyModule {}
