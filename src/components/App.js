import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Create from './Create';
import Proposals from './Proposals';
import Loading from './Loading';

// ABIs: Import your contract ABIs here
import DAO_ABI from '../abis/DAO.json'

// Config: Import your network config here
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [dao, setDao] = useState(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)

  const [account, setAccount] = useState(null)
  const [proposals, setProposals] = useState(null)
  const [balances, setBalances] = useState(null)
  const [voted, setVoted] = useState(null)

  const [quorum, setQuorum] = useState(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // Initiate contracts
    const dao = new ethers.Contract(config[31337].dao.address, DAO_ABI, provider)
    setDao(dao)

    let treasuryBalance = await provider.getBalance(dao.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18)
    setTreasuryBalance(treasuryBalance)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    //Fetch proposals
    const count = await dao.proposalCount()
    const items = []
    const balances = []
    const voted = []

    for (var i = 0; i < count; i++) {
      const proposal = await dao.proposals(i + 1)
      // FIXME: can't read from contract: isVoted 
      // const isVoted = await dao.isVoted(account, i + 1)
      const isVoted = false

      let balance = await provider.getBalance(proposal.recipient)
      balance = ethers.utils.formatUnits(balance, 'ether')

      items.push(proposal)
      balances.push(balance)
      voted.push(isVoted)
    }

    setProposals(items)
    setBalances(balances)
    setVoted(voted)
    setQuorum(await dao.quorum())

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Welcome to our DAO!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Create
            provider={provider}
            dao={dao}
            setIsLoading={setIsLoading}
          />
          <hr/>
          <p className='text-center'><strong>Treasury Balance:</strong> {treasuryBalance}</p>
          <hr/>
          <p className='text-center'><strong>Quorum:</strong> {quorum.toString()}</p>
          <hr/>

          <Proposals
            provider={provider}
            dao={dao}
            proposals={proposals}
            balances={balances}
            quorum={quorum}
            voted={voted}
            setIsLoading={setIsLoading}
          />
        </>
      )}
    </Container>
  )
}

export default App;
