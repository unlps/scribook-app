import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Eye, Download, MessageSquare, Sparkles, ChevronRight, Trash2, Edit, ChevronLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import logoDark from "@/assets/logo-dark.png";
import BottomNav from "@/components/BottomNav";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import { sanitizeHtml } from "@/lib/utils";
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
  author: string | null;
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
  const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalDownloads: 0,
    totalEbooks: 0
  });
  const [ebooksCarouselApi, setEbooksCarouselApi] = useState<CarouselApi>();
  const [genresCarouselApi, setGenresCarouselApi] = useState<CarouselApi>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const { theme } = useTheme();
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

  const handleDeleteEbook = async () => {
    if (!selectedEbook) return;

    const { error } = await supabase.from("ebooks").delete().eq("id", selectedEbook.id);
    
    if (error) {
      toast({
        title: "Erro ao apagar",
        description: "Não foi possível apagar o ebook",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Ebook apagado",
      description: "O ebook foi apagado com sucesso"
    });
    
    setSelectedEbook(null);
    fetchData();
  };

  const handleDownloadEbook = async () => {
    if (!selectedEbook) return;

    try {
      // Helper function to convert HTML to plain text
      const htmlToText = (html: string) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
      };

      const { data: chapters } = await supabase
        .from("chapters")
        .select("*")
        .eq("ebook_id", selectedEbook.id)
        .order("chapter_order", { ascending: true });

      const pdf = new jsPDF();
      let yPosition = 20;

      // Cover page with image
      if (selectedEbook.cover_image) {
        try {
          const img = new Image();
          img.src = selectedEbook.cover_image;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
          });
          
          // Get page dimensions
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          // Calculate dimensions to cover entire page
          const imgRatio = img.width / img.height;
          const pageRatio = pageWidth / pageHeight;
          
          let finalWidth, finalHeight, xOffset, yOffset;
          
          if (imgRatio > pageRatio) {
            // Image is wider - fit to height and crop width
            finalHeight = pageHeight;
            finalWidth = finalHeight * imgRatio;
            xOffset = (pageWidth - finalWidth) / 2;
            yOffset = 0;
          } else {
            // Image is taller - fit to width and crop height
            finalWidth = pageWidth;
            finalHeight = finalWidth / imgRatio;
            xOffset = 0;
            yOffset = (pageHeight - finalHeight) / 2;
          }
          
          pdf.addImage(img, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
        } catch (error) {
          console.error('Erro ao adicionar capa ao PDF:', error);
        }
      }

      // Title page
      pdf.addPage();
      yPosition = 20;

      pdf.setFontSize(24);
      const titleText = htmlToText(selectedEbook.title);
      const titleLines = pdf.splitTextToSize(titleText, 170);
      pdf.text(titleLines, 20, yPosition);
      yPosition += titleLines.length * 12 + 20;

      if (selectedEbook.author) {
        pdf.setFontSize(14);
        pdf.text(`Escrito por ${selectedEbook.author}`, 20, yPosition);
      }

      // Description page
      if (selectedEbook.description) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(12);
        const descText = htmlToText(selectedEbook.description);
        const descLines = pdf.splitTextToSize(descText, 170);
        pdf.text(descLines, 20, yPosition);
      }

      // Chapters
      chapters?.forEach((chapter) => {
        pdf.addPage();
        yPosition = 20;

        pdf.setFontSize(18);
        const chapterTitle = htmlToText(chapter.title);
        pdf.text(chapterTitle, 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        const plainText = htmlToText(chapter.content);
        const contentLines = pdf.splitTextToSize(plainText, 170);
        
        contentLines.forEach((line: string) => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 7;
        });
      });

      pdf.save(`${htmlToText(selectedEbook.title)}.pdf`);
      
      // Update downloads count
      await supabase
        .from("ebooks")
        .update({ downloads: selectedEbook.downloads + 1 })
        .eq("id", selectedEbook.id);

      toast({
        title: "Download concluído",
        description: "O ebook foi baixado com sucesso"
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível fazer o download",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={theme === "dark" ? logoDark : logo} alt="PageSmith Hub" className="w-10 h-10" />
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
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/my-books")}>
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
            </Card> : <div>
              <Carousel setApi={setEbooksCarouselApi} className="w-full max-w-full">
                <CarouselContent className="-ml-2 md:-ml-3">
                  {ebooks.map(ebook => <CarouselItem key={ebook.id} className="pl-2 md:pl-3 basis-[45%] md:basis-1/3 lg:basis-1/4">
                      <Card 
                        className="p-3 hover:shadow-card transition-shadow cursor-pointer"
                        onClick={() => setSelectedEbook(ebook)}
                      >
                        <div className="aspect-[2/3] bg-gradient-primary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {ebook.cover_image ? (
                            <img src={ebook.cover_image} alt={ebook.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-12 w-12 text-white" />
                          )}
                        </div>
                        <h4 
                          className="font-semibold mb-1 text-sm line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(ebook.title) }}
                        />
                        <p 
                          className="text-xs text-muted-foreground mb-2 line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(ebook.description || "Sem descrição") }}
                        />
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
              </Carousel>
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => ebooksCarouselApi?.scrollPrev()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => ebooksCarouselApi?.scrollNext()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>}
        </div>

        {/* Explorar por Gênero */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Explorar por Gênero</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div>
            <Carousel setApi={setGenresCarouselApi} className="w-full max-w-full">
              <CarouselContent className="-ml-2 md:-ml-3">
                {["Romance", "Thriller", "Inspiração", "Ficção Científica", "Mistério"].map(genre => <CarouselItem key={genre} className="pl-2 md:pl-3 basis-[45%] md:basis-1/3 lg:basis-1/4">
                    <Card className="p-6 hover:shadow-card transition-shadow cursor-pointer bg-gradient-secondary">
                      <h4 className="font-semibold text-white text-center">{genre}</h4>
                    </Card>
                  </CarouselItem>)}
              </CarouselContent>
            </Carousel>
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => genresCarouselApi?.scrollPrev()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => genresCarouselApi?.scrollNext()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Recomendado para Ti */}
        

        {/* Publicados por Mim */}
        

        {/* Ebooks Recentes */}
        
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Ebook Details Dialog */}
      <Dialog open={!!selectedEbook} onOpenChange={() => setSelectedEbook(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="space-y-4">
            {selectedEbook?.cover_image && (
              <div className="flex justify-center">
                <img 
                  src={selectedEbook.cover_image} 
                  alt={selectedEbook.title}
                  className="w-48 h-auto rounded-lg border shadow-sm"
                />
              </div>
            )}
            
            <div className="space-y-3">
              <h2 
                className="text-lg font-semibold leading-none tracking-tight"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEbook?.title || "") }}
              />
              <p 
                className="text-sm text-muted-foreground line-clamp-3"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEbook?.description || "Sem descrição") }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {selectedEbook?.created_at 
                    ? new Date(selectedEbook.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : '-'
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Páginas</p>
                <p className="font-medium">{selectedEbook?.pages || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="font-medium flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedEbook?.views}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="font-medium flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {selectedEbook?.downloads}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteEbook}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Apagar
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleDownloadEbook}
                className="flex-1 sm:flex-none"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={() => {
                  navigate(`/editor?id=${selectedEbook?.id}`);
                  setSelectedEbook(null);
                }}
                className="flex-1 sm:flex-none"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Dashboard;