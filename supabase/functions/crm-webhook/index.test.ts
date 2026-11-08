import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { onOrNextWorkingDay, warsawToday } from "../_shared/workingDays";

// Execute the real handler offline: imports, serving, environment and database are mocked.
// Every network call fails, and no real environment values are read.
const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
const compiled = new Bun.Transpiler({ loader: "ts" }).transformSync(source.replace(/^import .*;\n/gm, ""));
const primary = "offline-primary-not-a-real-secret";
const meta = "offline-meta-not-a-real-secret-0000";
const forms = {
  "917137684811951": "meta:lead-form:www",
  "1825068312268829": "meta:lead-form:wideo",
  "1088639844014115": "meta:lead-form:www-2026-11",
  "1135713892171107": "meta:lead-form:www-start-1490",
  "1103341015857330": "meta:lead-form:www-sms-2026-11",
};

async function offline(payload: unknown, options: { secret?: string; now?: string; existing?: Record<string, unknown> } = {}) {
  let handler: (request: Request) => Promise<Response> = async () => new Response(null, { status: 500 });
  const writes: { table: string; action: string; value: Record<string, unknown> }[] = [];
  const now = options.now ?? "2026-11-08T10:00:00Z";
  class FixedDate extends Date {
    constructor(value?: string | number) { super(value ?? now); }
    static now() { return new Date(now).getTime(); }
  }
  const database = {
    from(table: string) {
      let action = "select";
      const result = () => {
        if (table === "integration_events") return { data: { id: "offline-event", status: "processing" }, error: null };
        if (table === "leads") return { data: action === "insert" ? { id: "offline-lead" } : options.existing ? [options.existing] : [], error: null };
        return { data: null, error: null };
      };
      const chain = {
        insert(value: Record<string, unknown>) { action = "insert"; writes.push({ table, action, value }); return chain; },
        update(value: Record<string, unknown>) { action = "update"; writes.push({ table, action, value }); return chain; },
        upsert(value: Record<string, unknown>) { action = "upsert"; writes.push({ table, action, value }); return chain; },
        select() { return chain; }, eq() { return chain; }, limit() { return chain; },
        single() { return Promise.resolve(result()); }, maybeSingle() { return Promise.resolve(result()); },
        then(resolve: (value: unknown) => unknown) { return Promise.resolve(result()).then(resolve); },
      };
      return chain;
    },
  };
  const context = createContext({
    serve: (fn: typeof handler) => { handler = fn; }, createClient: () => database,
    Deno: { env: { get: (key: string) => ({ CRM_WEBHOOK_SECRET: primary, CRM_META_WEBHOOK_SECRET: meta,
      SUPABASE_URL: "https://offline.invalid", SUPABASE_SERVICE_ROLE_KEY: "offline-only" }[key]) } },
    Date: FixedDate, Request, Response, Headers, TextEncoder, crypto: globalThis.crypto, AbortSignal,
    onOrNextWorkingDay, warsawToday: () => warsawToday(new Date(now)),
    fetch: () => { throw new Error("Network forbidden in offline webhook test"); },
    console: { log() {}, error() {} },
  });
  runInContext(compiled, context);
  const response = await handler(new Request("https://offline.invalid/crm-webhook", {
    method: "POST", headers: { "content-type": "application/json", "x-webhook-secret": options.secret ?? primary }, body: JSON.stringify(payload),
  }));
  return { status: response.status, body: await response.json(), writes };
}

for (const [id, detail] of Object.entries(forms)) {
  test(`Meta form ${id} remains allowed offline`, async () => {
    const result = await offline({ type: "lead", source: { provider: "meta_ads", channel: "meta_ads", detail },
      external_event_id: "12345", metadata: { form_id: id, leadgen_id: "12345" }, data: { name: "Offline", phone: "123456789" } }, { secret: meta });
    expect(result.status).toBe(201);
    expect(result.body.success).toBe(true);
    expect(result.body.lead_id).toBe("offline-lead");
  });
}
test("New lead default uses next working day on Sunday", async () => {
  const result = await offline({ name: "Offline", email: "offline@example.invalid" });
  const lead = result.writes.find((w) => w.table === "leads" && w.action === "insert");
  expect(lead?.value.next_step).toBe("Zadzwonić");
  expect(lead?.value.next_step_date).toBe("2026-11-09");
});
test("New lead on Independence Day defaults to November 12", async () => {
  const result = await offline({ name: "Offline", email: "offline@example.invalid" }, { now: "2026-11-11T10:00:00Z" });
  expect(result.writes.find((w) => w.table === "leads")?.value.next_step_date).toBe("2026-11-12");
});
test("New lead defaults to today in Warsaw on working day", async () => {
  const result = await offline({ name: "Offline", email: "offline@example.invalid" }, { now: "2026-11-08T23:30:00Z" });
  expect(result.writes.find((w) => w.table === "leads")?.value.next_step_date).toBe("2026-11-09");
});
test("Existing lead date and next step are not overwritten", async () => {
  const result = await offline({ name: "Offline", email: "offline@example.invalid" }, { existing: {
    id: "existing", email: "offline@example.invalid", status: "new", next_step: "Istniejący krok", next_step_date: "2026-11-11", metadata: {},
  } });
  expect(result.status).toBe(200);
  const update = result.writes.find((w) => w.table === "leads" && w.action === "update");
  expect(update).toBeDefined();
  expect(Object.hasOwn(update?.value ?? {}, "next_step_date")).toBe(false);
  expect(Object.hasOwn(update?.value ?? {}, "next_step")).toBe(false);
});
test("Unauthenticated intake is rejected before any writes", async () => {
  const result = await offline({ name: "Offline", phone: "123456789" }, { secret: "wrong" });
  expect(result.status).toBe(401);
  expect(result.writes).toHaveLength(0);
});
test("Meta credential cannot accept unknown form", async () => {
  const result = await offline({ type: "lead", source: { provider: "meta_ads", channel: "meta_ads", detail: "meta:lead-form:unknown" }, external_event_id: "12345",
    metadata: { form_id: "999", leadgen_id: "12345" }, data: { name: "Offline", phone: "123456789" } }, { secret: meta });
  expect(result.status).toBe(403);
  expect(result.writes).toHaveLength(0);
});