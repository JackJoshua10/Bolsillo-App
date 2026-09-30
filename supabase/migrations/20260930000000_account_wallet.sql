-- Billetera digital vinculada a una cuenta bancaria (se muestra como "BCP · Yape").
-- Ver docs/03-modelo-de-datos.md → "Yape y Plin".
alter table public.accounts
  add column wallet text check (wallet in ('yape', 'plin'));

alter table public.accounts
  add constraint accounts_wallet_only_bank check (wallet is null or type = 'bank');
