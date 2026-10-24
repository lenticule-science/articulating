import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const entry = new URL('../src/index.mjs', import.meta.url);
const rmn = new URL('../src/rmn-face.mjs', import.meta.url);

test('the public core and exact EVM RMN face work when federation and SQL cannot load', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { registerHooks } from 'node:module';
    const attempted=[];
    registerHooks({resolve(specifier,context,next){
      if(specifier.startsWith('@red-cup-engineering/activitypub-services-section') || /sqlite|^node:sqlite$/u.test(specifier)){
        attempted.push(specifier);throw Error('explicit optional ActivityPub peer required');
      }
      return next(specifier,context);
    }});
    const core=await import(${JSON.stringify(entry.href)});
    const face=await import(${JSON.stringify(rmn.href)});
    const input={tokenMark:'token',claimMark:'claim'};
    const encoded=core.encodeArticulatingRequestRmn(input);
    const decoded=face.decodeCanonicalArticulatingRmn(encoded.bytes);
    assert.deepEqual(decoded.request.input,input);
    assert.equal(decoded.semanticId,encoded.semanticId);
    assert.equal(typeof core.executeArticulateUtterance,'function');
    assert.equal(typeof core.serveArticulatingActivityPub,'function');
    assert.deepEqual(attempted,[]);
    await assert.rejects(core.serveArticulatingActivityPub({}),/explicit optional ActivityPub peer required/u);
    assert.ok(attempted.length>0);
  `;
  execFileSync(process.execPath, ['--max-old-space-size=192', '--input-type=module', '--eval', script], {
    timeout: 20_000, maxBuffer: 65_536,
  });
});

test('canonical bytes and semantic identity retain the original published RMN contract', async () => {
  const { vectors } = JSON.parse(readFileSync(new URL('./original-rmn-vectors.json', import.meta.url)));
  const current = await import(rmn.href);
  for (const { input, base64, semanticId, decoded } of vectors) {
    const after = current.encodeArticulatingRequestRmn(input);
    assert.equal(Buffer.from(after.bytes).toString('base64'), base64);
    assert.equal(after.semanticId, semanticId);
    assert.deepEqual(JSON.parse(JSON.stringify(current.decodeCanonicalArticulatingRmn(after.bytes))), decoded);
  }
  const foreign = current.articulatingRmnProtocol.encodeRequest('another-operation', {});
  assert.throws(() => current.decodeCanonicalArticulatingRmn(foreign.bytes), /different operation/u);
});

test('the optional public provider is declared without entering ordinary dependency installation', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(manifest.dependencies['@red-cup-engineering/activitypub-services-section'], undefined);
  assert.equal(manifest.peerDependencies['@red-cup-engineering/activitypub-services-section'], '0.5.0');
  assert.equal(manifest.peerDependenciesMeta['@red-cup-engineering/activitypub-services-section'].optional, true);
});
