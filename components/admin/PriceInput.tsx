"use client";

const CURRENCIES = [
  { symbol: "₹", label: "₹ INR" },
  { symbol: "$", label: "$ USD" },
  { symbol: "€", label: "€ EUR" },
  { symbol: "£", label: "£ GBP" },
];

interface PriceInputProps {
  value: number | undefined;
  currency: string;
  onChange: (price: number | undefined) => void;
  onCurrencyChange: (currency: string) => void;
}

export default function PriceInput({ value, currency, onChange, onCurrencyChange }: PriceInputProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-1.5">Price</label>
      <div className="flex items-center bg-dark-700 border border-glass-border rounded-lg overflow-hidden focus-within:border-neon/50 transition-colors">
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="bg-dark-600 text-neon font-bold text-sm px-2 py-2 border-r border-glass-border focus:outline-none cursor-pointer appearance-none text-center w-12 shrink-0"
        >
          {CURRENCIES.map((c) => (
            <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
          ))}
        </select>
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
