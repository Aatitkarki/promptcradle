import { Prompt, Tag, Collection, User } from "@/types";

export const signUp = async (
  username: string,
  email: string,
  password: string
) => {
  return null;
};

export const signIn = async (email: string, password: string) => {
  return null;
};

export const signOut = async () => {
  return null;
};

export const getCurrentUser = async (): Promise<any | null> => {
  return null;
};

// Collections
export const getCollections = async (): Promise<any[]> => {
  return [];
};

export const addCollection = async (
  name: string,
  description?: string
): Promise<any> => {
  return null;
};

export const updateCollection = async (
  id: string,
  { name, description }: Partial<any>
): Promise<void> => {
  return null;
};

export const deleteCollection = async (id: string): Promise<void> => {
  return null;
};

// Tags
export const getTags = async (): Promise<any[]> => {
  return [];
};

export const addTag = async (name: string): Promise<any> => {
  return null;
};

export const deleteTag = async (id: string): Promise<void> => {
  return null;
};

// Prompts
export const getPrompts = async (): Promise<any[]> => {
  const response = await fetch("http://localhost:3000/prompt");
  const data = await response.json();
  return data;
};

export const addPrompt = async (
  promptData: Omit<any, "id" | "createdAt" | "updatedAt" | "version">
): Promise<any> => {
  return null;
};

export const updatePrompt = async (
  id: string,
  data: Partial<any>
): Promise<void> => {
  return null;
};

export const deletePrompt = async (id: string): Promise<void> => {
  return null;
};

export const toggleFavorite = async (
  id: string,
  isFavorite: boolean
): Promise<void> => {
  return null;
};

export const addPromptToCollection = async (
  promptId: string,
  collectionId: string
): Promise<void> => {
  return null;
};

export const removePromptFromCollection = async (
  promptId: string
): Promise<void> => {
  return null;
};
