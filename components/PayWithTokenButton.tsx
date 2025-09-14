'use client';
import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress, 
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

type PaymentType = 'SOL' | 'SPL_TOKEN';

type Props = {
  amount: number;
  paymentType: PaymentType;
  tokenMint?: string; // Required for SPL token payments
  tokenDecimals?: number; // Required for SPL token payments
  label?: string;
  message?: string;
  memo?: string;
  buttonText?: string;
  className?: string;
};

export default function PayWithTokenButton({
  amount,
  paymentType,
  tokenMint,
  tokenDecimals = 9,
  label = 'Demo Store',
  message = 'Thanks for your purchase!',
  memo,
  buttonText,
  className,
}: Props) {
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
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
      return { wallet: w.solana, type: 'solana', name: 'Solana Wallet' };
    }
    
    return null;
  };

  const processPayment = async () => {
    setStatus('processing');
    setError(null);
    setTxHash(null);

    try {
      // Validate SPL token parameters
      if (paymentType === 'SPL_TOKEN' && !tokenMint) {
        throw new Error('Token mint address is required for SPL token payments');
      }

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

      if (paymentType === 'SOL') {
        await processSOLPayment(connection, userPubkey, merchantPubkey, amount, walletInfo.wallet);
      } else {
        await processTokenPayment(connection, userPubkey, merchantPubkey, amount, tokenMint!, tokenDecimals, walletInfo.wallet);
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      setStatus('error');
    }
  };

  const processSOLPayment = async (
    connection: Connection,
    userPubkey: PublicKey,
    merchantPubkey: PublicKey,
    amount: number,
    wallet: any
  ) => {
    console.log('💰 Processing SOL payment:', amount, 'SOL');

    // Check user balance
    try {
      const balance = await connection.getBalance(userPubkey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      console.log('👛 User balance:', balanceSOL, 'SOL');
      
      if (balanceSOL < amount + 0.001) { // Add small buffer for fees
        throw new Error(`Insufficient balance. You need ${amount} SOL + fees, but only have ${balanceSOL.toFixed(4)} SOL.`);
      }
    } catch (balanceError) {
      console.warn('Could not check balance:', balanceError);
    }

    // Create SOL transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: merchantPubkey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );

    // Add memo instruction if provided
    if (memo) {
      const memoData = Buffer.from(`${memo} - ${message}`, 'utf8');
      const memoInstruction = {
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: memoData,
      };
      transaction.add(memoInstruction);
      console.log('📝 Added memo:', memo);
    }

    // Get recent blockhash and sign
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    console.log('✍️ Requesting transaction signature from wallet...');
    const signedTransaction = await wallet.signTransaction(transaction);
    
    console.log('📡 Sending transaction to Solana network...');
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    console.log('⏳ Waiting for confirmation...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('✅ Payment successful!');
    console.log('🔗 Transaction signature:', signature);
    
    setTxHash(signature);
    setStatus('success');
  };

  const processTokenPayment = async (
    connection: Connection,
    userPubkey: PublicKey,
    merchantPubkey: PublicKey,
    amount: number,
    tokenMint: string,
    tokenDecimals: number,
    wallet: any
  ) => {
    console.log('🪙 Processing SPL token payment:', amount, 'tokens');

    const mintPubkey = new PublicKey(tokenMint);
    
    // Get associated token addresses
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      userPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const merchantTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      merchantPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log('👛 User token account:', userTokenAccount.toBase58());
    console.log('💳 Merchant token account:', merchantTokenAccount.toBase58());

    // Check user token balance
    try {
      const userAccount = await getAccount(connection, userTokenAccount);
      const userBalance = Number(userAccount.amount) / Math.pow(10, tokenDecimals);
      console.log('👛 User token balance:', userBalance);
      
      if (userBalance < amount) {
        throw new Error(`Insufficient token balance. You have ${userBalance} tokens but need ${amount}.`);
      }
    } catch (error) {
        // Type guard to safely access error properties
        if (error instanceof Error) {
          if (error.message.includes('Insufficient')) {
            throw error;
          }
          console.warn('Could not check token balance:', error.message);
        } else {
          console.warn('Could not check token balance:', String(error));
        }
      }

    // Create token transfer transaction
    const transaction = new Transaction().add(
      createTransferInstruction(
        userTokenAccount,
        merchantTokenAccount,
        userPubkey,
        Math.floor(amount * Math.pow(10, tokenDecimals)),
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Add memo instruction if provided
    if (memo) {
      const memoData = Buffer.from(`${memo} - ${message}`, 'utf8');
      const memoInstruction = {
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: memoData,
      };
      transaction.add(memoInstruction);
      console.log('📝 Added memo:', memo);
    }

    // Get recent blockhash and sign
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    console.log('✍️ Requesting transaction signature from wallet...');
    const signedTransaction = await wallet.signTransaction(transaction);
    
    console.log('📡 Sending transaction to Solana network...');
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    console.log('⏳ Waiting for confirmation...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('✅ Token payment successful!');
    console.log('🔗 Transaction signature:', signature);
    
    setTxHash(signature);
    setStatus('success');
  };

  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (status === 'processing') return 'Processing...';
    if (status === 'success') return 'Payment Successful!';
    if (status === 'error') return 'Retry Payment';
    
    if (paymentType === 'SOL') {
      return `Pay ${amount} SOL`;
    } else {
      return `Pay ${amount} Tokens`;
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: status === 'processing' ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '200px',
    };

    if (status === 'success') {
      return {
        ...baseStyle,
        backgroundColor: '#10b981',
        color: 'white',
      };
    }

    if (status === 'error') {
      return {
        ...baseStyle,
        backgroundColor: '#ef4444',
        color: 'white',
      };
    }

    if (paymentType === 'SOL') {
      return {
        ...baseStyle,
        backgroundColor: '#9945ff',
        color: 'white',
        ':hover': { backgroundColor: '#7c3aed' },
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#f59e0b',
        color: 'white',
        ':hover': { backgroundColor: '#d97706' },
      };
    }
  };

  return (
    <div className={className}>
      <button
        onClick={processPayment}
        disabled={status === 'processing'}
        style={getButtonStyle()}
      >
        {getButtonText()}
      </button>

      {error && (
        <div style={{ 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '6px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}

      {txHash && (
        <div style={{ 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '6px',
          color: '#166534',
          fontSize: '14px'
        }}>
          ✅ Payment successful! 
          <br />
          <a 
            href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#059669', textDecoration: 'underline' }}
          >
            View transaction on Solana Explorer
          </a>
        </div>
      )}

      {walletType && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '12px', 
          color: '#6b7280' 
        }}>
          Connected via {walletType}
        </div>
      )}
    </div>
  );
}
