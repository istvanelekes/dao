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

    const  accounts = await ethers.getSigners()
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
    const token = await ethers.getContractAt('Token', config[chainId].token.address)
    console.log(`Token fetched: ${token.address}\n`)

    // Send tokens to investors - each one gets 20%
    transaction = await token.transfer(investor1.address, tokens(200000))
    await transaction.wait()

    transaction = await token.transfer(investor2.address, tokens(200000))
    await transaction.wait()

    transaction = await token.transfer(investor3.address, tokens(200000))
    await transaction.wait()

    // Fetch deployed DAO
    const dao = await ethers.getContractAt('DAO', config[chainId].dao.address)
    console.log(`DAO fetched: ${dao.address}\n`)

    // Fetch deployed USDC
    const usdc = await ethers.getContractAt("UsdCoin", config[chainId].usdc.address)
    console.log(`USDC fetched: ${usdc.address}\n`)

    // Funder sends 1000 Ether to DAO treasury for Governance
    transaction = await funder.sendTransaction({ to: dao.address, value: ether(1000) })
    await transaction.wait()

    transaction = await usdc.connect(funder).mint(dao.address, 20000)
    await transaction.wait()

    console.log(`Sent fund to dao treasury...\n`)

    for (let i = 0; i < 3; i++) {
        // Create proposal
        transaction = await dao.connect(investor1).createProposal(`Proposal ${i + 1}`, `Proposal description ${i + 1}`, usdc.address, 2000, recipient.address)
        await transaction.wait()

        // Vote 1
        transaction = await dao.connect(investor1).vote(i + 1, true)
        await transaction.wait()

        // Vote 2
        transaction = await dao.connect(investor2).vote(i + 1, true)
        await transaction.wait()

        // Vote 3
        transaction = await dao.connect(investor3).vote(i + 1, true)
        await transaction.wait()

        // Finalize
        transaction = await dao.connect(investor1).finalizeProposal(i + 1)
        await transaction.wait()

        console.log(`Created and finalized Proposal ${i + 1} \n`)
    }

    console.log(`Creating one more proposal... \n`)

    transaction = await dao.connect(investor1).createProposal(`Proposal 4`, `Proposal 4 description`, usdc.address, 2000, recipient.address)
    await transaction.wait()

    transaction = await dao.connect(investor2).vote(4, true)
    await transaction.wait()

    transaction = await dao.connect(investor3).vote(4, true)
    await transaction.wait()

    console.log(`Finished \n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
