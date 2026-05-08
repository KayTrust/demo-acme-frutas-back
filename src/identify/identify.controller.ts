import { Controller, Get, Logger, Query, Redirect, Render, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ConfigEnvVars } from 'src/configs';
import { v4 as uuid } from 'uuid';
import { Public } from 'src/auth/decorators/public-auth.decorator';
import { IdentifyService } from './identify.service';
import { VerifierService } from 'src/verifier/verifier.service';
import { SharedVpDto } from 'src/verifier/dtos/share-vp.dto';
import { relativeSiteUrl, relativeUrl, relativeWithBase, siteUrl } from 'src/common/utils/functions';
import { SessionIdentity } from './interfaces/session-identity.interface';

@Controller('identify')
export class IdentifyController {
  private readonly logger = new Logger(IdentifyController.name);

  constructor(
    private readonly identifyService: IdentifyService,
    private readonly verifierService: VerifierService,
    private readonly configService: ConfigService<ConfigEnvVars, true>,
  ) {}

  private getServerBaseUrl(req: Request): string {
    const configured = this.configService.get('SERVER_BASE_URL', { infer: true });
    if (configured) return configured;
    return siteUrl(req);
  }

  private getSessionIdentity(req: Request): SessionIdentity | null {
    if ((req as any).session && (req as any).session.userId) {
      return {
        id: (req as any).session.userId,
        name: (req as any).session.userName,
        did: (req as any).session.did, // DID is not stored in session, set to empty or fetch from database if needed
      };
    }
    return null;
  }

  @Get('test')
  @Public()
  async test(@Req() req: Request) {
    return {
        'serverBaseUrl': req.url,
        'relativeUrl': relativeUrl(req, '../failed'),
        'relativeWithBase': relativeWithBase(req, this.getServerBaseUrl(req), '../failed'),
        'siteUrl': siteUrl(req),
        'getServerBaseUrl': this.getServerBaseUrl(req),
        'success': relativeSiteUrl(req, `../success`)+`?hash=${encodeURIComponent('xdfefe')}`
    };
  }

  @Get()
  @Public()
  @Render('qr-identify')
  async getIdentifyPage(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionIdentity = this.getSessionIdentity(req);
    if (sessionIdentity) {
      return res.redirect(relativeUrl(req, 'success'));
    }
    const state = uuid();
    const callbackUrl = relativeSiteUrl(req, `cb`);
    const siopUri = this.identifyService.buildSiopRequestUri(state, callbackUrl);
    const qrCode = await this.identifyService.generateQrSvg(siopUri);
    return { qrCode, sessionId: state };
  }

  @Get('cb')
  @Public()
  @Redirect()
  async receiveVpToken(
    @Req() req: Request,
    @Query() query: SharedVpDto,
  ) {
    const xCorrelationId = uuid();
    try {
      this.logger.log(`identify.cb [${xCorrelationId}]: ${JSON.stringify(query)}`);
      const verifyDto = await this.verifierService.evalVpToken(query.vp_token, xCorrelationId, {
        credentialTypes: ['NameAttestation']
      }, query.state);

      this.setSessionIdentity(req, verifyDto);

      return { url: relativeSiteUrl(req, `../success`), statusCode: 302 };
    } catch (error) {
      this.logger.error(`identify.cb error [${xCorrelationId}]:`, error);
      return { url: relativeSiteUrl(req, `../failed`), statusCode: 302 };
    }
  }

  private setSessionIdentity(req: Request, identity: SessionIdentity) {
    (req as any).session = (req as any).session ?? {};
    (req as any).session.userId = identity.id;
    (req as any).session.userName = identity.name;
    (req as any).session.did = identity.did;
  }

  @Get('success')
  @Public()
  @Render('qr-success')
  async successPage(
    @Query('hash') hash: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!hash) {
      const sessionIdentity = this.getSessionIdentity(req);
      if (sessionIdentity) {
        return { name: sessionIdentity.name, redirectUrl: undefined };
      } else {
        return res.redirect(relativeUrl(req, '..'));
      }
    }

    // me gustaria que solo se pudiera utilizar el hash una vez, para evitar que alguien copie el link y se lo envie a otra persona

    const verify = await this.verifierService.findHash(hash);

    if (!verify) {
      return res.redirect(relativeUrl(req, '..'));
    }

    const identity: SessionIdentity = { id: verify.id, name: verify.name, did: verify.did };


    // Set session cookie to register the identified user
    this.setSessionIdentity(req, identity);

    // const redirectUrl = this.configService.get('FRONTEND_BASE_URL', { infer: true }) || null;
    // return res.redirect(relativeUrl(req, '..'));

    return { name: identity.name, redirectUrl: relativeSiteUrl(req, `../success`) };
  }
}
