const { Connection, PublicKey } = require('@solana/web3.js');

async function checkBalance() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const publicKey = new PublicKey('6UCG17H1umjFhjponngVVehXMBmcpkvPm1SQNk2u829n');
  
  try {
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1000000000; // Convert lamports to SOL
    
    console.log('🔍 Checking balance for:', publicKey.toBase58());
    console.log('💰 Current balance:', solBalance, 'SOL');
    
    if (solBalance === 0) {
      console.log('❌ No SOL found! Please get test SOL from:');
      console.log('   https://faucet.solana.com/');
      console.log('   Enter address:', publicKey.toBase58());
    } else if (solBalance < 0.1) {
      console.log('⚠️  Low balance! Consider getting more SOL for testing');
    } else {
      console.log('✅ Sufficient balance for testing!');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkBalance();
