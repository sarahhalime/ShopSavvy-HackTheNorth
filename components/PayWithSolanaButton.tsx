'use client';
import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

type Props = {
  amountSol: number;
  label?: string;
  message?: string;
  memo?: string;
  buttonText?: string;
  className?: string;
};

export default function PayWithSolanaButton({
  amountSol,
  label = 'Demo Store',
  message = 'Thanks for your purchase!',
  memo,
  buttonText,
  className,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'confirmed' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string>('');

  const detectWallet = () => {
    if (typeof window === 'undefined') return null;
    
    const w = window as any;
    
    if (w.backpack?.isBackpack) {
      return { wallet: w.backpack, type: 'backpack', name: 'Backpack' };
    }
    if (w.solana?.isPhantom) {
      return { wallet: w.solana, type: 'phantom', name: 'Phantom' };
    }
    if (w.solflare?.isSolflare) {
      return { wallet: w.solflare, type: 'solflare', name: 'Solflare' };
    }
    if (w.solana) {
      return { wallet: w.solana, type: 'generic', name: 'Solana Wallet' };
    }
    
    return null;
  };

  const processPayment = async () => {
    setStatus('processing');
    setError(null);
    setTxHash(null);

    try {
      // Detect wallet
      const walletInfo = detectWallet();
      if (!walletInfo) {
        throw new Error('No Solana wallet found. Please install Backpack, Phantom, or Solflare wallet extension.');
      }

      setWalletType(walletInfo.type);
      console.log(`🔗 Using ${walletInfo.name} wallet`);

      // Connect wallet if not connected
      if (!walletInfo.wallet.isConnected) {
        console.log('🔌 Connecting to wallet...');
        await walletInfo.wallet.connect();
      }

      const userPubkey = walletInfo.wallet.publicKey;
      if (!userPubkey) {
        throw new Error('Wallet connection failed - no public key received');
      }

      console.log('✅ Wallet connected:', userPubkey.toString());

      // Setup Solana connection
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
      const connection = new Connection(rpcUrl, 'confirmed');
      
      // Get merchant address from environment
      const merchantAddress = process.env.NEXT_PUBLIC_MERCHANT_SOL_ADDRESS;
      if (!merchantAddress) {
        throw new Error('Merchant address not configured. Please set NEXT_PUBLIC_MERCHANT_SOL_ADDRESS in your environment.');
      }
      
      const merchantPubkey = new PublicKey(merchantAddress);
      console.log('💳 Payment to:', merchantPubkey.toString());
      console.log('💰 Amount:', amountSol, 'SOL');

      // Check user balance (optional - for better UX)
      try {
        const balance = await connection.getBalance(userPubkey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        console.log('👛 User balance:', balanceSOL, 'SOL');
        
        if (balanceSOL < amountSol + 0.001) { // Add small buffer for fees
          throw new Error(`Insufficient balance. You need ${amountSol} SOL + fees, but only have ${balanceSOL.toFixed(4)} SOL.`);
        }
      } catch (balanceError) {
        console.warn('Could not check balance:', balanceError);
      }

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: userPubkey,
          toPubkey: merchantPubkey,
          lamports: Math.floor(amountSol * LAMPORTS_PER_SOL), // Convert to lamports
        })
      );

      // Add memo instruction if provided
      if (memo) {
        try {
          // Create memo instruction manually since we might not have @solana/spl-memo
          const memoData = Buffer.from(`${memo} - ${message}`, 'utf8');
          const memoInstruction = {
            keys: [],
            programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
            data: memoData,
          };
          transaction.add(memoInstruction);
          console.log('📝 Added memo:', memo);
        } catch (memoError) {
          console.warn('Could not add memo:', memoError);
        }
      }

      // Get recent blockhash
      console.log('🔄 Getting latest blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey;

      console.log('✍️ Requesting transaction signature from wallet...');

      // Sign transaction
      const signedTransaction = await walletInfo.wallet.signTransaction(transaction);
      
      console.log('📡 Sending transaction to Solana network...');
      
      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        { 
          skipPreflight: false, 
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        }
      );

      console.log('🚀 Transaction sent! Signature:', signature);

      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      setTxHash(signature);
      setStatus('confirmed');
      
      console.log('🎉 Payment completed successfully!', {
        signature,
        amount: amountSol,
        from: userPubkey.toString(),
        to: merchantPubkey.toString(),
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      });

    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed');
      setStatus('error');
    }
  };

  const getButtonText = () => {
    if (buttonText) return buttonText;
    
    const walletInfo = detectWallet();
    const walletName = walletInfo?.name || 'Wallet';
    
    switch (status) {
      case 'processing': return '⏳ Processing Payment...';
      case 'confirmed': return '✅ Payment Complete';
      case 'error': return '🔄 Try Again';
      default: return `Pay ${amountSol} SOL with ${walletName}`;
    }
  };

  const getButtonColor = () => {
    if (status === 'confirmed') return '#10b981';
    if (status === 'error') return '#ef4444';
    
    const walletInfo = detectWallet();
    switch (walletInfo?.type) {
      case 'backpack': return '#E33E7F';
      case 'phantom': return '#AB9FF2';
      case 'solflare': return '#FFC947';
      default: return '#3b82f6';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <button
        onClick={processPayment}
        disabled={status === 'processing'}
        className={className}
        style={{
          padding: '14px 28px',
          borderRadius: '12px',
          background: getButtonColor(),
          color: walletType === 'backpack' || walletType === 'phantom' ? '#FFFFFF' : 
                 status === 'confirmed' || status === 'error' ? '#FFFFFF' : '#000000',
          border: 'none',
          fontWeight: '600',
          cursor: status === 'processing' ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          width: '100%',
          opacity: status === 'processing' ? 0.7 : 1,
          transition: 'all 0.3s ease',
          boxShadow: status === 'processing' ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {getButtonText()}
      </button>

      {/* Status Messages */}
      <div style={{ marginTop: '16px', minHeight: '24px' }}>
        {status === 'processing' && (
          <div style={{ 
            color: '#3b82f6', 
            fontSize: '14px', 
            textAlign: 'center',
            padding: '8px',
            background: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #3b82f6'
          }}>
            💫 Please approve the transaction in your wallet popup...
          </div>
        )}
        
        {status === 'confirmed' && txHash && (
          <div style={{ 
            color: '#10b981', 
            fontSize: '14px', 
            textAlign: 'center',
            padding: '12px',
            background: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #10b981'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              🎉 Payment Successful!
            </div>
            <div style={{ fontSize: '12px', marginBottom: '8px', fontFamily: 'monospace', opacity: 0.8 }}>
              {txHash.slice(0, 8)}...{txHash.slice(-8)}
            </div>
            <a 
              href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: '#059669', 
                fontSize: '13px', 
                textDecoration: 'underline',
                fontWeight: '500'
              }}
            >
              View on Solana Explorer →
            </a>
          </div>
        )}
        
        {error && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '14px', 
            textAlign: 'center',
            padding: '12px',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #ef4444'
          }}>
            <div style={{ marginBottom: '8px' }}>❌ {error}</div>
            {error.includes('No Solana wallet') && (
              <div style={{ fontSize: '12px' }}>
                <a href="https://www.backpack.app/" target="_blank" style={{color: '#dc2626', marginRight: '12px', textDecoration: 'underline'}}>
                  📥 Install Backpack
                </a>
                <a href="https://phantom.app/" target="_blank" style={{color: '#dc2626', textDecoration: 'underline'}}>
                  👻 Install Phantom
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet Info */}
      {status === 'idle' && (
        <div style={{ 
          marginTop: '12px', 
          fontSize: '12px', 
          textAlign: 'center', 
          opacity: 0.6,
          color: '#6b7280'
        }}>
          {detectWallet() ? (
            `Ready to pay with ${detectWallet()?.name}`
          ) : (
            'Please install a Solana wallet to continue'
          )}
        </div>
      )}
    </div>
  );
}