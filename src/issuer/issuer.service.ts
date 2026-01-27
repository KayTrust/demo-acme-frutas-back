import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigEnvVars } from 'src/configs';
import { VerifiableCredentialV1Dto } from './models/verifiable-credential-v1.model';
import {v4 as uuid} from 'uuid'
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { CredentialRequestDto } from './dtos/credential-request.dto';
import { plainToInstance } from 'class-transformer';
import { OpenidCredentialFormat, OpenIdCredentialIssuerMetadata, OpenIdCredentialMetadata } from '@kaytrust/openid4vci';
import { MELON_VC_TYPE_ETHR, MELON_VC_TYPE_NEAR } from 'src/configs/constants';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);
  constructor(
    private readonly configService: ConfigService<ConfigEnvVars, true>,
    private readonly httpService: HttpService,
  ) {}

  generateOpenIdCredentialIssuerWellKnown(
    credential_issuer: string,
    authorization_server: string,
    credential_endpoint: string,
    credentials_supported: OpenIdCredentialMetadata[] = [],
  ): OpenIdCredentialIssuerMetadata {
    return {
      credential_issuer,
      authorization_server,
      credential_endpoint,
      credentials_supported,
    };
  }

  getIssuerDid(issuer_name: string, did_method: string = "ethr", req: CredentialRequestDto) {
    const melon_issuer_name = this.configService.get('MELON_ISSUER_NAME', {
      infer: true,
    });
    switch(issuer_name) {
      case 'defualt':
      case melon_issuer_name:
        if (req.types.includes(MELON_VC_TYPE_NEAR)) return this.configService.getOrThrow("MELON_NEAR_DID", {infer: true});
        if (req.types.includes(MELON_VC_TYPE_ETHR)) return this.configService.getOrThrow("MELON_ETHR_DID", {infer: true});
        if (did_method=="near") return this.configService.getOrThrow("MELON_NEAR_DID", {infer: true});
        return this.configService.getOrThrow("MELON_ETHR_DID", {infer: true});
      default:
        throw new NotFoundException(`Issuer not found: ${issuer_name}`);
    }
  }

  getIssuerPrivateKey(issuer_name: string) {
    const melon_issuer_name = this.configService.get('MELON_ISSUER_NAME', {
      infer: true,
    });
    switch(issuer_name) {
      case 'defualt':
      case melon_issuer_name:
        return this.configService.getOrThrow("MELON_PRIVATE_KEY", {infer: true});
      default:
        throw new NotFoundException(`Private key not found: ${issuer_name}`);
    }
  }

  getIssuerUri(base_issuer_uri: string, issuer_name: string) {
    return `${base_issuer_uri}/${issuer_name}`;
  }

  getCustomDisplayVcMelon(name: string, options?: Partial<OpenIdCredentialMetadata["display"]>) {
    return {
      "locale": "en-US",
      "card": {
        "title": "Bachelor's Degree",
        "issuedBy": "Melón University",
        "backgroundColor": "#f8f6ef",
        "textColor": "#012a2d",
        "logo": {
          "uri": "https://frutas.demo.kaytrust.id/images/logo-acme-university.png",
          "description": "Melón University Logo"
        },
        "description": "Blockchain Technologies"
      },
      name,
      ...options
    } as OpenIdCredentialMetadata["display"]
  }

  getMelonOpenIdCredentialIssuerWellKnown(
    base_issuer_uri: string,
  ): OpenIdCredentialIssuerMetadata {
    base_issuer_uri = base_issuer_uri.replace(/\/+$/, '');
    const issuer_name = this.configService.get('MELON_ISSUER_NAME', {
      infer: true,
    });
    const credential_issuer = this.getIssuerUri(base_issuer_uri, issuer_name);
    const authorization_server = this.configService.getOrThrow(
      'AUTHORIZATION_SERVER',
      { infer: true },
    );
    const credential_endpoint = `${credential_issuer}/credential/issue`;

    const format:OpenidCredentialFormat = OpenidCredentialFormat.jwt_vc

    const credentials_supported: OpenIdCredentialMetadata[] = [
      {
        format: format,
        // id: 'AcmeAccreditationJWTVCDidEthr',
        id: MELON_VC_TYPE_ETHR + format,
        types: ['VerifiableCredential', MELON_VC_TYPE_ETHR],
        display: this.getCustomDisplayVcMelon("Melon Bachelor's Degree - ETHR"),
      },
      {
        format: format,
        // id: 'AcmeAccreditationJWTVCDidNear',
        id: MELON_VC_TYPE_NEAR + format,
        types: ['VerifiableCredential', MELON_VC_TYPE_NEAR],
        display: this.getCustomDisplayVcMelon("Melon Bachelor's Degree - NEAR"),
      }
    ];

    return this.generateOpenIdCredentialIssuerWellKnown(
      credential_issuer,
      authorization_server,
      credential_endpoint,
      credentials_supported,
    );
  }

  getVcForIssuance(user: JwtPayload, user_did: string, issuer_name: string, did_issuer: string, req: CredentialRequestDto): VerifiableCredentialV1Dto {
    const melon_issuer_name = this.configService.get('MELON_ISSUER_NAME', {infer: true});
    switch(issuer_name) {
      case 'defualt':
      case melon_issuer_name:
        return this.getVcForMelonIssuance(user, user_did, issuer_name, did_issuer, req);
      default:
        throw new NotFoundException(`VC not found: ${issuer_name}`);
    }
  }

  getUserInfoFromToken(token: string) {
    const userinfo_uri = this.configService.getOrThrow("USERINFO_URI", {infer: true});
    this.logger.log("Fetching user info from: " + userinfo_uri);
    return this.httpService.get(userinfo_uri, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  getVcForMelonIssuance(user: JwtPayload, user_did: string, issuer_name: string, did_issuer: string, req: CredentialRequestDto): VerifiableCredentialV1Dto {
    const issuanceDate = new Date();
    const issuanceDateString = issuanceDate.toISOString().replace(/\.\d*/, "");
    const vc_id = "vc:" + issuer_name + "#" +  uuid()
    const subject_id = user_did;

    const name = user.name;
    const email = user.email;
    return plainToInstance(VerifiableCredentialV1Dto, {
      type: req.types,
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      issuer: did_issuer,
      issuanceDate: issuanceDateString,
      id: vc_id,
      credentialSubject: {
        "knowsAbout": {
          "provider": {
            "@type": "EducationalOrganization",
            "name": "Melon University"
          },
          "@type": "Course",
          "name": "Bachelor's Degree in Blockchain Technologies",
          "about": "Web3",
          "description": "An intensive course on Blockchain Technologies, tokens, networks and more"
        },
        "@type": "Person",
        "name": name,
        "@id": subject_id,
        "email": email,
        id: subject_id,
      }
    })
  }

  getCredentialOffer(base_issuer_uri: string, issuer_name: string) {
    const issuer_uri = this.getIssuerUri(base_issuer_uri, issuer_name)
    return {
      "credential_issuer": issuer_uri,
      "credentials": [
        {
          "format": "jwt_vc",
          "types": [
            "VerifiableCredential",
            MELON_VC_TYPE_ETHR,
          ],
          "trust_framework": {
            "name": "Melón University",
            "type": "Accreditation",
            "uri": "TIR link towards accreditation"
          }
        },
        {
          "format": "jwt_vc",
          "types": [
            "VerifiableCredential",
            MELON_VC_TYPE_NEAR,
          ],
          "trust_framework": {
            "name": "Melón University",
            "type": "Accreditation",
            "uri": "TIR link towards accreditation"
          }
        },
      ],
      "grants": {
        "authorization_code": {
          "issuer_state": ""
        }
      }
    }
  }
}
