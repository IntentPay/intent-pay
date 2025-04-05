import {
  toPasskeyTransport,
  toWebAuthnCredential,
  WebAuthnMode,
  toModularTransport,
  toCircleSmartAccount,
  encodeTransfer,
} from '@circle-fin/modular-wallets-core';
import { createPublicClient, Transport, Client, parseEther } from 'viem';
import { createBundlerClient, SmartAccount, toWebAuthnAccount } from 'viem/account-abstraction';

// testing chains
import { baseSepolia, arbitrumSepolia, sepolia } from 'viem/chains';

// 读取环境变量
const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY || '';
const clientUrl = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL || ''; 
const chainName = process.env.NEXT_PUBLIC_CIRCLE_CHAIN_NAME || '';
const chainId = parseInt(process.env.NEXT_PUBLIC_CIRCLE_CHAIN_ID || '421614');
const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CIRCLE_USDC_ADDRESS as `0x${string}` || '';
const USDC_DECIMALS = process.env.NEXT_PUBLIC_CIRCLE_USDC_DECIMALS || 6;
const NUMBER_OF_USDC = 10 ** Number(USDC_DECIMALS);

// 获取对应的链配置
const getChainConfig = (chainId: number) => {
  switch (chainId) {
    case 421614:
      return arbitrumSepolia;
    case 84532:
      return baseSepolia;
    case 11155111:
      return sepolia;
    default:
      return arbitrumSepolia;
  }
};

export class walletService {
  private publicClient: any = null;
  private modularTransport: any = null;
  private passkeyTransport: any = null;
  private chainConfig: any = null;

  constructor() {
    try {
      // 获取链配置
      this.chainConfig = getChainConfig(chainId);
      
      // 记录调试信息
      console.log('Initializing wallet service with config:', {
        clientUrl: clientUrl ? `${clientUrl.substring(0, 10)}...` : 'Not set',
        chainName: chainName || 'Not set',
        chainId: chainId,
        clientKeyExists: !!clientKey,
        chainConfig: this.chainConfig ? `${this.chainConfig.name} (id: ${this.chainConfig.id})` : 'Not found'
      });
      
      // 检查配置是否完整
      if (!clientUrl || !chainName || !clientKey) {
        console.error('Missing Circle wallet configuration. Check your environment variables.');
        return;
      }
      
      // 创建传输层
      this.modularTransport = toModularTransport(
        `${clientUrl}/${chainName}`,
        clientKey
      );
      
      // 创建公共客户端
      this.publicClient = createPublicClient({
        chain: this.chainConfig,
        transport: this.modularTransport as Transport,
      });
      
      // 创建密钥传输层
      this.passkeyTransport = toPasskeyTransport(clientUrl, clientKey);
      
      console.log('Wallet service initialized successfully');
    } catch (error) {
      console.error('Error initializing wallet service:', error);
    }
  }

  /**
   * Get a credential for a wallet by World ID (Registration)
   * @param hashWorldId - The hash of the World ID
   * @returns The credential for the passkey
   */
  async getCredentialByWorldIdForRegistration(worldId: string) {
    try {
      if (!this.passkeyTransport) {
        throw new Error('Wallet service not properly initialized');
      }
      
      // 使用安全的标识符作为钱包用户名
      // 对于World ID，我们使用username加一些随机性来确保唯一性
      const safeUsername = `${worldId}_${Date.now().toString().substring(8)}`;
      
      console.log('REGISTER_PASSKEY attempt for:', { safeUsername: safeUsername.substring(0, 10) + '...' });
      
      const credential = await toWebAuthnCredential({
        transport: this.passkeyTransport,
        mode: WebAuthnMode.Register,
        username: safeUsername // 不同的唯一键对应不同的钱包
      });

      console.log('REGISTER_PASSKEY success, id:', credential.rpId);
      return credential;
    } catch (error) {
      console.log('REGISTER_PASSKEY failed, trying login instead:', error);
      
      // 如果注册失败，尝试登录（可能用户已经有一个密钥）
      if (worldId) {
        return this.getCredentialByWorldIdForLogin(worldId);
      }
      
      throw error;
    }
  }

