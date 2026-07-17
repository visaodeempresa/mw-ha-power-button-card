/* mw-ha-power-button-card — custom:power-button-card
 * Port fiel do template button-card "tomada_energia_papel_v6" (papel/neumórfico)
 * para um card Lovelace nativo com editor visual completo.
 * Sem build, sem dependências: JS puro + selectors nativos do HA (<ha-form>).
 * Repo: https://github.com/visaodeempresa/mw-ha-power-button-card
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
    protocol_icon: "",
    protocol_color_on: null,
    protocol_color_off: null,
    sensor_voltagem: "",
    sensor_corrente: "",
    sensor_potencia: "",
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
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
      if (isOn) { bg = "linear-gradient(145deg, #fdfaf3, #e8e3d8)"; border = c.color_on_border; }
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
        const wmFilter = dead ? "filter:grayscale(100%);" : isOff ? "filter:grayscale(40%) brightness(1.8);" : "";
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
      const subOn = c.color_on_subtext, subOff = c.color_off_subtext;
      const row = (sensorId, icon, unit, area) => {
        const st = this._st(sensorId);
        if (!st) return `<div class="row" style="grid-area:${area}"></div>`;
        const ic = isOn ? subOn : "gold";
        const tc = isOn ? subOn : subOff;
        return `<div class="row sensor" style="grid-area:${area}" data-entity="${esc(sensorId)}">
          <ha-icon icon="${icon}" style="width:14px;height:14px;color:${ic};"></ha-icon><span style="color:${tc};"> ${esc(st.state)} ${unit}</span></div>`;
      };

      // --- protocol ---
      let protocol = "";
      if (c.protocol_icon) {
        const pc = isOn ? "rgba(20, 20, 20, 0.72)" : (c.protocol_color_off || "rgba(255, 255, 255, 0.25)");
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
            grid-template-areas:"device_img status" "n n" "voltage voltage" "current current" "power power";
            grid-template-columns:1fr 1fr;grid-template-rows:1fr min-content min-content min-content min-content;}
          .wm{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;
            background-size:60%;background-position:center center;background-repeat:no-repeat;border-radius:inherit;}
          .dev{grid-area:device_img;justify-self:start;align-self:start;position:relative;z-index:1;line-height:0;overflow:visible;}
          .stat{grid-area:status;align-self:start;justify-self:end;font-size:10px;font-weight:500;position:relative;z-index:1;}
          .nm{grid-area:n;font-weight:600;font-size:14px;color:${nameColor};align-self:center;justify-self:start;
            padding-top:6px;padding-bottom:6px;white-space:normal;word-wrap:break-word;text-align:left;text-transform:none;position:relative;z-index:1;}
          .row{padding-bottom:4px;align-self:center;justify-self:start;font-size:10px;font-weight:500;position:relative;z-index:1;
            display:inline-flex;align-items:center;}
          .row.sensor{cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
          .proto{position:absolute;bottom:8px;right:8px;z-index:2;pointer-events:none;line-height:0;}
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
            ${row(c.sensor_voltagem, "mdi:lightning-bolt", "V", "voltage")}
            ${row(c.sensor_corrente, "mdi:current-ac", "A", "current")}
            ${row(c.sensor_potencia, "mdi:flash", "W", "power")}
          </div>
          ${protocol}
        </ha-card>`;

      // --- interações (tap none / hold more-info, toggle, sensores → more-info) ---
      const fireMoreInfo = (entityId) => this.dispatchEvent(new CustomEvent("hass-more-info",
        { bubbles: true, composed: true, detail: { entityId } }));

      const tgl = this.shadowRoot.getElementById("pbc-toggle");
      if (tgl) tgl.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._hass.callService("switch", "toggle", { entity_id: c.entity });
      });

      this.shadowRoot.querySelectorAll(".row.sensor").forEach((el) =>
        el.addEventListener("click", (ev) => { ev.stopPropagation(); fireMoreInfo(el.dataset.entity); }));

      const card = this.shadowRoot.querySelector("ha-card");
      let holdTimer = null;
      card.addEventListener("pointerdown", () => {
        holdTimer = setTimeout(() => { holdTimer = null; fireMoreInfo(c.entity); }, 500);
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
    animate: "Animar ícone quando ligado (girar)",
    control: "Permitir ligar/desligar (desative p/ geladeira etc.)",
    protocol_icon: "Protocolo",
    protocol_color_on: "Cor do protocolo (ligado)",
    protocol_color_off: "Cor do protocolo (desligado)",
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

  const colorText = (name) => ({ name, selector: { text: {} } });

  class PowerButtonCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = { ...config };
      this._renderForm();
    }
    set hass(hass) {
      this._hass = hass;
      if (this._form) this._form.hass = hass;
    }

    _preset() {
      const url = this._config?.background_image_url || "";
      if (url === PRESET_URLS.tuya) return "tuya";
      if (url === PRESET_URLS.tapo) return "tapo";
      return url ? "custom" : "none";
    }

    _schema(preset) {
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
        { name: "sensor_voltagem", selector: { entity: { domain: "sensor" } } },
        { name: "sensor_corrente", selector: { entity: { domain: "sensor" } } },
        { name: "sensor_potencia", selector: { entity: { domain: "sensor" } } },
        { name: "animate", selector: { boolean: {} } },
        { name: "control", selector: { boolean: {} } },
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
        colorText("protocol_color_on"), colorText("protocol_color_off"),
        {
          name: "cores_avancadas", type: "expandable", title: "Cores avançadas (rgba/hex)",
          schema: [
            colorText("color_on_bg"), colorText("color_on_border"),
            colorText("color_on_name"), colorText("color_on_subtext"),
            colorText("color_off_bg"), colorText("color_off_border"),
            colorText("color_off_name"), colorText("color_off_subtext"),
            colorText("color_unavail_bg"), colorText("color_unavail_border"),
            colorText("color_unknown_bg"), colorText("color_unknown_border"),
          ],
        },
      );
      return s;
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

  console.info("%c MW-POWER-BUTTON-CARD %c v0.1.0 ", "background:#1a1a1a;color:#fdfaf3;font-weight:700;", "background:#e8e3d8;color:#1a1a1a;font-weight:700;");
})();
