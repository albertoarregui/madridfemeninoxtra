import test from "node:test";
import assert from "node:assert/strict";
const hasScore=(v:any)=>v!==null&&v!==undefined&&String(v).trim()!=="";
const isPlayed=(m:any)=>hasScore(m.goles_rm)&&hasScore(m.goles_rival);
test("scheduled match is never played",()=>assert.equal(isPlayed({goles_rm:null,goles_rival:null}),false));
test("partial score is never played",()=>assert.equal(isPlayed({goles_rm:2,goles_rival:null}),false));
test("zero-zero is a valid final score",()=>assert.equal(isPlayed({goles_rm:0,goles_rival:0}),true));
