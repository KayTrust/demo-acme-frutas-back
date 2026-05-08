import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {JwtCredentialPayload, JwtPresentationPayload, ProofTypeJWT} from '@kaytrust/prooftypes'
import { getResolver, Resolver } from '@kaytrust/did-ethr';
import { ConfigService } from '@nestjs/config';
import { ConfigEnvVars } from 'src/configs';
import * as jose from 'jose'
import { VpEvalError } from './errors/vp-eval.error';
import { plainToInstance } from 'class-transformer';
import { generarHash, getNearResolver } from 'src/common/utils/functions';
import { CreateVerifyDto } from './dtos/create-verify.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Verify } from './entities';
import { VerifyDto } from './dtos/verify.dto';
import { sanitizeVerify } from './helpers/sanitize-user';
import { SocketService } from 'src/socket/services/socket.service';
import { getResolver as _getKeyResolver } from "@cef-ebsi/key-did-resolver";
import { getEbsiResolver } from 'src/common/utils/ebsi-multienvironment-resolver';

export interface EvalVpTokenOptions {
  credentialTypes: string[];
  handler?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class VerifierService {
    private readonly logger = new Logger(VerifierService.name);
    constructor(
        private configService: ConfigService<ConfigEnvVars, true>,
        @InjectRepository(Verify)
        private verifyRepository: Repository<Verify>,
        private readonly socketService: SocketService,
    ) {}

    async evalVpToken(vp_token: string, xCorrelationId: string, options: EvalVpTokenOptions, sessionId?: string): Promise<VerifyDto> {
        const network = this.configService.get("ethr.default_network", {infer: true});
        const networks = this.configService.get("ethr.networks", {infer: true});
        const resolver = new Resolver({...getResolver({...network, networks}), ...getNearResolver(this.configService), ..._getKeyResolver(), ...getEbsiResolver(this.configService.get("ebsi.registries", {infer: true}))});
        const proof = new ProofTypeJWT({verifyOptions: {policies: {aud: false}}}, true)
        const resolution = await proof.verifyProof(vp_token, {resolver})
        // this.logger.log("evalVpToken.resolution: " + xCorrelationId + " - " + JSON.stringify(resolution));
        if (!resolution.verified) throw new VpEvalError("Failed on verified vp: " + xCorrelationId);

        const payload = jose.decodeJwt(vp_token) as JwtPresentationPayload
        const issuer = payload.iss;
        const vp = payload.vp;
        const credential = [vp.verifiableCredential].flat().find((cred)=>{
          const cred_payload = jose.decodeJwt(cred as string) as JwtCredentialPayload
          return options.credentialTypes.some((type)=>!!cred_payload.vc?.type.includes(type)) && !!cred_payload.vc?.type.includes('VerifiableCredential')
        })
        if (!credential) throw new VpEvalError(`VerifiableCredential, AcmeAccreditation not found (${xCorrelationId})`);

        const cred_payload = jose.decodeJwt(credential as string) as JwtCredentialPayload
        const vc_sub = cred_payload.sub;

        if (issuer != vc_sub) throw new VpEvalError(`Inconsistent VC on VP, different DID owner (${xCorrelationId})`);


        const proof_vc = new ProofTypeJWT({verifyOptions: {policies: {aud: false}}}, false)
        const resolution_vc = await proof_vc.verifyProof(credential as string, {resolver})
        
        if (!resolution_vc.verified) throw new VpEvalError("Failed on verified vc AcmeAccreditation: " + xCorrelationId);

        const name = cred_payload.vc.credentialSubject.name
        const email = cred_payload.vc.credentialSubject.email ?? ''

        const display_name = name ? name : email;

        const createDto = plainToInstance(CreateVerifyDto, {
            did: issuer, email, name: display_name, 
            vpHash: generarHash(vp_token),
            verified: true,
            handler: options.handler,
            metadata: options.metadata,
        } as CreateVerifyDto);

        const verifyDto = await this.create(createDto);

        this.socketService.vpInserted(verifyDto, sessionId);
    
        return verifyDto;
    }



  async create(createVerifyDto: CreateVerifyDto): Promise<VerifyDto> {
    try {
      const verify = this.verifyRepository.create(createVerifyDto);
      return sanitizeVerify(await this.verifyRepository.save(verify));
    } catch (error) {
      this.logger.error(`Failed to verify: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to verify');
    }
  }

  async findAll(limit = 30): Promise<VerifyDto[]> {
    try {
      const vps = await this.verifyRepository.find({order: {
        updatedAt: 'DESC',
      }, take: limit});
      return vps.map((vp) => sanitizeVerify(vp));
    } catch (error) {
      this.logger.error(
        `Failed to retrieve all verifies: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: string): Promise<VerifyDto | null> {
    try {
      if (!id) {
        this.logger.warn('No id provided for findOne');
        return null;
      }
      const verify = await this.verifyRepository.findOne({ where: { id } });
      return verify ? sanitizeVerify(verify) : null;
    } catch (error) {
      this.logger.error(`Failed to find verify ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  async findHash(hash: string, handler?: string): Promise<VerifyDto | null> {
    try {
      this.logger.log(`Finding verify with hash: ${hash} and handler: ${handler}`);
      if (!hash) {
        this.logger.warn('No hash provided for findHash');
        return null;
      }
      const verify = await this.verifyRepository.findOne({ where: { vpHash: hash, handler } });
      return verify ? sanitizeVerify(verify) : null;
    } catch (error) {
      this.logger.error(`Failed to find verify with hash ${hash} and handler ${handler}: ${error.message}`, error.stack);
      return null;
    }
  }

  async update(id: string, fields: Partial<Pick<CreateVerifyDto, 'handler' | 'metadata' | 'verified' | 'name' | 'email'>>): Promise<VerifyDto | null> {
    try {
      if (!id) {
        this.logger.warn('No id provided for update');
        return null;
      }
      const verify = await this.verifyRepository.findOne({ where: { id } });
      if (!verify) {
        this.logger.warn(`Verify not found for update: ${id}`);
        return null;
      }
      Object.assign(verify, fields);
      return sanitizeVerify(await this.verifyRepository.save(verify));
    } catch (error) {
      this.logger.error(`Failed to update verify ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update verify');
    }
  }
}
