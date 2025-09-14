const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate a new keypair
const keypair = Keypair.generate();

console.log('🔑 New Keypair Generated:');
console.log('Public Key (use as MERCHANT_SOL_ADDRESS):', keypair.publicKey.toBase58());
console.log('Private Key (base64):', Buffer.from(keypair.secretKey).toString('base64'));

// Save to file
const keypairData = {
  publicKey: keypair.publicKey.toBase58(),
  secretKey: Buffer.from(keypair.secretKey).toString('base64')
};

fs.writeFileSync('dev-keypair.json', JSON.stringify(keypairData, null, 2));
console.log('\n💾 Keypair saved to dev-keypair.json');

console.log('\n📋 Copy these values to your .env.local file:');
console.log('MERCHANT_SOL_ADDRESS=' + keypair.publicKey.toBase58());
console.log('NEXT_PUBLIC_MERCHANT_SOL_ADDRESS=' + keypair.publicKey.toBase58());
console.log('PAYER_PRIVATE_KEY=' + Buffer.from(keypair.secretKey).toString('base64'));

console.log('\n🚀 Next Steps:');
console.log('1. Create .env.local file with the values above');
console.log('2. Get test SOL from https://faucet.solana.com/');
console.log('3. Run: npm run dev');
console.log('4. Visit http://localhost:3000');
