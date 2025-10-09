import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Eye, Download, LogOut, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
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
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PageSmith Hub" className="w-10 h-10" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">ScriBook</h1>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="icon">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Bem-vindo de volta, {profile?.full_name || "Criador"}! 👋
              </h2>
              <p className="text-white/90 text-lg">
                Pronto para criar algo incrível hoje?
              </p>
            </div>
            <Button onClick={() => navigate("/create")} size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg mx-px my-[4px] px-[5px] py-[13px]">
              <Plus className="mr-2 h-5 w-5" />
              Criar Novo Ebook
            </Button>
          </div>
        </div>

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

        {/* Recent Ebooks */}
        <div>
          <h3 className="text-2xl font-bold mb-4">Ebooks Recentes</h3>
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
            </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ebooks.map(ebook => <Card key={ebook.id} className="p-4 hover:shadow-card transition-shadow cursor-pointer">
                  <div className="aspect-[3/4] bg-gradient-primary rounded-lg mb-3 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <h4 className="font-semibold mb-1">{ebook.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {ebook.description || "Sem descrição"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {ebook.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {ebook.downloads}
                    </span>
                  </div>
                </Card>)}
            </div>}
        </div>

        {/* Template Suggestions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-bold">Sugestões de Templates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(template => <Card key={template.id} className="p-6 hover:shadow-card transition-shadow cursor-pointer" onClick={() => navigate("/create")}>
                <div className="w-12 h-12 rounded-lg bg-gradient-secondary mb-4" />
                <h4 className="font-semibold mb-2">{template.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-accent rounded-full">{template.category}</span>
                  <span>{template.suggested_pages}</span>
                </div>
              </Card>)}
          </div>
        </div>
      </main>
    </div>;
};
export default Dashboard;