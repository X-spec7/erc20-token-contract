import { ethers } from "ethers";
import * as readline from "readline";
import { askQuestion, validatePrivateKey, validateNetwork, validateRequiredField, rl } from "./util";

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
      do {
        infuraProjectId = await askQuestion("Enter your Infura Project ID: ");
      } while (!validateRequiredField(infuraProjectId));
      rpcUrl = `https://${network}.infura.io/v3/${infuraProjectId}`;
    }

    let contractAddress: string;
    do {
      contractAddress = await askQuestion("Enter the contract address: ");
    } while (!validateRequiredField(contractAddress));
    
    let privateKey: string;
    do {
      privateKey = await askQuestion("Enter your private key (0x...): ");
    } while (!validatePrivateKey(privateKey));

    // Set up RPC provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ownerWallet = new ethers.Wallet(privateKey, provider);

    const contractABI = [
      "function renounceOwnership() external",
    ];
    const tokenContract = new ethers.Contract(contractAddress, contractABI, ownerWallet);

    console.log("Renouncing ownership...");

    const tx = await tokenContract.renounceOwnership();
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Ownership renounced. Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error renouncing ownership:", error);
  } finally {
    rl.close();
  }
}

main();
