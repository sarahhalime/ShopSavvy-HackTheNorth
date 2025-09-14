const fs = require('fs');
const path = require('path');

// Read the generated keypair
const keypairPath = path.join(__dirname, '..', 'dev-keypair.json');

if (!fs.existsSync(keypairPath)) {
  console.log('❌ No keypair found. Please run: node scripts/generate-keypair.js first');
  process.exit(1);
}

const keypair = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));

// Create .env.local content
const envContent = `# Solana Configuration
RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Merchant Address (where payments are sent)
MERCHANT_SOL_ADDRESS=${keypair.publicKey}
NEXT_PUBLIC_MERCHANT_SOL_ADDRESS=${keypair.publicKey}

# Payer Private Key (for token creation and account management)
PAYER_PRIVATE_KEY=${keypair.secretKey}
`;

// Write .env.local file
fs.writeFileSync(path.join(__dirname, '..', '.env.local'), envContent);

console.log('✅ .env.local file created successfully!');
console.log('🔑 Using keypair:', keypair.publicKey);
console.log('\n🚀 Next Steps:');
console.log('1. Get test SOL from https://faucet.solana.com/');
console.log('2. Run: npm run dev');
console.log('3. Visit http://localhost:3000');
console.log('\n💡 To get SOL:');
console.log(`   - Go to https://faucet.solana.com/`);
console.log(`   - Enter your address: ${keypair.publicKey}`);
console.log(`   - Request 2 SOL (for testing)`);
