export interface ProviderConfiguration {
  [x: string]: any;
  chainId: number | bigint;
  registry: string;
  name?: string;
  description?: string;
  rpcUrl?: string;
  legacyNonce?: boolean;
}

export default () => {
  const { NETWORK_CHAIN_ID = 80002, NETWORK_REGISTRY = "0xBC56d0883ef228b2B16420E9002Ece0A46c893F8", NETWORK_RPC_URL } = process.env;

  const default_network:ProviderConfiguration = {
    chainId: Number(NETWORK_CHAIN_ID),
    registry: NETWORK_REGISTRY,
    rpcUrl: NETWORK_RPC_URL,
  }

  return {
    default_network,
    networks: [default_network],
  };
};
