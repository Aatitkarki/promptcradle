import { Prompt, Tag, Collection, User, SortOption } from "@/types";

// --- Configuration ---
const API_BASE_URL = "http://localhost:3000"; // Replace with your actual backend URL

// Helper function to handle API requests
const fetchApi = async (
  endpoint: string,
  options: RequestInit = {},
  isAuthRequired = true
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add Authorization header if required and token exists
  if (isAuthRequired) {
    const token = localStorage.getItem("authToken"); // Assuming token is stored in localStorage
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Handle cases where auth is required but no token is found
      // Maybe redirect to login or throw an error
      console.warn(`Auth token not found for protected route: ${endpoint}`);
      // For now, let the request proceed, backend should handle unauthorized access
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Attempt to parse error response from backend
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      console.error("API Error:", response.status, response.statusText, errorData);
      throw new Error(
        errorData?.message || `HTTP error! status: ${response.status}`
      );
    }

    // Handle responses with no content (e.g., 204 No Content)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch API error:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
};

// --- Auth ---
export const signUp = async (
  signupData: any /* Use SignupDto type when defined */
): Promise<User> => {
  // Assuming the backend returns the user object upon successful signup
  const response = await fetchApi("/auth/signup", {
    method: "POST",
    body: JSON.stringify(signupData),
  }, false); // Auth not required for signup
  // TODO: Store token if returned upon signup? Depends on backend implementation.
  return response; // Assuming response is the user object
};

export const signIn = async (
  loginData: any /* Use LoginDto type when defined */
): Promise<{ access_token: string; user: User }> => { // Assuming backend returns token and user info
  const response = await fetchApi("/auth/login", {
    method: "POST",
    body: JSON.stringify(loginData),
  }, false); // Auth not required for login

  if (response && response.access_token) {
    localStorage.setItem("authToken", response.access_token); // Store the token
  }
  // Assuming the backend returns { access_token: '...', user: {...} }
  // Adjust based on actual backend response structure
  return response;
};

export const signOut = async (): Promise<void> => {
  localStorage.removeItem("authToken"); // Remove the token on sign out
  // No specific backend endpoint for signout in the spec, handle client-side.
  return Promise.resolve();
};

// Helper to get user from stored token (client-side check)
// A dedicated `/auth/me` endpoint would be better
export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return null;
  }
  // Decode token to get user info (basic, assumes JWT structure)
  // WARNING: This is insecure for sensitive data, only use for non-critical info like username/id
  // A backend call to validate the token and get user data is strongly recommended.
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Assuming payload contains user info like { userId: '...', username: '...', email: '...' }
    // Adjust based on your actual JWT payload structure
    if (payload && payload.userId && payload.username && payload.email) {
       return { id: payload.userId, username: payload.username, email: payload.email };
    }
    // If payload structure is different or token is invalid/expired, fetch from backend
    // Example: return await fetchApi('/api/users/me'); // Assuming a /me endpoint exists
    console.warn("Could not decode user info from token payload or payload structure mismatch.");
    localStorage.removeItem("authToken"); // Clear invalid token
    return null;
  } catch (error) {
    console.error("Error decoding token:", error);
    localStorage.removeItem("authToken"); // Clear corrupted token
    return null;
  }
};


// --- Users ---
export const updateUserProfile = async (
  userId: string,
  updateData: any /* Use UpdateUserRequest type when defined */
): Promise<User> => { // Assuming backend returns updated user
  return fetchApi(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
};

// --- Prompts ---
export const getPrompts = async (params: {
  collectionId?: string;
  searchQuery?: string;
  sortBy?: SortOption | string; // Allow string for flexibility if backend uses different values
  page?: number;
  limit?: number;
  isFavorite?: boolean;
  userId?: string; // Filter by user?
}): Promise<Prompt[]> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  // Determine if auth is needed - maybe public prompts don't require auth?
  // For simplicity, assume auth is required to view any prompts for now.
  return fetchApi(`/api/prompts?${queryParams.toString()}`);
};

export const getPromptById = async (promptId: string): Promise<Prompt> => {
  return fetchApi(`/api/prompts/${promptId}`);
};

export const addPrompt = async (
  promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt" | "version" | "tags"> & { tags?: string[] } // Accept tag names/ids
): Promise<Prompt> => { // Assuming backend returns the created prompt
  // TODO: Map tag names/ids if needed based on backend expectation for CreatePromptDto
  return fetchApi("/api/prompts", {
    method: "POST",
    body: JSON.stringify(promptData),
  });
};

export const updatePrompt = async (
  promptId: string,
  updateData: Partial<Omit<Prompt, "tags">> & { tags?: string[] } // Accept tag names/ids
): Promise<Prompt> => { // Assuming backend returns the updated prompt
  // TODO: Map tag names/ids if needed based on backend expectation for UpdatePromptDto
  return fetchApi(`/api/prompts/${promptId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
};

export const deletePrompt = async (promptId: string): Promise<void> => {
  await fetchApi(`/api/prompts/${promptId}`, { method: "DELETE" });
  return null; // Corresponds to 204 No Content
};

export const toggleFavorite = async (promptId: string): Promise<void> => { // Assuming returns 201 on success, no body needed?
  await fetchApi(`/api/prompts/${promptId}/favorite`, { method: "POST" });
  return null;
};

// --- Tags ---
export const getTags = async (): Promise<Tag[]> => {
  // Assuming fetching tags might not require auth if they are public
  return fetchApi("/api/tags", {}, false); // Example: Set auth requirement to false
};

export const addTag = async (
  tagData: any /* Use CreateTagDto type when defined */
): Promise<Tag> => { // Assuming backend returns the created tag
  return fetchApi("/api/tags", {
    method: "POST",
    body: JSON.stringify(tagData),
  });
};

export const deleteTag = async (tagIdOrName: string): Promise<void> => {
  await fetchApi(`/api/tags/${encodeURIComponent(tagIdOrName)}`, { method: "DELETE" });
  return null; // Corresponds to 204 No Content
};

// --- Collections ---
export const getCollections = async (): Promise<Collection[]> => {
  return fetchApi("/api/collections");
};

export const getCollectionById = async (collectionId: string): Promise<Collection> => {
  return fetchApi(`/api/collections/${collectionId}`);
};

export const addCollection = async (
  collectionData: any /* Use CreateCollectionDto type when defined */
): Promise<Collection> => { // Assuming backend returns the created collection
  return fetchApi("/api/collections", {
    method: "POST",
    body: JSON.stringify(collectionData),
  });
};

export const updateCollection = async (
  collectionId: string,
  updateData: any /* Use UpdateCollectionDto type when defined */
): Promise<Collection> => { // Assuming backend returns the updated collection
  return fetchApi(`/api/collections/${collectionId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  await fetchApi(`/api/collections/${collectionId}`, { method: "DELETE" });
  return null; // Corresponds to 204 No Content
};

export const addPromptToCollection = async (
  collectionId: string,
  promptId: string
): Promise<void> => { // Assuming 200 OK with no specific body needed
  await fetchApi(`/api/collections/${collectionId}/prompts/${promptId}`, {
    method: "POST",
  });
   return null;
};

export const removePromptFromCollection = async (
  collectionId: string,
  promptId: string
): Promise<void> => { // Assuming 200 OK with no specific body needed
  await fetchApi(`/api/collections/${collectionId}/prompts/${promptId}`, {
    method: "DELETE",
  });
   return null;
};
