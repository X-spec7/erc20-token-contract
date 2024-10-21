import * as readline from "readline";

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

export const validatePrivateKey = (key: string): boolean => {
  if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
    console.log("Error: Invalid private key format.");
    return false;
  }
  return true;
};

export const validateRequiredField = (input: string): boolean => {
  if (!input || input.trim() === "") {
    console.log("Error: This field is required and cannot be empty.");
    return false;
  }
  return true;
};

export const validateNetwork = (network: string): boolean => {
  const validNetworks = ["unichain", "sepolia", "mainnet"];
  if (!validNetworks.includes(network.toLowerCase())) {
    console.log("Error: Invalid network selection. Please choose from 'unichain', 'sepolia', or 'mainnet'.");
    return false;
  }
  return true;
};

export const validateTaxPercentage = (taxPercentage: string): boolean => {
  const taxPercentageNumber = Number(taxPercentage);
  if (isNaN(taxPercentageNumber) || taxPercentageNumber < 0 || taxPercentageNumber > 10) {
    console.log("Error: Tax percentage must be a number between 0 and 10.");
    return false;
  }
  return true;
};
