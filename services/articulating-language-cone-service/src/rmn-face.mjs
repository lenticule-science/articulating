import {
  createRelationalOperationProtocol,
} from "@red-cup-engineering/a2a-sovereign-operation-boundary-service";
import {
  ARTICULATE_OPERATION,
  ARTICULATING_REQUEST_KIND,
  ARTICULATING_RECEIPT_KIND,
} from "./apex.mjs";

const protocol = createRelationalOperationProtocol({
  requestKind: ARTICULATING_REQUEST_KIND,
  responseKind: ARTICULATING_RECEIPT_KIND,
  label: "Obsmetrologia articulating",
});

function admittedRequest(value) {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || value.kind !== ARTICULATING_REQUEST_KIND
    || typeof value.operation !== "string"
    || value.input === null
    || typeof value.input !== "object"
    || Array.isArray(value.input)
  ) {
    throw new TypeError(`Obsmetrologia articulating expected ${ARTICULATING_REQUEST_KIND}`);
  }
  return value;
}

function admittedResponse(value) {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || value.kind !== ARTICULATING_RECEIPT_KIND
  ) {
    throw new TypeError(`Obsmetrologia articulating expected ${ARTICULATING_RECEIPT_KIND}`);
  }
  return value;
}

/** The sovereign protocol plus the cone's exact typed request/response admission. */
export const articulatingRmnProtocol = Object.freeze({
  ...protocol,
  decodeRequest: (term) => admittedRequest(protocol.decodeRequest(term)),
  admitRequest: (bytes, token) => admittedRequest(protocol.admitRequest(bytes, token)),
  decodeResponse: (term) => admittedResponse(protocol.decodeResponse(term)),
  admitResponse: (bytes, token) => admittedResponse(protocol.admitResponse(bytes, token)),
});

export function encodeArticulatingRequestRmn(input) {
  const projected = articulatingRmnProtocol.encodeRequest(ARTICULATE_OPERATION, input);
  return Object.freeze({
    mediaType: "application/rmn+cbor",
    term: projected.term,
    bytes: projected.bytes,
    semanticId: projected.id,
  });
}

export function decodeCanonicalArticulatingRmn(bytes) {
  const source = Buffer.from(bytes);
  const admitted = articulatingRmnProtocol.admitRequest(source);
  const term = articulatingRmnProtocol.encodeRequest(admitted.operation, admitted.input).term;
  const request = admitted;
  if (request.operation !== ARTICULATE_OPERATION) throw new TypeError("RMN term names a different operation");
  return Object.freeze({ term, request, semanticId: articulatingRmnProtocol.encodeRequest(request.operation, request.input).id });
}
