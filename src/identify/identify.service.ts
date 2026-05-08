import { ResponseMode, ResponseType } from '@kaytrust/openid4vci';
import { Injectable } from '@nestjs/common';
import * as qrcode from 'qrcode';

export interface BuildSiopRequestUriOptions {
  response_mode?: ResponseMode;
  response_type?: ResponseType;
}

@Injectable()
export class IdentifyService {
  /**
   * Generates an SVG string for the given content (SIOP request URI).
   */
  async generateQrSvg(content: string): Promise<string> {
    return qrcode.toString(content, { type: 'svg', margin: 2 });
  }

  /**
   * Builds a minimal OpenID4VP authorization request URI that KayWallet
   * will resolve. The wallet must POST/GET the vp_token to `redirectUri`.
   */
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
