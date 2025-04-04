<<<<<<< HEAD
import React, { useState } from "react";
=======
// src/components/CollectionsList.tsx

import React, { useState, useEffect } from "react";
>>>>>>> e765834 (Refactor CollectionsList component to improve form handling and user experience)
import { usePrompts } from "@/context/PromptContext";
import { useAuth } from "@/context/AuthContext";
import { Collection } from "@/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Folder,
  Edit,
  Trash,
  ChevronRight,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names

// Reusable Form Component
interface CollectionFormProps {
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
  initialData?: Partial<Collection>;
  buttonText: string;
  title: string;
}

const CollectionForm: React.FC<CollectionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  buttonText,
  title,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Collection name cannot be empty.");
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
       <DialogHeader> {/* Use DialogHeader for consistent styling */}
         <DialogTitle>{title}</DialogTitle>
       </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Marketing Emails"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this collection"
        />
      </div>
      <DialogFooter> {/* Use DialogFooter for consistent styling */}
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{buttonText}</Button>
      </DialogFooter>
    </form>
  );
};


// Main CollectionsList Component
const CollectionsList: React.FC = () => {
  const {
    collections,
    prompts, // Need prompts to calculate counts
    selectedCollection, // This is string | null (ID)
    setSelectedCollection, // Use this instead of selectCollection
    addCollection,
    deleteCollection,
    updateCollection, // Assuming this exists in the context
  } = usePrompts();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // --- Handlers ---

  const handleCreateCollection = async (data: { name: string; description?: string }) => {
    if (!user) {
      toast.error("You must be logged in to create collections.");
      return;
    }
    try {
      await addCollection(data);
      toast.success(`Collection "${data.name}" created.`);
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection.");
    }
  };

  const handleEditClick = (collection: Collection) => {
    setEditingCollection(collection);
    setIsEditOpen(true);
  };

  const handleUpdateCollection = async (data: { name: string; description?: string }) => {
    if (!user || !editingCollection) {
      toast.error("An error occurred. Please try again.");
      return;
    }
    try {
      // Ensure updateCollection exists before calling
      if (typeof updateCollection !== 'function') {
          console.error("updateCollection function is not available in PromptContext");
          toast.error("Feature not available: Cannot update collection.");
          return;
      }
      await updateCollection(editingCollection.id, data); // Use context function
      toast.success(`Collection "${data.name}" updated.`);
      setIsEditOpen(false);
      setEditingCollection(null);
      // No need to update selectedCollection state directly here,
      // as it's just an ID. The collections array update handles the data change.
      // If the edited collection *was* selected, it remains selected by ID.
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, collectionId: string, collectionName: string) => {
    e.stopPropagation(); // Prevent collection selection when clicking delete
    if (!user) {
      toast.error("You must be logged in to delete collections.");
      return;
    }
    // Optional: Add confirmation dialog here
    if (window.confirm(`Are you sure you want to delete the collection "${collectionName}"? This cannot be undone.`)) {
        try {
            await deleteCollection(collectionId);
            toast.success(`Collection "${collectionName}" deleted.`);
            // If the deleted collection was selected, deselect it
            if (selectedCollection === collectionId) {
                setSelectedCollection(null);
            }
        } catch (error) {
            console.error("Error deleting collection:", error);
            toast.error("Failed to delete collection.");
        }
    }
  };

  const handleSelectCollection = (collection: Collection | null) => {
    const collectionId = collection ? collection.id : null;
    if (selectedCollection === collectionId) {
      setSelectedCollection(null); // Deselect if clicking the same one
    } else {
      setSelectedCollection(collectionId);
    }
  };

  const closeForms = () => {
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setEditingCollection(null);
  }

  // --- Rendering Logic ---

  const renderCollectionItem = (collection: Collection, isDrawerContext = false) => {
    // Calculate prompt count for this collection
    const promptCount = prompts.filter(p => p.collectionId === collection.id).length;
    const isSelected = selectedCollection === collection.id;


    return (
      <div
        key={collection.id}
        className={cn(
          "flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group",
          isSelected && "bg-accent text-accent-foreground"
        )}
        onClick={() => {
            handleSelectCollection(collection);
            // Removed automatic drawer closing on selection for better UX
            // if (isDrawerContext) { }
        }}
      >
        <div className="flex items-center gap-2 truncate min-w-0"> {/* Added min-w-0 for better truncation */}
          <Folder size={16} className="flex-shrink-0"/> {/* Prevent icon shrinking */}
          <span className="truncate flex-1">{collection.name}</span>
          {promptCount > 0 && <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">({promptCount})</span>}
        </div>
        {user && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"> {/* Prevent buttons shrinking */}
            <Button
              variant="ghost"
              size="icon" // Use standard "icon" size
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(collection);
              }}
              aria-label={`Edit collection ${collection.name}`}
              className="h-6 w-6 p-1" // Keep explicit size for smaller icon
            >
              <Edit size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon" // Use standard "icon" size
              className="text-destructive hover:text-destructive h-6 w-6 p-1" // Keep explicit size
              onClick={(e) => handleDelete(e, collection.id, collection.name)}
              aria-label={`Delete collection ${collection.name}`}
            >
              <Trash size={14} />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderCollectionList = (isDrawerContext = false) => (
    <div className="flex flex-col gap-1 py-2">
      {collections.length === 0 && <p className="text-sm text-muted-foreground">No collections yet.</p>} {/* Removed px-2 */}
      {collections.map(collection => renderCollectionItem(collection, isDrawerContext))}
    </div>
  );

  // --- Desktop View ---
  const DesktopView = () => (
    <div className="flex flex-col"> {/* Removed p-4 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Collections</h3>
        {user && (
          <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => !open && closeForms()}>
            {/* Edit Trigger (invisible, controlled by state) */}
             <DialogTrigger asChild>
                <button aria-hidden="true" style={{ display: 'none' }}></button>
             </DialogTrigger>
             {/* Create Trigger */}
             <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
                    <Plus size={16} className="mr-1" /> New
                </Button>
             </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
              {isEditOpen && editingCollection && (
                <CollectionForm
                  title="Edit Collection"
                  onSubmit={handleUpdateCollection}
                  onCancel={closeForms}
                  initialData={editingCollection}
                  buttonText="Save Changes"
                />
              )}
              {isCreateOpen && !isEditOpen && (
                 <CollectionForm
                    title="Create New Collection"
                    onSubmit={handleCreateCollection}
                    onCancel={closeForms}
                    buttonText="Create Collection"
                 />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Separator className="mb-3" />
      {/* Removed flex-grow */}
      <div className="overflow-y-auto pr-1 -mr-1">
         {renderCollectionList()}
      </div>
    </div>
  );

  // --- Mobile View ---
  const MobileView = () => {
    // Find the selected collection object to display its name
    const selectedCollectionObject = selectedCollection
        ? collections.find(c => c.id === selectedCollection)
        : null;

    return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedCollectionObject ? (
             <span className="truncate">{selectedCollectionObject.name}</span>
          ) : (
             "Collections"
          )}
          <ChevronRight size={16} className="ml-2 flex-shrink-0" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Collections</DrawerTitle>
          <DrawerDescription>Select, create, or manage your collections.</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 flex-grow overflow-y-auto max-h-[60vh]"> {/* Added max-height */}
            {renderCollectionList(true)}
        </div>

        <Separator className="my-2" />

        <DrawerFooter className="pt-2">
          {user && (
            <Drawer open={isCreateOpen || isEditOpen} onOpenChange={(open) => !open && closeForms()}>
               {/* Edit Trigger (invisible, controlled by state) */}
               <DrawerTrigger asChild>
                  <button aria-hidden="true" style={{ display: 'none' }}></button>
               </DrawerTrigger>
               {/* Create Trigger */}
               <DrawerTrigger asChild>
                  <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                    <Plus size={16} className="mr-1" /> New Collection
                  </Button>
               </DrawerTrigger>

              <DrawerContent className="p-4"> {/* Added padding to nested drawer */}
                 {/* Nested Drawer Content for Form */}
                 {isEditOpen && editingCollection && (
                    <CollectionForm
                        title="Edit Collection"
                        onSubmit={handleUpdateCollection}
                        onCancel={closeForms}
                        initialData={editingCollection}
                        buttonText="Save Changes"
                    />
                 )}
                 {isCreateOpen && !isEditOpen && (
                    <CollectionForm
                        title="Create New Collection"
                        onSubmit={handleCreateCollection}
                        onCancel={closeForms}
                        buttonText="Create Collection"
                    />
                 )}
                 {/* No explicit close needed here, form cancel/submit handles it */}
              </DrawerContent>
            </Drawer>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

  // --- Return Component ---
  // Add a check for context functions/arrays to prevent runtime errors if context is not fully loaded/implemented
  // Note: selectedCollection can be null, so we don't check its existence here.
  // updateCollection might not exist yet if not implemented in context, handle that in the handler.
  if (!addCollection || !deleteCollection || !setSelectedCollection || !prompts || !collections) {
      // Render loading state or null while context is initializing
      // console.warn("PromptContext data/functions not yet available in CollectionsList");
      return null; // Return null during loading state
  }

  return isMobile ? <MobileView /> : <DesktopView />;
};

export default CollectionsList;
