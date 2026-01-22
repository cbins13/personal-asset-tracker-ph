import { useEffect, useMemo, useState } from "react";
import type { Account } from "../../utils/api";
import { isMongoObjectId } from "../../utils/validators";

export type TransactionKind = "expense" | "income" | "installment" | "transfer";

export type CategoryOption = {
  id: string;
  label: string;
  emoji?: string;
};

export type AddTransactionPayload = {
  transactionKind: TransactionKind;
  amount: number;
  label?: string;
  occurredAt?: string;
  recordInBudget?: boolean;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  categoryLabel?: string;
};


type Props = {
  isOpen: boolean;
  accounts: Account[];
  categories: CategoryOption[];
  onClose: () => void;
  onCreate: (payload: AddTransactionPayload) => Promise<void>;
};

const tabs: { id: TransactionKind; label: string }[] = [
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "installment", label: "Installment" },
  { id: "transfer", label: "Transfer" },
];

const getDefaultDateTime = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
};

export default function AddTransactionModal({
  isOpen,
  accounts,
  categories,
  onClose,
  onCreate,
}: Props) {
  const [activeTab, setActiveTab] = useState<TransactionKind>("expense");
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionTime, setTransactionTime] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [transactionLabel, setTransactionLabel] = useState("");
  const [recordInBudget, setRecordInBudget] = useState(true);
  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const { date, time } = getDefaultDateTime();
    setTransactionDate(date);
    setTransactionTime(time);
    setSelectedCategoryId("");
    setTransactionLabel("");
    setRecordInBudget(true);
    setAmount("");
    setSelectedAccountId("");
    setFromAccountId("");
    setToAccountId("");
    setFormError(null);
    setActiveTab("expense");
  }, [isOpen]);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: `${category.emoji ? `${category.emoji} ` : ""}${category.label}`,
    }));
  }, [categories]);

  const amountValue = Number(amount);
  const isAmountValid = amount !== "" && !Number.isNaN(amountValue) && amountValue > 0;

  const handleSubmit = async () => {
    if (!isAmountValid) {
      setFormError("Enter a valid amount greater than 0.");
      return;
    }

    if ((activeTab === "expense" || activeTab === "installment") && !selectedCategoryId) {
      setFormError("Select a category.");
      return;
    }

    if (activeTab === "transfer") {
      if (!fromAccountId || !toAccountId) {
        setFormError("Select both source and destination accounts.");
        return;
      }
      if (fromAccountId === toAccountId) {
        setFormError("Source and destination accounts must be different.");
        return;
      }
    } else if (!selectedAccountId) {
      setFormError("Select an account.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    const occurredAt =
      transactionDate && transactionTime
        ? new Date(`${transactionDate}T${transactionTime}`).toISOString()
        : undefined;
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
    const payload: AddTransactionPayload = {
      transactionKind: activeTab,
      amount: amountValue,
      label: transactionLabel.trim() || undefined,
      occurredAt,
      recordInBudget: activeTab === "expense" || activeTab === "installment" ? recordInBudget : undefined,
      accountId: activeTab !== "transfer" ? selectedAccountId : undefined,
      fromAccountId: activeTab === "transfer" ? fromAccountId : undefined,
      toAccountId: activeTab === "transfer" ? toAccountId : undefined,
      categoryId: isMongoObjectId(selectedCategory?.id) ? selectedCategory?.id : undefined,
      categoryLabel: selectedCategory?.label,
    };

    try {
      await onCreate(payload);
    } catch (error) {
      console.error("Create transaction error:", error);
      setFormError("Failed to create transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl bg-gray-100 rounded-3xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-2xl font-semibold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
            aria-label="Close add transaction"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gray-200 rounded-2xl p-2 flex gap-2 mb-5 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap",
                  activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-200 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="bg-white rounded-2xl border border-gray-200 p-4">
                <span className="text-sm font-semibold text-gray-800">Date</span>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(event) => setTransactionDate(event.target.value)}
                  className="mt-2 w-full text-sm text-gray-700 bg-transparent focus:outline-none"
                />
              </label>
              <label className="bg-white rounded-2xl border border-gray-200 p-4">
                <span className="text-sm font-semibold text-gray-800">Time</span>
                <input
                  type="time"
                  value={transactionTime}
                  onChange={(event) => setTransactionTime(event.target.value)}
                  className="mt-2 w-full text-sm text-gray-700 bg-transparent focus:outline-none"
                />
              </label>
            </div>

            {(activeTab === "expense" || activeTab === "installment") && (
              <label className="bg-white rounded-2xl border border-gray-200 p-4 block">
                <span className="text-sm font-semibold text-gray-800">Expense Category</span>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  className="mt-2 w-full text-sm text-gray-700 bg-transparent focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="bg-white rounded-2xl border border-gray-200 p-4 block">
              <span className="text-sm font-semibold text-gray-800">Name of Transaction</span>
              <input
                type="text"
                value={transactionLabel}
                onChange={(event) => setTransactionLabel(event.target.value)}
                placeholder="Enter name of transaction"
                className="mt-2 w-full text-sm text-gray-700 bg-transparent focus:outline-none"
              />
            </label>

            {activeTab === "transfer" ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">From Account</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accounts.map((account) => (
                      <button
                        key={`from-${account.id}`}
                        onClick={() => setFromAccountId(account.id)}
                        className={[
                          "border rounded-2xl px-4 py-3 text-left bg-white",
                          fromAccountId === account.id
                            ? "border-gray-900 shadow-sm"
                            : "border-gray-200 hover:border-gray-300",
                        ].join(" ")}
                      >
                        <p className="text-sm font-semibold text-gray-800">{account.accountName}</p>
                        <p className="text-xs text-gray-500">{account.providerLabel || account.type}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">To Account</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accounts.map((account) => (
                      <button
                        key={`to-${account.id}`}
                        onClick={() => setToAccountId(account.id)}
                        className={[
                          "border rounded-2xl px-4 py-3 text-left bg-white",
                          toAccountId === account.id ? "border-gray-900 shadow-sm" : "border-gray-200 hover:border-gray-300",
                        ].join(" ")}
                      >
                        <p className="text-sm font-semibold text-gray-800">{account.accountName}</p>
                        <p className="text-xs text-gray-500">{account.providerLabel || account.type}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {activeTab === "income" ? "Select Account to Add" : "Select Account to Deduct"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={[
                        "border rounded-2xl px-4 py-3 text-left bg-white",
                        selectedAccountId === account.id
                          ? "border-gray-900 shadow-sm"
                          : "border-gray-200 hover:border-gray-300",
                      ].join(" ")}
                    >
                      <p className="text-sm font-semibold text-gray-800">{account.accountName}</p>
                      <p className="text-xs text-gray-500">{account.providerLabel || account.type}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === "expense" || activeTab === "installment") && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Record this in Budget?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRecordInBudget(true)}
                    className={[
                      "px-4 py-1.5 rounded-full text-sm font-semibold",
                      recordInBudget ? "bg-lime-200 text-lime-900" : "bg-white text-gray-600 border border-gray-300",
                    ].join(" ")}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setRecordInBudget(false)}
                    className={[
                      "px-4 py-1.5 rounded-full text-sm font-semibold",
                      !recordInBudget ? "bg-lime-200 text-lime-900" : "bg-white text-gray-600 border border-gray-300",
                    ].join(" ")}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            <label className="bg-white rounded-2xl border border-gray-200 p-4 block">
              <span className="text-sm font-semibold text-gray-800">Amount</span>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="mt-2 w-full text-sm text-gray-700 bg-transparent focus:outline-none"
              />
            </label>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <button
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-lime-300 text-gray-900 text-sm font-semibold py-3 hover:bg-lime-400 disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
              disabled={!isAmountValid || isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : `Add ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
