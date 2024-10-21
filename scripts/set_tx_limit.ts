import { ethers } from "ethers";
import * as readline from "readline";

// Set up readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

async function main(): Promise<void> {
  try {
    const contractAddress = await askQuestion("Enter the contract address: ");
    const privateKey = await askQuestion("Enter your private key (0x...): ");
    const newMaxTxAmount = await askQuestion("Enter the new max transaction amount: ");

    const provider = new ethers.JsonRpcProvider("https://sepolia.unichain.org");
    const ownerWallet = new ethers.Wallet(privateKey, provider);

    const contractABI = [
      "function setMaxTxAmount(uint256 _newMaxTxAmount) external",
    ];
    const tokenContract = new ethers.Contract(contractAddress, contractABI, ownerWallet);

    console.log("Setting new max transaction amount...");

    const tx = await tokenContract.setMaxTxAmount(newMaxTxAmount);
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Max transaction amount updated. Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error setting max transaction amount:", error);
  } finally {
    rl.close();
  }
}

main();
