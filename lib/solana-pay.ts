/**
 * Solana Pay Service
 * Handles Solana blockchain payments and transactions
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js'
import BigNumber from 'bignumber.js'

// Solana Pay configuration
export const SOLANA_PAY_CONFIG = {
  // Use devnet for development, mainnet for production
  network: process.env.SOLANA_NETWORK || 'devnet',
  
  // RPC endpoints
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  
  // Merchant wallet (replace with your actual wallet)
  merchantWallet: process.env.SOLANA_MERCHANT_WALLET || 'D7uKXnL9TfPe4qdGJHtSRZJQsWdcK3r7V2EXBaHprWsf',
  
  // SPL Token addresses
  tokens: {
    SOL: 'native',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on mainnet
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT on mainnet
  }
}

// Connection to Solana network
const connection = new Connection(SOLANA_PAY_CONFIG.rpcUrl, 'confirmed')

export interface PaymentRequest {
  amount: number
  currency: 'SOL' | 'USDC' | 'USDT'
  recipient?: string
  reference?: string
  label?: string
  message?: string
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  qrCode?: string
  paymentUrl?: string
  error?: string
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed' | 'expired'
  transactionId?: string
  confirmations?: number
  error?: string
}

class SolanaPayService {
  private connection: Connection
  private merchantWallet: PublicKey

  constructor() {
    this.connection = connection
    try {
      this.merchantWallet = new PublicKey(SOLANA_PAY_CONFIG.merchantWallet)
    } catch (error) {
      console.warn('Invalid merchant wallet, using default')
      this.merchantWallet = new PublicKey('D7uKXnL9TfPe4qdGJHtSRZJQsWdcK3r7V2EXBaHprWsf')
    }
  }

  /**
   * Create a Solana Pay payment request
   */
  async createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const { amount, currency, recipient, reference, label, message } = request
      
      // Convert amount to lamports for SOL
      const lamports = currency === 'SOL' 
        ? new BigNumber(amount).multipliedBy(LAMPORTS_PER_SOL).toNumber()
        : amount

      // Use provided recipient or default to merchant wallet
      const recipientKey = recipient ? new PublicKey(recipient) : this.merchantWallet

      // Generate reference key for tracking
      const referenceKey = reference ? new PublicKey(reference) : PublicKey.unique()

      // Create Solana Pay URL
      const paymentUrl = this.createSolanaPayUrl({
        recipient: recipientKey.toString(),
        amount: lamports,
        reference: referenceKey.toString(),
        label: label || 'ShopSavvy Purchase',
        message: message || 'Thank you for your purchase!'
      })

      // Generate QR code data (URL for QR generation)
      const qrCode = paymentUrl

      return {
        success: true,
        paymentUrl,
        qrCode,
        transactionId: referenceKey.toString()
      }

    } catch (error) {
      console.error('Error creating payment request:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify a transaction on the Solana blockchain
   */
  async verifyTransaction(signature: string): Promise<TransactionStatus> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed'
      })

      if (!transaction) {
        return {
          status: 'pending',
          transactionId: signature
        }
      }

      if (transaction.meta?.err) {
        return {
          status: 'failed',
          transactionId: signature,
          error: 'Transaction failed'
        }
      }

      // Get confirmation count
      const latestBlockhash = await this.connection.getLatestBlockhash()
      const confirmations = latestBlockhash ? 1 : 0 // Simplified confirmation check

      return {
        status: 'confirmed',
        transactionId: signature,
        confirmations
      }

    } catch (error) {
      console.error('Error verifying transaction:', error)
      return {
        status: 'failed',
        transactionId: signature,
        error: error instanceof Error ? error.message : 'Verification failed'
      }
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(signature: string) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed'
      })
      return transaction
    } catch (error) {
      console.error('Error getting transaction details:', error)
      return null
    }
  }

  /**
   * Create Solana Pay URL
   */
  private createSolanaPayUrl(params: {
    recipient: string
    amount: number
    reference: string
    label: string
    message: string
  }): string {
    const { recipient, amount, reference, label, message } = params
    
    const url = new URL('solana:' + recipient)
    url.searchParams.append('amount', amount.toString())
    url.searchParams.append('reference', reference)
    url.searchParams.append('label', encodeURIComponent(label))
    url.searchParams.append('message', encodeURIComponent(message))
    
    return url.toString()
  }

  /**
   * Convert USD to SOL (mock conversion for demo)
   */
  async convertUsdToSol(usdAmount: number): Promise<number> {
    // In production, you'd fetch real exchange rates
    // This is a mock conversion rate
    const mockSolPrice = 100 // $100 per SOL
    return usdAmount / mockSolPrice
  }

  /**
   * Get current SOL balance for a wallet
   */
  async getBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress)
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Error getting balance:', error)
      return 0
    }
  }

  /**
   * Health check for Solana connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion()
      return version !== null
    } catch (error) {
      console.error('Solana connection health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const solanaPayService = new SolanaPayService()

export default solanaPayService
