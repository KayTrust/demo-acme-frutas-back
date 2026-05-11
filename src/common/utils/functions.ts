import { DIDResolver } from '@kaytrust/did-ethr';
import { NearDIDResolver } from '@kaytrust/did-near-resolver';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { Request } from 'express';
import { ConfigEnvVars } from 'src/configs';
import { util as utilKeyDidResolver } from "@cef-ebsi/key-did-resolver";
import { createJWKFromPrivateKey, CreateJwkFromWalletOptions } from "@kaytrust/openid4vci";
import { join } from 'path';

export function parseBoolean(value: string | boolean | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  const str = value.toLowerCase().trim();
  return str === 'true' || !!parseInt(str);
}

export const concatRoutes = (...routes: string[]) => {
  return (
    '/' +
    routes
      .map((val) => (val + '').replace(/^\/+|\/+$/g, ''))
      .filter((route) => !!route.trim())
      .join('/')
  );
};

export function siteUrl(req: Request, ...routes: string[]) {
  let protocol = req.protocol;
  if ((req as ForceProtocolHttps<Request>).force_protocol_https) {
    protocol += 's';
  }
  return `${protocol}://${req.host}` + concatRoutes(req.baseUrl, ...routes);
}

export function relativeUrl(req: Request, ...routes: string[]) {
  return join(req.url, ...routes);
}

export function relativeWithBase(req: Request, base: string, ...routes: string[]) {
  const current_route = relativeUrl(req, ...routes);
  base = (base || "").replace(/\/+$/g, "")
  return base + current_route;
}

export function relativeSiteUrl(req: Request, ...routes: string[]) {
  const current_route = relativeUrl(req, ...routes);
  return siteUrl(req, current_route);
}

export function generarHash(texto: string, algoritmo = 'sha256') {
  const hash = createHash(algoritmo);
  hash.update(texto);
  return hash.digest('hex');
}

export function getFormatterFromMessages<T>(errors: T) {
  return (errorCode: keyof T, ...args: string[]) => {
    const messageTemplate = errors[errorCode];
    return format(messageTemplate as string, ...args);
  }
}

export function getFormatterErrorMessages<T>(errors: T) {
  const cb = getFormatterFromMessages(errors);
  return (...args: Parameters<typeof cb>) => {
    return  cb(...args) + " " + format("(%s)", args[0] as string);
  }
}

export function format(template: string, ...args: string[]): string {
  return template.replace(/%s/g, () => args.shift() || '');
}

export const getNearResolver = (configService: ConfigService<ConfigEnvVars, true>): Record<string, DIDResolver> => {
    const {nodeUrl, contractId, networkId} = configService.get("near", {infer: true});
    const resolver = new NearDIDResolver(contractId, nodeUrl, networkId);
    return {
        near: async (did) => {
          const didDocument = await resolver.resolveDID(did);
          // const didDocument = await resolveNearDID(did, contractId);
          return {
            didDocument,
            didResolutionMetadata: { contentType: "application/did+json" },
            didDocumentMetadata: {},
          };
        },
    };
}

export const generateKeyProfileWithPrivateKey = async (private_key: string, options?: CreateJwkFromWalletOptions): Promise<string> => {
  const jwk = await createJWKFromPrivateKey(private_key, options);
  return utilKeyDidResolver.createDid(jwk);
};