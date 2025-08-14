"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, User, CornerDownLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { refineDrawing } from '@/ai/flows/refine-drawing';
import Image from 'next/image';

type Message = {
  id: string;
  sender: 'user' | 'sasha';
  text: string;
  refinedImage?: string;
};

type ChatPanelProps = {
  originalDrawingDataUri: string;
  aiCompletedDrawingDataUri: string;
  onNewImage: (dataUri: string) => void;
  isRefining: boolean;
  setIsRefining: (isRefining: boolean) => void;
};

export function ChatPanel({
  originalDrawingDataUri,
  aiCompletedDrawingDataUri,
  onNewImage,
  isRefining,
  setIsRefining,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentAiDrawing, setCurrentAiDrawing] = useState(aiCompletedDrawingDataUri);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'intro',
        sender: 'sasha',
        text: "Hi there! I'm Sasha. I've completed your drawing. How can I help you refine it?",
      },
    ]);
  }, [originalDrawingDataUri]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRefining) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsRefining(true);

    try {
      const result = await refineDrawing({
        originalDrawingDataUri,
        aiCompletedDrawingDataUri: currentAiDrawing,
        userInstructions: input,
      });
      
      setCurrentAiDrawing(result.refinedDrawingDataUri);

      const sashaMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'sasha',
        text: result.feedback || "Here's the refined version.",
        refinedImage: result.refinedDrawingDataUri,
      };
      setMessages(prev => [...prev, sashaMessage]);
      onNewImage(result.refinedDrawingDataUri);
    } catch (error) {
      console.error('Error refining drawing:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'sasha',
        text: "Sorry, I encountered an error while refining your drawing. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsRefining(false);
    }
  };
  
  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border-none lg:border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Avatar>
            <AvatarFallback>S</AvatarFallback>
            <AvatarImage src="https://placehold.co/40x40/A020F0/ffffff.png?text=S" data-ai-hint="logo sasha" />
          </Avatar>
          Sasha Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'sasha' && (
                  <Avatar className="w-8 h-8">
                     <AvatarFallback>S</AvatarFallback>
                     <AvatarImage src="https://placehold.co/40x40/A020F0/ffffff.png?text=S" data-ai-hint="logo sasha" />
                  </Avatar>
                )}
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-sm shadow',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                   {message.refinedImage && (
                    <Image width={256} height={256} src={message.refinedImage} alt="Refined drawing" className="mt-2 rounded-lg w-64 h-auto" />
                  )}
                </div>
                {message.sender === 'user' && (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback><User size={20}/></AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))}
             {isRefining && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback>S</AvatarFallback>
                        <AvatarImage src="https://placehold.co/40x40/A020F0/ffffff.png?text=S" data-ai-hint="logo sasha"/>
                    </Avatar>
                    <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4" />
                        <p className="text-sm text-muted-foreground">Sasha is thinking...</p>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Make the sky blue..."
            className="flex-grow resize-none bg-background/50"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isRefining}
          />
          <Button type="submit" size="icon" disabled={isRefining || !input.trim()}>
            <CornerDownLeft />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
