import { ethers } from 'ethers'

// Contract ABI (simplified)
const ETH_REWARD_ABI = [
  "function processPurchaseReward(address buyer, uint256 purchaseAmount) external returns (uint256)",
  "function claimReward() external",
  "function getPendingReward(address user) external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
  "function getRewardPool() external view returns (uint256)",
  "function depositRewards() external payable",
  "event PurchaseReward(address indexed buyer, uint256 amount, bool won)",
  "event RewardClaimed(address indexed winner, uint256 amount)"
]

export interface RewardResult {
  success: boolean
  transactionHash?: string
  pendingReward?: string
  error?: string
}

export interface RewardInfo {
  pendingReward: string
  contractBalance: string
  rewardPool: string
}

export class EthRewardService {
  private contract: ethers.Contract | null = null
  private provider: ethers.providers.Provider | null = null
  private signer: ethers.Signer | null = null
  private contractAddress: string

  constructor(contractAddress: string, rpcUrl?: string) {
    this.contractAddress = contractAddress
    
    if (rpcUrl) {
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      this.contract = new ethers.Contract(contractAddress, ETH_REWARD_ABI, this.provider)
    }
  }

  // Initialize with wallet provider (MetaMask, etc.)
  async initializeWithWallet(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.providers.Web3Provider((window as any).ethereum)
        await provider.send("eth_requestAccounts", [])
        
        this.provider = provider
        this.signer = provider.getSigner()
        this.contract = new ethers.Contract(this.contractAddress, ETH_REWARD_ABI, this.signer)
        
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to initialize wallet:', error)
      return false
    }
  }

  // Process a purchase reward (called after successful purchase)
  async processPurchaseReward(buyerAddress: string, purchaseAmountUSD: number): Promise<RewardResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract not initialized with signer')
      }

      // Convert USD to wei for calculation (simplified)
      const purchaseAmountWei = ethers.utils.parseEther((purchaseAmountUSD / 2000).toString()) // Assuming 1 ETH = $2000

      const tx = await this.contract.processPurchaseReward(buyerAddress, purchaseAmountWei)
      const receipt = await tx.wait()

      // Check for PurchaseReward event
      const rewardEvent = receipt.events?.find((e: any) => e.event === 'PurchaseReward')
      
      return {
        success: true,
        transactionHash: tx.hash,
        pendingReward: rewardEvent ? 'Reward processing...' : 'No reward this time'
      }
    } catch (error: any) {
      console.error('Purchase reward error:', error)
      return {
        success: false,
        error: error.message || 'Failed to process purchase reward'
      }
    }
  }

  // Claim pending rewards
  async claimReward(): Promise<RewardResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract not initialized with signer')
      }

      const tx = await this.contract.claimReward()
      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: tx.hash
      }
    } catch (error: any) {
      console.error('Claim reward error:', error)
      return {
        success: false,
        error: error.message || 'Failed to claim reward'
      }
    }
  }

  // Get pending reward for a user
  async getPendingReward(userAddress: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }

      const reward = await this.contract.getPendingReward(userAddress)
      return ethers.utils.formatEther(reward)
    } catch (error) {
      console.error('Get pending reward error:', error)
      return '0'
    }
  }

  // Get contract info
  async getRewardInfo(): Promise<RewardInfo> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }

      const [contractBalance, rewardPool] = await Promise.all([
        this.contract.getContractBalance(),
        this.contract.getRewardPool()
      ])

      return {
        pendingReward: '0', // Will be fetched separately for specific user
        contractBalance: ethers.utils.formatEther(contractBalance),
        rewardPool: ethers.utils.formatEther(rewardPool)
      }
    } catch (error) {
      console.error('Get reward info error:', error)
      return {
        pendingReward: '0',
        contractBalance: '0',
        rewardPool: '0'
      }
    }
  }

  // Listen for reward events
  onRewardEvents(callback: (event: any) => void) {
    if (!this.contract) return

    this.contract.on('PurchaseReward', (buyer, amount, won, event) => {
      callback({
        type: 'PurchaseReward',
        buyer,
        amount: ethers.utils.formatEther(amount),
        won,
        transactionHash: event.transactionHash
      })
    })

    this.contract.on('RewardClaimed', (winner, amount, event) => {
      callback({
        type: 'RewardClaimed',
        winner,
        amount: ethers.utils.formatEther(amount),
        transactionHash: event.transactionHash
      })
    })
  }

  // Get user's wallet address
  async getUserAddress(): Promise<string | null> {
    try {
      if (!this.signer) return null
      return await this.signer.getAddress()
    } catch (error) {
      console.error('Get user address error:', error)
      return null
    }
  }
}

// Factory function with environment variables
export function createEthRewardService(): EthRewardService | null {
  const contractAddress = process.env.NEXT_PUBLIC_ETH_REWARD_CONTRACT
  const rpcUrl = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL

  if (!contractAddress) {
    console.warn('ETH reward contract address not configured')
    return null
  }

  return new EthRewardService(contractAddress, rpcUrl)
}

// Mock service for development
export class MockEthRewardService extends EthRewardService {
  constructor() {
    super('0x0000000000000000000000000000000000000000')
  }

  async processPurchaseReward(buyerAddress: string, purchaseAmountUSD: number): Promise<RewardResult> {
    // Simulate 30% chance of winning
    const won = Math.random() < 0.3
    const rewardAmount = won ? (0.001 + Math.random() * 0.009).toFixed(4) : '0'

    return {
      success: true,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      pendingReward: won ? `${rewardAmount} ETH` : 'No reward this time'
    }
  }

  async claimReward(): Promise<RewardResult> {
    return {
      success: true,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
    }
  }

  async getPendingReward(userAddress: string): Promise<string> {
    return (Math.random() * 0.01).toFixed(4)
  }

  async getRewardInfo(): Promise<RewardInfo> {
    return {
      pendingReward: (Math.random() * 0.01).toFixed(4),
      contractBalance: '1.5',
      rewardPool: '0.8'
    }
  }
}
