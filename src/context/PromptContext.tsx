import React, { createContext, useContext, useState, useEffect } from "react";
import { Prompt, Tag, Collection, SortOption, ViewMode, User } from "@/types";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

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
  addTag: (name: string) => Tag;
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
};

const PromptContext = createContext<PromptContextType | undefined>(undefined);

// Helper functions
const generateId = () => Math.random().toString(36).substring(2, 9);

const saveToLocalStorage = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (saved === null) {
    return defaultValue;
  }
  return JSON.parse(saved);
};

// Sample data
const initialTags: Tag[] = [
  { id: "tag-1", name: "AI" },
  { id: "tag-2", name: "Writing" },
  { id: "tag-3", name: "Creativity" },
  { id: "tag-4", name: "Business" },
  { id: "tag-5", name: "Marketing" },
];

const initialCollections: Collection[] = [
  { id: "col-1", name: "Favorites", description: "My favorite prompts", promptIds: [] },
  { id: "col-2", name: "Writing", description: "Prompts for creative writing", promptIds: [] },
  { id: "col-3", name: "Business", description: "Professional prompts", promptIds: [] },
];

const initialPrompts: Prompt[] = [
  {
    id: "prompt-1",
    title: "Creative Story Generator",
    content: "Write a short story about {{character}} who discovers {{magical object}} and how it changes their life.",
    tags: [initialTags[0], initialTags[2]],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    collectionId: "col-2",
    isFavorite: true,
    version: 1,
    isPrivate: false,
  },
  {
    id: "prompt-2",
    title: "Business Email Template",
    content: "Compose a professional email to {{recipient}} regarding {{topic}}. The tone should be {{tone}} and include a clear call to action.",
    tags: [initialTags[3], initialTags[4]],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    collectionId: "col-3",
    isFavorite: false,
    version: 1,
    isPrivate: false,
  },
  {
    id: "prompt-3",
    title: "AI Art Prompt",
    content: "Generate an image of a {{subject}} in the style of {{artist}}, with {{mood}} lighting and {{color}} color palette.",
    tags: [initialTags[0], initialTags[2]],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    collectionId: "col-2",
    isFavorite: true,
    version: 1,
    isPrivate: false,
  },
];

// Update collection promptIds
initialCollections[0].promptIds = initialPrompts.filter(p => p.isFavorite).map(p => p.id);
initialCollections[1].promptIds = initialPrompts.filter(p => p.collectionId === "col-2").map(p => p.id);
initialCollections[2].promptIds = initialPrompts.filter(p => p.collectionId === "col-3").map(p => p.id);

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>(() => 
    loadFromLocalStorage('prompts', initialPrompts)
  );
  
  const [collections, setCollections] = useState<Collection[]>(() => 
    loadFromLocalStorage('collections', initialCollections)
  );
  
  const [tags, setTags] = useState<Tag[]>(() => 
    loadFromLocalStorage('tags', initialTags)
  );
  
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveToLocalStorage('prompts', prompts);
    saveToLocalStorage('collections', collections);
    saveToLocalStorage('tags', tags);
  }, [prompts, collections, tags]);

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
  const addPrompt = (promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "version">) => {
    if (!user) {
      toast.error("You must be signed in to create prompts");
      return;
    }
    
    const newPrompt: Prompt = {
      ...promptData,
      id: `prompt-${generateId()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      collectionId: promptData.collectionId === "none" ? undefined : promptData.collectionId,
      isPrivate: promptData.isPrivate || false,
      createdBy: user?.id,
      createdByUsername: user?.username
    };
    
    setPrompts(prev => [newPrompt, ...prev]);
    
    // Add to collection if specified
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
  };
  
  // Add a new collection
  const addCollection = (collectionData: Omit<Collection, "id" | "promptIds">) => {
    if (!user) {
      toast.error("You must be signed in to create collections");
      return;
    }
    
    const newCollection: Collection = {
      ...collectionData,
      id: `col-${generateId()}`,
      promptIds: []
    };
    
    setCollections(prev => [...prev, newCollection]);
    toast.success("Collection created successfully");
  };
  
  // Update an existing prompt
  const updatePrompt = (id: string, data: Partial<Prompt>) => {
    // Verify ownership for private prompts
    const prompt = prompts.find(p => p.id === id);
    if (prompt?.isPrivate && prompt.createdBy && user?.id !== prompt.createdBy) {
      toast.error("You don't have permission to edit this prompt");
      return;
    }
    
    // Handle the "none" value for collectionId
    if (data.collectionId === "none") {
      data.collectionId = undefined;
    }
    
    setPrompts(prev => 
      prev.map(prompt => {
        if (prompt.id === id) {
          // For content updates, add to version history
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
      // Remove from old collection
      setCollections(prev => 
        prev.map(collection => {
          if (collection.promptIds.includes(id) && collection.id !== data.collectionId) {
            return { 
              ...collection, 
              promptIds: collection.promptIds.filter(promptId => promptId !== id) 
            };
          }
          return collection;
        })
      );
      
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
  };
  
  // Delete a prompt
  const deletePrompt = (id: string) => {
    // Verify ownership for private prompts
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    
    if (prompt.createdBy && user?.id !== prompt.createdBy) {
      toast.error("You don't have permission to delete this prompt");
      return;
    }
    
    // Remove prompt
    setPrompts(prev => prev.filter(prompt => prompt.id !== id));
    
    // Remove from collections
    setCollections(prev => 
      prev.map(collection => ({
        ...collection,
        promptIds: collection.promptIds.filter(promptId => promptId !== id)
      }))
    );
    
    toast.success("Prompt deleted successfully");
  };
  
  // Update a collection
  const updateCollection = (id: string, data: Partial<Collection>) => {
    setCollections(prev => 
      prev.map(collection => 
        collection.id === id ? { ...collection, ...data } : collection
      )
    );
    toast.success("Collection updated successfully");
  };
  
  // Delete a collection
  const deleteCollection = (id: string) => {
    // Remove collection
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
  };
  
  // Add a new tag
  const addTag = (name: string): Tag => {
    // Check if tag already exists
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingTag) {
      return existingTag;
    }
    
    const newTag: Tag = {
      id: `tag-${generateId()}`,
      name
    };
    
    setTags(prev => [...prev, newTag]);
    return newTag;
  };
  
  // Delete a tag
  const deleteTag = (id: string) => {
    // Remove tag
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
  };
  
  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    if (!user) {
      toast.error("You must be signed in to add to favorites");
      return;
    }
    
    // First find the prompt to determine its current favorite status
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    // Toggle the favorite status
    const newFavoriteStatus = !prompt.isFavorite;
    
    // Update the prompt
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
  const addPromptToCollection = (promptId: string, collectionId: string) => {
    if (!user) {
      toast.error("You must be signed in to perform this action");
      return;
    }
    
    // Update the prompt
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
  };
  
  // Remove prompt from collection
  const removePromptFromCollection = (promptId: string, collectionId: string) => {
    if (!user) {
      toast.error("You must be signed in to perform this action");
      return;
    }
    
    // Update the prompt
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

