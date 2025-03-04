
import React, { useState, useRef, useCallback } from "react";
import { usePrompts } from "@/context/PromptContext";
import { Tag } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

interface TagsInputProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

const TagsInput: React.FC<TagsInputProps> = ({ selectedTags, onChange }) => {
  const { tags, addTag } = usePrompts();
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTagFromInput();
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      const newTags = [...selectedTags];
      newTags.pop();
      onChange(newTags);
    }
  };

  const addTagFromInput = useCallback(() => {
    if (inputValue.trim()) {
      // Create or get the tag
      const newTag = addTag(inputValue.trim());
      
      // Add it to the selected tags if not already included
      if (!selectedTags.some(tag => tag.id === newTag.id)) {
        onChange([...selectedTags, newTag]);
      }
      
      setInputValue("");
    }
  }, [inputValue, selectedTags, addTag, onChange]);

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      addTagFromInput();
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 p-2 border rounded-md ${
        isFocused ? "ring-2 ring-ring ring-offset-1" : ""
      }`}
      onClick={() => {
        inputRef.current?.focus();
        setIsFocused(true);
      }}
    >
      {selectedTags.map(tag => (
        <Badge key={tag.id} variant="secondary" className="px-2 py-1 gap-1">
          {tag.name}
          <button 
            type="button"
            className="rounded-full hover:bg-muted-foreground/10" 
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag.id);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      <div className="flex flex-1 items-center min-w-[120px]">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          className="border-0 p-0 h-auto shadow-none focus-visible:ring-0 min-w-[30px] flex-1"
          placeholder={selectedTags.length > 0 ? "" : "Add tags..."}
        />
        
        {inputValue && (
          <button
            type="button"
            className="p-1 rounded-full hover:bg-accent/10"
            onClick={addTagFromInput}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TagsInput;
