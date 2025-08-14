"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { aiCompleteDrawing } from '@/ai/flows/complete-drawing';
import { useToast } from '@/hooks/use-toast';
import { WelcomeScreen } from '@/components/welcome-screen';
import DrawingCanvas, { type DrawingCanvasRef } from '@/components/drawing-canvas';
import { Toolbar, type Tool } from '@/components/toolbar';
import { ChatPanel } from '@/components/chat-panel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [canvasColor, setCanvasColor] = useState('#ffffff');
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');


  const [originalDrawingDataUri, setOriginalDrawingDataUri] = useState<string | null>(null);
  const [currentDrawingDataUri, setCurrentDrawingDataUri] = useState<string | null>(null);

  const handleCompleteRequest = () => {
    const dataUri = canvasRef.current?.getCanvasAsDataURL(canvasColor);
    if (!dataUri || canvasRef.current?.isCanvasEmpty()) {
      toast({ title: "Canvas is empty", description: "Please draw something before using the AI.", variant: "destructive" });
      return;
    }
    setIsPromptDialogOpen(true);
  };
  
  const handleCompleteConfirm = async () => {
    if (!userPrompt.trim()) {
      toast({ title: "Prompt is empty", description: "Please describe what you are drawing.", variant: "destructive" });
      return;
    }
    setIsPromptDialogOpen(false);
    
    const dataUri = canvasRef.current?.getCanvasAsDataURL(canvasColor);
    if (!dataUri) return; // Should not happen due to previous check
    
    setOriginalDrawingDataUri(dataUri);
    setIsCompleting(true);

    try {
      const result = await aiCompleteDrawing({
        drawingDataUri: dataUri,
        userPrompt: userPrompt,
      });
      setCurrentDrawingDataUri(result.completedDrawingDataUri);
      toast({ title: "Drawing Completed!", description: "Sasha can now help you refine it. Click the chat icon to start." });
      setIsChatOpen(true);
      setUserPrompt(''); // Reset prompt for next time
    } catch (error) {
      console.error(error);
      toast({ title: "AI Completion Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsCompleting(false);
    }
  };


  const handleClear = () => {
    canvasRef.current?.clear(canvasColor);
    setOriginalDrawingDataUri(null);
    setCurrentDrawingDataUri(null);
    setIsChatOpen(false);
  };
  
  const handleDownload = () => {
    const dataUrl = currentDrawingDataUri || canvasRef.current?.getCanvasAsDataURL(canvasColor);
     if(!dataUrl) {
      toast({ title: "Nothing to download", description: "The canvas is empty.", variant: "destructive" });
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'sasha-canvas-drawing.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result as string;
        canvasRef.current?.loadImage(dataUri);
        setOriginalDrawingDataUri(dataUri); // Set original to uploaded image
        setCurrentDrawingDataUri(dataUri);
        setIsChatOpen(false); // Close chat when new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <>
      <AlertDialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>What are you drawing?</AlertDialogTitle>
            <AlertDialogDescription>
              Give the AI a hint to get the best results. For example: "A cute cat", "A futuristic city", "A beautiful flower".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
              <Label htmlFor="prompt-input">Your Description</Label>
              <Input id="prompt-input" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="e.g., A happy little robot" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteConfirm}>Complete Drawing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="fixed inset-0 -z-10 animated-gradient" />
      {showWelcome && <WelcomeScreen onAnimationEnd={() => setShowWelcome(false)} />}
      <main className={cn(
        "h-screen w-screen flex flex-col items-center justify-center transition-opacity duration-500",
        showWelcome ? "opacity-0" : "opacity-100"
      )}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <div className="relative w-full h-full p-4 flex gap-4">
          <Card className="flex-grow h-full w-full overflow-hidden shadow-2xl bg-white border-border/20">
              <DrawingCanvas
                ref={canvasRef}
                tool={tool}
                color={color}
                strokeWidth={strokeWidth}
                imageDataUri={currentDrawingDataUri}
                backgroundColor={canvasColor}
              />
          </Card>
          
          <div className="w-[380px] h-full flex-shrink-0 hidden lg:block">
            {currentDrawingDataUri && originalDrawingDataUri && (
                <ChatPanel 
                    originalDrawingDataUri={originalDrawingDataUri}
                    aiCompletedDrawingDataUri={currentDrawingDataUri}
                    onNewImage={setCurrentDrawingDataUri}
                    isRefining={isRefining}
                    setIsRefining={setIsRefining}
                />
             )}
          </div>
        </div>
        <Toolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            canvasColor={canvasColor}
            setCanvasColor={setCanvasColor}
            onComplete={handleCompleteRequest}
            onClear={handleClear}
            onDownload={handleDownload}
            onUpload={handleUploadClick}
            isCompleting={isCompleting || isRefining}
            isChatEnabled={!!currentDrawingDataUri}
            onToggleChat={() => setIsChatOpen(prev => !prev)}
        />
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetContent className="w-[90vw] max-w-[440px] sm:w-[440px] p-0 border-none">
                 <SheetTitle className="sr-only">Sasha Assistant Chat</SheetTitle>
                 <SheetDescription className="sr-only">Chat with Sasha to refine your image.</SheetDescription>
                 {currentDrawingDataUri && originalDrawingDataUri && (
                    <ChatPanel 
                        originalDrawingDataUri={originalDrawingDataUri}
                        aiCompletedDrawingDataUri={currentDrawingDataUri}
                        onNewImage={setCurrentDrawingDataUri}
                        isRefining={isRefining}
                        setIsRefining={setIsRefining}
                    />
                 )}
            </SheetContent>
        </Sheet>
      </main>
    </>
  );
}
