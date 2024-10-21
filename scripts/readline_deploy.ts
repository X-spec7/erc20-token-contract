import { execSync } from "child_process";
import * as readline from "readline";
import { askQuestion, validateRequiredField, validateNetwork, validatePrivateKey, rl } from "./util";
import fs from "fs";
import path from "path";
import { ethers } from "ethers"; // Import ethers to derive deployer address

// Function to validate initial supply and ensure it's a positive number
const validateInitialSupply = (supply: string): boolean => {
  const value = Number(supply);
  if (isNaN(value) || value <= 0) {
    console.log("Error: Initial supply must be a positive number.");
    return false;
  }
  return true;
};

// Function to save deployment details to a file
const saveDeploymentDetails = (data: object): void => {
  const filePath = path.join(__dirname, 'deployment_log.json');

  // Check if the file exists, if not create it with an empty array
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }

  // Read the existing deployment log
  const existingLogs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  existingLogs.push(data);

  // Write the updated log back to the file
  fs.writeFileSync(filePath, JSON.stringify(existingLogs, null, 2));
};

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

    let name: string;
    do {
      name = await askQuestion("Enter the token name: ");
    } while (!validateRequiredField(name));

    let symbol: string;
    do {
      symbol = await askQuestion("Enter the token symbol: ");
    } while (!validateRequiredField(symbol));

    let initialSupply: string;
    do {
      initialSupply = await askQuestion("Enter the initial supply (must be a positive number): ");
    } while (!validateInitialSupply(initialSupply));

    let taxPercentage: string;
    do {
      taxPercentage = await askQuestion("Enter the tax percentage (0-10): ");
    } while (!validateRequiredField(taxPercentage));

    let taxWallet: string;
    do {
      taxWallet = await askQuestion("Enter the tax wallet address: ");
    } while (!validateRequiredField(taxWallet));

    let maxTxAmount: string;
    do {
      maxTxAmount = await askQuestion("Enter the max transaction amount: ");
    } while (!validateRequiredField(maxTxAmount));

    let maxWalletAmount: string;
    do {
      maxWalletAmount = await askQuestion("Enter the max wallet amount: ");
    } while (!validateRequiredField(maxWalletAmount));

    let decimals: string;
    do {
      decimals = await askQuestion("Enter the token decimals (usually 18): ");
    } while (!validateRequiredField(decimals));

    let privateKey: string;
    do {
      privateKey = await askQuestion("Enter your private key (0x...): ");
    } while (!validatePrivateKey(privateKey));

    // Derive deployer address from private key
    const deployerWallet = new ethers.Wallet(privateKey);
    const deployerAddress = deployerWallet.address;

    // Construct the command
    const cmd = `forge create contracts/CustomToken.sol:CustomToken \
      --rpc-url ${rpcUrl} \
      --private-key "${privateKey}" \
      --constructor-args "${name}" "${symbol}" ${initialSupply} ${taxPercentage} ${taxWallet} ${maxTxAmount} ${maxWalletAmount} ${decimals}`;

    console.log("Running command:", cmd);

    // Execute the command and handle possible errors
    let result;
    let txHash: string | null = null;
    try {
      result = execSync(cmd, { stdio: "pipe" }).toString(); // Use 'pipe' to capture the output
    } catch (error) {
      console.error("Error executing command:", error);
      rl.close();
      return;
    }

    // Extract the contract address and transaction hash from the command result
    const contractAddressMatch = result.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
    const contractAddress = contractAddressMatch ? contractAddressMatch[1] : null;

    // Assuming the transaction hash can be extracted (you might need to modify this part based on your command output)
    const txHashMatch = result.match(/Transaction hash: (0x[a-fA-F0-9]{64})/);
    if (txHashMatch) {
      txHash = txHashMatch[1];
    }

    if (contractAddress && txHash) {
      // Prepare data to save
      const deploymentData = {
        creationDate: new Date().toISOString(),
        network,
        tokenName: name,
        tokenSymbol: symbol,
        initialSupply,
        taxPercentage,
        taxWallet,
        maxTxAmount,
        maxWalletAmount,
        decimals,
        contractAddress,
        deployerAddress,
        transactionHash: txHash,
      };

      // Save deployment details to a file
      saveDeploymentDetails(deploymentData);
      console.log("Deployment details saved successfully.");
    } else {
      console.error("Error: Unable to retrieve contract address or transaction hash.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

main();
