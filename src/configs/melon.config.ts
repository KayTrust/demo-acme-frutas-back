import { createDidEthr } from '@kaytrust/did-ethr';
import { Wallet } from 'ethers';

export default () => {
  const { MELON_PRIVATE_KEY, MELON_ETHR_DID, MELON_ISSUER_NAME } = process.env;

  if (!MELON_PRIVATE_KEY)
    throw Error('Required env variable: MELON_PRIVATE_KEY');

  let did = MELON_ETHR_DID;

  if (!MELON_ETHR_DID) {
    const wallet = new Wallet(MELON_PRIVATE_KEY);
    const didEthr = createDidEthr(wallet.address);
    did = didEthr.did;
  }

  return {
    MELON_PRIVATE_KEY: MELON_PRIVATE_KEY,
    MELON_ETHR_DID: did!,
    MELON_ISSUER_NAME: MELON_ISSUER_NAME ?? 'melon_university',
  };
};
