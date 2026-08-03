# MW HA Power Button Card

Card Lovelace `custom:power-button-card` — botão de tomada estilo **papel/neumórfico**
com Voltagem, Corrente e Potência, toggle liga/desliga (bloqueável via `control`),
marca d'água de integração (Tuya/Tapo/Custom), ícone animável e ícone de protocolo.
Port do template button-card `tomada_energia_papel_v6`, agora com **editor visual
completo** (todas as propriedades editáveis pela UI).

## Instalação (HACS)

1. HACS → ⋮ → **Repositórios personalizados** → URL
   `https://github.com/visaodeempresa/mw-ha-power-button-card` → tipo **Dashboard**.
2. Instalar **MW HA Power Button Card** → recarregar o navegador.

## Uso

```yaml
type: custom:power-button-card
entity: switch.microondas_microondas
name: MICROONDAS
device_icon: mdi:microwave
background_image_url: https://raw.githubusercontent.com/mayconsoftware/mayconsoftware.github.io/refs/heads/main/assets/devices/ha-integration/ha-integration-tuya.png
background_transparent: 0.08
sensor_voltagem: sensor.microondas_voltagem
sensor_corrente: sensor.microondas_corrente
sensor_potencia: sensor.microondas_potencia
animate: false
control: true
protocol_icon: mdi:wifi
```

## Propriedades

