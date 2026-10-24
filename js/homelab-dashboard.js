/* Public monitoring dashboard. Measurements come only from the live snapshot. */
(() => {
  "use strict";
  const root = document.querySelector("#lab-dashboard");
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const labels = { operational: "Operational", degraded: "Degraded", outage: "Outage", maintenance: "Maintenance", unknown: "Unknown", stale: "Stale", disconnected: "Disconnected" };
  const number = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const percent = (used, total) => number(used) && number(total) && total > 0 ? Math.min(100, used / total * 100) : null;
  const metric = (value, suffix = "", digits = 0) => number(value) ? `${value.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}` : "—";
  const when = (value, options) => window.LabStatus.formatTimestamp(value, options);
  const bytes = (value) => {
    if (!number(value)) return "—";
    const exponent = value > 0 ? Math.min(4, Math.floor(Math.log(value) / Math.log(1024))) : 0;
    return `${metric(value / 1024 ** exponent, "", 1)} ${["B", "KiB", "MiB", "GiB", "TiB"][exponent]}`;
  };
  const el = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  let snapshot = { nodes: [], services: [], backups: [], history: [], events: [], generatedAt: null };
  let failed = false, rangeHours = 24, request = null;
  let category = "all", showAllEvents = false;
  let resourceNodeId = "docker-host";
  let trafficMonth = "";
  const infrastructureOrder = ["network", "proxmox", "truenas", "docker-host"];
  const orderedNodes = () => [...snapshot.nodes].sort((a, b) => {
    const rank = (node) => infrastructureOrder.includes(node.id) ? infrastructureOrder.indexOf(node.id) : infrastructureOrder.length;
    return rank(a) - rank(b);
  });
  const expandedServices = new Set(), expandedNodes = new Set();
  const icons = {
    server: ["M4 3h16v7H4zM4 14h16v7H4zM7 6h.01M7 17h.01M11 6h6M11 17h6"],
    cube: ["m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"],
    disk: ["M4 5c0-4 16-4 16 0s-16 4-16 0Zm0 0v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"],
    network: ["M9 2h6v6H9zM2 16h6v6H2zM16 16h6v6h-6zM12 8v4M5 16v-4h14v4"],
    cpu: ["M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"],
    activity: ["M3 12h4l3-8 4 16 3-8h4"], clock: ["M12 7v6l4 2", "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0"],
    book: ["M12 5c-3-3-7-3-10-1v16c3-2 7-2 10 1 3-3 7-3 10-1V4c-3-2-7-2-10 1Zm0 0v16"],
    search: ["M16 16l6 6M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0"],
    alert: ["m12 2 11 19H1zM12 8v6M12 17h.01"], refresh: ["M20 7a9 9 0 1 0 1 8M20 2v5h-5"],
    flask: ["M9 2h6M10 2v7l-6 11q-1 2 1 2h14q2 0 1-2L14 9V2M8 14h8"]
  };
  function icon(name) {
    const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.classList.add("dash-icon");
    (icons[name] || icons.cube).forEach((d) => { const path = document.createElementNS(ns, "path"); path.setAttribute("d", d); svg.append(path); });
    return svg;
  }
  document.querySelectorAll("[data-icon]").forEach((item) => item.append(icon(item.dataset.icon)));
  const state = (value) => Object.hasOwn(labels, value) ? value : "unknown";
  const stale = () => window.LabStatus.isStale(snapshot, { failed });
  const effective = (item) => stale() ? "unknown" : state(item.status);
  const measured = (item, key) => stale() || ["unknown", "outage", "maintenance"].includes(effective(item)) ? null : item[key];
  const badge = (value) => {
    const node = el("span", "dash-badge", labels[state(value)]);
    node.dataset.state = state(value);
    return node;
  };
  const overall = () => window.LabStatus.overall(snapshot, { failed });
  const viewNow = () => stale() && Number.isFinite(Date.parse(snapshot.generatedAt)) ? Math.min(Date.now(), Date.parse(snapshot.generatedAt)) : Date.now();
  const history = () => snapshot.history.filter((point) => {
    const time = Date.parse(point.at);
    return time >= viewNow() - rangeHours * 3600000 && time <= viewNow();
  });
  const resourceNode = () => snapshot.nodes.find((node) => node.id === resourceNodeId);
  const resourceHistory = () => history().map((point) => {
    const metrics = point.nodes?.[resourceNodeId];
    // Before per-host history, this deployment only collected Docker VM metrics.
    if (!point.nodes && resourceNodeId === (snapshot.legacyResourceNodeId || "docker-host")) return point;
    return { at: point.at, cpuPercent: null, memoryPercent: null, rxMbps: null, txMbps: null, ...metrics };
  });
  function renderResourceHost() {
    if (!snapshot.nodes.some((node) => node.id === resourceNodeId)) {
      resourceNodeId = snapshot.nodes.find((node) => node.id === (snapshot.resourceNodeId || "docker-host"))?.id || snapshot.nodes[0]?.id || "docker-host";
    }
    const select = $("dash-host");
    const nodes = orderedNodes();
    if ([...select.options].map((option) => option.value + option.textContent).join() !== nodes.map((node) => node.id + node.name).join()) {
      select.replaceChildren(...nodes.map((node) => { const option = el("option", "", node.name); option.value = node.id; return option; }));
    }
    select.value = resourceNodeId; select.disabled = !snapshot.nodes.length;
    const node = resourceNode(), name = node?.name || "Docker host";
    $("dash-compute-title").textContent = `${name} · CPU & RAM`;
    $("dash-network-title").textContent = `${name} · Network I/O`;
    const arc = node && measured(node, "zfsArcBytes");
    $("dash-host-note").textContent = number(arc) ? `Includes ${bytes(arc)} ZFS cache` : "";
    $("dash-host-note").hidden = !number(arc);
  }
  function renderSummary() {
    const status = overall(), isStale = stale(), hasSnapshot = !!snapshot.generatedAt;
    const disconnected = failed;
    root.dataset.stale = String(isStale && hasSnapshot);
    root.querySelector(".dash-banner").dataset.tone = disconnected ? "disconnected" : isStale && hasSnapshot ? "stale" : status;
    $("dash-overall").textContent = disconnected ? "Monitoring disconnected" : isStale && hasSnapshot ? "Snapshot stale" :
      !hasSnapshot ? "Unknown" : { operational: "Healthy", outage: "Service outage", degraded: "Needs attention", maintenance: "Maintenance", unknown: "Coverage incomplete" }[status];
    $("dash-message").textContent = isStale && hasSnapshot ? "Showing recorded data" : "";
    $("dash-message").hidden = !$("dash-message").textContent;
    $("dash-mode").textContent = disconnected ? "Disconnected" : !hasSnapshot ? "Not connected" : isStale ? "Stale data" : "Connected";
    $("dash-updated").textContent = hasSnapshot ? when(snapshot.generatedAt, { month: undefined, day: undefined }) : "Never";
    $("dash-updated").title = hasSnapshot ? when(snapshot.generatedAt) : "";
    if (hasSnapshot) $("dash-updated").dateTime = snapshot.generatedAt; else $("dash-updated").removeAttribute("datetime");
    const healthy = (items) => items.filter((item) => effective(item) === "operational").length;
    const known = (items) => items.filter((item) => effective(item) !== "unknown").length;
    const latencies = snapshot.services.map((item) => measured(item, "latencyMs")).filter(number);
    const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;
    const fraction = (items) => known(items) ? `${healthy(items)} / ${items.length}` : "Unknown";
    const ratio = (items) => known(items) && items.length ? healthy(items) / items.length * 100 : null;
    const backupTimes = snapshot.backups.map((backup) => Date.parse(backup.lastSuccessAt)).filter(Number.isFinite);
    const lastBackup = backupTimes.length ? when(Math.max(...backupTimes)) : "Unknown";
    const stats = [
      ["server", "Infrastructure", fraction(snapshot.nodes), ratio(snapshot.nodes)],
      ["cube", "Services", fraction(snapshot.services), ratio(snapshot.services)],
      ["activity", "Avg. response", number(avg) ? metric(avg, " ms") : "Unknown", null],
      ["disk", "Last Backup", lastBackup, null]
    ];
    $("dash-stats").replaceChildren(...stats.map(([symbol, label, value, progress]) => {
      const item = el("article", `dash-stat${symbol === "disk" && backupTimes.length ? " dash-stat-time" : ""}`);
      item.append(icon(symbol), el("span", "", label), el("strong", "", value));
      if (number(progress)) item.append(track(progress, progress < 100));
      return item;
    }));
    root.querySelectorAll(".dash-chart-notice").forEach((notice) => { notice.hidden = !(isStale && snapshot.history.length); });
    const selected = resourceNode();
    const latest = selected ? { cpuPercent: measured(selected, "cpuPercent"), memoryPercent: percent(measured(selected, "memoryUsedBytes"), measured(selected, "memoryTotalBytes")), rxMbps: measured(selected, "networkRxMbps"), txMbps: measured(selected, "networkTxMbps") } : null;
    for (const [id, key, suffix] of [["dash-cpu-latest", "cpuPercent", "%"], ["dash-ram-latest", "memoryPercent", "%"], ["dash-rx-latest", "rxMbps", " Mbps"], ["dash-tx-latest", "txMbps", " Mbps"]]) {
      $(id).textContent = metric(isStale ? null : latest?.[key], suffix);
    }
  }

  function track(value, warning = false) {
    const bar = el("div", `dash-meter${warning ? " warning" : ""}`), fill = el("span");
    bar.setAttribute("aria-hidden", "true");
    fill.style.width = `${number(value) ? Math.min(100, value) : 0}%`;
    bar.append(fill); return bar;
  }

  function renderNodes() {
    const focusedNode = document.activeElement?.closest(".dash-node")?.dataset.nodeId;
    const nodes = orderedNodes().map((node) => {
      const card = el("details", "dash-node"); card.open = expandedNodes.has(node.id); card.dataset.nodeId = node.id;
      card.addEventListener("toggle", () => card.open ? expandedNodes.add(node.id) : expandedNodes.delete(node.id));
      const heading = el("summary"), name = el("div");
      name.append(el("h4", "", node.name), badge(effective(node)));
      heading.append(icon(node.id === "truenas" ? "disk" : node.id === "network" ? "network" : "cube"), name);
      const values = el("dl", "dash-node-metrics");
      const uptime = measured(node, "uptimeSeconds");
      const memory = percent(measured(node, "memoryUsedBytes"), measured(node, "memoryTotalBytes"));
      for (const [label, value] of [["CPU", metric(measured(node, "cpuPercent"), "%")], ["RAM", metric(memory, "%")], ["Uptime", number(uptime) ? `${Math.floor(uptime / 86400)}d ${Math.floor(uptime % 86400 / 3600)}h` : "—"]]) {
        const entry = el("div"); entry.append(el("dt", "", label), el("dd", "", value)); values.append(entry);
      }
      const arc = measured(node, "zfsArcBytes");
      const detail = el("p", "dash-node-detail", `RAM ${bytes(measured(node, "memoryUsedBytes"))} / ${bytes(measured(node, "memoryTotalBytes"))}${number(arc) ? ` · ZFS cache ${bytes(arc)}` : ""} · Checked ${when(node.lastChecked)}`);
      // The summary contains the quick metrics; expanding reveals collection context.
      const quick = el("div", "dash-node-quick"); quick.append(values); heading.append(quick);
      const view = el("button", "", "View resource history"); view.type = "button";
      view.addEventListener("click", () => { resourceNodeId = node.id; render(); $("dash-host").focus({ preventScroll: false }); });
      card.append(heading, detail, view); return card;
    });
    $("dash-nodes").replaceChildren(...(nodes.length ? nodes : [el("p", "dash-empty", "No infrastructure checks configured.")]));
    if (focusedNode) nodes.find((node) => node.dataset.nodeId === focusedNode)?.querySelector("summary").focus({ preventScroll: true });
  }

  function renderGroups() {
    const focusedGroup = document.activeElement?.closest("#dash-groups button")?.dataset.group;
    const groups = ["all", ...new Set(snapshot.services.map((service) => service.group))];
    if (!groups.includes(category)) category = "all";
    $("dash-groups").replaceChildren(...groups.map((group) => {
      const count = group === "all" ? snapshot.services.length : snapshot.services.filter((service) => service.group === group).length;
      const button = el("button", "", `${group === "all" ? "All" : group} (${count})`);
      button.dataset.group = group;
      button.type = "button"; button.setAttribute("aria-pressed", String(category === group));
      button.addEventListener("click", () => { category = group; renderGroups(); renderServices(); });
      return button;
    }));
    if (focusedGroup) [...$("dash-groups").children].find((button) => button.dataset.group === focusedGroup)?.focus({ preventScroll: true });
  }

  function renderServices() {
    const focusedService = document.activeElement?.closest("#dash-services .dash-expand")?.getAttribute("aria-label");
    const query = $("dash-search").value.trim().toLocaleLowerCase(), issues = $("dash-issues").checked;
    const points = history(), isStale = stale();
    const visible = snapshot.services.filter((service) => (!query || `${service.name} ${service.group}`.toLocaleLowerCase().includes(query)) &&
      (category === "all" || service.group === category) && (!issues || effective(service) !== "operational"));
    const now = viewNow(), start = now - rangeHours * 3600000;
    const rows = visible.flatMap((service) => {
      const row = el("tr"); row.setAttribute("role", "row");
      const name = el("td"), identity = el("div", "dash-service-identity"), mark = el("span", "dash-service-mark", service.name.slice(0, 1));
      mark.setAttribute("aria-hidden", "true"); mark.dataset.group = service.group;
      identity.append(mark, el("span", "dash-service-name", service.name)); name.append(identity);
      const status = el("td"); status.append(badge(effective(service)));
      const availability = el("td"), wrap = el("div", "dash-availability"), bars = el("div", "dash-history-bars");
      bars.setAttribute("aria-hidden", "true");
      const samples = points.map((point) => ({ at: Date.parse(point.at), status: state(point.services?.[service.id]) }));
      const observed = samples.filter((point) => ["operational", "degraded", "outage"].includes(point.status));
      const available = observed.filter((point) => point.status === "operational").length;
      const availabilityText = observed.length ? `${(available / observed.length * 100).toFixed(1)}%` : "Unknown";
      for (let i = 0; i < 20; i++) {
        const from = start + i / 20 * (now - start), to = start + (i + 1) / 20 * (now - start);
        const states = samples.filter((point) => point.at >= from && point.at <= to).map((point) => point.status), bar = el("span");
        bar.dataset.state = ["outage", "degraded", "maintenance", "operational"].find((value) => states.includes(value)) || "unknown";
        bars.append(bar);
      }
      wrap.append(el("span", "", isStale ? "Unknown" : availabilityText), bars);
      wrap.title = `${observed.length} recorded samples; ${isStale ? "historical only; " : ""}unknown and maintenance excluded`;
      availability.append(wrap);
      const expandCell = el("td"), expand = el("button", "dash-expand", "›");
      const detailRow = el("tr", "dash-service-detail"), detailCell = el("td");
      const detailId = `dash-service-detail-${snapshot.services.indexOf(service)}`;
      detailRow.id = detailId; detailRow.hidden = !expandedServices.has(service.id); detailCell.colSpan = 5;
      detailCell.append(el("p", "", `${service.group} · Checked ${when(service.lastChecked)}`),
        el("p", "", `${observed.length} samples · ${isStale ? "Recorded uptime" : "Uptime"} ${availabilityText}`));
      detailRow.append(detailCell); expand.type = "button";
      expand.setAttribute("aria-label", `Details for ${service.name}`); expand.setAttribute("aria-expanded", String(!detailRow.hidden)); expand.setAttribute("aria-controls", detailId);
      expand.addEventListener("click", () => {
        detailRow.hidden = !detailRow.hidden; expand.setAttribute("aria-expanded", String(!detailRow.hidden));
        if (detailRow.hidden) expandedServices.delete(service.id); else expandedServices.add(service.id);
      });
      expandCell.append(expand);
      row.append(name, status, el("td", "", metric(measured(service, "latencyMs"), " ms")), availability, expandCell);
      [...row.children].forEach((cell) => cell.setAttribute("role", "cell"));
      return [row, detailRow];
    });
    if (!rows.length) { const row = el("tr"), cell = el("td", "dash-empty", "No services match these filters."); cell.colSpan = 5; row.append(cell); rows.push(row); }
    $("dash-services").replaceChildren(...rows);
    if (focusedService) [...$("dash-services").querySelectorAll(".dash-expand")].find((button) => button.getAttribute("aria-label") === focusedService)?.focus({ preventScroll: true });
    $("dash-service-count").textContent = `${visible.length} / ${snapshot.services.length} · ${rangeHours === 168 ? "7d" : `${rangeHours}h`}`;
    $("dash-issues-label").textContent = `Needs attention (${snapshot.services.filter((service) => effective(service) !== "operational").length})`;
  }

  function renderStorage() {
    const disks = snapshot.nodes.filter((node) => node.id === "truenas").flatMap((node) => ["zpool", "vmpool"].map((name) => {
      const disk = (node.disks || []).find((disk) => disk.name === name) || { name };
      const item = el("div", "dash-storage-item");
      const reporting = !stale() && ["operational", "degraded"].includes(effective(node));
      const used = reporting ? disk.usedBytes : null, total = reporting ? disk.totalBytes : null, value = percent(used, total);
      const totals = el("dl", "dash-wan-totals dash-storage-totals");
      for (const [label, amount] of [["Used", used], ["Free", number(total) && number(used) ? Math.max(0, total - used) : null], ["Total", total], ["Usage", value]]) {
        const stat = el("div"), amountText = label === "Usage" ? metric(amount, "%") : bytes(amount), reading = el("dd");
        const separator = amountText.lastIndexOf(" ");
        reading.append(document.createTextNode(separator < 0 ? amountText : amountText.slice(0, separator)));
        if (separator >= 0) reading.append(document.createTextNode(" "), el("span", "dash-storage-unit", amountText.slice(separator + 1)));
        stat.append(el("dt", "", label), reading); totals.append(stat);
      }
      item.append(el("p", "dash-storage-label", disk.name), totals, track(value, value >= 90));
      return item;
    }));
    $("dash-storage").replaceChildren(...(disks.length ? disks : [el("p", "dash-empty", "Waiting for pool data")]));
    const events = snapshot.events.slice(showAllEvents ? -20 : -4).reverse().map((event) => {
      const item = el("li"), dot = el("span", "dash-event-dot"), text = el("div"); dot.dataset.state = state(event.status); dot.setAttribute("aria-hidden", "true");
      const date = el("time", "", when(event.at)); if (Number.isFinite(Date.parse(event.at))) date.dateTime = event.at;
      text.append(el("p", "", `${event.name} · ${labels[state(event.previousStatus)]} → ${labels[state(event.status)]}`), date); item.append(dot, text); return item;
    });
    $("dash-events").replaceChildren(...(events.length ? events : [el("li", "dash-empty", "No recorded status changes yet.")]));
    $("dash-events-toggle").hidden = snapshot.events.length <= 4;
    $("dash-events-toggle").textContent = showAllEvents ? "Show recent" : "View all";
    $("dash-events-toggle").setAttribute("aria-expanded", String(showAllEvents));
  }

  function renderWanUsage() {
    const gateway = snapshot.nodes.find((node) => node.id === "network"), usage = gateway?.wanUsage;
    const periods = Array.isArray(usage?.periods) ? usage.periods : [], select = $("dash-wan-month");
    const monthName = (value) => new Date(`${value}-15T12:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
    if (!periods.some((period) => period.month === trafficMonth)) trafficMonth = periods[0]?.month || "";
    if ([...select.options].map((option) => option.value).join() !== periods.map((period) => period.month).join()) {
      select.replaceChildren(...periods.map((period) => { const option = el("option", "", `${monthName(period.month)}${period.current ? " · to date" : ""}`); option.value = period.month; return option; }));
    }
    select.value = trafficMonth; select.disabled = !periods.length;
    const period = periods.find((period) => period.month === trafficMonth);
    const valid = period && !stale() && ["operational", "degraded"].includes(effective(gateway));
    const amount = (value) => {
      if (!number(value)) return "—";
      const unit = value >= 1e12 ? "TB" : value >= 1e9 ? "GB" : "MB", divisor = { TB: 1e12, GB: 1e9, MB: 1e6 }[unit];
      return `${metric(value / divisor, "", 2)} ${unit}`;
    };
    $("dash-wan-download").textContent = amount(valid ? period.downloadBytes : null);
    $("dash-wan-upload").textContent = amount(valid ? period.uploadBytes : null);
    const notice = $("dash-wan-period");
    notice.textContent = !valid ? stale() && period ? "Monitoring is stale; current WAN totals are unknown." : "Monthly WAN statistics are unavailable." :
      !number(period.downloadBytes) || !number(period.uploadBytes) ? "No recorded WAN data for this month yet." : "";
    notice.hidden = !notice.textContent;
  }

  function chartTicks(start, end) {
    const ticks = [];
    if (rangeHours === 1) {
      const step = 15 * 60000;
      for (let at = Math.ceil(start / step) * step; at <= end; at += step) ticks.push(at);
      return ticks;
    }
    const hour = new Intl.DateTimeFormat("en-US", { timeZone: window.LabStatus.timeZone, hour: "2-digit", hourCycle: "h23" });
    const step = 3600000;
    for (let at = Math.ceil(start / step) * step; at <= end; at += step) {
      const centralHour = Number(hour.format(at));
      if (rangeHours === 24 ? centralHour % 6 === 0 : centralHour === 0) ticks.push(at);
    }
    return rangeHours === 24 ? ticks : ticks.filter((_, index) => index % 2 === 0);
  }

  function chart(target, series, cap) {
    const points = resourceHistory();
    if (!points.some((p) => series.some((s) => number(p[s.key])))) {
      $(target).replaceChildren(el("p", "dash-empty", "No data for this range"));
      return;
    }
    const ns = "http://www.w3.org/2000/svg";
    const svgNode = (tag, attrs = {}, text) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const svg = svgNode("svg", { viewBox: "0 0 500 190", role: "img", "aria-label": `${resourceNode()?.name || "Host"}: ${target === "dash-compute-chart" ? "CPU and memory utilization" : "Received and sent network traffic"} over the past ${rangeHours} ${rangeHours === 1 ? "hour" : "hours"}` });
    const max = cap || Math.max(1, ...points.flatMap((p) => series.map((s) => number(p[s.key]) ? p[s.key] : 0))) * 1.15;
    const now = viewNow(), start = now - rangeHours * 3600000;
    const x = (at) => 42 + (Date.parse(at) - start) / (now - start) * 448;
    const y = (value) => 152 - Math.min(max, value) / max * 140;
    for (let i = 0; i <= 4; i++) {
      const height = 12 + i * 35;
      svg.append(svgNode("line", { x1: 42, x2: 490, y1: height, y2: height, class: "chart-grid" }),
        svgNode("text", { x: 32, y: height + 4, "text-anchor": "end" }, metric(max * (4 - i) / 4, "", max < 10 ? 1 : 0)));
    }
    const tooltip = el("div", "dash-chart-tooltip");
    tooltip.id = `${target}-tooltip`; tooltip.setAttribute("role", "tooltip"); tooltip.hidden = true;
    const summaries = [];
    series.forEach(({ key, color, name }) => {
      let path = "", previousAt = 0, last = null;
      points.forEach((point) => {
        const at = Date.parse(point.at), value = point[key];
        if (!number(value)) { previousAt = 0; return; }
        path += `${!previousAt || at - previousAt > 15 * 60000 ? "M" : "L"}${x(point.at).toFixed(1)},${y(value).toFixed(1)} `;
        previousAt = at; last = value;
      });
      if (path) svg.append(svgNode("path", { d: path, stroke: color, class: "chart-line" }));
      summaries.push(`${name}: latest recorded ${metric(last, cap ? "%" : " Mbps", 1)}`);
    });
    svg.prepend(svgNode("title", {}, summaries.join(". ")));
    const today = window.LabStatus.dayKey(Date.now());
    for (const at of chartTicks(start, now)) {
      const date = new Date(at), position = x(date.toISOString());
      const anchor = position < 95 ? "start" : position > 437 ? "end" : "middle";
      const value = window.LabStatus.dayKey(at) === today && rangeHours <= 24 ?
        date.toLocaleTimeString("en-US", { timeZone: window.LabStatus.timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) :
        date.toLocaleDateString("en-US", { timeZone: window.LabStatus.timeZone, month: "short", day: "numeric" });
      const fullTime = when(at, { weekday: "short", year: "numeric" });
      const tick = svgNode("g", { class: "chart-tick", tabindex: "0", "aria-label": fullTime, "aria-describedby": tooltip.id });
      const label = svgNode("text", { x: position, y: 180, "text-anchor": anchor }, value);
      tick.append(svgNode("line", { x1: position, x2: position, y1: 12, y2: 152, class: "chart-grid" }),
        label, svgNode("rect", { x: position - 12, y: 12, width: 24, height: 176, fill: "transparent" }));
      const showTime = () => { tooltip.textContent = fullTime; tooltip.hidden = false; };
      tick.addEventListener("mouseenter", showTime);
      tick.addEventListener("focus", showTime);
      tick.addEventListener("click", () => { tick.focus(); showTime(); });
      tick.addEventListener("mouseleave", () => { if (document.activeElement !== tick) tooltip.hidden = true; });
      tick.addEventListener("blur", () => { tooltip.hidden = true; });
      tick.addEventListener("keydown", (event) => { if (event.key === "Escape") tooltip.hidden = true; });
      svg.append(tick);
    }
    $(target).replaceChildren(svg, tooltip);
  }

  function render() {
    renderResourceHost();
    renderSummary(); renderNodes(); renderServices(); renderStorage(); renderWanUsage();
    chart("dash-compute-chart", [{ key: "cpuPercent", color: "#91a7e3", name: "CPU" }, { key: "memoryPercent", color: "#b4a1cf", name: "Memory" }], 100);
    chart("dash-network-chart", [{ key: "rxMbps", color: "#91a7e3", name: "Received" }, { key: "txMbps", color: "#b4a1cf", name: "Sent" }]);
  }

  function setSnapshot(data) {
    window.LabStatus.validateSnapshot(data);
    snapshot = data;
    renderGroups();
  }

  async function refresh() {
    if (request) return;
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const data = await window.LabStatus.loadSnapshot(root.dataset.statusEndpoint, { signal: controller.signal });
      if (request !== controller) return;
      setSnapshot(data); failed = false;
    } catch {
      if (request !== controller) return;
      failed = true;
    } finally {
      clearTimeout(timeout);
      if (request === controller) request = null;
      render();
    }
  }

  root.querySelectorAll(".dash-ranges").forEach((control) => { control.hidden = false; });
  $("dash-service-controls").hidden = false;
  root.querySelector(".dash-resource-controls").hidden = false;
  root.querySelector(".dash-wan-month-label").hidden = false;
  $("dash-wan-month").addEventListener("change", () => { trafficMonth = $("dash-wan-month").value; renderWanUsage(); });
  $("dash-host").addEventListener("change", () => { resourceNodeId = $("dash-host").value; render(); });
  $("dash-events-toggle").addEventListener("click", () => { showAllEvents = !showAllEvents; renderStorage(); });
  for (const id of ["dash-search", "dash-issues"]) $(id).addEventListener(id === "dash-search" ? "input" : "change", renderServices);
  root.querySelectorAll("[data-range]").forEach((button) => button.addEventListener("click", () => {
    rangeHours = Number(button.dataset.range);
    root.querySelectorAll("[data-range]").forEach((item) => item.setAttribute("aria-pressed", String(Number(item.dataset.range) === rangeHours)));
    render();
  }));
  setInterval(() => { if (!document.hidden) { render(); refresh(); } }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { render(); refresh(); } });
  render(); refresh();
})();
