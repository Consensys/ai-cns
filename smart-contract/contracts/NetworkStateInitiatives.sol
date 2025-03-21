//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

contract NetworkStateInitiatives {
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
    }

    string[] public statusList = ["IDEATION", "CAPITAL_ALLOCATION", "BUILDING"];

    address public owner; // Owner of the contract
    Initiative[] public initiatives; // Array of initiatives
    mapping(address => uint256) public userCredits; // Remaining credits per user
    mapping(address => mapping(bytes32 => bool)) public hasVoted; // Track if a user has voted on an initiative
    uint256 public constant MAX_CREDITS_PER_USER = 100; // Maximum credit allowed per user

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

    /**
     * @dev Modifier to make a function callable only by the owner.
     * Reverts with a custom error message if the caller is not the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @dev Constructor that sets the initial constitution hash and assigns the contract owner.
     */
    constructor() {
        owner = msg.sender;
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
            score: _score
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
    function updateScore(bytes32 _initiativeId, uint256 _newScore) public {
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
