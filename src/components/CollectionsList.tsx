
import React, { useState } from "react";
import { usePrompts } from "@/context/PromptContext";
import { Collection } from "@/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Folder, 
  Edit, 
  Trash, 
  ChevronRight 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const CollectionsList: React.FC = () => {
  const { 
    collections, 
    addCollection, 
    updateCollection,
    deleteCollection,
    selectedCollection,
    setSelectedCollection
  } = usePrompts();
  
  const isMobile = useIsMobile();
  
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editCollection) {
      updateCollection(editCollection.id, { name, description });
      setEditCollection(null);
    } else {
      addCollection({ name, description });
    }
    
    setName("");
    setDescription("");
    setIsNewCollectionOpen(false);
  };
  
  const handleEdit = (collection: Collection) => {
    setEditCollection(collection);
    setName(collection.name);
    setDescription(collection.description || "");
    setIsNewCollectionOpen(true);
  };
  
  const handleDelete = (id: string) => {
    deleteCollection(id);
  };
  
  const CollectionForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          className="resize-none"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setName("");
            setDescription("");
            setEditCollection(null);
            setIsNewCollectionOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {editCollection ? "Update" : "Create"} Collection
        </Button>
      </div>
    </form>
  );

  const CollectionItem = ({ collection }: { collection: Collection }) => (
    <div 
      className={`
        flex items-center justify-between py-2 px-3 rounded-md cursor-pointer
        ${selectedCollection === collection.id 
          ? "bg-accent text-accent-foreground" 
          : "hover:bg-secondary"
        }
      `}
      onClick={() => setSelectedCollection(
        selectedCollection === collection.id ? null : collection.id
      )}
    >
      <div className="flex items-center gap-2 truncate">
        <Folder className="h-4 w-4 shrink-0" />
        <span className="truncate">{collection.name}</span>
        <span className="text-muted-foreground text-xs">
          ({collection.promptIds.length})
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(collection);
          }}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 text-destructive" 
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(collection.id);
          }}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  // On mobile, use a drawer for collections
  if (isMobile) {
    return (
      <div className="mb-4">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>{selectedCollection 
                  ? collections.find(c => c.id === selectedCollection)?.name || "Collections"
                  : "Collections"
                }</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Collections</DrawerTitle>
              <DrawerDescription>
                Organize your prompts into collections
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-2 max-h-[50vh] overflow-y-auto">
              {collections.map(collection => (
                <CollectionItem key={collection.id} collection={collection} />
              ))}
            </div>
            <DrawerFooter>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    New Collection
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>
                      {editCollection ? "Edit" : "Create"} Collection
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4">
                    <CollectionForm />
                  </div>
                </DrawerContent>
              </Drawer>
              <DrawerClose asChild>
                <Button variant="ghost">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {isNewCollectionOpen && (
          <Drawer open={isNewCollectionOpen} onOpenChange={setIsNewCollectionOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>
                  {editCollection ? "Edit" : "Create"} Collection
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4">
                <CollectionForm />
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    );
  }

  // On desktop, show collections sidebar
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Collections</h3>
        <Dialog open={isNewCollectionOpen} onOpenChange={setIsNewCollectionOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editCollection ? "Edit" : "Create"} Collection
              </DialogTitle>
            </DialogHeader>
            <CollectionForm />
          </DialogContent>
        </Dialog>
      </div>
      
      <Separator />
      
      <div className="space-y-1">
        {collections.map(collection => (
          <CollectionItem key={collection.id} collection={collection} />
        ))}
      </div>
    </div>
  );
};

export default CollectionsList;
