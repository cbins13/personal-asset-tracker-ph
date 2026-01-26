import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { accountsApi, categoriesApi, transactionsApi, type Account, type Transaction } from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import AnimatedContentWrapper from "../../effects/AnimatedContentWrapper";
import AddTransactionModal, { type AddTransactionPayload, type CategoryOption } from "./AddTransactionModal";

type TransactionKind = "expense" | "income" | "installment" | "transfer";

type TransactionWithAccounts = Transaction & {
  account?: Account;
  fromAccount?: Account;
  toAccount?: Account;
};

const filters: { id: "all" | TransactionKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "installment", label: "Installment" },
  { id: "transfer", label: "Transfer" },
];

const fallbackCategories: CategoryOption[] = [
  { id: "balance-adjustment", label: "Balance Adjustment", emoji: "🔄" },
  { id: "family-support", label: "Family Support", emoji: "👨‍👩‍👧‍👦" },
  { id: "food-drinks", label: "Food and Drinks", emoji: "🍔" },
  { id: "gifts", label: "Gifts", emoji: "🎁" },
  { id: "grocery", label: "Grocery", emoji: "🛒" },
  { id: "insurance", label: "Insurance Payment", emoji: "☂️" },
  { id: "medicine", label: "Medicine", emoji: "💊" },
  { id: "night-out", label: "Night Out", emoji: "🍻" },
  { id: "pet", label: "Pet", emoji: "🐶" },
  { id: "rent", label: "Rent", emoji: "🏠" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "subscriptions", label: "Subscriptions", emoji: "🔔" },
  { id: "transportation", label: "Transportation", emoji: "🚗" },
  { id: "utilities", label: "Utilities", emoji: "💡" },
];

const getTransactionKind = (tx: Transaction): TransactionKind => {
  if (tx.transactionKind) return tx.transactionKind;
  if (tx.type === "credit") return "income";
  if (tx.type === "debit") return "expense";
  return "expense";
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithAccounts[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | TransactionKind>("all");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(fallbackCategories);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionWithAccounts | null>(null);
  const [isDeletingTransactionId, setIsDeletingTransactionId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const response = await transactionsApi.list({ includeAccounts: true });
    if (!response.success) {
      setError(response.error || "Failed to load transactions.");
      setTransactions([]);
    } else {
      setTransactions((response.data?.transactions || []) as TransactionWithAccounts[]);
      setError(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      const response = await accountsApi.getAll();
      if (response.success) {
        setAccounts(response.data?.accounts || []);
      }
    };
    const fetchCategories = async () => {
      const response = await categoriesApi.list();
      if (response.success && response.data?.categories?.length) {
        setCategories(
          response.data.categories.map((category) => ({
            id: category.id,
            label: category.label,
            emoji: category.emoji,
          }))
        );
      }
    };
    fetchAccounts();
    fetchCategories();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "all") return transactions;
    return transactions.filter((tx) => getTransactionKind(tx) === activeFilter);
  }, [transactions, activeFilter]);

  const getAccountLabel = (tx: TransactionWithAccounts) => {
    if (getTransactionKind(tx) === "transfer") {
      const fromName = tx.fromAccount?.accountName || tx.fromAccountId || "Source";
      const toName = tx.toAccount?.accountName || tx.toAccountId || "Destination";
      return `${fromName} → ${toName}`;
    }
    return tx.account?.accountName || tx.accountId || "Account";
  };

  const handleEditTransaction = (tx: TransactionWithAccounts) => {
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
    await fetchTransactions();
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("Delete this transaction? This will update account balances.")) {
      return;
    }
    setIsDeletingTransactionId(transactionId);
    const response = await transactionsApi.delete(transactionId);
    if (!response.success) {
      setError(response.error || "Failed to delete transaction.");
    } else {
      await fetchTransactions();
    }
    setIsDeletingTransactionId(null);
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
              ) : error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                              onClick={() => handleEditTransaction(tx)}
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
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
