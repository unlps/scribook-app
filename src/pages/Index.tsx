import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import library1 from "@/assets/library-1.png";
import library2 from "@/assets/library-2.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const heroImages = [library1, library2];

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro no login com Google:', error);
      toast.error('Erro ao fazer login com Google. Tente novamente.');
      setIsLoading(false);
    }
  };
  
  const messages = [
    "Crie ebooks padrão, interativos e profissionais incríveis com facilidade",
    "Projete layouts bonitos com nosso editor intuitivo",
    "Adicione elementos interativos para envolver seus leitores",
    "Exporte em múltiplos formatos para qualquer dispositivo",
    "Colabore com sua equipe em tempo real"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [messages.length]);

  useEffect(() => {
    const imageTimer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(imageTimer);
  }, [heroImages.length]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Image Slider */}
      <div className="relative w-full h-[45vh] overflow-hidden">
        {heroImages.map((image, index) => (
          <img 
            key={index}
            src={image} 
            alt={`Library scene ${index + 1}`} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8 pb-12 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center mb-3">
          Bem-vindo ao <span className="text-[#fc5934]">Kutara Mabuku</span>
        </h1>
        
        <div className="text-center mb-8 max-w-md h-16 flex items-center justify-center">
          <p className="text-muted-foreground transition-opacity duration-500">
            {messages[currentSlide]}
          </p>
        </div>

        {/* Message Slider Dots */}
        <div className="flex gap-2 mb-12">
          {messages.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide 
                  ? "w-8 bg-[#fc5934]" 
                  : "w-2 bg-muted hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-4">
          <Button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-14 text-base bg-background border-border hover:bg-accent"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </Button>

          <Button 
            onClick={() => navigate("/auth")}
            className="w-full h-14 text-base bg-[#fc5934] hover:bg-[#ff8568] text-white"
          >
            Começar
          </Button>

          <Button 
            onClick={() => navigate("/auth")}
            variant="ghost"
            className="w-full h-14 text-base text-[#fc5934] hover:text-[#ff8568] hover:bg-accent"
          >
            Já Tenho uma Conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;