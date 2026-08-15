# HISTÓRICO — mw-ha-power-button-card

## 2026-08-15 — presets Tuya/Tapo servidos pelo site (feature/preset-urls-pages)
- Escolher **Tuya** ou **Tapo** no editor agora grava
  `https://mayconsoftware.github.io/assets/devices/ha-integration/ha-integration-{tuya,tapo}.png`
  — mesmo host da logo da marca (regra global 70), em vez do
  `raw.githubusercontent.com/...` que servia a imagem como `text/plain`.
- **Nada quebra para quem já usa**: `migrateBg()` reescreve os dois endereços
  antigos para os novos ao ler a configuração, no card e no editor. Sem isso o
  editor mostraria «Custom» num card que o dono configurou como Tuya e a tela
  ficaria presa no host antigo. URL de terceiro (Custom) passa intacta.
- A migração é só em memória: o YAML salvo só muda quando o dono mexer no
  card — abrir o editor não reescreve dashboard nenhum sozinho.
- Nenhuma propriedade nova. Probe: 9 checks novos (56 no total).

## 2026-08-02 — tomada offline com cara de tomada (feature/offline-readings-and-branding)
- Sintoma: com a tomada caída, o card escrevia `unavailable` no lugar de cada
  leitura — em 34 px no modo Somente Potência — e a identidade do aparelho
  (marca d'água + selinho) sumia no fundo vinho do estado offline.
- `noReading()` (`unavailable`/`unknown`/`none`/vazio/nulo) troca o valor por
  travessão `—`, **por sensor**: um sensor caído sozinho não apaga os outros.
  No número grande, a unidade também some — "— W" sugere um valor que não há.
  A linha continua ocupando o lugar na grade, então o card não muda de forma
  quando o aparelho volta.
- Marca d'água offline: `grayscale(100%)` + `brightness(1.8)` (o mesmo
  tratamento do desligado). Só o cinza puro não tinha contraste nenhum contra
  `color_unavail_bg` (vinho escuro) e a logo simplesmente não aparecia.
- Selinho de protocolo offline: fallback de branco 25% → 45%.
  `protocol_color_off` preenchida continua mandando, inclusive offline.
- Nenhuma propriedade nova: nada muda no YAML de quem já usa o card.
- Probe: 11 checks novos de estado offline (47 no total).

## 2026-07-31 — bloco `touch-feedback v1` (compartilhado)
- `haptic()` + `confirmAction()` saíram de código solto e viraram bloco entre
  marcadores `>>> touch-feedback v1` / `<<< touch-feedback v1`, mesmo regime da
  paper-palette: fonte canônica em `IA/lib/touch-feedback/touch-feedback.js`,
  cópia idêntica nos dois cards, conferida por `IA/tools/check-embeds.sh`.
- Única mudança de código: o bloco lia `DEFAULTS.confirm_text` do card
  hospedeiro. Agora carrega o próprio `CONFIRM_FALLBACK` e não depende de nada
  de fora — o card só precisa oferecer as chaves `haptic`/`confirm`/
  `confirm_text`. Comportamento idêntico (o `DEFAULTS.confirm_text` segue
  sendo o que chega em `tpl`; a reserva só entra se o texto vier vazio).
- Nenhuma propriedade nova, nenhuma mudança visual: propriedades intactas.
  Probe em jsdom rodado de novo nos dois cards, 13 checks cada.

## 2026-07-31 — feedback táctil + confirmação (feature/haptic-and-confirmation)
- `haptic` (default `true`): pulso `light` no `pointerdown` da `ha-card` e
  `medium` quando o hold de 500 ms vira more-info. A vibração fica na
  `ha-card` de propósito — o toggle e as linhas de sensor estão dentro dela e
  só param a propagação do `click`, não do press, então um toque em qualquer
  parte do card dá retorno uma vez só.
- Ponte: evento `haptic` na `window` (mesmo canal que o frontend do HA usa
  para falar com o app companion); fora do companion cai no
  `navigator.vibrate`, dentro não — senão vibraria duas vezes.
- `confirm` (default `false`) + `confirm_text` já sugerido
  (`Tem certeza que quer {acao} {nome}?`): pergunta antes de mexer na tomada.
  Diálogo próprio no `document.body` (dentro do shadow root o card cortaria o
  modal) e **não** `window.confirm`, que o WebView do companion pode engolir.
  Fecha por Confirmar/Cancelar, Esc, Enter ou clique no fundo.
- O bloco `haptic` + `confirmAction` é **byte a byte igual** ao do
  simple-button-card — candidato a virar bloco compartilhado em `IA/lib/`,
  como a paper-palette.
- Probe em jsdom: 13 checks + hold (light/medium, more-info, sem toggle).


## 2026-07-31 — paleta de papel encardido (feature/paper-palette)
- `paper_color`: 49 tons de papel encardido (7 matizes do arco-íris × 7 tons,
  HSL com saturação 6–24% e luminosidade 97→85) + o creme original `paper`.
  Bloco `paper-palette v1` embutido entre marcadores, idêntico ao do
  simple-button-card; fonte canônica em `IA/lib/paper-palette/`.
  Verificação: `IA/tools/check-embeds.sh`.
- Corrigido o mesmo bug do irmão no `auto-release.yml`: o `sed` procurava
  `%c v0.1.2` e o banner nunca teve o `v` — a versão dentro do JS nunca era
  sincronizada. Agora casa e o job falha se não sincronizar.

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

## 2026-07-17 — Auto Release (DevOps)
- `.github/workflows/auto-release.yml`: push na main (dist/hacs) → bump
  semântico pelos commits (BREAKING=major, feat=minor, resto=patch) →
  versão gravada no JS (commit do bot, `[skip release]`) → tag → Release
  com asset e notas geradas → notificação HACS no HA. release.yml segue
  como fallback p/ tag manual.
