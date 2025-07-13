
"use client"

import { useState } from "react";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "../ui/input";
import { Paperclip, X } from "lucide-react";
import Image from "next/image";

interface CreatePostFormProps {
  user: User;
  onAddPost: (content: string, mediaFile: File | null) => Promise<void>;
}

export function CreatePostForm({ user, onAddPost }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setMediaFile(null);
        setMediaPreview(null);
    }
  };
  
  const clearMedia = () => {
      setMediaFile(null);
      setMediaPreview(null);
      // Also clear the file input
      const input = document.getElementById('media-upload') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;

    setIsSubmitting(true);
    try {
      await onAddPost(content, mediaFile);
      setContent("");
      clearMedia();
    } catch (error) {
      // The error is now handled and displayed by the parent component (TodayPage).
      // We just need to catch it here to ensure the loading state is reset.
      console.error("Error submitting post from form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user.name ? user.name.charAt(0) : "🥳";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10 border-2 border-primary/50">
            <AvatarImage src={user.photoURL ?? `https://placehold.co/40x40/FF69B4/FFFFFF?text=${userInitial}`} alt={user.name ?? ""} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">{userInitial}</AvatarFallback>
            </Avatar>
            <Textarea
            placeholder={`What's happening today, ${user.name}?`}
            className="flex-1 p-3 rounded-lg bg-secondary border-border focus:outline-none focus:ring-2 focus:ring-primary text-secondary-foreground placeholder:text-muted-foreground text-sm h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            />
        </div>

        {mediaPreview && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                {mediaFile?.type.startsWith("image/") && (
                    <Image src={mediaPreview} alt="Media preview" layout="fill" objectFit="cover" />
                )}
                {mediaFile?.type.startsWith("video/") && (
                    <video src={mediaPreview} controls className="w-full h-full object-cover bg-black" />
                )}
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full z-10" onClick={clearMedia} type="button">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}

        <div className="flex justify-between items-center">
            <Button asChild variant="ghost" size="icon" className="relative cursor-pointer">
                <div>
                  <Paperclip />
                  <Input 
                      id="media-upload"
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                      disabled={isSubmitting}
                  />
                  <span className="sr-only">Attach media</span>
                </div>
            </Button>
            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || (!content.trim() && !mediaFile)}>
                    {isSubmitting ? "Posting..." : "Post"}
                </Button>
            </div>
        </div>
    </form>
  );
}
