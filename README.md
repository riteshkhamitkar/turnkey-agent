# AI Agent + Delegated Policy + User-Approved Payments

A TypeScript service that implements an AI agent with delegated policy access for Ethereum payments using Turnkey infrastructure. The AI agent can only **propose** payment intents - all transactions require explicit user approval.

## Features

- **AI Agent**: Natural language payment processing using OpenAI GPT-4
- **Real Turnkey Integration**: Uses actual Turnkey SDK for wallet management and transaction signing
- **Delegated Policy**: Real Turnkey policies for address whitelisting + application-level spending limits
- **User Approval Flow**: No auto-execution - every transaction requires explicit approval
- **Dual Interface**: Both HTTP API and CLI available
- **Production Ready**: No simulations - all transactions signed with real Turnkey infrastructure

## Architecture

### Delegated Policy System
- **Turnkey Policies**: Real address whitelisting (0x150bcf49ee8e2bd9f59e991821de5b74c6d876aa, 0xD3deF33f82a81C4303fE7aa85c5b9D52004161f2)
- **Application Policies**: Max single transaction (10,000 sats), Daily spend limit (50,000 sats)
- **Policy Enforcement**: Turnkey enforces address restrictions, app enforces spending limits
- **Real User ID**: d7e88495-6840-406d-9de0-834627877531
- **Real Wallet ID**: 9a59126f-c904-58b2-80b0-4136c51a0f34

### Payment Intent Flow
1. User sends natural language request: "Pay 1000 sats to Ritesh"
2. AI agent calls `create_payment_intent` tool
3. Policy service validates against limits and recipients
4. If valid: Creates PENDING intent, returns intent_id
5. If invalid: Returns DENIED with reason
6. User must explicitly approve via separate call
7. Approval triggers Turnkey transaction signing

### Components
- **TurnkeyService**: Wallet management and transaction signing
- **PolicyService**: Delegated policy enforcement and daily spend tracking
- **PaymentIntentService**: Intent lifecycle management
- **AIAgentService**: OpenAI integration with function calling
- **AppService**: Main orchestration layer

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your credentials:
```bash
cp .env.example .env
```

Update `.env` with your actual values:
```env
# OpenAI API Key (required for AI agent functionality)
OPENAI_API_KEY=your_openai_api_key_here

# Turnkey Configuration (required - get these from your Turnkey dashboard)
TURNKEY_API_PUBLIC_KEY=your_turnkey_public_key_here
TURNKEY_API_PRIVATE_KEY=your_turnkey_private_key_here
TURNKEY_ORGANIZATION_ID=your_turnkey_organization_id_here

# Server port (optional - defaults to 3000)
PORT=3000

# Real Turnkey IDs (replace with your actual IDs)
REAL_USER_ID=your_turnkey_user_id_here
REAL_WALLET_ID=your_turnkey_wallet_id_here
DELEGATE_ID=chatgpt-agent

# Policy limits (optional - these are the defaults)
MAX_SINGLE_TX_SATS=10000
DAILY_SPEND_LIMIT_SATS=50000
```

### 3. Setup Turnkey Policies
Create the delegated policies in Turnkey:
```bash
npm run setup-policy
```

### 4. Build and Run
```bash
# Build TypeScript
npm run build

# Start HTTP server
npm start

# Or run CLI interface
npm run chat

# Or development mode
npm run dev
```

## Usage Examples

### CLI Interface
```bash
npm run chat
```

Example session:
```
🤖 AI Agent Payment CLI
========================

💬 You: Pay 1000 sats to Ritesh

🤖 AI Agent: I've created a payment intent to send 1000 sats to Ritesh. Please approve intent pi_123abc to execute the payment.
💡 Tip: Use 'approve pi_123abc' to execute this payment

💬 You: approve pi_123abc

✅ Payment executed! TxID: 1a2b3c4d5e6f...

💬 You: Pay 50000 sats to Bob

🤖 AI Agent: I can't create that payment: Recipient 'bob' is not in allowed recipients list. Allowed: ritesh, wallet

💬 You: pending

📝 No pending intents

💬 You: intents

📝 All intents (1):
   ✅ pi_123abc: 1000 sats to ritesh - EXECUTED (11/11/2025, 12:46:00 AM)
      TxID: 1a2b3c4d5e6f...
```

