import { Turnkey } from "@turnkey/sdk-server";
import dotenv from "dotenv";

dotenv.config();

// Initialize Turnkey client with your real credentials
const turnkeyClient = new Turnkey({
  apiBaseUrl: "https://api.turnkey.com",
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
});

async function createDelegatedPolicy() {
  try {
    // Use the real user ID from your scripts
    const userId = process.env.REAL_USER_ID!; // d7e88495-6840-406d-9de0-834627877531
    
    // Create policy for Ritesh's address
    const riteshPolicy = await turnkeyClient.apiClient().createPolicy({
      policyName: "AI Agent Policy - Ritesh " + Date.now(),
      notes: "AI Agent delegated policy for payments to Ritesh",
      effect: "EFFECT_ALLOW",
      consensus: `approvers.any(user, user.id == '${userId}')`,
      condition: `eth.tx.to == '0x150bcf49ee8e2bd9f59e991821de5b74c6d876aa'` // Ritesh's address from your script
    });

    console.log("✅ Ritesh Policy created:");
    console.log("Policy ID:", riteshPolicy.policyId);
    
    // Create policy for wallet address
    const walletPolicy = await turnkeyClient.apiClient().createPolicy({
      policyName: "AI Agent Policy - Wallet " + Date.now(),
      notes: "AI Agent delegated policy for payments to demo wallet",
      effect: "EFFECT_ALLOW",
      consensus: `approvers.any(user, user.id == '${userId}')`,
      condition: `eth.tx.to == '0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2'` // Wallet address from your script
    });

    console.log("✅ Wallet Policy created:");
    console.log("Policy ID:", walletPolicy.policyId);
    
    console.log("\n📋 Policy Summary:");
    console.log("- User ID:", userId);
    console.log("- Ritesh Address: 0x150bcf49ee8e2bd9f59e991821de5b74c6d876aa");
    console.log("- Wallet Address: 0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2");
    console.log("- Effect: ALLOW");
    console.log("\n🤖 AI Agent can now propose transactions to these addresses!");
    
  } catch (error) {
    console.error("❌ Error creating policies:");
    console.error(error);
  }
}

// Run the function
createDelegatedPolicy();
