# Sistema de Mock API para Pandora 3.2

Este diretório contém a configuração e implementação do sistema de mocks para a aplicação Pandora 3.2, permitindo o desenvolvimento frontend sem dependência de um backend real.

## Estrutura

- `/api` - Contém os handlers e configuração do Mock Service Worker (MSW)
  - `handlers.js` - Definição dos interceptadores de requisições HTTP
  - `browser.js` - Configuração do MSW para ambiente de navegador
  - `index.js` - Exporta as funcionalidades do MSW e função de inicialização

## Como Funciona

O Mock Service Worker (MSW) é utilizado para interceptar requisições HTTP feitas pela aplicação e retornar respostas simuladas, permitindo o desenvolvimento completo do frontend sem depender de um backend em funcionamento.

### Ativação dos Mocks

Os mocks são ativados automaticamente durante o desenvolvimento quando:

1. A aplicação está rodando em ambiente de desenvolvimento (`import.meta.env.DEV` é verdadeiro)
2. A variável de ambiente `VITE_USE_REAL_API` está configurada como `false`

### Configuração

A configuração dos mocks está definida em `.env`:

```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_USE_REAL_API=false
```

Para usar a API real em desenvolvimento, mude `VITE_USE_REAL_API` para `true`.

## Adicionando Novos Mocks

Para adicionar novos handlers à API mock:

1. Adicione o novo handler em `api/handlers.js`
2. Implemente a lógica de resposta para as rotas específicas

Exemplo:

```javascript
rest.get('/api/novos-dados', (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({
      dados: [
        { id: 1, nome: 'Item 1' },
        { id: 2, nome: 'Item 2' }
      ]
    })
  );
})
```

## Dados de Exemplo

Os dados de exemplo são definidos nos handlers e podem ser modificados para testar diferentes cenários. Os mocks incluem suporte para:

- Status do sistema e desempenho
- Logs de atividades
- Dados analíticos
- Estatísticas de contas e conversas
- Histórico de status

## Testes

O MSW também pode ser utilizado para testes, permitindo simular diferentes respostas da API em ambientes de teste.
