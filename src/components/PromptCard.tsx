import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePrompts } from "@/context/PromptContext";
import { useAuth } from "@/context/AuthContext";
import { Prompt } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Copy, 
  Edit, 
  MoreHorizontal, 
  Star, 
  Trash, 
  StarOff, 
  Folder, 
  ExternalLink, 
  Lock,
  Globe
} from "lucide-react";
import PromptForm from "./PromptForm";
import AuthDialog from "./AuthDialog";
import { staggerItem } from "@/lib/animations";
import { toast } from "sonner";

interface PromptCardProps {
  prompt: Prompt;
  layoutMode?: "grid" | "list";
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, layoutMode = "grid" }) => {
  const { 
    deletePrompt, 
    toggleFavorite, 
    collections, 
    addPromptToCollection,
    removePromptFromCollection
  } = usePrompts();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  const canEdit = user && (prompt.createdBy === user.id || !prompt.isPrivate);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    toast.success("Prompt copied to clipboard");
  };
  
  const handleDelete = () => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    if (!canEdit) {
      toast.error("You don't have permission to delete this prompt");
      return;
    }
    
    deletePrompt(prompt.id);
  };
  
  const handleToggleFavorite = () => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    toggleFavorite(prompt.id);
  };
  
  const handleAddToCollection = (collectionId: string) => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    addPromptToCollection(prompt.id, collectionId);
  };
  
  const handleRemoveFromCollection = (collectionId: string) => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    removePromptFromCollection(prompt.id, collectionId);
  };
  
  const collection = prompt.collectionId 
    ? collections.find(c => c.id === prompt.collectionId) 
    : null;
  
  const formattedDate = new Date(prompt.updatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const cardClasses = layoutMode === "grid" 
    ? "h-full" 
    : "flex flex-row items-start";
  
  const cardContentClasses = layoutMode === "grid" 
    ? "" 
    : "flex-1";

  return (
    <motion.div 
      {...staggerItem}
      className="transition-smooth"
      layout
    >
      <Card className={`${cardClasses} card-hover overflow-hidden`}>
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <div 
                className="font-medium cursor-pointer hover:text-accent truncate flex-1"
                onClick={() => navigate(`/prompt/${prompt.id}`)}
              >
                {prompt.title}
              </div>
              
              {prompt.isPrivate ? (
                <Badge variant="outline" className="ml-1 bg-yellow-100">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-1 bg-green-100">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleToggleFavorite}
                    >
                      {prompt.isFavorite ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => user ? setIsEditDialogOpen(true) : setIsAuthDialogOpen(true)}
                    disabled={user && !canEdit}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate(`/prompt/${prompt.id}`)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  
                  {user && (
                    <>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-full text-left px-2 py-1.5 text-sm flex items-center">
                          <Folder className="mr-2 h-4 w-4" />
                          {collection ? `Move from ${collection.name}` : "Add to Collection"}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {collections.map((col) => {
                            const isInCollection = prompt.collectionId === col.id;
                            return (
                              <DropdownMenuItem
                                key={col.id}
                                onClick={() => {
                                  if (isInCollection) {
                                    handleRemoveFromCollection(col.id);
                                  } else {
                                    handleAddToCollection(col.id);
                                  }
                                }}
                                disabled={isInCollection}
                              >
                                {col.name} {isInCollection && "(Current)"}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                        disabled={!canEdit}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`${cardContentClasses} p-4`}>
          <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {prompt.content}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col items-start gap-2">
          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prompt.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {prompt.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{prompt.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Updated {formattedDate}
            {prompt.createdByUsername && (
              <span> by {prompt.createdByUsername}</span>
            )}
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
          </DialogHeader>
          <PromptForm 
            prompt={prompt} 
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            You need to sign in to perform this action.
          </p>
          <AuthDialog onSuccess={() => setIsAuthDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PromptCard;
