import { Module } from '@nestjs/common';
import { SessionRegistryService } from './session-registry.service';

@Module({
  providers: [SessionRegistryService],
  exports: [SessionRegistryService],
})
export class SessionModule {}
