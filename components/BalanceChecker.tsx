"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Connection, PublicKey } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"

interface TokenBalance {
  mint: string
  balance: string
  decimals: number
  uiAmount: number
  symbol?: string
  name?: string
}

interface BalanceData {
  solBalance: number
  tokenBalances: TokenBalance[]
}

export function BalanceChecker() {
  const [walletAddress, setWalletAddress] = useState("6UCG17H1umjFhjponngVVehXMBmcpkvPm1SQNk2u829n")
  const [tokenMint, setTokenMint] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)

  const checkBalances = async () => {
    if (!walletAddress.trim()) {
      setError("Please enter a wallet address")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Validate wallet address
      const publicKey = new PublicKey(walletAddress)
      
      // Connect to Solana devnet
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      )

      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey)
      const solBalanceFormatted = solBalance / 1000000000 // Convert lamports to SOL

      // Get token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      )

      const tokenBalances: TokenBalance[] = []

      for (const account of tokenAccounts.value) {
        const parsedInfo = account.account.data.parsed.info
        const balance = parsedInfo.tokenAmount

        // Skip accounts with zero balance unless specifically requested
        if (balance.uiAmount === 0 && !tokenMint) continue

        // If specific token mint is provided, filter for it
        if (tokenMint && parsedInfo.mint !== tokenMint) continue

        tokenBalances.push({
          mint: parsedInfo.mint,
          balance: balance.amount,
          decimals: balance.decimals,
          uiAmount: balance.uiAmount || 0,
          symbol: await getTokenSymbol(parsedInfo.mint), // We'll implement this
          name: await getTokenName(parsedInfo.mint) // We'll implement this
        })
      }

      setBalanceData({
        solBalance: solBalanceFormatted,
        tokenBalances
      })

    } catch (err: any) {
      console.error('Error checking balances:', err)
      if (err.message.includes('Invalid public key')) {
        setError("Invalid wallet address format")
      } else {
        setError(`Failed to check balances: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Simple token metadata lookup (in production, you'd use a proper token registry)
  const getTokenSymbol = async (mint: string): Promise<string> => {
    const knownTokens: { [key: string]: string } = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'So11111111111111111111111111111111111111112': 'SOL',
    }
    return knownTokens[mint] || mint.slice(0, 4).toUpperCase()
  }

  const getTokenName = async (mint: string): Promise<string> => {
    const knownTokens: { [key: string]: string } = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USD Coin',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'Tether USD',
      'So11111111111111111111111111111111111111112': 'Solana',
    }
    return knownTokens[mint] || 'Custom Token'
  }

  const formatBalance = (balance: number): string => {
    if (balance === 0) return "0.00"
    if (balance < 0.01) return balance.toExponential(2)
    return balance.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })
  }

  const getTokenGradient = (symbol?: string): string => {
    const gradients: { [key: string]: string } = {
      'USDC': 'from-blue-500 to-cyan-500',
      'USDT': 'from-green-500 to-emerald-500',
      'SOL': 'from-purple-500 to-pink-500',
    }
    return gradients[symbol || ''] || 'from-gray-500 to-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Token Balance Checker
        </CardTitle>
        <CardDescription>
          Check SPL token balances for any Solana address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="walletAddress">Wallet Address</Label>
          <Input 
            id="walletAddress" 
            placeholder="Enter Solana address..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tokenMint">Token Mint Address (Optional)</Label>
          <Input 
            id="tokenMint" 
            placeholder="Leave empty to check all tokens"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <Button 
          className="w-full" 
          variant="outline" 
          onClick={checkBalances}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4 mr-2" />
          )}
          {loading ? "Checking..." : "Check Balances"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {balanceData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Balance Results:</span>
            </div>
            
            {/* SOL Balance */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                <div>
                  <div className="font-medium">SOL</div>
                  <div className="text-xs text-muted-foreground">Native Token</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatBalance(balanceData.solBalance)}</div>
                <div className="text-xs text-muted-foreground">
                  ≈ ${(balanceData.solBalance * 40).toFixed(2)} {/* Rough SOL price */}
                </div>
              </div>
            </div>

            {/* Token Balances */}
            {balanceData.tokenBalances.length > 0 ? (
              balanceData.tokenBalances.map((token, index) => (
                <div key={token.mint} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 bg-gradient-to-r ${getTokenGradient(token.symbol)} rounded-full`}></div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatBalance(token.uiAmount)}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {token.mint.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))
            ) : balanceData && !loading ? (
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground">
                  {tokenMint ? "No balance found for specified token" : "No SPL tokens found"}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {!balanceData && !error && !loading && (
          <div className="text-xs text-muted-foreground">
            Click "Check Balances" to fetch real-time data from Solana Devnet
          </div>
        )}
      </CardContent>
    </Card>
  )
}