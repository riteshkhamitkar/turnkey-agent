import readline from "readline";
import dotenv from "dotenv";
import { AppService } from "./services/app.service";
import { TurnkeyConfig } from "./types";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize services
const turnkeyConfig: TurnkeyConfig = {
  apiBaseUrl: "https://api.turnkey.com",
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
};

const openaiApiKey = process.env.OPENAI_API_KEY!;
const appService = new AppService(turnkeyConfig, openaiApiKey);
const userId = process.env.REAL_USER_ID || "d7e88495-6840-406d-9de0-834627877531";

console.log("🤖 AI Agent Payment CLI");
console.log("========================");
console.log("Commands:");
console.log("  - Type natural language payment requests (e.g., 'Pay 1000 sats to Ritesh')");
console.log("  - 'approve <intent_id>' - Approve a payment intent");
console.log("  - 'pending' - Show pending intents");
console.log("  - 'intents' - Show all intents");
console.log("  - 'policy' - Show policy information");
console.log("  - 'spend' - Show daily spend");
console.log("  - 'quit' - Exit");
console.log("");

function prompt() {
  rl.question("💬 You: ", async (input) => {
    const command = input.trim().toLowerCase();
    
    if (command === "quit" || command === "exit") {
      console.log("👋 Goodbye!");
      rl.close();
      return;
    }
    
    try {
      if (command.startsWith("approve ")) {
        const intentId = command.substring(8).trim();
        console.log(`🔄 Approving intent ${intentId}...`);
        
        const result = await appService.approvePayment({ userId, intentId });
        
        if (result.status === "EXECUTED") {
          console.log(`✅ Payment executed! TxID: ${result.txid}`);
        } else {
          console.log(`❌ Error: ${result.error}`);
        }
      } else if (command === "pending") {
        const intents = await appService.listPendingIntents(userId);
        
        if (intents.length === 0) {
          console.log("📝 No pending intents");
        } else {
          console.log(`📝 Pending intents (${intents.length}):`);
          intents.forEach(intent => {
            console.log(`   ${intent.id}: ${intent.amount_sats} sats to ${intent.recipient_id} (${intent.created_at.toLocaleString()})`);
          });
        }
      } else if (command === "intents") {
        const intents = await appService.listAllIntents(userId);
        
        if (intents.length === 0) {
          console.log("📝 No intents found");
        } else {
          console.log(`📝 All intents (${intents.length}):`);
          intents.forEach(intent => {
            const status = intent.status === "EXECUTED" ? "✅" : intent.status === "PENDING" ? "⏳" : "❌";
            console.log(`   ${status} ${intent.id}: ${intent.amount_sats} sats to ${intent.recipient_id} - ${intent.status} (${intent.created_at.toLocaleString()})`);
            if (intent.txid) {
              console.log(`      TxID: ${intent.txid}`);
            }
          });
        }
      } else if (command === "policy") {
        const policy = await appService.getPolicyInfo();
        console.log("📋 Policy Information:");
        console.log(`   Max single transaction: ${policy.max_single_tx_sats} sats`);
        console.log(`   Daily spend limit: ${policy.daily_spend_limit_sats} sats`);
        console.log(`   Allowed recipients:`);
        policy.allowed_recipients.forEach(recipient => {
          console.log(`     - ${recipient.id}: ${recipient.address}${recipient.name ? ` (${recipient.name})` : ''}`);
        });
      } else if (command === "spend") {
        const dailySpend = await appService.getDailySpend(userId);
        const policy = await appService.getPolicyInfo();
        console.log(`💰 Daily spend: ${dailySpend} / ${policy.daily_spend_limit_sats} sats`);
      } else {
        // Process as chat message
        console.log("🤖 AI Agent: Processing your request...");
        
        const response = await appService.processChat({ userId, message: input });
        console.log(`🤖 AI Agent: ${response.message}`);
        
        if (response.intent_id) {
          console.log(`💡 Tip: Use 'approve ${response.intent_id}' to execute this payment`);
        }
      }
    } catch (error) {
      console.error("❌ Error:", error);
    }
    
    console.log("");
    prompt();
  });
}

prompt();
