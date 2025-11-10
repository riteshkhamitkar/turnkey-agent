import { TurnkeyService } from "./turnkey.service";
import { PolicyService } from "./policy.service";
import { PaymentIntentService } from "./payment-intent.service";
import { AIAgentService } from "./ai-agent.service";
import { TurnkeyConfig, ChatRequest, ChatResponse, ApproveRequest, ApprovePaymentIntentResponse } from "../types";

export class AppService {
  private turnkeyService: TurnkeyService;
  private policyService: PolicyService;
  private paymentIntentService: PaymentIntentService;
  private aiAgentService: AIAgentService;

  constructor(turnkeyConfig: TurnkeyConfig, openaiApiKey: string) {
    this.turnkeyService = new TurnkeyService(turnkeyConfig);
    this.policyService = new PolicyService();
    this.paymentIntentService = new PaymentIntentService(this.policyService, this.turnkeyService);
    this.aiAgentService = new AIAgentService(openaiApiKey, this.paymentIntentService);
  }

  async processChat(request: ChatRequest): Promise<ChatResponse> {
    console.log(`Processing chat request from user ${request.userId}: ${request.message}`);
    return await this.aiAgentService.processMessage(request.message);
  }

  async approvePayment(request: ApproveRequest): Promise<ApprovePaymentIntentResponse> {
    console.log(`Processing approval request from user ${request.userId} for intent ${request.intentId}`);
    return await this.paymentIntentService.approvePaymentIntentAsUser(request.userId, request.intentId);
  }

  async listPendingIntents(userId: string) {
    return this.paymentIntentService.getPendingIntents(userId);
  }

  async listAllIntents(userId: string) {
    return this.paymentIntentService.listIntents(userId);
  }

  async getIntent(intentId: string) {
    return this.paymentIntentService.getIntent(intentId);
  }

  async getPolicyInfo() {
    return this.policyService.getPolicy();
  }

  async getDailySpend(userId: string) {
    return this.policyService.getDailySpend(userId);
  }
}
