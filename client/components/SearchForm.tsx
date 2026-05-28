import { Search } from "lucide-react";

export default function SearchForm() {
  return (
    <form className="flex items-center gap-2 bg-sidebar-primary rounded px-3 py-1">
      <input
        type="search"
        placeholder="Search..."
        className="bg-transparent border-none  text-gray-400 text-sm focus-visible:outline-none "
      />
      <button type="submit">
        <Search className="text-gray-500 hover:text-white  " size={15} />
      </button>
    </form>
  )
}

