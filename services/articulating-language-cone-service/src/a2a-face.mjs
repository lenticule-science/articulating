import { AgentCard } from "@a2a-js/sdk";
import { executeRelationalOperationMessage } from "@red-cup-engineering/a2a-sovereign-operation-boundary-service";
import {
  ARTICULATE_OPERATION,
  ARTICULATING_APEX,
  ARTICULATING_LANGUAGE_IDENTIFIERS,
  executeArticulateUtterance,
} from "./apex.mjs";
import { articulatingRmnProtocol } from "./rmn-face.mjs";

export async function projectSignedArticulatingAgentCard({ baseUrl, signing }) {
  const origin = new URL(baseUrl);
  if (origin.protocol !== "https:" && origin.hostname !== "127.0.0.1" && origin.hostname !== "localhost") {
    throw new TypeError("public Agent Cards require HTTPS");
  }
  if (!signing?.agentCardSignatureGenerator || !signing?.agentCardJwks) {
    throw new TypeError("Agent Card projection requires an injected ephemeral signing configuration");
  }
  const root = origin.href.replace(/\/$/u, "");
  const unsigned = AgentCard.toJSON(AgentCard.fromJSON({
    name: "Obsmetrologia Articulating",
    description: "Canonical RMN articulation of one admitted token/claim utterance.",
    supportedInterfaces: [{ url: `${root}/a2a/jsonrpc`, protocolBinding: "JSONRPC", tenant: "", protocolVersion: "1.0" }],
    provider: { url: "https://561.group/", organization: "Lenticule Science" },
    version: "0.1.0",
    capabilities: { streaming: false, pushNotifications: false, extensions: [], extendedAgentCard: false },
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ["application/rmn+cbor"],
    defaultOutputModes: ["application/rmn+cbor"],
    skills: [{
      id: ARTICULATE_OPERATION,
      name: "Articulate utterance",
      description: `Execute ${ARTICULATING_APEX} using ${JSON.stringify(ARTICULATING_LANGUAGE_IDENTIFIERS)}.`,
      tags: ["obsmetrologia", "rmn", "articulating"],
      examples: [],
      inputModes: ["application/rmn+cbor"],
      outputModes: ["application/rmn+cbor"],
      securityRequirements: [],
    }],
    signatures: [],
  }));
  const signed = await signing.agentCardSignatureGenerator(unsigned);
  return Object.freeze({
    path: "/.well-known/agent-card.json",
    card: AgentCard.toJSON(AgentCard.fromJSON(signed)),
    jwksPath: "/.well-known/jwks.json",
    jwks: signing.agentCardJwks,
  });
}

export function executeArticulatingA2aMove(message) {
  return executeRelationalOperationMessage(message, {
    protocol: articulatingRmnProtocol,
    operations: { [ARTICULATE_OPERATION]: executeArticulateUtterance },
    runtimeLoader: async () => Object.freeze({ kind: "obsmetrologia.articulating.transient-runtime" }),
    responseFilename: "articulating-receipt.rmn.cbor",
    unknownOperationMessage: "unknown Obsmetrologia articulating operation",
  });
}
