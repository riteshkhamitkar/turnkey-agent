# AI Agent + Dynamic Wallet Integration + Turnkey Security

A production-ready TypeScript service that implements an AI agent with dynamic wallet discovery and delegated policy access for Ethereum payments using Turnkey's enterprise-grade infrastructure. The AI agent can only **propose** payment intents - all transactions require explicit user approval.

## 🚀 Key Features

- **🤖 AI Agent**: Natural language payment processing using OpenAI GPT-4 with function calling
- **🔐 Enterprise Security**: Real Turnkey SDK integration with hardware-backed key management
- **🏦 Dynamic Wallet Discovery**: Automatically discovers and integrates newly created wallets
- **📋 Delegated Policy System**: Multi-layered security with Turnkey policies + application-level controls
- **✅ User Approval Flow**: Zero auto-execution - every transaction requires explicit user consent
- **🌐 Dual Interface**: Both HTTP API and interactive CLI available
- **🔧 Wallet Management**: Create, list, and approve wallets dynamically via API/CLI
- **🛡️ Production Security**: Hardware-backed signatures, no private key exposure, audit trails

## Architecture

### 🏗️ Dynamic Wallet Architecture
- **Automatic Discovery**: System dynamically discovers all wallets using Turnkey's `getWalletAccounts` API
- **Zero Configuration**: New wallets are immediately available as payment recipients
- **Real-time Updates**: Wallet list refreshes automatically on each payment request
- **Address Resolution**: Ethereum addresses retrieved directly from Turnkey infrastructure
- **No Hardcoding**: Completely eliminates need for manual wallet address mapping

### 🛡️ Multi-Layer Security Model
1. **Turnkey Hardware Security**: Private keys stored in hardware security modules (HSMs)
2. **Hardware-Enforced Amount Limits**: HSM enforces 500-1000 sats per transaction (impossible to bypass)
3. **Address Whitelisting**: Only approved Ethereum addresses can receive payments
4. **Application Policies**: Additional validation layer (1000 sats/tx, 5000 sats/day)
5. **Explicit Approval**: Every transaction requires separate user authorization
6. **Dual Policy Validation**: Hardware + application level enforcement

### 🔄 Payment Intent Flow
1. **Natural Language Input**: "Pay 1000 sats to khush"
2. **Dynamic Discovery**: System discovers all available wallets from Turnkey
3. **AI Processing**: GPT-4 processes request with updated recipient list
4. **Policy Validation**: Multi-layer validation (amount limits, recipient whitelist)
5. **Intent Creation**: Creates PENDING intent with unique ID
6. **User Approval**: Separate explicit approval required
7. **Turnkey Execution**: Hardware-backed transaction signing and broadcast

### 🏢 Service Components
- **TurnkeyService**: Dynamic wallet discovery, account management, hardware-backed transaction signing
- **PolicyService**: Real-time recipient loading, delegated policy enforcement, daily spend tracking
- **PaymentIntentService**: Intent lifecycle management with Turnkey integration
- **AIAgentService**: OpenAI GPT-4 integration with dynamic function calling parameters
- **AppService**: Main orchestration layer with wallet management endpoints

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

# Policy limits (must match Turnkey hardware-enforced limits)
MAX_SINGLE_TX_SATS=1000
DAILY_SPEND_LIMIT_SATS=5000
```

### 3. Setup Hardware-Enforced Policies
Create delegated policies with hardware-enforced amount limits in Turnkey:
```bash
npm run setup-policy
```

This creates policies for all existing wallets with **500-1000 sats** limits enforced at the HSM level:
```
✅ Ritesh Policy created with amount limits: 500-1000 sats
✅ Wallet Policy created with amount limits: 500-1000 sats
✅ khush Policy created with amount limits: 500-1000 sats
✅ anzo Policy created with amount limits: 500-1000 sats
🔒 Turnkey HSM will enforce these limits at the hardware level!
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

## 🎯 Usage Examples

### 🔧 Dynamic Wallet Management

#### Create New Wallet
```bash
# CLI
npm run chat
💬 You: create-wallet alice
✅ Wallet created successfully!
   Name: alice
   ID: 2b4a01d2-ff2b-57f9-a3e1-bcafdebcaafa
   Address: 0x868A0E1E1480f005F0159F1DD341Ad64305D94CD

# HTTP API
curl -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{"walletName": "alice"}'
```

