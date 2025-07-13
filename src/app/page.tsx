'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Github, LoaderCircle, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { validateRepoUrl } from '@/ai/flows/validate-repo-url';

const formSchema = z.object({
  repoUrl: z.string().url({ message: 'Please enter a valid GitHub repository URL.' }),
});

type Status = 'idle' | 'validating' | 'cloning' | 'success' | 'error';

export default function GitGrabPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repoUrl: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setStatus('validating');
    setMessage('');

    try {
      const result = await validateRepoUrl({ repoUrl: values.repoUrl });

      if (result.isValid) {
        setStatus('cloning');
        // Simulate cloning process
        setTimeout(() => {
          setStatus('success');
          setMessage('Repository clone initiated!');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.reason || 'This does not appear to be a valid, public repository.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred during validation.');
      console.error(error);
    }
  }

  const isLoading = status === 'validating' || status === 'cloning';

  const renderStatusIndicator = () => {
    if (status === 'idle') return null;

    const statusConfig = {
      validating: {
        icon: <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />,
        text: 'Validating repository...',
        className: 'text-muted-foreground',
      },
      cloning: {
        icon: <LoaderCircle className="h-5 w-5 animate-spin text-accent" />,
        text: 'Initiating clone...',
        className: 'text-foreground',
      },
      success: {
        icon: <CheckCircle className="h-5 w-5 text-success" />,
        text: message,
        className: 'text-success',
      },
      error: {
        icon: <XCircle className="h-5 w-5 text-destructive" />,
        text: message,
        className: 'text-destructive',
      },
    };

    const currentStatusInfo = statusConfig[status];
    if (!currentStatusInfo) return null;

    return (
      <div className={`flex items-center gap-2 text-sm ${currentStatusInfo.className}`}>
        {currentStatusInfo.icon}
        <p>{currentStatusInfo.text}</p>
      </div>
    );
  };
  
  const buttonContent = () => {
      if (status === 'validating') return <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Validating</>;
      if (status === 'cloning') return <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Cloning</>;
      return 'Clone Repository';
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 font-body">
      <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-2xl shadow-black/20">
        <CardHeader className="text-center p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 border border-primary/20">
              <Github className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline">GitGrab</CardTitle>
            <CardDescription className="text-muted-foreground pt-1">Enter a GitHub URL to start the cloning process.</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="repoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/user/repo"
                        {...field}
                        className="h-12 text-base text-center"
                      />
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent" disabled={isLoading}>
                {buttonContent()}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex h-16 items-center justify-center p-8">
            {renderStatusIndicator()}
        </CardFooter>
      </Card>
      <footer className="py-4 mt-4">
        <p className="text-xs text-muted-foreground">A minimal utility by Firebase Studio.</p>
      </footer>
    </main>
  );
}
