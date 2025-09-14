const fs = require('fs');
const path = require('path');

// Your new wallet address
const newWalletAddress = '6UCG17H1umjFhjponngVVehXMBmcpkvPm1SQNk2u829n';

// Create .env.local content with the new wallet
const envContent = `# Solana Configuration
RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Merchant Address (where payments are sent)
MERCHANT_SOL_ADDRESS=${newWalletAddress}
NEXT_PUBLIC_MERCHANT_SOL_ADDRESS=${newWalletAddress}

# Payer Private Key (for token creation and account management)
# Note: This is the private key for the wallet above
# You'll need to provide this if you want to create tokens
PAYER_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
`;

// Write .env.local file
fs.writeFileSync(path.join(__dirname, '..', '.env.local'), envContent);

console.log('✅ .env.local updated with new wallet address!');
console.log('🔑 Using wallet:', newWalletAddress);
console.log('\n🚀 Next Steps:');
console.log('1. Get test SOL from https://faucet.solana.com/');
console.log(`   Enter address: ${newWalletAddress}`);
console.log('2. If you want to create tokens, you need the private key for this wallet');
console.log('3. Run: npm run dev');
console.log('4. Visit http://localhost:3000');
