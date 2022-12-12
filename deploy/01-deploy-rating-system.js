// 3 different methods/syntax but the functionality is the same

// function deployFunc() {
//   console.log("hey!")
//   hre.getNamedAccounts()
//   hre.deployments
// }
// module.exports.default = deployFunc

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
//  }

const { network, ethers } = require("hardhat")

module.exports = async ({getNamedAccounts, deployments}) => {
  console.log("Deploying...")
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const ratingSystem = await deploy("RatingSystem", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
}


