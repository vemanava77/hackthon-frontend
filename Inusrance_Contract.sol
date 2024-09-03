// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PolicyNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    constructor(string memory name, string memory symbol, address owner) 
        ERC721(name, symbol)
        Ownable(owner) // Pass the owner address here
    {
        tokenCounter = 0;
    }

    function createPolicyNFT(address policyholder, string memory tokenURI) public returns (uint256) {
        tokenCounter++;
        _mint(policyholder, tokenCounter);
        _setTokenURI(tokenCounter, tokenURI);

        return tokenCounter;
    }
     function setTokenURI(uint256 tokenId, string memory _tokenURI) public  {
        _setTokenURI(tokenId, _tokenURI);
    }
    function approve(address to, uint256 tokenId) public virtual override(ERC721, IERC721) {
    address owner = ownerOf(tokenId);
    require(to != owner, "ERC721: approval to current owner");

    require(
        _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
        "ERC721: approve caller is not owner nor approved for all"
    );

    // Call the original approve logic from ERC721
    super.approve(to, tokenId);
}


    
}

contract InsuranceMarketplace {
    PolicyNFT public policyNFT;

    // Mappings should be placed inside the contract body, like this:
    mapping(uint256 => UserPolicy) public tokenIdToPolicy;
    mapping(uint256 => uint256) public policyToTokenId;

    

    constructor() {
        // Deploy PolicyNFT within this contract with the owner as the deployer
        policyNFT = new PolicyNFT("InsurancePolicyNFT", "IPNFT", msg.sender);
    }

    enum PolicyType { Delay, Cancellation, Accident }
    enum ClaimStatus { Submitted, Approved, Rejected }

    struct PolicyTemplate {
        uint256 id;
        address provider;
        uint256 premium;
        uint256 coverage;
        uint256 duration; // Duration in seconds, e.g., 7 days = 7 * 24 * 60 * 60
        string description;
        PolicyType policyType;
    }

    struct UserPolicy {
        uint256 policyId;
        address policyholder;
        uint256 premium;
        uint256 coverage;
        uint256 expirationDate;
        PolicyType policyType;
        bool active;
        bool expired;
        bool claimed;
    }

    struct Claim {
        uint256 id; // Unique claim ID
        uint256 policyId;
        address claimant;
        uint256 coverageAmount;
        string evidenceURI; // Link to off-chain claim evidence
        ClaimStatus status;
        uint256 submissionDate;
        uint256 expirationDate;
    }

    

    PolicyTemplate[] public policyTemplates;
    mapping(address => UserPolicy[]) public userPolicies;
    mapping(address => Claim[]) public userClaims;

    uint256 public policyIdCounter;
    uint256 public claimIdCounter;

    event PolicyTemplateListed(address indexed provider, uint256 policyId, uint256 premium, uint256 coverage, uint256 expirationDate, PolicyType policyType, uint256 timestamp);
    event PolicyBought(address indexed buyer, uint256 policyId, PolicyType policyType, uint256 timestamp);
    event ClaimSubmitted(address indexed claimant, uint256 claimId, uint256 policyId, uint256 coverageAmount, uint256 timestamp);
    event ClaimApproved(address indexed claimant, uint256 claimId, uint256 policyId, uint256 coverageAmount, uint256 timestamp);
    event ClaimRejected(address indexed claimant, uint256 claimId, uint256 policyId, uint256 timestamp);
    event PolicyTransferred(address indexed oldOwner, address indexed newOwner, uint256 indexed tokenId);

    // Providers list policy templates for sale
    function listPolicyTemplate(uint256 _premium, uint256 _coverage, uint256 _duration, PolicyType _policyType, string memory _description) public {
        policyIdCounter++;
        PolicyTemplate memory newTemplate = PolicyTemplate({
            id: policyIdCounter,
            provider: msg.sender,
            premium: _premium,
            coverage: _coverage,
            duration: _duration, // Set the duration
            description: _description,
            policyType: _policyType
        });

        policyTemplates.push(newTemplate);
        emit PolicyTemplateListed(msg.sender, policyIdCounter, _premium, _coverage, _duration, _policyType, block.timestamp);
    }
function buyPolicyFromProvider(uint256 _policyId) public payable {
    PolicyTemplate memory template = policyTemplates[_policyId];
    require(msg.value == template.premium, "Incorrect premium amount");

    uint256 expirationDate = block.timestamp + template.duration; // Calculate the expiration date

    UserPolicy memory newUserPolicy = UserPolicy({
        policyId: _policyId,
        policyholder: msg.sender,
        premium: template.premium,
        coverage: template.coverage,
        expirationDate: expirationDate, // Set expiration date
        policyType: template.policyType,
        active: true,
        expired: false,
        claimed: false
    });

    userPolicies[msg.sender].push(newUserPolicy);

    // Mint an NFT without specifying a tokenURI initially
    uint256 tokenId = policyNFT.createPolicyNFT(msg.sender, "");
    policyToTokenId[_policyId] = tokenId;
    tokenIdToPolicy[tokenId] = newUserPolicy;

    // Generate the final tokenURI after minting
    string memory finalTokenURI = generateTokenURI(tokenId, newUserPolicy);
    policyNFT.setTokenURI(tokenId, finalTokenURI);

    (bool success, ) = template.provider.call{value: msg.value}("");
    require(success, "Transfer to provider failed");

    emit PolicyBought(msg.sender, _policyId, template.policyType, block.timestamp);
}

// Function to generate the tokenURI based on policy details
function generateTokenURI(uint256 tokenId, UserPolicy memory policy) internal pure returns (string memory) {
    // Construct the tokenURI using the tokenId and policy details
    // This is a simple example; in a real scenario, you might construct a JSON object and upload it to IPFS or another storage solution
    return string(abi.encodePacked(
        "https://example.com/metadata/",
        uint2str(tokenId),
        "?policyId=",
        uint2str(policy.policyId),
        "&policyholder=",
        addressToString(policy.policyholder),
        "&expirationDate=",
        uint2str(policy.expirationDate)
    ));
}


// Helper functions to convert uint256 and address to string
function uint2str(uint256 _i) internal pure returns (string memory) {
    if (_i == 0) {
        return "0";
    }
    uint256 j = _i;
    uint256 len;
    while (j != 0) {
        len++;
        j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint256 k = len;
    while (_i != 0) {
        k = k - 1;
        uint8 temp = (48 + uint8(_i - _i / 10 * 10));
        bytes1 b1 = bytes1(temp);
        bstr[k] = b1;
        _i /= 10;
    }
    return string(bstr);
}

function addressToString(address _addr) internal pure returns (string memory) {
    bytes32 value = bytes32(uint256(uint160(_addr)));
    bytes memory alphabet = "0123456789abcdef";

    bytes memory str = new bytes(42);
    str[0] = '0';
    str[1] = 'x';
    for (uint256 i = 0; i < 20; i++) {
        str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
        str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
    }
    return string(str);
}


   

    function buyPolicyFromUser(uint256 tokenId) public payable {
    UserPolicy memory existingPolicy = tokenIdToPolicy[tokenId];
    require(existingPolicy.policyholder != address(0), "Policy does not exist");
    require(existingPolicy.expirationDate > block.timestamp, "Policy has expired");
    require(existingPolicy.active && !existingPolicy.claimed, "Policy is not transferable");

    address seller = existingPolicy.policyholder;
    require(msg.value == existingPolicy.premium, "Incorrect payment amount");

    // Check if the buyer is approved by the seller to transfer the tok

    
    // Transfer NFT ownership
    policyNFT.safeTransferFrom(seller, msg.sender, tokenId);

    // Update the policy to reflect the new owner
    existingPolicy.policyholder = msg.sender;
    tokenIdToPolicy[tokenId] = existingPolicy;

    // Update user policies
    userPolicies[msg.sender].push(existingPolicy);
    _removePolicyFromUser(seller, tokenId);

    // Transfer payment to the seller
    (bool success, ) = seller.call{value: msg.value}("");
    require(success, "Transfer to seller failed");
    emit PolicyTransferred(seller, msg.sender, tokenId);
    emit PolicyBought(msg.sender, existingPolicy.policyId, existingPolicy.policyType, block.timestamp);
}



function getPolicyNFTAddress() public view returns (address) {
    return address(policyNFT);
}


// Helper function to remove a policy from the user's policy array
function _removePolicyFromUser(address user, uint256 tokenId) internal {
    UserPolicy[] storage policies = userPolicies[user];
    for (uint256 i = 0; i < policies.length; i++) {
        if (policyToTokenId[policies[i].policyId] == tokenId) {
            policies[i] = policies[policies.length - 1];
            policies.pop();
            break;
        }
    }
}


    // Users submit a claim for their policy
    function submitClaim(uint256 _policyId, string memory _evidenceURI) public {
        UserPolicy[] storage policies = userPolicies[msg.sender];
        require(policies.length > 0, "User has no policies");

        UserPolicy memory policy = policies[_policyId];
        require(policy.active, "Policy is not active");

        claimIdCounter++;
        Claim memory newClaim = Claim({
            id: claimIdCounter,
            policyId: _policyId,
            claimant: msg.sender,
            coverageAmount: policy.coverage,
            evidenceURI: _evidenceURI,
            status: ClaimStatus.Submitted,
            submissionDate: block.timestamp,
            expirationDate: block.timestamp + 7 days // Claim review period of 7 days
        });

        userClaims[msg.sender].push(newClaim);

        emit ClaimSubmitted(msg.sender, claimIdCounter, _policyId, policy.coverage, block.timestamp);
    }

    // Provider approves the claim and transfers the coverage amount to the user directly
    function approveClaim(address _user, uint256 _claimId) public payable {
        Claim[] storage claims = userClaims[_user];
        Claim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Submitted, "Claim is not in Submitted status");

        PolicyTemplate memory template = policyTemplates[claim.policyId];
        require(msg.sender == template.provider, "Only the provider can approve claims");

        UserPolicy[] storage policies = userPolicies[_user];
        UserPolicy memory policy = policies[claim.policyId];

        // Check if the policy has expired
        require(policy.expirationDate >= block.timestamp, "Policy has expired");

        require(address(msg.sender).balance >= claim.coverageAmount, "Provider has insufficient funds");

        claim.status = ClaimStatus.Approved;
        (bool success, ) = payable(claim.claimant).call{value :msg.value}("");
        require(success, "Transfer to claimant failed");

        emit ClaimApproved(claim.claimant, claim.id, claim.policyId, claim.coverageAmount, block.timestamp);
    }

    // Event for logging custom messages
    event Log(string message, address indexed user, uint256 value);

    // Provider rejects the claim
    function rejectClaim(address _user, uint256 _claimId) public {
        Claim[] storage claims = userClaims[_user];
        Claim storage claim = claims[_claimId];

        require(claim.status == ClaimStatus.Submitted, "Claim is not in Submitted status");

        // Find the provider's policy that matches the claim
        PolicyTemplate memory template = policyTemplates[claim.policyId];
        require(msg.sender == template.provider, "Only the provider can reject claims");

        // Mark the claim as rejected
        claim.status = ClaimStatus.Rejected;

        emit ClaimRejected(claim.claimant, claim.id, claim.policyId, block.timestamp);
    }

    // Fetch a user's submitted claims
    function getUserClaims(address _user) public view returns (Claim[] memory) {
        return userClaims[_user];
    }

    // Fetch a user's purchased policies
    function getUserPolicies(address _user) public view returns (UserPolicy[] memory) {
        return userPolicies[_user];
    }

    // Fetch details of a single policy template by its index
    function getPolicyTemplate(uint256 _index) public view returns (PolicyTemplate memory) {
        return policyTemplates[_index];
    }

    // Get the total number of policy templates
    function getPolicyTemplateCount() public view returns (uint256) {
        return policyTemplates.length;
    }
}
