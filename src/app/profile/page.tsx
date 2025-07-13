
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import type { User } from '@/lib/types';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/fintrack/header';
import { ProfileCard } from '@/components/fintrack/overview';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

function ProfileSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm">
                    <Skeleton className="h-64 w-full" />
                </div>
            </main>
        </div>
    );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  
  if (authLoading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <AuthGuard>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col items-center justify-center">
             <div className="w-full max-w-sm space-y-6">
                <ProfileCard user={user} />
            </div>
          </main>
        </div>
    </AuthGuard>
  );
}
