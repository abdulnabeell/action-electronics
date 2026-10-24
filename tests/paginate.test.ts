import test from "node:test";
import assert from "node:assert/strict";
import { fetchAllPages } from "../src/lib/paginate.ts";

const source = (n: number) => async (from: number, to: number) => ({ data: Array.from({ length: n }, (_, i) => i).slice(from, to + 1), error: null });

test("fetchAllPages reads past the 1000-row API cap", async () => {
  assert.equal((await fetchAllPages(source(2500))).length, 2500);
  assert.equal((await fetchAllPages(source(1000))).length, 1000);
  assert.equal((await fetchAllPages(source(0))).length, 0);
});

test("fetchAllPages surfaces a database error instead of returning partial data", async () => {
  await assert.rejects(fetchAllPages(async () => ({ data: null, error: { message: "boom" } })), /boom/);
});
