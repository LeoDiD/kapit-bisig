// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ClaimLedger
 * @notice Immutable record of claimed relief packs (stores only bytes32 hashes).
 */
contract ClaimLedger {
    /// @notice Tracks whether a household hash has been claimed.
    mapping(bytes32 => bool) public claimed;

    /// @notice Emitted every time a relief-pack claim is recorded.
    event ClaimRecorded(
        bytes32 indexed householdHash,
        bytes32 indexed eventHash,
        address indexed signer,
        uint256 timestamp
    );

    /**
     * @notice Record a claim on-chain.
     * @dev Reverts if the household has already claimed.
     */
    function recordClaim(
        bytes32 householdHash,
        bytes32 eventHash
    ) external {
        require(!claimed[householdHash], "ClaimLedger: already claimed");

        claimed[householdHash] = true;

        emit ClaimRecorded(
            householdHash,
            eventHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Check whether a household has claimed.
     */
    function isClaimed(
        bytes32 householdHash
    ) external view returns (bool) {
        return claimed[householdHash];
    }
}
