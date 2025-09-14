const hre = require("hardhat");

async function main() {
  console.log("Deploying ETH Reward Contract...");

  // Chainlink VRF Subscription ID (you need to create this on Chainlink)
  const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID || "1"; // Replace with actual subscription ID

  const EthRewardContract = await hre.ethers.getContractFactory("EthRewardContract");
  const contract = await EthRewardContract.deploy(subscriptionId);

  await contract.waitForDeployment();

  console.log("EthRewardContract deployed to:", await contract.getAddress());
  console.log("Subscription ID:", subscriptionId);
  
  // Fund the contract with some ETH for rewards
  const fundAmount = hre.ethers.parseEther("0.1"); // 0.1 ETH
  const fundTx = await contract.depositRewards({ value: fundAmount });
  await fundTx.wait();
  
  console.log("Contract funded with 0.1 ETH for rewards");
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    address: await contract.getAddress(),
    subscriptionId: subscriptionId,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
