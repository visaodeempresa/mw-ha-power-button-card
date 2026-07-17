# HISTÓRICO — mw-ha-power-button-card

## 2026-07-17 — v0.1.0 (sessão inicial, Claude)
- Plano salvo (PLANO.md) e commitado antes do código.
- `dist/power-button-card.js`: port fiel do template `tomada_energia_papel_v6`
  (JS puro, sem build): estados on/off/unavailable/unknown, watermark com
  grayscale por estado, toggle com trava (`control:false`), linhas V/A/W
  clicáveis (more-info), hold = more-info, protocol badge, spin no ícone.
- Editor visual (`ha-form` nativo): entity só switch; sensores só sensor e
  em branco por default; icon picker amigável; protocolo dropdown
  (Wi-Fi/Zigbee/Bluetooth/Z-Wave); marca d'água dropdown Tuya/Tapo/Custom
  (campo virtual `__bg_preset`, nunca gravado no YAML); 12 cores por estado
  em seção expansível. Defaults intactos não poluem o YAML.
- hacs.json + README + workflow de release (padrão do fork new-floor3d-card,
  sem build: tag v* → asset na Release → HACS notifica no HA).
- Validação local: `node --check` OK. Teste visual: após instalar via HACS.

### Pendente
- Merge do PR (dono) → tag v0.1.0 → instalar via HACS → validar visual/editor.
- Polimento DevOps/docs (fase 2, combinado).

## 2026-07-17 — v0.1.1 (ajustes pós-teste real do dono)
- Linhas V/A/W: `--mdc-icon-size:14px` + `gap:5px` (ícones estavam colados/
  desalinhados — o mdc renderizava 24px por baixo).
- Editor: sensores agora filtram por `include_entities` casando o object_id do
  switch (switch.tomada_do_rack_tv_01 → sensor.tomada_do_rack_tv_01_*);
  fallback = todos os sensores se nada casar.
- Cores: seção própria com picker visual (input color + slider de alfa),
  preservando o alfa dos rgba; ha-form não derruba mais cores configuradas.
