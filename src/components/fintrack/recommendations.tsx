"use client"

import { useState } from "react"
import { suggestFunPost } from "@/ai/flows/spending-recommendations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Wand2, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "../ui/input"

export function AISuggestionCard() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");

  const handleGetSuggestion = async () => {
    if (!topic.trim()) {
        setError("Please enter a topic.");
        return;
    }
    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await suggestFunPost({ topic });
      setSuggestion(result.suggestion);
    } catch (e) {
      console.error(e);
      setError("Failed to get suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Wand2 className="text-primary" />
          Idea Sparker!
        </CardTitle>
        <CardDescription>
          Need a fun idea for a post?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Input 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., My day at the park"
            />
            <Button onClick={handleGetSuggestion} disabled={loading} className="w-full">
              <Sparkles className="mr-2" />
              {loading ? "Thinking..." : "Get Idea!"}
            </Button>
        </div>

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {suggestion && (
          <Alert>
            <AlertTitle className="font-semibold">Here's an idea:</AlertTitle>
            <AlertDescription>{suggestion}</AlertDescription>
          </Alert>
        )}
         {loading && (
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
      </CardContent>
    </Card>
  );
}
