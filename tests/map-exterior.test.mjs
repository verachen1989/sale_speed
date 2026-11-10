import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exteriorPaths } from '../app/map-exterior.mjs';
const square = (x) => [[[x,0],[x+1,0],[x+1,1],[x,1],[x,0]]];
test('shared province edge is removed from the national border', () => {
 const paths=exteriorPaths([square(0),square(1)]);
 assert.equal(paths.length,1);
 assert.equal(paths[0].length,7);
 assert.deepEqual(paths[0][0],paths[0].at(-1));
});
test('islands remain separate and cannot create a cross-sea light',()=>{
 const paths=exteriorPaths([square(0),square(5)]);
 assert.equal(paths.length,2);
 assert.ok(paths.every(p=>p.length===5));
});
