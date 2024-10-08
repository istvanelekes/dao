// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
  
const ether = tokens

async function main() {
    console.log(`Fetching accounts & network...\n`)

    const accounts = await ethers.getSigners()
    const funder = accounts[0]
    const investor1 = accounts[1]
    const investor2 = accounts[2]
    const investor3 = accounts[3]
    const recipient = accounts[4]

    let transaction

    // Fetch network
    const { chainId } = await ethers.provider.getNetwork()

    console.log(`Fetching token & transferring to accounts...\n`)

    // Fetch deployed token
    const myToken = await ethers.getContractAt('MyToken', config[chainId].token.address)
    console.log(`Token fetched: ${token.address}\n`)

    // Send tokens to investors - each one gets 20%
    transaction = await token.transfer(investor1.address, tokens(200000))
    await transaction.wait()

    transaction = await token.transfer(investor2.address, tokens(200000))
    await transaction.wait()

    transaction = await token.transfer(investor3.address, tokens(200000))
    await transaction.wait()

    // Fetch deployed DAO
    const governor = await ethers.getContractAt('MyGovernor', config[chainId].dao.address)
    console.log(`Governor fetched: ${dao.address}\n`)

    // Funder sends 1000 Ether to DAO treasury for Governance
    transaction = await funder.sendTransaction({ to: governor.address, value: ether(1000) })
    await transaction.wait()

    transaction = await myToken.connect(funder).mint(governor.address, 20000)
    await transaction.wait()

    console.log(`Sent fund to governor treasury...\n`)


    console.log(`Creating a proposal... \n`)

    // const tokenAddress = ...;
    // const token = await ethers.getContractAt(‘ERC20’, tokenAddress);

    const grantAmount = 2000
    const transferCalldata = myToken.interface.encodeFunctionData('transfer', [recipient, grantAmount])

    transaction = await governor.connect(investor1).propose(
        [myToken.address],
        [0],
        [transferCalldata],
        "Proposal #1: Give grant to team"
    )
    await transaction.wait()

    console.log(`Transaction: ${transaction} \n`)

    console.log(`Finished \n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
