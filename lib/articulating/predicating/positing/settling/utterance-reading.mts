/**
 * utterance-reading - ergonomic readers over the lawful utterance descent.
 */
import { articulate, type UtteranceCarrier } from "../../../utterance.mjs";
import { freePredicationSite, predicate, presentPredicationSite } from "../../predication.mjs";
import { composeFibers, posit, valuationOfCharge } from "../fiber.mjs";
import type { ChargeCarrier } from "../bilattice-charge.mjs";
import { fixedPoints } from "./fixed-point.mjs";
import { fixedPointReadings, type MemeTopologyFixedPointReadings } from "./fixed-point-reading.mjs";
import {
  freeSettlementFiltration,
  type SettlementClosureProfile,
  type SettlementFiltrationGenerators,
} from "./valuation-closure.mjs";
import type { SettlementFiltration } from "./object.mjs";
import { relateRelations } from "./topology.mjs";

export interface UtteranceSettlementAdmission {
  readonly utterance: UtteranceCarrier;
  readonly charge: ChargeCarrier;
}

function generatorsOfUtterances(
  admissions: readonly UtteranceSettlementAdmission[],
  closureProfile: SettlementClosureProfile,
): SettlementFiltrationGenerators {
  if (admissions.length === 0) throw new TypeError("expected at least one admitted utterance");
  return admissions
    .map(({ utterance, charge }): SettlementFiltrationGenerators => {
      const predication = predicate(articulate(utterance));
      const site = presentPredicationSite(predication);
      const valuation = valuationOfCharge(predication, charge);
      return Object.freeze({
        kind: "predication.settlement.filtration.presentation" as const,
        cells: site.cells,
        specializations: site.specializations,
        assignments: valuation.fibers.flatMap((fiber) => fiber.assignments),
        closureProfile,
      });
    })
    .reduce((left, right) => relateRelations(left, right));
}

export function settleUtterances(
  admissions: readonly UtteranceSettlementAdmission[],
  closureProfile: SettlementClosureProfile,
): SettlementFiltration {
  return freeSettlementFiltration(generatorsOfUtterances(admissions, closureProfile));
}

export function fixedPointReadingsOfUtterances(
  admissions: readonly UtteranceSettlementAdmission[],
  closureProfile: SettlementClosureProfile,
): MemeTopologyFixedPointReadings {
  const generators = generatorsOfUtterances(admissions, closureProfile);
  const site = freePredicationSite({
    kind: "predication.site",
    cells: generators.cells,
    specializations: generators.specializations,
  });
  return fixedPointReadings(fixedPoints(posit(site, composeFibers(generators.assignments, site.base))));
}
