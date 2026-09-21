/* Downly - logica de la interfaz. Habla con /api/info y /api/jobs (ver app.py). */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const LADDER = [2160, 1440, 1080, 720, 480, 360];   // calidades para listas (no se conocen de antemano)
  const HISTORY_KEY = "downly.history";
  const HISTORY_MAX = 8;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const portal = window.Portal || { setBusy() {}, setProgress() {}, setMode() {}, flash() {} };

  let info = null;          // resultado del ultimo analisis
  let analyzedUrl = "";     // link al que corresponde `info`
  let analyzeToken = 0;     // descarta respuestas de analisis viejos
  let running = false;

  // ---------- utilidades ----------
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento: no pasa nada */ }
    },
  };

  function fmtBytes(n) {
    if (!n) return "";
    const mb = n / (1024 * 1024);
    return mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : Math.max(mb, 0.1).toFixed(mb < 10 ? 1 : 0) + " MB";
  }
  function fmtDuration(s) {
    if (!s) return "";
    s = Math.round(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const pad = (x) => String(x).padStart(2, "0");
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }
  function fmtEta(s) {
    if (s == null) return "";
    return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
  }
  function safeImg(url) { return /^https?:\/\//i.test(url || "") ? url : ""; }

  function setStatus(text, kind = "") {
    const el = $("status");
    el.className = kind;
    el.replaceChildren(...(text ? [document.createTextNode(text)] : []));
    return el;
  }
  function currentMode() { return document.querySelector('input[name="mode"]:checked').value; }
  function wantsPlaylist() { return !$("gPlaylist").hidden && $("plOn").checked; }

  // Etiqueta de estado del margen (decorativa; el estado real lo dice #status)
  function setState(text, live) {
    $("stateText").textContent = text;
    $("state").classList.toggle("is-live", !!live);
  }

  // ---------- analisis del link ----------
  async function analyze() {
    const url = $("url").value.trim();
    if (!url) { setStatus("Pega un link primero.", "error"); return; }

    const token = ++analyzeToken;
    hideResults();
    $("analyze").disabled = true;
    setStatus("Analizando el link...");
    setState("Analizando", true);
    portal.setBusy(true);
    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (token !== analyzeToken) return;
      if (!res.ok) throw new Error(data.error || "No se pudo leer ese link.");
      info = data;
      analyzedUrl = url;
      renderInfo();
      setStatus("");
      setState("Listo para elegir", false);
      portal.flash();
      revealWorkspace();
    } catch (err) {
      if (token !== analyzeToken) return;
      setStatus(err.message, "error");
      setState("En reposo", false);
    } finally {
      if (token === analyzeToken) {
        $("analyze").disabled = false;
        portal.setBusy(false);
      }
    }
  }

  // Si el espacio de trabajo quedo bajo el pliegue, se trae a la vista
  function revealWorkspace() {
    const box = $("workspace").getBoundingClientRect();
    if (box.top > window.innerHeight * 0.55) {
      $("workspace").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  function hideResults() {
    info = null;
    $("preview").hidden = true;
    $("options").hidden = true;
    $("progress").hidden = true;
  }

  function renderInfo() {
    const isList = info.kind === "playlist";
    const thumb = safeImg(info.thumbnail);
    $("thumb").hidden = !thumb;
    if (thumb) $("thumb").src = thumb;
    else $("thumb").removeAttribute("src");
    $("pTitle").textContent = info.title;

    const meta = [];
    if (isList) {
      meta.push(info.count > info.max_items
        ? `Lista de más de ${info.max_items} videos`
        : `Lista de ${info.count} videos`);
    } else {
      if (info.uploader) meta.push(info.uploader);
      if (info.duration) meta.push(fmtDuration(info.duration));
    }
    $("pMeta").textContent = meta.join(" · ");

    // Datos reales del video bajo la vista previa
    const facts = [];
    if (isList) {
      facts.push(["Videos", info.count > info.max_items ? `más de ${info.max_items}` : String(info.count)]);
    } else {
      if (info.heights.length) facts.push(["Calidades", info.heights.map((h) => `${h.height}p`).join(" · ")]);
      const langs = info.subtitles.map((l) => l.lang);
      facts.push(["Subtítulos", langs.length ? langs.slice(0, 6).join(", ") + (langs.length > 6 ? ` +${langs.length - 6}` : "") : "Ninguno"]);
      if (info.playlist) facts.push(["Lista", `${info.playlist.count} videos`]);
    }
    const dl = $("pFacts");
    dl.replaceChildren();
    facts.forEach(([k, v]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      dt.className = "label";
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      row.append(dt, dd);
      dl.append(row);
    });
    $("preview").hidden = false;

    // Lista de reproduccion
    const plGroup = $("gPlaylist");
    const list = isList ? info : info.playlist;
    plGroup.hidden = !list;
    if (list) {
      const many = list.count > (info.max_items || 50);
      $("plLabel").textContent = isList ? "Descargar la lista completa" : `Descargar también la lista completa (${many ? "más de 50" : list.count} videos)`;
      $("plHint").textContent = "Se entrega un .zip. Se descargan como máximo los primeros 50 videos.";
      $("plOn").checked = isList;
      $("plOn").disabled = isList;   // un link de lista solo puede descargar la lista
    } else {
      $("plOn").checked = false;
    }

    // Subtitulos disponibles
    const langs = isList
      ? [{ lang: "es", name: "Español" }, { lang: "en", name: "English" }]
      : info.subtitles;
    const sel = $("subLang");
    sel.replaceChildren();
    langs.forEach((l) => sel.add(new Option(l.name === l.lang ? l.lang : `${l.name} (${l.lang})`, l.lang)));
    const preferred = langs.find((l) => l.lang === "es") || langs.find((l) => l.lang === "en") || langs[0];
    if (preferred) sel.value = preferred.lang;
    $("subs").value = "none";
    $("gSubs").dataset.available = langs.length ? "1" : "";

    $("trimOn").checked = false;
    $("trimStart").value = "";
    $("trimEnd").value = "";
    $("trimEnd").placeholder = info.duration ? fmtDuration(info.duration) : "hasta el final";

    fillQuality();
    syncUI();
    $("options").hidden = false;
    $("download").disabled = false;
  }

  function fillQuality() {
    const sel = $("quality");
    const previous = sel.value;
    const isMp4 = $("vformat").value === "mp4";
    const heights = info.kind === "video" ? info.heights : LADDER.map((h) => ({ height: h }));
    sel.replaceChildren();
    if (!heights.length) {
      sel.add(new Option("Mejor disponible", ""));
      return;
    }
    heights.forEach((h) => {
      const parts = [`${h.height}p`];
      if (h.size) parts.push(`~${fmtBytes(h.size)}`);
      if (h.over_limit) parts.push("supera 200 MB");
      else if (h.h264 === false && isMp4) parts.push("se convierte");
      const opt = new Option(parts.join(" · "), String(h.height));
      opt.disabled = !!h.over_limit;
      sel.add(opt);
    });
    const keep = [...sel.options].find((o) => o.value === previous && !o.disabled);
    sel.value = keep ? keep.value : ([...sel.options].find((o) => !o.disabled) || sel.options[0]).value;
  }

  // ---------- que controles se ven segun lo elegido ----------
  function syncUI() {
    const audio = currentMode() === "audio";
    const fmt = $("vformat").value;
    const gif = !audio && fmt === "gif";
    const list = wantsPlaylist();
    const trimOn = $("trimOn").checked && !list;
    portal.setMode(currentMode());

    $("gVideo").hidden = audio;
    $("gAudio").hidden = !audio;
    $("aHint").hidden = $("aformat").value !== "opus";
    $("gVolume").hidden = gif;
    $("gainRow").hidden = $("volMode").value !== "gain";
    const vh = $("volHint");
    vh.hidden = $("volMode").value === "none";
    vh.textContent = $("volMode").value === "gain"
      ? "Positivo sube el volumen; negativo lo baja."
      : "Deja el volumen en un nivel estándar. Útil si suena muy bajo o muy alto.";

    const vHint = $("vHint");
    vHint.hidden = !(gif || fmt === "webm");
    vHint.textContent = gif
      ? "GIF: máximo 30 segundos, sin audio y hasta 480 px de ancho."
      : "WebM se re-codifica al descargar, así que tarda más.";

    $("gTrim").hidden = list;
    $("trimRow").hidden = !trimOn;
    $("trimHint").hidden = !trimOn;

    // Subtitulos: solo con video normal, sin recorte y si el video los tiene
    const subsAvailable = $("gSubs").dataset.available === "1";
    $("gSubs").hidden = audio || gif;
    const embed = [...$("subs").options].find((o) => o.value === "embed");
    embed.disabled = fmt === "webm";
    if (embed.disabled && $("subs").value === "embed") $("subs").value = "file";
    $("subs").disabled = !subsAvailable || trimOn;
    $("subLang").disabled = $("subs").disabled || $("subs").value === "none";
    const sh = $("subsHint");
    sh.hidden = subsAvailable && !trimOn;
    sh.textContent = !subsAvailable ? "Este video no tiene subtítulos disponibles." : "Los subtítulos no se pueden usar con un fragmento recortado.";
    if (!subsAvailable || trimOn) $("subs").value = "none";
    fillQuality();
  }

  // ---------- descarga ----------
  function readOptions() {
    const mode = currentMode();
    const o = { mode, playlist: wantsPlaylist(), volume_mode: $("volMode").value, gain_db: $("gain").value };
    if (mode === "video") {
      o.height = $("quality").value || null;
      o.video_format = $("vformat").value;
      if (!$("gSubs").hidden && !$("subs").disabled) {
        o.subs = $("subs").value;
        o.sub_lang = $("subLang").value;
      }
    } else {
      o.audio_format = $("aformat").value;
      o.bitrate = $("bitrate").value;
    }
    if (o.video_format === "gif") o.volume_mode = "none";
    if ($("trimOn").checked && !o.playlist) {
      o.trim_start = $("trimStart").value.trim();
      o.trim_end = $("trimEnd").value.trim();
    }
    return o;
  }

  function renderProgress(st) {
    const pct = Math.max(0, Math.min(100, st.progress || 0));
    $("barFill").style.transform = `scaleX(${pct / 100})`;
    document.querySelector(".bar").setAttribute("aria-valuenow", Math.round(pct));
    let phase = st.phase || "";
    if (st.phase === "Descargando" && st.total > 1) phase += ` (video ${st.current} de ${st.total})`;
    $("progPhase").textContent = phase;
    $("progPct").textContent = Math.round(pct) + "%";
    const meta = [];
    if (st.speed) meta.push(fmtBytes(st.speed) + "/s");
    if (st.eta != null && st.phase === "Descargando") meta.push("quedan " + fmtEta(st.eta));
    $("progMeta").textContent = meta.join(" · ");

    portal.setProgress(pct / 100);
    setState(st.phase === "Descargando" ? `Descargando ${Math.round(pct)}%` : (st.phase || "En marcha"), true);
  }

  async function waitForJob(id) {
    while (true) {
      const res = await fetch(`/api/jobs/${id}`);
      if (res.status === 404) throw new Error("La descarga se perdió. ¿Se reinició el servidor? Inténtalo de nuevo.");
      const st = await res.json();
      renderProgress(st);
      if (st.status === "done") return st;
      if (st.status === "error") throw new Error(st.error || "Error al descargar.");
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  function setRunning(on) {
    running = on;
    $("optsFs").disabled = on;
    $("analyze").disabled = on;
    $("url").disabled = on;
    $("downloadLabel").textContent = on ? "Descargando..." : "Descargar";
    portal.setBusy(on);
  }

  $("options").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (running || !info) return;
    const options = readOptions();

    setRunning(true);
    setStatus("");
    $("progress").hidden = false;
    renderProgress({ progress: 0, phase: "Iniciando" });
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analyzedUrl, options }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar la descarga.");

      const st = await waitForJob(data.id);
      const fileUrl = `/api/jobs/${data.id}/file`;

      // El navegador baja el archivo directo del servidor (sin cargarlo en memoria)
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = st.file_name || "";
      document.body.appendChild(a);
      a.click();
      a.remove();

      const el = setStatus("Listo. Revisa tu carpeta de descargas.", "ok");
      const again = document.createElement("a");
      again.href = fileUrl;
      again.download = st.file_name || "";
      again.textContent = "Descargar de nuevo";
      el.append(again);
      if (st.notice) {
        const n = document.createElement("div");
        n.textContent = st.notice;
        n.style.color = "var(--muted)";
        el.append(n);
      }
      portal.flash();
      setState("Listo", false);
      addHistory(options, st.file_name);
    } catch (err) {
      setStatus(err.message, "error");
      setState("En reposo", false);
      $("progress").hidden = true;
    } finally {
      setRunning(false);
    }
  });

  // ---------- historial (solo en este navegador) ----------
  function labelFor(o) {
    if (o.mode === "audio") return o.audio_format.toUpperCase();
    return (o.video_format || "mp4").toUpperCase();
  }
  function addHistory(options, fileName) {
    const list = store.get(HISTORY_KEY, []).filter((h) => h.url !== analyzedUrl);
    list.unshift({
      url: analyzedUrl,
      title: info.title,
      thumb: safeImg(info.thumbnail),
      kind: labelFor(options) + (options.playlist ? " · lista" : ""),
      at: Date.now(),
    });
    store.set(HISTORY_KEY, list.slice(0, HISTORY_MAX));
    renderHistory();
  }
  function renderHistory() {
    const list = store.get(HISTORY_KEY, []);
    $("history").hidden = !list.length;
    const ul = $("histList");
    ul.replaceChildren();
    list.forEach((h) => {
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      if (safeImg(h.thumb)) img.src = h.thumb;
      const box = document.createElement("div");
      const title = document.createElement("div");
      title.className = "h-title";
      title.textContent = h.title;
      title.title = h.title;
      const meta = document.createElement("div");
      meta.className = "h-meta";
      meta.textContent = `${h.kind} · ${new Date(h.at).toLocaleDateString("es", { day: "numeric", month: "short" })}`;
      box.append(title, meta);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-ghost";
      btn.textContent = "Usar de nuevo";
      btn.addEventListener("click", () => {
        if (running) return;
        $("url").value = h.url;
        analyze();
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
      li.append(img, box, btn);
      ul.append(li);
    });
  }
  $("histClear").addEventListener("click", () => { store.set(HISTORY_KEY, []); renderHistory(); });

  // ---------- eventos ----------
  $("analyze").addEventListener("click", analyze);
  $("url").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); analyze(); } });
  $("url").addEventListener("paste", () => setTimeout(analyze, 0));
  $("url").addEventListener("input", () => {
    if (info && $("url").value.trim() !== analyzedUrl) { hideResults(); setStatus(""); setState("En reposo", false); }
  });
  document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener("change", syncUI));
  ["vformat", "aformat", "volMode", "trimOn", "subs", "plOn"].forEach((id) => $(id).addEventListener("change", syncUI));
  $("gain").addEventListener("input", () => {
    const v = Number($("gain").value);
    $("gainOut").textContent = (v > 0 ? "+" : "") + v + " dB";
  });

  // La etiqueta de estado se aparta cuando llega el pie, para no tapar su enlace
  const foot = document.querySelector(".foot");
  if (foot && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => $("state").classList.toggle("is-away", e.isIntersecting)).observe(foot);
  }

  renderHistory();
})();
