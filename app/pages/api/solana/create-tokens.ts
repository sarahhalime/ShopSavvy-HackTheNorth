import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Keypair } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import bs58 from 'bs58';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payerPrivateKey = process.env.PAYER_PRIVATE_KEY;
    if (!payerPrivateKey) {
      return res.status(500).json({ error: 'PAYER_PRIVATE_KEY not configured' });
    }

    // Try different private key formats
    let payer: Keypair;
    try {
      // Try base58 format (most common from wallets)
      const decoded = bs58.decode(payerPrivateKey);
      payer = Keypair.fromSecretKey(decoded);
    } catch (e1) {
      try {
        // Try base64 format
        const privateKeyBytes = Buffer.from(payerPrivateKey, 'base64');
        payer = Keypair.fromSecretKey(privateKeyBytes);
      } catch (e2) {
        try {
          // Try JSON array format
          const keyArray = JSON.parse(payerPrivateKey);
          payer = Keypair.fromSecretKey(new Uint8Array(keyArray));
        } catch (e3) {
          return res.status(500).json({ 
            error: 'Invalid private key format. Please use base58, base64, or JSON array format.' 
          });
        }
      }
    }

    console.log('Using payer:', payer.publicKey.toBase58());

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    if (balance === 0) {
      return res.status(400).json({ 
        error: 'Payer account has no SOL balance',
        payerAddress: payer.publicKey.toBase58(),
        message: 'Please get test SOL from https://faucet.solana.com/'
      });
    }

    const { name = 'My Custom Token', symbol = 'MCT', decimals = 9, initialSupply = 1000000 } = req.body;

    const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, decimals);
    const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
    await mintTo(connection, payer, mint, tokenAccount.address, payer, initialSupply * Math.pow(10, decimals));

    return res.status(200).json({
      success: true,
      token: {
        mint: mint.toBase58(),
        name,
        symbol,
        decimals,
        supply: initialSupply.toString()
      }
    });
  } catch (error: any) {
    console.error('Token creation error:', error);
    return res.status(500).json({ error: error.message });
  }
}