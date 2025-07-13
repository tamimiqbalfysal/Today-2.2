
"use client"

import type { Post } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onDelete?: (postId: string, mediaUrl?: string) => void;
}

function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
    const timestamp = post.timestamp?.toDate ? post.timestamp.toDate() : new Date();
    const isAuthor = post.authorId === currentUserId;
    const authorInitial = post.authorName ? post.authorName.charAt(0) : 'U';

    return (
        <div 
            className="bg-card p-6 rounded-2xl w-full shadow-md transition-shadow hover:shadow-lg border-4 border-black relative"
        >
            {isAuthor && onDelete && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your post.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDelete(post.id, post.mediaURL)}
                        >
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-12 h-12 border-2 border-primary/50">
                    <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
                    <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">{authorInitial}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-lg text-primary">{post.authorName || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                    </p>
                </div>
            </div>
            {post.content && <p className="font-sans text-card-foreground text-lg mb-4 whitespace-pre-wrap">{post.content}</p>}
            
            {post.mediaURL && (
                <div className="relative w-full rounded-lg mb-4 overflow-hidden aspect-video border">
                    {post.mediaType === 'image' && (
                        <Image src={post.mediaURL} alt="Post media" layout="fill" objectFit="cover" />
                    )}
                    {post.mediaType === 'video' && (
                        <video src={post.mediaURL} controls className="w-full h-full object-cover bg-black" />
                    )}
                </div>
            )}
            
            <div className="flex justify-around items-center pt-3 border-t border-border">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary transition duration-200 text-base">
                    <Heart className="mr-2" />
                    <span className="font-semibold">Like</span>
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-primary transition duration-200 text-base">
                    <MessageCircle className="mr-2" />
                    <span className="font-semibold">Comment</span>
                </Button>
            </div>
        </div>
    );
}


interface PostFeedProps {
  posts: Post[];
  currentUserId?: string;
  onDeletePost: (postId: string, mediaUrl?: string) => void;
}

export function PostFeed({ posts, currentUserId, onDeletePost }: PostFeedProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-semibold font-headline">No tales yet!</h3>
        <p className="text-sm">Be the first to share something magical!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={onDeletePost} />
      ))}
    </div>
  );
}
