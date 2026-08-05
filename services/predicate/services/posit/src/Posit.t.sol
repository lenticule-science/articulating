// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Charge } from "./Charge.sol";
import { EvidenceContribution } from "./EvidenceContribution.sol";
import { ValuationAccumulator } from "./ValuationAccumulator.sol";
import { Positing } from "./Positing.sol";
import { Mark } from "articulate/Mark.sol";
import { Utterance } from "articulate/Utterance.sol";
import { ArticulationCell } from "articulate/ArticulationCell.sol";
import { Predicating } from "predicate/Predicating.sol";

interface PositVm {
    function expectRevert(bytes calldata reason) external;
}

/// Exercises FOUR itself, each positing atom, and their one-call composition.
contract PositTest {
    PositVm private constant vm = PositVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    Mark internal mark;
    Utterance internal utterance;
    ArticulationCell internal articulation;
    Predicating internal predicating;
    EvidenceContribution internal contributions;
    ValuationAccumulator internal valuations;
    Positing internal positing;

    function setUp() public {
        mark = new Mark();
        utterance = new Utterance(mark);
        articulation = new ArticulationCell(utterance);
        predicating = new Predicating(articulation);
        contributions = new EvidenceContribution(predicating);
        valuations = new ValuationAccumulator(contributions);
        positing = new Positing(predicating);
    }

    function seatedCell(string memory surface) internal returns (bytes32 id) {
        bytes32 admitted = mark.admit(bytes(surface));
        id = utterance.form(admitted, admitted);
        articulation.seat(id);
    }

    function generatedPredication() internal returns (bytes32 id) {
        bytes32 subject = seatedCell("subject");
        articulation.articulateToken(subject);
        id = predicating.predicate_(subject, seatedCell("predicate"), seatedCell("object"));
    }

    function testChargeConflationRoundTripsEveryCorner() public pure {
        for (uint8 corner = 0; corner < 4; corner++) {
            require(
                Charge.toArticulationCorner(Charge.fromArticulationCorner(corner)) == corner,
                "conflation round trip"
            );
        }
    }

    function testKnowledgeJoinRetainsContradiction() public pure {
        Charge.Corner memory a = Charge.tTop();
        Charge.Corner memory b = Charge.tBot();
        require(Charge.toArticulationCorner(Charge.joinK(a, b)) == 3, "join must retain both");
        require(Charge.leK(a, Charge.joinK(a, b)), "join descends from positive");
        require(Charge.leK(b, Charge.joinK(a, b)), "join descends from negative");
    }

    function testContributionAtomGroundsIdentityAndRefusesRepeat() public {
        bytes32 phi = generatedPredication();
        bytes32 evidence = seatedCell("positive evidence");
        articulation.articulateToken(evidence);

        (bytes32 contribution, uint8 corner) = contributions.contribute(phi, evidence);
        require(corner == 1, "potential evidence read incorrectly");
        EvidenceContribution.Contribution memory recorded = contributions.contribution(contribution);
        require(recorded.predication == phi && recorded.evidenceCell == evidence, "grounding lost");
        require(recorded.corner == 1 && recorded.recorded, "contribution not retained");

        vm.expectRevert(
            abi.encodeWithSelector(
                EvidenceContribution.EvidenceAlreadyContributed.selector, contribution
            )
        );
        contributions.contribute(phi, evidence);
    }

    function testContributionAtomAllowsOneSourceToAscend() public {
        bytes32 phi = generatedPredication();
        bytes32 evidence = seatedCell("developing evidence");
        articulation.articulateToken(evidence);
        (bytes32 active,) = contributions.contribute(phi, evidence);
        articulation.articulateClaim(evidence);
        (bytes32 contested, uint8 corner) = contributions.contribute(phi, evidence);
        require(active != contested && corner == 3, "source ascent is not a fresh witnessed state");
    }

    function testAccumulatorAtomAcceptsOnlyGroundedContributionOnce() public {
        bytes32 phi = generatedPredication();
        bytes32 unrecorded = keccak256("unrecorded contribution");
        vm.expectRevert(
            abi.encodeWithSelector(
                ValuationAccumulator.ContributionNotRecorded.selector, unrecorded
            )
        );
        valuations.accumulate(unrecorded);

        bytes32 evidence = seatedCell("negative evidence");
        articulation.articulateClaim(evidence);
        (bytes32 contribution,) = contributions.contribute(phi, evidence);
        require(valuations.accumulate(contribution) == 2, "negative contribution not accumulated");
        (bool positive, bool negative, uint8 corner) = valuations.valuation(phi);
        require(!positive && negative && corner == 2, "valuation does not hold negative evidence");

        vm.expectRevert(
            abi.encodeWithSelector(
                ValuationAccumulator.ContributionAlreadyAccumulated.selector, contribution
            )
        );
        valuations.accumulate(contribution);
    }

    function testComposedPositingAccumulatesOppositionWithoutFreeData() public {
        bytes32 phi = generatedPredication();
        bytes32 positive = seatedCell("positive evidence");
        bytes32 negative = seatedCell("negative evidence");
        articulation.articulateToken(positive);
        articulation.articulateClaim(negative);

        (, uint8 afterPositive) = positing.posit(phi, positive);
        (, uint8 afterNegative) = positing.posit(phi, negative);
        (bool holds, bool denies, uint8 corner) = positing.valuation(phi);
        require(afterPositive == 1 && afterNegative == 3, "knowledge ascent failed");
        require(holds && denies && corner == 3, "contradiction was discarded");
    }

    function testContributionRefusesFreePredicationsAndEvidence() public {
        bytes32 unknownPhi = keccak256("unknown phi");
        bytes32 unknownEvidence = keccak256("unknown evidence");
        vm.expectRevert(
            abi.encodeWithSelector(
                EvidenceContribution.PredicationNotGenerated.selector, unknownPhi
            )
        );
        contributions.contribute(unknownPhi, unknownEvidence);

        bytes32 phi = generatedPredication();
        vm.expectRevert(
            abi.encodeWithSelector(
                EvidenceContribution.EvidenceCellNotSeated.selector, unknownEvidence
            )
        );
        contributions.contribute(phi, unknownEvidence);
    }
}
