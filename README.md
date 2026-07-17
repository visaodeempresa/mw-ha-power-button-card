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
| `sensor_voltagem` / `sensor_corrente` / `sensor_potencia` | sensor | "" | linhas V/A/W (clicáveis → more-info) |
| `animate` | bool | false | gira o ícone quando ligado |
| `control` | bool | true | false = toggle travado (ex.: geladeira) |
| `protocol_icon` | wifi/zigbee/bluetooth/z-wave | "" | selinho de protocolo |
| `protocol_color_on` / `protocol_color_off` | cor | — | cores do selinho |
| `color_on_*` / `color_off_*` / `color_unavail_*` / `color_unknown_*` | cor | (tema papel) | cores por estado (12 campos, seção avançada do editor) |

Interações: **hold** = more-info da tomada · toque nas linhas V/A/W = more-info do sensor · toggle liga/desliga.
