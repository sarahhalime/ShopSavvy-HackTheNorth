import { ethers } from 'ethers';

// ABI for our ShopSavvy Rewards contract (only the functions we need)
const REWARDS_CONTRACT_ABI = [
  "function mintRewards(address user, uint256 amount, string memory orderId) external",
  "function batchMintRewards(address[] memory users, uint256[] memory amounts, string[] memory orderIds) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function isOrderProcessed(string memory orderId) external view returns (bool)",
  "function getDailyRewardsGiven(address user) external view returns (uint256)",
  "function getRemainingDailyLimit(address user) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "event RewardsMinted(address indexed user, uint256 amount, string indexed orderId)"
];

interface RewardsConfig {
  contractAddress: string;
  privateKey: string;
  rpcUrl: string;
  rewardPercentage: number; // e.g., 3 for 3%
  minPurchaseForRewards: number; // minimum purchase amount in USD
}

export class RewardsService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private config: RewardsConfig;

  constructor(config: RewardsConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.contractAddress,
      REWARDS_CONTRACT_ABI,
      this.wallet
    );
  }

  /**
   * Calculate reward amount based on purchase total
   */
  calculateRewardAmount(purchaseAmountUSD: number): bigint {
    if (purchaseAmountUSD < this.config.minPurchaseForRewards) {
      return BigInt(0);
    }

    // Calculate reward percentage (3% default)
    const rewardUSD = (purchaseAmountUSD * this.config.rewardPercentage) / 100;
    
    // Convert to token amount (1 USD = 1 token for simplicity)
    // In production, you might want a different ratio
    const rewardTokens = rewardUSD;
    
    // Convert to wei (18 decimals)
    return ethers.parseEther(rewardTokens.toString());
  }

  /**
   * Check if an order has already been processed for rewards
   */
  async isOrderProcessed(orderId: string): Promise<boolean> {
    try {
      return await this.contract.isOrderProcessed(orderId);
    } catch (error) {
      console.error('Error checking order status:', error);
      return false;
    }
  }

  /**
   * Mint rewards for a single purchase
   */
  async mintRewardsForPurchase(
    userWalletAddress: string,
    purchaseAmountUSD: number,
    orderId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string; rewardAmount?: string }> {
    try {
      // Validate inputs
      if (!ethers.isAddress(userWalletAddress)) {
        return { success: false, error: 'Invalid wallet address' };
      }

      // Check if order already processed
      const isProcessed = await this.isOrderProcessed(orderId);
      if (isProcessed) {
        return { success: false, error: 'Order already processed for rewards' };
      }

      // Calculate reward amount
      const rewardAmount = this.calculateRewardAmount(purchaseAmountUSD);
      if (rewardAmount === BigInt(0)) {
        return { success: false, error: 'Purchase amount too low for rewards' };
      }

      console.log(`Minting ${ethers.formatEther(rewardAmount)} SSR tokens for order ${orderId}`);

      // Check user's daily limit
      const remainingLimit = await this.contract.getRemainingDailyLimit(userWalletAddress);
      if (rewardAmount > remainingLimit) {
        return { success: false, error: 'Daily reward limit exceeded' };
      }

      // Mint the rewards
      const tx = await this.contract.mintRewards(
        userWalletAddress,
        rewardAmount,
        orderId
      );

      console.log(`Rewards minting transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`Rewards minted successfully! TX: ${tx.hash}`);
        return {
          success: true,
          txHash: tx.hash,
          rewardAmount: ethers.formatEther(rewardAmount)
        };
      } else {
        return { success: false, error: 'Transaction failed' };
      }

    } catch (error: any) {
      console.error('Error minting rewards:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get user's token balance
   */
  async getUserBalance(userWalletAddress: string): Promise<string> {
    try {
      if (!ethers.isAddress(userWalletAddress)) {
        return '0';
      }

      const balance = await this.contract.balanceOf(userWalletAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting user balance:', error);
      return '0';
    }
  }

  /**
   * Get user's daily rewards given
   */
  async getUserDailyRewards(userWalletAddress: string): Promise<string> {
    try {
      if (!ethers.isAddress(userWalletAddress)) {
        return '0';
      }

      const dailyRewards = await this.contract.getDailyRewardsGiven(userWalletAddress);
      return ethers.formatEther(dailyRewards);
    } catch (error) {
      console.error('Error getting daily rewards:', error);
      return '0';
    }
  }

  /**
   * Get contract information
   */
  async getContractInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    address: string;
  }> {
    try {
      const [name, symbol, decimals] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.decimals()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        address: this.config.contractAddress
      };
    } catch (error) {
      console.error('Error getting contract info:', error);
      return {
        name: 'Unknown',
        symbol: 'UNK',
        decimals: 18,
        address: this.config.contractAddress
      };
    }
  }

  /**
   * Batch mint rewards for multiple orders (gas optimization)
   */
  async batchMintRewards(
    orders: Array<{
      userWalletAddress: string;
      purchaseAmountUSD: number;
      orderId: string;
    }>
  ): Promise<{ success: boolean; txHash?: string; error?: string; processedCount?: number }> {
    try {
      const validOrders = [];
      const users = [];
      const amounts = [];
      const orderIds = [];

      // Validate and prepare batch data
      for (const order of orders) {
        if (!ethers.isAddress(order.userWalletAddress)) {
          console.warn(`Invalid address for order ${order.orderId}`);
          continue;
        }

        const isProcessed = await this.isOrderProcessed(order.orderId);
        if (isProcessed) {
          console.warn(`Order ${order.orderId} already processed`);
          continue;
        }

        const rewardAmount = this.calculateRewardAmount(order.purchaseAmountUSD);
        if (rewardAmount === BigInt(0)) {
          console.warn(`Order ${order.orderId} amount too low for rewards`);
          continue;
        }

        validOrders.push(order);
        users.push(order.userWalletAddress);
        amounts.push(rewardAmount);
        orderIds.push(order.orderId);
      }

      if (validOrders.length === 0) {
        return { success: false, error: 'No valid orders to process' };
      }

      console.log(`Batch minting rewards for ${validOrders.length} orders`);

      // Execute batch mint
      const tx = await this.contract.batchMintRewards(users, amounts, orderIds);
      console.log(`Batch rewards minting transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`Batch rewards minted successfully! TX: ${tx.hash}`);
        return {
          success: true,
          txHash: tx.hash,
          processedCount: validOrders.length
        };
      } else {
        return { success: false, error: 'Batch transaction failed' };
      }

    } catch (error: any) {
      console.error('Error batch minting rewards:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      };
    }
  }
}

// Environment-based configuration
export function createRewardsService(): RewardsService | null {
  const contractAddress = process.env.REWARDS_CONTRACT_ADDRESS;
  const privateKey = process.env.REWARDS_PRIVATE_KEY;
  const rpcUrl = process.env.REWARDS_RPC_URL;
  const rewardPercentage = Number(process.env.REWARDS_PERCENTAGE || '3');
  const minPurchaseForRewards = Number(process.env.MIN_PURCHASE_FOR_REWARDS || '5');

  if (!contractAddress || !privateKey || !rpcUrl) {
    console.warn('Rewards service not configured - missing environment variables');
    return null;
  }

  const config: RewardsConfig = {
    contractAddress,
    privateKey,
    rpcUrl,
    rewardPercentage,
    minPurchaseForRewards
  };

  return new RewardsService(config);
}
