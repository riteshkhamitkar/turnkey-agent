import { Turnkey } from "@turnkey/sdk-server";
import { TurnkeyConfig } from "../types";

export class TurnkeyService {
  private client: Turnkey;

  constructor(config: TurnkeyConfig) {
    this.client = new Turnkey({
      apiBaseUrl: config.apiBaseUrl,
      apiPublicKey: config.apiPublicKey,
      apiPrivateKey: config.apiPrivateKey,
      defaultOrganizationId: config.defaultOrganizationId,
    });
  }

  async getWallet(walletId: string) {
    try {
      const response = await this.client.apiClient().getWallet({
        walletId: walletId
      });
      return response;
    } catch (error) {
      console.error("Error getting wallet:", error);
      throw error;
    }
  }

  async getWalletAccounts(walletId: string) {
    try {
      const response = await this.client.apiClient().getWalletAccounts({
        walletId: walletId
      });
      return response;
    } catch (error) {
      console.error("Error getting wallet accounts:", error);
      throw error;
    }
  }

  async listWallets() {
    try {
      const response = await this.client.apiClient().getWallets({
        organizationId: this.client.config.defaultOrganizationId
      });
      
      // Add accounts to each wallet using getWalletAccounts API
      if (response.wallets) {
        for (const wallet of response.wallets) {
          try {
            const accountsResponse = await this.client.apiClient().getWalletAccounts({
              walletId: wallet.walletId
            });
            
            if (accountsResponse.accounts && accountsResponse.accounts.length > 0) {
              (wallet as any).accounts = accountsResponse.accounts;
            }
          } catch (error) {
            console.error(`Error getting accounts for wallet ${wallet.walletId}:`, error);
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error("Error listing wallets:", error);
      throw error;
    }
  }

  async createWallet(walletName: string) {
    try {
      const response = await this.client.apiClient().createWallet({
        walletName: walletName,
        accounts: [
          {
            curve: "CURVE_SECP256K1",
            pathFormat: "PATH_FORMAT_BIP32",
            path: "m/44'/60'/0'/0/0", // Standard Ethereum derivation path
            addressFormat: "ADDRESS_FORMAT_ETHEREUM"
          }
        ]
      });
      
      return response;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  }

  async signTransaction(walletAddress: string, unsignedTransaction: string) {
    try {
      const response = await this.client.apiClient().signTransaction({
        type: "TRANSACTION_TYPE_ETHEREUM",
        signWith: walletAddress,
        unsignedTransaction: unsignedTransaction,
      });
      return response;
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }

  async createPolicy(policyName: string, userId: string, allowedAddress: string) {
    try {
      const response = await this.client.apiClient().createPolicy({
        policyName: policyName,
        notes: "AI Agent delegated policy for payment intents",
        effect: "EFFECT_ALLOW",
        consensus: `approvers.any(user, user.id == '${userId}')`,
        condition: `eth.tx.to == '${allowedAddress}'`
      });
      return response;
    } catch (error) {
      console.error("Error creating policy:", error);
      throw error;
    }
  }

  async approveWalletForPayments(walletId: string) {
    try {
      // Get wallet details
      const walletInfo = await this.getWallet(walletId);
      const wallet = walletInfo.wallet as any;
      
      if (!wallet?.accounts || wallet.accounts.length === 0) {
        throw new Error("No accounts found in wallet");
      }

      const walletAddress = wallet.accounts[0].address;
      const userId = process.env.REAL_USER_ID!;
      
      // Create Turnkey policy for this wallet address
      const policyName = `AI Agent Policy - ${wallet.walletName} - ${Date.now()}`;
      const response = await this.createPolicy(policyName, userId, walletAddress);
      
      console.log(`✅ Turnkey policy created for wallet ${wallet.walletName} (${walletAddress})`);
      return {
        policyId: response.policyId,
        walletName: wallet.walletName,
        walletAddress: walletAddress
      };
    } catch (error) {
      console.error("Error approving wallet for payments:", error);
      throw error;
    }
  }

  // Real Ethereum transaction signing using Turnkey
  async signEthereumTransaction(walletAddress: string, recipientAddress: string, amountWei: string): Promise<string> {
    try {
      // Build unsigned Ethereum transaction parameters
      const unsignedTransaction = {
        to: recipientAddress,
        value: amountWei,
        chainId: 1, // Ethereum mainnet
        nonce: 0, // In production, fetch from blockchain
        gasLimit: "21000",
        maxFeePerGas: "50000000000", // 50 Gwei
        maxPriorityFeePerGas: "2000000000", // 2 Gwei
        type: 2, // EIP-1559 transaction type
      };

      // Import ethers for transaction serialization
      const { ethers } = await import("ethers");
      const serializedTx = ethers.Transaction.from(unsignedTransaction).unsignedSerialized;

      const response = await this.client.apiClient().signTransaction({
        type: "TRANSACTION_TYPE_ETHEREUM",
        signWith: walletAddress,
        unsignedTransaction: serializedTx,
      });

      console.log(`✅ Transaction signed successfully`);
      return response.signedTransaction || "";
    } catch (error) {
      console.error("Error signing Ethereum transaction:", error);
      throw error;
    }
  }

  // Convert sats to Wei for Ethereum transactions (1 sat = 1000000000000 wei for demo)
  private satsToWei(sats: number): string {
    return (sats * 1000000000000).toString();
  }
}
