import { ethers } from "ethers";
import * as readline from "readline";
import { rl, askQuestion, validatePrivateKey, validateNetwork, validateRequiredField } from "./util";
import { WALLET_PRIVATE_KEY, INFURA_PROJECT_ID } from "./keys";

async function main(): Promise<void> {
  try {
    // Ask for network selection
    let network: string;
    do {
      network = (await askQuestion("Select the network (unichain, sepolia, mainnet): ")).toLowerCase();
    } while (!validateNetwork(network));

    let rpcUrl = "";
    let infuraProjectId = "";

    // Check network and set RPC URL accordingly
    if (network === "unichain") {
      rpcUrl = "https://sepolia.unichain.org";
    } else if (network === "sepolia" || network === "mainnet") {
      if (INFURA_PROJECT_ID == undefined) {
        throw new Error ("Invalid Infura Project ID");
      }
      infuraProjectId = INFURA_PROJECT_ID;
      rpcUrl = `https://${network}.infura.io/v3/${infuraProjectId}`;
    }

    // Get contract address and private key from the user
    let contractAddress: string;
    do {
      contractAddress = await askQuestion("Enter the contract address: ");
    } while (!validateRequiredField(contractAddress));

    if (WALLET_PRIVATE_KEY === undefined) {
      throw new Error ("Invalid wallet private key");
    }

    let privateKey: string = WALLET_PRIVATE_KEY;

    // Set up RPC provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create a signer with the owner's private key
    const ownerWallet = new ethers.Wallet(privateKey, provider);

    // Contract ABI (you only need the enableTrading function ABI for this example)
    const contractABI = [
      "function enableTrading() external",
    ];

    // Create a contract instance
    const tokenContract = new ethers.Contract(contractAddress, contractABI, ownerWallet);

    console.log("Enabling trading...");

    // Send transaction to enable trading
    const tx = await tokenContract.enableTrading();

    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("Trading enabled. Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error enabling trading:", error);
  } finally {
    rl.close();
  }
}

// Call the main function
main();
