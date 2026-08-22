// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface INetworkStateAgreement {
    function hasAgreed(address _user) external view returns (bool) {
    return userInformation[_user].hasAgreed;
}

contract NetworkStateInitiatives is ReentrancyGuard {
    struct Initiative {
        bytes32 id;
        address ideator;
        address instigator;
        string title;
        string description;
        string category;
        string[] tags;
        uint256 timestamp;
        string status;
        uint256 upvotes;
        uint256 downvotes;
        address[] teamMembers;
        uint256 score;
        uint256 funding;
    }

    string[] public statusList = ["IDEATION", "CAPITAL_ALLOCATION", "BUILDING"];

    address public owner;
    Initiative[] public initiatives;
    mapping(address => uint256) public userCredits;
    mapping(address => mapping(bytes32 => bool)) public hasVoted;
    mapping(address => uint256) private initiativeNonces;
    uint256 public constant MAX_CREDITS_PER_USER = 100;
    address payable public networkStateTreasury;
    address public agreementContract;

    event CreditsUpdated(address user, uint256 newCreditBalance);
    event InitiativeCreated(
        bytes32 initiativeId,
        address ideator,
        string title,
        string description,
        string category,
        uint256 score
    );
    event Downvoted(bytes32 initiativeId, address voter, uint256 votesNumber);
    event StatusUpdated(bytes32 initiativeId, string newStatus, uint256 timestamp);
    event Upvoted(bytes32 initiativeId, address voter, uint256 votesNumber);
    event TeamMemberAdded(bytes32 initiativeId, address member);
    event TeamMemberRemoved(bytes32 initiativeId, address member);
    event ScoreUpdated(bytes32 initiativeId, uint256 newScore);
    event FundAllocated(bytes32 initiativeId, address funder, uint256 amount);
    event FundingWithdrawn(bytes32 initiativeId, address instigator, uint256 amount);
    event EmergencyWithdrawal(address owner, uint256 amount);
    event NetworkStateTreasuryUpdated(address newReceiver, uint256 timestamp);
    event AgreementContractUpdated(address newAgreementContract);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyCreditManager() {
        require(msg.sender == owner || msg.sender == agreementContract, "Only credit manager can call this");
        _;
    }

    constructor(address _treasuryAddress) {
        require(_treasuryAddress != address(0), "Invalid treasury address");
        owner = msg.sender;
        networkStateTreasury = payable(_treasuryAddress);
    }

    /**
     * @notice Configures the agreement contract that authorizes membership and initial credits.
     * @param _agreementContract The deployed agreement contract address.
     */
    function setAgreementContract(address _agreementContract) public onlyOwner {
        require(_agreementContract != address(0), "Invalid agreement address");
        agreementContract = _agreementContract;
        emit AgreementContractUpdated(_agreementContract);
    }

    function allocateFund(bytes32 _initiativeId) public payable nonReentrant {
        require(msg.value > 0, "Must send ETH to fund");
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        uint256 treasuryShare = (msg.value * 10) / 100;
        uint256 initiativeShare = msg.value - treasuryShare;

        (bool success, ) = networkStateTreasury.call{ value: treasuryShare }("");
        require(success, "Ether forwarding to treasury failed");
        initiatives[initiativeIndex].funding += initiativeShare;
        emit FundAllocated(_initiativeId, msg.sender, initiativeShare);
    }

    function createInitiatives(
        address _ideator,
        string memory _title,
        string memory _description,
        string memory _category,
        string[] memory _tags,
        uint256 _score
    ) public {
        require(_ideator == msg.sender, "Ideator must be caller");

        bytes32 initiativeId = generatePseudoUUID();
        initiativeNonces[msg.sender]++;
        Initiative memory newInitiative = Initiative({
            id: initiativeId,
            ideator: _ideator,
            instigator: address(0),
            title: _title,
            description: _description,
            category: _category,
            tags: _tags,
            timestamp: block.timestamp,
            status: statusList[0],
            upvotes: 0,
            downvotes: 0,
            teamMembers: new address[](0),
            score: _score,
            funding: 0
        });
        initiatives.push(newInitiative);
        emit InitiativeCreated(initiativeId, _ideator, _title, _description, _category, _score);
    }

    function upvote(bytes32 _initiativeId, uint256 _votesNumber) public {
        _requireAgreement();
        require(_votesNumber > 0, "Votes number must be greater than zero");
        require(!hasVoted[msg.sender][_initiativeId], "Already voted on this initiative");
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        uint256 creditCost = _votesNumber * _votesNumber;
        require(userCredits[msg.sender] >= creditCost, "Not enough credits");

        initiatives[initiativeIndex].upvotes += _votesNumber;
        userCredits[msg.sender] -= creditCost;
        hasVoted[msg.sender][_initiativeId] = true;
        emit Upvoted(_initiativeId, msg.sender, _votesNumber);
    }

    function downvote(bytes32 _initiativeId, uint256 _votesNumber) public {
        _requireAgreement();
        require(_votesNumber > 0, "Votes number must be greater than zero");
        require(!hasVoted[msg.sender][_initiativeId], "Already voted on this initiative");
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        uint256 creditCost = _votesNumber * _votesNumber;
        require(userCredits[msg.sender] >= creditCost, "Not enough credits");

        initiatives[initiativeIndex].downvotes += _votesNumber;
        userCredits[msg.sender] -= creditCost;
        hasVoted[msg.sender][_initiativeId] = true;
        emit Downvoted(_initiativeId, msg.sender, _votesNumber);
    }

    function updateStatus(bytes32 _initiativeId, string memory _newStatus) public onlyOwner {
        require(isValidStatus(_newStatus), "Invalid status");
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        initiatives[initiativeIndex].status = _newStatus;
        if (initiatives[initiativeIndex].upvotes >= initiatives[initiativeIndex].downvotes + 5) {
            initiatives[initiativeIndex].instigator = msg.sender;
        }
        emit StatusUpdated(_initiativeId, _newStatus, block.timestamp);
    }

    function updateUserCredits(address _user, uint256 _newCreditBalance) public onlyCreditManager {
        require(_user != address(0), "Invalid user address");
        require(_newCreditBalance <= MAX_CREDITS_PER_USER, "Credit balance cannot exceed max limit");
        userCredits[_user] = _newCreditBalance;
        emit CreditsUpdated(_user, _newCreditBalance);
    }

    function updateScore(bytes32 _initiativeId, uint256 _newScore) public onlyOwner {
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        initiatives[initiativeIndex].score = _newScore;
        emit ScoreUpdated(_initiativeId, _newScore);
    }

    function addTeamMember(bytes32 _initiativeId, address _member) public {
        require(_member != address(0), "Invalid member address");
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        require(
            msg.sender == owner ||
                msg.sender == initiatives[initiativeIndex].ideator ||
                msg.sender == initiatives[initiativeIndex].instigator,
            "Only initiative managers can update team members"
        );
        initiatives[initiativeIndex].teamMembers.push(_member);
        emit TeamMemberAdded(_initiativeId, _member);
    }

    function removeTeamMember(bytes32 _initiativeId, address _member) public {
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        require(
            msg.sender == owner ||
                msg.sender == initiatives[initiativeIndex].ideator ||
                msg.sender == initiatives[initiativeIndex].instigator,
            "Only initiative managers can update team members"
        );
        for (uint256 j = 0; j < initiatives[initiativeIndex].teamMembers.length; j++) {
            if (initiatives[initiativeIndex].teamMembers[j] == _member) {
                initiatives[initiativeIndex].teamMembers[j] = initiatives[initiativeIndex].teamMembers[
                    initiatives[initiativeIndex].teamMembers.length - 1
                ];
                initiatives[initiativeIndex].teamMembers.pop();
                emit TeamMemberRemoved(_initiativeId, _member);
                return;
            }
        }
        revert("Team member not found");
    }

    function withdrawInitiativeFunding(bytes32 _initiativeId) public nonReentrant {
        uint256 initiativeIndex = _requireInitiative(_initiativeId);
        require(msg.sender == initiatives[initiativeIndex].instigator, "Only instigator can withdraw");
        uint256 amount = initiatives[initiativeIndex].funding;
        require(amount > 0, "No funding available");
        initiatives[initiativeIndex].funding = 0;

        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Funding transfer failed");
        emit FundingWithdrawn(_initiativeId, msg.sender, amount);
    }

    function withdrawEmergency() public onlyOwner nonReentrant {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No ETH available");

        (bool success, ) = payable(owner).call{ value: contractBalance }("");
        require(success, "Emergency transfer failed");
        emit EmergencyWithdrawal(owner, contractBalance);
    }

    function updateNetworkStateTreasury(address payable _newReceiver) public onlyOwner {
        require(_newReceiver != address(0), "Invalid address");
        networkStateTreasury = _newReceiver;
        emit NetworkStateTreasuryUpdated(_newReceiver, block.timestamp);
    }

    function generatePseudoUUID() public view returns (bytes32) {
        return keccak256(abi.encode(address(this), block.chainid, msg.sender, initiativeNonces[msg.sender]));
    }

    function isValidStatus(string memory _status) internal view returns (bool) {
        for (uint256 i = 0; i < statusList.length; i++) {
            if (keccak256(abi.encodePacked(statusList[i])) == keccak256(abi.encodePacked(_status))) {
                return true;
            }
        }
        return false;
    }

    function _requireAgreement() internal view {
        require(agreementContract != address(0), "Agreement contract not configured");
        require(INetworkStateAgreement(agreementContract).hasAgreed(msg.sender), "Agreement not signed");
    }

    function _requireInitiative(bytes32 _initiativeId) internal view returns (uint256) {
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                return i;
            }
        }
        revert("Initiative not found");
    }
}
