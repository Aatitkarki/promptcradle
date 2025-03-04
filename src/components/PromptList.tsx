
import React from "react";
import { motion } from "framer-motion";
import { usePrompts } from "@/context/PromptContext";
import PromptCard from "./PromptCard";
import EmptyState from "./EmptyState";
import { staggerContainer } from "@/lib/animations";

const PromptList: React.FC = () => {
  const { filteredPrompts, viewMode } = usePrompts();
  
  if (filteredPrompts.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <motion.div 
      {...staggerContainer}
      layout
      className={
        viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "flex flex-col space-y-3"
      }
    >
      {filteredPrompts.map((prompt) => (
        <PromptCard 
          key={prompt.id} 
          prompt={prompt}
          layoutMode={viewMode} 
        />
      ))}
    </motion.div>
  );
};

export default PromptList;
