import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize Gemini API client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * AI Agent Chat Endpoint
 * Analyzes market state, portfolio risk, and answers user queries
 */
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  const { message, context, conversationHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Format market context for the agent
  const marketSummary = context
    ? `
Current Market Context:
- Trading Day: #${context.day}
- Market Macro Regime: ${context.regime}
- Portfolio Net Worth: $${Number(context.netWorth || 0).toLocaleString()}
- Cash Available: $${Number(context.cash || 0).toLocaleString()}
- Current Active Holdings: ${JSON.stringify(context.holdings || [])}
- Active Campaign Mission: Level ${context.currentMission?.level || 1} - ${context.currentMission?.title || 'Basics'} (${context.currentMission?.description || ''})
- Key Stocks Overview: ${(context.stocks || []).slice(0, 8).map((s: any) => `${s.ticker}: $${s.currentPrice} (PE: ${s.pe}, Beta: ${s.beta})`).join(', ')}
`
    : '';

  const systemInstruction = `
You are "Aura", the resident Master Financial Analyst and AI Trading Mentor in MarketQuest (a stock market learning game).
Your goal is to guide beginner to intermediate players to master stock market fundamentals, technical analysis, risk management, order types (Limit, Stop-Loss), and portfolio diversification.

Guidelines:
1. Ground your advice directly in the game's current market state: Day #${context?.day || 1}, ${context?.regime || 'Bull'} regime, player's net worth, available cash, and current holdings.
2. Emphasize sound financial principles:
   - Cutting losses using Stop-Loss orders.
   - Avoiding over-concentration (>40% in one stock).
   - Recognizing value vs growth through P/E ratios and EPS.
   - Paying attention to news catalysts vs unverified rumors.
   - Accounting for brokerage fees and trading friction.
3. Be friendly, educational, concise, and encourage disciplined thinking. Do not use generic financial jargon without defining it briefly.
4. If the player asks for a trade recommendation, analyze 2-3 specific stocks from the game (e.g., APEX, ATBK, TERA, TITN, SOLR, ARVX) with concrete buy/sell/hold logic, suggested entry/exit levels, and stop-loss floors.
5. End with a constructive, actionable next step for the player.
6. Important: Remind the user that MarketQuest is an educational simulation game.
`;

  try {
    const hasValidKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.length > 5;

    if (!hasValidKey) {
      // Fast intelligent local reasoning engine
      const fallbackResponse = generateLocalAgentResponse(message, context);
      return res.json({ reply: fallbackResponse, source: 'local-engine' });
    }

    const contents = [];

    // Add conversation history if available
    if (Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach((item: { sender: string; text: string }) => {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      });
    }

    // Add current message with market context
    contents.push({
      role: 'user',
      parts: [
        {
          text: `${marketSummary}\n\nUser Question: ${message}`,
        },
      ],
    });

    // Race Gemini call against a 4.5 second timeout
    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 4500);
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);

    if (!response || !response.text) {
      const fallbackResponse = generateLocalAgentResponse(message, context);
      return res.json({ reply: fallbackResponse, source: 'local-fallback' });
    }

    const reply = response.text;
    return res.json({ reply, source: 'gemini' });
  } catch (err: any) {
    console.error('Gemini Agent Error:', err);
    // Graceful fallback to local agent logic if API call fails
    const fallbackResponse = generateLocalAgentResponse(message, context);
    return res.json({
      reply: fallbackResponse,
      source: 'local-fallback',
      notice: 'Operating in local simulation mentor mode.',
    });
  }
});

/**
 * Intelligent Rule-Based Local Fallback Generator
 */
