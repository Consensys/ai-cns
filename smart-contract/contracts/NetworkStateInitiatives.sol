//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NetworkStateInitiatives is ReentrancyGuard {
    // Struct to store initiatives properties
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

    address public owner; // Owner of the contract
    Initiative[] public initiatives; // Array of initiatives
    mapping(address => uint256) public userCredits; // Remaining credits per user
    mapping(address => mapping(bytes32 => bool)) public hasVoted; // Track if a user has voted on an initiative
    uint256 public constant MAX_CREDITS_PER_USER = 100; // Maximum credit allowed per user
    address payable public networkStateTreasury; // Address of the treasury

    // event emitted when a user's credit balance is updated
    event CreditsUpdated(address user, uint256 newCreditBalance);
    // Event emitted when a new initiative is created
    event InitiativeCreated(
        bytes32 initiativeId,
        address ideator,
        string title,
        string description,
        string category,
        uint256 score
    );
    // Event emitted when a down vote is casted
    event Downvoted(bytes32 initiativeId, address voter, uint256 votesNumber);
    // Event emitted when a status is updated
    event StatusUpdated(bytes32 initiativeId, string newStatus, uint256 timestamp);
    // Event emitted when a up vote is casted
    event Upvoted(bytes32 initiativeId, address voter, uint256 votesNumber);
    // Event emitted when a team member is added
    event TeamMemberAdded(bytes32 initiativeId, address member);
    // Event emitted when a team member is removed
    event TeamMemberRemoved(bytes32 initiativeId, address member);
    // Event emitted when a score is updated
    event ScoreUpdated(bytes32 initiativeId, uint256 newScore);
    // Event emitted when a fund is allocated
    event FundAllocated(bytes32 initiativeId, address funder, uint256 amount);
    // Event emitted when a fund is withdrawn
    event FundingWithdrawn(bytes32 initiativeId, address instigator, uint256 amount);
    // Event emitted when fund is withdrawn in case of emergency
    event EmergencyWithdrawal(address owner, uint256 amount);
    // Event emitted when the network state treasury address is updated
    event NetworkStateTreasuryUpdated(address newReceiver, uint256 timestamp);

    /**
     * @dev Modifier to make a function callable only by the owner.
     * Reverts with a custom error message if the caller is not the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @notice Constructor to initialize the contract with the treasury address.
     * @param _treasuryAddress The address of the treasury.
     */
    constructor(address _treasuryAddress) {
        owner = msg.sender;
        networkStateTreasury = payable(_treasuryAddress);
    }

    /**
     * @notice Allocates funds to a specific initiative.
     * @dev This function allows users to send ETH to fund a specific initiative.
     *      A portion of the sent ETH (10%) is forwarded to the network state treasury.
     * @param _initiativeId The ID of the initiative to fund.
     */
    function allocateFund(bytes32 _initiativeId) public payable nonReentrant {
        require(msg.value > 0, "Must send ETH to fund");
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                uint256 treasuryShare = (msg.value * 10) / 100;
                uint256 initiativeShare = msg.value - treasuryShare;

                (bool success, ) = networkStateTreasury.call{ value: treasuryShare }("");
                require(success, "Ether forwarding to treasury failed");
                initiatives[i].funding += initiativeShare;
                emit FundAllocated(_initiativeId, msg.sender, initiativeShare);
                break;
            }
        }
    }

    /**
     * @notice Creates a new initiative with the given details.
     * @param _ideator The address of the ideator who proposes the initiative.
     * @param _title The title of the initiative.
     * @param _description A detailed description of the initiative.
     * @param _category The category under which the initiative falls.
     * @param _tags An array of tags associated with the initiative.
     * @param _score The initial score of the initiative.
     * @dev Generates a pseudo-UUID for the initiative and stores it in the initiatives array.
     * @dev Emits an InitiativeCreated event upon successful creation of the initiative.
     */

    function createInitiatives(
        address _ideator,
        string memory _title,
        string memory _description,
        string memory _category,
        string[] memory _tags,
        uint256 _score
    ) public {
        bytes32 initiativeId = generatePseudoUUID();
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

    /**
     * @notice Allows a user to upvote an initiative.
     * @dev This function checks that the user has enough credits and has not already voted on the initiative.
     * It also ensures that the number of votes is greater than zero. The function deducts
     * the appropriate number of credits from the user's balance and marks the initiative as upvoted by the user.
     * @param _initiativeId The ID of the initiative to upvote.
     * @param _votesNumber The number of votes to cast for the initiative.
     */
    function upvote(bytes32 _initiativeId, uint256 _votesNumber) public {
        require(_votesNumber > 0, "Votes number must be greater than zero");
        require(!hasVoted[msg.sender][_initiativeId], "Already voted on this initiative");
        uint256 creditCost = _votesNumber * _votesNumber;
        ensureUserHasCredits();
        require(userCredits[msg.sender] >= creditCost, "Not enough credits");
        //TODO: Call NetworkStateAgreement contract to check that the user has signed the agreement
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                initiatives[i].upvotes += _votesNumber;
                userCredits[msg.sender] -= creditCost;
                hasVoted[msg.sender][_initiativeId] = true;
                emit Upvoted(_initiativeId, msg.sender, _votesNumber);
                break;
            }
        }
    }

    /**
     * @notice Allows a user to downvote an initiative.
     * @dev This function implements quadratic voting, where the cost of votes is quadratic.
     * It also ensures that the user has not already voted on the initiative and has enough credits.
     * The function assumes that the user has signed the NetworkStateAgreement contract.
     * @param _initiativeId The ID of the initiative to downvote.
     * @param _votesNumber The number of downvotes to cast.
     */
    function downvote(bytes32 _initiativeId, uint256 _votesNumber) public {
        require(_votesNumber > 0, "Votes number must be greater than zero");
        require(!hasVoted[msg.sender][_initiativeId], "Already voted on this initiative");
        uint256 creditCost = _votesNumber * _votesNumber; // Quadratic cost
        ensureUserHasCredits();
        require(userCredits[msg.sender] >= creditCost, "Not enough credits");
        //TODO: Call NetworkStateAgreement contract to check that the user has signed the agreement
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                initiatives[i].downvotes += _votesNumber;
                userCredits[msg.sender] -= creditCost;
                hasVoted[msg.sender][_initiativeId] = true;
                emit Downvoted(_initiativeId, msg.sender, _votesNumber);
                break;
            }
        }
    }

    /**
     * @notice Updates the status of an initiative.
     * @param _initiativeId The ID of the initiative to update.
     * @param _newStatus The new status to set for the initiative.
     */
    function updateStatus(bytes32 _initiativeId, string memory _newStatus) public {
        require(isValidStatus(_newStatus), "Invalid status");
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                initiatives[i].status = _newStatus;
                if (initiatives[i].upvotes >= initiatives[i].downvotes + 5) {
                    initiatives[i].instigator = msg.sender;
                }
                emit StatusUpdated(_initiativeId, _newStatus, block.timestamp);
                break;
            }
        }
    }

    /**
     * @notice Updates the credit balance of a specified user.
     * @param _user The address of the user whose credit balance is to be updated.
     * @param _newCreditBalance The new credit balance to be assigned to the user.
     */
    function updateUserCredits(address _user, uint256 _newCreditBalance) public {
        require(_newCreditBalance <= MAX_CREDITS_PER_USER, "Credit balance cannot exceed max limit");
        userCredits[_user] = _newCreditBalance;
        emit CreditsUpdated(_user, _newCreditBalance);
    }

    /**
     * @notice Updates the score of a specific initiative.
     * @dev Iterates through the list of initiatives to find the one with the matching ID and updates its score.
     * @param _initiativeId The ID of the initiative to update.
     * @param _newScore The new score to assign to the initiative.
     */
    function updateScore(bytes32 _initiativeId, uint256 _newScore) public onlyOwner {
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                initiatives[i].score = _newScore;
                emit ScoreUpdated(_initiativeId, _newScore);
                break;
            }
        }
    }

    /**
     * @dev Adds a team member to an initiative.
     * @param _initiativeId The ID of the initiative.
     * @param _member The address of the member to add.
     */
    function addTeamMember(bytes32 _initiativeId, address _member) public {
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                initiatives[i].teamMembers.push(_member);
                emit TeamMemberAdded(_initiativeId, _member);
                break;
            }
        }
    }

    /**
     * @dev Removes a team member from an initiative.
     * @param _initiativeId The ID of the initiative.
     * @param _member The address of the member to remove.
     */
    function removeTeamMember(bytes32 _initiativeId, address _member) public {
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                for (uint256 j = 0; j < initiatives[i].teamMembers.length; j++) {
                    if (initiatives[i].teamMembers[j] == _member) {
                        initiatives[i].teamMembers[j] = initiatives[i].teamMembers[
                            initiatives[i].teamMembers.length - 1
                        ];
                        initiatives[i].teamMembers.pop();
                        emit TeamMemberRemoved(_initiativeId, _member);
                        break;
                    }
                }
                break;
            }
        }
    }

    /**
     * @notice Withdraws the funding for a specific initiative.
     * @dev Only the instigator of the initiative can withdraw the funding.
     * @param _initiativeId The ID of the initiative to withdraw funding from.
     */
    function withdrawInitiativeFunding(bytes32 _initiativeId) public {
        for (uint256 i = 0; i < initiatives.length; i++) {
            if (initiatives[i].id == _initiativeId) {
                require(msg.sender == initiatives[i].instigator, "Only instigator can withdraw");
                uint256 amount = initiatives[i].funding;
                require(amount > 0, "No funding available");
                initiatives[i].funding = 0;
                payable(msg.sender).transfer(amount);
                emit FundingWithdrawn(_initiativeId, msg.sender, amount);
                break;
            }
        }
    }

    /**
     * @notice Allows the owner to withdraw all ETH from the contract in case of an emergency.
     * @dev This function can only be called by the owner of the contract.
     */
    function withdrawEmergency() public onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No ETH available");
        payable(owner).transfer(contractBalance);
        emit EmergencyWithdrawal(owner, contractBalance);
    }

    /**
     * @notice Updates the address of the network state treasury.
     * @dev This function can only be called by the owner of the contract.
     * @param _newReceiver The new address to receive the network state treasury funds.
     */
    function updateNetworkStateTreasury(address payable _newReceiver) public onlyOwner {
        require(_newReceiver != address(0), "Invalid address");
        networkStateTreasury = _newReceiver;
        emit NetworkStateTreasuryUpdated(_newReceiver, block.timestamp);
    }

    /**
     * @dev Generates a unique identifier (UUID) based on the current block's timestamp,
     * previous block's random number, sender's address, and the hash of the previous block.
     * This method is an acceptable pseudo-random and deterministic function for generating our UUIDs.
     * @return bytes32 A unique identifier generated using keccak256 hash function.
     */
    function generatePseudoUUID() public view returns (bytes32) {
        return keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, blockhash(block.number - 1)));
    }

    /**
     * @dev Ensures that the user has credits. If the user has no credits,
     * it sets the user's credits to the maximum allowed per user and emits
     * a CreditsUpdated event.
     */
    function ensureUserHasCredits() internal {
        if (userCredits[msg.sender] == 0) {
            userCredits[msg.sender] = MAX_CREDITS_PER_USER;
            emit CreditsUpdated(msg.sender, MAX_CREDITS_PER_USER);
        }
    }

    /**
     * @dev Checks if the provided status is valid.
     * @param _status The status string to validate.
     * @return bool indicating whether the status is valid.
     */
    function isValidStatus(string memory _status) internal view returns (bool) {
        for (uint256 i = 0; i < statusList.length; i++) {
            if (keccak256(abi.encodePacked(statusList[i])) == keccak256(abi.encodePacked(_status))) {
                return true;
            }
        }
        return false;
    }
}
