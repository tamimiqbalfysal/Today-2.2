
'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { User, Post } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { CreatePostForm } from '@/components/fintrack/add-transaction-dialog';
import { PostFeed } from '@/components/fintrack/recent-transactions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThinkCodeDialog } from '@/components/fintrack/gift-code-dialog';

function TodaySkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header isVisible={true} />
      <main className="container mx-auto p-4 max-w-5xl space-y-6 flex-1">
          <Skeleton className="h-[450px] w-full" />
          <Skeleton className="h-[450px] w-full" />
      </main>
    </div>
  );
}


export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isThinkCodeDialogOpen, setIsThinkCodeDialogOpen] = useState(false);

  useEffect(() => {
    // Don't run on server or if user data is loading.
    if (typeof window === 'undefined' || authLoading) return;
    
    // If user exists and has NOT redeemed a code, show the gift code dialog after a delay.
    if (user && (user.redeemedThinkCodes || 0) === 0) {
      const intervalId = setInterval(() => {
        setIsThinkCodeDialogOpen(true);
      }, 60000); // 1 minute

      // Cleanup function to clear the interval when the component unmounts
      // or when the user object changes (e.g., after redeeming a code).
      return () => clearInterval(intervalId);
    }
  }, [user, authLoading]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const currentScrollY = scrollContainerRef.current.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }
  };

  useEffect(() => {
    if (authLoading || !db) return; 
    
    if (!user) {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    const postsCol = collection(db, 'posts');
    const q = query(postsCol, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPosts: Post[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Post;
      });
      setPosts(fetchedPosts);
      setIsDataLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      let description = "Could not load posts.";
      if (error.code === 'permission-denied') {
        description = "You don't have permission to view posts. Please check your Firestore security rules in the Firebase Console.";
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: description,
      });
      setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, toast]);

  const onDeletePost = async (postId: string, mediaUrl?: string) => {
      if (!db || !storage) {
          toast({ variant: 'destructive', title: 'Error', description: 'Firebase not configured.' });
          return;
      }
      try {
          await deleteDoc(doc(db, 'posts', postId));
          if (mediaUrl) {
              const storageRef = ref(storage, mediaUrl);
              await deleteObject(storageRef);
          }
          toast({ title: 'Success', description: 'Post deleted successfully.' });
      } catch (error: any) {
          console.error("Error deleting post:", error);
          let description = "An unexpected error occurred while deleting the post.";
          if (error.code === 'permission-denied') {
              description = "You do not have permission to delete this post.";
          }
          if (error.code === 'storage/object-not-found') {
              console.warn("Media file not found in storage, but deleting post document anyway.");
          } else if (error.code?.startsWith('storage/')) {
              description = "Could not delete the media file associated with the post.";
          }
          toast({ variant: 'destructive', title: 'Deletion Failed', description });
      }
  };
  
  if (authLoading || (isDataLoading && user)) {
    return <TodaySkeleton />;
  }

  const handleAddPost = async (content: string, file: File | null) => {
      if (!user || !db || (!content.trim() && !file)) return;
      
      try {
        let mediaURL: string | undefined = undefined;
        let mediaType: 'image' | 'video' | undefined = undefined;

        if (file && storage) {
          const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          mediaURL = await getDownloadURL(snapshot.ref);
          if (file.type.startsWith('image/')) {
            mediaType = 'image';
          } else if (file.type.startsWith('video/')) {
            mediaType = 'video';
          }
        }

        await addDoc(collection(db, 'posts'), {
          authorId: user.uid,
          authorName: user.name,
          authorPhotoURL: user.photoURL || `https://placehold.co/40x40/FF69B4/FFFFFF?text=${user.name.charAt(0)}`,
          content: content,
          timestamp: Timestamp.now(),
          likes: [],
          comments: [],
          ...(mediaURL && { mediaURL }),
          ...(mediaType && { mediaType }),
        });
        toast({
          title: "Post Created!",
          description: "Your story has been successfully shared.",
        });
      } catch (error: any) {
          console.error("Error adding post:", error);
          let description = "An unexpected error occurred while creating your post.";
          
          if (error.code === 'storage/retry-limit-exceeded' || error.code === 'storage/unauthorized') {
            description = `Action Required: Your Firebase Storage security rules are preventing file uploads. Please go to the Firebase Console, navigate to Storage > Rules, and update your rules to allow writes. For example: "allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;"`;
          } else if (error.code === 'permission-denied') {
            description = "Permission denied. Please check your Firestore security rules in the Firebase Console.";
          }
          
          toast({
            variant: "destructive",
            title: "Could Not Create Post",
            description: description,
            duration: 9000
          });

          // IMPORTANT: Re-throw the error so the form knows the submission failed.
          throw error;
      }
  };

  return (
    <AuthGuard>
        <div className="flex flex-col h-screen">
          <Header isVisible={isHeaderVisible} />
          <main 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
             <div className="container mx-auto max-w-2xl p-4 flex-1">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Share a New Tale</CardTitle>
                            <CardDescription>What magical things are happening today?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreatePostForm 
                                user={user!} 
                                onAddPost={handleAddPost}
                            />
                        </CardContent>
                    </Card>
                    <div className="space-y-4">
                        <PostFeed 
                          posts={posts} 
                          currentUserId={user?.uid}
                          onDeletePost={onDeletePost}
                        />
                    </div>
                </div>
            </div>
          </main>
          <ThinkCodeDialog
            open={isThinkCodeDialogOpen}
            onOpenChange={setIsThinkCodeDialogOpen}
            userId={user?.uid}
          />
        </div>
    </AuthGuard>
  );
}
