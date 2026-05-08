import { Controller, Get, InternalServerErrorException, Logger, Query, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';
import { SharedVpDto } from './dtos/share-vp.dto';
import { VerifierService } from './verifier.service';
import { ConfigService } from '@nestjs/config';
import { ConfigEnvVars } from 'src/configs';
import { v4 as uuid } from 'uuid'
import { Public } from 'src/auth/decorators/public-auth.decorator';
import { MELON_VC_TYPE_BASE, MELON_VC_TYPE_ETHR, MELON_VC_TYPE_NEAR } from 'src/configs/constants';

@Controller('verifier')
export class VerifierController {
  private readonly logger = new Logger(VerifierController.name);
  constructor(
    private readonly verifierService: VerifierService,
    private configService: ConfigService<ConfigEnvVars, true>,
  ) { }

  @Get('list')
  @Public()
  list() {
    return this.verifierService.findAll();
  }

  getRedirectUri(path: string, base?: string) {
    const defaultFrontendBase = this.configService.get("FRONTEND_BASE_URL", { infer: true });
    const baseUrl = (base || defaultFrontendBase).replace(/\/+$/g, "")
    path = path.replace(/^\/+/g, "")
    console.log("getRedirectUri.baseUrl: " + baseUrl);
    console.log("getRedirectUri.path: " + path);
    return `${baseUrl}/${path}`
  }

  @Get('oauth2/cb/vpToken')
  @Public()
  @Redirect()
  async recieveCredential(@Req() req: Request, @Query() query: SharedVpDto) {

    let xCorrelationId: string = "";

    if (!xCorrelationId) xCorrelationId = uuid()
    try {
      this.logger.log("recieveCredential.req: " + xCorrelationId + " - " + JSON.stringify(query));

      const verifierDto = await this.verifierService.evalVpToken(query.vp_token, xCorrelationId, {
        credentialTypes: [MELON_VC_TYPE_BASE, MELON_VC_TYPE_ETHR, MELON_VC_TYPE_NEAR]
      });
      this.logger.log("validated_token: " + xCorrelationId + " - " + JSON.stringify(query.vp_token));
      return { url: this.getRedirectUri('/congrats?close=1'), statusCode: 302 };
    } catch (error) {
      this.logger.error(error);
      return { url: this.getRedirectUri('/failed-share?close=1'), statusCode: 302 };
    }
  }
}