### HTTP API

#### Chat with AI Agent
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "d7e88495-6840-406d-9de0-834627877531",
    "message": "Send 2000 sats to Ritesh"
  }'
```

Response:
```json
{
  "message": "I've created a payment intent to send 2000 sats to Ritesh. Please approve intent pi_456def to execute the payment.",
  "intent_id": "pi_456def",
  "status": "PENDING"
}
```

#### Approve Payment Intent
```bash
curl -X POST http://localhost:3000/approve \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "d7e88495-6840-406d-9de0-834627877531",
    "intentId": "pi_456def"
  }'
```

Response:
```json
{
  "status": "EXECUTED",
  "txid": "7g8h9i0j1k2l..."
}
```

#### Other Endpoints
```bash
# Get pending intents
GET /intents/pending/d7e88495-6840-406d-9de0-834627877531

# Get all intents
GET /intents/d7e88495-6840-406d-9de0-834627877531

# Get specific intent
GET /intent/pi_456def

# Get policy info
GET /policy

# Get daily spend
GET /daily-spend/d7e88495-6840-406d-9de0-834627877531

# Health check
GET /health
```

## Policy Examples

### Successful Flows
- ✅ "Pay 1000 sats to Ritesh" → Creates pending intent
- ✅ "Send 5000 sats to wallet" → Creates pending intent
- ✅ Daily total under 50,000 sats → Allowed

### Policy Violations
- ❌ "Pay 15000 sats to Ritesh" → Exceeds single transaction limit (10,000)
- ❌ "Send 1000 sats to Bob" → Unknown recipient (only Ritesh, wallet allowed)
- ❌ Daily total exceeds 50,000 sats → Daily limit exceeded

## Development

### Project Structure
```
src/
├── types/           # TypeScript type definitions
├── services/        # Core business logic
│   ├── turnkey.service.ts      # Turnkey API wrapper
│   ├── policy.service.ts       # Policy enforcement
│   ├── payment-intent.service.ts # Intent management
│   ├── ai-agent.service.ts     # OpenAI integration
│   └── app.service.ts          # Main orchestration
├── server.ts        # HTTP API server
├── cli.ts          # Command line interface
└── index.ts        # Entry point
```

### Key Design Decisions
1. **No Auto-Execution**: AI agent can only propose, never execute
2. **Real Turnkey Integration**: Uses actual Turnkey SDK and APIs - no simulations
3. **Dual Policy System**: Turnkey policies for address whitelisting + app policies for spending limits
4. **Production Ready**: Real user IDs, wallet IDs, and Ethereum addresses
5. **Explicit Approval**: Separate user action required for all executions

## Next Steps

If I had more time, I would add:

1. **Persistent Storage**: Replace in-memory storage with database
2. **User Authentication**: Proper auth system instead of demo user
3. **Webhook Integration**: Real-time notifications for intent status
4. **Multi-Currency Support**: Beyond just Bitcoin/sats
5. **Advanced Policies**: Time-based limits, recipient-specific limits
6. **Audit Logging**: Complete transaction audit trail
7. **Web Dashboard**: React frontend for intent management
8. **Testing**: Comprehensive unit and integration tests
9. **Monitoring**: Metrics and alerting for production use
10. **Rate Limiting**: API protection and abuse prevention

## Security Notes

- **Real Turnkey Integration**: All transactions signed with production Turnkey infrastructure
- **Environment Variables**: API keys and credentials stored securely in .env (excluded from git)
- **Dual Policy Enforcement**: Turnkey policies + application-level validation
- **Explicit Approval Required**: No auto-execution - every transaction needs user approval
- **Address Whitelisting**: Only pre-approved Ethereum addresses can receive payments
- **Spending Limits**: Configurable per-transaction and daily limits
- **No Sensitive Data Logging**: Credentials and private keys never logged or exposed
