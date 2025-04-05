import 'dotenv/config'

export const SupportedChainId = {
  ETH_SEPOLIA: 11155111,
  AVAX_FUJI: 43113,
  BASE_SEPOLIA: 84532,
};

// depositForBurn default param
export const DEFAULT_MAX_FEE = 1000n;
export const DEFAULT_FINALITY_THRESHOLD = 1000;

// Chain ID to Name
export const CHAIN_TO_CHAIN_NAME = {
  [SupportedChainId.ETH_SEPOLIA]: "Ethereum Sepolia",
  [SupportedChainId.AVAX_FUJI]: "Avalanche Fuji",
  [SupportedChainId.BASE_SEPOLIA]: "Base Sepolia",
};

// Chain ID to USDC Contract
export const CHAIN_IDS_TO_USDC_ADDRESSES = {
  [SupportedChainId.ETH_SEPOLIA]: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
  [SupportedChainId.AVAX_FUJI]: "0x5425890298aed601595a70AB815c96711a31Bc65",
  [SupportedChainId.BASE_SEPOLIA]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

// Chain ID to TokenMessenger Contract
export const CHAIN_IDS_TO_TOKEN_MESSENGER = {
  [SupportedChainId.ETH_SEPOLIA]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
  [SupportedChainId.AVAX_FUJI]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
  [SupportedChainId.BASE_SEPOLIA]: "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa",
};

// Chain ID to MessageTransmitter Contract
export const CHAIN_IDS_TO_MESSAGE_TRANSMITTER = {
  [SupportedChainId.ETH_SEPOLIA]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  [SupportedChainId.AVAX_FUJI]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
  [SupportedChainId.BASE_SEPOLIA]: "0xe737e5cebeeba77efe34d4aa090756590b1ce275",
};

// Chain ID to destination domain for Circle
export const DESTINATION_DOMAINS = {
  [SupportedChainId.ETH_SEPOLIA]: 0,
  [SupportedChainId.AVAX_FUJI]: 1,
  [SupportedChainId.BASE_SEPOLIA]: 6,
};

// Chain ID to RPC
export const RPC_URL = {
    [SupportedChainId.ETH_SEPOLIA]: process.env.SEPOLIA_RPC_URL,
    [SupportedChainId.AVAX_FUJI]: process.env.FUJI_RPC_URL,
    [SupportedChainId.BASE_SEPOLIA]: process.env.BASESEPOLIA_RPC_URL
}

// Chain List
export const SUPPORTED_CHAINS = [
  SupportedChainId.ETH_SEPOLIA,
  SupportedChainId.AVAX_FUJI,
  SupportedChainId.BASE_SEPOLIA,
];
