import { ethers } from 'ethers';

// USDC contract addresses for different networks
const USDC_ADDRESSES = {
  // Polygon
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon USDC
  80001: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23', // Mumbai USDC
  
  // Base
  8453: '0xA0b86a33E6417C30423D36b41E69C22D3dC1b82A', // Base USDC
  84531: '0xF175520C52418dfE19C8098071a252da48Cd1C19', // Base Goerli USDC
  
  // Ethereum
  1: '0xA0b86a33E6417C30423D36b41E69C22D3dC1b82A', // Ethereum USDC
  5: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', // Goerli USDC
};

// ERC-20 ABI for USDC transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export interface PaymentRequest {
  to: string;
  amount: string;
  currency: 'ETH' | 'USDC';
  orderId: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

export class EthereumPayService {
  private provider: ethers.JsonRpcProvider;
  private chainId: number;
  private merchantAddress: string;

  constructor(rpcUrl: string, merchantAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.merchantAddress = merchantAddress;
    this.chainId = 0; // Will be set when we connect
  }

  /**
   * Initialize the service and get chain ID
   */
  async initialize(): Promise<void> {
    try {
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);
      console.log(`Connected to network: ${network.name} (${this.chainId})`);
    } catch (error) {
      console.error('Failed to initialize Ethereum service:', error);
      throw error;
    }
  }

  /**
   * Get the network name
   */
  getNetworkName(): string {
    switch (this.chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Mumbai Testnet';
      case 8453: return 'Base Mainnet';
      case 84531: return 'Base Goerli Testnet';
      default: return `Unknown (${this.chainId})`;
    }
  }

  /**
   * Get USDC contract address for current network
   */
  getUSDCAddress(): string | null {
    return USDC_ADDRESSES[this.chainId as keyof typeof USDC_ADDRESSES] || null;
  }

  /**
   * Convert USD amount to Wei (for ETH payments)
   */
  async convertUSDToETH(usdAmount: number): Promise<string> {
    // In a real app, you'd fetch ETH/USD price from an oracle or API
    // For demo purposes, using a fixed rate: 1 ETH = $2000
    const ethPrice = 2000;
    const ethAmount = usdAmount / ethPrice;
    return ethers.parseEther(ethAmount.toString()).toString();
  }

  /**
   * Convert USD amount to USDC (6 decimals)
   */
  convertUSDToUSDC(usdAmount: number): string {
    // USDC has 6 decimals
    return ethers.parseUnits(usdAmount.toString(), 6).toString();
  }

  /**
   * Create a payment request for the frontend
   */
  async createPaymentRequest(
    usdAmount: number,
    orderId: string,
    description: string,
    currency: 'ETH' | 'USDC' = 'USDC'
  ): Promise<PaymentRequest> {
    await this.initialize();

    let amount: string;
    
    if (currency === 'ETH') {
      amount = await this.convertUSDToETH(usdAmount);
    } else {
      amount = this.convertUSDToUSDC(usdAmount);
    }

    return {
      to: this.merchantAddress,
      amount,
      currency,
      orderId,
      description
    };
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(
    transactionHash: string,
    expectedAmount: string,
    expectedCurrency: 'ETH' | 'USDC'
  ): Promise<PaymentResult> {
    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return { success: false, error: 'Transaction not found' };
      }

      if (receipt.status !== 1) {
        return { success: false, error: 'Transaction failed' };
      }

      // Get transaction details
      const transaction = await this.provider.getTransaction(transactionHash);
      
      if (!transaction) {
        return { success: false, error: 'Transaction details not found' };
      }

      // Verify recipient
      if (expectedCurrency === 'ETH') {
        if (transaction.to?.toLowerCase() !== this.merchantAddress.toLowerCase()) {
          return { success: false, error: 'Payment sent to wrong address' };
        }
        
        if (transaction.value.toString() !== expectedAmount) {
          return { success: false, error: 'Payment amount mismatch' };
        }
      } else {
        // For USDC, we need to parse the transfer event
        const usdcAddress = this.getUSDCAddress();
        if (!usdcAddress) {
          return { success: false, error: 'USDC not supported on this network' };
        }

        // Check if transaction was to USDC contract
        if (transaction.to?.toLowerCase() !== usdcAddress.toLowerCase()) {
          return { success: false, error: 'Not a USDC transaction' };
        }

        // Parse transfer event from logs
        const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, this.provider);
        const transferFilter = usdcContract.filters.Transfer(null, this.merchantAddress);
        
        const logs = receipt.logs.filter(log => {
          try {
            const parsed = usdcContract.interface.parseLog(log);
            return parsed?.name === 'Transfer' && 
                   parsed.args.to.toLowerCase() === this.merchantAddress.toLowerCase() &&
                   parsed.args.value.toString() === expectedAmount;
          } catch {
            return false;
          }
        });

        if (logs.length === 0) {
          return { success: false, error: 'USDC transfer not found or amount mismatch' };
        }
      }

      return {
        success: true,
        transactionHash,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString()
      };

    } catch (error: any) {
      console.error('Payment verification error:', error);
      return { success: false, error: error.message || 'Verification failed' };
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(transactionHash: string) {
    try {
      const [transaction, receipt] = await Promise.all([
        this.provider.getTransaction(transactionHash),
        this.provider.getTransactionReceipt(transactionHash)
      ]);

      return {
        transaction,
        receipt,
        confirmed: receipt?.status === 1,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
        effectiveGasPrice: receipt?.gasPrice?.toString(),
        networkName: this.getNetworkName()
      };
    } catch (error) {
      console.error('Error getting transaction details:', error);
      return null;
    }
  }

  /**
   * Get user's balance for a specific token
   */
  async getUserBalance(userAddress: string, currency: 'ETH' | 'USDC'): Promise<string> {
    try {
      if (currency === 'ETH') {
        const balance = await this.provider.getBalance(userAddress);
        return ethers.formatEther(balance);
      } else {
        const usdcAddress = this.getUSDCAddress();
        if (!usdcAddress) return '0';

        const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, this.provider);
        const balance = await usdcContract.balanceOf(userAddress);
        return ethers.formatUnits(balance, 6); // USDC has 6 decimals
      }
    } catch (error) {
      console.error('Error getting user balance:', error);
      return '0';
    }
  }

  /**
   * Estimate gas for a payment
   */
  async estimatePaymentGas(
    fromAddress: string,
    amount: string,
    currency: 'ETH' | 'USDC'
  ): Promise<{ gasLimit: string; gasPrice: string; estimatedCost: string }> {
    try {
      const gasPrice = await this.provider.getGasPrice();
      let gasLimit: bigint;

      if (currency === 'ETH') {
        gasLimit = await this.provider.estimateGas({
          to: this.merchantAddress,
          value: amount,
          from: fromAddress
        });
      } else {
        const usdcAddress = this.getUSDCAddress();
        if (!usdcAddress) throw new Error('USDC not supported');

        const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, this.provider);
        gasLimit = await usdcContract.transfer.estimateGas(this.merchantAddress, amount);
      }

      const estimatedCost = gasLimit * gasPrice;

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCost: ethers.formatEther(estimatedCost)
      };
    } catch (error: any) {
      console.error('Gas estimation error:', error);
      return {
        gasLimit: '21000',
        gasPrice: '0',
        estimatedCost: '0'
      };
    }
  }
}

// Environment-based service creation
export function createEthereumPayService(): EthereumPayService | null {
  const rpcUrl = process.env.REWARDS_RPC_URL; // Reuse the same network as rewards
  const merchantAddress = process.env.ETH_MERCHANT_WALLET;

  if (!rpcUrl || !merchantAddress) {
    console.warn('Ethereum pay service not configured');
    return null;
  }

  return new EthereumPayService(rpcUrl, merchantAddress);
}
