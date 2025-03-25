//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { NetworkStateInitiatives } from "./NetworkStateInitiatives.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NetworkStateAgreement is ReentrancyGuard {
    struct UserInfo {
        string userProfileType;
        string userNatureAgent;
        bytes32 constitutionHash;
        bytes signature;
        bool hasAgreed;
    }

    string[] public userProfileTypeAllowedList = ["maker", "instigator", "investor"]; // Allowed user profile types
    string[] public userNatureAgentAllowedList = ["AI", "human"]; // Allowed user nature agents
    uint256 public constant MAX_CREDITS_PER_USER = 100; // Maximum credit allowed per user

    address public owner; // Owner of the contract
    NetworkStateInitiatives public initiativesContract; // Reference to the Initiatives contract

    address payable public networkStateTreasury; // Address of the treasury contract
    string public constitutionURL; // URL pointing to the constitution document
    mapping(address => UserInfo) public userInformation; // Mapping of users to their information

    event AgreementSigned(
        address indexed user,
        string userProfileType,
        string userNatureAgent,
        bytes32 constitutionHash,
        uint256 etherAmount,
        uint256 timestamp
    );
    event ConstitutionUpdated(string newURL, uint256 timestamp);
    event NetworkStateTreasuryUpdated(address newReceiver, uint256 timestamp);
    event InitiativesContractAdressUpdated(address newAddress, uint256 timestamp);

    /**
     * @dev Modifier to make a function callable only by the owner.
     * Reverts with a custom error message if the caller is not the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @notice Constructor to initialize the contract with the constitution URL,
     * initiatives contract address, and treasury address.
     * @param _constitutionURL The URL of the constitution document.
     * @param _initiativesAddress The address of the initiatives contract.
     * @param _treasuryAddress The address of the treasury.
     */
    constructor(string memory _constitutionURL, address _initiativesAddress, address _treasuryAddress) {
        owner = msg.sender;
        networkStateTreasury = payable(_treasuryAddress);
        initiativesContract = NetworkStateInitiatives(_initiativesAddress);
        constitutionURL = _constitutionURL;
    }

    /**
     * @notice Allows a user to sign the agreement.
     * @dev The user must not have signed the agreement before.
     * The user profile type and nature agent must be valid.
     * @param _userProfileType The profile type of the user.
     * @param _userNatureAgent The nature agent of the user.
     * @param _constitutionHash The hash of the constitution document.
     * @param _signature The signature of the user.
     */
    function signAgreement(
        string memory _userProfileType,
        string memory _userNatureAgent,
        bytes32 _constitutionHash,
        bytes memory _signature
    ) public payable nonReentrant {
        //TODO: Implement signature verification
        require(!userInformation[msg.sender].hasAgreed, "Agreement already signed");
        require(isValidProfileType(_userProfileType), "Invalid profile type");
        require(isValidNatureAgent(_userNatureAgent), "Invalid nature agent");

        userInformation[msg.sender] = UserInfo({
            userProfileType: _userProfileType,
            userNatureAgent: _userNatureAgent,
            constitutionHash: _constitutionHash,
            signature: _signature,
            hasAgreed: true
        });
        if (msg.value > 0) {
            (bool success, ) = networkStateTreasury.call{ value: msg.value }("");
            require(success, "Ether forwarding failed");
        }
        initiativesContract.updateUserCredits(msg.sender, MAX_CREDITS_PER_USER);
        emit AgreementSigned(
            msg.sender,
            _userProfileType,
            _userNatureAgent,
            _constitutionHash,
            msg.value,
            block.timestamp
        );
    }

    /**
     * @dev Checks if the given profile type is valid.
     * @param _profileType The profile type to check.
     * @return bool Returns true if the profile type is in the allowed list, false otherwise.
     */
    function isValidProfileType(string memory _profileType) internal view returns (bool) {
        for (uint256 i = 0; i < userProfileTypeAllowedList.length; i++) {
            if (
                keccak256(abi.encodePacked(userProfileTypeAllowedList[i])) == keccak256(abi.encodePacked(_profileType))
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Checks if the provided nature agent is valid by comparing it against the allowed list.
     * @param _natureAgent The nature agent to be validated.
     * @return bool Returns true if the nature agent is in the allowed list, otherwise false.
     */
    function isValidNatureAgent(string memory _natureAgent) internal view returns (bool) {
        for (uint256 i = 0; i < userNatureAgentAllowedList.length; i++) {
            if (
                keccak256(abi.encodePacked(userNatureAgentAllowedList[i])) == keccak256(abi.encodePacked(_natureAgent))
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Updates the URL of the constitution.
     * @dev This function can only be called by the owner of the contract.
     * @param _constitutionURL The new URL of the constitution.
     */
    function updateConstitutionURL(string memory _constitutionURL) public onlyOwner {
        constitutionURL = _constitutionURL;
        emit ConstitutionUpdated(_constitutionURL, block.timestamp);
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
     * @notice Updates the address of the initiatives contract.
     * @dev This function sets a new address for the initiatives contract and emits an event.
     * @param _initiativesContract The address of the new initiatives contract. Must not be the zero address.
     */
    function updateInitiativesContract(address _initiativesContract) public onlyOwner {
        require(_initiativesContract != address(0), "Invalid address");
        initiativesContract = NetworkStateInitiatives(_initiativesContract);
        emit InitiativesContractAdressUpdated(_initiativesContract, block.timestamp);
    }
}
