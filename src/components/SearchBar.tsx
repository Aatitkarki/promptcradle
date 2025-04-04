import React, { useEffect, useRef } from "react";
import { usePrompts } from "@/context/PromptContext";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  setIsOpen?: (isOpen: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ setIsOpen }) => {
  const { searchQuery, setSearchQuery } = usePrompts();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when the search bar is opened
    if (setIsOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [setIsOpen]);

  const handleClear = () => {
    setSearchQuery("");
    if (setIsOpen) {
      setIsOpen(false);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative flex w-full items-center">
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search prompts..."
        className="w-full pl-9 pr-9 h-9"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 h-full rounded-l-none"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
