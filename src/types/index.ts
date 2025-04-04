export type Tag = {
  id: string;
  name: string;
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  promptIds: string[];
};

export type Prompt = {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  collectionId?: string;
  isFavorite: boolean;
  version: number;
  versionHistory?: {
    version: number;
    content: string;
    updatedAt: Date;
  }[];
  isPrivate?: boolean;
  createdBy?: string;
  createdByUsername?: string;
};

export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'updated';

export type ViewMode = 'grid' | 'list';

export type User = {
  id: string;
  username: string;
  email: string;
};
