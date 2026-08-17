-- 025: WhatsApp de suporte editável no painel admin.
-- Número em formato E.164 (só dígitos, ex.: 5511999999999), usado pelo
-- balão de suporte para montar o link https://wa.me/<numero>.
alter table config_pagamentos
  add column if not exists whatsapp_suporte text;