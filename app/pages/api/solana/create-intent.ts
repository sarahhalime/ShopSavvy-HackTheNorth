import type { NextApiRequest, NextApiResponse } from 'next';
import { PublicKey, Keypair } from '@solana/web3.js';
import { encodeURL } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const Body = z.object({
  amountSol: z.number().positive().max(10_000),
  label: z.string().optional(),
  message: z.string().optional(),
  memo: z.string().max(80).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    console.error('Validation failed:', parsed.error.flatten());
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
  }

  const { amountSol, label, message, memo } = parsed.data;

  const recipientStr = process.env.MERCHANT_SOL_ADDRESS;
  console.log('Environment check:');
  console.log('MERCHANT_SOL_ADDRESS:', recipientStr);
  console.log('RPC_URL:', process.env.RPC_URL);
  
  if (!recipientStr) {
    console.error('Missing MERCHANT_SOL_ADDRESS in environment');
    return res.status(500).json({ error: 'Missing MERCHANT_SOL_ADDRESS' });
  }

  try {
    // Validate recipient address
    const recipient = new PublicKey(recipientStr);
    console.log('Recipient validation passed:', recipient.toBase58());

    // Generate reference
    const reference = Keypair.generate().publicKey;
    const intentId = uuidv4();

    console.log('=== SOLANA PAY URL GENERATION ===');
    console.log('Recipient:', recipient.toBase58());
    console.log('Amount SOL:', amountSol);
    console.log('Reference:', reference.toBase58());
    console.log('Label:', label ?? 'Demo Store');
    console.log('Message:', message ?? 'Thanks for your purchase!');

    // Create URL with minimal parameters first
    const url = encodeURL({
      recipient,
      amount: new BigNumber(amountSol.toString()),
      reference,
      label: label ?? 'Demo Store',
      message: message ?? 'Thanks for your purchase!',
      memo: memo ?? `intent:${intentId}`,
    });

    console.log('Generated URL:', url.toString());
    console.log('URL length:', url.toString().length);
    console.log('Starts with solana:?', url.toString().startsWith('solana:'));
    console.log('=================================');

    return res.status(200).json({
      url: url.toString(),
      reference: reference.toBase58(),
      intentId,
      debug: {
        recipient: recipient.toBase58(),
        amount: amountSol,
        urlLength: url.toString().length
      }
    });
  } catch (e: any) {
    console.error('Error creating Solana Pay URL:', e);
    return res.status(500).json({ 
      error: 'Failed to create intent', 
      details: e?.message ?? String(e),
      recipientStr 
    });
  }
}