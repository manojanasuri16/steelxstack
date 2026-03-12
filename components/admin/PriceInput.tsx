"use client";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  "₹": "₹",
  $: "$",
  "€": "€",
  "£": "£",
};

interface PriceInputProps {
  value: number | undefined;
  currency: string;
  onChange: (price: number | undefined) => void;
}

export default function PriceInput({ value, currency, onChange }: PriceInputProps) {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-1.5">Price</label>
      <div className="flex items-center bg-dark-700 border border-glass-border rounded-lg overflow-hidden focus-within:border-neon/50 transition-colors">
        <span className="px-3 text-neon font-bold text-sm shrink-0 bg-dark-600 py-2 border-r border-glass-border">
          {symbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, "");
            if (raw === "") {
              onChange(undefined);
            } else {
              const num = parseFloat(raw);
              onChange(isNaN(num) ? undefined : num);
            }
          }}
          placeholder="0"
          className="flex-1 bg-transparent px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
