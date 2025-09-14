# ETH Reward Contract Deployment Guide

This directory contains a simple ETH reward smart contract that gives users free ETH using Chainlink VRF for randomness when they make purchases during ETH events.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd contracts
npm install
```

### 2. Setup Environment

Create a `.env` file in the contracts directory:

```bash
# Ethereum Sepolia Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# Chainlink VRF Configuration
CHAINLINK_SUBSCRIPTION_ID=your_subscription_id_here
```

### 3. Get Chainlink VRF Subscription

1. Go to [vrf.chain.link](https://vrf.chain.link)
2. Connect your wallet
3. Create a new subscription on Sepolia testnet
4. Fund it with LINK tokens (get from [faucets.chain.link](https://faucets.chain.link))
5. Copy the subscription ID

### 4. Deploy Contract

```bash
npm run deploy
```

### 5. Update Frontend Config

Copy the deployed contract address to your main project's `.env.local`:

```bash
NEXT_PUBLIC_ETH_REWARD_CONTRACT=0xYourContractAddress
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## 📋 Contract Features

### ✨ Simple & Effective

- **30% chance** to win ETH on each purchase
- **0.001 - 0.01 ETH** reward range
- **Chainlink VRF** for true randomness
- **Instant claiming** of rewards
- **Owner-funded** reward pool

### 🎯 How It Works

1. User makes a purchase during ETH event
2. Contract requests random number from Chainlink
3. 30% chance to win based on randomness
4. Reward amount varies (1-5x multiplier)
5. User can claim pending rewards anytime

### 🛠 Contract Functions

- `processPurchaseReward()` - Process purchase and check for reward
- `claimReward()` - Claim pending ETH rewards
- `depositRewards()` - Owner deposits ETH for rewards
- `getPendingReward()` - Check user's pending rewards

## 🧪 Testing

### Local Testing

```bash
# Compile contracts
npm run compile

# Run tests (if you create them)
npm run test
```

### Frontend Integration

The contract automatically integrates with your frontend:

1. **Checkout Success** - Triggers reward processing
2. **ETH Demo Page** - Test reward functionality
3. **Dashboard** - View and claim rewards
4. **Animations** - Celebrates wins with ETH animations

## 📊 Contract Stats

- **Network**: Ethereum Sepolia Testnet
- **Gas Optimization**: Simple design for low costs
- **Security**: Owner-only funding, safe transfers
- **Randomness**: Chainlink VRF for fairness

## 🚨 Important Notes

### For Production:

1. **Fund the contract** with ETH for rewards
2. **Add your contract** as a VRF consumer
3. **Test thoroughly** on testnet first
4. **Monitor gas costs** for user transactions
5. **Set reasonable** reward limits

### Security:

- Contract owner can withdraw funds
- Users can only claim their own rewards
- Chainlink VRF prevents manipulation
- Simple design reduces attack surface

## 🎮 Demo Usage

Once deployed, users can:

1. **Make purchases** and get 30% chance for ETH
2. **View pending rewards** in the dashboard
3. **Claim rewards** with one click
4. **See celebrations** with ETH animations
5. **Test anytime** with the demo button

## 💡 Customization

Edit `EthRewardContract.sol` to change:

- `REWARD_CHANCE` - Currently 30%
- `MIN_REWARD` - Currently 0.001 ETH
- `MAX_REWARD` - Currently 0.01 ETH
- Reward calculation logic

## 🔗 Useful Links

- [Chainlink VRF Docs](https://docs.chain.link/vrf/v2/introduction)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [LINK Faucet](https://faucets.chain.link/)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)

## 🎉 That's It!

Your ETH reward system is now live! Users will see beautiful animations and win real ETH when making purchases. The system is simple, secure, and powered by Chainlink's proven randomness.
