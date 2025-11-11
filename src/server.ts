import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppService } from "./services/app.service";
import { TurnkeyConfig } from "./types";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const turnkeyConfig: TurnkeyConfig = {
  apiBaseUrl: "https://api.turnkey.com",
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
};

const openaiApiKey = process.env.OPENAI_API_KEY!;
const appService = new AppService(turnkeyConfig, openaiApiKey);

// Log the real user ID being used
console.log(`🔑 Using real Turnkey User ID: ${process.env.REAL_USER_ID}`);
console.log(`💼 Using real Turnkey Wallet ID: ${process.env.REAL_WALLET_ID}`);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Chat endpoint - processes natural language requests
app.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: "userId and message are required" });
    }

    const response = await appService.processChat({ userId, message });
    res.json(response);
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve payment intent endpoint
app.post("/approve", async (req, res) => {
  try {
    const { userId, intentId } = req.body;
    
    if (!userId || !intentId) {
      return res.status(400).json({ error: "userId and intentId are required" });
    }

    const response = await appService.approvePayment({ userId, intentId });
    res.json(response);
  } catch (error) {
    console.error("Error in /approve endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get pending intents for a user
app.get("/intents/pending/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const intents = await appService.listPendingIntents(userId);
    res.json({ intents });
  } catch (error) {
    console.error("Error in /intents/pending endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all intents for a user
app.get("/intents/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const intents = await appService.listAllIntents(userId);
    res.json({ intents });
  } catch (error) {
    console.error("Error in /intents endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific intent
app.get("/intent/:intentId", async (req, res) => {
  try {
    const { intentId } = req.params;
    const intent = await appService.getIntent(intentId);
    
    if (!intent) {
      return res.status(404).json({ error: "Intent not found" });
    }
    
    res.json({ intent });
  } catch (error) {
    console.error("Error in /intent endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get policy information
app.get("/policy", async (req, res) => {
  try {
    const policy = await appService.getPolicyInfo();
    res.json({ policy });
  } catch (error) {
    console.error("Error in /policy endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get daily spend for a user
app.get("/daily-spend/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const dailySpend = await appService.getDailySpend(userId);
    res.json({ userId, dailySpend });
  } catch (error) {
    console.error("Error in /daily-spend endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Wallet management endpoints
app.get("/wallets", async (req, res) => {
  try {
    const wallets = await appService.listWallets();
    res.json(wallets);
  } catch (error) {
    console.error("Error in /wallets endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/wallet/:walletId", async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await appService.getWallet(walletId);
    res.json(wallet);
  } catch (error) {
    console.error("Error in /wallet endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/wallet", async (req, res) => {
  try {
    const { walletName } = req.body;
    
    if (!walletName) {
      return res.status(400).json({ error: "walletName is required" });
    }

    const wallet = await appService.createWallet(walletName);
    res.json(wallet);
  } catch (error) {
    console.error("Error in /wallet creation endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/approve-wallet/:walletId", async (req, res) => {
  try {
    const { walletId } = req.params;
    
    const result = await appService.approveWalletForPayments(walletId);
    res.json(result);
  } catch (error) {
    console.error("Error in /approve-wallet endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 AI Agent Payment Service running on port ${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /chat - Chat with AI agent`);
  console.log(`   POST /approve - Approve payment intent`);
  console.log(`   GET /intents/pending/:userId - Get pending intents`);
  console.log(`   GET /intents/:userId - Get all intents`);
  console.log(`   GET /intent/:intentId - Get specific intent`);
  console.log(`   GET /policy - Get policy information`);
  console.log(`   GET /daily-spend/:userId - Get daily spend`);
  console.log(`   GET /wallets - List all wallets`);
  console.log(`   GET /wallet/:walletId - Get specific wallet`);
  console.log(`   POST /wallet - Create new wallet`);
  console.log(`   POST /approve-wallet/:walletId - Approve wallet for payments`);
  console.log(`   GET /health - Health check`);
});
