import { supabase } from "@/integrations/supabase/client";
import { Prompt, Tag, Collection, User } from "@/types";
import { toast } from "sonner";

// Auth related functions
export const signUp = async (username: string, email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  });
  
  if (error) throw error;
  
  return data.user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  return data.user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get the user profile from the profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email
  };
};

// Collections
export const getCollections = async (): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select('*');
  
  if (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
  
  // For each collection, get its prompts
  const collectionsWithPrompts = await Promise.all(
    data.map(async (collection) => {
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('id')
        .eq('collection_id', collection.id);
      
      if (promptsError) {
        console.error("Error fetching prompts for collection:", promptsError);
        return { ...collection, promptIds: [] };
      }
      
      return {
        id: collection.id,
        name: collection.name,
        description: collection.description || undefined,
        promptIds: promptsData.map(p => p.id)
      };
    })
  );
  
  return collectionsWithPrompts;
};

export const addCollection = async (name: string, description?: string): Promise<Collection> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from('collections')
    .insert({ 
      name, 
      description, 
      user_id: user.id 
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding collection:", error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    promptIds: []
  };
};

export const updateCollection = async (id: string, { name, description }: Partial<Collection>): Promise<void> => {
  const { error } = await supabase
    .from('collections')
    .update({ 
      name, 
      description,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) {
    console.error("Error updating collection:", error);
    throw error;
  }
};

export const deleteCollection = async (id: string): Promise<void> => {
  // First update any prompts that have this collection
  const { error: updateError } = await supabase
    .from('prompts')
    .update({ collection_id: null })
    .eq('collection_id', id);
  
  if (updateError) {
    console.error("Error updating prompts collection reference:", updateError);
    throw updateError;
  }
  
  // Then delete the collection
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
};

// Tags
export const getTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from('tags')
    .select('*');
  
  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
  
  return data.map(tag => ({
    id: tag.id,
    name: tag.name
  }));
};

export const addTag = async (name: string): Promise<Tag> => {
  // Check if tag exists first
  const { data: existingTag, error: findError } = await supabase
    .from('tags')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
  
  if (findError) {
    console.error("Error checking for existing tag:", findError);
  }
  
  // If tag exists, return it
  if (existingTag) {
    return {
      id: existingTag.id,
      name: existingTag.name
    };
  }
  
  // Otherwise, create a new tag
  const { data, error } = await supabase
    .from('tags')
    .insert({ name })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding tag:", error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name
  };
};

export const deleteTag = async (id: string): Promise<void> => {
  // First delete all prompt_tags entries for this tag
  const { error: promptTagsError } = await supabase
    .from('prompt_tags')
    .delete()
    .eq('tag_id', id);
  
  if (promptTagsError) {
    console.error("Error deleting prompt_tags entries:", promptTagsError);
    throw promptTagsError;
  }
  
  // Then delete the tag
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting tag:", error);
    throw error;
  }
};

// Prompts
export const getPrompts = async (): Promise<Prompt[]> => {
  const { data, error } = await supabase
    .from('prompts')
    .select('*');
  
  if (error) {
    console.error("Error fetching prompts:", error);
    return [];
  }
  
  // For each prompt, get its tags
  const promptsWithTags = await Promise.all(
    data.map(async (prompt) => {
      const { data: promptTags, error: promptTagsError } = await supabase
        .from('prompt_tags')
        .select('tag_id')
        .eq('prompt_id', prompt.id);
      
      if (promptTagsError) {
        console.error("Error fetching prompt tags:", promptTagsError);
        return { ...prompt, tags: [] };
      }
      
      // Get all the tag details for this prompt
      const tagIds = promptTags.map(pt => pt.tag_id);
      
      let tags: Tag[] = [];
      if (tagIds.length > 0) {
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds);
        
        if (tagsError) {
          console.error("Error fetching tags for prompt:", tagsError);
        } else {
          tags = tagsData.map(tag => ({
            id: tag.id,
            name: tag.name
          }));
        }
      }
      
      // Get version history if available
      const { data: versionsData, error: versionsError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', prompt.id)
        .order('version', { ascending: false });
      
      let versionHistory = undefined;
      if (!versionsError && versionsData.length > 0) {
        versionHistory = versionsData.map(version => ({
          version: version.version,
          content: version.content,
          updatedAt: new Date(version.created_at)
        }));
      }
      
      // Get the username of who created this prompt
      let createdByUsername = undefined;
      if (prompt.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', prompt.user_id)
          .maybeSingle();
        
        if (!userError && userData) {
          createdByUsername = userData.username;
        }
      }
      
      return {
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        tags,
        createdAt: new Date(prompt.created_at),
        updatedAt: new Date(prompt.updated_at),
        collectionId: prompt.collection_id || undefined,
        isFavorite: prompt.is_favorite,
        version: prompt.version,
        versionHistory,
        isPrivate: prompt.is_private,
        createdBy: prompt.user_id,
        createdByUsername
      };
    })
  );
  
  return promptsWithTags;
};

