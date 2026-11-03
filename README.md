# FC DDD Patterns — Order Repository

Desafio do curso Full Cycle: implementação da camada de infraestrutura do repositório de pedidos (`OrderRepository`) seguindo DDD, validada com testes automatizados.

Baseado no repositório template [devfullcycle/fc-ddd-patterns](https://github.com/devfullcycle/fc-ddd-patterns).

## O que foi implementado

`src/infrastructure/order/repository/sequilize/order.repository.ts` implementa todos os métodos de `OrderRepositoryInterface`:

- `create(order)`: persiste o pedido e seus itens.
- `update(order)`: atualiza o pedido e sincroniza os itens (adiciona, altera e remove) dentro de uma transação.
- `find(id)`: retorna o pedido com seus itens; lança `Order not found` se não existir.
- `findAll()`: retorna todos os pedidos com seus itens.

Os testes ficam em `src/infrastructure/order/repository/sequilize/order.repository.spec.ts`.

## Requisitos

- Node.js 16 ou superior
- npm

O banco usado nos testes é SQLite em memória; não é preciso configurar nada.

## Instalação

```bash
npm install
```

## Rodando os testes

```bash
npm test
```

O comando faz a checagem de tipos com o TypeScript (`tsc --noEmit`) e depois roda o Jest.
