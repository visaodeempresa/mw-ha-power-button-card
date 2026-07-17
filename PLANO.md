# PLANO — mw-ha-power-button-card

**Objetivo:** componentizar o botão `tomada_energia_papel_v6` (button-card template)
como card Lovelace nativo `custom:power-button-card`, instalável via HACS, com
**editor visual** cobrindo TODAS as propriedades. Foco: funcionar via HACS;
polimento/DevOps depois.

## Decisões técnicas
- **Sem build**: 1 arquivo `dist/power-button-card.js` em JS puro (HTMLElement),
  fiel pixel-a-pixel ao template. Menos tokens, zero toolchain, fácil manter.
- **Editor**: `getConfigElement()` devolve elemento que hospeda `<ha-form>` com
  selectors nativos do HA (entity/icon/select/number/boolean/text).
- **Fidelidade**: portar a lógica dos `[[[ ]]]` exatamente (estados on/off/
  unavailable/unknown, watermark, toggle, sensores clicáveis, protocol, spin).

## Propriedades (26 — as do template + entity + name; NADA a mais)
entity (só switch) · name · image_url · device_icon (icon picker) ·
background_image_url (editor: dropdown Tuya/Tapo/Custom → URL) ·
background_transparent · animate · control · protocol_icon (wifi/zigbee/
bluetooth/z-wave) · protocol_color_on · protocol_color_off ·
sensor_voltagem/corrente/potencia (só sensor, default em branco) ·
color_on_{bg,border,name,subtext} · color_off_{bg,border,name,subtext} ·
color_unavail_{bg,border} · color_unknown_{bg,border}

URLs dos presets (da tela do dono):
- Tuya: https://raw.githubusercontent.com/mayconsoftware/mayconsoftware.github.io/refs/heads/main/assets/devices/ha-integration/ha-integration-tuya.png
- Tapo: idem com `-tapo.png`

## Checklist (status vivo)
- [x] Pasta + git + plano salvo
- [x] dist/power-button-card.js (card + editor)
- [x] hacs.json + README mínimo
- [x] Workflow de release (pescado do fork)
- [x] Repo GitHub PÚBLICO + feature branch + PR #1
- [ ] Release v0.1.0 → instalar via HACS (repositório custom) → validar no HA

## Como continuar manualmente (se tokens acabarem)
1. `cd /Volumes/SSD-T1-01/CLAUDE-SSD/PROJECTS/mw-ha-power-button-card`
2. Ver checklist acima + `git log`/`HISTORICO.md`
3. HACS → Integrações... não: **HACS → Frontend → ⋮ → Repositórios personalizados**
   → URL `https://github.com/visaodeempresa/mw-ha-power-button-card` (categoria
   *Dashboard/Plugin*) → instalar → recarregar navegador.
