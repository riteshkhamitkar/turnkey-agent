import { DelegatedPolicy, PolicyCheckResult, Recipient, DailySpendTracker } from "../types";

export class PolicyService {
  private policy: DelegatedPolicy;
  private dailySpendTracker: Map<string, DailySpendTracker> = new Map();

  constructor() {
    // Initialize with real policy using actual addresses
    this.policy = {
      max_single_tx_sats: parseInt(process.env.MAX_SINGLE_TX_SATS || "10000"),
      daily_spend_limit_sats: parseInt(process.env.DAILY_SPEND_LIMIT_SATS || "50000"),
      allowed_recipients: [
        { 
          id: "ritesh", 
          address: "0x150bcf49ee8e2bd9f59e991821de5b74c6d876aa", // From your create-policy.js
          name: "Ritesh" 
        },
        { 
          id: "wallet", 
          address: "0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2", // From your sign-transaction.js
          name: "Demo Wallet" 
        }
      ]
    };
  }

  checkPolicy(userId: string, recipientId: string, amountSats: number): PolicyCheckResult {
    // Check if amount exceeds single transaction limit
    if (amountSats > this.policy.max_single_tx_sats) {
      return {
        allowed: false,
        reason: `Amount ${amountSats} sats exceeds maximum single transaction limit of ${this.policy.max_single_tx_sats} sats`
      };
    }

    // Check if recipient is allowed
    const recipient = this.policy.allowed_recipients.find(r => r.id === recipientId);
    if (!recipient) {
      const allowedIds = this.policy.allowed_recipients.map(r => r.id).join(", ");
      return {
        allowed: false,
        reason: `Recipient '${recipientId}' is not in allowed recipients list. Allowed: ${allowedIds}`
      };
    }

    // Check daily spend limit
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `${userId}-${today}`;
    const dailySpend = this.dailySpendTracker.get(dailyKey) || { date: today, total_spent_sats: 0 };
    
    if (dailySpend.total_spent_sats + amountSats > this.policy.daily_spend_limit_sats) {
      return {
        allowed: false,
        reason: `Daily spend limit exceeded. Current: ${dailySpend.total_spent_sats} sats, Requested: ${amountSats} sats, Limit: ${this.policy.daily_spend_limit_sats} sats`
      };
    }

    return { allowed: true };
  }

  updateDailySpend(userId: string, amountSats: number): void {
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `${userId}-${today}`;
    const dailySpend = this.dailySpendTracker.get(dailyKey) || { date: today, total_spent_sats: 0 };
    
    dailySpend.total_spent_sats += amountSats;
    this.dailySpendTracker.set(dailyKey, dailySpend);
  }

  getRecipientAddress(recipientId: string): string | null {
    const recipient = this.policy.allowed_recipients.find(r => r.id === recipientId);
    return recipient ? recipient.address : null;
  }

  getPolicy(): DelegatedPolicy {
    return { ...this.policy };
  }

  getDailySpend(userId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `${userId}-${today}`;
    const dailySpend = this.dailySpendTracker.get(dailyKey);
    return dailySpend ? dailySpend.total_spent_sats : 0;
  }
}
