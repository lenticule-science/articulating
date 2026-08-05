// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Predicating } from "predicate/Predicating.sol";
import { EvidenceContribution } from "./EvidenceContribution.sol";
import { ValuationAccumulator } from "./ValuationAccumulator.sol";

/// @title Positing
/// @notice Optional one-transaction composition of grounded contribution and
///         knowledge-monotone valuation accumulation.
/// @dev The two atoms remain independently deployable. This contract adds no
///      state rule: it only makes their lawful two-step transition atomic.
contract Positing {
    EvidenceContribution public immutable contributions;
    ValuationAccumulator public immutable valuations;

    constructor(Predicating predicating) {
        contributions = new EvidenceContribution(predicating);
        valuations = new ValuationAccumulator(contributions);
    }

    function posit(bytes32 predication, bytes32 evidenceCell)
        external
        returns (bytes32 contribution, uint8 currentCorner)
    {
        (contribution,) = contributions.contribute(predication, evidenceCell);
        currentCorner = valuations.accumulate(contribution);
    }

    function valuation(bytes32 predication)
        external
        view
        returns (bool positiveEvidence, bool negativeEvidence, uint8 corner)
    {
        return valuations.valuation(predication);
    }
}
