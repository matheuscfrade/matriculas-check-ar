# Matrículas Check A&R

Página para gestores da FAIFSUL conferirem planilhas de matrícula e pagamento do programa Autonomia e Renda.

Recebe as planilhas no navegador, replica o cruzamento do `Monta_PlanilhaCPF.ipynb` e devolve a Planilha CPF atualizada e a lista de CPFs ausentes. Nada sobe para servidor.

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

O GitHub Actions gera o site estático e roda os testes. Planilhas e notebooks **não entram no repositório**.

## Como rodar localmente

```powershell
npm install
npm run dev
npm test
npm run build
```

## Arquivos de entrada

Há um espaço para cada arquivo. O nome ajuda a conferir se o arquivo caiu no lugar certo:

- Um espaço por IF (IFES, IFF, IFMG, IFPE, IFPR, IFSP) para `IF…_LancamentosGestorFinanceiro.xlsx`. Basta os IFs da conferência. Para incluir outro instituto no futuro, acrescenta-se um espaço.
- `Docentes e Equipe.xlsx` — CPFs a excluir (opcional)
- `matriculados_sistema.xlsx` — matrículas do sistema de inscrições
- `inscricoes-geral.csv` — inscrições geral, para ID e edital dos CPFs ausentes
- `Planilha CPF antiga.xlsx` — base a atualizar
- `Matriculados.xlsx` — export do Google Sheet Matriculados. Se o arquivo tiver várias abas, o cruzamento usa **Matrículas Consolidadas**. Sem esse arquivo o botão Cruzar fica desabilitado.

O cruzamento preserva CPFs de editais 2024 que voltaram em edital posterior, atualiza situação e status final dos IDs finalizados na Matriculados, e devolve os CPFs ausentes com possíveis IDs e editais.

Saídas (download local): `PlanilhaCPF.xlsx` e `CPFs_ausentes.xlsx`.

Limites: 30 arquivos, 30 MB cada, só `.xlsx` e `.csv` (salve `.xls` antigo como `.xlsx` ou CSV). O cruzamento roda na memória da aba. Planilhas `.xlsx` usam a primeira aba, exceto Matriculados, que prefere **Matrículas Consolidadas**.
