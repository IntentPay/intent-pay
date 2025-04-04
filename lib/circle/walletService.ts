import {
  toPasskeyTransport,
  toWebAuthnCredential,
  WebAuthnMode,
  toModularTransport,
  toCircleSmartAccount,
} from '@circle-fin/modular-wallets-core';
import { createPublicClient, Transport, Client } from 'viem';
import { toWebAuthnAccount } from 'viem/account-abstraction';

// testing chains
import { baseSepolia, arbitrumSepolia, sepolia } from 'viem/chains';

export class walletService {
  private publicClient: any = null;
  private modularTransport: any = null;
  private readonly clientKey: string;
  private readonly clientUrl: string; 
  private readonly chainName: string;
  private passkeyTransport: any = null;

  constructor() {
    this.clientKey = process.env.CIRCLE_CLIENT_KEY || '';
    this.clientUrl = process.env.CIRCLE_CLIENT_URL || '';
    this.chainName = process.env.CIRCLE_CHAIN_NAME || '';
    this.modularTransport = toModularTransport(
      `${this.clientUrl}/${this.chainName}`,
      this.clientKey
    );
    this.publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: this.modularTransport as Transport,
    });
    this.passkeyTransport = toPasskeyTransport(this.clientUrl, this.clientKey);
  }

  /**
   * Get a credential for a wallet by World ID
   * @param hashWorldId - The hash of the World ID
   * @returns The credential for the passkey
   */
  async getCredentialByWorldIdForRegistration(hashWorldId: string) {
    try {
      console.log('REGISTER_PASSKEY', { walletUniqueKey: hashWorldId });
      
      const credential = await toWebAuthnCredential({
        transport: this.passkeyTransport,
        mode: WebAuthnMode.Register,
        // credentialId: credential.id,  for existing login
        username: hashWorldId // different unique key for different wallet
      });

      console.log('REGISTER_PASSKEY', { id : credential.rpId });
      return credential;
    } catch (error) {
      console.error('REGISTER_PASSKEY', error);
      throw error;
    }
  }

  async getCredentialByWorldIdForLogin(hashWorldId?: string, credentialId?: string) {
    if (!hashWorldId && !credentialId) {
      throw new Error('hashWorldId or credentialId is required');
    }
    
    try {
      console.log('LOGIN_PASSKEY', { username: hashWorldId });

      let credential;
      if (!credentialId) {
        credential = await toWebAuthnCredential({
          transport: this.passkeyTransport,
          mode: WebAuthnMode.Login,
          username: hashWorldId, // different hashWorldId for different wallet
        });
      } else {
        credential = await toWebAuthnCredential({
          transport: this.passkeyTransport,
          mode: WebAuthnMode.Login,
          credentialId
        });
      }

      console.log('LOGIN_PASSKEY', { username: hashWorldId });
      return credential;
    } catch (error) {
      console.error('LOGIN_PASSKEY', error);
      throw error;
    }
  }

  /**
   * 1. Get Crendential first then initialize Smart Account
   * @param credential - The credential for the passkey
   * @returns The smart account
   */
  async initializeSmartAccount(credential: any) {
    try {
      console.log(`INITIALIZE_SMART_ACCOUNT ${credential}`);

      const smartAccount = await toCircleSmartAccount({
        client: this.publicClient as Client,
        owner: toWebAuthnAccount({
            credential,
        }),
      });

      console.log('INITIALIZE_SMART_ACCOUNT', { smartAccount });
      return smartAccount;
    } catch (error) {
      console.error('INITIALIZE_SMART_ACCOUNT', error);
      throw error;
    }
  }
} 