export const addPrompt = async (promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "version">): Promise<Prompt> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  // First, insert the prompt
  const { data, error } = await supabase
    .from('prompts')
    .insert({ 
      title: promptData.title,
      content: promptData.content,
      collection_id: promptData.collectionId || null,
      is_favorite: promptData.isFavorite || false,
      is_private: promptData.isPrivate || false,
      user_id: user.id
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding prompt:", error);
    throw error;
  }
  
  // Add tags if any
  if (promptData.tags && promptData.tags.length > 0) {
    const promptTagInserts = promptData.tags.map(tag => ({
      prompt_id: data.id,
      tag_id: tag.id
    }));
    
    const { error: tagsError } = await supabase
      .from('prompt_tags')
      .insert(promptTagInserts);
    
    if (tagsError) {
      console.error("Error adding prompt tags:", tagsError);
      // We don't throw here since the prompt was created successfully
    }
  }
  
  // Create the prompt object to return
  const prompt: Prompt = {
    id: data.id,
    title: data.title,
    content: data.content,
    tags: promptData.tags || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    collectionId: data.collection_id || undefined,
    isFavorite: data.is_favorite,
    version: data.version,
    isPrivate: data.is_private,
    createdBy: data.user_id,
    createdByUsername: user.user_metadata?.username
  };
  
  return prompt;
};

export const updatePrompt = async (id: string, data: Partial<Prompt>): Promise<void> => {
  // Check if content is changing, and we need to save version history
  if (data.content !== undefined) {
    // Get current prompt details first
    const { data: currentPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('content, version')
      .eq('id', id)
      .single();
    
    if (!fetchError && currentPrompt) {
      // Save the current version to history
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: id,
          content: currentPrompt.content,
          version: currentPrompt.version
        });
      
      if (versionError) {
        console.error("Error saving prompt version history:", versionError);
      }
      
      // Increment version in the update
      data.version = currentPrompt.version + 1;
    }
  }
  
  // Update the prompt
  const { error } = await supabase
    .from('prompts')
    .update({ 
      title: data.title,
      content: data.content,
      collection_id: data.collectionId || null,
      is_favorite: data.isFavorite,
      is_private: data.isPrivate,
      version: data.version,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) {
    console.error("Error updating prompt:", error);
    throw error;
  }
  
  // Update tags if provided
  if (data.tags) {
    // First, delete all existing tags for this prompt
    const { error: deleteTagsError } = await supabase
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', id);
    
    if (deleteTagsError) {
      console.error("Error deleting existing prompt tags:", deleteTagsError);
      throw deleteTagsError;
    }
    
    // Then add the new tags
    if (data.tags.length > 0) {
      const promptTagInserts = data.tags.map(tag => ({
        prompt_id: id,
        tag_id: tag.id
      }));
      
      const { error: addTagsError } = await supabase
        .from('prompt_tags')
        .insert(promptTagInserts);
      
      if (addTagsError) {
        console.error("Error adding new prompt tags:", addTagsError);
        throw addTagsError;
      }
    }
  }
};

export const deletePrompt = async (id: string): Promise<void> => {
  // Delete the prompt (cascade will delete related prompt_tags and version history)
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting prompt:", error);
    throw error;
  }
};

export const toggleFavorite = async (id: string, isFavorite: boolean): Promise<void> => {
  const { error } = await supabase
    .from('prompts')
    .update({ 
      is_favorite: isFavorite,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) {
    console.error("Error toggling favorite status:", error);
    throw error;
  }
};

export const addPromptToCollection = async (promptId: string, collectionId: string): Promise<void> => {
  const { error } = await supabase
    .from('prompts')
    .update({ 
      collection_id: collectionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', promptId);
  
  if (error) {
    console.error("Error adding prompt to collection:", error);
    throw error;
  }
};

export const removePromptFromCollection = async (promptId: string): Promise<void> => {
  const { error } = await supabase
    .from('prompts')
    .update({ 
      collection_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', promptId);
  
  if (error) {
    console.error("Error removing prompt from collection:", error);
    throw error;
  }
};