#### List All Wallets
```bash
# CLI
💬 You: wallets
💼 Found 3 wallets:
   1. alice (2b4a01d2-ff2b-57f9-a3e1-bcafdebcaafa)
      Address 1: 0x868A0E1E1480f005F0159F1DD341Ad64305D94CD
   2. anzo (3a36e541-001f-5659-852a-42057796b9a0)
      Address 1: 0xB14518d76C84194FF9A734738edC48A75Ad7154A

# HTTP API
curl http://localhost:3000/wallets
```

### 🤖 AI Agent with Dynamic Recipients

#### CLI Interface
```bash
npm run chat
```

Example session with dynamic wallet discovery:
```
🤖 AI Agent Payment CLI
========================

💬 You: Pay 800 sats to alice
🤖 AI Agent: I've created a payment intent to send 800 sats to alice. Please approve intent pi_123abc to execute the payment.
💡 Tip: Use 'approve pi_123abc' to execute this payment

💬 You: approve pi_123abc
✅ Payment executed! TxID: 0x1a2b3c4d5e6f...

💬 You: create-wallet bob
✅ Wallet created successfully!
   Name: bob
   ID: 4c5d6e7f-8g9h-1i2j-3k4l-5m6n7o8p9q0r
   Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

💬 You: Pay 600 sats to bob
🤖 AI Agent: I've created a payment intent to send 600 sats to bob. Please approve intent pi_456def to execute the payment.

💬 You: Pay 1500 sats to charlie
🤖 AI Agent: I can't create that payment: Amount 1500 sats exceeds maximum allowed (1000 sats). Hardware-enforced limit cannot be bypassed.

💬 You: Pay 200 sats to alice
🤖 AI Agent: I can't create that payment: Amount 200 sats is below minimum allowed (500 sats). Hardware-enforced limit cannot be bypassed.

💬 You: intents
📝 All intents (2):
   ✅ pi_123abc: 800 sats to alice - EXECUTED (11/11/2025, 12:46:00 AM)
      TxID: 0x1a2b3c4d5e6f...
   ⏳ pi_456def: 600 sats to bob - PENDING (11/11/2025, 12:47:15 AM)
```

### HTTP API

#### Chat with AI Agent
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "d7e88495-6840-406d-9de0-834627877531",
    "message": "Send 750 sats to Ritesh"
  }'
```

Response:
```json
{
  "message": "I've created a payment intent to send 750 sats to Ritesh. Please approve intent pi_456def to execute the payment.",
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

#### Wallet Management Endpoints
```bash
# List all wallets
GET /wallets

# Get specific wallet
GET /wallet/{walletId}

# Create new wallet
POST /wallets
{
  "walletName": "alice"
}

# Approve wallet for payments (creates Turnkey policies)
POST /approve-wallet
{
  "walletId": "2b4a01d2-ff2b-57f9-a3e1-bcafdebcaafa"
}
```

#### Payment & Policy Endpoints
```bash
# Get pending intents
GET /intents/pending/{userId}

# Get all intents
GET /intents/{userId}

# Get specific intent
GET /intent/{intentId}

# Get policy info (includes dynamic recipients)
GET /policy

# Get daily spend
GET /daily-spend/{userId}

# Health check
GET /health
```

## Policy Examples

### ✅ Successful Flows (Hardware + App Validation)
- ✅ "Pay 500 sats to Ritesh" → Minimum limit, creates pending intent
- ✅ "Send 750 sats to khush" → Within range, creates pending intent  
- ✅ "Pay 1000 sats to anzo" → Maximum limit, creates pending intent
- ✅ Daily total under 5,000 sats → Allowed by application policy

### ❌ Hardware-Level Policy Violations (Impossible to Bypass)
- ❌ "Pay 1500 sats to Ritesh" → **HSM blocks**: Exceeds hardware limit (1000 sats)
- ❌ "Send 200 sats to khush" → **HSM blocks**: Below hardware minimum (500 sats)
- ❌ "Pay 800 sats to unknown_wallet" → **HSM blocks**: Address not in hardware policy

### ❌ Application-Level Policy Violations
- ❌ Daily total exceeds 5,000 sats → Application daily limit exceeded
- ❌ Unknown recipient not in dynamic discovery → Application validation fails

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

