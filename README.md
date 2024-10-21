
<!-- GETTING STARTED -->
## Getting Started

This is a script tool for deploying erc20 token contract on ethereum main network and test networks, and interacting with the contract.

### Prerequisites

This is using forge so make sure you have installed forge and have it in your path.
Run the following command to install forge:

```bash
curl -L https://foundry.paradigm.xyz | bash
```

### Deployment and Interaction

1. Get a free API Key at Infura dashboard
2. Clone the repo
   ```sh
   git clone https://github.com/realhardworkingdeveloper/erc20-deployer
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
   or
   ```sh
   yarn install
   ```
4. Run the following command to deploy the contract
   ```sh
   npm run deploy
   ```
   select the network and enter your infura api key and other parameters
5. Run the following command to enable trading before you make any transactions
   ```sh
   npm run enable:trading
   ```
6. For other commands, refer to the `package.json` file
