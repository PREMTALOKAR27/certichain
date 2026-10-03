// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateRegistry {
    struct Certificate {
        string certificateHash;
        address issuer;
        uint256 issueDate;
        bool revoked;
    }

    address public immutable owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(string => Certificate) private certificates;
    mapping(string => bool) private certificateIds;

    event CertificateIssued(
        string indexed certificateId,
        string certificateHash,
        address indexed issuer,
        uint256 issueDate
    );
    event CertificateRevoked(
        string indexed certificateId,
        address indexed issuer,
        uint256 revokedAt
    );
    event IssuerAuthorizationChanged(address indexed issuer, bool authorized);

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    function setAuthorizedIssuer(address issuer, bool authorized) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        require(issuer != owner || authorized, "Owner must remain authorized");

        authorizedIssuers[issuer] = authorized;
        emit IssuerAuthorizationChanged(issuer, authorized);
    }

    function issueCertificate(
        string calldata certificateId,
        string calldata certificateHash,
        uint256 issueDate
    ) external onlyAuthorizedIssuer {
        require(bytes(certificateId).length > 0, "Certificate ID is required");
        require(bytes(certificateHash).length > 0, "Certificate hash is required");
        require(issueDate > 0, "Issue date is required");
        require(!certificateIds[certificateId], "Certificate already exists");

        certificates[certificateId] = Certificate({
            certificateHash: certificateHash,
            issuer: msg.sender,
            issueDate: issueDate,
            revoked: false
        });
        certificateIds[certificateId] = true;

        emit CertificateIssued(certificateId, certificateHash, msg.sender, issueDate);
    }

    function getCertificate(
        string calldata certificateId
    ) external view returns (string memory certificateHash, address issuer, uint256 issueDate, bool revoked) {
        require(certificateIds[certificateId], "Certificate does not exist");
        Certificate storage certificate = certificates[certificateId];
        return (
            certificate.certificateHash,
            certificate.issuer,
            certificate.issueDate,
            certificate.revoked
        );
    }

    function verifyCertificate(
        string calldata certificateId,
        string calldata certificateHash
    ) external view returns (bool exists, bool hashMatches, bool revoked) {
        if (!certificateIds[certificateId]) {
            return (false, false, false);
        }

        Certificate storage certificate = certificates[certificateId];
        return (
            true,
            keccak256(bytes(certificate.certificateHash)) == keccak256(bytes(certificateHash)),
            certificate.revoked
        );
    }

    function revokeCertificate(string calldata certificateId) external onlyAuthorizedIssuer {
        require(certificateIds[certificateId], "Certificate does not exist");
        Certificate storage certificate = certificates[certificateId];
        require(!certificate.revoked, "Certificate already revoked");

        certificate.revoked = true;
        emit CertificateRevoked(certificateId, msg.sender, block.timestamp);
    }

    function certificateExists(string calldata certificateId) external view returns (bool) {
        return certificateIds[certificateId];
    }
}