import { Module } from '@nestjs/common';
import { VerifierController } from './verifier.controller';
import { VerifierService } from './verifier.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verify } from './entities/verify.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Verify])],
  controllers: [VerifierController],
  providers: [VerifierService]
})
export class VerifierModule {}
