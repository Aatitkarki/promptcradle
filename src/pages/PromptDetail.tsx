
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePrompts } from "@/context/PromptContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Copy,
  Edit,
  Trash,
  Star,
  StarOff,
  History,
  Share,
  Folder,
  Download,
  Variable,
  TextCursorInput,
  Check,
  RefreshCcw
} from "lucide-react";
import PromptForm from "@/components/PromptForm";
import { toast } from "sonner";

const PromptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { prompts, collections, deletePrompt, toggleFavorite } = usePrompts();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [filledPrompt, setFilledPrompt] = useState("");
  
  // Find the prompt by ID
  const prompt = prompts.find(p => p.id === id);
  
  // If prompt not found, navigate back to home
  if (!prompt) {
    navigate("/");
    return null;
  }
  
  // Extract placeholders when prompt content changes
  useEffect(() => {
    if (prompt?.content) {
      // RegEx to find all {placeholder} occurrences
      const regex = /{([^{}]+)}/g;
      const matches = [...prompt.content.matchAll(regex)];
      const extractedPlaceholders = matches.map(match => match[1]);
      
      // Filter out duplicates
      const uniquePlaceholders = [...new Set(extractedPlaceholders)];
      setPlaceholders(uniquePlaceholders);
      
      // Initialize placeholder values
      const initialValues: Record<string, string> = {};
      uniquePlaceholders.forEach(placeholder => {
        initialValues[placeholder] = "";
      });
      setPlaceholderValues(initialValues);
      
      // Initialize filled prompt with original content
      setFilledPrompt(prompt.content);
    }
  }, [prompt?.content]);
  
  // Update filled prompt when placeholder values change
  useEffect(() => {
    if (prompt?.content && Object.keys(placeholderValues).length > 0) {
      let filled = prompt.content;
      Object.entries(placeholderValues).forEach(([key, value]) => {
        filled = filled.replace(new RegExp(`{${key}}`, 'g'), value || `{${key}}`);
      });
      setFilledPrompt(filled);
    }
  }, [placeholderValues, prompt?.content]);
  
  const handlePlaceholderChange = (placeholder: string, value: string) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };
  
  const handleResetPlaceholders = () => {
    // Reset all placeholder values to empty strings
    const resetValues: Record<string, string> = {};
    placeholders.forEach(placeholder => {
      resetValues[placeholder] = "";
    });
    setPlaceholderValues(resetValues);
    toast.success("All placeholders reset");
  };
  
  const collection = prompt.collectionId
    ? collections.find(c => c.id === prompt.collectionId)
    : null;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    toast.success("Prompt copied to clipboard");
  };
  
  const handleCopyWithPlaceholders = () => {
    navigator.clipboard.writeText(filledPrompt);
    toast.success("Filled prompt copied to clipboard");
  };
  
  const handleDelete = () => {
    deletePrompt(prompt.id);
    navigate("/");
  };
  
  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };
  
  const handleExport = () => {
    const promptData = JSON.stringify(prompt, null, 2);
    const blob = new Blob([promptData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Prompt exported successfully");
  };
  
  // Format dates for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <Button
        variant="ghost"
        className="mb-4 pl-0 gap-1"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Prompts
      </Button>
      
      <div className="space-y-6">
        <Card className="overflow-hidden glass-panel">
          <CardHeader className="p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {prompt.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {collection && (
                    <Badge variant="outline" className="gap-1">
                      <Folder className="h-3 w-3 mr-1" />
                      {collection.name}
                    </Badge>
                  )}
                  
                  {prompt.tags.map(tag => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-1 ${
                    prompt.isFavorite ? "text-yellow-500" : ""
                  }`}
                  onClick={() => toggleFavorite(prompt.id)}
                >
                  {prompt.isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                  {prompt.isFavorite ? "Favorited" : "Favorite"}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs defaultValue="prompt">
              <TabsList>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="placeholders" disabled={placeholders.length === 0}>
                  Placeholders {placeholders.length > 0 && `(${placeholders.length})`}
                </TabsTrigger>
                <TabsTrigger value="history" disabled={!prompt.versionHistory?.length}>
                  History ({prompt.versionHistory?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompt" className="mt-4">
                <Textarea
                  value={prompt.content}
                  readOnly
                  className="min-h-[200px] resize-none"
                />
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Version: {prompt.version}</p>
                  <p>Created: {formatDate(prompt.createdAt)}</p>
                  <p>Last Updated: {formatDate(prompt.updatedAt)}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="placeholders" className="mt-4">
                {placeholders.length > 0 ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {placeholders.map((placeholder) => (
                        <div key={placeholder} className="space-y-2">
                          <Label htmlFor={`placeholder-${placeholder}`} className="flex items-center gap-1.5">
                            <Variable className="h-4 w-4" />
                            {placeholder}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`placeholder-${placeholder}`}
                              value={placeholderValues[placeholder]}
                              onChange={(e) => handlePlaceholderChange(placeholder, e.target.value)}
                              placeholder={`Enter value for ${placeholder}...`}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <Label className="flex items-center gap-1.5 mb-2">
                        <TextCursorInput className="h-4 w-4" />
                        Preview with replaced placeholders
                      </Label>
                      <Textarea
                        value={filledPrompt}
                        readOnly
                        className="min-h-[200px] resize-none"
                      />
                      
                      <div className="flex items-center justify-between mt-4">
                        <Button
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={handleResetPlaceholders}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Reset Values
                        </Button>
                        
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1"
                          onClick={handleCopyWithPlaceholders}
                        >
                          <Copy className="h-4 w-4" />
                          Copy with Values
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No placeholders found in this prompt. Use {"{placeholder}"} syntax in your prompt content.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                {prompt.versionHistory && prompt.versionHistory.length > 0 ? (
                  <div className="space-y-4">
                    {prompt.versionHistory.map((version) => (
                      <div key={version.version} className="space-y-2 border-b pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center gap-1.5">
                            <History className="h-4 w-4" />
                            Version {version.version}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(version.updatedAt)}
                          </span>
                        </div>
                        <Textarea
                          value={version.content}
                          readOnly
                          className="min-h-[120px] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No version history available for this prompt
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="p-6 pt-0 flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleShareLink}
              >
                <Share className="h-4 w-4" />
                Share Link
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-destructive"
              onClick={handleDelete}
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
          </DialogHeader>
          <PromptForm
            prompt={prompt}
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PromptDetail;
