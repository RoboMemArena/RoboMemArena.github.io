async function loadData() {
  const res = await fetch("leaderboard_data.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`failed to load leaderboard_data.json: ${res.status}`);
  }
  return res.json();
}

const UNVERIFIED_ROWS = [
  {
    method: "SimpleMemVLA",
    tsr: 63.6,
    csr: 72.1,
    notes: "26×51, official-style protocol",
    repoStatus: "public",
    repoUrl: "https://github.com/OpenBMB/SimpleMemVLA",
  },
  {
    method: "HarnessWAM",
    tsr: 59.6,
    csr: 69.9,
    notes: "26 tasks, 20 rollouts/task",
    repoStatus: "missing",
  },
  {
    method: "BATON",
    tsr: 57.7,
    csr: 78.8,
    notes: "explore s50, eval s51–52",
    repoStatus: "missing",
  },
  {
    method: "RoboFoundry",
    tsr: 53.5,
    csr: 72.8,
    notes: "official protocol; Qwen3.7-Plus",
    repoStatus: "pending",
    repoUrl: "https://github.com/robofoundry2026/RoboFoundry",
  },
  {
    method: "FrameSamp+Modul",
    tsr: 46.15,
    csr: 63.93,
    notes: "26×20, seeds 100–119",
    repoStatus: "public",
    repoUrl: "https://github.com/RoboMME/robomme_policy_learning",
  },
  {
    method: "TaskAnchor",
    tsr: 44.4,
    csr: 60.5,
    notes: "full 26, standard protocol",
    repoStatus: "missing",
  },
  {
    method: "PrediMem",
    tsr: 38.5,
    csr: 55.2,
    notes: "benchmark paper result",
    repoStatus: "public",
    repoUrl: "https://github.com/OpenHelix-Team/RoboMemArena",
  },
  {
    method: "TraceFlow",
    tsr: 34.99,
    csr: 55.04,
    notes: "26×51, suite-conditioned",
    repoStatus: "public",
    repoUrl: "https://github.com/zhangjiaxuan-Xuan/TraceFlow",
  },
  {
    method: "MemER*",
    tsr: 27.3,
    csr: 49.1,
    notes: "matched reimplementation",
    repoStatus: "public",
    repoUrl: "https://github.com/memer-policy/memer",
  },
  {
    method: "StateMem",
    tsr: 26.8,
    csr: 44.4,
    notes: "26×50 independent seeds",
    repoStatus: "missing",
  },
  {
    method: "π0.5",
    tsr: 21.5,
    csr: 38.7,
    notes: "benchmark baseline",
    repoStatus: "public",
    repoUrl: "https://github.com/Physical-Intelligence/openpi",
  },
  {
    method: "HiF-VLA",
    tsr: 16.9,
    csr: 39.8,
    notes: "benchmark baseline",
    repoStatus: "public",
    repoUrl: "https://github.com/OpenHelix-Team/HiF-VLA",
  },
  {
    method: "MemoryVLA",
    tsr: 15.0,
    csr: 35.3,
    notes: "benchmark baseline",
    repoStatus: "public",
    repoUrl: "https://github.com/shihao1895/MemoryVLA",
  },
];

const BOARD_COPY = {
  verified: "Task1-26 benchmark ranking with sortable CSR/TSR and category breakdown.",
  unverified: "Literature-reported full 26-task results with transparent protocol and repository notes.",
};

function num(v) {
  return typeof v === "number" ? v : Number.NEGATIVE_INFINITY;
}

function containsAny(haystack, needle) {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function boardFromLocation() {
  return new URLSearchParams(window.location.search).get("bench") === "unverified"
    ? "unverified"
    : "verified";
}

function setBoard(board, { updateUrl = true } = {}) {
  const activeBoard = board === "unverified" ? "unverified" : "verified";

  document.querySelectorAll("[data-board]").forEach((tab) => {
    const isActive = tab.dataset.board === activeBoard;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  document.getElementById("verifiedBoard").hidden = activeBoard !== "verified";
  document.getElementById("unverifiedBoard").hidden = activeBoard !== "unverified";
  document.getElementById("leaderboardSubtitle").textContent = BOARD_COPY[activeBoard];

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (activeBoard === "unverified") {
      url.searchParams.set("bench", "unverified");
    } else {
      url.searchParams.delete("bench");
    }
    window.history.pushState({ board: activeBoard }, "", url);
  }
}

function initBoardTabs() {
  const tabs = [...document.querySelectorAll("[data-board]")];

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setBoard(tab.dataset.board));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
      setBoard(nextTab.dataset.board);
      nextTab.focus();
    });
  });

  window.addEventListener("popstate", () => setBoard(boardFromLocation(), { updateUrl: false }));
  setBoard(boardFromLocation(), { updateUrl: false });
}

