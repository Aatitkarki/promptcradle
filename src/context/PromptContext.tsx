console.log('PromptContext: usePrompts start');

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Prompt, Tag, Collection, SortOption, ViewMode, User } from "@/types";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import * as ApiService from "@/services/api"; // Import the new API service

type PromptContextType = {
  prompts: Prompt[];
  collections: Collection[];
  tags: Tag[];
  selectedCollection: string | null;
  selectedTags: string[];
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  addPrompt: (prompt: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "version" | "tags"> & { tags?: string[] }) => Promise<void>;
  updatePrompt: (id: string, data: Partial<Omit<Prompt, "tags">> & { tags?: string[] }) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  addCollection: (collection: Omit<Collection, "id" | "promptIds">) => Promise<void>;
  updateCollection: (id: string, data: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addTag: (name: string) => Promise<Tag | undefined>; // Can return undefined if exists or error
  deleteTag: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setSelectedCollection: (id: string | null) => void;
  toggleSelectedTag: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  addPromptToCollection: (promptId: string, collectionId: string) => Promise<void>;
  removePromptFromCollection: (promptId: string, collectionId: string) => Promise<void>;
  clearFilters: () => void;
  filteredPrompts: Prompt[];
  isLoading: boolean;
  fetchData: () => Promise<void>; // Expose function to refetch data
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

  // Load data using API service
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      // Adjust API calls based on whether user is logged in (e.g., fetch user-specific data)
      const [promptsData, collectionsData, tagsData] = await Promise.all([
        ApiService.getPrompts({ userId: user?.id }), // Fetch prompts (potentially filtered by user)
        ApiService.getCollections(), // Fetch collections (potentially user-specific)
        ApiService.getTags(),       // Fetch tags (likely public)
      ]);

      // Ensure data is arrays even if API returns null/undefined on error/empty
      setPrompts(promptsData || []);
      setCollections(collectionsData || []);
      setTags(tagsData || []);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data. Please try again.");
      // Set to empty arrays on failure to avoid crashes
      setPrompts([]);
      setCollections([]);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Reload when user changes

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Initial fetch and refetch on user change

  // Filter prompts based on current filters
  const filteredPrompts = React.useMemo(() => {
     // Ensure prompts is always an array before filtering/sorting
    const safePrompts = Array.isArray(prompts) ? prompts : [];

    return safePrompts
      .filter((prompt) => {
        // Filter by privacy: Handled by backend via userId in getPrompts ideally
        // Client-side check as fallback (if backend doesn't filter)
        // if (prompt.isPrivate && (!user || prompt.createdBy !== user.id)) {
        //   return false;
        // }

        // Filter by collection if selected
        if (selectedCollection && prompt.collectionId !== selectedCollection) {
          return false;
        }

        // Filter by selected tags (check if prompt.tags includes ALL selectedTags)
        if (selectedTags.length > 0) {
           // Ensure prompt.tags is an array
          const promptTagIds = Array.isArray(prompt.tags) ? prompt.tags.map(tag => tag.id) : [];
          if (!selectedTags.every(tagId => promptTagIds.includes(tagId))) {
             return false;
          }
        }


        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const tagNames = Array.isArray(prompt.tags) ? prompt.tags.map(t => t.name.toLowerCase()) : [];
          return (
            prompt.title?.toLowerCase().includes(query) ||
            prompt.content?.toLowerCase().includes(query) ||
            tagNames.some(tagName => tagName.includes(query))
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Sort based on selected option
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

        switch (sortOption) {
          case "newest":
            return dateB - dateA;
          case "oldest":
            return dateA - dateB;
          case "alphabetical":
            return (a.title || "").localeCompare(b.title || "");
          case "updated":
            return updatedB - updatedA;
          default:
            return 0;
        }
      });
  }, [prompts, selectedCollection, selectedTags, searchQuery, sortOption]); // Removed 'user' dependency as filtering logic relies on fetched data

  // Add a new prompt
  const addPrompt = async (promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "version" | "tags"> & { tags?: string[] }) => {
    if (!user) {
      toast.error("You must be signed in to create prompts");
      return;
    }

    try {
      // The API call now includes the user context via the token
      const newPrompt = await ApiService.addPrompt(promptData);
      setPrompts(prev => [newPrompt, ...(Array.isArray(prev) ? prev : [])]); // Prepend new prompt

      // Update collections if this prompt is added to a collection
      if (newPrompt.collectionId) {
        setCollections(prev =>
          (Array.isArray(prev) ? prev : []).map(collection =>
            collection.id === newPrompt.collectionId
              ? { ...collection, promptIds: [...(collection.promptIds || []), newPrompt.id] }
              : collection
          )
        );
      }

      toast.success("Prompt saved successfully");
    } catch (error) {
      console.error("Error adding prompt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save prompt");
    }
  };

  // Add a new collection
  const addCollection = async (collectionData: Omit<Collection, "id" | "promptIds">) => {
    if (!user) {
      toast.error("You must be signed in to create collections");
      return;
    }

    try {
      const newCollection = await ApiService.addCollection(collectionData);
      setCollections(prev => [...(Array.isArray(prev) ? prev : []), newCollection]); // Append new collection
      toast.success("Collection created successfully");
    } catch (error) {
      console.error("Error adding collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create collection");
    }
  };

  // Update an existing prompt
  const updatePrompt = async (id: string, data: Partial<Omit<Prompt, "tags">> & { tags?: string[] }) => {
     if (!user) {
      toast.error("You must be signed in to update prompts");
      return;
    }
    try {
      const updatedPrompt = await ApiService.updatePrompt(id, data);

      // Update local state
      setPrompts(prev =>
        (Array.isArray(prev) ? prev : []).map(prompt =>
          prompt.id === id ? updatedPrompt : prompt
        )
      );

      // Handle collection changes if needed (check if collectionId changed)
      const oldPrompt = prompts.find(p => p.id === id);
      const newCollectionId = updatedPrompt.collectionId;
      const oldCollectionId = oldPrompt?.collectionId;

      if (newCollectionId !== oldCollectionId) {
        setCollections(prevCollections => (Array.isArray(prevCollections) ? prevCollections : []).map(collection => {
          // Remove from old collection
          if (collection.id === oldCollectionId && collection.promptIds?.includes(id)) {
            return { ...collection, promptIds: collection.promptIds.filter(pid => pid !== id) };
          }
          // Add to new collection
          if (collection.id === newCollectionId && !collection.promptIds?.includes(id)) {
            return { ...collection, promptIds: [...(collection.promptIds || []), id] };
          }
          return collection;
        }));
      }


      toast.success("Prompt updated successfully");
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update prompt");
    }
  };

  // Delete a prompt
  const deletePrompt = async (id: string) => {
     if (!user) {
      toast.error("You must be signed in to delete prompts");
      return;
    }
    try {
      await ApiService.deletePrompt(id);

      // Remove prompt from local state
      const promptToDelete = prompts.find(p => p.id === id);
      setPrompts(prev => (Array.isArray(prev) ? prev : []).filter(prompt => prompt.id !== id));

      // Update collections if needed
      if (promptToDelete?.collectionId) {
        setCollections(prev =>
          (Array.isArray(prev) ? prev : []).map(collection => {
            if (collection.id === promptToDelete.collectionId) {
              return {
                ...collection,
                promptIds: (collection.promptIds || []).filter(promptId => promptId !== id)
              };
            }
            return collection;
          })
        );
      }

      toast.success("Prompt deleted successfully");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete prompt");
    }
  };

  // Update a collection
  const updateCollection = async (id: string, data: Partial<Collection>) => {
     if (!user) {
      toast.error("You must be signed in to update collections");
      return;
    }
    try {
      const updatedCollection = await ApiService.updateCollection(id, data);
      setCollections(prev =>
        (Array.isArray(prev) ? prev : []).map(collection =>
          collection.id === id ? updatedCollection : collection
        )
      );
      toast.success("Collection updated successfully");
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update collection");
    }
  };

  // Delete a collection
  const deleteCollection = async (id: string) => {
     if (!user) {
      toast.error("You must be signed in to delete collections");
      return;
    }
    try {
      await ApiService.deleteCollection(id);

      // Remove collection from local state
      setCollections(prev => (Array.isArray(prev) ? prev : []).filter(collection => collection.id !== id));

      // Update prompts that were in this collection (set collectionId to null/undefined)
      setPrompts(prev =>
        (Array.isArray(prev) ? prev : []).map(prompt =>
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
      toast.error(error instanceof Error ? error.message : "Failed to delete collection");
    }
  };

  // Add a new tag
  const addTag = async (name: string): Promise<Tag | undefined> => {
     if (!user) {
      toast.error("You must be signed in to add tags");
      return undefined;
    }
    // Check if tag already exists locally (case-insensitive)
    const existingTag = (Array.isArray(tags) ? tags : []).find(tag => tag.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
        toast.info(`Tag "${name}" already exists.`);
        return existingTag; // Return existing tag
    }

    try {
      // Assumes CreateTagDto just needs { name: string }
      const newTag = await ApiService.addTag({ name });
      setTags(prev => [...(Array.isArray(prev) ? prev : []), newTag]); // Append new tag
      toast.success(`Tag "${name}" added successfully`);
      return newTag;
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add tag");
      return undefined;
    }
  };

  // Delete a tag
  const deleteTag = async (id: string) => {
     if (!user) {
      toast.error("You must be signed in to delete tags");
      return;
    }
    try {
      await ApiService.deleteTag(id); // Use ID for deletion

      // Remove tag from local state
      setTags(prev => (Array.isArray(prev) ? prev : []).filter(tag => tag.id !== id));

      // Remove tag from prompts' tag arrays
      setPrompts(prev =>
        (Array.isArray(prev) ? prev : []).map(prompt => ({
          ...prompt,
          tags: (prompt.tags || []).filter(tag => tag.id !== id)
        }))
      );

      // Remove from selected tags filter
      setSelectedTags(prev => prev.filter(tagId => tagId !== id));

      toast.success("Tag deleted successfully");
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete tag");
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    if (!user) {
      toast.error("You must be signed in to manage favorites");
      return;
    }

    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    const newFavoriteStatus = !prompt.isFavorite; // Optimistic update state first

    // Optimistically update UI
    setPrompts(prev =>
        (Array.isArray(prev) ? prev : []).map(p =>
          p.id === id ? { ...p, isFavorite: newFavoriteStatus } : p
        )
      );

    try {
      await ApiService.toggleFavorite(id); // API call
      // No need to update state again if API call succeeds
      toast.success(newFavoriteStatus ? "Added to favorites" : "Removed from favorites");

      // Note: Managing a separate "Favorites" collection might require additional logic
      // depending on how the backend handles favorites vs collections.
      // The current spec only has a toggle endpoint, not add/remove from a specific collection.

    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update favorite status");
      // Rollback optimistic update on error
       setPrompts(prev =>
        (Array.isArray(prev) ? prev : []).map(p =>
          p.id === id ? { ...p, isFavorite: !newFavoriteStatus } : p // Revert back
        )
      );
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

    const originalPrompt = prompts.find(p => p.id === promptId);
    const originalCollectionId = originalPrompt?.collectionId;

    // Optimistic UI Update
    setPrompts(prev =>
      (Array.isArray(prev) ? prev : []).map(prompt =>
        prompt.id === promptId ? { ...prompt, collectionId: collectionId } : prompt
      )
    );
    setCollections(prev =>
      (Array.isArray(prev) ? prev : []).map(collection => {
        // Remove from old collection if it had one
        if (collection.id === originalCollectionId && collection.promptIds?.includes(promptId)) {
           return { ...collection, promptIds: collection.promptIds.filter(pid => pid !== promptId) };
        }
        // Add to new collection
        if (collection.id === collectionId && !collection.promptIds?.includes(promptId)) {
          return { ...collection, promptIds: [...(collection.promptIds || []), promptId] };
        }
        return collection;
      })
    );


    try {
      await ApiService.addPromptToCollection(collectionId, promptId);
      toast.success("Prompt added to collection");
    } catch (error) {
      console.error("Error adding prompt to collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add prompt to collection");
      // Rollback optimistic update
       setPrompts(prev =>
        (Array.isArray(prev) ? prev : []).map(prompt =>
          prompt.id === promptId ? { ...prompt, collectionId: originalCollectionId } : prompt // Revert collectionId
        )
      );
       setCollections(prev =>
        (Array.isArray(prev) ? prev : []).map(collection => {
          // Add back to old collection if it had one
          if (collection.id === originalCollectionId && !collection.promptIds?.includes(promptId)) {
             return { ...collection, promptIds: [...(collection.promptIds || []), promptId] };
          }
          // Remove from new collection
          if (collection.id === collectionId && collection.promptIds?.includes(promptId)) {
            return { ...collection, promptIds: collection.promptIds.filter(pid => pid !== promptId) };
          }
          return collection;
        })
      );
    }
  };

  // Remove prompt from collection
  const removePromptFromCollection = async (promptId: string, collectionId: string) => {
     if (!user) {
      toast.error("You must be signed in to perform this action");
      return;
    }

    // Optimistic UI Update
     setPrompts(prev =>
      (Array.isArray(prev) ? prev : []).map(prompt =>
        prompt.id === promptId && prompt.collectionId === collectionId
          ? { ...prompt, collectionId: undefined } // Set collectionId to undefined
          : prompt
      )
    );
     setCollections(prev =>
      (Array.isArray(prev) ? prev : []).map(collection =>
        collection.id === collectionId
          ? { ...collection, promptIds: (collection.promptIds || []).filter(id => id !== promptId) }
          : collection
      )
    );

    try {
      // API spec uses DELETE /api/collections/{collectionId}/prompts/{promptId}
      await ApiService.removePromptFromCollection(collectionId, promptId);
      toast.success("Prompt removed from collection");
    } catch (error) {
      console.error("Error removing prompt from collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove prompt from collection");
      // Rollback optimistic update
       setPrompts(prev =>
        (Array.isArray(prev) ? prev : []).map(prompt =>
          prompt.id === promptId && prompt.collectionId === undefined // Find the one we just changed
            ? { ...prompt, collectionId: collectionId } // Revert collectionId
            : prompt
        )
      );
       setCollections(prev =>
        (Array.isArray(prev) ? prev : []).map(collection =>
          collection.id === collectionId && !collection.promptIds?.includes(promptId) // If it's missing from the collection we removed from
            ? { ...collection, promptIds: [...(collection.promptIds || []), promptId] } // Add it back
            : collection
        )
      );
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCollection(null);
    setSelectedTags([]);
    setSearchQuery("");
    // Optionally reset sort? setSortOption("newest");
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
    isLoading,
    fetchData // Expose refetch function
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
