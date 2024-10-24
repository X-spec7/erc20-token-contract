// import { ethers } from "hardhat"
import { ethers } from "ethers"
import { encodeSqrtRatioX96, nearestUsableTick, NonfungiblePositionManager, Position, Pool, } from "@uniswap/v3-sdk"
import { Percent, Token } from "@uniswap/sdk-core"
import { env } from "process"

env.config()

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID
const SEPOLIA_CHAIN_ID = 11155111

const ERC20_ADDRESS = "0xc3761eb917cd790b30dad99f6cc5b4ff93c4f9ea"
const NF_POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

const YETI_TOKEN_ADDRESS = "0x351CaA5fb74ac688ABDDcABF7BB82ff9F4bF5Be7"
const PAPOI_TOKEN_ADDRESS = "0x8F9f9DF2cfDcF26d59e1dF784C9a700957823CC9"
const YETI_TOKEN_DECIMAL = 4
const PAPOI_TOKEN_DECIMAL = 7
const YETI_TOKEN_AMOUNT = ethers.parseUnits("10000", YETI_TOKEN_DECIMAL)
const PAPOI_TOKEN_AMOUNT = ethers.parseUnits("10000", PAPOI_TOKEN_DECIMAL)

const FEE_TIER = 3000
const TICK_SPACING = 10

const price = encodeSqrtRatioX96(1, 1)
console.log('price', price)

const sepoliaProvider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`)
const wallet = new ethers.Wallet(
  PRIVATE_KEY,
)
const sepoliaWallet = wallet.connect(sepoliaProvider)

const getAbi = async (contractAddress) => {
  const requestUrl = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`
  const abiJSON = await (await fetch(requestUrl)).json()
  return JSON.parse(abiJSON.result)
}

const getPoolState = async (poolContract) => {
  const liquidity = await poolContract.liquidity()
  const slot = await poolContract.slot0()

  return {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  }
}

async function main() {

  const uniswapFactoryAbi = await getAbi(UNISWAP_FACTORY_ADDRESS)
  const nfPositionManagerAbi = await getAbi(NF_POSITION_MANAGER_ADDRESS)

  const nfPositionManagerContract = new ethers.Contract(
    NF_POSITION_MANAGER_ADDRESS,
    nfPositionManagerAbi,
    sepoliaProvider
  )
  const uniswapFactoryContract = new ethers.Contract(
    UNISWAP_FACTORY_ADDRESS,
    uniswapFactoryAbi,
    sepoliaProvider
  )

  const yetiToken = new Token(
    SEPOLIA_CHAIN_ID,
    YETI_TOKEN_ADDRESS,
    YETI_TOKEN_DECIMAL
  )

  const papoiToken = new Token(
    SEPOLIA_CHAIN_ID,
    PAPOI_TOKEN_ADDRESS,
    PAPOI_TOKEN_DECIMAL
  )

  // Create Pool if needed
  let poolAddress = await uniswapFactoryContract.getPool(
    YETI_TOKEN_ADDRESS,
    PAPOI_TOKEN_ADDRESS,
    FEE_TIER
  )
  if (poolAddress === "0x0000000000000000000000000000000000000000") {
    console.log("Creating pool...")
    const tx = await uniswapFactoryContract.connect(sepoliaWallet).createPool(
      YETI_TOKEN_ADDRESS,
      PAPOI_TOKEN_ADDRESS,
      FEE_TIER
    )
    console.log("Transaction hash:", tx.hash)
    const receipt = await tx.wait()
    console.log("Pool created. Transaction confirmed in block:", receipt.blockNumber)
  }

  poolAddress = await uniswapFactoryContract.getPool(
    YETI_TOKEN_ADDRESS,
    PAPOI_TOKEN_ADDRESS,
    FEE_TIER
  )
  if (poolAddress === "0x0000000000000000000000000000000000000000") {
    console.log("Error: Pool creation failed.")
    return
  }

  console.log("Deployed pool contract address:", poolAddress)

  // Add liquidity to the pool
  const poolContractAbi = await getAbi(poolAddress)
  const poolContract = new ethers.Contract(
    poolAddress,
    poolContractAbi,
    sepoliaProvider
  )

  // Initialize pool
  const tx = await poolContract.connect(sepoliaWallet).initialize(price.toString(), {
    gasLimit: 3000000,
  })
  console.log("Transaction hash:", tx.hash)
  const receipt = await tx.wait()
  console.log("Pool initialized. Transaction confirmed in block:", receipt.blockNumber)

  const state = await getPoolState(poolContract)

  const configuredPool = new Pool(
    papoiToken,
    yetiToken,
    FEE_TIER,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick
  )

  const position = Position.fromAmounts({
    pool: configuredPool,
    tickLower:
      nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) -
      configuredPool.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) +
      configuredPool.tickSpacing * 2,
    amount0: PAPOI_TOKEN_AMOUNT.toString(),
    amount1: YETI_TOKEN_AMOUNT.toString(),
    useFullPrecision: false,
  })

  const mintOptions = {
    recipient: sepoliaWallet.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10000),
  }

  const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions)

  const transaction = {
    data: calldata,
    to: NF_POSITION_MANAGER_ADDRESS,
    value: value,
    from: sepoliaWallet.address,
    gasLimit: 10000000
  }

  const txRes = await sepoliaWallet.sendTransaction(transaction)
  await txRes.wait()

  console.log("Minted position")
}
