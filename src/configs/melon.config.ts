import { createDidEthr } from '@kaytrust/did-ethr';
import { Wallet } from 'ethers';
import { createDidNearFromPrivateKey } from '@kaytrust/did-near';
import { generateKeyProfileWithPrivateKey } from 'src/common/utils/functions';

export default async () => {
  const { MELON_PRIVATE_KEY, MELON_ETHR_DID, MELON_NEAR_DID, MELON_ISSUER_NAME, ETHR_CHAIN_ID = 80002, MELON_KEY_DID } = process.env;

  if (!MELON_PRIVATE_KEY)
    throw Error('Required env variable: MELON_PRIVATE_KEY');

  let did = MELON_ETHR_DID;
  let did_near = MELON_NEAR_DID;
  let did_key = MELON_KEY_DID;

  if (!MELON_ETHR_DID) {
    const wallet = new Wallet(MELON_PRIVATE_KEY);
    const didEthr = createDidEthr(wallet.address, {chainNameOrId: Number(ETHR_CHAIN_ID)});
    did = didEthr.did;
  }
  if (!did_near) {
    did_near = createDidNearFromPrivateKey(MELON_PRIVATE_KEY);
  }
  if (!did_key) {
    did_key = await generateKeyProfileWithPrivateKey(MELON_PRIVATE_KEY, {crv: 'P-256'});
  }

  return {
    MELON_PRIVATE_KEY: MELON_PRIVATE_KEY,
    MELON_ETHR_DID: did!,
    MELON_NEAR_DID: did_near!,
    MELON_ISSUER_NAME: MELON_ISSUER_NAME ?? 'melon_university',
    MELON_KEY_DID: did_key!,
  };
};
