// /pages/api/solana/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, PublicKey } from '@solana/web3.js';
import { findReference, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const reference = req.query.reference;
  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ state: 'error', error: 'Missing reference' });
  }

  const rpc = process.env.RPC_URL || 'https://api.devnet.solana.com';
  const recipientStr = process.env.MERCHANT_SOL_ADDRESS;
  if (!recipientStr) {
    return res.status(500).json({ state: 'error', error: 'Missing MERCHANT_SOL_ADDRESS' });
  }

  try {
    const connection = new Connection(rpc, 'confirmed');
    const referenceKey = new PublicKey(reference);
    const recipient = new PublicKey(recipientStr);

    // 1) See if any confirmed tx includes our reference
    let signature: string | null = null;
    try {
      const sigInfo = await findReference(connection, referenceKey, { finality: 'confirmed' });
      signature = sigInfo.signature;
    } catch {
      // Not found yet
      return res.status(200).json({ state: 'awaiting_signature' });
    }

    // 2) Validate it matches recipient (+ reference, but skip amount validation for flexibility)
    try {
      await validateTransfer(
        connection,
        signature,
        {
          recipient,
          reference: referenceKey,
          amount: new BigNumber('0.000000001'),  // minimal amount - validates structure but allows any payment amount
          // splToken: new PublicKey(USDC_MINT),   // optional: enforce token (e.g., USDC devnet mint)
        },
        { commitment: 'confirmed' }
      );

      return res.status(200).json({ state: 'confirmed', signature, cluster: 'devnet' });
    } catch {
      // Found a tx but not yet fully validated/final
      return res.status(200).json({ state: 'confirming', signature, cluster: 'devnet' });
    }
  } catch (e: any) {
    return res.status(500).json({ state: 'error', error: e?.message ?? String(e) });
  }
}
