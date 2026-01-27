type Props = {
  filters: string[];
  activeFilter: string;
  onChange: (filter: string) => void;
};

export default function AccountFilters({ filters, activeFilter, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={[
            "px-4 py-2 rounded-full text-sm font-medium border",
            activeFilter === filter
              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          ].join(" ")}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
