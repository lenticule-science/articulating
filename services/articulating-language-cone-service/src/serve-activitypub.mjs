#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deliverActivity } from "@red-cup-engineering/activitypub-services-section";
import { createActivityPubR2Custody } from "@red-cup-engineering/activitypub-services-section/r2-custody";
import { extractRmnActivity, projectRmnActivity } from "@red-cup-engineering/activitypub-services-section/rmn-activity";
import { serveActivityPubProvider } from "@red-cup-engineering/activitypub-services-section/server";
import { extractRmnPart, parseA2aMessage } from "@red-cup-engineering/a2a-rmn-part-service";
import { executeArticulatingA2aMove, projectSignedArticulatingAgentCard } from "./a2a-face.mjs";
import { decodeCanonicalArticulatingRmn } from "./rmn-face.mjs";

function requiredOrigin(value) {
  const origin = String(value ?? "").replace(/\/$/u, "");
  if (origin === "") throw new Error("ACTIVITYPUB_ORIGIN is required");
  return origin;
}

function senderFrom(activity) {
  return typeof activity?.actor === "string" && activity.actor !== "" ? activity.actor : null;
}

async function senderInbox(fetchActor, sender) {
  const response = await fetchActor(sender, { headers: { accept: "application/activity+json" } });
  if (!response.ok) throw new Error(`ActivityPub sender actor lookup failed with ${response.status}`);
  const document = await response.json();
  const inbox = typeof document?.inbox === "string" ? document.inbox : document?.inbox?.id;
  if (typeof inbox !== "string" || inbox === "") throw new Error("ActivityPub sender actor exposes no inbox");
  return inbox;
}

/**
 * The sole public face: verified ActivityPub carries a canonical CloudEvent,
 * whose data is one A2A ROLE_USER message with the cone's canonical RMN part.
 * There is deliberately no public A2A listener.
 */
export async function serveArticulatingActivityPub(options = {}) {
  const origin = requiredOrigin(options.origin ?? process.env.ACTIVITYPUB_ORIGIN);
  const identifier = options.identifier ?? process.env.ACTIVITYPUB_IDENTIFIER ?? "articulating-language-cone-service";
  const actor = `${origin}/actors/${identifier}`;
  const custody = options.custody ?? createActivityPubR2Custody({ actor: identifier });
  const discovery = options.agentCardDocuments ?? await projectSignedArticulatingAgentCard({
    baseUrl: origin,
    signing: options.agentCardSigning,
  });
  const agentCard = `${origin}${discovery.path}`;
  const fetchActor = options.fetch ?? fetch;
  let running;

  async function receive(arrival) {
    const activity = arrival?.jsonLd;
    const sender = senderFrom(activity);
    if (sender === null || sender === actor) return;
    const projection = extractRmnActivity(activity, { expectedActor: sender, expectedRecipient: actor });
    // Reject any merely decodable or wrong-operation payload before the A2A
    // boundary; the executor then performs the existing signed move unchanged.
    decodeCanonicalArticulatingRmn(projection.objectBytes);
    const responseMessage = await (options.execute ?? executeArticulatingA2aMove)(projection.a2aMessage);
    const responseBytes = extractRmnPart(parseA2aMessage(responseMessage).parts).bytes;
    const response = projectRmnActivity({
      type: "Accept",
      origin,
      identifier,
      recipient: sender,
      objectBytes: responseBytes,
      a2aMessage: responseMessage,
      a2aRole: "ROLE_AGENT",
      agentCard,
      eventTime: new Date().toISOString(),
    });
    await (options.deliver ?? deliverActivity)(running.provider, {
      activity: response,
      recipient: sender,
      inbox: await senderInbox(fetchActor, sender),
    });
  }

  running = await (options.serve ?? serveActivityPubProvider)({
    origin,
    identifier,
    actorName: "Obsmetrologia Articulating",
    summary: "Executes canonical Obsmetrologia articulation through ActivityPub-carried A2A RMN operations.",
    keyPath: options.keyPath ?? process.env.ACTIVITYPUB_KEYS_PATH,
    kv: custody.kv,
    inbox: custody.inbox,
    queue: custody.queue,
    hostname: options.hostname ?? process.env.HOST ?? "0.0.0.0",
    port: Number(options.port ?? process.env.PORT ?? "8080"),
    bearerToken: options.bearerToken ?? randomBytes(32).toString("base64url"),
    onActivity: receive,
    listOutbox: async () => ({ items: [] }),
    wellKnownResources: {
      [discovery.path]: discovery.card,
      [discovery.jwksPath]: discovery.jwks,
    },
  });
  void running.provider.federation.startQueue(undefined).catch((error) => {
    process.stderr.write(`ActivityPub queue worker stopped: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  });
  return running;
}

if (
  process.argv[1]
  && existsSync(process.argv[1])
  && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  serveArticulatingActivityPub().then(() => {
    const origin = requiredOrigin(process.env.ACTIVITYPUB_ORIGIN);
    const identifier = process.env.ACTIVITYPUB_IDENTIFIER ?? "articulating-language-cone-service";
    process.stdout.write(`${origin}/actors/${identifier}\n`);
  }).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
