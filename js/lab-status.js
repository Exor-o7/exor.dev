/* Shared snapshot contract for the lab overview and full dashboard. */
(() => {
  "use strict";
  const sourceStates = new Set(["operational", "degraded", "outage", "maintenance", "unknown"]);
  const number = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const timeZone = "America/Chicago";
  const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const dayKey = (value) => dayFormat.format(new Date(value));
  function formatTimestamp(value, options = {}) {
    const date = new Date(value);
    if (value === null || value === undefined || !Number.isFinite(date.getTime())) return "Not recorded";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short", ...options, timeZone, hourCycle: "h23" }).format(date);
  }
  function validateSnapshot(data) {
    if (!data || data.schemaVersion !== 1 || !["nodes", "services", "backups", "history", "events"].every((key) => Array.isArray(data[key]))) throw new Error("Invalid snapshot");
    if (data.generatedAt !== null && (typeof data.generatedAt !== "string" || !Number.isFinite(Date.parse(data.generatedAt)))) throw new Error("Invalid snapshot time");
    if (!number(data.staleAfterSeconds) || data.staleAfterSeconds < 30 || data.staleAfterSeconds > 10800) throw new Error("Invalid expiry");
    for (const key of ["nodes", "services", "backups"]) {
      if (data[key].length > 100 || data[key].some((item) => !item || typeof item.id !== "string" || typeof item.name !== "string" || !sourceStates.has(item.status))) throw new Error("Invalid items");
      if (new Set(data[key].map((item) => item.id)).size !== data[key].length) throw new Error("Duplicate item IDs");
    }
    if (data.nodes.some((node) => (node.disks !== undefined && (!Array.isArray(node.disks) || node.disks.length > 20 || node.disks.some((disk) => !disk || typeof disk.name !== "string")))) ||
      data.services.some((service) => typeof service.group !== "string")) throw new Error("Invalid details");
    for (const node of data.nodes) {
      const usage = node.wanUsage;
      if (usage === undefined || usage === null) continue;
      if (usage.timezone !== "America/Chicago" || !Number.isFinite(Date.parse(usage.collectedAt)) || !Array.isArray(usage.periods) || usage.periods.length > 13 ||
          usage.periods.some((period) => !period || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period.month) || typeof period.current !== "boolean" ||
            ["periodStart", "periodEnd", "through"].some((key) => !Number.isFinite(Date.parse(period[key]))) ||
            ["downloadBytes", "uploadBytes", "coveragePercent"].some((key) => period[key] !== null && !number(period[key])) || period.coveragePercent > 100)) throw new Error("Invalid WAN statistics");
    }
    if (data.history.length > 2500 || data.events.length > 100) throw new Error("Snapshot too large");
    if (data.history.some((point) => !point || !Number.isFinite(Date.parse(point.at)) || !point.services || typeof point.services !== "object") ||
      data.events.some((event) => !event || typeof event.name !== "string" || !Number.isFinite(Date.parse(event.at)))) throw new Error("Invalid history");
    return data;
  }
  function isStale(snapshot, { failed = false, now = Date.now() } = {}) {
    const at = Date.parse(snapshot?.generatedAt);
    return failed || !Number.isFinite(at) || at > now + 60000 ||
      now - at > Math.max(30, snapshot.staleAfterSeconds || 180) * 1000;
  }
  function overall(snapshot, options) {
    if (isStale(snapshot, options)) return "unknown";
    const states = [...snapshot.nodes, ...snapshot.services, ...snapshot.backups].map((item) => item.status);
    for (const status of ["outage", "degraded", "unknown", "maintenance"]) if (states.includes(status)) return status;
    return states.length ? "operational" : "unknown";
  }
  async function loadSnapshot(endpoint, { signal } = {}) {
    const response = await fetch(endpoint, { cache: "no-store", credentials: "omit", signal });
    if (!response.ok) throw new Error("Snapshot unavailable");
    const body = await response.text();
    if (body.length > 2000000) throw new Error("Snapshot too large");
    return validateSnapshot(JSON.parse(body));
  }
  window.LabStatus = Object.freeze({ validateSnapshot, isStale, overall, loadSnapshot, timeZone, dayKey, formatTimestamp });
})();
