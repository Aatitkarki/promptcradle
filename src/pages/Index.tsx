import React from "react";
import { motion } from "framer-motion";
import { usePrompts } from "@/context/PromptContext";
import CollectionsList from "@/components/CollectionsList";
import PromptList from "@/components/PromptList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

const Index: React.FC = () => {
  const { 
    tags, 
    selectedTags, 
    toggleSelectedTag,
    selectedCollection,
    collections,
    setSelectedCollection,
    searchQuery,
    clearFilters,
    filteredPrompts,
    prompts
  } = usePrompts();
  
  const hasFilters = selectedTags.length > 0 || selectedCollection || searchQuery;
  const selectedCollectionName = selectedCollection 
    ? collections.find(c => c.id === selectedCollection)?.name 
    : null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6"
    >
      <div className="hidden md:block">
        <CollectionsList />
        
        <div className="mt-8 space-y-4">
          <h3 className="font-medium">Filter by Tags</h3>
          <Separator />
          
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSelectedTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
            
            {tags.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No tags created yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="md:hidden">
          <CollectionsList />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {selectedCollectionName || "All Prompts"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {filteredPrompts.length} {filteredPrompts.length === 1 ? "prompt" : "prompts"} {hasFilters ? "found" : "total"}
            </p>
          </div>
        </div>
        
        {hasFilters && (
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Filters:</span>
              
              {selectedCollectionName && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  Collection: {selectedCollectionName}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-muted"
                    onClick={() => setSelectedCollection(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  Search: {searchQuery}
                </Badge>
              )}
              
              {selectedTags.length > 0 && (
                <>
                  {selectedTags.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId);
                    return (
                      <Badge 
                        key={tagId} 
                        variant="secondary" 
                        className="gap-1 pl-2 pr-1 py-1"
                      >
                        {tag?.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-muted"
                          onClick={() => toggleSelectedTag(tagId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </>
              )}
            </div>
            
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        )}
        
        <PromptList />
      </div>
    </motion.div>
  );
};

export default Index;
