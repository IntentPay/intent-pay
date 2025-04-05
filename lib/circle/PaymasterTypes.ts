import { type Address, type Hash } from 'viem'
import { base, baseSepolia } from 'viem/chains'

export interface UserOperationGasEstimates {
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterPostOpGasLimit?: bigint
  additionalGasCharge?: bigint
}

export interface UserOperationReceipt {
  userOpHash: Hash
  entryPoint: Address
  sender: Address
  nonce: bigint
  paymaster?: Address
  actualGasCost: bigint
  actualGasUsed: bigint
  success: boolean
  reason?: string
  logs: any[]
  receipt: any
}

export interface SmartAccountConfig {
  address: Address
  signTypedData: (domain: any, types: any, message: any) => Promise<string>
}

// Get API key from environment variable
// export const CHAIN_CONSTANTS = {
//     USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base USDC
//     PAYMASTER_ADDRESS: '0x6C973eBe80dCD8660841D4356bf15c32460271C9' as Address, // Circle Base Paymaster
//     BUNDLER_URL: `https://public.pimlico.io/v2/${base.id}/rpc`,
//     MAX_GAS_USDC: BigInt('1000000'), // 1 USDC (6 decimals)
//     ENTRYPOINT_ADDRESS: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address, // Base EntryPoint v0.6
//   } as const 

const PIMLICO_API_KEY = 'pim_BTSid73mCDemR5jp8FvNo4'

export const CHAIN_CONSTANTS = {
  USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Base Sepolia USDC
  PAYMASTER_ADDRESS: '0x31BE08D380A21fc740883c0BC434FcFc88740b58' as Address, // Circle Base Sepolia Paymaster
  BUNDLER_URL: `https://api.pimlico.io/v2/137/rpc?apikey=pim_BTSid73mCDemR5jp8FvNo4`,
  MAX_GAS_USDC: BigInt('1000000'), // 1 USDC (6 decimals)
  ENTRYPOINT_ADDRESS: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address, // Base Sepolia EntryPoint v0.6
} as const

