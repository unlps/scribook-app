import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Zap } from "lucide-react";
import logo from "@/assets/logo.png";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8 text-white">
          <img src={logo} alt="PageSmith Hub" className="w-24 h-24 mx-auto" />
          
          <h1 className="text-5xl md:text-6xl font-bold">MNEbooks</h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Create stunning ebooks with ease. Choose from standard, interactive, or professional formats.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button onClick={() => navigate("/auth")} size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
              Get Started
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
              Sign In
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Standard Ebooks</h3>
              <p className="text-white/80">
                Classic text and image layouts perfect for any content
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Zap className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Ebooks</h3>
              <p className="text-white/80">
                Engage readers with video, audio, and quizzes
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Sparkles className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Professional Ebooks</h3>
              <p className="text-white/80">
                Business-focused templates for marketing and proposals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;