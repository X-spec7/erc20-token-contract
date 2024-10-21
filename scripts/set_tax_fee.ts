import { ethers } from "ethers";
import {
  askQuestion,
  validatePrivateKey,
  validateNetwork,
  validateRequiredField,
  validateTaxPercentage,
  rl
} from "./util";

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

    let contractAddress = "";
    do {
      contractAddress = await askQuestion("Enter the contract address: ");
    } while (!validateRequiredField(contractAddress));
    
    let privateKeyInput = "";
    do {
      privateKeyInput = await askQuestion("Enter your private key (0x...): ");
    } while (!validatePrivateKey(privateKeyInput));

    let newTaxPercentage;
    do {
      newTaxPercentage = await askQuestion("Enter the new tax percentage (0-10): ");
    } while (!validateTaxPercentage(newTaxPercentage));

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ownerWallet = new ethers.Wallet(privateKeyInput, provider);

    const contractABI = [
      "function setTaxPercentage(uint8 _newTaxPercentage) external",
    ];
    const tokenContract = new ethers.Contract(contractAddress, contractABI, ownerWallet);

    console.log("Setting new tax percentage...");

    const tx = await tokenContract.setTaxPercentage(newTaxPercentage);
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Tax percentage updated. Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error setting tax percentage:", error);
  } finally {
    rl.close();
  }
}

main();
