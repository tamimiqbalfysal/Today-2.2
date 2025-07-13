"use client";

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { generateDailyQuote } from '@/ai/flows/generate-daily-quote';
import { useToast } from "@/hooks/use-toast";

type TodayClientProps = {
  initialQuote: string;
};

export default function TodayClient({ initialQuote }: TodayClientProps) {
  const [time, setTime] = useState('...');
  const [dayOfWeek, setDayOfWeek] = useState('...');
  const [date, setDate] = useState('...');
  const [quote, setQuote] = useState(initialQuote);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const updateDateTime = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDayOfWeek(d.toLocaleDateString('en-US', { weekday: 'long' }));
      setDate(d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRefreshQuote = async () => {
    setIsRefreshing(true);
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const newQuoteData = await generateDailyQuote({ date: formattedDate, mood: 'inspirational' });
      setQuote(newQuoteData.quote);
    } catch (error) {
      console.error("Failed to refresh quote:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch a new quote. Please try again later.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const timeParts = time.split(/[: ]/);
  const mainTime = timeParts.slice(0, 3).join(':');
  const ampm = timeParts[3];

  return (
    <main className="flex items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="text-center w-full max-w-4xl mx-auto">
        <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-primary">
            {mainTime}
            {ampm && <span className="text-2xl sm:text-3xl md:text-4xl ml-2 align-middle font-medium text-primary/80">{ampm}</span>}
          </h1>
        </div>

        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground">{dayOfWeek}</p>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">{date}</p>
        </div>

        <div className="relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Card className="bg-card/50 dark:bg-card/20 border-border/30 rounded-2xl shadow-lg backdrop-blur-sm min-h-[120px] flex items-center justify-center">
            <CardContent className="p-6 sm:p-8 w-full">
              <blockquote className="text-lg sm:text-xl md:text-2xl italic text-foreground/80">
                <p className="transition-opacity duration-500">{`“${quote}”`}</p>
              </blockquote>
            </CardContent>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-accent"
              onClick={handleRefreshQuote}
              disabled={isRefreshing}
              aria-label="Refresh quote"
            >
              <RefreshCw className={`h-5 w-5 transition-transform ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-90'}`} />
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
