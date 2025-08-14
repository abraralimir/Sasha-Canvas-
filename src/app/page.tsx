"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { aiCompleteDrawing } from '@/ai/flows/complete-drawing';
import { refineDrawing } from '@/ai/flows/refine-drawing';
import type { RefineDrawingOutput } from '@/ai/schemas/drawing';
import { useToast } from '@/hooks/use-toast';
import { WelcomeScreen } from '@/components/welcome-screen';
import DrawingCanvas, { type DrawingCanvasRef } from '@/components/drawing-canvas';
import { Toolbar, type Tool } from '@/components/toolbar';
import { ChatPanel } from '@/components/chat-panel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [canvasColor, setCanvasColor] = useState('#ffffff');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // The very first drawing or uploaded image by the user
  const [originalDrawingDataUri, setOriginalDrawingDataUri] = useState<string | null>(null);
  // The current image displayed on the canvas, which could be the original drawing, an AI completion, or a refined version.
  const [currentDrawingDataUri, setCurrentDrawingDataUri] = useState<string | null>(null);

  const handleComplete = async () => {
    const dataUri = canvasRef.current?.getCanvasAsDataURL(canvasColor);
    if (!dataUri || canvasRef.current?.isCanvasEmpty()) {
      toast({ title: "Canvas is empty", description: "Please draw something before using the AI.", variant: "destructive" });
      return;
    }
    
    // The current canvas becomes the "original" for this and future refinement sessions
    if (!originalDrawingDataUri) {
      setOriginalDrawingDataUri(dataUri);
    }
    
    setIsProcessing(true);

    try {
      const result = await aiCompleteDrawing({
        drawingDataUri: dataUri,
      });
      setCurrentDrawingDataUri(result.completedDrawingDataUri);
      toast({ title: "Drawing Completed!", description: "Sasha has enhanced your creation. You can now continue drawing or use the chat for more refinements." });
    } catch (error) {
      console.error(error);
      toast({ title: "AI Completion Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefine = async (instructions: string): Promise<RefineDrawingOutput> => {
    setIsProcessing(true);
    // The current canvas content is always the base for refinement or context
    const currentCanvasData = currentDrawingDataUri || canvasRef.current?.getCanvasAsDataURL(canvasColor);
    const canvasIsEmpty = !currentCanvasData && canvasRef.current?.isCanvasEmpty();

    if (canvasIsEmpty && !instructions) {
      toast({ title: "Nothing to do", description: "Please draw something or provide instructions.", variant: "destructive" });
      setIsProcessing(false);
      return Promise.reject("Empty input");
    }

    try {
      const result = await refineDrawing({
        originalDrawingDataUri: originalDrawingDataUri ?? undefined,
        currentDrawingDataUri: canvasIsEmpty ? undefined : currentCanvasData,
        userInstructions: instructions,
      });

      setCurrentDrawingDataUri(result.refinedDrawingDataUri);
      return result;
    } catch (error) {
      console.error("Refinement error:", error);
      toast({ title: "AI Refinement Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      throw error; // Rethrow to be caught in ChatPanel
    } finally {
      setIsProcessing(false);
    }
  };


  const handleClear = () => {
    canvasRef.current?.clear(canvasColor);
    setOriginalDrawingDataUri(null);
    setCurrentDrawingDataUri(null);
    setIsChatOpen(false); // Close chat on clear
  };
  
  const handleDownload = () => {
    const dataUrl = currentDrawingDataUri || canvasRef.current?.getCanvasAsDataURL(canvasColor);
     if(!dataUrl || canvasRef.current?.isCanvasEmpty()) {
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
        // When uploading, both original and current are the same image
        setOriginalDrawingDataUri(dataUri); 
        setCurrentDrawingDataUri(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <>
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
             <ChatPanel 
                onRefine={handleRefine}
                isProcessing={isProcessing}
             />
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
            onComplete={handleComplete}
            onClear={handleClear}
            onDownload={handleDownload}
            onUpload={handleUploadClick}
            isCompleting={isProcessing}
            isChatEnabled={true}
            onToggleChat={() => setIsChatOpen(prev => !prev)}
        />
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetContent className="w-[90vw] max-w-[440px] sm:w-[440px] p-0 border-none">
                <SheetHeader className="sr-only">
                 <SheetTitle>Sasha Assistant Chat</SheetTitle>
                 <SheetDescription>Chat with Sasha to create or refine your image.</SheetDescription>
                </SheetHeader>
                  <ChatPanel 
                    onRefine={handleRefine}
                    isProcessing={isProcessing}
                 />
            </SheetContent>
        </Sheet>
      </main>
    </>
  );
}
