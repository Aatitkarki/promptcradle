
import React, { useState } from "react";
import { usePrompts } from "@/context/PromptContext";
import { Prompt, Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import TagsInput from "./TagsInput";
import { Switch } from "@/components/ui/switch";

interface PromptFormProps {
  prompt?: Prompt;
  onSuccess?: () => void;
}

const PromptForm: React.FC<PromptFormProps> = ({ 
  prompt,
  onSuccess 
}) => {
  const { addPrompt, updatePrompt, collections } = usePrompts();
  
  const [title, setTitle] = useState(prompt?.title || "");
  const [content, setContent] = useState(prompt?.content || "");
  const [tags, setTags] = useState<Tag[]>(prompt?.tags || []);
  const [collectionId, setCollectionId] = useState<string | undefined>(prompt?.collectionId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(prompt?.isPrivate || false);
  
  const isEditing = !!prompt;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        updatePrompt(prompt.id, {
          title,
          content,
          tags,
          collectionId,
          isPrivate
        });
      } else {
        addPrompt({
          title,
          content,
          tags,
          collectionId,
          isFavorite: false,
          isPrivate
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving prompt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content">Prompt Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your prompt here..."
            className="h-32 resize-none"
            required
          />
          <p className="text-xs text-muted-foreground">
            Use {"{{placeholder}}"} syntax for dynamic values.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <TagsInput
            selectedTags={tags}
            onChange={setTags}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="collection">Collection</Label>
          <Select
            value={collectionId}
            onValueChange={(value) => setCollectionId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="privacy"
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
          <Label htmlFor="privacy" className="cursor-pointer">
            Private Prompt
          </Label>
          <p className="text-xs text-muted-foreground ml-1">
            (Only visible to you when signed in)
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isEditing ? "Update" : "Save"} Prompt
        </Button>
      </div>
    </form>
  );
};

export default PromptForm;
