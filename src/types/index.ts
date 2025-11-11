export interface PaymentIntent {
  id: string;
  user_id: string;
  wallet_id: string;
  recipient_id: string;
  amount_sats: number;
  status: "PENDING" | "EXECUTED" | "REJECTED";
  created_at: Date;
  executed_at?: Date;
  note?: string;
  txid?: string;
}

export interface Recipient {
  id: string;
  address: string;
  name?: string;
}

export interface DelegatedPolicy {
  min_single_tx_sats: number;
  max_single_tx_sats: number;
  daily_spend_limit_sats: number;
  allowed_recipients: Recipient[];
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface CreatePaymentIntentRequest {
  amount_sats: number;
  recipient_id: string;
  note?: string;
}

export interface CreatePaymentIntentResponse {
  status: "PENDING" | "DENIED";
  intent_id?: string;
  reason?: string;
}

export interface ApprovePaymentIntentResponse {
  status: "EXECUTED" | "ERROR";
  txid?: string;
  error?: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
}

export interface ChatResponse {
  message: string;
  intent_id?: string;
  status?: string;
}

export interface ApproveRequest {
  userId: string;
  intentId: string;
}

export interface TurnkeyConfig {
  apiBaseUrl: string;
  apiPublicKey: string;
  apiPrivateKey: string;
  defaultOrganizationId: string;
}

export interface DailySpendTracker {
  date: string;
  total_spent_sats: number;
}
