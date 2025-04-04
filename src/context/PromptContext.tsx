console.log('PromptContext: usePrompts start');

import React, { createContext, useContext, useState, useEffect } from "react";
import { Prompt, Tag, Collection, SortOption, ViewMode } from "@/types";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import * as PromptService from "@/services/supabase";

type PromptContextType = {
  prompts: Prompt[];
  collections: Collection[];
  tags: Tag[];
  selectedCollection: string | null;
  selectedTags: string[];
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  addPrompt: (prompt: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "version">) => void;
  updatePrompt: (id: string, data: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  addCollection: (collection: Omit<Collection, "id" | "promptIds">) => void;
  updateCollection: (id: string, data: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSelectedCollection: (id: string | null) => void;
  toggleSelectedTag: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  addPromptToCollection: (promptId: string, collectionId: string) => void;
  removePromptFromCollection: (promptId: string, collectionId: string) => void;
  clearFilters: () => void;
  filteredPrompts: Prompt[];
  isLoading: boolean;
};

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load all data in parallel
        const [promptsData, collectionsData, tagsData] = await Promise.all([
          Promise.resolve([]),
          Promise.resolve([]),
          Promise.resolve([])
        ]);
        
        setPrompts(promptsData);
        setCollections(collectionsData);
        setTags(tagsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]); // Reload when user changes

  // Filter prompts based on current filters
  const filteredPrompts = React.useMemo(() => {
    return prompts
      .filter((prompt) => {
        // Filter by privacy: show only public prompts or private prompts owned by the current user
        if (prompt.isPrivate && (!user || prompt.createdBy !== user.id)) {
          return false;
        }
        
        // Filter by collection if selected
        if (selectedCollection && prompt.collectionId !== selectedCollection) {
          return false;
        }
        
        // Filter by selected tags
        if (selectedTags.length > 0) {
          const promptTagIds = prompt.tags.map(tag => tag.id);
          if (!selectedTags.some(tagId => promptTagIds.includes(tagId))) {
            return false;
          }
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            prompt.title.toLowerCase().includes(query) ||
            prompt.content.toLowerCase().includes(query) ||
            prompt.tags.some(tag => tag.name.toLowerCase().includes(query))
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort based on selected option
        switch (sortOption) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "alphabetical":
            return a.title.localeCompare(b.title);
          case "updated":
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          default:
            return 0;
        }
      });
  }, [prompts, selectedCollection, selectedTags, searchQuery, sortOption, user]);
  
  // Add a new prompt
  const addPrompt = async (promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "version">) => {
    if (!user) {
      toast.error("You must be signed in to create prompts");
      return;
    }
    
    try {
      const newPrompt = {id: 'temp', content: promptData.content, title: promptData.title, createdAt: new Date(), updatedAt: new Date(), version: 1, isPrivate: false, userId: user?.id || '', collectionId: null, tags: [], isFavorite: false};
      setPrompts(prev => [newPrompt, ...prev]);
      
      // Update collections if this prompt is added to a collection
      if (newPrompt.collectionId) {
        setCollections(prev => 
          prev.map(collection => 
            collection.id === newPrompt.collectionId
              ? { ...collection, promptIds: [...collection.promptIds, newPrompt.id] }
              : collection
          )
        );
      }
      
      toast.success("Prompt saved successfully");
    } catch (error) {
      console.error("Error adding prompt:", error);
      toast.error("Failed to save prompt");
    }
  };
  
  // Add a new collection
  const addCollection = async (collectionData: Omit<Collection, "id" | "promptIds">) => {
    if (!user) {
      toast.error("You must be signed in to create collections");
      return;
    }
    
    try {
      const newCollection = {id: 'temp', name: collectionData.name, description: collectionData.description || '', promptIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: user?.id || ''};
      
      setCollections(prev => [...prev, newCollection]);
      toast.success("Collection created successfully");
    } catch (error) {
      console.error("Error adding collection:", error);
      toast.error("Failed to create collection");
    }
  };
  
  // Update an existing prompt
  const updatePrompt = async (id: string, data: Partial<Prompt>) => {
    try {
      // await supabaseService.updatePrompt(id, data);
      
      // Update local state
      setPrompts(prev => 
        prev.map(prompt => {
          if (prompt.id === id) {
            // Create new version history if content changed
            let versionHistory = prompt.versionHistory || [];
            if (data.content && data.content !== prompt.content) {
              versionHistory = [
                ...versionHistory,
                {
                  version: prompt.version,
                  content: prompt.content,
                  updatedAt: prompt.updatedAt
                }
              ];
            }
            
            return {
              ...prompt,
              ...data,
              updatedAt: new Date(),
              version: data.content && data.content !== prompt.content 
                ? prompt.version + 1 
                : prompt.version,
              versionHistory
            };
          }
          return prompt;
        })
      );
      
      // Handle collection changes if needed
      if (data.collectionId !== undefined) {
        const oldPrompt = prompts.find(p => p.id === id);
        
        // Remove from old collection
        if (oldPrompt?.collectionId) {
          setCollections(prev => 
            prev.map(collection => {
              if (collection.id === oldPrompt.collectionId) {
                return { 
                  ...collection, 
                  promptIds: collection.promptIds.filter(promptId => promptId !== id) 
                };
              }
              return collection;
            })
          );
        }
        
        // Add to new collection if not null
        if (data.collectionId) {
          setCollections(prev => 
            prev.map(collection => {
              if (collection.id === data.collectionId && !collection.promptIds.includes(id)) {
                return { 
                  ...collection, 
                  promptIds: [...collection.promptIds, id] 
                };
              }
              return collection;
            })
          );
        }
      }
      
      toast.success("Prompt updated successfully");
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast.error("Failed to update prompt");
    }
  };
  
  // Delete a prompt
  const deletePrompt = async (id: string) => {
    try {
      // await supabaseService.deletePrompt(id);
      
      // Remove prompt from local state
      const promptToDelete = prompts.find(p => p.id === id);
      setPrompts(prev => prev.filter(prompt => prompt.id !== id));
      
      // Update collections if needed
      if (promptToDelete?.collectionId) {
        setCollections(prev => 
          prev.map(collection => {
            if (collection.id === promptToDelete.collectionId) {
              return {
                ...collection,
                promptIds: collection.promptIds.filter(promptId => promptId !== id)
              };
            }
            return collection;
          })
        );
      }
      
      toast.success("Prompt deleted successfully");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    }
  };
  
  // Update a collection
  const updateCollection = async (id: string, data: Partial<Collection>) => {
    try {
      // await supabaseService.updateCollection(id, data);
      
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? { ...collection, ...data } : collection
        )
      );
      toast.success("Collection updated successfully");
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    }
  };
  
  // Delete a collection
  const deleteCollection = async (id: string) => {
    try {
      // await supabaseService.deleteCollection(id);
      
      // Remove collection from local state
      setCollections(prev => prev.filter(collection => collection.id !== id));
      
      // Update prompts that were in this collection
      setPrompts(prev => 
        prev.map(prompt => 
          prompt.collectionId === id ? { ...prompt, collectionId: undefined } : prompt
        )
      );
      
      // Clear selected collection if it was the one deleted
      if (selectedCollection === id) {
        setSelectedCollection(null);
      }
      
      toast.success("Collection deleted successfully");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };
  
  // Add a new tag
  const addTag = async (name: string): Promise<Tag> => {
    try {
      const newTag = {id: 'temp', name: name, createdAt: new Date().toISOString()};
      
      // Check if tag already exists in our local state
      const existingTag = tags.find(tag => 
        tag.id === newTag.id || tag.name.toLowerCase() === newTag.name.toLowerCase()
      );
      
      if (!existingTag) {
        setTags(prev => [...prev, newTag]);
      }
      
      return existingTag || newTag;
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
      throw error;
    }
  };
  
  // Delete a tag
  const deleteTag = async (id: string) => {
    try {
      // await supabaseService.deleteTag(id);
      
      // Remove tag from local state
      setTags(prev => prev.filter(tag => tag.id !== id));
      
      // Remove tag from prompts
      setPrompts(prev => 
        prev.map(prompt => ({
          ...prompt,
          tags: prompt.tags.filter(tag => tag.id !== id)
        }))
      );
      
      // Remove from selected tags
      setSelectedTags(prev => prev.filter(tagId => tagId !== id));
      
      toast.success("Tag deleted successfully");
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    }
  };
  
  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    if (!user) {
      toast.error("You must be signed in to add to favorites");
      return;
    }
    
    try {
      // First find the prompt to determine its current favorite status
      const prompt = prompts.find(p => p.id === id);
      if (!prompt) return;
      
      // Toggle the favorite status
      const newFavoriteStatus = !prompt.isFavorite;
      
      // await supabaseService.toggleFavorite(id, newFavoriteStatus);
      
      // Update the prompt in local state
      setPrompts(prev => 
        prev.map(p => {
          if (p.id === id) {
            return { ...p, isFavorite: newFavoriteStatus };
          }
          return p;
        })
      );
      
      // Find favorites collection
      const favoritesCollection = collections.find(c => c.name === "Favorites");
      
      if (favoritesCollection) {
        if (newFavoriteStatus) {
          // Add to favorites collection
          setCollections(prev => 
            prev.map(collection => 
              collection.id === favoritesCollection.id
                ? { 
                    ...collection, 
                    promptIds: collection.promptIds.includes(id) 
                      ? collection.promptIds 
                      : [...collection.promptIds, id] 
                  }
                : collection
            )
          );
        } else {
          // Remove from favorites collection
          setCollections(prev => 
            prev.map(collection => 
              collection.id === favoritesCollection.id
                ? { 
                    ...collection, 
                    promptIds: collection.promptIds.filter(promptId => promptId !== id) 
                  }
                : collection
            )
          );
        }
      }
      
      toast.success(newFavoriteStatus ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };
  
  // Toggle a tag in the selected tags filter
  const toggleSelectedTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id)
        ? prev.filter(tagId => tagId !== id)
        : [...prev, id]
    );
  };
  
  // Add prompt to collection
  const addPromptToCollection = async (promptId: string, collectionId: string) => {
    if (!user) {
      toast.error("You must be signed in to perform this action");
      return;
    }
    
    try {
      // await supabaseService.addPromptToCollection(promptId, collectionId);
      
      // Update the prompt in local state
      setPrompts(prev => 
        prev.map(prompt => 
          prompt.id === promptId
            ? { ...prompt, collectionId }
            : prompt
        )
      );
      
      // Update the collection
      setCollections(prev => 
        prev.map(collection => {
          if (collection.id === collectionId && !collection.promptIds.includes(promptId)) {
            return { ...collection, promptIds: [...collection.promptIds, promptId] };
          }
          return collection;
        })
      );
      
      toast.success("Prompt added to collection");
    } catch (error) {
      console.error("Error adding prompt to collection:", error);
      toast.error("Failed to add prompt to collection");
    }
  };
  
  // Remove prompt from collection
  const removePromptFromCollection = async (promptId: string, collectionId: string) => {
    if (!user) {
      toast.error("You must be signed in to perform this action");
      return;
    }
    
    try {
      // await supabaseService.removePromptFromCollection(promptId);
      
      // Update the prompt in local state
      setPrompts(prev => 
        prev.map(prompt => 
          prompt.id === promptId && prompt.collectionId === collectionId
            ? { ...prompt, collectionId: undefined }
            : prompt
        )
      );
      
      // Update the collection
      setCollections(prev => 
        prev.map(collection => 
          collection.id === collectionId
            ? { ...collection, promptIds: collection.promptIds.filter(id => id !== promptId) }
            : collection
        )
      );
      
      toast.success("Prompt removed from collection");
    } catch (error) {
      console.error("Error removing prompt from collection:", error);
      toast.error("Failed to remove prompt from collection");
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedCollection(null);
    setSelectedTags([]);
    setSearchQuery("");
  };

  const value = {
    prompts,
    collections,
    tags,
    selectedCollection,
    selectedTags,
    searchQuery,
    sortOption,
    viewMode,
    addPrompt,
    updatePrompt,
    deletePrompt,
    addCollection,
    updateCollection,
    deleteCollection,
    addTag,
    deleteTag,
    toggleFavorite,
    setSelectedCollection,
    toggleSelectedTag,
    setSearchQuery,
    setSortOption,
    setViewMode,
    addPromptToCollection,
    removePromptFromCollection,
    clearFilters,
    filteredPrompts,
    isLoading
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompts = () => {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
};

console.log('PromptContext: usePrompts end');