  /**
   * Get a credential for a wallet by World ID (Login)
   * @param hashWorldId - The hash of the World ID
   * @param credentialId - Existed passkey
   * @returns The credential for the passkey
   */
  async getCredentialByWorldIdForLogin(worldId?: string, credentialId?: string) {
    if (!worldId && !credentialId) {
      throw new Error('worldId or credentialId is required');
    }
    
    try {
      if (!this.passkeyTransport) {
        throw new Error('Wallet service not properly initialized');
      }
      
      // 使用相同的安全格式作为登录名
      const safeUsername = worldId ? `${worldId}_${Date.now().toString().substring(8)}` : undefined;
      
      console.log('LOGIN_PASSKEY attempt', { 
        safeUsername: safeUsername ? safeUsername.substring(0, 10) + '...' : 'using credential', 
        hasCredentialId: !!credentialId
      });

      let credential;
      if (!credentialId && safeUsername) {
        credential = await toWebAuthnCredential({
          transport: this.passkeyTransport,
          mode: WebAuthnMode.Login,
          username: safeUsername,
        });
      } else if (credentialId) {
        credential = await toWebAuthnCredential({
          transport: this.passkeyTransport,
          mode: WebAuthnMode.Login,
          credentialId
        });
      } else {
        throw new Error('Could not determine login method');
      }

      console.log('LOGIN_PASSKEY success');
      return credential;
    } catch (error) {
      console.error('LOGIN_PASSKEY failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Smart Account
   * @param credential - Credential for the passkey
   * @returns SmartAccount
   */
  async initializeSmartAccount(credential: any) {
    try {
      if (!this.modularTransport || !this.publicClient || !this.chainConfig) {
        throw new Error('Wallet service not properly initialized');
      }
      
      console.log('Initializing smart account with credential');
      
      // 创建Circle智能账户
      const account = await toCircleSmartAccount({
        client: this.publicClient as Client,
        owner: toWebAuthnAccount({
          credential,
        }),
      });
      
      console.log('Smart account created:', { address: account.address });

      // 创建捆绑客户端
      const bundlerClient = await createBundlerClient({
        chain: this.chainConfig,
        transport: this.modularTransport as Transport,
        account: account as SmartAccount,
      });
      
      console.log('Bundler client created');

      return {
        account,
        address: account.address,
        bundlerClient,
      };
    } catch (error) {
      console.error('INITIALIZE_SMART_ACCOUNT failed:', error);
      throw error;
    }
  }

  /**
   * Get Smart Account
   * @returns SmartAccount or null
   */
  async getSmartAccount() {
    try {
      // Get the smart account from local storage
      const smartAccountString = localStorage.getItem('worldid_smart_account');
      if (!smartAccountString) {
        console.log('Smart account not found in local storage');
        return null;
      }

      // Parse the smart account
      const smartAccountData = JSON.parse(smartAccountString);
      if (!smartAccountData || !smartAccountData.account) {
        console.log('Invalid smart account data');
        return null;
      }

      return smartAccountData;
    } catch (error) {
      console.error('GET_SMART_ACCOUNT', error);
      return null;
    }
  }

  /**
   * Get Account Address
   * @returns Account address or null
   */
  async getAccountAddress() {
    const smartAccount = await this.getSmartAccount();
    if (!smartAccount) {
      return null;
    }

    return smartAccount.address;
  }

  /**
   * Send USDC transfer (For testing purposes) based on the smart account
   * @param recipientAddress - The recipient address
   * @param amount - The amount of USDC to send
   * @param smartAccount - The smart account
   * @returns The user operation hash
   */
  async sendUSDCTransfer(recipientAddress: string, amount: string, smartAccount: any) {
    try {
      if (!this.publicClient || !smartAccount) {
        throw new Error('Smart account not initialized');
      }
      
      console.log('SEND_USDC_TRANSFER', { recipientAddress, amount: amount.toString() });

      const bundlerClient = createBundlerClient({
          account: smartAccount as SmartAccount,
          chain: this.chainConfig,
          transport: this.modularTransport,
      })

      const userOpHash = await bundlerClient.sendUserOperation({
        calls: [encodeTransfer(recipientAddress as `0x${string}`, USDC_CONTRACT_ADDRESS, this.parseToBigInt(amount, 'USDC'))],
        account: smartAccount as SmartAccount, 
        paymaster: true
      });

      console.log('userOpHash', userOpHash);

      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash
      });

      console.log('SEND_USDC_TRANSFER', { userOpHash });
      return receipt.userOpHash;
    } catch (error) {
      console.error('SEND_USDC_TRANSFER', error);
      throw error;
    }
  }

  private parseToBigInt(amount: string, currency: string): bigint {
    if (currency === 'USDC') {
      // Convert 0.001 USDC to its smallest unit (microUSDC)
      // USDC has 6 decimal places, so multiply by 10^6
      const amountInSmallestUnit = Math.floor(parseFloat(amount) * 1_000_000);
      // Now convert to BigInt
      return BigInt(amountInSmallestUnit);
    } else if (currency === 'ETH') {
      return parseEther(amount);
    } 

    throw new Error('Invalid currency');
  }
} 