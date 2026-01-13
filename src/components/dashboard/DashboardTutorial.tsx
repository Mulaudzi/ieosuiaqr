import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Your Dashboard! 🎉",
    description: "Let's take a quick tour to help you get the most out of IEOSUIA QR. You can skip this anytime.",
    targetSelector: "[data-tutorial='header']",
    position: "bottom",
  },
  {
    id: "stats",
    title: "Your Statistics at a Glance",
    description: "Track your QR code count, total scans, unique users, and geographic reach. These update in real-time as your codes get scanned.",
    targetSelector: "[data-tutorial='stats']",
    position: "bottom",
  },
  {
    id: "create",
    title: "Create New QR Codes",
    description: "Click here to create a new QR code. Choose from URLs, vCards, WiFi, events, and more. Pro users get access to advanced customization!",
    targetSelector: "[data-tutorial='create-button']",
    position: "bottom",
  },
  {
    id: "search",
    title: "Search & Filter",
    description: "Quickly find any QR code by name. Use filters to sort by type, date, or scan count.",
    targetSelector: "[data-tutorial='search']",
    position: "bottom",
  },
  {
    id: "view-toggle",
    title: "Switch Views",
    description: "Toggle between grid and list views to see your QR codes the way you prefer.",
    targetSelector: "[data-tutorial='view-toggle']",
    position: "left",
  },
  {
    id: "sidebar-nav",
    title: "Navigation Menu",
    description: "Access your QR codes, inventory tracking, analytics, and settings from this sidebar. Each section has powerful features to explore.",
    targetSelector: "[data-tutorial='sidebar-nav']",
    position: "right",
  },
  {
    id: "inventory",
    title: "Inventory Tracking",
    description: "Track physical assets with QR codes! Perfect for equipment, products, or any items you need to monitor.",
    targetSelector: "[data-tutorial='inventory-nav']",
    position: "right",
  },
  {
    id: "analytics",
    title: "Deep Analytics",
    description: "View detailed scan analytics including locations, devices, browsers, and time patterns. Make data-driven decisions!",
    targetSelector: "[data-tutorial='analytics-nav']",
    position: "right",
  },
  {
    id: "upgrade",
    title: "Unlock More Features",
    description: "Upgrade to Pro for unlimited QR codes, custom branding, bulk import, advanced analytics, and priority support.",
    targetSelector: "[data-tutorial='upgrade']",
    position: "right",
  },
];

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  hasSeenTutorial: boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return context;
}

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("dashboard-tutorial-seen");
    if (!seen) {
      setHasSeenTutorial(false);
    }
  }, []);

  const startTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const endTutorial = () => {
    setIsActive(false);
    setHasSeenTutorial(true);
    localStorage.setItem("dashboard-tutorial-seen", "true");
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipTutorial = () => {
    endTutorial();
  };

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        hasSeenTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function TutorialOverlay() {
  const { isActive, currentStep, nextStep, prevStep, skipTutorial, endTutorial } = useTutorial();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    if (!isActive || !step) return;

    const updatePosition = () => {
      const target = document.querySelector(step.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setHighlightRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });

        // Calculate tooltip position based on specified position
        const padding = 16;
        let top = 0;
        let left = 0;

        switch (step.position) {
          case "top":
            top = rect.top - padding - 200;
            left = rect.left + rect.width / 2 - 175;
            break;
          case "bottom":
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2 - 175;
            break;
          case "left":
            top = rect.top + rect.height / 2 - 100;
            left = rect.left - padding - 350;
            break;
          case "right":
            top = rect.top + rect.height / 2 - 100;
            left = rect.right + padding;
            break;
          default:
            top = rect.bottom + padding;
            left = rect.left;
        }

        // Keep tooltip within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left < 20) left = 20;
        if (left + 350 > viewportWidth - 20) left = viewportWidth - 370;
        if (top < 20) top = 20;
        if (top + 200 > viewportHeight - 20) top = viewportHeight - 220;

        setTooltipPosition({ top, left });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isActive, step, currentStep]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop with spotlight cutout */}
        <div className="absolute inset-0">
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={highlightRect.left}
                  y={highlightRect.top}
                  width={highlightRect.width}
                  height={highlightRect.height}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#spotlight-mask)"
            />
          </svg>
        </div>

        {/* Highlight border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute rounded-xl border-2 border-primary shadow-[0_0_0_4px_rgba(20,184,166,0.2)]"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            pointerEvents: "none",
          }}
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-[101] w-[350px]"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/80 text-sm font-medium">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </span>
                </div>
                <button
                  onClick={skipTutorial}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-display text-lg font-bold mb-2">{step?.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {step?.description}
              </p>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? "bg-primary"
                        : index < currentStep
                        ? "bg-primary/40"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                {isFirstStep ? (
                  <Button variant="ghost" size="sm" onClick={skipTutorial}>
                    Skip Tour
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                
                <Button size="sm" onClick={isLastStep ? endTutorial : nextStep}>
                  {isLastStep ? (
                    "Finish Tour"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function TutorialTrigger() {
  const { startTutorial, hasSeenTutorial } = useTutorial();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTutorial}
      className="gap-2"
    >
      <Lightbulb className="w-4 h-4" />
      {hasSeenTutorial ? "Tour" : "Take a Tour"}
    </Button>
  );
}

export function TutorialWelcomeModal() {
  const { hasSeenTutorial, startTutorial, skipTutorial } = useTutorial();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!hasSeenTutorial) {
      // Delay showing the modal so dashboard loads first
      const timer = setTimeout(() => setShowModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial]);

  if (!showModal || hasSeenTutorial) return null;

  const handleStart = () => {
    setShowModal(false);
    startTutorial();
  };

  const handleSkip = () => {
    setShowModal(false);
    skipTutorial();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Header Image */}
          <div className="bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to IEOSUIA QR!</h2>
            <p className="text-white/80 text-sm">Your dashboard is ready to explore</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-muted-foreground text-center mb-6">
              Would you like a quick tour of your dashboard? It only takes a minute and will help you discover all the powerful features available.
            </p>

            <div className="space-y-3">
              <Button onClick={handleStart} className="w-full" size="lg">
                <Lightbulb className="w-5 h-5 mr-2" />
                Yes, Show Me Around
              </Button>
              <Button variant="ghost" onClick={handleSkip} className="w-full">
                I'll Explore on My Own
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
