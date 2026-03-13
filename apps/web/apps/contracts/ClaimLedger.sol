// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./access/Ownable.sol";

/**
 * @title ClaimLedger
 * @notice Immutable record of claimed relief packs (stores only bytes32 hashes).
 */
contract ClaimLedger is Ownable {
    /// @notice Tracks whether a household hash has claimed for a specific event hash.
    mapping(bytes32 => mapping(bytes32 => bool)) private claimedByEvent;

    /// @notice Emitted every time a relief-pack claim is recorded.
    event ClaimRecorded(
        bytes32 indexed householdHash,
        bytes32 indexed eventHash,
        address indexed signer,
        uint256 timestamp
    );

    /**
     * @notice Record a claim on-chain.
     * @dev Reverts if caller is not authorized owner or if household already claimed for this event.
     */
    function recordClaim(
        bytes32 householdHash,
        bytes32 eventHash
    ) external onlyOwner {
        // [RISK-5 MITIGATION] One-claim-per-householdHash-per-eventHash policy enforced on-chain.
        require(!claimedByEvent[householdHash][eventHash], "ClaimLedger: already claimed");

        claimedByEvent[householdHash][eventHash] = true;

        emit ClaimRecorded(
            householdHash,
            eventHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Record multiple claims in one transaction.
     * @dev Useful for reducing per-claim gas overhead during bulk uploads.
     *      Reverts the entire transaction if any household hash was already claimed for this event.
     */
    function recordClaimsBatch(
        bytes32[] calldata householdHashes,
        bytes32 eventHash
    ) external onlyOwner {
        uint256 length = householdHashes.length;
        address signer = msg.sender;
        uint256 timestamp = block.timestamp;

        for (uint256 i = 0; i < length; ) {
            bytes32 householdHash = householdHashes[i];

            require(!claimedByEvent[householdHash][eventHash], "ClaimLedger: already claimed");
            claimedByEvent[householdHash][eventHash] = true;

            emit ClaimRecorded(
                householdHash,
                eventHash,
                signer,
                timestamp
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Check whether a household has claimed for a specific event.
     */
    function isClaimed(
        bytes32 householdHash,
        bytes32 eventHash
    ) external view returns (bool) {
        return claimedByEvent[householdHash][eventHash];
    }
}
