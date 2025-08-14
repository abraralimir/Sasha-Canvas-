"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type WelcomeScreenProps = {
  onAnimationEnd: () => void;
};

export function WelcomeScreen({ onAnimationEnd }: WelcomeScreenProps) {
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 500); // "SASHA CANVAS" appears
    const timer2 = setTimeout(() => setStage(2), 2000); // "draw your imagination" appears
    const timer3 = setTimeout(() => {
      setVisible(false);
      setTimeout(onAnimationEnd, 1000); // Wait for fade out animation
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onAnimationEnd]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center animated-gradient transition-opacity duration-1000",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="text-center text-primary-foreground drop-shadow-lg">
        <h1
          className={cn(
            "text-5xl md:text-7xl lg:text-8xl font-headline font-bold transition-all duration-700",
            stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          SASHA CANVAS
        </h1>
        <p
          className={cn(
            "mt-4 text-xl md:text-2xl font-body transition-all duration-700 delay-300",
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          Draw your imagination
        </p>
      </div>
    </div>
  );
}
