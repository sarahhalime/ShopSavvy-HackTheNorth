# HackTheNorth

Project name

ShopSavvy (Solana Edition) — “Search smarter, pay faster, spend wiser.”

1) Core user flow (end-to-end)

Search: User types “waterproof laptop backpack under $80.”

AI → Shopify: Your assistant converts that into structured filters (price, tags, materials) and queries Shopify.

Results UI: Ranked, de-duplicated products with quick compare; user adds to cart.

Pay: Checkout launches Solana Pay (QR or deep-link).

Confirm: Backend verifies on-chain tx signature, confirms order, triggers Shopify fulfillment.

History & Insights: Purchases auto-categorized; user sees spend by category, streaks, and actionable feedback (“You’ve spent $120 on coffee gear this month—want a 5% cashback on reusable filters?”).

2) Prize mapping (why this wins multiple tracks)

Shopify – Hack Shopping with AI: AI-guided discovery + Shopify APIs + Polaris UI.

Solana – Best Consumer Payment Experience: Seamless Solana Pay checkout + Token-2022 features (optional streaming/subscriptions, programmable cashback).

ETHGlobal – Infinite Garden (optional add-on): Mirror receipts to an L2 contract for verifiable purchase NFTs or cross-chain rewards.

Cohere / Gemini / Rox:

Cohere: product search rewriter + reranker.

Gemini: “budget snapshot” summaries + explainers.

Rox: agent to clean messy receipts/bank CSVs and reconcile with orders.

Cloudflare Workers AI: edge classification/fraud checks on tx callbacks.

Auth0: secure login.

MongoDB Atlas: purchase history + categories.

Databricks (stretch): anonymized cohort analytics (“top converted attributes for backpacks”).

VAPI (voice) (1-hour add): “Find me a 15-inch sleeve under $30.”

Graphite / Warp / Windsurf: showcase dev practices (incremental PRs, CLI to test flows, AI-assisted IDE).

3) Architecture (minimal but solid)

Frontend: Next.js + Shopify Polaris

Product search UI, compare view, cart, checkout (Solana Pay button), insights dashboard.

AI Service (small Node service)

/ai/search: turns natural language → Shopify query (vendor/price/tags).

/ai/rank: reranks results (Cohere re-rank or embeddings).

/ai/insights: turns spending JSON → Gemini summary (“3-bullet monthly snapshot”).

Commerce Service (Node/Cloudflare Worker)

/shopify/search: calls Storefront API (GraphQL).

/checkout/create: creates order draft; awaits payment signature.

/solana/verify: receives signature from client, verifies on-chain, finalizes order via Admin API.

On-chain

Solana Pay flow: client constructs tx → wallet signs → send signature to backend.

Optional SPL Reward Token (cashback) or Token-2022 features for subscriptions.

Optional ETH L2 contract to mint receipt NFTs/cross-chain reward claims.

Data

MongoDB: Users, Orders, LineItems, Categories, Wallets, RewardLedger.

Minimal PII; store wallet + Shopify customer ID.

4) Data models (quick schemas)
User { _id, auth0Id, shopifyCustomerId, solanaAddress, createdAt }
Order { _id, userId, shopifyOrderId, solanaSig, totalCents, items:[{sku, title, qty, priceCents, category}], ts }
CategoryRule { key:"backpack", includes:["bag","backpack"], exclude:["handbag"], budgetTag:"School" }
RewardLedger { userId, amount, tokenMint, reason, ts }

5) Solana Pay integration (MVP)

Client: build a payment request (amount, merchant address, reference).

Wallet signs & submits, returns tx signature.

Backend: getSignatureStatus(signature) → confirm, then call Shopify Admin API to capture/fulfill.

Store signature + purchase in MongoDB.

(Stretch) Cashback: issue SPL token or ledger credit on success.

6) AI prompts (copy-paste)

Search rewrite (Cohere/Gemini):

“Rewrite the user query into Shopify filters. Output JSON with: keywords[], priceMin, priceMax, mustHaveTags[], excludeTags[], materials[].”

Rerank:

“Given user intent JSON and product list (title, tags, price, rating), return sorted IDs by match quality.”

Insights (Gemini):

“Given past 30-day purchases with {category, amount, vendor}, produce: (a) 3 bullet insights, (b) 1 suggested budget rule, (c) 1 savings tip.”

Rox Agent:

“Given a noisy CSV/PDF of purchases + Shopify orders, reconcile and label categories; return normalized records with confidence score.”

7) 36-hour build plan

T0–6h (MVP spine)

Next.js + Auth0 sign-in

Shopify Storefront search (GraphQL)

Simple AI rewrite → query → results list

Cart + Solana Pay button (testnet devnet)

Backend verifies signature + logs order (no fulfillment yet)

T6–14h (Commerce complete)

Shopify Admin order creation on verified payment

Purchase history page + naive categorizer (keyword rules)

Insights v1 (static summaries)

