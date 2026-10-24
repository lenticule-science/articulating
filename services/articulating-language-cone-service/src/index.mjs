export * from "./apex.mjs";
export * from "./rmn-face.mjs";
export * from "./a2a-face.mjs";
// Federation is an explicit optional public boundary; pure operation readers do not load it.
export async function serveArticulatingActivityPub(...arguments_) {
  const { serveArticulatingActivityPub } = await import("./serve-activitypub.mjs");
  return serveArticulatingActivityPub(...arguments_);
}
export * from "./mcp-face.mjs";
