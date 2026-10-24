// End-to-end smoke test driven through Chrome DevTools Protocol (no extra dependencies).
//   1. start the app:  npm run dev   (or  npm run build && npm start)
//   2. node tests/e2e.mjs [http://localhost:3000]
// Requires Google Chrome / Edge. Without Supabase env vars the app runs in demo mode (orders are not stored);
// with Supabase configured the same flow also verifies the order row (see docs/TESTING.md).
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const BASE = process.argv[2] ?? "http://localhost:3000";
const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const chromePath = candidates.find((p) => existsSync(p));
assert.ok(chromePath, "Chrome/Edge not found — set CHROME_PATH");

const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(chromePath, [`--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "ae-e2e-"))}`, "--headless=new", "--disable-gpu", "--window-size=1280,1000", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome DevTools not reachable");
}

const ws = new WebSocket(await connect());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const run = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "evaluate failed");
  return r.result?.result?.value;
};
const waitFor = async (expression, what, ms = 15000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try {
      if (await run(expression)) return;
    } catch {}
    await sleep(150);
  }
  throw new Error(`Timed out waiting for: ${what}`);
};
const goto = async (path) => {
  await send("Page.navigate", { url: BASE + path });
  await waitFor("document.readyState === 'complete'", `load ${path}`);
  await sleep(400);
};
const clickText = (sel, text) => run(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find(e => e.textContent.trim().includes(${JSON.stringify(text)})); if (!el) throw new Error('not found: ${text}'); el.click(); return true; })()`);
const fill = (selector, value) => run(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })); return true; })()`);
const text = () => run("document.body.innerText");

let failures = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log("  ok  ", name);
  } catch (e) {
    failures++;
    console.log("  FAIL", name, "\n      ", e.message);
  }
};

try {
  await send("Page.enable");
  // Capture window.open() so the test can read the WhatsApp URL without a real popup.
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.open = () => ({ close() {}, location: { set href(v) { sessionStorage.setItem('wa', v); } } });`,
  });

  await step("root redirects to a locale and remembers nothing yet", async () => {
    await goto("/");
    assert.match(await run("location.pathname"), /^\/(uae|oman)-(en|ar)$/);
  });

  await step("UAE English storefront: AED prices, LTR", async () => {
    await goto("/uae-en/product/laptop-14-i5");
    assert.equal(await run("document.documentElement.dir"), "ltr");
    assert.match(await text(), /AED 2,599\.00/);
  });

  await step("add to cart updates the header badge", async () => {
    await clickText("button", "Add to cart");
    await waitFor("document.querySelector('a[href=\"/uae-en/cart\"]')?.textContent.trim().endsWith('1')", "cart badge");
  });

  await step("cart shows regional price and quantity controls update totals", async () => {
    await goto("/uae-en/cart");
    await waitFor("document.body.innerText.includes('AED 2,599.00')", "cart line");
    await run("document.querySelector('button[aria-label=\"Quantity +\"]').click()");
    await waitFor("document.body.innerText.includes('AED 5,198.00')", "qty 2 total");
    await run("document.querySelector('button[aria-label=\"Quantity −\"]').click()");
    await waitFor("document.body.innerText.includes('AED 2,599.00')", "qty 1 total");
    await run("document.querySelector('button[aria-label=\"Quantity +\"]').click()");
    await waitFor("document.body.innerText.includes('AED 5,198.00')", "qty 2 again");
  });

  await step("checkout validates required fields", async () => {
    await clickText("button[type=submit]", "WhatsApp");
    await waitFor("document.body.innerText.includes('Please enter your name')", "validation errors");
  });

  await step("checkout saves the order, then opens WhatsApp with order ID and totals", async () => {
    await fill("#name", "E2E Tester");
    await fill("#phone", "+971500000000");
    await fill("#region", "Dubai");
    await fill("#address", "Deira, Dubai");
    await clickText("button[type=submit]", "WhatsApp");
    await waitFor("/\\/uae-en\\/order\\/AE-\\d{6}-[A-Z0-9]{6}/.test(location.pathname)", "order confirmation page");
    const url = await run("sessionStorage.getItem('wa')");
    assert.ok(url?.startsWith("https://wa.me/971552542000?text="), "WhatsApp URL points to the UAE number");
    const msg = decodeURIComponent(url.split("text=")[1]);
    const code = (await run("location.pathname")).split("/").pop();
    assert.ok(msg.includes(code), "message contains the order ID");
    assert.ok(msg.includes("AED 5,198.00"), "message contains the total");
    assert.ok(msg.includes("E2E Tester") && msg.includes("Deira, Dubai"));
    assert.equal(await run("JSON.parse(localStorage.getItem('action-electronics-cart-v2') || '{}')['laptop-14-i5'] ?? 0"), 0, "cart cleared after ordering");
  });

  await step("country switch to Oman changes currency, prices and availability", async () => {
    await goto("/uae-en/product/monitor-22-lcd");
    assert.match(await text(), /AED 349\.00/);
    await run("document.querySelector('button[aria-haspopup=listbox]').click()");
    await clickText("[role=option] a", "Oman");
    await waitFor("location.pathname === '/oman-en/product/monitor-22-lcd'", "navigate to Oman");
    await waitFor("document.body.innerText.includes('Not available in this country')", "unavailable notice");
    await goto("/oman-en/product/laptop-14-i5");
    assert.match(await text(), /OMR 273\.000/);
  });

  await step("country choice is remembered (cookie) for the next visit", async () => {
    await goto("/");
    assert.equal(await run("location.pathname"), "/oman-en");
  });

  await step("language switch gives Arabic RTL and keeps the country", async () => {
    await clickText("a[hreflang=ar]", "العربية");
    await waitFor("location.pathname === '/oman-ar'", "navigate to Arabic");
    assert.equal(await run("document.documentElement.dir"), "rtl");
    assert.equal(await run("document.documentElement.lang"), "ar");
    assert.match(await text(), /ر\.ع\./);
    await goto("/");
    assert.equal(await run("location.pathname"), "/oman-ar");
  });

  await step("Arabic UAE page: Arabic labels and AED symbol", async () => {
    await goto("/uae-ar/shop");
    assert.match(await text(), /د\.إ/);
    assert.match(await text(), /أضف إلى السلة/);
  });

  await step("shop filters and search work", async () => {
    await goto("/uae-en/shop");
    await fill("input[type=search][aria-label='Search products']", "controller");
    await waitFor("document.body.innerText.includes('Wireless Game Controller') && !document.body.innerText.includes('Mirrorless Camera')", "search filter");
    await goto("/uae-en/pre-owned");
    await waitFor("document.body.innerText.includes('Pre-Owned Tablet 64GB')", "pre-owned list");
    assert.ok(!(await text()).includes("Mirrorless Camera 24MP"), "new items hidden on pre-owned page");
  });
} finally {
  ws.close();
  chrome.kill();
}

console.log(failures ? `\n${failures} step(s) failed` : "\nAll end-to-end steps passed");
process.exit(failures ? 1 : 0);
