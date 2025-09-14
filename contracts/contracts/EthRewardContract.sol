// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract EthRewardContract is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;
    
    // Chainlink VRF Configuration
    uint64 s_subscriptionId;
    bytes32 keyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c; // Sepolia
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;
    
    // Contract state
    address public owner;
    uint256 public totalRewards;
    uint256 public rewardPool;
    
    // Reward settings
    uint256 public constant MIN_REWARD = 0.001 ether; // 0.001 ETH
    uint256 public constant MAX_REWARD = 0.01 ether;  // 0.01 ETH
    uint256 public constant REWARD_CHANCE = 30; // 30% chance to win
    
    // Events
    event PurchaseReward(address indexed buyer, uint256 amount, bool won);
    event RewardClaimed(address indexed winner, uint256 amount);
    event FundsDeposited(uint256 amount);
    
    // Mappings
    mapping(uint256 => address) public requestIdToBuyer;
    mapping(uint256 => uint256) public requestIdToPurchaseAmount;
    mapping(address => uint256) public pendingRewards;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(uint64 subscriptionId) VRFConsumerBaseV2(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625) {
        COORDINATOR = VRFCoordinatorV2Interface(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625);
        owner = msg.sender;
        s_subscriptionId = subscriptionId;
    }
    
    // Deposit ETH to the reward pool
    function depositRewards() external payable onlyOwner {
        rewardPool += msg.value;
        emit FundsDeposited(msg.value);
    }
    
    // Called when someone makes a purchase during ETH event
    function processPurchaseReward(address buyer, uint256 purchaseAmount) external returns (uint256 requestId) {
        require(rewardPool > MIN_REWARD, "Insufficient reward pool");
        require(buyer != address(0), "Invalid buyer address");
        
        // Request random number from Chainlink VRF
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        // Store request data
        requestIdToBuyer[requestId] = buyer;
        requestIdToPurchaseAmount[requestId] = purchaseAmount;
        
        return requestId;
    }
    
    // Chainlink VRF callback
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address buyer = requestIdToBuyer[requestId];
        uint256 purchaseAmount = requestIdToPurchaseAmount[requestId];
        
        require(buyer != address(0), "Invalid request");
        
        uint256 randomValue = randomWords[0] % 100; // 0-99
        bool won = randomValue < REWARD_CHANCE; // 30% chance
        
        if (won && rewardPool >= MIN_REWARD) {
            // Calculate reward based on purchase amount and randomness
            uint256 rewardMultiplier = (randomWords[0] % 5) + 1; // 1-5x multiplier
            uint256 baseReward = MIN_REWARD + ((purchaseAmount / 100) * 0.0001 ether); // Small bonus based on purchase
            uint256 reward = baseReward * rewardMultiplier;
            
            // Cap the reward
            if (reward > MAX_REWARD) {
                reward = MAX_REWARD;
            }
            
            // Ensure we have enough in pool
            if (reward > rewardPool) {
                reward = rewardPool;
            }
            
            // Add to pending rewards
            pendingRewards[buyer] += reward;
            rewardPool -= reward;
            totalRewards += reward;
        }
        
        emit PurchaseReward(buyer, purchaseAmount, won);
        
        // Clean up
        delete requestIdToBuyer[requestId];
        delete requestIdToPurchaseAmount[requestId];
    }
    
    // Claim pending rewards
    function claimReward() external {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        require(address(this).balance >= reward, "Insufficient contract balance");
        
        pendingRewards[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    // View functions
    function getPendingReward(address user) external view returns (uint256) {
        return pendingRewards[user];
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getRewardPool() external view returns (uint256) {
        return rewardPool;
    }
    
    // Emergency functions
    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        rewardPool = 0;
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function updateSubscriptionId(uint64 newSubscriptionId) external onlyOwner {
        s_subscriptionId = newSubscriptionId;
    }
    
    // Allow contract to receive ETH
    receive() external payable {
        rewardPool += msg.value;
        emit FundsDeposited(msg.value);
    }
}
