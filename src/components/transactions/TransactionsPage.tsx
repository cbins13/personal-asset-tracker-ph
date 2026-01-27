import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { transactionsApi, type Transaction } from "../../utils/api";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";
import { useTransactions } from "../../hooks/useTransactions";
import { ErrorType } from "../../utils/errorMessages";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { sanitizeText } from "../../utils/sanitize";
import AnimatedContentWrapper from "../../effects/AnimatedContentWrapper";
import AddTransactionModal, { type AddTransactionPayload } from "./AddTransactionModal";

type TransactionKind = "expense" | "income" | "installment" | "transfer";

const filters: { id: "all" | TransactionKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "installment", label: "Installment" },
  { id: "transfer", label: "Transfer" },
];

const getTransactionKind = (tx: Transaction): TransactionKind => {
  if (tx.transactionKind) return tx.transactionKind;
  if (tx.type === "credit") return "income";
  if (tx.type === "debit") return "expense";
  return "expense";
};

export default function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | TransactionKind>("all");
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isDeletingTransactionId, setIsDeletingTransactionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorType, setActionErrorType] = useState<ErrorType | undefined>();
  const [actionCanRetry, setActionCanRetry] = useState(false);
  const {
    transactions,
    isLoading,
    error,
    errorType,
    canRetry,
    refresh: refreshTransactions,
  } = useTransactions({ includeAccounts: true });
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const displayError = actionError || error;
  const displayErrorType = actionError ? actionErrorType : errorType;
  const displayCanRetry = actionError ? actionCanRetry : canRetry;

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "all") return transactions;
    return transactions.filter((tx) => getTransactionKind(tx) === activeFilter);
  }, [transactions, activeFilter]);

  const getAccountLabel = (tx: Transaction) => {
    if (getTransactionKind(tx) === "transfer") {
      const fromName = tx.fromAccount?.accountName || tx.fromAccountId || "Source";
      const toName = tx.toAccount?.accountName || tx.toAccountId || "Destination";
      return sanitizeText(`${fromName} → ${toName}`);
    }
    return sanitizeText(tx.account?.accountName || tx.accountId || "Account");
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsEditTransactionOpen(true);
  };

  const handleUpdateTransaction = async (transactionId: string, payload: AddTransactionPayload) => {
    const response = await transactionsApi.update(transactionId, payload);
    if (!response.success) {
      throw new Error(response.error || "Failed to update transaction.");
    }
    setIsEditTransactionOpen(false);
    setTransactionToEdit(null);
    await refreshTransactions();
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("Delete this transaction? This will update account balances.")) {
      return;
    }
    setIsDeletingTransactionId(transactionId);
    const response = await transactionsApi.delete(transactionId);
    if (!response.success) {
      setActionError(response.error || "Failed to delete transaction.");
      setActionErrorType(response.errorType);
      setActionCanRetry(response.canRetry || false);
    } else {
      setActionError(null);
      setActionErrorType(undefined);
      setActionCanRetry(false);
      await refreshTransactions();
    }
    setIsDeletingTransactionId(null);
  };

  const handleRetry = () => {
    setActionError(null);
    setActionErrorType(undefined);
    setActionCanRetry(false);
    refreshTransactions();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-3">
              <Link
                to="/dashboard"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Back to dashboard"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Transactions</h1>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto w-full">
          <AnimatedContentWrapper delay={0.05} duration={0.8}>
            <div className="flex gap-2 flex-wrap mb-6">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-medium border",
                    activeFilter === filter.id
                      ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              {isLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</p>
              ) : displayError ? (
                <div className={`p-3 rounded-lg ${
                  displayErrorType === ErrorType.NETWORK || displayErrorType === ErrorType.SERVER
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start justify-between">
                    <p className={`text-sm font-medium ${
                      displayErrorType === ErrorType.NETWORK || displayErrorType === ErrorType.SERVER
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {displayError}
                    </p>
                    {displayCanRetry && (
                      <button
                        onClick={handleRetry}
                        className="ml-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((tx) => {
                    const kind = getTransactionKind(tx);
                    const signedAmount =
                      kind === "income" ? Math.abs(tx.amount) : kind === "transfer" ? tx.amount : -Math.abs(tx.amount);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between border border-gray-100 dark:border-gray-600 rounded-xl p-4"
                      >
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(tx.occurredAt || tx.createdAt)}</p>
                          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                            {sanitizeText(tx.label || tx.categoryLabel || "Transaction")}
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
                            <div className="relative group">
                              <button
                                onClick={() => handleEditTransaction(tx)}
                                className="p-2 rounded-full text-gray-500 bg-gray-100 dark:bg-gray-700 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                                Edit
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                  <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                </div>
                              </div>
                            </div>
                            <div className="relative group">
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-2 rounded-full text-red-500 bg-red-50 dark:bg-red-900/20 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                                aria-label="Delete transaction"
                                type="button"
                                disabled={isDeletingTransactionId === tx.id}
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
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10">
                                Delete
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                  <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </AnimatedContentWrapper>
        </main>
      </div>
      {transactionToEdit ? (
        <AddTransactionModal
          isOpen={isEditTransactionOpen}
          accounts={accounts}
          categories={categories}
          onClose={() => {
            setIsEditTransactionOpen(false);
            setTransactionToEdit(null);
          }}
          mode="edit"
          transaction={transactionToEdit}
          onUpdate={handleUpdateTransaction}
        />
      ) : null}
    </div>
  );
}
