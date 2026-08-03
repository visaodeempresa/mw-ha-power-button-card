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
| "Mergeei e a feature não apareceu na release" | commits empurrados para a branch depois do merge do PR — órfãos, sem PR | branch nova a cada lote |
| Linhas V/A/W somem | `sensor_*` apontando para entidade inexistente — `_st()` devolve null |
| Paleta divergindo do card irmão | editaram o bloco embutido; rodar `IA/tools/check-embeds.sh --fix` |
| Sensor configurado sumiu do YAML sozinho | `_onChange` monta o config só com o que está no `ha-form`; campo escondido pelo esquema (ex.: tensão com `only_power` ligado) não vem no evento — o loop de preservação em `_onChange` existe por isso, não remover |
| Select de V/A/W listando a casa inteira | `_sensorSel()` sem `hass` (chegou depois do `setConfig`) — o `set hass` reconstrói o esquema justamente para isso |
| Número da potência "dançando" a cada leitura | fonte sem `tabular-nums` |
| Cor do protocolo "não funciona" | até a v0.4.0 o render ignorava `protocol_color_on` e usava grafite fixo — corrigido; se voltar a não valer, é regressão aqui |
| Selinho de protocolo colado no canto | `protocol_offset_x`/`_y` medem a distância até a borda direita/inferior: **aumentar empurra para dentro** |
| Nome/potência baixos no Somente Potência | `only_power_lift` (6 px por padrão) sobe os dois; é `transform`, não margem |
| Potência estourando a largura | acima de 9999 tem que subir de degrau (W → kW), não esticar |
| "unavailable" escrito no card | sensor caído junto com a tomada — `noReading()` troca por `—`; se voltar a aparecer, alguém mexeu no `row()`/`bigPower()` |
| Marca d'água some com a tomada offline | `grayscale(100%)` puro sobre o fundo vinho não tem contraste — precisa do `brightness(1.8)` junto (mesmo tratamento do desligado) |
| Selinho de protocolo invisível offline | branco a 25% (fallback do desligado) morre no vinho — offline usa 45% |

Commits: inglês, assinados em GPG, autoria exclusiva do dono, sem coautoria.
