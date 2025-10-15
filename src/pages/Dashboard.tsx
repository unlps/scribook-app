import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Eye, Download, MessageSquare, Sparkles, ChevronRight } from "lucide-react";
import logo from "@/assets/logo.png";
import BottomNav from "@/components/BottomNav";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
interface Profile {
  full_name: string;
  email: string;
}
interface Ebook {
  id: string;
  title: string;
  description: string;
  type: string;
  pages: number;
  views: number;
  downloads: number;
  cover_image: string;
  created_at: string;
}
interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  suggested_pages: string;
}
const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalDownloads: 0,
    totalEbooks: 0
  });
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    checkUser();
    fetchData();
  }, []);
  const checkUser = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    const {
      data
    } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) {
      setProfile(data);
    }
  };
  const fetchData = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch ebooks
    const {
      data: ebooksData
    } = await supabase.from("ebooks").select("*").eq("user_id", session.user.id).order("created_at", {
      ascending: false
    }).limit(6);
    if (ebooksData) {
      setEbooks(ebooksData);
      const totalViews = ebooksData.reduce((sum, book) => sum + book.views, 0);
      const totalDownloads = ebooksData.reduce((sum, book) => sum + book.downloads, 0);
      setStats({
        totalViews,
        totalDownloads,
        totalEbooks: ebooksData.length
      });
    }

    // Fetch templates
    const {
      data: templatesData
    } = await supabase.from("templates").select("*").limit(3);
    if (templatesData) {
      setTemplates(templatesData);
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PageSmith Hub" className="w-10 h-10" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">ScriBook</h1>
          </div>
          <Button onClick={() => navigate("/conversas")} variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Welcome Section */}
        

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Ebooks</p>
                <p className="text-2xl font-bold">{stats.totalEbooks}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Visualizações</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Downloads</p>
                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Meus Livros */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Meus Livros</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {ebooks.length === 0 ? <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">Nenhum ebook ainda</h4>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro ebook para começar
              </p>
              <Button onClick={() => navigate("/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Ebook
              </Button>
            </Card> : <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {ebooks.map(ebook => <CarouselItem key={ebook.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <Card className="p-3 hover:shadow-card transition-shadow cursor-pointer">
                      <div className="aspect-[2/3] bg-gradient-primary rounded-lg mb-3 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                      <h4 className="font-semibold mb-1 text-sm line-clamp-1">{ebook.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {ebook.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {ebook.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {ebook.downloads}
                        </span>
                      </div>
                    </Card>
                  </CarouselItem>)}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>}
        </div>

        {/* Explorar por Gênero */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Explorar por Gênero</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {["Romance", "Thriller", "Inspiração", "Ficção Científica", "Mistério"].map(genre => <CarouselItem key={genre} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Card className="p-6 hover:shadow-card transition-shadow cursor-pointer bg-gradient-secondary">
                    <h4 className="font-semibold text-white text-center">{genre}</h4>
                  </Card>
                </CarouselItem>)}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        {/* Recomendado para Ti */}
        

        {/* Publicados por Mim */}
        

        {/* Ebooks Recentes */}
        
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>;
};
export default Dashboard;