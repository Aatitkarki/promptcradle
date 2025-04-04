import React from "react";
import { Button } from "@/components/ui/button";
import { usePrompts } from "@/context/PromptContext";
import { motion } from "framer-motion";
import { Plus, Search, Tag, Folder } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PromptForm from "./PromptForm";

const EmptyState: React.FC = () => {
  const { 
    selectedCollection, 
    selectedTags, 
    searchQuery, 
    clearFilters,
    prompts,
    collections,
    tags
  } = usePrompts();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  // Determine if we're showing empty state because of filters
  const hasFilters = selectedCollection || selectedTags.length > 0 || searchQuery;
  
  // Determine if the database is actually empty
  const isEmpty = prompts.length === 0;
  
  if (hasFilters) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center space-y-4"
      >
        <div className="p-4 rounded-full bg-muted">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">No matching prompts found</h3>
        <p className="text-muted-foreground max-w-md">
          {searchQuery && (
            <span>No prompts match your search "{searchQuery}"</span>
          )}
          
          {selectedCollection && (
            <span>
              No prompts in collection "
              {collections.find(c => c.id === selectedCollection)?.name}"
            </span>
          )}
          
          {selectedTags.length > 0 && (
            <span>
              No prompts with the selected tags
            </span>
          )}
        </p>
        <Button onClick={clearFilters}>Clear Filters</Button>
      </motion.div>
    );
  }
  
  if (isEmpty) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center space-y-6"
      >
        <div className="space-y-2">
          <div className="p-4 rounded-full bg-muted mx-auto">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Create your first prompt</h3>
          <p className="text-muted-foreground max-w-md">
            Get started by creating your first prompt to store and organize.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New Prompt</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
            </DialogHeader>
            <PromptForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl">
          <div className="border rounded-lg p-4 text-center space-y-2 transition-smooth hover:shadow-soft">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Plus className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="font-medium">Create Prompts</h3>
            <p className="text-sm text-muted-foreground">
              Save frequently used prompts to reuse later
            </p>
          </div>
          
          <div className="border rounded-lg p-4 text-center space-y-2 transition-smooth hover:shadow-soft">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
              <Tag className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="font-medium">Organize with Tags</h3>
            <p className="text-sm text-muted-foreground">
              Add tags to categorize and find prompts easily
            </p>
          </div>
          
          <div className="border rounded-lg p-4 text-center space-y-2 transition-smooth hover:shadow-soft">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <Folder className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="font-medium">Create Collections</h3>
            <p className="text-sm text-muted-foreground">
              Group related prompts into collections
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <p className="text-muted-foreground">No prompts to display</p>
    </motion.div>
  );
};

export default EmptyState;
