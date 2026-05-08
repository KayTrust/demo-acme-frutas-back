import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateVerifyDto {
  @ApiProperty({
    required: true,
    description: 'The name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
    description: 'The email address of the user',
    example: 'example@example.com',
  })
  @IsEmail()
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({
    required: true,
    description: 'The did of the user',
    example: 'did:ethr:0x...',
  })
  @IsString()
  @IsNotEmpty()
  did: string;

  @ApiProperty({
    required: true,
    description: 'The vpHash of the user',
    example: '$2a$10$abcdefghij1234567890',
  })
  @IsNotEmpty()
  @IsString()
  vpHash: string;

  @ApiProperty({
    required: true,
    description: 'The vpHash is verified',
    example: false,
  })
  verified: boolean;

  @ApiProperty({
    required: false,
    description: 'Handler identifier',
    example: 'some-handler'
  })
  @IsString()
  @IsOptional()
  handler?: string;

  @ApiProperty({
    required: false,
    description: 'Arbitrary metadata object',
    example: { key: 'value' }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
