# Matrículas Check A&R

Página para gestores da FAIFSUL conferirem planilhas de matrícula e pagamento do programa Autonomia e Renda.

Recebe as planilhas no navegador, replica o cruzamento do `Monta_PlanilhaCPF_02_10_26.ipynb` e devolve a Planilha CPF atualizada e a lista de CPFs ausentes. Nada sobe para servidor.

## Privacidade (LGPD)

As planilhas **não saem do computador** de quem abre a página.

- Não há servidor de upload. O site público entrega só HTML, CSS e JavaScript.
- Os arquivos ficam na memória da aba. Recarregar ou fechar a aba apaga a lista.
- Não usamos `localStorage`, cookies de dado, IndexedDB, analytics, Sentry nem fontes da Google.
- Em produção o HTML leva um Content-Security-Policy com `connect-src 'none'`, para o navegador recusar qualquer pedido de rede a partir da página.

Como conferir: abra as DevTools → Network, solte uma planilha e veja que nenhum request carrega o arquivo.

Ao publicar, use hospedagem **só estática** (GitHub Pages, Cloudflare Pages, pasta num servidor interno). Desligue scripts de analytics que o provedor queira injetar.

## Página pública

https://matheuscfrade.github.io/matriculas-check-ar/

O GitHub Actions gera o site estático. Planilhas, testes (`*.test.ts`) e notebooks **não entram no repositório**.

## Como rodar localmente

```powershell
npm install
npm run dev
npm test
npm run build
```

Os testes ficam só na sua máquina (estão no `.gitignore`).

## Arquivos de entrada

O nome do arquivo define o papel (como no notebook):

- `IFPE_LancamentosGestorFinanceiro.xlsx` (e os demais IFs do notebook: IFES, IFF, IFMG, IFPE, IFPR, IFSP) — extrato Conveniar. `IFSUL_Lancamentos…` pode ir na lista; esta rodada não entra no cruzamento.
- `Docentes e Equipe.xlsx` — CPFs a excluir (opcional)
- `matriculados_sistema.xlsx` — inscrições
- `Planilha CPF antiga.xlsx` — base a atualizar
- `Matriculados.xlsx` — export do Google Sheet Matriculados. Se o arquivo tiver várias abas, o cruzamento usa **Matrículas Consolidadas**. Sem esse arquivo o botão Cruzar fica desabilitado.

Saídas (download local): `PlanilhaCPF.xlsx` e `CPFs_ausentes.xlsx`.

Limites: 30 arquivos, 30 MB cada, só Excel e CSV. O cruzamento roda na memória da aba. Planilhas `.xlsx` usam a primeira aba, exceto Matriculados, que prefere **Matrículas Consolidadas**.
