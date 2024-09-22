// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

// const { TimelockController } = require("@openzeppelin/contracts/governance/TimelockControl.sol")

async function main() {
  // Deploy MyToken
  const MyToken = await hre.ethers.getContractFactory('MyToken')
  let myToken = await MyToken.deploy()

  await myToken.deployed()
  console.log(`Token deployed to: ${myToken.address}\n`)

  const accounts = await ethers.getSigners()
  const admin = accounts[0]

  // Deploy TimelockController
  const TimelockController = await hre.ethers.getContractFactory('TimelockController')
  let timelock = await TimelockController.deploy('5', [], [], admin.address)

  // Deploy MyGovernor
  const MyGovernor = await hre.ethers.getContractFactory('MyGovernor')
  const myGovernor = await MyGovernor.deploy(myToken.address, timelock)
  await myGovernor.deployed()

  console.log(`myGovernor deployed to: ${myGovernor.address}\n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
