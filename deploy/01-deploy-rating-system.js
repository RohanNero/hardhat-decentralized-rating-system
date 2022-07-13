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

const { network, getNamedAccounts } = require("hardhat")

module.exports = async function ({getNamedAccounts, deployments}) {
  console.log("hi!")
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const ratingSystem = await deploy("RatingSystem", {
    from: deployer,
    args: [deployer],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
}


