import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { ethers } from 'ethers'

const Proposals = ({ provider, dao, proposals, balances, quorum, account, setIsLoading }) => {
    const voteHandler = async (id) => {
        try {
            const signer = await provider.getSigner()
            const transaction = await dao.connect(signer).vote(id)
            await transaction.wait()
        } catch {
            window.alert("User rejected or transaction reverted")
        }

        setIsLoading(true)
    }

    const finalizeHandler = async (id) => {
        try {
            const signer = await provider.getSigner()
            const transaction = await dao.connect(signer).finalizeProposal(id)
            await transaction.wait()
        } catch {
            window.alert("User rejected or transaction reverted")
        }

        setIsLoading(true)
    }

    const balanceOf = async (address) => {
        let balance = await provider.getBalance(address)
        balance = ethers.utils.formatUnits(balance, 'ether')
        return balance
    }

    function voted(index) {
        // FIXME: something wrong with the DAO_ABI, votes are not visible 
        // const voted = await dao.votes[account][index]
        return false
    }

    return (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Proposal Name</th>
              <th>Recipient Address</th>
              <th>Recipient Balance</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Total Votes</th>
              <th>Cast Vote</th>
              <th>Finalize</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal, index) => (
              <tr key={index}>
                <td>{proposal.id.toString()}</td>
                <td>{proposal.name}</td>
                <td>{proposal.recipient}</td>
                <td>{balances[index]} ETH</td>
                <td>{ethers.utils.formatUnits(proposal.amount, "ether")} ETH</td>
                <td>{proposal.finalized ? "Approved" : "In Progress"}</td>
                <td>{proposal.votes.toString()}</td>
                <td>
                    {!proposal.finalized && !voted(index) && (
                        <Button 
                            variant='primary'
                            style={{ width: '100%'}}
                            onClick={() => voteHandler(proposal.id)}
                        >
                            Vote
                        </Button>
                    )}
                </td>
                <td>
                    {!proposal.finalized && proposal.votes > quorum && (
                        <Button 
                        variant='primary'
                        style={{ width: '100%'}}
                        onClick={() => finalizeHandler(proposal.id)}
                        >
                            Finalize
                        </Button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
}

export default Proposals;