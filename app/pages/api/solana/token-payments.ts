import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TokenManager, parseTokenAmount } from '@/lib/token-utils';
import { z } from 'zod';
import BigNumber from 'bignumber.js';

const Body = z.object({
  fromAddress: z.string(),
  toAddress: z.string(),
  mintAddress: z.string(),
  amount: z.number().positive(),
  decimals: z.number().min(0).max(9).default(9),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Invalid request body', 
        details: parsed.error.flatten() 
      });
    }

    const { fromAddress, toAddress, mintAddress, amount, decimals } = parsed.data;

    // Get RPC URL from environment
    const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // Get payer keypair from environment (for creating token accounts)
    const payerPrivateKey = process.env.PAYER_PRIVATE_KEY;
    if (!payerPrivateKey) {
      return res.status(500).json({ 
        error: 'PAYER_PRIVATE_KEY not configured in environment' 
      });
    }

    // Parse the private key with proper type handling
    let payer: Keypair;
    try {
      // Try as base64 first
      const privateKeyBytes = Buffer.from(payerPrivateKey, 'base64' as BufferEncoding);
      payer = Keypair.fromSecretKey(privateKeyBytes);
    } catch (error1) {
      // Try as base58 if base64 fails
      try {
        const bs58 = require('bs58');
        const privateKeyBytes = bs58.decode(payerPrivateKey);
        payer = Keypair.fromSecretKey(privateKeyBytes);
      } catch (error2) {
        // Try as JSON array (Solana CLI format)
        try {
          const keyArray = JSON.parse(payerPrivateKey);
          if (Array.isArray(keyArray) && keyArray.length === 64) {
            payer = Keypair.fromSecretKey(new Uint8Array(keyArray));
          } else {
            throw new Error('Invalid JSON array format');
          }
        } catch (error3) {
          return res.status(500).json({ 
            error: 'Invalid PAYER_PRIVATE_KEY format. Use base64, base58, or JSON array format.' 
          });
        }
      }
    }

    // Validate addresses
    try {
      new PublicKey(fromAddress);
      new PublicKey(toAddress);
      new PublicKey(mintAddress);
    } catch {
      return res.status(400).json({ 
        error: 'Invalid address format' 
      });
    }

    console.log('Processing token payment:', {
      from: fromAddress,
      to: toAddress,
      mint: mintAddress,
      amount,
      decimals
    });

    // Create token manager
    const tokenManager = new TokenManager(connection, payer);

    // Check if user has sufficient balance
    const userBalance = await tokenManager.getTokenBalance(fromAddress, mintAddress);
    if (!userBalance) {
      return res.status(400).json({
        error: 'User does not have a token account for this token'
      });
    }

    const userBalanceAmount = parseFloat(userBalance.amount);
    if (userBalanceAmount < amount) {
      return res.status(400).json({
        error: `Insufficient balance. User has ${userBalanceAmount} tokens but needs ${amount}`
      });
    }

    // Perform the transfer
    const signature = await tokenManager.transferTokens(
      fromAddress,
      toAddress,
      mintAddress,
      amount,
      decimals
    );

    console.log('Token transfer completed:', signature);

    return res.status(200).json({
      success: true,
      signature,
      message: 'Token payment completed successfully!'
    });

  } catch (error: any) {
    console.error('Error processing token payment:', error);
    return res.status(500).json({
      error: 'Failed to process token payment',
      details: error.message
    });
  }
}