function renderUnverifiedRepo(row) {
  if (row.repoStatus === "missing") {
    return '<span class="unverified-repo-status is-missing">Not released</span>';
  }

  const pendingClass = row.repoStatus === "pending" ? " is-pending" : "";
  const label = row.repoStatus === "pending" ? "GitHub · code pending ↗" : "GitHub ↗";
  return `<a class="unverified-repo-link${pendingClass}" href="${escapeHtml(row.repoUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function renderUnverifiedRank(rank) {
  const medalClasses = ["is-gold", "is-silver", "is-bronze"];
  const medalClass = medalClasses[rank - 1];
  const topClass = medalClass ? ` is-top ${medalClass}` : "";
  return `<span class="unverified-rank-number${topClass}">${rank}</span>`;
}

function renderUnverifiedTable(metric) {
  const activeMetric = metric === "csr" ? "csr" : "tsr";
  const rows = [...UNVERIFIED_ROWS].sort((a, b) => b[activeMetric] - a[activeMetric]);
  const maxTsr = Math.max(...UNVERIFIED_ROWS.map((row) => row.tsr));
  const maxCsr = Math.max(...UNVERIFIED_ROWS.map((row) => row.csr));
  const tbody = document.getElementById("unverifiedTableBody");

  document.getElementById("unverifiedRankingTitle").textContent = `Ranked by ${activeMetric.toUpperCase()} (%)`;
  document.getElementById("unverifiedTsrHeader").textContent = `TSR (%)${activeMetric === "tsr" ? " ↓" : ""}`;
  document.getElementById("unverifiedCsrHeader").textContent = `CSR (%)${activeMetric === "csr" ? " ↓" : ""}`;
  document.getElementById("unverifiedTsrHeader").classList.toggle("is-active-metric", activeMetric === "tsr");
  document.getElementById("unverifiedCsrHeader").classList.toggle("is-active-metric", activeMetric === "csr");

  tbody.innerHTML = rows
    .map((row, index) => {
      const tsrClasses = [
        "unverified-score",
        activeMetric === "tsr" ? "is-active-score" : "",
        row.tsr === maxTsr ? "is-best" : "",
      ].filter(Boolean).join(" ");
      const csrClasses = [
        "unverified-score",
        activeMetric === "csr" ? "is-active-score" : "",
        row.csr === maxCsr ? "is-best" : "",
      ].filter(Boolean).join(" ");

      return `
        <tr>
          <td class="unverified-rank">${renderUnverifiedRank(index + 1)}</td>
          <td class="unverified-model">${escapeHtml(row.method)}</td>
          <td class="${tsrClasses}">${row.tsr.toFixed(2)}</td>
          <td class="${csrClasses}">${row.csr.toFixed(2)}</td>
          <td class="unverified-note">${escapeHtml(row.notes)}</td>
          <td class="unverified-repo">${renderUnverifiedRepo(row)}</td>
        </tr>`;
    })
    .join("");
}

function initUnverifiedLeaderboard() {
  const tabs = [...document.querySelectorAll("[data-unverified-metric]")];
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });
      renderUnverifiedTable(tab.dataset.unverifiedMetric);
    });
  });
  renderUnverifiedTable("tsr");
}

function renderTable(rows) {
  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = "";
  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="rank-chip">${idx + 1}</span></td>
      <td><div class="num-strong">${r.method}</div><div class="muted">${r.model_size || ""}</div></td>
      <td>${escapeHtml(r.affiliation || "-")}</td>
      <td>${r.vlm}</td>
      <td>${r.vla}</td>
      <td class="num-strong">${r.overall_tsr.toFixed(1)}</td>
      <td class="num-strong">${r.overall_csr.toFixed(1)}</td>
      <td>${r.transfer_tsr.toFixed(1)} / ${r.transfer_csr.toFixed(1)}</td>
      <td>${r.occlusion_tsr.toFixed(1)} / ${r.occlusion_csr.toFixed(1)}</td>
      <td>${r.counting_tsr.toFixed(1)} / ${r.counting_csr.toFixed(1)}</td>
      <td>${r.sequence_tsr.toFixed(1)} / ${r.sequence_csr.toFixed(1)}</td>
      <td>${r.run_date}</td>
      <td class="muted">${r.notes}</td>
    `;
    tbody.appendChild(tr);
  });
}

function applyState(allRows) {
  const protocol = document.getElementById("protocolSelect").value;
  const metric = document.getElementById("sortSelect").value;
  const query = document.getElementById("searchInput").value.trim();

  let rows = allRows.filter((r) => protocol === "all" || r.protocol === protocol);
  rows = rows.filter((r) =>
    containsAny(
      [r.method, r.affiliation, r.vlm, r.vla, r.notes, r.protocol].join(" "),
      query
    )
  );
  rows.sort((a, b) => num(b[metric]) - num(a[metric]));
  renderTable(rows);
}

function initProtocolOptions(rows) {
  const select = document.getElementById("protocolSelect");
  const protocols = [...new Set(rows.map((r) => r.protocol))].sort();
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All protocols";
  select.appendChild(all);
  protocols.forEach((p) => {
    const op = document.createElement("option");
    op.value = p;
    op.textContent = p;
    select.appendChild(op);
  });
}

async function main() {
  initBoardTabs();
  initUnverifiedLeaderboard();

  try {
    const data = await loadData();
    const rows = data.entries || [];
    initProtocolOptions(rows);
    document.getElementById("updatedAt").textContent = `Updated: ${data.updated_at}`;

    ["protocolSelect", "sortSelect", "searchInput"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => applyState(rows));
    });
    applyState(rows);
  } catch (err) {
    const tbody = document.querySelector("#leaderboardTable tbody");
    tbody.innerHTML = `<tr><td colspan="13">Failed to load leaderboard data: ${err.message}</td></tr>`;
  }
}

main();
