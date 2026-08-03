/* mw-ha-power-button-card — custom:power-button-card
 * Port fiel do template button-card "tomada_energia_papel_v6" (papel/neumórfico)
 * para um card Lovelace nativo com editor visual completo.
 * Sem build, sem dependências: JS puro + selectors nativos do HA (<ha-form>).
 * Repo: https://github.com/visaodeempresa/mw-ha-power-button-card
 * Releases automáticas: merge na main → bump semântico → tag → HACS.
 */
(() => {
  "use strict";

  const PRESET_URLS = {
    tuya: "https://raw.githubusercontent.com/mayconsoftware/mayconsoftware.github.io/refs/heads/main/assets/devices/ha-integration/ha-integration-tuya.png",
    tapo: "https://raw.githubusercontent.com/mayconsoftware/mayconsoftware.github.io/refs/heads/main/assets/devices/ha-integration/ha-integration-tapo.png",
  };

  // Defaults = variables do template original (fidelidade total)
  const DEFAULTS = {
    name: "",
    image_url: "",
    device_icon: "",
    background_image_url: "",
    background_transparent: 0.12,
    animate: false,
    control: true,
    haptic: true,
    confirm: false,
    confirm_text: "Tem certeza que quer {acao} {nome}?",
    protocol_icon: "",
    protocol_color_on: null,
    protocol_color_off: null,
    // deslocamento do selinho a partir do canto inferior direito: aumentar
    // empurra para dentro do card (esquerda e cima); negativo joga para fora
    protocol_offset_x: 10,
    protocol_offset_y: 10,
    sensor_voltagem: "",
    sensor_corrente: "",
    sensor_potencia: "",
    only_power: false,
    power_font_size: 34,
    only_power_lift: 6,       // px que o nome e a potência sobem no modo Somente Potência
    color_power_on: "#7a4b00",
    color_power_off: "#f0b429",
    color_on_bg: "rgba(255, 255, 255, 0.95)",
    color_on_border: "rgba(180, 180, 180, 0.55)",
    color_on_name: "#1a1a1a",
    color_on_subtext: "rgba(80, 80, 80, 1)",
    color_off_bg: "rgba(0, 0, 0, 0.45)",
    color_off_border: "rgba(255, 255, 255, 0.08)",
    color_off_name: "rgba(255, 255, 255, 0.5)",
    color_off_subtext: "rgba(255, 255, 255, 0.35)",
    color_unavail_bg: "rgba(80, 0, 0, 0.6)",
    color_unavail_border: "rgba(255, 80, 80, 0.3)",
    color_unknown_bg: "rgba(0, 0, 0, 0.7)",
    color_unknown_border: "rgba(80, 80, 80, 0.3)",
    paper_color: "paper",
  };

  // Leitura morta: o sensor existe mas não tem valor (a tomada caiu e levou
  // junto os sensores dela). Escrever "unavailable" em 34px é feio e não
  // informa nada — o selo OFFLINE no topo já contou o que houve. Fica o
  // travessão, que ainda segura a linha no lugar na grade.
  const NO_READING = "—";
  const noReading = (s) => s === undefined || s === null || s === "" ||
    s === "unavailable" || s === "unknown" || s === "none";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Potência em destaque: no máximo 1 casa decimal e no máximo 4 dígitos na
  // parte inteira — passou de 9999, sobe de degrau (W → kW → MW) em vez de
  // esticar o número e estourar a largura do card.
  const STEPS = [["W", "kW"], ["kW", "MW"], ["MW", "GW"]];
  const fmtPower = (raw, unit, lang) => {
    let v = Number.parseFloat(raw);
    if (!Number.isFinite(v)) return { value: String(raw ?? "—"), unit: unit || "" };
    let u = unit || "W";
    const round1 = (x) => Math.round(x * 10) / 10;
    v = round1(v);
    for (const [from, to] of STEPS) {
      if (Math.abs(v) >= 10000 && u.toLowerCase() === from.toLowerCase()) { v = round1(v / 1000); u = to; }
    }
    let value;
    try {
      value = new Intl.NumberFormat(lang || "pt-BR",
        { maximumFractionDigits: 1, useGrouping: false }).format(v);
    } catch (e) {
      value = String(v);
    }
    return { value, unit: u };
  };

  // >>> paper-palette v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/paper-palette/paper-palette.js
  // 49 papéis encardidos: 7 matizes do arco-íris × 7 tons (1 = quase branco,
  // 7 = mais encardido). Saturação baixa de propósito — papel descansa a vista.
  const PAPER_HUES = [
    ["red", "Vermelho", 6], ["orange", "Laranja", 27], ["yellow", "Amarelo", 47],
    ["green", "Verde", 96], ["blue", "Azul", 203], ["indigo", "Anil", 236],
    ["violet", "Violeta", 283],
  ];
  const PAPER_TONES = [[97, 6], [96, 9], [94, 12], [92, 15], [90, 18], [88, 21], [85, 24]];
  const PAPER_DEFAULT = "linear-gradient(145deg, #fdfaf3, #e8e3d8)";
  const paperGradient = (key) => {
    const m = /^([a-z]+)-([1-7])$/.exec(String(key || "").trim());
    if (!m) return PAPER_DEFAULT;
    const hue = PAPER_HUES.find((h) => h[0] === m[1]);
    if (!hue) return PAPER_DEFAULT;
    const [l, s] = PAPER_TONES[+m[2] - 1];
    return `linear-gradient(145deg, hsl(${hue[2]}, ${s}%, ${l}%), hsl(${hue[2]}, ${s + 4}%, ${l - 7}%))`;
  };
  const paperOptions = () => [{ value: "paper", label: "Papel original (creme)" }].concat(
    ...PAPER_HUES.map((h) => PAPER_TONES.map((t, i) => ({
      value: `${h[0]}-${i + 1}`,
      label: `${h[1]} · tom ${i + 1}${i === 0 ? " (mais claro)" : i === 6 ? " (mais encardido)" : ""}`,
    }))));
  // <<< paper-palette v1

  // >>> touch-feedback v1 — fonte canônica: /Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/touch-feedback/touch-feedback.js
  // feedback táctil: o app companion (iOS/Android) escuta o evento "haptic" na
  // window e chama o motor de vibração nativo — é assim que o próprio frontend
  // do HA vibra. Fora do app não existe essa ponte, então cai no
  // navigator.vibrate (funciona no Chrome do Android; o Safari do iPhone não
  // vibra em página nenhuma, só dentro do companion).
  const VIBRATE_MS = { selection: 5, light: 10, success: 15, medium: 20, warning: 25, heavy: 30, failure: 40 };
  const inCompanionApp = () =>
    !!(window.externalApp || window.webkit?.messageHandlers?.externalBus);
  const haptic = (kind) => {
    try {
      window.dispatchEvent(new CustomEvent("haptic",
        { bubbles: true, composed: true, detail: kind }));
      // sem a ponte do companion o evento morre sem ninguém escutando
      if (!inCompanionApp() && navigator.vibrate) navigator.vibrate(VIBRATE_MS[kind] ?? 10);
    } catch (_) { /* vibração é enfeite: nunca pode derrubar o toque */ }
  };

  // confirmação da ação (desligada por default). Duas decisões deliberadas:
  // 1) o diálogo é montado no document.body, não no shadow root do card —
  //    dentro dele o overflow:hidden do botão cortaria o modal;
  // 2) não usa window.confirm: o WebView do companion pode engolir o diálogo
  //    nativo e devolver false sozinho, e aí a ação nunca aconteceria.
  // O texto aceita {nome} e {acao} → "Tem certeza que quer desligar MESA?".
  // O card hospedeiro oferece as chaves confirm/confirm_text; o texto de
  // reserva mora aqui para o bloco não depender do DEFAULTS de ninguém.
  const CONFIRM_FALLBACK = "Tem certeza que quer {acao} {nome}?";
  const confirmAction = (tpl, nome, acao) => new Promise((resolve) => {
    const msg = String(tpl || CONFIRM_FALLBACK)
      .replace(/\{nome\}/g, nome).replace(/\{acao\}/g, acao);
    const host = document.createElement("div");
    host.attachShadow({ mode: "open" });
    host.shadowRoot.innerHTML = `
      <style>
        .ov{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
          background:rgba(0,0,0,0.55);padding:16px;}
        .box{max-width:min(420px,86vw);border-radius:14px;padding:22px 22px 16px;
          background:linear-gradient(145deg, #fdfaf3, #e8e3d8);color:#1a1a1a;
          font-family:inherit;font-size:15px;line-height:1.45;text-align:center;
          box-shadow:0 10px 40px rgba(0,0,0,0.45), inset 2px 2px 4px rgba(255,250,235,0.80);}
        .bt{display:flex;gap:10px;margin-top:20px;}
        button{flex:1;padding:11px 14px;border-radius:10px;font:inherit;font-size:14px;
          font-weight:600;cursor:pointer;border:1px solid rgba(0,0,0,0.18);}
        .no{background:rgba(0,0,0,0.06);color:#1a1a1a;}
        .yes{background:#1a1a1a;color:#fdfaf3;border-color:#1a1a1a;}
      </style>
      <div class="ov"><div class="box"><div class="msg"></div>
        <div class="bt"><button class="no">Cancelar</button><button class="yes">Confirmar</button></div>
      </div></div>`;
    // textContent, não innerHTML: o texto vem do YAML do dono, mas nome de
    // entidade não tem por que virar HTML.
    host.shadowRoot.querySelector(".msg").textContent = msg;
    const close = (ok) => {
      window.removeEventListener("keydown", onKey, true);
      host.remove();
      resolve(ok);
    };
    const onKey = (ev) => {
      if (ev.key === "Escape") { ev.stopPropagation(); close(false); }
      else if (ev.key === "Enter") { ev.stopPropagation(); close(true); }
    };
    host.shadowRoot.querySelector(".yes").addEventListener("click", () => close(true));
    host.shadowRoot.querySelector(".no").addEventListener("click", () => close(false));
    // clique no fundo = cancelar (mesma saída do Esc)
    host.shadowRoot.querySelector(".ov").addEventListener("click", (ev) => {
      if (ev.target === ev.currentTarget) close(false);
    });
    window.addEventListener("keydown", onKey, true);
    document.body.appendChild(host);
    host.shadowRoot.querySelector(".yes").focus();
  });
  // <<< touch-feedback v1

  class PowerButtonCard extends HTMLElement {
    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error("power-button-card: defina a propriedade 'entity' (switch)");
      }
      this._config = { ...DEFAULTS, ...config };
      this._renderKey = null;
      if (this._hass) this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._config) return;
      const c = this._config;
      const ids = [c.entity, c.sensor_voltagem, c.sensor_corrente, c.sensor_potencia];
      const key = ids.map((id) => (id && hass.states[id] ? hass.states[id].state : "·")).join("|");
      if (key !== this._renderKey) {
        this._renderKey = key;
        this._render();
      }
    }

    getCardSize() { return 3; }

    static getConfigElement() { return document.createElement("power-button-card-editor"); }

    static getStubConfig(hass) {
      const first = Object.keys(hass?.states || {}).find((e) => e.startsWith("switch.")) || "";
      return { entity: first, name: "", sensor_voltagem: "", sensor_corrente: "", sensor_potencia: "" };
    }

    _st(id) { return (id && this._hass.states[id]) || null; }

    _render() {
      const c = this._config;
      const ent = this._st(c.entity);
      const state = ent ? ent.state : "unavailable";
      const isOn = state === "on";
      const isOff = state === "off";
      const dead = state === "unavailable" || state === "unknown";

      // --- card por estado (igual ao template) ---
      let bg, border, shadow;
      if (isOn) { bg = paperGradient(c.paper_color); border = c.color_on_border; }
      else if (isOff) { bg = c.color_off_bg; border = c.color_off_border; }
      else if (state === "unavailable") { bg = c.color_unavail_bg; border = c.color_unavail_border; }
      else if (state === "unknown") { bg = c.color_unknown_bg; border = c.color_unknown_border; }
      else { bg = "rgba(255,0,0,1.0)"; border = "rgba(255,255,255,0.1)"; }
      shadow = isOn
        ? "0 2px 6px rgba(0,0,0,0.18),0 6px 16px rgba(0,0,0,0.14),0 12px 28px rgba(0,0,0,0.08),inset 4px 4px 8px rgba(255,252,240,0.90),inset -4px -4px 8px rgba(0,0,0,0.12)"
        : "none";
      const nameColor = isOn ? c.color_on_name : isOff ? c.color_off_name : "rgba(255,255,255,0.5)";

      // --- watermark ---
      let watermark = "";
      if (c.background_image_url) {
        const alpha = c.background_transparent ?? 0.12;
        // offline sem o brightness some: o fundo do card fica vinho escuro e a
        // marca d'água em cinza puro não tem contraste nenhum contra ele. A
        // marca é identidade do aparelho — tem que continuar legível caído.
        const wmFilter = dead ? "filter:grayscale(100%) brightness(1.8);"
          : isOff ? "filter:grayscale(40%) brightness(1.8);" : "";
        watermark = `<div class="wm" style="background-image:url('${esc(c.background_image_url)}');opacity:${alpha};${wmFilter}"></div>`;
      }

      // --- device_img (imagem ou ícone) ---
      const anim = c.animate && isOn ? "animation:pbc-spin 1s linear infinite;" : "";
      const opac = dead ? "opacity:0.3;" : isOff ? "opacity:0.35;" : "opacity:1;";
      let deviceImg = "";
      if (c.image_url) {
        const f = isOff ? "filter:grayscale(40%) brightness(1.8);" : dead ? "filter:grayscale(100%);"
          : "filter:drop-shadow(0 1px 2px rgba(0,0,0,0.32)) drop-shadow(0 3px 5px rgba(0,0,0,0.18)) drop-shadow(0 5px 8px rgba(0,0,0,0.10));";
        deviceImg = `<img src="${esc(c.image_url)}" alt="device" style="display:block;width:42px;height:42px;object-fit:contain;border-radius:6px;${anim}${opac}${f}transition:opacity .3s ease,filter .3s ease;">`;
      } else if (c.device_icon) {
        const ic = isOn ? (c.color_on_name || "#1a1a1a") : (c.color_off_name || "rgba(255,255,255,0.5)");
        const f = isOn ? "filter:drop-shadow(0 1px 2px rgba(0,0,0,0.32)) drop-shadow(0 3px 5px rgba(0,0,0,0.18)) drop-shadow(0 5px 8px rgba(0,0,0,0.10));" : "";
        deviceImg = `<ha-icon icon="${esc(c.device_icon)}" style="--mdc-icon-size:42px;width:42px;height:42px;color:${ic};display:flex;${anim}${opac}${f}transition:opacity .3s ease,color .3s ease;"></ha-icon>`;
      }

      // --- status (toggle / offline / desconhecido) ---
      let status;
      if (isOn || isOff) {
        const canControl = c.control !== false;
        const knobLeft = isOn ? "26px" : "2px";
        if (!canControl) {
          status = `<div class="tgl locked"><div class="track" style="background:${isOn ? "rgba(0,180,0,0.4)" : "rgba(100,100,100,0.4)"}"><div class="knob" style="left:${knobLeft};background:rgba(200,200,200,0.6);"></div></div></div>`;
        } else {
          status = `<div class="tgl live" id="pbc-toggle"><div class="track" style="background:${isOn ? "rgba(76,175,80,1)" : "rgba(100,100,100,0.6)"}"><div class="knob" style="left:${knobLeft};background:white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div></div></div>`;
        }
      } else if (state === "unavailable") {
        status = '<span style="color:rgba(255,200,200,0.8);">OFFLINE</span>';
      } else if (state === "unknown") {
        status = '<span style="color:rgba(255,255,255,0.5);">DESCONHECIDO</span>';
      } else {
        status = "<span>SEM ESTADO</span>";
      }

      // --- linhas de sensor (voltagem/corrente/potência) ---
      const onlyPower = c.only_power === true;
      const powerColor = isOn ? c.color_power_on : c.color_power_off;
      const pSize = Number(c.power_font_size) || 34;
      const subOn = c.color_on_subtext, subOff = c.color_off_subtext;
      const row = (sensorId, icon, unit, area) => {
        const st = this._st(sensorId);
        if (!st) return `<div class="row" style="grid-area:${area}"></div>`;
        const ic = isOn ? subOn : "gold";
        const tc = isOn ? subOn : subOff;
        // sem leitura, some também a unidade: "— V" sugere um valor que não existe
        const text = noReading(st.state) ? NO_READING : `${esc(st.state)} ${unit}`;
        return `<div class="row sensor" style="grid-area:${area}" data-entity="${esc(sensorId)}">
          <ha-icon icon="${icon}" style="--mdc-icon-size:14px;width:14px;height:14px;color:${ic};"></ha-icon><span style="color:${tc};">${text}</span></div>`;
      };

      // only_power: some com corrente/tensão e a potência vira o número grande
      const bigPower = () => {
        const st = this._st(c.sensor_potencia);
        if (!st) return `<div class="row" style="grid-area:power"></div>`;
        const isz = Math.round(pSize * 0.62);
        const dash = noReading(st.state);
        const { value, unit } = dash
          ? { value: NO_READING, unit: "" }
          : fmtPower(st.state, st.attributes?.unit_of_measurement,
            this._hass?.locale?.language);
        return `<div class="row big sensor" style="grid-area:power" data-entity="${esc(c.sensor_potencia)}">
          <ha-icon icon="mdi:flash" style="--mdc-icon-size:${isz}px;width:${isz}px;height:${isz}px;color:${powerColor};"></ha-icon
          ><span class="pv">${esc(value)}</span><span class="pu">${esc(unit)}</span></div>`;
      };

      // subir nome e potência só no modo Somente Potência: sem as linhas de
      // V/A o bloco fica baixo demais no card. transform em vez de margem —
      // não mexe na grade, então o número não muda de tamanho ao subir.
      const lift = Number(c.only_power_lift);
      const liftCss = onlyPower && Number.isFinite(lift) && lift !== 0
        ? `transform:translateY(${-lift}px);` : "";
      const protoX = Number.isFinite(Number(c.protocol_offset_x)) ? Number(c.protocol_offset_x) : 10;
      const protoY = Number.isFinite(Number(c.protocol_offset_y)) ? Number(c.protocol_offset_y) : 10;

      // --- protocol ---
      let protocol = "";
      if (c.protocol_icon) {
        // cor própria quando informada; sem ela, o par do template original.
        // Caído, o fundo é vinho escuro e o branco a 25% do desligado quase
        // não aparece — o selinho sobe para 45% para continuar visível.
        const pc = isOn
          ? (c.protocol_color_on || "rgba(20, 20, 20, 0.72)")
          : dead
            ? (c.protocol_color_off || "rgba(255, 255, 255, 0.45)")
            : (c.protocol_color_off || "rgba(255, 255, 255, 0.25)");
        const pf = isOn
          ? "drop-shadow( 1px  1px 0px rgba(255, 255, 255, 0.65)) drop-shadow(-1px -1px 1px rgba(0,   0,   0,   0.50))"
          : "none";
        protocol = `<ha-icon class="proto" icon="${esc(c.protocol_icon)}" style="width:22px;height:22px;color:${pc};filter:${pf};"></ha-icon>`;
      }

      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          ha-card{font-family:'Graphik',sans-serif;position:relative;overflow:visible;
            border-radius:18px;padding:10%;font-size:16px;text-transform:uppercase;
            background:${bg};border:1px solid ${border};box-shadow:${shadow};height:100%;box-sizing:border-box;cursor:default;}
          .grid{display:grid;position:relative;height:100%;
            grid-template-areas:${onlyPower
              ? '"device_img status" "n n" "power power"'
              : '"device_img status" "n n" "voltage voltage" "current current" "power power"'};
            grid-template-columns:1fr 1fr;
            grid-template-rows:${onlyPower
              ? "1fr min-content min-content"
              : "1fr min-content min-content min-content min-content"};}
          .wm{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;
            background-size:60%;background-position:center center;background-repeat:no-repeat;border-radius:inherit;}
          .dev{grid-area:device_img;justify-self:start;align-self:start;position:relative;z-index:1;line-height:0;overflow:visible;}
          .stat{grid-area:status;align-self:start;justify-self:end;font-size:10px;font-weight:500;position:relative;z-index:1;}
          .nm{grid-area:n;font-weight:600;font-size:14px;color:${nameColor};align-self:center;justify-self:start;
            padding-top:6px;padding-bottom:6px;white-space:normal;word-wrap:break-word;text-align:left;text-transform:none;position:relative;z-index:1;${liftCss}}
          .row{padding-bottom:4px;align-self:center;justify-self:start;font-size:10px;font-weight:500;position:relative;z-index:1;
            display:inline-flex;align-items:center;gap:5px;}
          .row ha-icon{flex:none;line-height:0;display:flex;align-items:center;}
          .row.sensor{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
          .row.big{gap:6px;align-items:baseline;padding-bottom:2px;${liftCss}}
          .row.big ha-icon{align-self:center;flex:none;
            filter:${isOn ? "drop-shadow(0 1px 0 rgba(255,255,255,0.55))" : "none"};}
          /* tabular-nums trava a largura do dígito: o número não dança a cada leitura */
          .row.big .pv{font-size:${pSize}px;font-weight:700;line-height:1.05;color:${powerColor};
            font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;letter-spacing:-0.5px;
            text-shadow:${isOn ? "0 1px 0 rgba(255,255,255,0.55)" : "none"};}
          .row.big .pu{font-size:${Math.round(pSize * 0.4)}px;font-weight:600;color:${powerColor};
            opacity:.72;letter-spacing:0;}
          .proto{position:absolute;bottom:${protoY}px;right:${protoX}px;z-index:2;pointer-events:none;line-height:0;}
          span{font-size:12px;font-weight:500;line-height:1.4;}
          .tgl{display:inline-flex;align-items:center;}
          .tgl.live{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
          .tgl.locked{cursor:not-allowed;opacity:0.35;}
          .track{width:48px;height:24px;border-radius:12px;position:relative;transition:background .3s;pointer-events:none;}
          .knob{width:20px;height:20px;border-radius:50%;position:absolute;top:2px;transition:left .3s;pointer-events:none;}
          @keyframes pbc-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        </style>
        <ha-card>
          ${watermark}
          <div class="grid">
            <div class="dev">${deviceImg}</div>
            <div class="stat">${status}</div>
            <div class="nm">${esc(c.name || (ent?.attributes?.friendly_name ?? c.entity))}</div>
            ${onlyPower ? "" : row(c.sensor_voltagem, "mdi:lightning-bolt", "V", "voltage")}
            ${onlyPower ? "" : row(c.sensor_corrente, "mdi:current-ac", "A", "current")}
            ${onlyPower ? bigPower() : row(c.sensor_potencia, "mdi:flash", "W", "power")}
          </div>
          ${protocol}
        </ha-card>`;

      // --- interações (tap none / hold more-info, toggle, sensores → more-info) ---
      const fireMoreInfo = (entityId) => this.dispatchEvent(new CustomEvent("hass-more-info",
        { bubbles: true, composed: true, detail: { entityId } }));

      const buzz = c.haptic !== false;

      const tgl = this.shadowRoot.getElementById("pbc-toggle");
      if (tgl) tgl.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        // confirm: pergunta antes de mexer na tomada (o pointerdown da ha-card
        // já vibrou; o clique aqui é o commit da ação)
        if (c.confirm === true) {
          const nome = c.name || ent?.attributes?.friendly_name || c.entity;
          const ok = await confirmAction(c.confirm_text, nome, isOn ? "desligar" : "ligar");
          if (!ok) return;
        }
        this._hass.callService("switch", "toggle", { entity_id: c.entity });
      });

      this.shadowRoot.querySelectorAll(".row.sensor").forEach((el) =>
        el.addEventListener("click", (ev) => { ev.stopPropagation(); fireMoreInfo(el.dataset.entity); }));

      const card = this.shadowRoot.querySelector("ha-card");
      let holdTimer = null;
      // a vibração mora no pointerdown da ha-card: o toggle e as linhas de
      // sensor ficam dentro dela, então um toque em qualquer parte do card dá
      // retorno uma vez só (o stopPropagation deles é no click, não no press).
      card.addEventListener("pointerdown", () => {
        if (buzz) haptic("light");
        holdTimer = setTimeout(() => {
          holdTimer = null;
          if (buzz) haptic("medium");
          fireMoreInfo(c.entity);
        }, 500);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((t) =>
        card.addEventListener(t, () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } }));
    }
  }

  /* ---------------- EDITOR VISUAL ---------------- */

  const LABELS = {
    entity: "Tomada (switch)",
    name: "Nome",
    device_icon: "Ícone do aparelho",
    image_url: "Imagem do aparelho (URL, opcional — substitui o ícone)",
    __bg_preset: "Marca d'água de fundo",
    background_image_url: "URL da marca d'água (Custom)",
    background_transparent: "Transparência da marca d'água",
    sensor_voltagem: "Sensor de Voltagem",
    sensor_corrente: "Sensor de Corrente",
    sensor_potencia: "Sensor de Potência",
    only_power: "Somente Potência (esconde corrente e tensão, número grande)",
    power_font_size: "Tamanho da potência",
    only_power_lift: "Subir o nome e a potência",
    color_power_on: "Potência em destaque: ligado",
    color_power_off: "Potência em destaque: desligado",
    animate: "Animar ícone quando ligado (girar)",
    control: "Permitir ligar/desligar (desative p/ geladeira etc.)",
    haptic: "Vibrar ao tocar (feedback táctil no celular)",
    confirm: "Pedir confirmação antes de ligar/desligar",
    confirm_text: "Mensagem da confirmação ({nome} e {acao} são substituídos)",
    protocol_icon: "Protocolo",
    protocol_color_on: "Cor do protocolo (ligado)",
    protocol_color_off: "Cor do protocolo (desligado)",
    protocol_offset_x: "Protocolo: distância da borda direita",
    protocol_offset_y: "Protocolo: distância da borda inferior",
    paper_color: "Cor do papel (ligado)",
    color_on_bg: "Ligado: fundo",
    color_on_border: "Ligado: borda",
    color_on_name: "Ligado: nome",
    color_on_subtext: "Ligado: subtexto",
    color_off_bg: "Desligado: fundo",
    color_off_border: "Desligado: borda",
    color_off_name: "Desligado: nome",
    color_off_subtext: "Desligado: subtexto",
    color_unavail_bg: "Indisponível: fundo",
    color_unavail_border: "Indisponível: borda",
    color_unknown_bg: "Desconhecido: fundo",
    color_unknown_border: "Desconhecido: borda",
  };

  // ---- cores: parse/compose (mantém alfa, que o design usa MUITO) ----
  const COLOR_FIELDS = [
    "protocol_color_on", "protocol_color_off",
    "color_on_bg", "color_on_border", "color_on_name", "color_on_subtext",
    "color_off_bg", "color_off_border", "color_off_name", "color_off_subtext",
    "color_unavail_bg", "color_unavail_border", "color_unknown_bg", "color_unknown_border",
    "color_power_on", "color_power_off",
  ];
  const parseColor = (str) => {
    const s = String(str || "").trim();
    let m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    m = s.match(/^#([0-9a-f]{6})$/i);
    if (m) { const n = parseInt(m[1], 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 }; }
    m = s.match(/^#([0-9a-f]{3})$/i);
    if (m) { const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16)); return { r, g, b, a: 1 }; }
    return { r: 128, g: 128, b: 128, a: 1 };
  };
  const toHex = ({ r, g, b }) =>
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  const toRgba = ({ r, g, b, a }) => `rgba(${r}, ${g}, ${b}, ${a})`;

  class PowerButtonCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = { ...config };
      this._renderForm();
    }
    set hass(hass) {
      this._hass = hass;
      // o filtro dos selects depende do hass: sem reconstruir o esquema aqui,
      // um hass que chegue depois do setConfig deixaria a lista sem filtro
      if (this._form) {
        this._form.hass = hass;
        this._form.schema = this._schema(this._preset());
      }
    }

    _preset() {
      const url = this._config?.background_image_url || "";
      if (url === PRESET_URLS.tuya) return "tuya";
      if (url === PRESET_URLS.tapo) return "tapo";
      return url ? "custom" : "none";
    }

    // Sensores da tomada selecionada, em cascata — nunca devolve lista vazia:
    //   1) mesmo dispositivo do switch (registro de entidades do frontend)
    //   2) object_id parecido (switch.tomada_do_rack_tv_01 → sensor.tomada_..._*)
    //   3) todos os sensores
    // Dentro do dispositivo, ainda filtra pela grandeza (device_class) quando
    // a integração informa — mas só se sobrar alguma coisa.
    _sensorSel(classes) {
      const hass = this._hass;
      const ent = this._config?.entity;
      if (!hass || !ent) return { entity: { domain: "sensor" } };
      const isSensor = (id) => id.startsWith("sensor.") && hass.states[id];

      const devId = hass.entities?.[ent]?.device_id;
      let list = devId && hass.entities
        ? Object.keys(hass.entities).filter((id) => hass.entities[id].device_id === devId && isSensor(id))
        : [];
      if (!list.length) {
        const base = ent.split(".")[1];
        list = Object.keys(hass.states).filter((id) => isSensor(id) && id.split(".")[1].startsWith(base));
      }
      if (!list.length) return { entity: { domain: "sensor" } };

      const typed = classes
        ? list.filter((id) => classes.includes(hass.states[id]?.attributes?.device_class))
        : [];
      return { entity: { include_entities: typed.length ? typed : list } };
    }

    _schema(preset) {
      const onlyPower = this._config?.only_power === true;
      const s = [
        { name: "entity", required: true, selector: { entity: { domain: "switch" } } },
        { name: "name", selector: { text: {} } },
        { name: "device_icon", selector: { icon: {} } },
        { name: "image_url", selector: { text: {} } },
        {
          name: "__bg_preset",
          selector: {
            select: {
              mode: "dropdown",
              options: [
                { value: "none", label: "Nenhuma" },
                { value: "tuya", label: "Tuya" },
                { value: "tapo", label: "Tapo" },
                { value: "custom", label: "Custom" },
              ],
            },
          },
        },
      ];
      if (preset === "custom") s.push({ name: "background_image_url", selector: { text: {} } });
      s.push(
        { name: "background_transparent", selector: { number: { min: 0, max: 1, step: 0.005, mode: "box" } } },
        { name: "only_power", selector: { boolean: {} } },
      );
      // com «Somente Potência» ligado, tensão e corrente não são desenhadas —
      // não faz sentido continuar oferecendo os dois selects
      if (!onlyPower) {
        s.push(
          { name: "sensor_voltagem", selector: this._sensorSel(["voltage"]) },
          { name: "sensor_corrente", selector: this._sensorSel(["current"]) },
        );
      }
      s.push(
        { name: "sensor_potencia", selector: this._sensorSel(["power", "apparent_power"]) },
        ...(onlyPower
          ? [
            { name: "power_font_size", selector: { number: { min: 12, max: 96, step: 1, mode: "box", unit_of_measurement: "px" } } },
            { name: "only_power_lift", selector: { number: { min: -20, max: 60, step: 1, mode: "box", unit_of_measurement: "px" } } },
          ]
          : []),
        { name: "paper_color", selector: { select: { mode: "dropdown", options: paperOptions() } } },
        { name: "animate", selector: { boolean: {} } },
        { name: "control", selector: { boolean: {} } },
        { name: "haptic", selector: { boolean: {} } },
        { name: "confirm", selector: { boolean: {} } },
        // a mensagem só aparece quando a confirmação está ligada
        ...(this._config?.confirm === true
          ? [{ name: "confirm_text", selector: { text: {} } }] : []),
        {
          name: "protocol_icon",
          selector: {
            select: {
              mode: "dropdown",
              options: [
                { value: "", label: "Nenhum" },
                { value: "mdi:wifi", label: "Wi-Fi" },
                { value: "mdi:zigbee", label: "Zigbee" },
                { value: "mdi:bluetooth", label: "Bluetooth" },
                { value: "mdi:z-wave", label: "Z-Wave" },
              ],
            },
          },
        },
        // posição do selinho: só faz sentido com um protocolo escolhido
        ...(this._config?.protocol_icon
          ? [
            { name: "protocol_offset_x", selector: { number: { min: -20, max: 80, step: 1, mode: "box", unit_of_measurement: "px" } } },
            { name: "protocol_offset_y", selector: { number: { min: -20, max: 80, step: 1, mode: "box", unit_of_measurement: "px" } } },
          ]
          : []),
      );
      return s;
    }

    // Seção «Cores» com picker visual (cor + alfa) — mantém alfa do rgba.
    _renderColors() {
      if (!this._colorsEl) {
        this._colorsEl = document.createElement("details");
        this._colorsEl.style.cssText = "margin-top:16px;border:1px solid var(--divider-color);border-radius:8px;padding:8px 12px;";
        this.appendChild(this._colorsEl);
      }
      const rows = COLOR_FIELDS.map((name) => {
        const cur = this._config[name] ?? DEFAULTS[name] ?? "";
        const c = parseColor(cur || "rgba(128,128,128,1)");
        return `<div class="pbc-crow" data-name="${name}">
          <span class="lbl">${LABELS[name] || name}</span>
          <input type="color" value="${toHex(c)}" title="cor">
          <input type="range" min="0" max="1" step="0.01" value="${c.a}" title="transparência (alfa)">
          <code>${cur || "—"}</code>
        </div>`;
      }).join("");
      this._colorsEl.innerHTML = `
        <summary style="cursor:pointer;font-weight:500;">Cores (clique para ajustar — cor + transparência)</summary>
        <style>
          .pbc-crow{display:grid;grid-template-columns:1fr 44px 110px minmax(120px,1fr);gap:10px;align-items:center;padding:6px 0;}
          .pbc-crow .lbl{font-size:13px;}
          .pbc-crow input[type=color]{width:40px;height:28px;border:none;background:none;cursor:pointer;padding:0;}
          .pbc-crow code{font-size:11px;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        </style>${rows}`;
      this._colorsEl.querySelectorAll(".pbc-crow").forEach((rowEl) => {
        const name = rowEl.dataset.name;
        const apply = () => {
          const hex = rowEl.querySelector("input[type=color]").value;
          const a = parseFloat(rowEl.querySelector("input[type=range]").value);
          const { r, g, b } = parseColor(hex);
          this._setKey(name, toRgba({ r, g, b, a }));
          rowEl.querySelector("code").textContent = this._config[name];
        };
        rowEl.querySelector("input[type=color]").addEventListener("input", apply);
        rowEl.querySelector("input[type=range]").addEventListener("input", apply);
      });
    }

    _setKey(key, value) {
      const clean = { ...this._config };
      if (value === DEFAULTS[key]) delete clean[key]; else clean[key] = value;
      this._config = clean;
      this.dispatchEvent(new CustomEvent("config-changed",
        { bubbles: true, composed: true, detail: { config: clean } }));
    }

    _renderForm() {
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (f) => LABELS[f.name] || f.name;
        this._form.addEventListener("value-changed", (ev) => this._onChange(ev));
        this.appendChild(this._form);
      }
      const preset = this._preset();
      this._form.hass = this._hass;
      this._form.schema = this._schema(preset);
      this._form.data = { ...DEFAULTS, ...this._config, __bg_preset: preset };
      this._renderColors();
    }

    _onChange(ev) {
      ev.stopPropagation();
      const v = { ...ev.detail.value };
      const preset = v.__bg_preset;
      delete v.__bg_preset; // campo virtual do editor — nunca vai para o YAML
      if (preset === "tuya") v.background_image_url = PRESET_URLS.tuya;
      else if (preset === "tapo") v.background_image_url = PRESET_URLS.tapo;
      else if (preset === "none") v.background_image_url = "";
      else if (preset === "custom" && (v.background_image_url === PRESET_URLS.tuya || v.background_image_url === PRESET_URLS.tapo)) {
        v.background_image_url = "";
      }
      // não poluir o YAML com defaults intactos
      const clean = {};
      for (const [k, val] of Object.entries(v)) {
        if (k === "entity" || k === "name" || val !== DEFAULTS[k]) clean[k] = val;
      }
      // campo que o esquema escondeu (ex.: sensor de corrente com «Somente
      // Potência» ligado) não aparece no `v` — sem isto ele sumiria do YAML
      for (const [k, val] of Object.entries(this._config)) {
        if (!(k in v) && !COLOR_FIELDS.includes(k) && clean[k] === undefined) clean[k] = val;
      }
      // cores vivem fora do ha-form — preservar as já configuradas
      for (const k of COLOR_FIELDS) {
        if (this._config[k] !== undefined) clean[k] = this._config[k];
      }
      this._config = clean;
      this.dispatchEvent(new CustomEvent("config-changed",
        { bubbles: true, composed: true, detail: { config: clean } }));
      this._renderForm();
    }
  }

  customElements.define("power-button-card", PowerButtonCard);
  customElements.define("power-button-card-editor", PowerButtonCardEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "power-button-card",
    name: "MW Power Button Card",
    description: "Botão de tomada estilo papel com V/A/W, toggle, marca d'água e protocolo.",
    preview: true,
    documentationURL: "https://github.com/visaodeempresa/mw-ha-power-button-card",
  });

  console.info("%c MW-POWER-BUTTON-CARD %c 0.5.0 ", "background:#1a1a1a;color:#fdfaf3;font-weight:700;", "background:#e8e3d8;color:#1a1a1a;font-weight:700;");
})();
