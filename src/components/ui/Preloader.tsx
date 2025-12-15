import Lottie from "lottie-react";
import { useEffect, useState } from "react";

interface PreloaderProps {
  onComplete?: () => void;
  minDuration?: number;
}

const Preloader = ({ onComplete, minDuration = 2000 }: PreloaderProps) => {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/animations/fots-studio-loader.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      onComplete?.();
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="w-64 h-64 md:w-80 md:h-80">
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Preloader;
