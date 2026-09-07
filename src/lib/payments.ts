import { toNumber } from "@/lib/format";

type PaymentLike = { amount: unknown };

type InvoicePaymentInput = {
  amount: unknown;
  status: string;
  dueDate: Date | string | null;
  payments: PaymentLike[];
};

export type InvoicePaymentState = {
  total: number;
  paid: number;
  remaining: number;
  isSettled: boolean;
  isPartial: boolean;
  isOverdue: boolean;
  isCredited: boolean;
  isCancelled: boolean;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sum of recorded payments, remaining balance and derived flags for an invoice. */
export function computeInvoicePaymentState(
  invoice: InvoicePaymentInput,
  now: Date = new Date(),
): InvoicePaymentState {
  const total = toNumber(invoice.amount);
  const paid = round2(invoice.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0));
  const remaining = round2(Math.max(0, total - paid));

  const isCredited = invoice.status === "CREDITED";
  const isCancelled = invoice.status === "CANCELLED";
  const isSettled = !isCredited && !isCancelled && (invoice.status === "PAID" || (total > 0 && paid >= total));
  const isPartial = !isSettled && !isCredited && !isCancelled && paid > 0 && paid < total;
  const isOverdue =
    !isSettled &&
    !isCredited &&
    !isCancelled &&
    remaining > 0 &&
    !!invoice.dueDate &&
    new Date(invoice.dueDate) < now;

  return { total, paid, remaining, isSettled, isPartial, isOverdue, isCredited, isCancelled };
}

/** Status shown on badges once payments are taken into account. */
export function effectiveInvoiceStatus(invoice: InvoicePaymentInput, now?: Date): string {
  const state = computeInvoicePaymentState(invoice, now);
  if (state.isCredited) return "CREDITED";
  if (state.isCancelled) return "CANCELLED";
  if (state.isSettled) return "PAID";
  if (state.isOverdue) return "OVERDUE";
  if (state.isPartial) return "PARTIAL";
  return "UNPAID";
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: "Virement",
  CARD: "Carte",
  CASH: "Espèces",
  CHECK: "Chèque",
  OTHER: "Autre",
};
