"use client";

import { useState, useRef } from 'react';
import { aiCompleteDrawing } from '@/ai/flows/complete-drawing';
import { useToast } from '@/hooks/use-toast';
import { WelcomeScreen } from '@/components/welcome-screen';
import DrawingCanvas, { type DrawingCanvasRef } from '@/components/drawing-canvas';
import { Toolbar, type Tool } from '@/components/toolbar';
import { ChatPanel } from '@/components/chat-panel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();
  const canvasRef = useRef<DrawingCanvasRef>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(5);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [originalDrawingDataUri, setOriginalDrawingDataUri] = useState<string | null>(null);
  const [currentDrawingDataUri, setCurrentDrawingDataUri] = useState<string | null>(null);

  const handleComplete = async () => {
    const dataUri = canvasRef.current?.getCanvasAsDataURL();
    if (!dataUri) {
      toast({ title: "Canvas is empty", description: "Draw something before using AI completion.", variant: "destructive" });
      return;
    }
    
    setOriginalDrawingDataUri(dataUri);
    setIsCompleting(true);

    try {
      const result = await aiCompleteDrawing({
        drawingDataUri: dataUri,
        userPrompt: 'Complete this drawing, making it look professional and artistic. Keep the original style but enhance it.',
      });
      setCurrentDrawingDataUri(result.completedDrawingDataUri);
      toast({ title: "Drawing Completed!", description: "Sasha can now help you refine it. Click the chat icon to start." });
      setIsChatOpen(true);
    } catch (error) {
      console.error(error);
      toast({ title: "AI Completion Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setOriginalDrawingDataUri(null);
    setCurrentDrawingDataUri(null);
    setIsChatOpen(false);
  };
  
  return (
    <>
      {showWelcome && <WelcomeScreen onAnimationEnd={() => setShowWelcome(false)} />}
      <main className={cn(
        "h-screen w-screen flex flex-col items-center justify-center transition-opacity duration-500 animated-gradient",
        showWelcome ? "opacity-0" : "opacity-100"
      )}>
        <div className="relative w-full h-full p-4 flex gap-4">
          <Card className="flex-grow h-full w-full overflow-hidden shadow-2xl bg-transparent backdrop-blur-sm bg-card/10 border-border/20">
              <DrawingCanvas
                ref={canvasRef}
                tool={tool}
                color={color}
                strokeWidth={strokeWidth}
                imageDataUri={currentDrawingDataUri}
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
            onComplete={handleComplete}
            onClear={handleClear}
            isCompleting={isCompleting || isRefining}
            isChatEnabled={!!currentDrawingDataUri}
            onToggleChat={() => setIsChatOpen(prev => !prev)}
        />
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetContent className="w-[90vw] max-w-[440px] sm:w-[440px] p-0 border-none">
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
