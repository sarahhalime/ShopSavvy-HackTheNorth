✨Inspiration

In today’s world, everything moves fast, yet online shopping can still feel slow and overwhelming. We wanted to imagine a future where buying what you need feels as simple as describing it in your own words and paying instantly, without barriers. Inspired by the rise of AI, cryptocurrency, and seamless digital experiences, we set out to combine these elements into a single platform that redefines convenience. Our vision is to build the foundation of next-generation shopping where AI understands your shopping struggles, shopping addictions (Lean on our AI Financial insights), payments are instant, and rewards come naturally.

🔮 What it does

  🛍️ Natural-language shopping: Search Shopify products with prompts (e.g., “waterproof backpack under $80”).

  🛒 Streamlined flow: Compare → add to cart → checkout in seconds.

  ⚡ Crypto checkout: One-tap Solana Pay with server-side verification.

  🎁 ETH rewards: Configurable win chance (default 30%), test widget, and success animations.

  🤖 Financial insights: AI surfaces up to 4 clear, actionable tips with refresh.

  💬 AI coach chat: Context-aware, short, human-like replies to guide spending habits.

  📊 Analytics dashboard: See spending trends, category breakdowns, payment mix, and habits.

  📂 History + Profile: Normalized transaction data, polished receipts upload, and user profile view.

🏗️ How we built it

We integrated OpenAI to transform prompts into structured queries, Google Gemini for generating personalized financial insights, and the Shopify Storefront API for real-time product data.

  Frontend: Next.js App Router + React 18, Tailwind v4 (OKLCH tokens), shadcn/Radix UI, lucide-react icons, Recharts for charts.

  State/Infra: Zustand for cart + feature flags, clean dashboard tabs/topbar. AI Layer:

  /api/ai/insights → normalizes order data with Zod, computes breakdowns, synthesizes Gemini JSON for recommendations

  /api/ai/response→ proxies chat requests to Gemini for financial struggles

  Payments: /api/checkout/create → builds Solana Pay URLs (SOL/USDC).

  /api/checkout/verify → confirms transactions + returns details.

  /api/checkout/verify-ethereum → runs ETH reward logic + returns win state + mock tx hash.

  Data + Tooling: Shopify crawlers (bulk + fast), DynamoDB helpers to get and inspect products.

🧗 Challenges

  ⚠️ Wallet/browser quirks with redirects + signature flows (for ex., Phantom).

  🔄 Normalizing messy order data (cents vs. dollars, ISO dates, missing qty).

  🧩 Rapid iteration → JSX/import mismatches we hardened.

  ⏱️ AI latency vs UX → solved with server-side synthesis + strict fallback so the UI never blocks.

🏆 Accomplishments

  ✅ Full loop from intent → results → instant payment → verified order → insights/rewards.

  ⚡ Real-time crypto checkout with a polished, friendly success flow.

  🎁 ETH rewards that feel fun + fair (configurable odds, transparent logs).

  🤝 Humanized AI with greetings + actionable insights.

We’re proud that we pulled together AI, blockchain, and e-commerce into one working platform in such a short time. Getting Solana Pay and Ethereum to work smoothly, delivering AI-powered financial insights, and creating a truly convenient shopping experience all stand out as highlights.

📚 What we learned

We learned how to communicate better under pressure, split up responsibilities, and lean on each other’s strengths. On top of the technical lessons, the late nights spent solving problems side by side reminded us why we love building. This hackathon wasn’t just about the code, it was about teamwork and growth.

🚀 What’s next for ShopSavvy

We believe shopping should feel like one click, one conversation, one seamless experience. Looking ahead, we want to polish the UI, expand our financial insights with predictive analytics, and scale payments to more crypto options. More than anything, this project gave us the motivation to keep innovating and striving to shape the future of commerce.

🔧 Try it yourself

1. Create a '.env.local' AWS / DynamoDB AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION=us-east-1 DYNAMODB_TABLE_NAME=Shopify-warehouse

  AI (Gemini & OpenAI) AI_PROVIDER=gemini GEMINI_API_KEY=YOUR_GEMINI_API_KEY OPENAI_API_KEY=YOUR_OPENAI_API_KEY

  Solana RPC_URL=https://api.devnet.solana.com NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com MERCHANT_SOL_ADDRESS=YOUR_SOLANA_MERCHANT_PUBLIC_KEY       
  NEXT_PUBLIC_MERCHANT_SOL_ADDRESS=YOUR_SOLANA_MERCHANT_PUBLIC_KEY Accepts base64/base58/JSON array (see scripts/generate-keypair.js) PAYER_PRIVATE_KEY=YOUR_SOLANA_PRIVATE_KEY

  Demo ETH Rewards (optional) ETH_REWARD_WIN_CHANCE=0.3

Built With:

amazon-dynamodb, css, eth, googlegemini-api, javascript, next.js, node.js, openai-api, react, shopify-api, solana-pay, tailwindcss, typescript
