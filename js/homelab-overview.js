/* A small live summary; the detailed dashboard and its demo stay on status.html. */
(() => {
  "use strict";
  const root = document.querySelector("#lab-status-overview");
  if (!root) return;
  const card = root.querySelector(".lab-status-card");
  const $ = (id) => document.getElementById(id);
  let snapshot = null, failed = false, pending = false;
  function render() {
    const hasSnapshot = Number.isFinite(Date.parse(snapshot?.generatedAt));
    const stale = window.LabStatus.isStale(snapshot, { failed });
    const health = window.LabStatus.overall(snapshot, { failed });
    card.dataset.state = failed ? "disconnected" : hasSnapshot && stale ? "stale" : health;
    $("lab-status-health").textContent = failed ? "Status unavailable" : hasSnapshot && stale ? "Status unknown" :
      { operational: "Operational", degraded: "Degraded", outage: "Outage", maintenance: "Maintenance", unknown: "Unknown" }[health];
    $("lab-status-note").textContent = failed ? "Unable to refresh current status." : hasSnapshot && stale ? "Snapshot is stale. Current health is unknown." :
      !hasSnapshot ? "Monitoring not connected." : health === "unknown" ? "Monitoring coverage incomplete." : "Latest read-only snapshot from the lab.";
    const services = snapshot?.services || [];
    const hasChecks = services.some((service) => service.status !== "unknown");
    $("lab-status-services").textContent = !stale && hasChecks ? `${services.filter((service) => service.status === "operational").length} / ${services.length}` : "Unknown";
    const time = $("lab-status-updated");
    time.textContent = hasSnapshot ? window.LabStatus.formatTimestamp(snapshot.generatedAt) : "Never";
    if (hasSnapshot) {
      time.dateTime = snapshot.generatedAt;
      time.title = window.LabStatus.formatTimestamp(snapshot.generatedAt, { weekday: "short", year: "numeric" });
    } else {
      time.removeAttribute("datetime"); time.removeAttribute("title");
    }
  }
  async function refresh() {
    if (pending) return;
    pending = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      snapshot = await window.LabStatus.loadSnapshot(root.dataset.statusEndpoint, { signal: controller.signal });
      failed = false;
    } catch {
      failed = true;
    } finally {
      clearTimeout(timeout); pending = false; render();
    }
  }
  setInterval(() => { if (!document.hidden) { render(); refresh(); } }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { render(); refresh(); } });
  render(); refresh();
})();
