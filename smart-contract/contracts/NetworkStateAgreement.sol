// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
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

    string[] public userProfileTypeAllowedList = ["maker", "instigator", "investor"];
    string[] public userNatureAgentAllowedList = ["AI", "human"];
    uint256 public constant MAX_CREDITS_PER_USER = 100;

    address public owner;
    NetworkStateInitiatives public initiativesContract;

    address payable public networkStateTreasury;
    string public constitutionURL;
    mapping(address => UserInfo) public userInformation;

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(string memory _constitutionURL, address _initiativesAddress, address _treasuryAddress) {
        require(_initiativesAddress != address(0), "Invalid initiatives address");
        require(_treasuryAddress != address(0), "Invalid treasury address");

        owner = msg.sender;
        networkStateTreasury = payable(_treasuryAddress);
        initiativesContract = NetworkStateInitiatives(_initiativesAddress);
        constitutionURL = _constitutionURL;
    }

    /**
     * @notice Allows a user to sign the agreement.
     * @dev The signature binds the caller, agreement contract, chain, profile, agent nature, and constitution hash.
     */
    function signAgreement(
        string memory _userProfileType,
        string memory _userNatureAgent,
        bytes32 _constitutionHash,
        bytes memory _signature
    ) public payable nonReentrant {
        require(!userInformation[msg.sender].hasAgreed, "Agreement already signed");
        require(isValidProfileType(_userProfileType), "Invalid profile type");
        require(isValidNatureAgent(_userNatureAgent), "Invalid nature agent");

        bytes32 payloadHash = keccak256(
            abi.encode(address(this), block.chainid, msg.sender, _userProfileType, _userNatureAgent, _constitutionHash)
        );
        address recoveredSigner = ECDSA.recover(ECDSA.toEthSignedMessageHash(payloadHash), _signature);
        require(recoveredSigner == msg.sender, "Invalid signature");

        if (msg.value > 0) {
            (bool success, ) = networkStateTreasury.call{ value: msg.value }("");
            require(success, "Ether forwarding failed");
        }

        initiativesContract.updateUserCredits(msg.sender, MAX_CREDITS_PER_USER);
        userInformation[msg.sender] = UserInfo({
            userProfileType: _userProfileType,
            userNatureAgent: _userNatureAgent,
            constitutionHash: _constitutionHash,
            signature: _signature,
            hasAgreed: true
        });
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
     * @notice Returns whether an address has signed the agreement.
     * @param _user The address to check.
     * @return True when the address has a recorded, verified agreement.
     */
    function hasAgreed(address _user) external view returns (bool) {
        return userInformation[_user].hasAgreed;
    }

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

    function updateConstitutionURL(string memory _constitutionURL) public onlyOwner {
        constitutionURL = _constitutionURL;
        emit ConstitutionUpdated(_constitutionURL, block.timestamp);
    }

    function updateNetworkStateTreasury(address payable _newReceiver) public onlyOwner {
        require(_newReceiver != address(0), "Invalid address");
        networkStateTreasury = _newReceiver;
        emit NetworkStateTreasuryUpdated(_newReceiver, block.timestamp);
    }

    function updateInitiativesContract(address _initiativesContract) public onlyOwner {
        require(_initiativesContract != address(0), "Invalid address");
        initiativesContract = NetworkStateInitiatives(_initiativesContract);
        emit InitiativesContractAdressUpdated(_initiativesContract, block.timestamp);
    }
}
