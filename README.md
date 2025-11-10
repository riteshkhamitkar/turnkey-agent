# AI Agent + Delegated Policy + User-Approved Payments

A TypeScript service that implements an AI agent with delegated policy access for Bitcoin payments using Turnkey infrastructure. The AI agent can only **propose** payment intents - all transactions require explicit user approval.

## Features

- **AI Agent**: Natural language payment processing using OpenAI GPT-4
- **Delegated Policy**: Configurable spending limits and recipient whitelisting
- **User Approval Flow**: No auto-execution - every transaction requires explicit approval
- **Turnkey Integration**: Real wallet management and transaction signing
- **Dual Interface**: Both HTTP API and CLI available

## Architecture

### Delegated Policy System
- **Max Single Transaction**: 10,000 sats per transaction
- **Daily Spend Limit**: 50,000 sats per day
- **Allowed Recipients**: Only whitelisted contacts (Ritesh, Alice)
- **Policy Enforcement**: All limits checked before creating payment intents

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
Update `.env` with your credentials:
```env
# OpenAI API Key (required for AI agent functionality)
OPENAI_API_KEY=your_openai_api_key

# Turnkey Configuration (required)
TURNKEY_API_PUBLIC_KEY=your_turnkey_public_key
TURNKEY_API_PRIVATE_KEY=your_turnkey_private_key
TURNKEY_ORGANIZATION_ID=your_turnkey_org_id

# Server port (optional - defaults to 3000)
PORT=3000

# Demo mode settings
DEMO_USER_ID=demo-user
DEMO_WALLET_ID=wallet-1
DEMO_DELEGATE_ID=chatgpt-agent
```

### 3. Build and Run
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

🤖 AI Agent: I can't create that payment: Recipient 'bob' is not in allowed recipients list. Allowed: ritesh, alice

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
    "userId": "demo-user",
    "message": "Send 2000 sats to Alice"
  }'
```

Response:
```json
{
  "message": "I've created a payment intent to send 2000 sats to Alice. Please approve intent pi_456def to execute the payment.",
  "intent_id": "pi_456def",
  "status": "PENDING"
}
```

#### Approve Payment Intent
```bash
curl -X POST http://localhost:3000/approve \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
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
GET /intents/pending/demo-user

# Get all intents
GET /intents/demo-user

# Get specific intent
GET /intent/pi_456def

# Get policy info
GET /policy

# Get daily spend
GET /daily-spend/demo-user

# Health check
GET /health
```

## Policy Examples

### Successful Flows
- ✅ "Pay 1000 sats to Ritesh" → Creates pending intent
- ✅ "Send 5000 sats to Alice" → Creates pending intent
- ✅ Daily total under 50,000 sats → Allowed

### Policy Violations
- ❌ "Pay 15000 sats to Ritesh" → Exceeds single transaction limit (10,000)
- ❌ "Send 1000 sats to Bob" → Unknown recipient (only Ritesh, Alice allowed)
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
2. **In-Memory Storage**: Simple Map-based storage for demo purposes
3. **Policy-First**: All requests validated against policy before intent creation
4. **Explicit Approval**: Separate user action required for all executions
5. **Real Turnkey Integration**: Uses actual Turnkey SDK for wallet operations

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

- API keys are stored in environment variables
- All payment intents require explicit user approval
- Policy limits are enforced at multiple layers
- Transaction signing delegated to Turnkey's secure infrastructure
- No sensitive data logged or exposed in responses
