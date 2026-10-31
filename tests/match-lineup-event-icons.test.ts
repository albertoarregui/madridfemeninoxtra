import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("lineup and substitute goal and assist icons use the timeline gold", () => {
  const source = readFileSync("src/pages/partidos/[slug].astro", "utf8");

  assert.match(
    source,
    /\.lineup-card \.event-icon-small,\s*\.subs-card \.event-icon-small\s*{\s*color: #d4a843;/,
  );
});
