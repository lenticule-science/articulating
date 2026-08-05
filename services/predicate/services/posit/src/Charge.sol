// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Charge
/// @notice The {kBot,tTop,tBot,kTop} bilattice charge: positing's value
///         carrier, the same four-point object as the articulation phases.
/// @dev Realizes Obsmetrologia.Language.Positing.Charge / .TruthOrder exactly:
///      the four named corners, the six Boolean-slot operations, and both
///      order comparisons. Stateless — the algebra is a law, not a ledger.
library Charge {
    error InvalidArticulationCorner(uint8 corner);

    /// The bilattice carrier: two independent evidence slots. The same
    /// Bool x Bool pair Obsmetrologia.Articulating.FourCorner names, which
    /// Charge is defined to be.
    struct Corner {
        bool pos;
        bool neg;
    }

    /// The positive (evidence-for) slot of a charge.
    function pos(Corner memory c) internal pure returns (bool) {
        return c.pos;
    }

    /// The negative (evidence-against) slot of a charge.
    function neg(Corner memory c) internal pure returns (bool) {
        return c.neg;
    }

    /// Build a charge from its two slots.
    function ofSlots(bool p, bool n) internal pure returns (Corner memory) {
        return Corner(p, n);
    }

    /// Knowledge-bottom - no evidence; the value positing seeds.
    function kBot() internal pure returns (Corner memory) {
        return ofSlots(false, false);
    }

    /// Truth-top - evidence for, none against.
    function tTop() internal pure returns (Corner memory) {
        return ofSlots(true, false);
    }

    /// Truth-bottom - evidence against, none for.
    function tBot() internal pure returns (Corner memory) {
        return ofSlots(false, true);
    }

    /// Knowledge-top - evidence both ways.
    function kTop() internal pure returns (Corner memory) {
        return ofSlots(true, true);
    }

    /// Joining-knowledge - presence-union; the knowledge-order lub.
    function joinK(Corner memory a, Corner memory b) internal pure returns (Corner memory) {
        return ofSlots(a.pos || b.pos, a.neg || b.neg);
    }

    /// Meeting-knowledge - presence-intersection; the knowledge-order glb.
    function meetK(Corner memory a, Corner memory b) internal pure returns (Corner memory) {
        return ofSlots(a.pos && b.pos, a.neg && b.neg);
    }

    /// Joining-truth - positive union, negative intersection.
    function joinT(Corner memory a, Corner memory b) internal pure returns (Corner memory) {
        return ofSlots(a.pos || b.pos, a.neg && b.neg);
    }

    /// Meeting-truth - positive intersection, negative union.
    function meetT(Corner memory a, Corner memory b) internal pure returns (Corner memory) {
        return ofSlots(a.pos && b.pos, a.neg || b.neg);
    }

    /// Negating - swap the two slots: reverses truth, preserves knowledge.
    function negate(Corner memory a) internal pure returns (Corner memory) {
        return ofSlots(a.neg, a.pos);
    }

    /// Comparing-knowledge - the knowledge-order witness.
    function leK(Corner memory a, Corner memory b) internal pure returns (bool) {
        return (!a.pos || b.pos) && (!a.neg || b.neg);
    }

    /// Comparing-truth - the truth-order witness (positive up, negative down).
    function leT(Corner memory a, Corner memory b) internal pure returns (bool) {
        return (!a.pos || b.pos) && (!b.neg || a.neg);
    }

    /// The corner-charge conflation: a corner in ArticulationCell's enum
    /// order {Absurd=0,Potential=1,Active=2,Stable=3}, read as its charge.
    function fromArticulationCorner(uint8 corner) internal pure returns (Corner memory) {
        if (corner == 0) return ofSlots(false, false);
        if (corner == 1) return ofSlots(true, false);
        if (corner == 2) return ofSlots(false, true);
        if (corner == 3) return ofSlots(true, true);
        revert InvalidArticulationCorner(corner);
    }

    /// The inverse: a charge read as its ArticulationCell corner value.
    function toArticulationCorner(Corner memory c) internal pure returns (uint8) {
        if (!c.pos && !c.neg) return 0;
        if (c.pos && !c.neg) return 1;
        if (!c.pos && c.neg) return 2;
        return 3;
    }
}

/// @notice Pure, one-directional, unimported equivalence to
///         FourMixConsensusProfile's Charge carrier — not a dependency edge.
library ChargeFourMixProjection {
    /// Reads a corner as FourMixConsensusProfile's Charge fields.
    function toFourMixCharge(Charge.Corner memory c)
        internal
        pure
        returns (bool positiveEvidence, bool negativeEvidence)
    {
        return (c.pos, c.neg);
    }

    /// Builds a corner from FourMixConsensusProfile's Charge fields.
    function fromFourMixCharge(bool positiveEvidence, bool negativeEvidence)
        internal
        pure
        returns (Charge.Corner memory)
    {
        return Charge.ofSlots(positiveEvidence, negativeEvidence);
    }
}
