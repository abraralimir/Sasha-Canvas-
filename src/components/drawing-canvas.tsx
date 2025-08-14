"use client";

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { Tool } from './toolbar';

type Point = { x: number; y: number };

type Path = {
  points: Point[];
  color: string;
  strokeWidth: number;
};

type Shape = {
  type: Exclude<Tool, 'pen'>;
  start: Point;
  end: Point;
  color: string;
  strokeWidth: number;
};

type DrawingElement =
  | { type: 'path'; data: Path }
  | { type: 'shape'; data: Shape };

type DrawingCanvasProps = {
  tool: Tool;
  color: string;
  strokeWidth: number;
  imageDataUri?: string | null;
  backgroundColor: string;
};

export type DrawingCanvasRef = {
  getCanvasAsDataURL: (backgroundColor?: string) => string | undefined;
  clear: (backgroundColor?: string) => void;
  download: (backgroundColor?: string) => void;
  isCanvasEmpty: () => boolean;
  loadImage: (dataUri: string) => void;
};

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ tool, color, strokeWidth, imageDataUri, backgroundColor }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
    const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const preventScroll = (e: TouchEvent) => {
            e.preventDefault();
        };

        canvas.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            canvas.removeEventListener('touchmove', preventScroll);
        };
    }, []);

    const getCanvasAsDataURL = (bgColor: string = '#FFFFFF') => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      return tempCanvas.toDataURL('image/png');
    };
    
    const isCanvasEmpty = () => {
        return drawingElements.length === 0 && !currentElement && !imageDataUri;
    }

    const loadImage = (dataUri: string) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = dataUri;
        image.onload = () => {
            setDrawingElements([]);
            setCurrentElement(null);
            clearCanvas(ctx);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        };
    }

    useImperativeHandle(ref, () => ({
      getCanvasAsDataURL,
      clear: (bgColor) => {
        setDrawingElements([]);
        setCurrentElement(null);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            clearCanvas(ctx, bgColor);
        }
      },
      download: (bgColor) => {
        const dataUrl = getCanvasAsDataURL(bgColor);
        if(!dataUrl) return;

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'drawing.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      isCanvasEmpty,
      loadImage
    }));
    
    const clearCanvas = (ctx: CanvasRenderingContext2D, color?: string) => {
        const canvas = ctx.canvas;
        ctx.fillStyle = color || backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const getCoords = (e: MouseEvent | TouchEvent): Point | undefined => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const event = 'touches' in e ? e.touches[0] : e;
      if (!event) return;
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const drawPath = (ctx: CanvasRenderingContext2D, path: Path) => {
        if (path.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
    };

    const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
        ctx.beginPath();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const { start, end } = shape;
        const width = end.x - start.x;
        const height = end.y - start.y;

        switch (shape.type) {
            case 'line':
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                break;
            case 'rectangle':
                ctx.rect(start.x, start.y, width, height);
                break;
            case 'circle':
                const radiusX = Math.abs(width / 2);
                const radiusY = Math.abs(height / 2);
                const centerX = start.x + width / 2;
                const centerY = start.y + height / 2;
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                break;
            case 'triangle':
                ctx.moveTo(start.x + width / 2, start.y);
                ctx.lineTo(start.x, end.y);
                ctx.lineTo(end.x, end.y);
                ctx.closePath();
                break;
        }
        ctx.stroke();
    };
    
    const redraw = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        clearCanvas(ctx);
        drawingElements.forEach(element => {
            if (element.type === 'path') drawPath(ctx, element.data);
            else drawShape(ctx, element.data);
        });
        if (currentElement) {
            if (currentElement.type === 'path') drawPath(ctx, currentElement.data);
            else drawShape(ctx, currentElement.data);
        }
    };

    useEffect(() => {
        redraw();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const { width, height } = canvas.getBoundingClientRect();
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                redraw();
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [drawingElements, currentElement, backgroundColor]);

    useEffect(() => {
        if (imageDataUri) {
            loadImage(imageDataUri);
        } else {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if(ctx) {
                clearCanvas(ctx);
            }
        }
    }, [imageDataUri, backgroundColor]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const coords = getCoords(e.nativeEvent);
        if (!coords) return;
        setIsDrawing(true);

        if (tool === 'pen') {
            setCurrentElement({ type: 'path', data: { points: [coords], color, strokeWidth } });
        } else {
            setCurrentElement({ type: 'shape', data: { type: tool, start: coords, end: coords, color, strokeWidth } });
        }
    };

    const handleDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing || !currentElement) return;
        const coords = getCoords(e.nativeEvent);
        if (!coords) return;

        if (currentElement.type === 'path') {
            setCurrentElement(prev => ({
                ...prev!,
                data: { ...prev!.data, points: [...(prev!.data as Path).points, coords] }
            } as DrawingElement));
        } else {
             setCurrentElement(prev => ({
                ...prev!,
                data: { ...prev!.data, end: coords }
            } as DrawingElement));
        }
    };

    const stopDrawing = () => {
        if (!isDrawing || !currentElement) return;
        setIsDrawing(false);
        setDrawingElements(prev => [...prev, currentElement]);
        setCurrentElement(null);
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={handleDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={handleDrawing}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair"
        />
    );
});
DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
