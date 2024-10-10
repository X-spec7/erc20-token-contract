import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("CustomToken", function () {
  let tokenContract: any;
  let tokenContractAddress: string;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let taxWallet: any;
  let newTaxWallet: any;

  const decimals = 2;

  // Use BigInt for initial supply and other amounts
  const initialSupply: bigint = 1000000n * 10n ** BigInt(decimals);
  const taxPercentage = 5; // 5% tax
  const maxTxAmount: bigint = 10000n; // 10,000 tokens
  const maxWalletAmount: bigint = 50000n; // 50,000 tokens

  beforeEach(async function () {
    [owner, addr1, addr2, taxWallet, newTaxWallet] = await ethers.getSigners();

    const CustomToken = await ethers.getContractFactory("CustomToken");
    tokenContract = await (await CustomToken.deploy(
      "Custom Token",
      "CTK",
      initialSupply,
      taxPercentage,
      taxWallet.address,
      maxTxAmount,
      maxWalletAmount,
      decimals
    )).waitForDeployment();
    tokenContractAddress = await tokenContract.getAddress();
  });

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and decimals", async function () {
      expect(await tokenContract.name()).to.equal("Custom Token");
      expect(await tokenContract.symbol()).to.equal("CTK");
      expect(await tokenContract.decimals()).to.equal(decimals);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await tokenContract.balanceOf(owner.address);
      expect(await tokenContract.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the correct tax wallet and tax percentage", async function () {
      expect(await tokenContract.taxWallet()).to.equal(taxWallet.address);
      expect(await tokenContract.taxPercentage()).to.equal(taxPercentage);
    });

    it("Should have trading disabled initially", async function () {
      expect(await tokenContract.tradingEnabled()).to.equal(false);
    });

    it("Should set the correct maxTxAmount", async function () {
      expect(await tokenContract.maxTxAmount()).to.equal(maxTxAmount * 10n ** BigInt(decimals));
    });

    it("Should set the correct maxWalletAmount", async function () {
      expect(await tokenContract.maxWalletAmount()).to.equal(maxWalletAmount * 10n ** BigInt(decimals));
    });
  });

  describe("Transactions", function () {
    it("Should not allow transfers when trading is disabled (except owner)", async function () {
      await expect(
        tokenContract.connect(addr1).transfer(addr2.address, 10n * 10n ** BigInt(decimals))
      ).to.be.revertedWith("Trading is not enabled yet");

      await tokenContract.transfer(addr1.address, 100n * 10n ** BigInt(decimals)); // Owner can transfer
      expect(await tokenContract.balanceOf(addr1.address)).to.equal(100n * 10n ** BigInt(decimals) - 100n * 10n ** BigInt(decimals) * BigInt(taxPercentage) / 100n);
    });

    it("Should allow transfers after trading is enabled", async function () {
      await tokenContract.enableTrading();
      await tokenContract.transfer(addr1.address, 100n * 10n ** BigInt(decimals));

      await expect(tokenContract.connect(addr1).transfer(addr2.address, 50n * 10n ** BigInt(decimals)))
        .to.emit(tokenContract, "Transfer")
        .withArgs(addr1.address, taxWallet.address, 50n * 10n ** BigInt(decimals) * BigInt(taxPercentage) / 100n)
        .to.emit(tokenContract, "Transfer")
        .withArgs(addr1.address, addr2.address, 50n * 10n ** BigInt(decimals) - 50n * 10n ** BigInt(decimals) * BigInt(taxPercentage) / 100n);

      expect(await tokenContract.balanceOf(addr2.address)).to.equal(50n * 10n ** BigInt(decimals) - 50n * 10n ** BigInt(decimals) * BigInt(taxPercentage) / 100n);
    });

    it("Should enforce max transaction amount", async function () {
      await tokenContract.enableTrading();
      await tokenContract.transfer(addr1.address, 30000n * 10n ** BigInt(decimals));

      await expect(
        tokenContract.connect(addr1).transfer(addr2.address, 20000n * 10n ** BigInt(decimals))
      ).to.be.revertedWith("Transfer amount exceeds the maxTxAmount");

    });

    it("Should enforce max wallet amount", async function () {
      await tokenContract.enableTrading();

      await tokenContract.transfer(addr1.address, 49000n * 10n ** BigInt(decimals)); // Within limit
      await expect(
        tokenContract.transfer(addr1.address, 20000n * 10n ** BigInt(decimals))
      ).to.be.revertedWith("Recipient exceeds max wallet limit");
    });

    it("Should deduct tax and send it to the tax wallet", async function () {
      await tokenContract.enableTrading();

      const transferAmount: bigint = 1000n * 10n ** BigInt(decimals);
      const expectedTax = (transferAmount * BigInt(taxPercentage)) / 100n; // 5% tax
      const expectedTransfer = transferAmount - expectedTax; // Remaining after tax

      await tokenContract.transfer(addr1.address, transferAmount);

      expect(await tokenContract.balanceOf(addr1.address)).to.equal(expectedTransfer);
      expect(await tokenContract.balanceOf(taxWallet.address)).to.equal(expectedTax);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update tax percentage", async function () {
      await tokenContract.setTaxPercentage(8);
      expect(await tokenContract.taxPercentage()).to.equal(8);

      await expect(tokenContract.setTaxPercentage(11)).to.be.revertedWith("Tax percentage cannot exceed 10");
    });

    it("Should allow owner to update tax wallet", async function () {
      const newWallet = addr1.address;
      await tokenContract.setTaxWallet(newWallet);
      expect(await tokenContract.taxWallet()).to.equal(newWallet);

      await expect(tokenContract.setTaxWallet(ethers.ZeroAddress)).to.be.revertedWith("Tax wallet cannot be zero address");
    });

    it("Should allow owner to update max transaction amount", async function () {
      await tokenContract.setMaxTxAmount(20000); // 20,000 tokens
      expect(await tokenContract.maxTxAmount()).to.equal(20000n * 10n ** BigInt(decimals));
    });

    it("Should allow owner to update max wallet amount", async function () {
      await tokenContract.setMaxWalletAmount(100000); // 100,000 tokens
      expect(await tokenContract.maxWalletAmount()).to.equal(100000n * 10n ** BigInt(decimals));
    });

    it("Should allow owner to enable trading", async function () {
      await tokenContract.enableTrading();
      expect(await tokenContract.tradingEnabled()).to.equal(true);
    });
  });
});
