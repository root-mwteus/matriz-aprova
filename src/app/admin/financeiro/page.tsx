"use client"

import { motion } from "framer-motion"

export default function AdminFinanceiroPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Financeiro</h1>

      <div className="flex flex-col items-center justify-center py-24 text-center bg-CARD border border-[#2A2A2A] rounded-card">
        <span className="text-5xl mb-4">💳</span>
        <p className="text-sm text-foreground font-medium">Sistema de pagamentos ainda não implementado</p>
        <p className="text-xs text-muted mt-2 max-w-sm">
          Receita, assinaturas, churn e reembolsos vão aparecer aqui assim que um gateway de pagamento
          (Stripe, Mercado Pago, Pagar.me ou Asaas) for integrado.
        </p>
      </div>
    </motion.div>
  )
}
