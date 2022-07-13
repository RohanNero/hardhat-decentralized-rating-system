require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()
require("solidity-coverage")
require("hardhat-deploy")


const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY
const RINKEBY_URL = process.env.RINKEBY_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

module.exports = {
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0,       // similarly on mainnet it will take the first account as deployer. 
                  // Note though that depending on how hardhat network are configured, 
                  // the account 0 on one network can be different than on another
    },

  },
  solidity: "0.8.7",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
    rinkeby: {
      url: RINKEBY_URL || "",
      accounts: [RINKEBY_PRIVATE_KEY],
      chainId: 4,
      blockConfirmations: 7,
    },
  },
  gasReporter: {
    enabled: false,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
}
