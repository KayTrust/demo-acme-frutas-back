import {Resolver, DIDResolver, DIDResolutionOptions, DIDResolutionResult } from 'did-resolver';
import { getResolver as _getEbsiResolver } from "@cef-ebsi/ebsi-did-resolver";


export function getEbsiResolver(registries: string[]):Record<"ebsi", DIDResolver> {
    async function resolve(did: string,
        options: DIDResolutionOptions
    ){
        if (!registries || registries.length === 0) {
            throw new Error("No registries provided for EBSI DID resolution");
        }
        let didResult: DIDResolutionResult|undefined;
        for(let url of registries){
            const resolver = new Resolver( _getEbsiResolver({ registry: url }));
            const result = (await resolver.resolve(did,options)) as unknown
            didResult = result as DIDResolutionResult

            if (didResult.didResolutionMetadata?.error || didResult.didDocument == null) {
                continue
            } else{
                break
            }
        }
        if (!didResult) {
            throw new Error(`Failed to resolve DID ${did} with provided registries`);
        }
        return didResult;
    }
  
    return { ebsi: resolve }
  }
