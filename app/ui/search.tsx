"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((query: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset to the first page on new search

    // If query is empty, remove the query parameter
    // This ensures that the URL is clean when no search is performed
    // and prevents the search from being applied with an empty string.
    if (query) {
      params.set("query", query);
    } else {
      params.delete("query");
    }

    // Update the URL with the new search parameters
    // This will trigger a re-render of the page with the new search results.
    // Using replace instead of push to avoid adding a new entry in the history stack.
    // This is important for search functionality to prevent cluttering the history with search queries.
    // It allows users to navigate back to the previous page without having to clear the search.
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
