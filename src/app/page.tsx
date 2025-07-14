
"use client";

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import type { Post } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { PostFeed } from '@/components/fintrack/recent-transactions';
import { Skeleton } from '@/components/ui/skeleton';
import { ThinkCodeDialog } from '@/components/fintrack/gift-code-dialog';

function TodaySkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-full bg-primary/80" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32 bg-primary/80" />
            <Skeleton className="h-10 w-10 rounded-full bg-primary/80" />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 max-w-5xl space-y-6 flex-1">
          <Skeleton className="h-[450px] w-full" />
          <Skeleton className="h-[450px] w-full" />
      </main>
    </div>
  );
}


export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
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
  
  if (authLoading || (isDataLoading && user)) {
    return <TodaySkeleton />;
  }

  return (
    <AuthGuard>
        <div className="flex flex-col h-screen">
          <Header isVisible={isHeaderVisible} />
          <main 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto scroll-snap-y-mandatory"
          >
              <PostFeed 
                posts={posts} 
                currentUserId={user?.uid}
                onDeletePost={() => {}}
              />
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
