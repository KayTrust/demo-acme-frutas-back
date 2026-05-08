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
  async getIdentifyPage(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sessionIdentity = this.getSessionIdentity(req);
    if (sessionIdentity) {
      return res.redirect(relativeUrl(req, 'success'));
    }
    const state = uuid();
    const callbackUrl = relativeSiteUrl(req, `cb`);
    const siopUri = this.identifyService.buildSiopRequestUri(state, callbackUrl);
    const qrCode = await this.identifyService.generateQrSvg(siopUri);
    return res.render('qr-identify', { qrCode, sessionId: state });
  }

  @Get('refresh')
  @Public()
  async refreshQr(@Req() req: Request) {
    const state = uuid();
    const callbackUrl = relativeSiteUrl(req, `../cb`);
    const siopUri = this.identifyService.buildSiopRequestUri(state, callbackUrl);
    const qrCode = await this.identifyService.generateQrSvg(siopUri);
    return { sessionId: state, qrCode };
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
        credentialTypes: ['NameAttestation'],
        handler: 'identify',
        metadata: { unused: true },
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
  async successPage(
    @Query('hash') hash: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!hash) {
      const sessionIdentity = this.getSessionIdentity(req);
      if (sessionIdentity) {
        return res.render('qr-success', { name: sessionIdentity.name, redirectUrl: undefined });
      } else {
        return res.redirect(relativeUrl(req, '..'));
      }
    }

    const verify = await this.verifierService.findHash(hash, 'identify');

    if (!verify || !verify.verified || verify.handler !== 'identify' || !verify.metadata || !verify.metadata.unused) {
      this.logger.warn(`Invalid or already used hash: ${hash}`);
      return res.redirect(relativeUrl(req, '..'));
    }

    const identity: SessionIdentity = { id: verify.id, name: verify.name, did: verify.did };

    await this.verifierService.update(verify.id, { metadata: { ...verify.metadata, unused: false } });

    this.setSessionIdentity(req, identity);

    return res.render('qr-success', { name: identity.name, redirectUrl: relativeSiteUrl(req, `../success`) });
  }
}