| Propriedade | Tipo | Default | Descrição |
|---|---|---|---|
| `entity` | switch | — | tomada (obrigatório) |
| `name` | texto | friendly_name | nome exibido |
| `device_icon` | ícone mdi | "" | ícone do aparelho (picker no editor) |
| `image_url` | URL | "" | imagem do aparelho (substitui o ícone) |
| `background_image_url` | URL | "" | marca d'água (editor: Tuya/Tapo/Custom) |
| `background_transparent` | 0–1 | 0.12 | opacidade da marca d'água |
| `sensor_voltagem` / `sensor_corrente` / `sensor_potencia` | sensor | "" | linhas V/A/W (clicáveis → more-info). No editor, os três selects mostram **só os sensores da tomada selecionada** |
| `only_power` | bool | false | **Somente Potência**: esconde corrente e tensão e mostra a potência em número grande |
| `power_font_size` | px | 34 | tamanho do número no modo Somente Potência (o ícone e a unidade acompanham) |
| `color_power_on` / `color_power_off` | cor | `#7a4b00` / `#f0b429` | cor do número grande com a tomada ligada / desligada |
| `animate` | bool | false | gira o ícone quando ligado |
| `control` | bool | true | false = toggle travado (ex.: geladeira) |
| `haptic` | bool | `true` | vibra ao encostar no card (pulso curto no toque, mais forte quando o hold vira more-info); no app companion usa o motor nativo, no navegador cai no `navigator.vibrate` — o Safari do iPhone não vibra fora do app |
| `confirm` | bool | `false` | pergunta antes de ligar/desligar a tomada; o hold/more-info e as linhas de sensor não pedem nada |
| `confirm_text` | texto | `Tem certeza que quer {acao} {nome}?` | mensagem da confirmação — `{nome}` vira o nome (ou o `friendly_name`) e `{acao}` vira *ligar*/*desligar* conforme o estado |
| `only_power_lift` | px | 6 | sobe o nome e a potência no modo Somente Potência (negativo desce) |
| `protocol_icon` | wifi/zigbee/bluetooth/z-wave | "" | selinho de protocolo |
| `protocol_color_on` / `protocol_color_off` | cor | (do tema) | cores do selinho — vazio usa o par do template |
| `protocol_offset_x` / `protocol_offset_y` | px | 10 / 10 | distância do selinho até a borda direita / inferior; **aumentar empurra para dentro** (esquerda e cima), negativo joga para fora |
| `color_on_*` / `color_off_*` / `color_unavail_*` / `color_unknown_*` | cor | (tema papel) | cores por estado (12 campos, seção avançada do editor) |
| `paper_color` | `paper` ou `<cor>-<1..7>` | `paper` | cor do papel quando ligado — 49 tons encardidos (7 matizes do arco-íris × 7 tons) + o creme original |

### Paleta de papel encardido (`paper_color`)

`paper` = creme original (`#fdfaf3 → #e8e3d8`). As outras 49 seguem
`<matiz>-<tom>`, com matiz em `red`, `orange`, `yellow`, `green`, `blue`,
`indigo`, `violet` e tom de `1` (quase branco) a `7` (mais encardido) — ex.:
`green-5`, `indigo-7`. Saturação baixa de propósito: papel encardido cansa
menos a vista que branco puro. Mesma paleta do card irmão
[simple-button-card](https://github.com/visaodeempresa/mw-ha-simple-button-card);
fonte canônica em `IA/lib/paper-palette/paper-palette.js`.

### Somente Potência (`only_power`)

```yaml
type: custom:power-button-card
entity: switch.tomada_do_rack_tv_01
sensor_potencia: sensor.tomada_do_rack_tv_01_potencia
only_power: true
power_font_size: 40      # opcional
```

Some com as linhas de corrente e tensão e desenha a potência em destaque:
**no máximo 1 casa decimal** e **no máximo 4 dígitos** na parte inteira —
passou de `9999`, o número sobe de degrau (`12345 W` vira `12,3 kW`) em vez de
esticar e estourar a largura do card. O número usa `tabular-nums`, então não
"dança" a cada leitura do sensor, e a unidade fica menor, ao lado.

As cores padrão foram escolhidas para o papel: âmbar escuro (`#7a4b00`) sobre
o creme quando ligada — legível e no mesmo tom quente do card — e âmbar claro
(`#f0b429`) quando desligada, harmonizando com o dourado que os ícones já usam
nesse estado. As duas ficam na seção **Cores** do editor.

Sem as linhas de V/A o bloco sobra baixo no card, então nome e potência sobem
`only_power_lift` px (6 por padrão, campo aberto no editor — negativo desce).
A subida é `transform`, não margem: não mexe na grade nem no tamanho do número.

Com o flag ligado, o editor também esconde os selects de tensão e corrente —
mas **não apaga** o que estava configurado: desligar o flag traz as duas linhas
de volta como estavam.

### Selinho de protocolo

`protocol_offset_x` / `protocol_offset_y` (10 px cada) medem a distância até a
borda **direita** e **inferior** — aumentar empurra o ícone para dentro do
card, diminuir (ou usar negativo) joga para fora. Os dois campos aparecem no
editor assim que um protocolo é escolhido.

`protocol_color_on` e `protocol_color_off` agora pintam de verdade: vazias,
valem as do template original (grafite sobre o papel, branco apagado no
desligado); preenchidas na seção **Cores**, mandam elas.

Interações: **hold** = more-info da tomada · toque nas linhas V/A/W (ou no
número grande) = more-info do sensor · toggle liga/desliga.

### Tomada offline

Quando a tomada cai, os sensores dela caem junto — e o card mostrava
`unavailable` no lugar de cada leitura (em 34 px, no modo Somente Potência).
Agora V, A e W viram **travessão** (`—`, sem unidade pendurada): o selo
**OFFLINE** no topo já diz o que aconteceu, e a linha continua ocupando o
lugar dela na grade, então o card não muda de forma quando o aparelho volta.
O travessão vale por sensor — um sensor caído sozinho não apaga os outros dois.

A **marca d'água** e o **selinho de protocolo** continuam desenhados quando
estão configurados, e agora legíveis: sobre o fundo vinho do estado offline a
marca ganha `brightness(1.8)` junto do cinza (sem isso ela sumia), e o selinho
sobe de 25% para 45% de branco. `protocol_color_off`, quando preenchida, manda
também no offline.

## Desenvolvimento

```bash
node --check dist/power-button-card.js && node tools/probe.js
```

O probe instancia card e editor fora do navegador (47 verificações: grade,
formatação da potência, filtro dos selects, defaults fora do YAML, estado
offline) e roda no CI antes de qualquer release.
