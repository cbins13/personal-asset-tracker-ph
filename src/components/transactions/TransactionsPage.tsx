import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { transactionsApi, type Account, type Transaction } from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import AnimatedContent from "../../effects/AnimatedContent";

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
          <AnimatedContent delay={0.05} duration={0.8}>
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
                        <p
                          className={[
                            "text-base font-semibold",
                            signedAmount < 0 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                          ].join(" ")}
                        >
                          {signedAmount < 0 ? "-" : ""}
                          {formatCurrency(Math.abs(signedAmount))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </AnimatedContent>
        </main>
      </div>
    </div>
  );
}
