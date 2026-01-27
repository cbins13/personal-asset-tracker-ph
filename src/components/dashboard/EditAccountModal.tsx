import type { Account } from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";

type ProviderMeta = { id: string; label: string; accent: string } | null;

type Props = {
  account: Account;
  isEditingName: boolean;
  editName: string;
  onEditNameChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
  onToggleNetWorth: (value: boolean) => void;
  getProviderMeta: (account: Account) => ProviderMeta;
};

export default function EditAccountModal({
  account,
  isEditingName,
  editName,
  onEditNameChange,
  onStartEdit,
  onSaveName,
  onCancelEdit,
  onToggleNetWorth,
  getProviderMeta,
}: Props) {
  const providerMeta = getProviderMeta(account);
  const iconText =
    providerMeta?.label?.split(" ")[0][0] || account.providerLabel?.[0] || account.accountName?.[0] || "A";
  const iconAccent = providerMeta?.accent || "bg-gray-400";

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold ${iconAccent}`}>
            {iconText.toUpperCase()}
          </div>
          <div>
            {isEditingName ? (
              <input
                value={editName}
                onChange={(event) => onEditNameChange(event.target.value)}
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none focus:border-gray-600 dark:focus:border-gray-400"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{account.accountName}</p>
            )}
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(account.currentBalance || 0)}
            </p>
          </div>
        </div>
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveName}
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 rounded-full border border-transparent text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onStartEdit}
            className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
          >
            Edit
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Goal amount</p>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(0)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Interest rate</p>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{"--"}</p>
        </div>
      </div>

      <div className="mt-6 bg-gray-900 dark:bg-black/30 rounded-2xl px-6 py-4 text-white">
        <p className="text-sm font-medium">Total Interest Earned</p>
        <div className="mt-3 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-300">Month</p>
            <p className="mt-1 font-semibold">₱0.00</p>
          </div>
          <div>
            <p className="text-gray-300">Year</p>
            <p className="mt-1 font-semibold">₱0.00</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">Add to Total Net Worth?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleNetWorth(true)}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-semibold",
              account.addToNetWorth
                ? "bg-lime-200 dark:bg-lime-600/40 text-lime-900 dark:text-lime-200"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600",
            ].join(" ")}
          >
            Yes
          </button>
          <button
            onClick={() => onToggleNetWorth(false)}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-semibold",
              !account.addToNetWorth
                ? "bg-lime-200 dark:bg-lime-600/40 text-lime-900 dark:text-lime-200"
                : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600",
            ].join(" ")}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
