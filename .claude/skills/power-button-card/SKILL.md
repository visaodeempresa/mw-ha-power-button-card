---
name: power-button-card
description: Trabalhar no custom:power-button-card (card de tomada papel/neumórfico com V/A/W, marca d'água Tuya/Tapo e selinho de protocolo). Use ao adicionar propriedade, mexer em cores/paleta de papel/sensores, publicar teste no HA, gerar release pelo HACS, ou quando o dono disser que "mudou e a tela não muda" / "o HACS não mostra versão nova".
---

# power-button-card — fábrica

Arquivo único `dist/power-button-card.js` (fonte **e** artefato, sem build).
JS puro + `<ha-form>`. Instala por HACS, tipo Dashboard. Port fiel do template
button-card `tomada_energia_papel_v6`.

## Anatomia

- `DEFAULTS` — toda propriedade nasce aqui; o editor tira do YAML o que for
  igual ao default.
- Bloco `>>> paper-palette v1` — **não editar aqui**. Fonte canônica em
  `/Volumes/SSD-T1-01/CLAUDE-SSD/IA/lib/paper-palette/`; validar com
  `IA/tools/check-embeds.sh` antes de commitar. O bloco é byte a byte igual
  ao do card irmão simple-button-card.
- `_render()` — fundo por estado (`on` usa `paperGradient(c.paper_color)`),
  marca d'água, imagem/ícone do aparelho, toggle, linhas V/A/W clicáveis.
- `_sensorSel()` — prioriza sensores cujo `object_id` casa com o do switch
  (`switch.tomada_rack` → `sensor.tomada_rack_*`).
- `_schema(preset)` — editor dinâmico: `background_image_url` só aparece no
  preset `custom`.

## Testar no HA (sem esperar release)

```bash
cd /Volumes/SSD-T1-01/CLAUDE-SSD/PROJECTS
gzip -9 -c mw-ha-power-button-card/dist/power-button-card.js > /tmp/power-button-card.js.gz
scp -F new_wakeword/ssh/ssh_config mw-ha-power-button-card/dist/power-button-card.js \
  /tmp/power-button-card.js.gz ha-leticia:/config/www/community/mw-ha-power-button-card/
curl -s http://192.168.1.71:8123/hacsfiles/mw-ha-power-button-card/power-button-card.js | grep -c "<marcador novo>"
```

**Subir o `.js.gz` junto não é opcional** — existindo, é ele que o servidor
entrega. Depois, hard refresh (⌘⇧R): o `?hacstag=` é fixo por versão.

## Verificar sem browser

Probe em Node (o pane de browser normalmente não abre o HA): stub de
`HTMLElement`/`customElements`, `eval` do arquivo, `setConfig` + `hass`, e
leitura do `shadowRoot.innerHTML`. O shadow root stub precisa de
`getElementById` — este card usa. Receita completa em
`IA/skills/ha-lovelace-card-factory/SKILL.md`.

## Release

Feature branch → PR → **merge é do dono** → `auto-release.yml` (só dispara em
push na `main`) calcula o bump pelos commits (`feat` = minor) → tag → HACS.
**Não** subir o número no `console.info` em PR pré-merge — o workflow
sincroniza sozinho (o `sed` foi corrigido em 2026-07-31: procurava `%c v0.1.2`
e o banner nunca teve o `v`, então era no-op silencioso).

## Armadilhas

| Sintoma | Causa |
|---|---|
| "HACS não mostra versão nova" | commit em feature branch; release só na `main` |
| `curl` novo, tela velha | `.js.gz` antigo ainda servido |
| Linhas V/A/W somem | `sensor_*` apontando para entidade inexistente — `_st()` devolve null |
| Paleta divergindo do card irmão | editaram o bloco embutido; rodar `IA/tools/check-embeds.sh --fix` |

Commits: inglês, assinados em GPG, autoria exclusiva do dono, sem coautoria.
