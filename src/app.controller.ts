import { Controller, Get, Render } from '@nestjs/common';
import { Public } from './auth/decorators/public-auth.decorator';
import { ConfigService } from '@nestjs/config';
import { ConfigEnvVars } from './configs';
import { DEFAULT_APP_NAME } from './configs/constants';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService<ConfigEnvVars, true>) {}

  @Get()
  @Public()
  @Render('index')
  getHello(): { version: string; title: string } {
    return {
      version: this.configService.get('APP_VERSION')!,
      title: DEFAULT_APP_NAME,
    };
  }
}
