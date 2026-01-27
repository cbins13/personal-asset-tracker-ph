import { formatCurrency } from "../../utils/formatters";

type Props = {
  netWorthTotal: number;
  isHidden: boolean;
  onToggle: () => void;
};

export default function NetWorthDisplay({ netWorthTotal, isHidden, onToggle }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Net Worth</p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isHidden ? "••••••" : formatCurrency(netWorthTotal)}
        </p>
      </div>
      <button
        onClick={onToggle}
        className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
        aria-label="Toggle net worth visibility"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
    </div>
  );
}
