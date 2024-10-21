import { ethers } from "ethers";
import * as readline from "readline";

// Set up readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt the user for input and return a promise
const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

async function main(): Promise<void> {
  try {
    const contractAddress = await askQuestion("Enter the contract address: ");
    const privateKey = await askQuestion("Enter your private key (0x...): ");
    const newTaxWallet = await askQuestion("Enter the new tax wallet address: ");

    const provider = new ethers.JsonRpcProvider("https://sepolia.unichain.org");
    const ownerWallet = new ethers.Wallet(privateKey, provider);

    const contractABI = [
      "function setTaxWallet(address _newTaxWallet) external",
    ];
    const tokenContract = new ethers.Contract(contractAddress, contractABI, ownerWallet);

    console.log("Setting new tax wallet...");

    const tx = await tokenContract.setTaxWallet(newTaxWallet);
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Tax wallet updated. Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error setting tax wallet:", error);
  } finally {
    rl.close();
  }
}

main();
