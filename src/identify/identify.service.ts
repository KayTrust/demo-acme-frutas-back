import { ResponseMode, ResponseType } from '@kaytrust/openid4vci';
import { Injectable } from '@nestjs/common';
import * as qrcode from 'qrcode';
import { SessionRegistryService } from 'src/session/session-registry.service';

export interface BuildSiopRequestUriOptions {
  response_mode?: ResponseMode;
  response_type?: ResponseType;
}

@Injectable()
export class IdentifyService {

  constructor(private readonly sessionRegistry: SessionRegistryService) {}

  async generateQrSvg(content: string): Promise<string> {
    return qrcode.toString(content, { type: 'svg', margin: 2 });
  }

  generateSessionId(): string {
    return this.sessionRegistry.create();
  }

  verifySessionExists(sessionId: string): boolean {
    return this.sessionRegistry.exists(sessionId);
  }

  updateSessionId(prevSessionId?: string): string {
    return this.sessionRegistry.rotate(prevSessionId);
  }

  buildSiopRequestUri(
    state: string, redirectUri: string, options: BuildSiopRequestUriOptions = {}
  ): string {
    const params = new URLSearchParams({
      response_mode: options.response_mode || 'query',
      response_type: options.response_type || 'vp_token',
      client_id: redirectUri,
      redirect_uri: redirectUri,
      state,
      nonce: state,
      scope: 'openid',
    });
    return `openid://?${params.toString()}`;
  }
}
