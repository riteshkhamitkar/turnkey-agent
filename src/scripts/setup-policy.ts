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
    
    // Convert sats to Wei for Ethereum (simplified conversion: 1 sat = 1000000000000 wei)
    const minAmountWei = "500000000000000"; // 500 sats in Wei
    const maxAmountWei = "1000000000000000"; // 1000 sats in Wei
    
    // Create policy for Ritesh's address with amount limits
    const riteshPolicy = await turnkeyClient.apiClient().createPolicy({
      policyName: "AI Agent Policy - Ritesh (500-1000 sats) " + Date.now(),
      notes: "AI Agent delegated policy for payments to Ritesh with amount limits: 500-1000 sats",
      effect: "EFFECT_ALLOW",
      consensus: `approvers.any(user, user.id == '${userId}')`,
      condition: `eth.tx.to == '0x150bcf49ee8e2bd9f59e991821de5b74c6d876aa' && eth.tx.value >= ${minAmountWei} && eth.tx.value <= ${maxAmountWei}`
    });

    console.log("✅ Ritesh Policy created with amount limits:");
    console.log("Policy ID:", riteshPolicy.policyId);
    console.log("Amount Range: 500-1000 sats");
    
    // Create policy for wallet address with amount limits
    const walletPolicy = await turnkeyClient.apiClient().createPolicy({
      policyName: "AI Agent Policy - Wallet (500-1000 sats) " + Date.now(),
      notes: "AI Agent delegated policy for payments to demo wallet with amount limits: 500-1000 sats",
      effect: "EFFECT_ALLOW",
      consensus: `approvers.any(user, user.id == '${userId}')`,
      condition: `eth.tx.to == '0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2' && eth.tx.value >= ${minAmountWei} && eth.tx.value <= ${maxAmountWei}`
    });

    console.log("✅ Wallet Policy created with amount limits:");
    console.log("Policy ID:", walletPolicy.policyId);
    console.log("Amount Range: 500-1000 sats");
    
    // Create policies for dynamic wallets (if they exist)
    try {
      const walletsResponse = await turnkeyClient.apiClient().getWallets({
        organizationId: process.env.TURNKEY_ORGANIZATION_ID!
      });
      
      if (walletsResponse.wallets) {
        console.log(`\n🔍 Found ${walletsResponse.wallets.length} wallets, creating policies for dynamic wallets...`);
        
        for (const wallet of walletsResponse.wallets) {
          try {
            const accountsResponse = await turnkeyClient.apiClient().getWalletAccounts({
              walletId: wallet.walletId
            });
            
            if (accountsResponse.accounts && accountsResponse.accounts.length > 0) {
              const address = accountsResponse.accounts[0].address;
              const walletName = wallet.walletName.toLowerCase().replace(/\s+/g, '-');
              
              const dynamicPolicy = await turnkeyClient.apiClient().createPolicy({
                policyName: `AI Agent Policy - ${wallet.walletName} (500-1000 sats) ` + Date.now(),
                notes: `AI Agent delegated policy for payments to ${wallet.walletName} with amount limits: 500-1000 sats`,
                effect: "EFFECT_ALLOW",
                consensus: `approvers.any(user, user.id == '${userId}')`,
                condition: `eth.tx.to == '${address}' && eth.tx.value >= ${minAmountWei} && eth.tx.value <= ${maxAmountWei}`
              });
              
              console.log(`✅ ${wallet.walletName} Policy created:`);
              console.log(`Policy ID: ${dynamicPolicy.policyId}`);
              console.log(`Address: ${address}`);
              console.log("Amount Range: 500-1000 sats");
            }
          } catch (error) {
            console.log(`⚠️ Could not create policy for wallet ${wallet.walletName}:`, error);
          }
        }
      }
    } catch (error) {
      console.log("⚠️ Could not fetch dynamic wallets:", error);
    }
    
    console.log("\n📋 Policy Summary:");
    console.log("- User ID:", userId);
    console.log("- Hardware-Enforced Amount Limits: 500-1000 sats per transaction");
    console.log("- Ritesh Address: 0x150bcf49ee8e2bd9f59e991821de5b74c6d876aa");
    console.log("- Wallet Address: 0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2");
    console.log("- Effect: ALLOW (with amount restrictions)");
    console.log("\n🔒 Turnkey HSM will enforce these limits at the hardware level!");
    console.log("🤖 AI Agent can now propose transactions within 500-1000 sats range!");
    
  } catch (error) {
    console.error("❌ Error creating policies:");
    console.error(error);
  }
}

// Run the function
createDelegatedPolicy();
