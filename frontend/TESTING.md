# Guia de Testes - Pandora 3.2 Frontend

Este documento descreve a estrutura de testes implementada no frontend da Pandora 3.2, incluindo configuração, ferramentas, padrões e boas práticas.

## Visão Geral

A estrutura de testes do frontend usa:

- **Vitest**: Framework de testes baseado no Vite, oferecendo execução rápida e integração com o ambiente de desenvolvimento
- **React Testing Library (RTL)**: Biblioteca para testar componentes React de uma maneira centrada no usuário
- **MSW (Mock Service Worker)**: Biblioteca para interceptar e simular requisições de API em testes
- **Axios Mock Adapter**: Para testes específicos de integração com axios

## Estrutura de Arquivos

```
frontend/
├── src/
│   ├── tests/
│   │   └── setup.js            # Configuração global de testes
│   ├── components/
│   │   ├── common/
│   │   │   └── __tests__/      # Testes para componentes comuns
│   │   └── dashboard/
│   │       └── __tests__/      # Testes para componentes do dashboard
│   ├── hooks/
│   │   └── __tests__/          # Testes para hooks personalizados
│   ├── mocks/
│   │   └── __tests__/          # Testes para garantir que os mocks funcionam corretamente
│   └── services/
│       └── __tests__/          # Testes para serviços de API
├── vitest.config.js            # Configuração do Vitest
└── TESTING.md                  # Esta documentação
```

## Executando os Testes

Os seguintes scripts estão disponíveis no `package.json`:

```bash
# Executa todos os testes uma vez
npm run test

# Executa os testes em modo watch (reexecutando a cada alteração)
npm run test:watch

# Executa os testes com geração de relatório de cobertura
npm run test:coverage

# Inicia a interface visual do Vitest (necessário vitest/ui instalado)
npm run test:ui
```

## Padrões de Testes

### 1. Testes de Componentes

Utilizamos a abordagem de testes centrados no usuário com React Testing Library. Exemplo:

```javascript
// Verifica se o componente renderiza corretamente
it('deve renderizar o botão com o texto correto', () => {
  render(<Button>Clique Aqui</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Clique Aqui');
});

// Verifica interações do usuário
it('deve chamar o callback quando clicado', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Clique Aqui</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 2. Testes de Hooks

Testamos hooks com `renderHook` da RTL, verificando estados e comportamentos:

```javascript
it('deve retornar o valor inicial e função de atualização', () => {
  const { result } = renderHook(() => useCounter(0));
  expect(result.current.count).toBe(0);
  expect(typeof result.current.increment).toBe('function');
});

it('deve incrementar o contador quando a função é chamada', () => {
  const { result } = renderHook(() => useCounter(0));
  act(() => {
    result.current.increment();
  });
  expect(result.current.count).toBe(1);
});
```

### 3. Testes de Integração com API

Utilizamos MSW para simular endpoints da API:

```javascript
it('deve buscar dados da API corretamente', async () => {
  server.use(
    rest.get('/api/data', (req, res, ctx) => {
      return res(ctx.json({ success: true, data: [1, 2, 3] }));
    })
  );
  
  const { result } = renderHook(() => useData());
  
  // Aguarda a requisição completar
  await waitFor(() => expect(result.current.loading).toBe(false));
  
  // Verifica os dados
  expect(result.current.data).toEqual([1, 2, 3]);
});
```

## Simulação de API com MSW

O Mock Service Worker (MSW) é usado para simular respostas de API durante os testes. A configuração está em `src/tests/setup.js` e os handlers de API em `src/mocks/api/handlers.js`.

Benefícios:
- Isola testes do backend real
- Permite testar cenários difíceis (erros, latência)
- Proporciona ambiente de teste consistente

## Cobertura de Código

Executamos `npm run test:coverage` para gerar relatórios de cobertura. O relatório é gerado na pasta `coverage/` e inclui:

- Statements (declarações)
- Branches (ramificações)
- Functions (funções)
- Lines (linhas)

Áreas prioritárias para cobertura:
1. Hooks personalizados
2. Utilitários
3. Componentes críticos 
4. Lógica de manipulação de erro

## Boas Práticas

1. **Teste comportamento, não implementação**: Foque em como o usuário interage com o componente.
2. **Evite testar detalhes de implementação**: Teste o que o componente faz, não como faz.
3. **Maximize o uso de `getByRole` e `getByText`**: São os métodos mais resilientes da RTL.
4. **Evite consultas por data-testid**: Use apenas quando necessário para elementos sem função semântica.
5. **Mantenha testes independentes**: Cada teste deve ser autocontido e não depender de outros.
6. **Use mocks apropriados**: Mock apenas o necessário, evite over-mocking.
7. **Teste edge cases**: Considere casos de erro, valores vazios, etc.

## Troubleshooting

### Problema: Testes falham com erro de timeout
**Solução**: Aumente o tempo limite nas configurações do Vitest ou verifique processos assíncronos bloqueantes.

### Problema: Testes de componentes falham após updates do React
**Solução**: Verifique se está testando comportamentos em vez de implementações específicas.

### Problema: Mocks não funcionam como esperado
**Solução**: Verifique a ordem dos mocks e use `vi.resetAllMocks()` entre testes.

---

Para qualquer dúvida ou sugestão, consulte a documentação das ferramentas:
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Mock Service Worker](https://mswjs.io/docs/)
