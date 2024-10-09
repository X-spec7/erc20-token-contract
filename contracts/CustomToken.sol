// contracts/CustomToken.sol

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract CustomToken is ERC20Burnable, Ownable {

  uint8 public taxPercentage;
  uint8 public tokenDecimals;
  address public taxWallet;

  uint256 public maxTxAmount; // Maximum tokens per transaction
  uint256 public maxWalletAmount; // Maximum tokens per wallet

  bool public tradingEnabled = false;

  // Events
  event TaxUpdated(uint256 newTax);
  event TaxWalletUpdated(address newTaxWallet);
  event MaxTxAmountUpdated(uint256 newMaxTxAmount);
  event MaxWalletAmountUpdated(uint256 newMaxWalletAmount);
  event TradingEnabled();
//   event Transfer(address indexed from, address indexed to, uint256 value);

  constructor(
    string memory name_,
    string memory symbol_,
    uint256 initialSupply_,
    uint8 _taxPercentage,
    address _taxWallet,
    uint256 _maxTxAmount,
    uint256 _maxWalletAmount,
    uint8 _decimals
  ) ERC20(name_, symbol_) Ownable(msg.sender) {
    require(_taxWallet != address(0), "Tax wallet cannot be zero address");
    require(_taxPercentage <= 10, "Tax percentage cannot exceed 10"); // Example max tax

    _mint(msg.sender, initialSupply_ * 10 ** _decimals);

    taxPercentage = _taxPercentage;
    taxWallet = _taxWallet;
    tokenDecimals = _decimals;
    maxTxAmount = _maxTxAmount * 10 ** _decimals;
    maxWalletAmount = _maxWalletAmount * 10 ** _decimals;
  }

  function transfer(
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {

        address sender = _msgSender();
        // When trading is not enabled, only owner can transfer
        if (!tradingEnabled) {
            require(sender == owner() || recipient == owner(), "Trading is not enabled yet");
        }

        // Enforce max transaction amount
        if (sender != owner() && recipient != owner()) {
            require(amount <= maxTxAmount, "Transfer amount exceeds the maxTxAmount");
        }

        // Calculate tax
        uint256 taxAmount = (amount * taxPercentage) / 100;
        uint256 transferAmount = amount - taxAmount;

        // Transfer tax to taxWallet
        if (taxAmount > 0) {
            super._transfer(sender, taxWallet, taxAmount);
        }

        // Enforce max wallet amount
        if (recipient != owner()) {
            uint256 recipientBalance = balanceOf(recipient);
            require((recipientBalance + transferAmount) <= maxWalletAmount, "Recipient exceeds max wallet limit");
        }

        // if (recipient != owner()) {
        //     require(balanceOf(recipient) <= maxWalletAmount, "Recipient exceeds max wallet limit");
        // }

        // Transfer remaining amount to recipient
        super._transfer(sender, recipient, transferAmount);

        // emit Transfer(sender, recipient, transferAmount);
        return true;
    }

    // Function to update tax percentage
    function setTaxPercentage(uint8 _newTaxPercentage) external onlyOwner {
        require(_newTaxPercentage <= 10, "Tax percentage cannot exceed 10"); // Example max tax
        taxPercentage = _newTaxPercentage;
        emit TaxUpdated(_newTaxPercentage);
    }

    // Function to update tax wallet
    function setTaxWallet(address _newTaxWallet) external onlyOwner {
        require(_newTaxWallet != address(0), "Tax wallet cannot be zero address");
        taxWallet = _newTaxWallet;
        emit TaxWalletUpdated(_newTaxWallet);
    }

    // Function to update max transaction amount
    function setMaxTxAmount(uint256 _newMaxTxAmount) external onlyOwner {
        maxTxAmount = _newMaxTxAmount * 10 ** tokenDecimals;
        emit MaxTxAmountUpdated(_newMaxTxAmount);
    }

    // Function to update max wallet amount
    function setMaxWalletAmount(uint256 _newMaxWalletAmount) external onlyOwner {
        maxWalletAmount = _newMaxWalletAmount * 10 ** tokenDecimals;
        emit MaxWalletAmountUpdated(_newMaxWalletAmount);
    }

    // Function to enable trading
    function enableTrading() external onlyOwner {
        tradingEnabled = true;
        emit TradingEnabled();
    }

    // Function to renounce ownership
    // Inherited from Ownable
    function renounceOwnership() public virtual override onlyOwner {
        _transferOwnership(address(0));
    }

    function decimals() public view override virtual returns (uint8) {
        return tokenDecimals;
    }
}
