"use client";

import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyPrecise } from "@/lib/format";

export type LineItemDraft = {
  description: string;
  quantity: string;
  unitPrice: string;
};

const EMPTY_ROW: LineItemDraft = { description: "", quantity: "1", unitPrice: "" };

export function LineItemsEditor({
  initialItems,
  vatEnabled,
  vatRate,
}: {
  initialItems?: LineItemDraft[];
  vatEnabled: boolean;
  vatRate: number;
}) {
  const [items, setItems] = useState<LineItemDraft[]>(
    initialItems && initialItems.length > 0 ? initialItems : [EMPTY_ROW],
  );
  const fieldId = useId();

  function updateItem(index: number, patch: Partial<LineItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  const vatAmount = vatEnabled ? subtotal * (vatRate / 100) : 0;
  const total = subtotal + vatAmount;

  return (
    <div className="space-y-3 sm:col-span-2">
      <input type="hidden" name="lineItems" value={JSON.stringify(items)} />
      <Label>Lignes *</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_5rem_6rem_2rem] items-end gap-2">
            <div className="space-y-1">
              {index === 0 && <Label htmlFor={`${fieldId}-desc-0`} className="text-xs text-muted-foreground">Description</Label>}
              <Input
                id={`${fieldId}-desc-${index}`}
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Ex : Développement d'une page"
              />
            </div>
            <div className="space-y-1">
              {index === 0 && <Label htmlFor={`${fieldId}-qty-0`} className="text-xs text-muted-foreground">Qté</Label>}
              <Input
                id={`${fieldId}-qty-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              {index === 0 && <Label htmlFor={`${fieldId}-price-0`} className="text-xs text-muted-foreground">Prix U. (€)</Label>}
              <Input
                id={`${fieldId}-price-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={item.unitPrice}
                onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={items.length === 1}
              onClick={() => removeItem(index)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="size-3.5" /> Ajouter une ligne
      </Button>

      <div className="ml-auto max-w-xs space-y-1 border-t pt-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sous-total HT</span>
          <span>{formatCurrencyPrecise(subtotal)}</span>
        </div>
        {vatEnabled && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA ({vatRate}%)</span>
            <span>{formatCurrencyPrecise(vatAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium">
          <span>Total {vatEnabled ? "TTC" : ""}</span>
          <span>{formatCurrencyPrecise(total)}</span>
        </div>
      </div>
    </div>
  );
}
