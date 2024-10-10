// scripts/deploy_GLDToken.ts

import { ethers } from "hardhat";

async function main() {
    const initialSupply = 10000000000;

    const CustomToken = await ethers.getContractFactory("CustomToken");

    const taxWallet = ethers.Wallet.createRandom();

    const tokenContract = await (await CustomToken.deploy(
        "Custom Token",
        "CTK",
        initialSupply,
        5,
        taxWallet.address,
        10000,
        100000,
        6
    )).waitForDeployment();
    
    const tokenContractAddress = await tokenContract.getAddress();

    // const tokenContract = await ethers.getContractAt("CustomToken", tokenContractAddress);

    const totalSupply = await tokenContract.totalSupply()

    console.log(
        `CustomToken deployed to ${tokenContractAddress} with an initialSupply ${totalSupply}`
    );
}

    // We recommend this pattern to be able to use async/await everywhere
    // and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
