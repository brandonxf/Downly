/*
 * Downly - portal de luz.
 *
 * Un unico fragment shader a pantalla completa dibuja cintas de luz punteada
 * sobre un fondo azul casi negro. El campo responde a lo que hace la app:
 *   - el puntero desplaza la luz bajo el;
 *   - mientras se analiza o se descarga la energia sube y aparece el acento
 *     ember, que crece con el progreso;
 *   - el modo "solo audio" vuelve las cintas mas onduladas, como una onda.
 * Con prefers-reduced-motion se dibuja un solo cuadro fijo y no hay cursor.
 * Si WebGL no esta disponible queda el degradado de CSS (html { background }).
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  var VERT = "attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2  uRes;",
    "uniform float uTime;",
    "uniform vec2  uMouse;",
    "uniform float uMouseAmt;",
    "uniform float uScroll;",
    "uniform float uProgress;",
    "uniform float uPulse;",
    "uniform float uAudio;",
    "uniform float uCalm;",
    "uniform float uRecede;",
    "",
    "const vec3 VOID  = vec3(0.043, 0.051, 0.102);",
    "const vec3 INK   = vec3(0.075, 0.086, 0.169);",
    "const vec3 NIGHT = vec3(0.102, 0.114, 0.227);",
    "const vec3 LILAC = vec3(0.330, 0.350, 0.980);",
    "const vec3 MIST  = vec3(0.749, 0.824, 1.000);",
    "const vec3 EMBER = vec3(1.000, 0.416, 0.239);",
    "",
    "float hash(vec2 p) {",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "float noise(vec2 p) {",
    "  vec2 i = floor(p), f = fract(p);",
    "  f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),",
    "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);",
    "}",
    "float fbm(vec2 p) {",
    "  float v = 0.0, a = 0.5;",
    "  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + vec2(17.3, 9.1); a *= 0.5; }",
    "  return v;",
    "}",
    "",
    "void main() {",
    "  vec2 frag = gl_FragCoord.xy;",
    "  vec2 uv = frag / uRes;",
    "  float aspect = uRes.x / uRes.y;",
    "  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);",
    "  float t = uTime;",
    "",
    "  // el puntero empuja la luz",
    "  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);",
    "  vec2 d = p - m;",
    "  p += d * exp(-dot(d, d) * 7.0) * 0.24 * uMouseAmt;",
    "  p.y += uScroll * 0.55;",
    "",
    "  // deformacion de dominio: las cintas fluyen",
    "  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t * 0.04)), fbm(p * 1.4 + vec2(5.2, 1.3) - t * 0.03));",
    "  vec2 w = p + (q - 0.5) * 0.85;",
    "  w.y += 0.30 * uCalm;   // en pantallas estrechas las cintas bajan al espacio libre bajo el boton",
    "",
    "  float core = 0.0, halo = 0.0, tight = 0.0;",
    "  for (int i = 0; i < 5; i++) {",
    "    float fi = float(i);",
    "    float wave = 0.24 * sin(w.x * 1.5 + t * 0.10 + fi * 1.3)",
    "               + 0.10 * sin(w.x * 3.4 - t * 0.08 + fi * 2.1)",
    "               + uAudio * 0.05 * sin(w.x * 16.0 + t * 1.1 + fi);",
    "    float dist = w.y - wave - (fi - 2.0) * 0.11 + 0.05;",
    "    core += exp(-dist * dist * 3600.0) * (1.0 - 0.14 * fi);",
    "    halo += exp(-dist * dist * 22.0)  * (0.55 - 0.08 * fi);",
    "    tight += exp(-dist * dist * 170.0) * (0.75 - 0.10 * fi);",
    "  }",
    "",
    "  // las cintas viven a la derecha; a la izquierda queda el texto",
    "  float side = mix(0.06, 1.0, smoothstep(0.46, 0.95, uv.x));",
    "  side = mix(side, mix(0.06, 1.0, 1.0 - smoothstep(0.10, 0.55, uv.y)), uCalm);",
    "  float vis = mix(1.0 - 0.60 * uRecede, 1.0, clamp(max(uProgress, uPulse * 0.6), 0.0, 1.0));",
    "",
    "  // puntillado fino: un pixel enciende o no segun un azar lento; solo cerca del nucleo",
    "  float r = hash(frag);",
    "  float dots = step(0.84 + 0.10 * sin(t * 0.9 + hash(frag * 1.3) * 6.283), r);",
    "",
    "  vec3 col = mix(VOID, INK, smoothstep(0.0, 1.0, uv.y * 0.9 + 0.1 - uv.x * 0.15) * 0.75);",
    "  col += NIGHT * 0.32 * exp(-pow(length((uv - vec2(0.85, 0.15)) * vec2(1.0, 1.4)), 2.0) * 4.0);",
    "",
    "  float energy = 1.0 + uPulse * 0.55 + uProgress * 0.35;",
    "  float ribbon = (core * 0.95 + halo * 0.07) * side * energy * vis;",
    "  vec3 ribbonCol = mix(LILAC, MIST, clamp(core * 0.4, 0.0, 1.0));",
    "  col += ribbonCol * ribbon * 0.42;",
    "  col += MIST * dots * tight * side * vis * 0.5;",
    "",
    "  // el acento incandescente: cresta abajo a la derecha y, sobre todo, el avance",
    "  float emberZone = smoothstep(0.35, 1.0, uv.x * 0.8 + (1.0 - uv.y) * 0.55 - 0.15);",
    "  float emberAmt = clamp(emberZone * 0.16 + uProgress * 0.9 + uPulse * 0.22, 0.0, 1.0);",
    "  float emberMask = clamp(emberAmt * (core * 1.1 + tight * 0.5) * side * vis, 0.0, 1.0);",
    "  col = mix(col, EMBER * (0.6 + 0.5 * core), emberMask * 0.9);",
    "",
    "  col *= 1.0 - 0.45 * pow(length(uv - 0.5) * 1.15, 2.0);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  var canvas = document.getElementById("field");
  var gl = null;
  var prog = null;
  var U = {};
  var scale = 1;

  var S = {
    t: 9.0,
    mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5, amt: 0,
    scroll: 0,
    progress: 0, progressTarget: 0,
    pulse: 0, busy: false,
    audio: 0, audioTarget: 0,
    recede: 0, recedeTarget: 0,
  };

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("Downly: shader no compilo:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function initGL() {
    if (!canvas) return false;
    try {
      gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    } catch (e) { gl = null; }
    if (!gl) return false;

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    ["uRes", "uTime", "uMouse", "uMouseAmt", "uScroll", "uProgress", "uPulse", "uAudio", "uCalm", "uRecede"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      canvas.style.display = "none";
      running = false;
    });
    return true;
  }

  function resize() {
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var base = dpr >= 2 ? 0.55 : 0.8;
    var w = Math.max(2, Math.floor(window.innerWidth * dpr * base * scale));
    var h = Math.max(2, Math.floor(window.innerHeight * dpr * base * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    if (reduceMotion) draw();
  }

  function draw() {
    if (!gl) return;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, S.t);
    gl.uniform2f(U.uMouse, S.mx, S.my);
    gl.uniform1f(U.uMouseAmt, S.amt);
    gl.uniform1f(U.uScroll, S.scroll);
    gl.uniform1f(U.uProgress, S.progress);
    gl.uniform1f(U.uPulse, S.pulse);
    gl.uniform1f(U.uAudio, S.audio);
    gl.uniform1f(U.uCalm, window.innerWidth < 760 ? 1 : 0);
    gl.uniform1f(U.uRecede, S.recede);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ---------- cursor y bucle ----------
  var ring = null, ringX = -100, ringY = -100, ptrX = -100, ptrY = -100;
  var last = 0, running = false, slowFrames = 0, frames = 0, degraded = false;

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    // adaptacion: si el equipo va justo, baja la resolucion una sola vez
    frames++;
    if (!degraded && frames > 40 && frames < 140) {
      if (dt > 0.03) slowFrames++;
      if (frames === 139 && slowFrames > 50) { degraded = true; scale = 0.6; resize(); }
    }

    S.t += dt * (1 + 1.6 * S.progress + 0.8 * S.pulse);
    var k = 1 - Math.exp(-6 * dt);
    S.mx += (S.tx - S.mx) * k;
    S.my += (S.ty - S.my) * k;
    S.amt *= Math.exp(-1.6 * dt);
    S.progress += (S.progressTarget - S.progress) * (1 - Math.exp(-3.5 * dt));
    S.audio += (S.audioTarget - S.audio) * (1 - Math.exp(-3 * dt));
    S.recede += (S.recedeTarget - S.recede) * (1 - Math.exp(-4 * dt));
    S.pulse *= Math.exp(-2.2 * dt);
    if (S.busy) S.pulse = Math.max(S.pulse, 0.5);

    if (ring) {
      ringX += (ptrX - ringX) * (1 - Math.exp(-14 * dt));
      ringY += (ptrY - ringY) * (1 - Math.exp(-14 * dt));
      ring.style.transform = "translate3d(" + ringX.toFixed(1) + "px," + ringY.toFixed(1) + "px,0)";
    }
    draw();
  }

  function start() {
    if (running || reduceMotion || document.hidden || !gl) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  function onScroll() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var pct = Math.min(1, Math.max(0, window.scrollY / max));
    if (!reduceMotion) S.scroll = pct;
    // el campo se retira al salir de la primera pantalla, para que el texto mande
    var v = Math.min(1, Math.max(0, (window.scrollY / window.innerHeight - 0.15) / 0.85));
    S.recedeTarget = v * v * (3 - 2 * v);
    if (reduceMotion) { S.recede = S.recedeTarget; draw(); }
    var rail = document.getElementById("railDot");
    if (rail && rail.parentElement) rail.style.top = "calc(" + (pct * 100).toFixed(2) + "% - " + (pct * 9).toFixed(2) + "px)";
  }

  // ---------- intro: el cargador cuenta hasta cien (una vez por sesion) ----------
  function runIntro() {
    var html = document.documentElement;
    var intro = document.getElementById("intro");
    if (!html.classList.contains("is-intro") || !intro) return;
    var num = document.getElementById("introCount");
    var t0 = performance.now(), DURATION = 1100;

    function tick(now) {
      var p = Math.min(1, (now - t0) / DURATION);
      var eased = 1 - Math.pow(1 - p, 3);
      num.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (p < 1) return requestAnimationFrame(tick);
      intro.classList.add("leaving");
      html.classList.remove("is-intro");
      try { sessionStorage.setItem("downly.intro", "1"); } catch (e) { /* sin almacenamiento */ }
      setTimeout(function () { intro.remove(); }, 1100);
    }
    requestAnimationFrame(tick);
  }

  // ---------- API para la app ----------
  window.Portal = {
    setBusy: function (on) { S.busy = !!on; if (!on) S.pulse = Math.min(S.pulse, 0.5); if (reduceMotion) draw(); },
    setProgress: function (v) { S.progressTarget = Math.min(1, Math.max(0, v)); },
    setMode: function (mode) { S.audioTarget = mode === "audio" ? 1 : 0; },
    flash: function () { S.pulse = 1; },
  };

  // ---------- arranque ----------
  function boot() {
    runIntro();
    if (!initGL()) {
      if (canvas) canvas.style.display = "none";
    } else {
      resize();
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
      start();
      if (reduceMotion) draw();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!reduceMotion) {
      window.addEventListener("pointermove", function (e) {
        S.tx = e.clientX / window.innerWidth;
        S.ty = 1 - e.clientY / window.innerHeight;
        S.amt = Math.min(1, S.amt + 0.3);
        ptrX = e.clientX; ptrY = e.clientY;
      }, { passive: true });
    }

    if (finePointer && !reduceMotion) {
      ring = document.getElementById("cursor");
      if (ring) {
        var hot = "a, button, label, [role=button], input[type=checkbox], input[type=range]";
        var field = "input[type=text], select";
        document.addEventListener("pointerover", function (e) {
          ring.classList.add("is-on");
          ring.classList.toggle("is-hot", !!e.target.closest(hot));
          ring.classList.toggle("is-hidden", !!e.target.closest(field));
        });
        document.documentElement.addEventListener("pointerleave", function () { ring.classList.remove("is-on"); });
      }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