function generateLocalAgentResponse(query: string, context: any): string {
  const q = query.toLowerCase();
  const day = context?.day || 1;
  const regime = context?.regime || 'Bull';
  const cash = context?.cash || 100000;
  const holdings = context?.holdings || [];

  if (q.includes('audit') || q.includes('portfolio') || q.includes('how am i doing')) {
    const totalInvested = holdings.reduce((sum: number, h: any) => sum + (h.averageBuyPrice * h.quantity), 0);
    const sectors = new Set(holdings.map((h: any) => h.sector));
    const diversificationState = sectors.size >= 4 ? 'well diversified across sectors' : 'concentrated; aim for at least 4 sectors';

    return `📊 **Aura's Portfolio Audit (Day #${day} - ${regime} Regime)**:\n\n` +
      `• **Liquidity**: You hold $${cash.toLocaleString()} in liquid cash (${((cash / (cash + totalInvested || 1)) * 100).toFixed(0)}% allocation).\n` +
      `• **Diversification**: You currently hold positions across ${sectors.size} sector(s). Your portfolio is ${diversificationState}.\n` +
      `• **Regime Strategy**: In this **${regime}** market, ${regime === 'Bear' ? 'preserve cash and prefer defensive dividend payers like ATBK or TERA.' : regime === 'Bull' ? 'ride strong trends but set trailing stop-losses to protect profits!' : 'trade range reversals with tight limit orders.'}\n\n` +
      `*Actionable Tip*: Check your orders tab to ensure every open position has an exit stop-loss placed!`;
  }

  if (q.includes('recommend') || q.includes('what should i buy') || q.includes('best stock') || q.includes('trade')) {
    return `🎯 **Aura's Market Recommendations for Day #${day}**:\n\n` +
      `1. **Apex Trust Bank (ATBK)**: Solid value play with P/E of 11.8 and a 3.8% dividend yield. Low beta (0.95) makes it ideal for defensive stability.\n` +
      `2. **Apex Cloud Networks (APEX)**: Momentum growth leader in Enterprise Cloud. If you anticipate sector continuation, place a Buy Limit around 2% below current ask to avoid paying top-of-candle spread.\n` +
      `3. **Terra Foods (TERA)**: Reliable FMCG consumer staple. Minimal volatility makes it an anchor in choppy markets.\n\n` +
      `*Risk Rule*: Always place a Stop-Loss 4-5% below your entry price to limit drawdown!`;
  }

  if (q.includes('mission') || q.includes('level') || q.includes('help')) {
    const mission = context?.currentMission;
    if (mission) {
      return `🧭 **Mission Strategy (Level ${mission.level}: ${mission.title})**:\n\n` +
        `• **Objective**: ${mission.description}\n` +
        `• **Hint**: ${mission.hints?.explanation || 'Focus on following sound risk management rules.'}\n` +
        `• **Recommended Action**: ${mission.hints?.guidedSuggestion || 'Check the market table and execute with proper sizing.'}`;
    }
  }

  if (q.includes('why') && (q.includes('move') || q.includes('fall') || q.includes('drop') || q.includes('jump'))) {
    return `📈 **Why Do Stocks Move in MarketQuest?**\n\n` +
      `Every daily price candle is determined by 5 concrete forces:\n` +
      `1. **Market Effect**: The broad ${regime} trend multiplied by the stock's Beta.\n` +
      `2. **Sector Flow**: Industry-wide capital rotations.\n` +
      `3. **News Catalysts**: Breaking earnings surprises, contracts, or regulatory approvals.\n` +
      `4. **Trend Momentum**: Buying continuation from the prior 3 sessions.\n` +
      `5. **Noise & Liquidity**: Normal daily bid/ask fluctuation.\n\n` +
      `Click the "Why Did It Move?" button on any stock to inspect its exact mathematical percentage breakdown!`;
  }

  return `👋 **Hello! I'm Aura, your MarketQuest AI Trading Analyst.**\n\n` +
    `I can analyze your portfolio risk, suggest stocks based on the current ${regime} regime, explain complex indicators (P/E, Beta, Moving Averages), or help you complete your active campaign missions.\n\n` +
    `Try asking:\n` +
    `• *"Audit my current portfolio"* \n` +
    `• *"What stocks should I trade today?"* \n` +
    `• *"How do I complete my current mission?"* \n` +
    `• *"How does a Stop-Loss order protect my capital?"*`;
}

// Development vs Production Vite handling
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MarketQuest server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
