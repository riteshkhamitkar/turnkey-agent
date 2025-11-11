import { DelegatedPolicy, PolicyCheckResult, Recipient, DailySpendTracker } from "../types";
import { TurnkeyService } from "./turnkey.service";

export class PolicyService {
  private policy: DelegatedPolicy;
  private dailySpendTracker: Map<string, DailySpendTracker> = new Map();
  private turnkeyService?: TurnkeyService;

  constructor(turnkeyService?: TurnkeyService) {
    this.turnkeyService = turnkeyService;
    
    // Initialize with base policy - recipients will be loaded dynamically from Turnkey
    this.policy = {
      min_single_tx_sats: parseInt(process.env.MIN_SINGLE_TX_SATS || "500"), // Match Turnkey minimum policy limit
      max_single_tx_sats: parseInt(process.env.MAX_SINGLE_TX_SATS || "1000"), // Match Turnkey policy limit
      daily_spend_limit_sats: parseInt(process.env.DAILY_SPEND_LIMIT_SATS || "5000"), // Conservative daily limit
      allowed_recipients: [] // Will be populated dynamically from Turnkey wallets
    };
  }

  async loadDynamicRecipients() {
    if (!this.turnkeyService) return;
    
    try {
      const walletsResponse = await this.turnkeyService.listWallets();
      
      if (walletsResponse.wallets) {
        const dynamicRecipients: Recipient[] = [];
        
        walletsResponse.wallets.forEach((wallet: any) => {
          if (wallet.accounts && wallet.accounts.length > 0) {
            const walletName = wallet.walletName.toLowerCase().replace(/\s+/g, '-');
            dynamicRecipients.push({
              id: walletName,
              address: wallet.accounts[0].address,
              name: wallet.walletName
            });
          }
        });
        
        // Set recipients to all discovered wallets from Turnkey
        this.policy.allowed_recipients = dynamicRecipients;
      }
    } catch (error) {
      console.error("Error loading dynamic recipients:", error);
    }
  }

  async checkPolicy(userId: string, recipientId: string, amountSats: number): Promise<PolicyCheckResult> {
    // Load dynamic recipients first
    await this.loadDynamicRecipients();
    
    // Check if amount is below minimum limit (matches Turnkey hardware policy)
    if (amountSats < this.policy.min_single_tx_sats) {
      return {
        allowed: false,
        reason: `Amount ${amountSats} sats is below minimum single transaction limit of ${this.policy.min_single_tx_sats} sats. Hardware-enforced limit cannot be bypassed.`
      };
    }
    
    // Check if amount exceeds single transaction limit
    if (amountSats > this.policy.max_single_tx_sats) {
      return {
        allowed: false,
        reason: `Amount ${amountSats} sats exceeds maximum single transaction limit of ${this.policy.max_single_tx_sats} sats. Hardware-enforced limit cannot be bypassed.`
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

  async getPolicy(): Promise<DelegatedPolicy> {
    await this.loadDynamicRecipients();
    return { ...this.policy };
  }

  getDailySpend(userId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `${userId}-${today}`;
    const dailySpend = this.dailySpendTracker.get(dailyKey);
    return dailySpend ? dailySpend.total_spent_sats : 0;
  }
}
