# MarketQuest – Stock Market Learning Game

> **An interactive, explainable stock market trading simulation and educational game.**  
> Learn equities, order types, risk management, diversification, and market analysis with zero real-world financial risk.
>
> **Made by Dev Bhati**

---

## 🚀 Overview

MarketQuest mimics real market behavior using a clear, explainable multi-factor engine:
- **Daily Price Movement**: Combines Market Index drift ($\times \text{Beta}$), Sector rotations, News catalysts, Trend momentum, and Random noise.
- **Circuit Breakers**: $\pm 10\%$ daily limits that pause excessive panic or euphoria.
- **Trading Costs**: Realistic brokerage fees and transaction taxes to illustrate fee drag.
- **Order Types**: Market Orders, Limit Orders, Stop-Loss Orders, and Take-Profit Target Orders.
- **AI Agent "Aura"**: Contextual AI trading mentor that audits your portfolio risk, recommends strategies, and explains market concepts.
- **Virtual Funds**: Deposit and top up virtual capital at any time.

---

## 🎮 Game Modes & Curriculum

1. **Learning Mode (Campaign)**: 10 structured levels with missions, 4-tier hints, and concept quizzes:
   - Level 1: What is a Stock? (Fractional ownership & equities)
   - Level 2: Price Movement & News (Earnings catalysts vs rumors)
   - Level 3: Profit and Loss (Realized vs unrealized gains)
   - Level 4: Reading Charts (Candlesticks, trends & 20-day SMA)
   - Level 5: Fundamentals & Valuation (P/E ratio, EPS, Fair value)
   - Level 6: Diversification (Spreading capital across 4+ sectors)
   - Level 7: Risk Management (Protective Stop-Loss execution)
   - Level 8: Advanced Orders (Limit orders & avoiding slippage)
   - Level 9: Market Regimes (Navigating Bear markets & capital preservation)
   - Level 10: Master Strategy (Alpha generation & outperforming the index)
2. **Free Play (Sandbox)**: Unrestricted trading with customizable starting capital.
3. **Challenge Mode**: Historical scenarios (*The Great Crash Defense*, *Tech Super-Cycle Bull Run*, *Earnings Season Gauntlet*).

---

## 📦 How to Run Locally

### Prerequisites
- Node.js 18+ or 20+
- npm

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/marketquest.git
cd marketquest

# 2. Install dependencies
npm install

# 3. Start development server (Express + Vite)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🌐 How to Host on GitHub Pages

This project is configured out-of-the-box for **GitHub Pages**:
- `vite.config.ts` includes `base: './'` for relative path resolution.
- An automated GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.
- The AI Agent ("Aura") features a dual-engine architecture: it calls the Express Gemini server in full-stack mode, and gracefully transitions to the built-in offline simulation intelligence when hosted statically on GitHub Pages.

### Setup GitHub Pages in 2 Clicks:
1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Initial MarketQuest release"
   git push origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. That's it! GitHub will automatically trigger the workflow in `.github/workflows/deploy.yml`, build the application, and publish your live game at:
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API
- **Backend / AI**: Express, tsx, `@google/genai` (Gemini 3.8 Flash)
- **Tooling**: Vite 8, ESLint, TypeScript compiler

---

## 📜 Disclaimer

*This is an educational simulation. It does not provide real financial or investment advice, and virtual simulation results do not guarantee real-world results.*

---

**Made by Dev Bhati**
