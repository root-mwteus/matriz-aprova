-- ============================================================
-- 029 — InfinitePay no lugar do Mercado Pago
-- ============================================================
-- O Checkout Integrado da InfinitePay usa `order_nsu` (id do pedido que
-- o servidor gera e grava no checkout) e `transaction_nsu` (id único da
-- transação, chave de dedupe do webhook). Os nomes `mp_*` deixam de
-- fazer sentido com o provedor trocado.

ALTER TABLE public.pagamentos
  RENAME COLUMN mp_preference_id TO order_nsu;

-- O UNIQUE de mp_payment_id segue valendo na coluna renomeada: vira a
-- garantia de que um mesmo `transaction_nsu` não promove duas vezes.
ALTER TABLE public.pagamentos
  RENAME COLUMN mp_payment_id TO transaction_nsu;