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
