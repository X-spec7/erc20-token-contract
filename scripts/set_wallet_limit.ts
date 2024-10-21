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
    const newMaxWalletAmount = await askQuestion("Enter the new max wallet amount: ");

    const provider = new ethers.JsonRpcProvider("https://sepolia.unichain.org");
    const ownerWallet = new ethers.Wallet(privateKey, provider);

    const contractABI = [
      "function setMaxWalletAmount(uint256 _newMaxWalletAmount) external",
    ];
    const tokenContract = new ethers.Contract(contractAddress, contractABI, ownerWallet);

    console.log("Setting new max wallet amount...");

    const tx = await tokenContract.setMaxWalletAmount(newMaxWalletAmount);
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Max wallet amount updated. Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error setting max wallet amount:", error);
  } finally {
    rl.close();
  }
}

main();
