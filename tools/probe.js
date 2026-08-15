/* Probe headless — instancia o card e o editor fora do navegador.
 * Pega erro de template, grade quebrada e filtro de select furado sem
 * depender do HA. Roda no CI e antes de qualquer PR:  node tools/probe.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const stub = {
  style: {}, dataset: {},
  addEventListener() {}, appendChild() {}, querySelector() { return stub; },
  querySelectorAll() { return []; }, dispatchEvent() {},
};
global.HTMLElement = class {
  constructor() { this.children = []; }
  attachShadow() {
    this.shadowRoot = {
      innerHTML: "",
      querySelector: () => stub,
      querySelectorAll: () => [],
      getElementById: () => null,
    };
    return this.shadowRoot;
  }
  appendChild(el) { this.children.push(el); return el; }
  dispatchEvent() {}
  addEventListener() {}
};
const reg = {};
global.customElements = { define: (n, c) => (reg[n] = c) };
global.document = {
  createElement: () => ({
    style: { cssText: "" }, dataset: {},
    addEventListener() {}, appendChild() {}, dispatchEvent() {},
    querySelector: () => stub, querySelectorAll: () => [],
  }),
};
global.window = {};
global.CustomEvent = class { constructor(t, d) { this.type = t; Object.assign(this, d); } };
console.info = () => {};

eval(fs.readFileSync(path.join(__dirname, "..", "dist", "power-button-card.js"), "utf8"));

const S = (id, state, attrs = {}) => [id, { state, attributes: attrs }];
const hass = {
  states: Object.fromEntries([
    S("switch.tomada_rack", "on", { friendly_name: "TOMADA DO RACK" }),
    S("sensor.tomada_rack_voltagem", "127.4", { device_class: "voltage", unit_of_measurement: "V" }),
    S("sensor.tomada_rack_corrente", "0.42", { device_class: "current", unit_of_measurement: "A" }),
    S("sensor.tomada_rack_potencia", "1234.56", { device_class: "power", unit_of_measurement: "W" }),
    S("sensor.tomada_rack_energia", "12.5", { device_class: "energy", unit_of_measurement: "kWh" }),
    S("sensor.tomada_rack_rssi", "-70", { device_class: "signal_strength" }),
    S("sensor.geladeira_potencia", "90", { device_class: "power", unit_of_measurement: "W" }),
    S("sensor.tomada_rack_potencia_grande", "12345", { device_class: "power", unit_of_measurement: "W" }),
  ]),
  entities: {
    "switch.tomada_rack": { device_id: "dev1" },
    "sensor.tomada_rack_voltagem": { device_id: "dev1" },
    "sensor.tomada_rack_corrente": { device_id: "dev1" },
    "sensor.tomada_rack_potencia": { device_id: "dev1" },
    "sensor.tomada_rack_energia": { device_id: "dev1" },
    "sensor.tomada_rack_rssi": { device_id: "dev1" },
    "sensor.tomada_rack_potencia_grande": { device_id: "dev1" },
    "sensor.geladeira_potencia": { device_id: "dev2" },
  },
  devices: { dev1: { name: "Tomada do rack" }, dev2: { name: "Geladeira" } },
  locale: { language: "pt-BR" },
  callService() {},
};

let fails = 0;
const check = (label, cond, extra = "") => {
  if (cond) { console.log(`  ok   ${label}`); return; }
  fails += 1;
  console.log(`  FAIL ${label}${extra ? " — " + extra : ""}`);
};
const mk = (cfg) => {
  const el = new reg["power-button-card"]();
  el.setConfig(cfg);
  el.hass = hass;
  return el.shadowRoot.innerHTML;
};

console.log("card:");
const base = {
  entity: "switch.tomada_rack",
  sensor_voltagem: "sensor.tomada_rack_voltagem",
  sensor_corrente: "sensor.tomada_rack_corrente",
  sensor_potencia: "sensor.tomada_rack_potencia",
};
const full = mk(base);
check("grade completa (V/A/W)", full.includes('"voltage voltage" "current current" "power power"'));
check("linha de tensão", full.includes("127.4 V"));

const only = mk({ ...base, only_power: true });
check("grade só com potência", only.includes('"device_img status" "n n" "power power"') &&
  !only.includes("voltage voltage"));
check("corrente e tensão somem", !only.includes("127.4") && !only.includes("0.42"));
check("potência com 1 casa decimal (pt-BR)", only.includes(">1234,6<"), only.slice(-400));
check("unidade separada do número", only.includes('class="pu">W<'));
check("fonte grande no padrão (34px)", only.includes("font-size:34px"));
check("cor de destaque ligada", only.includes("#7a4b00"));
check("tabular-nums (número não dança)", only.includes("tabular-nums"));

const big = mk({ ...base, only_power: true, sensor_potencia: "sensor.tomada_rack_potencia_grande" });
check("acima de 9999 W sobe para kW", big.includes(">12,3<") && big.includes('class="pu">kW<'),
  big.slice(-300));

const offCard = new reg["power-button-card"]();
offCard.setConfig({ ...base, only_power: true });
offCard.hass = { ...hass, states: { ...hass.states, "switch.tomada_rack": { state: "off", attributes: {} } } };
check("cor de destaque desligada", offCard.shadowRoot.innerHTML.includes("#f0b429"));

const noPower = mk({ entity: "switch.tomada_rack", only_power: true });
check("sem sensor de potência não quebra", noPower.includes('class="row" style="grid-area:power"'));

const custom = mk({ ...base, only_power: true, power_font_size: 52, color_power_on: "#123456" });
check("tamanho e cor configuráveis",
  custom.includes("font-size:52px") && custom.includes("#123456"));

console.log("editor:");
const ed = new reg["power-button-card-editor"]();
ed.hass = hass;
ed.setConfig({ entity: "switch.tomada_rack" });
const byName = (sch, n) => sch.find((f) => f.name === n);
const inc = (sch, n) => byName(sch, n)?.selector?.entity?.include_entities;
let sch = ed._schema("none");
check("select de tensão só com a tensão da tomada",
  JSON.stringify(inc(sch, "sensor_voltagem")) === JSON.stringify(["sensor.tomada_rack_voltagem"]),
  JSON.stringify(inc(sch, "sensor_voltagem")));
check("select de corrente só com a corrente da tomada",
  JSON.stringify(inc(sch, "sensor_corrente")) === JSON.stringify(["sensor.tomada_rack_corrente"]));
check("select de potência não traz a da geladeira",
  JSON.stringify(inc(sch, "sensor_potencia")) ===
  JSON.stringify(["sensor.tomada_rack_potencia", "sensor.tomada_rack_potencia_grande"]),
  JSON.stringify(inc(sch, "sensor_potencia")));
check("flag no formulário", !!byName(sch, "only_power"));
check("tamanho da fonte escondido com o flag desligado", !byName(sch, "power_font_size"));

ed.setConfig({ entity: "switch.tomada_rack", only_power: true });
sch = ed._schema("none");
check("com o flag ligado somem tensão e corrente",
  !byName(sch, "sensor_voltagem") && !byName(sch, "sensor_corrente") && !!byName(sch, "sensor_potencia"));
check("tamanho da fonte aparece com o flag ligado", !!byName(sch, "power_font_size"));

// sem registro de entidades (instalação antiga): cai no object_id parecido
const edNoReg = new reg["power-button-card-editor"]();
edNoReg.hass = { ...hass, entities: undefined, devices: undefined };
edNoReg.setConfig({ entity: "switch.tomada_rack" });
const list = inc(edNoReg._schema("none"), "sensor_potencia");
check("sem registro, filtra pelo object_id",
  Array.isArray(list) && list.every((id) => id.startsWith("sensor.tomada_rack")), JSON.stringify(list));

// entidade sem sensor nenhum: precisa sobrar o domínio inteiro, nunca lista vazia
const edSolo = new reg["power-button-card-editor"]();
edSolo.hass = hass;
edSolo.setConfig({ entity: "switch.sozinha" });
check("tomada sem sensores cai para todos os sensores",
  byName(edSolo._schema("none"), "sensor_potencia").selector.entity.domain === "sensor");

// campo escondido pelo esquema não pode sumir do YAML
const edKeep = new reg["power-button-card-editor"]();
edKeep.hass = hass;
edKeep.setConfig({ ...base, only_power: true });
const captured = [];
edKeep.dispatchEvent = (ev) => captured.push(ev.detail.config);
edKeep._onChange({
  stopPropagation() {},
  detail: { value: { entity: "switch.tomada_rack", only_power: true,
    sensor_potencia: "sensor.tomada_rack_potencia", __bg_preset: "none" } },
});
const out = captured[0];
check("sensores escondidos continuam no YAML",
  out.sensor_voltagem === "sensor.tomada_rack_voltagem" &&
  out.sensor_corrente === "sensor.tomada_rack_corrente", JSON.stringify(out));
check("defaults fora do YAML", out.power_font_size === undefined && out.animate === undefined);

console.log("ajuste fino:");
const lifted = mk({ ...base, only_power: true });
check("nome e potência sobem 6px por padrão",
  (lifted.match(/transform:translateY\(-6px\)/g) || []).length === 2, lifted.slice(-500));
check("lift 0 não deixa transform sobrando",
  !mk({ ...base, only_power: true, only_power_lift: 0 }).includes("translateY"));
check("lift configurável", mk({ ...base, only_power: true, only_power_lift: 14 })
  .includes("transform:translateY(-14px)"));
check("sem only_power ninguém sobe", !mk(base).includes("translateY"));

const proto = mk({ ...base, protocol_icon: "mdi:zigbee" });
check("selinho 10px das bordas por padrão", proto.includes("bottom:10px;right:10px"));
check("deslocamento do selinho configurável",
  mk({ ...base, protocol_icon: "mdi:zigbee", protocol_offset_x: 16, protocol_offset_y: 20 })
    .includes("bottom:20px;right:16px"));
check("selinho pode sair para fora (negativo)",
  mk({ ...base, protocol_icon: "mdi:zigbee", protocol_offset_x: -4 }).includes("right:-4px"));
check("cor do protocolo ligada agora vale",
  mk({ ...base, protocol_icon: "mdi:zigbee", protocol_color_on: "#8e24aa" }).includes("#8e24aa"));
check("sem cor própria, mantém a do template",
  proto.includes("rgba(20, 20, 20, 0.72)"));
const protoOff = new reg["power-button-card"]();
protoOff.setConfig({ ...base, protocol_icon: "mdi:zigbee", protocol_color_off: "#90caf9" });
protoOff.hass = { ...hass, states: { ...hass.states, "switch.tomada_rack": { state: "off", attributes: {} } } };
check("cor do protocolo desligada continua valendo",
  protoOff.shadowRoot.innerHTML.includes("#90caf9"));

console.log("offline (tomada caída):");
const deadStates = {
  ...hass.states,
  "switch.tomada_rack": { state: "unavailable", attributes: { friendly_name: "TOMADA DO RACK" } },
  "sensor.tomada_rack_voltagem": { state: "unavailable", attributes: { device_class: "voltage" } },
  "sensor.tomada_rack_corrente": { state: "unknown", attributes: { device_class: "current" } },
  "sensor.tomada_rack_potencia": { state: "unavailable", attributes: { device_class: "power" } },
};
const mkDead = (cfg) => {
  const el = new reg["power-button-card"]();
  el.setConfig(cfg);
  el.hass = { ...hass, states: deadStates };
  return el.shadowRoot.innerHTML;
};
const deadFull = mkDead({ ...base, background_image_url: "https://x/tuya.png", protocol_icon: "mdi:wifi" });
check("nenhum 'unavailable' na cara do card", !deadFull.includes("unavailable</span>") &&
  !/>\s*unavailable/.test(deadFull), deadFull.slice(deadFull.indexOf("<div class=\"grid\"")));
check("nenhum 'unknown' na cara do card", !/>\s*unknown/.test(deadFull));
check("V/A/W viram travessão", (deadFull.match(/—/g) || []).length === 3);
check("selo OFFLINE continua", deadFull.includes("OFFLINE"));
check("marca d'água clareada p/ aparecer no fundo escuro",
  deadFull.includes("filter:grayscale(100%) brightness(1.8);"));
check("selinho de protocolo visível offline", deadFull.includes("rgba(255, 255, 255, 0.45)"));
check("cor do protocolo do dono vale offline",
  mkDead({ ...base, protocol_icon: "mdi:wifi", protocol_color_off: "#90caf9" }).includes("#90caf9"));

const deadOnly = mkDead({ ...base, only_power: true, background_image_url: "https://x/tuya.png" });
check("potência grande vira travessão", deadOnly.includes('class="pv">—<'),
  deadOnly.slice(deadOnly.indexOf("row big")));
check("travessão sem unidade pendurada", deadOnly.includes('class="pu"></span>'));
check("marca d'água presente no Somente Potência", deadOnly.includes("https://x/tuya.png"));

const halfDead = new reg["power-button-card"]();
halfDead.setConfig(base);
halfDead.hass = { ...hass, states: { ...hass.states,
  "sensor.tomada_rack_corrente": { state: "unavailable", attributes: {} } } };
check("sensor caído sozinho não apaga os outros",
  halfDead.shadowRoot.innerHTML.includes("127.4 V") &&
  (halfDead.shadowRoot.innerHTML.match(/—/g) || []).length === 1);

const edFine = new reg["power-button-card-editor"]();
edFine.hass = hass;
edFine.setConfig({ ...base, only_power: true, protocol_icon: "mdi:zigbee" });
const fineSchema = edFine._schema("none");
check("campo de subida aparece com only_power", !!byName(fineSchema, "only_power_lift"));
check("campos de deslocamento aparecem com protocolo",
  !!byName(fineSchema, "protocol_offset_x") && !!byName(fineSchema, "protocol_offset_y"));
const edNoProto = new reg["power-button-card-editor"]();
edNoProto.hass = hass;
edNoProto.setConfig(base);
check("sem protocolo, sem campos de deslocamento",
  !byName(edNoProto._schema("none"), "protocol_offset_x"));
check("sem only_power, sem campo de subida",
  !byName(edNoProto._schema("none"), "only_power_lift"));

// --- marca d'água: endereços do site + migração dos endereços antigos ---
const PAGES = "https://mayconsoftware.github.io/assets/devices/ha-integration";
const RAW = "https://raw.githubusercontent.com/mayconsoftware/mayconsoftware.github.io/refs/heads/main/assets/devices/ha-integration";
const src = fs.readFileSync(path.join(__dirname, "..", "dist", "power-button-card.js"), "utf8");
check("preset Tuya aponta para o site", src.includes(`${PAGES}/ha-integration-tuya.png`));
check("preset Tapo aponta para o site", src.includes(`${PAGES}/ha-integration-tapo.png`));

for (const marca of ["tuya", "tapo"]) {
  const velho = `${RAW}/ha-integration-${marca}.png`;
  const novo = `${PAGES}/ha-integration-${marca}.png`;

  const cardVelho = new reg["power-button-card"]();
  cardVelho.setConfig({ ...base, background_image_url: velho });
  cardVelho.hass = hass;
  const html = cardVelho.shadowRoot.innerHTML;
  check(`card com URL antiga de ${marca} desenha a do site`,
    html.includes(novo) && !html.includes(velho));

  const edVelho = new reg["power-button-card-editor"]();
  edVelho.hass = hass;
  edVelho.setConfig({ ...base, background_image_url: velho });
  check(`editor reconhece a URL antiga de ${marca} como preset`,
    edVelho._preset() === marca);
}

const urlDeTerceiro = "https://exemplo.invalido/minha-marca.png";
const edCustom = new reg["power-button-card-editor"]();
edCustom.hass = hass;
edCustom.setConfig({ ...base, background_image_url: urlDeTerceiro });
check("URL de terceiro passa intacta (Custom)",
  edCustom._preset() === "custom" && edCustom._config.background_image_url === urlDeTerceiro);

console.log(fails ? `\n${fails} verificação(ões) falharam` : "\ntudo ok");
process.exit(fails ? 1 : 0);
