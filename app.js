// ===== Ma'lumot qatlami: Lokal (localStorage) yoki Online (Supabase) =====
const cfg = window.APP_CONFIG || {};
const ONLINE = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const LS_KEY = "hodimlar_v1";

const DEMO = [
  { name: "Aliyev Jasur", position: "GIS mutaxassisi", task: "Dala chegaralarini raqamlashtirish", percent: 80 },
  { name: "Karimova Dilnoza", position: "Muhandis", task: "Drone suratlarini qayta ishlash", percent: 55 },
  { name: "Toshmatov Bekzod", position: "Tahlilchi", task: "Haftalik NDVI hisobotini tayyorlash", percent: 100 },
  { name: "Rahimova Malika", position: "Kartograf", task: "Tuman xaritasini yangilash", percent: 30 },
];

function uid() { return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(); }

const localStore = {
  async list() {
    let rows = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (!rows) {
      rows = DEMO.map(d => ({ ...d, id: uid(), photo: "", updated_at: new Date().toISOString() }));
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    }
    return rows;
  },
  async save(row) {
    const rows = await this.list();
    row.updated_at = new Date().toISOString();
    const i = rows.findIndex(r => r.id === row.id);
    if (i >= 0) rows[i] = row; else rows.push({ ...row, id: uid() });
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  },
  async remove(id) {
    const rows = (await this.list()).filter(r => r.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  },
  subscribe() {
    // Bir kompyuterda bir nechta oyna ochiq bo'lsa, ular ham sinxron bo'ladi
    window.addEventListener("storage", e => { if (e.key === LS_KEY) render(); });
  },
};

let sb = null;
const onlineStore = {
  async init() {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  },
  async list() {
    const { data, error } = await sb.from("employees").select("*");
    if (error) throw error;
    return data;
  },
  async save(row) {
    const payload = { name: row.name, position: row.position, task: row.task, percent: row.percent,
      photo: row.photo, updated_at: new Date().toISOString() };
    const q = row.id ? sb.from("employees").update(payload).eq("id", row.id)
                     : sb.from("employees").insert(payload);
    const { error } = await q;
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await sb.from("employees").delete().eq("id", id);
    if (error) throw error;
  },
  subscribe() {
    sb.channel("employees-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => render())
      .subscribe();
  },
};

const store = ONLINE ? onlineStore : localStore;

// ===== UI =====
const $ = id => document.getElementById(id);
let rows = [];
let editing = null;

function colorFor(p) { return p >= 80 ? "var(--green)" : p >= 50 ? "var(--amber)" : "var(--red)"; }
function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join(""); }
function hue(name) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" }) : ""; }

function avatarHtml(r) {
  return r.photo
    ? `<img class="avatar" src="${esc(r.photo)}" alt="">`
    : `<div class="avatar initials" style="background:hsl(${hue(r.name)} 55% 45%)">${esc(initials(r.name))}</div>`;
}

async function render() {
  try { rows = await store.list(); }
  catch (e) { console.error(e); alert("Ma'lumotni yuklab bo'lmadi: " + e.message); return; }

  const q = $("search").value.trim().toLowerCase();
  let list = rows.filter(r => [r.name, r.position, r.task].join(" ").toLowerCase().includes(q));
  const s = $("sort").value;
  list.sort((a, b) =>
    s === "pct-asc" ? a.percent - b.percent :
    s === "name" ? a.name.localeCompare(b.name) :
    s === "updated" ? (b.updated_at || "").localeCompare(a.updated_at || "") :
    b.percent - a.percent);

  $("grid").innerHTML = list.map(r => `
    <article class="card" data-id="${esc(r.id)}" tabindex="0">
      <div class="head">
        ${avatarHtml(r)}
        <div><div class="name">${esc(r.name)}</div><div class="pos">${esc(r.position)}</div></div>
      </div>
      <div class="task">${esc(r.task)}</div>
      <div class="pct-row"><span>Yangilandi: ${fmtDate(r.updated_at)}</span><b style="color:${colorFor(r.percent)}">${r.percent}%</b></div>
      <div class="bar"><span style="width:${r.percent}%;background:${colorFor(r.percent)}"></span></div>
    </article>`).join("");
  $("empty").hidden = rows.length > 0;

  const n = rows.length;
  $("sCount").textContent = n;
  $("sAvg").textContent = (n ? Math.round(rows.reduce((t, r) => t + r.percent, 0) / n) : 0) + "%";
  $("sDone").textContent = rows.filter(r => r.percent >= 100).length;
  $("sLow").textContent = rows.filter(r => r.percent < 50).length;
}

function openDialog(r) {
  editing = r ? { ...r } : { name: "", position: "", task: "", percent: 0, photo: "" };
  $("dlgTitle").textContent = r ? "Hodimni tahrirlash" : "Hodim qo'shish";
  $("fName").value = editing.name;
  $("fPos").value = editing.position || "";
  $("fTask").value = editing.task || "";
  $("fPct").value = editing.percent;
  $("fPctOut").textContent = editing.percent + "%";
  $("photoPreview").src = editing.photo || "icon.svg";
  $("delBtn").hidden = !r;
  $("dlg").showModal();
}

// Rasmni 256px gacha kichraytirib, JPEG data-URL qilib saqlaymiz (bazada kam joy egallaydi)
function resizeImage(file, max = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

$("addBtn").onclick = () => openDialog(null);
$("cancelBtn").onclick = () => $("dlg").close();
$("search").oninput = render;
$("sort").onchange = render;
$("fPct").oninput = e => $("fPctOut").textContent = e.target.value + "%";
$("photoInput").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  editing.photo = await resizeImage(f);
  $("photoPreview").src = editing.photo;
  e.target.value = "";
};
$("grid").onclick = e => {
  const card = e.target.closest(".card"); if (!card) return;
  openDialog(rows.find(r => String(r.id) === card.dataset.id));
};
$("grid").onkeydown = e => { if (e.key === "Enter") $("grid").onclick(e); };
$("form").onsubmit = async e => {
  e.preventDefault();
  editing.name = $("fName").value.trim();
  editing.position = $("fPos").value.trim();
  editing.task = $("fTask").value.trim();
  editing.percent = Number($("fPct").value);
  if (!editing.name) return;
  try { await store.save(editing); $("dlg").close(); render(); }
  catch (err) { alert("Saqlanmadi: " + err.message); }
};
$("delBtn").onclick = async () => {
  if (!confirm(`«${editing.name}» o'chirilsinmi?`)) return;
  try { await store.remove(editing.id); $("dlg").close(); render(); }
  catch (err) { alert("O'chirilmadi: " + err.message); }
};

// ===== O'rnatish (PWA) =====
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; $("installBtn").hidden = false; });
$("installBtn").onclick = async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $("installBtn").hidden = true; };
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

// ===== Ishga tushirish =====
const modeEl = $("mode");
modeEl.textContent = ONLINE ? "● Online" : "Lokal rejim";
modeEl.classList.toggle("online", ONLINE);
(async () => {
  if (ONLINE) await onlineStore.init();
  store.subscribe();
  render();
})();
