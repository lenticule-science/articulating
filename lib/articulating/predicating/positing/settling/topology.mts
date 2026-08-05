/**
 * settling/topology — the composed relation descent.
 *
 * `induceRelation` is the whole descent with the same base domain as `articulate`
 * plus admitted evidence and an explicit closure order:
 * articulate → predicate → posit → settle. `relateRelations` combines two stored
 * relation presentations
 * STRUCTURALLY — the union of their generators (an associative monoid) — not by
 * opacifying them into marks and re-descending.
 */
import { articulate, type UtteranceCarrier } from "../../../utterance.mjs";
import { predicate } from "../../predication.mjs";
import { posit, valuationOfCharge } from "../fiber.mjs";
import type { ChargeCarrier } from "../bilattice-charge.mjs";
import type { SettlementFiltration } from "./object.mjs";
import { settleWith, type PredicationValuationClosureOrderCarrier, type SettlementFiltrationGenerators } from "./valuation-closure.mjs";

/** Induce one relation through every stage with explicit evidence and closure. */
export function induceRelation(
  carrier: UtteranceCarrier,
  admittedCharge: ChargeCarrier,
  closureOrder: PredicationValuationClosureOrderCarrier,
): SettlementFiltration {
  if (typeof carrier !== "object" || carrier === null || carrier.kind !== "utterance.carrier") {
    throw new TypeError("induceRelation: expected an utterance carrier");
  }
  const articulation = articulate(carrier);
  const predication = predicate(articulation);
  const posited = posit(predication, valuationOfCharge(predication, admittedCharge));
  return settleWith(posited, closureOrder);
}

/** Relate two relations by the UNION of their generators (an associative monoid;
 *  coincident cells dedupe when `free` materializes the cell set). */
export function relateRelations(
  left: SettlementFiltrationGenerators,
  right: SettlementFiltrationGenerators,
): SettlementFiltrationGenerators {
  if (typeof left !== "object" || left === null || left.kind !== "predication.settlement.filtration.presentation") {
    throw new TypeError("relateRelations: expected left settlement filtration");
  }
  if (typeof right !== "object" || right === null || right.kind !== "predication.settlement.filtration.presentation") {
    throw new TypeError("relateRelations: expected right settlement filtration");
  }
  if (left.closureProfile.order !== right.closureProfile.order) {
    throw new TypeError("relateRelations: closure profiles must agree");
  }
  return Object.freeze({
    kind: "predication.settlement.filtration.presentation" as const,
    cells: Object.freeze([...left.cells, ...right.cells]),
    specializations: Object.freeze([...left.specializations, ...right.specializations]),
    assignments: Object.freeze([...left.assignments, ...right.assignments]),
    closureProfile: left.closureProfile,
  });
}
