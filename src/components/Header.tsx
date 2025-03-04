
import React, { useState } from "react";
import { usePrompts } from "@/context/PromptContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Grid2x2,
  List,
  Search,
  Plus,
  SlidersHorizontal,
  Clock,
  ArrowDownAZ,
  ArrowUpAZ,
  MoreVertical
} from "lucide-react";
import SearchBar from "./SearchBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PromptForm from "./PromptForm";

const Header: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    sortOption, 
    setSortOption,
    clearFilters
  } = usePrompts();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewPromptOpen, setIsNewPromptOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">PromptCradle</h1>
            <span className="hidden md:inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              v1.0
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:block w-[320px]">
              <SearchBar />
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <Dialog open={isNewPromptOpen} onOpenChange={setIsNewPromptOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline-block">New Prompt</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Prompt</DialogTitle>
                </DialogHeader>
                <PromptForm onSuccess={() => setIsNewPromptOpen(false)} />
              </DialogContent>
            </Dialog>
            
            <Separator orientation="vertical" className="h-6" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setSortOption("newest")}
                  className={sortOption === "newest" ? "bg-accent text-accent-foreground" : ""}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOption("oldest")}
                  className={sortOption === "oldest" ? "bg-accent text-accent-foreground" : ""}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOption("alphabetical")}
                  className={sortOption === "alphabetical" ? "bg-accent text-accent-foreground" : ""}
                >
                  <ArrowDownAZ className="mr-2 h-4 w-4" />
                  Alphabetical
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOption("updated")}
                  className={sortOption === "updated" ? "bg-accent text-accent-foreground" : ""}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Recently Updated
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Display</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-accent text-accent-foreground" : ""}
                >
                  <Grid2x2 className="mr-2 h-4 w-4" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-accent text-accent-foreground" : ""}
                >
                  <List className="mr-2 h-4 w-4" />
                  List View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters}>
                  Clear All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuItem>
                  Import Prompts
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export Prompts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isSearchOpen && (
          <div className="py-2 md:hidden">
            <SearchBar setIsOpen={setIsSearchOpen} />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
