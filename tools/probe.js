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

console.log(fails ? `\n${fails} verificação(ões) falharam` : "\ntudo ok");
process.exit(fails ? 1 : 0);
