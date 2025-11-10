import { v4 as uuidv4 } from "uuid";
import { PaymentIntent, CreatePaymentIntentRequest, CreatePaymentIntentResponse, ApprovePaymentIntentResponse } from "../types";
import { PolicyService } from "./policy.service";
import { TurnkeyService } from "./turnkey.service";

export class PaymentIntentService {
  private intents: Map<string, PaymentIntent> = new Map();
  private policyService: PolicyService;
  private turnkeyService: TurnkeyService;

  constructor(policyService: PolicyService, turnkeyService: TurnkeyService) {
    this.policyService = policyService;
    this.turnkeyService = turnkeyService;
  }

  async createPaymentIntentFromAgent(
    delegateId: string,
    userId: string,
    walletId: string,
    request: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    console.log(`Creating payment intent from delegate ${delegateId} for user ${userId}`);
    
    // Check policy
    const policyCheck = this.policyService.checkPolicy(userId, request.recipient_id, request.amount_sats);
    
    if (!policyCheck.allowed) {
      console.log(`Policy check failed: ${policyCheck.reason}`);
      return {
        status: "DENIED",
        reason: policyCheck.reason
      };
    }

    // Create payment intent
    const intentId = uuidv4();
    const intent: PaymentIntent = {
      id: intentId,
      user_id: userId,
      wallet_id: walletId,
      recipient_id: request.recipient_id,
      amount_sats: request.amount_sats,
      status: "PENDING",
      created_at: new Date(),
      note: request.note
    };

    this.intents.set(intentId, intent);
    console.log(`Created payment intent ${intentId} for ${request.amount_sats} sats to ${request.recipient_id}`);

    return {
      status: "PENDING",
      intent_id: intentId
    };
  }

  async approvePaymentIntentAsUser(userId: string, intentId: string): Promise<ApprovePaymentIntentResponse> {
    console.log(`User ${userId} attempting to approve intent ${intentId}`);
    
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return {
        status: "ERROR",
        error: "Payment intent not found"
      };
    }

    if (intent.user_id !== userId) {
      return {
        status: "ERROR",
        error: "Intent does not belong to this user"
      };
    }

    if (intent.status !== "PENDING") {
      return {
        status: "ERROR",
        error: `Intent is already ${intent.status.toLowerCase()}`
      };
    }

    try {
      // Get recipient address
      const recipientAddress = this.policyService.getRecipientAddress(intent.recipient_id);
      if (!recipientAddress) {
        return {
          status: "ERROR",
          error: "Invalid recipient"
        };
      }

      // Get wallet address from environment
      const walletAddress = "0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2"; // From your scripts
      
      // Convert sats to Wei (simplified conversion for demo)
      const amountWei = (intent.amount_sats * 1000000000000).toString();
      
      // Sign transaction with Turnkey
      const signedTx = await this.turnkeyService.signEthereumTransaction(walletAddress, recipientAddress, amountWei);
      
      // Update intent
      intent.status = "EXECUTED";
      intent.executed_at = new Date();
      intent.txid = signedTx;
      this.intents.set(intentId, intent);

      // Update daily spend tracking
      this.policyService.updateDailySpend(userId, intent.amount_sats);

      console.log(`Payment intent ${intentId} executed successfully. TxID: ${signedTx}`);

      return {
        status: "EXECUTED",
        txid: signedTx
      };
    } catch (error) {
      console.error(`Error executing payment intent ${intentId}:`, error);
      intent.status = "REJECTED";
      this.intents.set(intentId, intent);
      
      return {
        status: "ERROR",
        error: "Failed to execute transaction"
      };
    }
  }

  listIntents(userId: string): PaymentIntent[] {
    return Array.from(this.intents.values())
      .filter(intent => intent.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  getIntent(intentId: string): PaymentIntent | undefined {
    return this.intents.get(intentId);
  }

  getPendingIntents(userId: string): PaymentIntent[] {
    return this.listIntents(userId).filter(intent => intent.status === "PENDING");
  }
}
