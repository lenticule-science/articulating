// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Charge } from "./Charge.sol";
import { EvidenceContribution } from "./EvidenceContribution.sol";

/// @title ValuationAccumulator
/// @notice The charge-valued valuation of one contribution ledger.
/// @dev The only write is FOUR knowledge join. It can consume only recorded
///      contributions from its immutable grounding ledger, so it neither accepts
///      arbitrary booleans nor lets an already-used contribution change time.
contract ValuationAccumulator {
    error ContributionNotRecorded(bytes32 contribution);
    error ContributionAlreadyAccumulated(bytes32 contribution);

    event ValuationAccumulated(
        bytes32 indexed contribution,
        bytes32 indexed predication,
        uint8 incomingCorner,
        uint8 previousCorner,
        uint8 currentCorner
    );

    EvidenceContribution public immutable contributions;
    mapping(bytes32 predication => Charge.Corner charge) private _valuations;
    mapping(bytes32 contribution => bool) public accumulated;

    constructor(EvidenceContribution contributions_) {
        contributions = contributions_;
    }

    /// @notice Join a previously grounded contribution into its own predication.
    function accumulate(bytes32 contribution) external returns (uint8 currentCorner) {
        EvidenceContribution.Contribution memory source = contributions.contribution(contribution);
        if (!source.recorded) revert ContributionNotRecorded(contribution);
        if (accumulated[contribution]) revert ContributionAlreadyAccumulated(contribution);

        Charge.Corner memory previous = _valuations[source.predication];
        Charge.Corner memory incoming = Charge.fromArticulationCorner(source.corner);
        Charge.Corner memory current = Charge.joinK(previous, incoming);
        _valuations[source.predication] = current;
        accumulated[contribution] = true;

        uint8 previousCorner = Charge.toArticulationCorner(previous);
        currentCorner = Charge.toArticulationCorner(current);
        emit ValuationAccumulated(
            contribution, source.predication, source.corner, previousCorner, currentCorner
        );
    }

    function valuation(bytes32 predication)
        external
        view
        returns (bool positiveEvidence, bool negativeEvidence, uint8 corner)
    {
        Charge.Corner memory charge = _valuations[predication];
        return (charge.pos, charge.neg, Charge.toArticulationCorner(charge));
    }
}
