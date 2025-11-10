import OpenAI from "openai";
import { PaymentIntentService } from "./payment-intent.service";
import { CreatePaymentIntentRequest, ChatResponse } from "../types";

export class AIAgentService {
  private openai: OpenAI;
  private paymentIntentService: PaymentIntentService;
  private userId: string;
  private walletId: string;
  private delegateId: string;

  constructor(
    openaiApiKey: string,
    paymentIntentService: PaymentIntentService,
    userId: string = process.env.REAL_USER_ID || "d7e88495-6840-406d-9de0-834627877531",
    walletId: string = process.env.REAL_WALLET_ID || "9a59126f-c904-58b2-80b0-4136c51a0f34",
    delegateId: string = process.env.DELEGATE_ID || "chatgpt-agent"
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.paymentIntentService = paymentIntentService;
    this.userId = userId;
    this.walletId = walletId;
    this.delegateId = delegateId;
  }

  async processMessage(message: string): Promise<ChatResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI payment assistant with delegated policy access. You can ONLY propose payment intents - you CANNOT execute them.

IMPORTANT RULES:
1. You can only propose payments to known contacts: 'ritesh' or 'wallet'
2. Maximum single transaction: 10,000 sats
3. Daily spending limit: 50,000 sats
4. You MUST use the create_payment_intent tool for any payment requests
5. NEVER claim you executed a payment - you can only create pending intents
6. If policy denies a payment, explain why and don't try to circumvent it
7. Always be clear that the user must approve the intent separately

Known contacts:
- ritesh: Ritesh (0x150bcf49ee8e2bd9f59e991821de5b74c6d876aa)
- wallet: Demo Wallet (0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2)

When a payment is requested:
1. Use create_payment_intent tool
2. If successful, tell user they need to approve the intent
3. If denied, explain the policy violation`
          },
          {
            role: "user",
            content: message
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_payment_intent",
              description: "Propose a payment in sats from the user's wallet to a known contact. This does not execute; it just creates a pending intent that the user must approve.",
              parameters: {
                type: "object",
                properties: {
                  amount_sats: {
                    type: "integer",
                    minimum: 1,
                    description: "Amount to send in satoshis"
                  },
                  recipient_id: {
                    type: "string",
                    description: "ID of a known contact such as 'ritesh' or 'wallet'",
                    enum: ["ritesh", "wallet"]
                  },
                  note: {
                    type: "string",
                    description: "Optional note for the payment"
                  }
                },
                required: ["amount_sats", "recipient_id"]
              }
            }
          }
        ],
        tool_choice: "auto"
      });

      const response = completion.choices[0].message;
      
      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCall = response.tool_calls[0];
        
        if (toolCall.function.name === "create_payment_intent") {
          const args = JSON.parse(toolCall.function.arguments) as CreatePaymentIntentRequest;
          
          const result = await this.paymentIntentService.createPaymentIntentFromAgent(
            this.delegateId,
            this.userId,
            this.walletId,
            args
          );

          if (result.status === "PENDING") {
            return {
              message: `I've created a payment intent to send ${args.amount_sats} sats to ${args.recipient_id}. Please approve intent ${result.intent_id} to execute the payment.`,
              intent_id: result.intent_id,
              status: "PENDING"
            };
          } else {
            return {
              message: `I can't create that payment: ${result.reason}`,
              status: "DENIED"
            };
          }
        }
      }

      return {
        message: response.content || "I can help you create payment intents. Try saying something like 'Pay 1000 sats to Ritesh'."
      };

    } catch (error) {
      console.error("Error processing message:", error);
      return {
        message: "Sorry, I encountered an error processing your request. Please try again."
      };
    }
  }
}