T14–24h (AI + polish)

Cohere rerank

Gemini “budget snapshot”

Basic reward ledger (no token)

Clean, fast UI (Polaris) + empty-state messages

T24–32h (Wow features)

Optional SPL cashback issuance

Cloudflare Worker for edge verify endpoint

Voice (VAPI) search

Quick DevEx touches (Warp CLI to run shopsavvy pay --test)

T32–36h (Demo)

Seed data + scripts

90-second demo path rehearsed

Screenshots + README with prize-tie bullets

8) Demo script (90 seconds)

Type natural query → see curated, labeled products (Cohere rerank).

Add to cart → Solana Pay pops → scan/pay → instant order confirmation.

History updates live; Gemini shows “3-bullet” monthly snapshot.

(Stretch) Cashback balance + one-tap redeem on next purchase.

9) What makes it unique (your angle)

AI → Commerce loop that’s actionable, not just chat: NL → filters → buy now.

On-chain payment finality tied to real Shopify fulfillment.

Financial coaching from real purchase data (cleaned by a messy-data agent).

Optional cross-chain receipts/rewards if you add ETH L2.

10) Risk & cut-scope

If Shopify Admin capture is slow, simulate fulfillment and log as “fulfilled (demo).”

If SPL token is tricky, ledger-only cashback in v1.

Keep AI costs low: cache search rewrites and reranks.

If you want, I’ll generate:

A Remix/Next.js starter with Polaris + Auth0 wired,

Node/Workers sample endpoints (/ai/search, /shopify/search, /solana/verify), and

A minimal Solana Pay client snippet you can drop in.

I hear you — right now your Shopping Assistant idea already ties into Shopify + Solana Pay + AI feedback, but at a hackathon like Hack the North where hundreds of teams will try “AI shopping assistants”, you want yours to stand out as unlike any other demo in the room.

Let’s analyze and then “turn the dial up” on uniqueness.

🔎 What’s Common vs What’s Unique

✅ Common (lots of teams will do this):

AI product search (Cohere/Gemini)

Solana Pay checkout integration

Basic spending history charts

🚀 Less common (what you already add):

Financial categorization & advice

Shopify ecosystem integration

🌟 Potentially unique (if you add these twists):

Cross-chain receipts & ownership → every purchase mints a “receipt NFT” on Ethereum L2 that proves you own the item (bridges Solana + ETH).

Messy real-world input → user uploads a screenshot of a physical receipt or CSV → Rox/AI cleans it → reconciles with on-chain purchases.

Personal Digital Twin Shopper → each student gets a persistent AI “agent” wallet that learns your taste and negotiates/categorizes on your behalf.

AR/Voice overlay → Snap Spectacles integration (“point at your empty fridge → AI suggests items → Shopify fetch → pay with Solana in AR”).

Programmable Rewards Token → not just cashback: token can be used for:

unlocking student discounts,

redeeming for group goals (e.g., clubs pooling for gear),

staking for predictive discounts (“if you keep buying local, you get a lower subscription fee”).

💡 The More Unique Spin

"ShopSavvy Twin" — Your AI + Blockchain Student Shopper

AI → Shopify: Conversational search & ranking.

Solana Pay: Fast checkout + cashback issuance.

Ethereum L2: Mints “receipt NFTs” (verifiable proof-of-purchase).

Rox Agent: Handles noisy/real-life data (screenshots, PDFs, CSVs).

Gemini/Cohere: Summarizes spending into clear “life insights.”

AR/Voice layer: Snap or VAPI lets you shop via fridge scan or voice.

Digital Twin: AI agent wallet that remembers your history and negotiates with merchants/filters deals.

⚡ Why This Is Unique

It’s not just “an AI shopping assistant.”

It’s a personal on-chain finance + commerce identity that’s:

Multi-modal (voice, AR, natural language)

Cross-chain (Solana Pay for payments, ETH L2 for receipts/rewards)

Multi-agent (Rox agent for data wrangling, Cohere/Gemini for insight)

And most importantly → it’s practical + futuristic. Judges love when a project feels like the future of student life.

🏆 Prize Coverage (with this twist)

Shopify → AI commerce integration.

Solana → checkout + programmable cashback.

ETHGlobal → receipt NFTs / smart contract logging.

Rox / Cohere / Gemini → AI agents (messy receipts, insights).

Snap / VAPI → AR or voice-powered shopping.

Ripple → DID for verified student discounts.

Auth0 / Cloudflare / MongoDB / Databricks → infra + analytics.

YC Unicorn Prize → pitch as “Stripe + Mint + AI Twin for Students.”

✨ In short: You already have a solid backbone. To make it really unique, lean into one of these extensions:

Cross-chain NFT receipts (Ethereum L2 + Solana Pay bridge).

Personal AI Digital Twin Shopper (an agent that learns your tastes).

AR/Voice shopping (turns it into an experience, not just a dashboard).
