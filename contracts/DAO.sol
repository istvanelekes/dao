//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";
import "./Token.sol";

contract DAO {
    address owner;
    Token public token;
    uint256 public quorum;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) private votes;

    struct Proposal {
        uint256 id;
        string name;
        string description;
        ERC20 payoutToken;
        uint256 amount;
        address payable recipient;
        int256 votes;
        bool finalized;
    }

    event Propose(uint256 id, uint256 amount, address recipient, address creator);
    event Vote(uint256 id, address investor);
    event Finalize(uint256 id);

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    // Allow contract to receive ether
    receive() external payable {}

    modifier onlyInvestor {
        require(token.balanceOf(msg.sender) > 0, "must be token holder");
        _;
    }

    function createProposal(
        string memory _name,
        string memory _description,
        ERC20 payoutToken,
        uint256 _amount,
        address payable _recipient
    ) external onlyInvestor {
        // require(address(this).balance >= _amount, "ether balance must be bigger than amount");
        require(payoutToken.balanceOf(address(this)) >= _amount);

        proposalCount++;

        // Create a proposal

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _description,
            payoutToken,
            _amount,
            _recipient,
            0,
            false
        );

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
        
    }

    function isVoted(address account, uint256 _id) external view returns(bool) {
        return votes[account][_id];
    }

    function vote(uint256 _id, bool _inFavor) external onlyInvestor {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Don't let investors vote twice
        require(votes[msg.sender][_id] == false, "already voted");

        // update votes
        int256 balance = int256(token.balanceOf(msg.sender));
        proposal.votes += _inFavor ? balance : -balance;

        // Track that user has voted
        votes[msg.sender][_id] = true;

        // Emit an event
        emit Vote(_id, msg.sender);
    }

    // Finalze proposal & transfer funds
    function finalizeProposal(uint256 _id) external onlyInvestor {
        // Fetch proposal 
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // Mark proposal as finalized
        proposal.finalized = true;

        // Check that proposal has enough votes
        require(proposal.votes >= int256(quorum), "must reach quorum to finalize proposal");

        // Check that the contract has enough ether
        require(proposal.payoutToken.balanceOf(address(this)) >= proposal.amount);

        // Transfer the funds to recipient
        require(proposal.payoutToken.transfer(proposal.recipient, proposal.amount));

        // Emit event
        emit Finalize(_id);
    }
}