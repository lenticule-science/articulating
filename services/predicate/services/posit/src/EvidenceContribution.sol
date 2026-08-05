// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { ArticulationCell } from "articulate/ArticulationCell.sol";
import { Predicating } from "predicate/Predicating.sol";

/// @title EvidenceContribution
/// @notice Grounds one charge contribution in a generated predication and a
///         seated articulation cell.
/// @dev A contribution's identity includes the observed corner. A source can
///      therefore climb from active/stable to absurd, but cannot contribute the
///      same witnessed state twice.
contract EvidenceContribution {
    error PredicationNotGenerated(bytes32 predication);
    error EvidenceCellNotSeated(bytes32 evidenceCell);
    error EvidenceAlreadyContributed(bytes32 contribution);

    event EvidenceContributed(
        bytes32 indexed contribution,
        bytes32 indexed predication,
        bytes32 indexed evidenceCell,
        address contributor,
        uint8 corner
    );

    struct Contribution {
        bytes32 predication;
        bytes32 evidenceCell;
        uint8 corner;
        bool recorded;
    }

    Predicating public immutable predicating;
    ArticulationCell public immutable articulation;
    mapping(bytes32 contributionId_ => Contribution contribution) private _contributions;

    constructor(Predicating predicating_) {
        predicating = predicating_;
        articulation = predicating_.cell();
    }

    function contributionId(bytes32 predication, bytes32 evidenceCell, uint8 corner)
        public
        pure
        returns (bytes32)
    {
        return sha256(abi.encode(predication, evidenceCell, corner));
    }

    /// @notice Record exactly the corner currently witnessed at `evidenceCell`.
    function contribute(bytes32 predication, bytes32 evidenceCell)
        external
        returns (bytes32 id, uint8 corner)
    {
        if (!predicating.generated(predication)) {
            revert PredicationNotGenerated(predication);
        }
        if (!articulation.seated(evidenceCell)) revert EvidenceCellNotSeated(evidenceCell);

        corner = uint8(articulation.corner(evidenceCell));
        id = contributionId(predication, evidenceCell, corner);
        if (_contributions[id].recorded) revert EvidenceAlreadyContributed(id);

        _contributions[id] = Contribution({
            predication: predication, evidenceCell: evidenceCell, corner: corner, recorded: true
        });
        emit EvidenceContributed(id, predication, evidenceCell, msg.sender, corner);
    }

    function contribution(bytes32 id) external view returns (Contribution memory) {
        return _contributions[id];
    }
}
