# roteiros

Repositório para publicar roteiros de viagem.

## Natal na Europa — 11/12/2026 a 02/01/2027

Site estático com o roteiro completo: 23 dias, 7 bases, 8 pessoas.
Oito telas — visão geral, cidades, meu dia, timeline, falta comprar,
financeiro, prático e roteiro completo — com busca, contagem regressiva
e checklist salvo no navegador.

HTML, CSS e JavaScript puros. Sem build, sem dependências.

### Rodar localmente

O site usa módulos ES, então precisa de um servidor http — abrir o arquivo
por `file://` não funciona (a página avisa se isso acontecer).

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

No VS Code, a extensão **Live Server** (botão "Go Live") também serve.

### Publicar no GitHub Pages

Settings → Pages → Source: `Deploy from a branch` → branch `main`, pasta `/ (root)`.
Não há etapa de build: os arquivos são servidos como estão.

### Estrutura

| Arquivo | Papel |
| --- | --- |
| `index.html` | Estrutura da página: menu, busca e os contêineres que o JS preenche |
| `styles.css` | Todo o visual |
| `app.js` | Estado, rotas (`#/tela/parametro`), telas e interações |
| `roteiro-data.js` | **Todo o conteúdo do roteiro** — é aqui que se edita a viagem |
| `fotos/` | Imagens usadas nos cards |

Para trocar ou acrescentar uma foto: coloque o arquivo em `fotos/` e
adicione a chave correspondente no mapa `PHOTOS`, no topo de `app.js`.

`Roteiro-Europa-Completo.md` é o documento de origem, mantido como referência.
