import type { NextApiRequest, NextApiResponse } from 'next';
import { ConversionManager, CONVERSION_PRESETS } from '@/lib/conversion-utils';
import { z } from 'zod';

const SetRateBody = z.object({
  tokenMint: z.string(),
  tokenToSOL: z.number().positive(),
});

const GetRateBody = z.object({
  tokenMint: z.string(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Set conversion rate
      const parsed = SetRateBody.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: 'Invalid request body', 
          details: parsed.error.flatten() 
        });
      }

      const { tokenMint, tokenToSOL } = parsed.data;
      
      ConversionManager.setRate(tokenMint, tokenToSOL);
      
      return res.status(200).json({
        success: true,
        message: `Conversion rate set: 1 SOL = ${(1/tokenToSOL).toLocaleString()} tokens`,
        rate: ConversionManager.getRate(tokenMint)
      });

    } else if (req.method === 'GET') {
      // Get conversion rate
      const { tokenMint } = req.query;
      
      if (!tokenMint || typeof tokenMint !== 'string') {
        return res.status(400).json({ error: 'tokenMint parameter required' });
      }

      const rate = ConversionManager.getRate(tokenMint);
      
      if (!rate) {
        return res.status(404).json({ 
          error: 'No conversion rate found for this token',
          presets: CONVERSION_PRESETS
        });
      }

      return res.status(200).json({
        success: true,
        rate,
        formatted: `1 SOL = ${rate.solToToken.toLocaleString()} tokens`
      });

    } else if (req.method === 'PUT') {
      // Get all rates
      const allRates = ConversionManager.getAllRates();
      const ratesArray = Array.from(allRates.entries()).map(([mint, rate]) => ({
        tokenMint: mint,
        ...rate
      }));

      return res.status(200).json({
        success: true,
        rates: ratesArray,
        presets: CONVERSION_PRESETS
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Conversion rate error:', error);
    return res.status(500).json({
      error: 'Failed to process conversion rate',
      details: error.message
    });
  }
}
