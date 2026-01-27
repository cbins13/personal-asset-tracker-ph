import { Link } from "@tanstack/react-router";
import { ErrorType } from "../../utils/errorMessages";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import type { Transaction } from "../../utils/api";

type Props = {
  title?: string;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  errorType?: ErrorType;
  canRetry: boolean;
  onRetry: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  isDeletingId: string | null;
  getAccountLabel: (transaction: Transaction) => string;
  showViewAll?: boolean;
  showHeaderAdd?: boolean;
  onAddTransaction?: () => void;
  showFooterAdd?: boolean;
};

export default function TransactionsSection({
  title = "Transactions",
  transactions,
  isLoading,
  error,
  errorType,
  canRetry,
  onRetry,
  onEdit,
  onDelete,
  isDeletingId,
  getAccountLabel,
  showViewAll = true,
  showHeaderAdd = false,
  onAddTransaction,
  showFooterAdd = false,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <div className="flex items-center gap-3">
          {showHeaderAdd && onAddTransaction ? (
            <button
              onClick={onAddTransaction}
              className="px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              type="button"
            >
              Add Transaction
            </button>
          ) : null}
          {showViewAll ? (
            <Link to="/transactions" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
              View all
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</p>
        ) : error ? (
          <div
            className={`p-3 rounded-lg ${
              errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
                ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-start justify-between">
              <p
                className={`text-sm font-medium ${
                  errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
                    ? "text-yellow-800 dark:text-yellow-200"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {error}
              </p>
              {canRetry && (
                <button
                  onClick={onRetry}
                  className="ml-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
        ) : (
          transactions.map((tx) => {
            const kind = tx.transactionKind || (tx.type === "credit" ? "income" : tx.type === "debit" ? "expense" : "expense");
            const signedAmount = kind === "income" ? Math.abs(tx.amount) : kind === "transfer" ? tx.amount : -Math.abs(tx.amount);
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between border border-gray-100 dark:border-gray-600 rounded-xl p-4"
              >
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(tx.occurredAt || tx.createdAt)}</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                    {tx.label || tx.categoryLabel || "Transaction"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getAccountLabel(tx)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={[
                      "text-base font-semibold",
                      signedAmount < 0 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                    ].join(" ")}
                  >
                    {signedAmount < 0 ? "-" : ""}
                    {formatCurrency(Math.abs(signedAmount))}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Edit transaction"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5h2a2 2 0 012 2v2m-5 9H6a2 2 0 01-2-2v-6a2 2 0 012-2h2m9.414-1.586a2 2 0 00-2.828 0L9 14.172V17h2.828l6.586-6.586a2 2 0 000-2.828z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="p-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Delete transaction"
                      type="button"
                      disabled={isDeletingId === tx.id}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 7h12m-9 4v6m6-6v6M9 7h6m-7 0h8a1 1 0 011 1v11a1 1 0 01-1 1H8a1 1 0 01-1-1V8a1 1 0 011-1zM10 4h4a1 1 0 011 1v2H9V5a1 1 0 011-1z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {showFooterAdd && onAddTransaction ? (
        <div className="mt-4">
          <button
            onClick={onAddTransaction}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            type="button"
          >
            <span className="text-3xl">+</span>
            <span className="mt-2 text-sm font-medium">Add Transaction</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
