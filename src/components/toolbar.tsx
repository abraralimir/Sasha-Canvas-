"use client";

import { Pencil, Circle, RectangleHorizontal, Triangle, Sparkles, Trash2, Minus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export type Tool = "pen" | "line" | "circle" | "rectangle" | "triangle";

const colors = [
  "#ffffff", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899",
  "#78716c", "#000000",
];

type ToolbarProps = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onComplete: () => void;
  onClear: () => void;
  isCompleting: boolean;
  isChatEnabled: boolean;
  onToggleChat: () => void;
};

export function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  onComplete,
  onClear,
  isCompleting,
  isChatEnabled,
  onToggleChat,
}: ToolbarProps) {
  const tools: { name: Tool; icon: React.ReactNode }[] = [
    { name: "pen", icon: <Pencil /> },
    { name: "line", icon: <Minus /> },
    { name: "circle", icon: <Circle /> },
    { name: "rectangle", icon: <RectangleHorizontal /> },
    { name: "triangle", icon: <Triangle /> },
  ];

  return (
    <TooltipProvider>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-card p-2 rounded-lg shadow-lg flex items-center gap-1 border">
        {tools.map((t) => (
          <Tooltip key={t.name}>
            <TooltipTrigger asChild>
              <Button
                variant={tool === t.name ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setTool(t.name)}
                aria-label={t.name}
              >
                {t.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">{t.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Color">
              <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: color }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-7 gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-transform transform hover:scale-110",
                    color === c ? "border-primary" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Stroke width">
              <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                <div className="bg-background rounded-full" style={{ width: strokeWidth / 1.5, height: strokeWidth / 1.5, maxWidth: '16px', maxHeight: '16px' }}></div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-4">
              <Slider
                  defaultValue={[strokeWidth]}
                  max={20}
                  min={1}
                  step={1}
                  onValueChange={(value) => setStrokeWidth(value[0])}
              />
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear Canvas">
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear Canvas</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onComplete} disabled={isCompleting} className="bg-primary/90 text-primary-foreground hover:bg-primary" aria-label="AI Complete">
              <Sparkles className={cn("mr-2", isCompleting && "animate-spin")}/>
              {isCompleting ? "Working..." : "Complete"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Let AI complete your drawing</p>
          </TooltipContent>
        </Tooltip>
        
        {isChatEnabled && (
            <Tooltip>
                <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleChat} aria-label="Toggle Chat" className="lg:hidden">
                    <MessageSquare />
                </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Open Sasha Assistant</p>
                </TooltipContent>
            </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
