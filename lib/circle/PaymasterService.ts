import { 
  createPublicClient, 
  http,
  type Address,
  maxUint256,
  type Hash,
  hexToBigInt,
  encodeFunctionData,
  parseAbi,
  type PublicClient,
  type Hex,
  formatEther,
  encodePacked,
  createWalletClient,
  custom,
  getContract
} from 'viem'
import { baseSepolia } from 'viem/chains'
import { toEcdsaKernelSmartAccount } from 'permissionless/accounts'
import { CHAIN_CONSTANTS, SmartAccountConfig, UserOperationGasEstimates } from './PaymasterTypes'
import { BundlerClient, createBundlerClient } from 'viem/account-abstraction'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export interface PaymasterConfig {
  ownerAddress?: Address
  smartWalletAddress?: Address
  bundlerUrl?: string
  paymasterAddress?: Address
  usdcAddress?: Address
}

export class PaymasterService {
  private readonly client: PublicClient
  private readonly bundlerClient: BundlerClient
  private readonly usdcContract: {
    address: Address
    abi: any
  }
  private ownerAddress?: Address
  private readonly paymasterAddress: Address

  constructor(config: PaymasterConfig = {}) {
    // Initialize viem client for Base Sepolia
    this.client = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })

    // Initialize bundler client
    this.bundlerClient = createBundlerClient({
      chain: baseSepolia,
      transport: http(CHAIN_CONSTANTS.BUNDLER_URL)
    })

    // Store configuration
    this.ownerAddress = config.ownerAddress;
    this.paymasterAddress = config.paymasterAddress || CHAIN_CONSTANTS.PAYMASTER_ADDRESS
    
    // Initialize USDC contract
    const usdcAddress = config.usdcAddress || CHAIN_CONSTANTS.USDC_ADDRESS
    this.usdcContract = {
      address: usdcAddress,
      abi: parseAbi([
        // ERC20 interface
        'function balanceOf(address owner) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
        // EIP-2612 interface
        'function nonces(address owner) view returns (uint256)',
        'function name() view returns (string)',
        'function version() view returns (string)',
        'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
      ])
    }
  }

  /**
   * Direct test of user operation without permit
   */
  async testUserOperation(privateKey: Hex): Promise<string> {
    const owner = privateKeyToAccount(privateKey)
    this.ownerAddress = owner.address

    // Get current gas prices
    const { standard: fees } = await this.bundlerClient.request({
      method: 'pimlico_getUserOperationGasPrice',
    })

    const maxFeePerGas = hexToBigInt(fees.maxFeePerGas)
    const maxPriorityFeePerGas = hexToBigInt(fees.maxPriorityFeePerGas)

    // Create a simple test operation (e.g., checking USDC balance)
    const callData = encodeFunctionData({
      abi: this.usdcContract.abi,
      functionName: 'balanceOf',
      args: [this.ownerAddress]
    })

    // Estimate gas limits
    const gasEstimates = await this.bundlerClient.estimateUserOperationGas({
      sender: this.ownerAddress,
      callData,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymaster: this.paymasterAddress
    })

    // Send the user operation
    const userOpHash = await this.bundlerClient.sendUserOperation({
      sender: this.ownerAddress,
      callData,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymaster: this.paymasterAddress,
      ...gasEstimates
    })

    return userOpHash
  }

  /**
   * Create a new private key for testing
   */
  async createPrivateKey(): Promise<Hex> {
    return generatePrivateKey()
  }

  /**
   * Get ETH balance for an EOA
   */
  async getEOABalance(address: Address): Promise<string> {
    const balance = await this.client.getBalance({ address })
    return formatEther(balance)
  }

  /**
   * Get USDC balance for the owner
   */
  async getOwnerUsdcBalance(): Promise<bigint> {
    if (!this.ownerAddress) throw new Error('Owner address not set')
    return this.getUSDCBalance(this.ownerAddress)
  }

  /**
   * Get USDC balance for an address
   */
  async getUSDCBalance(address: Address): Promise<bigint> {
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    })

    const balance = await client.readContract({
      ...this.usdcContract,
      functionName: 'balanceOf',
      args: [address]
    })
    return BigInt(balance.toString())
  }

  /**
   * Create and get a test smart account
   */
  async getOrCreateTestSmartAccount(privateKey: Hex) {
    const owner = privateKeyToAccount(privateKey)
    const account = await toEcdsaKernelSmartAccount({
      client: this.client,
      owners: [owner],
      version: '0.3.1'
    })
    this.ownerAddress = owner.address
    return account
  }

  /**
   * Create and sign an EIP-2612 permit for USDC spending by owner
   */
  async createPermitByOwner(privateKey: Hex): Promise<`0x${string}`> {
    const owner = privateKeyToAccount(privateKey)
    // Set the owner address if not already set
    this.ownerAddress = owner.address
    
    const permitData = await this.createPermit(
      this.paymasterAddress,
      CHAIN_CONSTANTS.MAX_GAS_USDC
    )
    
    console.log(permitData)
    return owner.signTypedData(permitData)
  }

  /**
   * Create permit data structure
   */
  private async createPermit(spender: Address, value: bigint) {

    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    })

    const name = await client.readContract({
      ...this.usdcContract,
      functionName: 'name', 
      args: []
    }) as string

    const version = await client.readContract({
      ...this.usdcContract,
      functionName: 'version',
      args: []
    }) as string

    const nonce = await client.readContract({
      ...this.usdcContract,
      functionName: 'nonces',
      args: [this.ownerAddress]
    }) as bigint

    return {
      primaryType: 'Permit',
      types: {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      domain: {
        name,
        version,
        chainId: baseSepolia.id,
        verifyingContract: this.usdcContract.address,
      },
      message: {
        owner: this.ownerAddress,
        spender,
        value,
        nonce,
        deadline: maxUint256,
      },
    } as const
  }

  private sendUSDC(to: Address, amount: bigint) {
    return {
      to: this.usdcContract.address,
      abi: this.usdcContract.abi,
      functionName: 'transfer',
      args: [to, amount],
    }
  }

  /**
   * Estimate gas for a user operation with permit
   */
  async estimateUserOpGas(
    permitSignature: Hex,
    privateKey: Hex
  ): Promise<{
    callGasLimit?: bigint;
    preVerificationGas?: bigint;
    verificationGasLimit?: bigint;
  }> {

    const owner = privateKeyToAccount(privateKey)
    // Set the owner address if not already set
    this.ownerAddress = owner.address

    const paymasterData = encodePacked(
      ['uint8', 'address', 'uint256', 'bytes'],
      [
        0, // Reserved for future use
        this.usdcContract.address,
        CHAIN_CONSTANTS.MAX_GAS_USDC,
        permitSignature,
      ]
    )

    // Get current gas prices
    const { standard: fees } = await this.bundlerClient.request({
      method: 'pimlico_getUserOperationGasPrice',
    })

    console.log(fees)

    const maxFeePerGas = hexToBigInt(fees.maxFeePerGas)
    const maxPriorityFeePerGas = hexToBigInt(fees.maxPriorityFeePerGas)

    getContract

    const account = await this.getOrCreateTestSmartAccount(privateKey)
    const recipient = '0x1dc552d112D6952903e76d8DDDd6B7bF4DA0e515'
    const calls = [this.sendUSDC(recipient, 10000n)] // $0.01 USDC


    // Estimate gas limits
    const gasEstimates = await this.bundlerClient.estimateUserOperationGas({
      account,
      calls,
      paymaster: this.paymasterAddress,
      paymasterData,
    })

    return {
      callGasLimit: gasEstimates.callGasLimit,
      preVerificationGas: gasEstimates.preVerificationGas,
      verificationGasLimit: gasEstimates.verificationGasLimit,
    }
  }

  /**
   * Trigger a user operation using Circle paymaster
   */
  async triggerUserOpByCirclePaymaster(
    permitSignature: Hex
  ): Promise<string> {
    if (!this.ownerAddress) throw new Error('Owner address not set')

    const paymasterData = encodePacked(
      ['uint8', 'address', 'uint256', 'bytes'],
      [
        0, // Reserved for future use
        this.usdcContract.address,
        CHAIN_CONSTANTS.MAX_GAS_USDC,
        permitSignature,
      ]
    )

    // Send the user operation
    const userOpHash = await this.bundlerClient.sendUserOperation({
      account: {
        address: this.ownerAddress,
      },
      paymaster: this.paymasterAddress,
      paymasterData,
    })

    return userOpHash
  }

  /**
   * Estimate gas for a user operation
   */
  async estimateUserOperationGas(
    account: SmartAccountConfig,
    calls: any[],
    paymasterData: Hash
  ): Promise<UserOperationGasEstimates> {
    // Get the additional gas charge from paymaster
    const additionalGasCharge = hexToBigInt(
      (
        await this.client.call({
          to: this.paymasterAddress,
          data: encodeFunctionData({
            abi: parseAbi(['function additionalGasCharge() returns (uint256)']),
            functionName: 'additionalGasCharge',
          }),
        })
      ).data
    )

    // Get current gas prices
    const { standard: fees } = await this.bundlerClient.request({
      method: 'pimlico_getUserOperationGasPrice',
    })

    const maxFeePerGas = hexToBigInt(fees.maxFeePerGas)
    const maxPriorityFeePerGas = hexToBigInt(fees.maxPriorityFeePerGas)

    // Estimate gas limits
    const gasEstimates = await this.bundlerClient.estimateUserOperationGas({
      account,
      calls,
      paymaster: this.paymasterAddress,
      paymasterData,
      paymasterPostOpGasLimit: additionalGasCharge,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
    })

    return {
      ...gasEstimates,
      maxFeePerGas,
      maxPriorityFeePerGas,
      additionalGasCharge
    }
  }

  /**
   * Send a user operation through the bundler
   */
  async sendUserOperation(
    account: SmartAccountConfig,
    calls: any[],
    gasEstimates: UserOperationGasEstimates,
    paymasterData: Hash
  ) {
    const userOpHash = await this.bundlerClient.sendUserOperation({
      account,
      calls,
      ...gasEstimates,
      paymaster: this.paymasterAddress,
      paymasterData,
      paymasterPostOpGasLimit: Math.max(
        Number(gasEstimates.paymasterPostOpGasLimit),
        Number(gasEstimates.additionalGasCharge)
      ),
    })

    return userOpHash
  }

  /**
   * Wait for a user operation to be included in a block
   */
  async waitForUserOperation(hash: Hash) {
    return this.bundlerClient.waitForUserOperationReceipt({
      hash,
    })
  }

  /**
   * Helper to create USDC transfer call data
   */
  createUSDCTransferCall(to: Address, amount: bigint) {
    return {
      to: this.usdcContract.address,
      abi: this.usdcContract.abi,
      functionName: 'transfer',
      args: [to, amount]
    } as const
  }
}