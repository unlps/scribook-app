import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Eye,
  Download,
  Plus,
  Trash2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ClassicTemplate } from "@/components/templates/ebooks/ClassicTemplate";
import { MinimalTemplate } from "@/components/templates/ebooks/MinimalTemplate";
import { VisualTemplate } from "@/components/templates/ebooks/VisualTemplate";

interface Chapter {
  id?: string;
  title: string;
  content: string;
  chapter_order: number;
}

interface Ebook {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  template_id: string | null;
}

export default function Editor() {
  const [searchParams] = useSearchParams();
  const ebookId = searchParams.get("id");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    if (!ebookId) {
      navigate("/dashboard");
      return;
    }
    loadEbook();
  }, [ebookId]);

  const loadEbook = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: ebookData, error: ebookError } = await supabase
        .from("ebooks")
        .select("*")
        .eq("id", ebookId)
        .single();

      if (ebookError) throw ebookError;
      setEbook(ebookData);

      const { data: chaptersData, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .eq("ebook_id", ebookId)
        .order("chapter_order", { ascending: true });

      if (chaptersError) throw chaptersError;
      
      if (chaptersData && chaptersData.length > 0) {
        setChapters(chaptersData);
      } else {
        // Se não houver capítulos, criar um inicial
        setChapters([{
          title: "Capítulo 1",
          content: "",
          chapter_order: 0,
        }]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar ebook",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ebook) return;

    setSaving(true);
    try {
      // Salvar metadados do ebook
      const { error: ebookError } = await supabase
        .from("ebooks")
        .update({
          title: ebook.title,
          description: ebook.description,
          pages: chapters.length,
        })
        .eq("id", ebook.id);

      if (ebookError) throw ebookError;

      // Deletar capítulos antigos e inserir novos
      const { error: deleteError } = await supabase
        .from("chapters")
        .delete()
        .eq("ebook_id", ebook.id);

      if (deleteError) throw deleteError;

      const chaptersToInsert = chapters.map((chapter, index) => ({
        ebook_id: ebook.id,
        title: chapter.title,
        content: chapter.content,
        chapter_order: index,
      }));

      const { error: chaptersError } = await supabase
        .from("chapters")
        .insert(chaptersToInsert);

      if (chaptersError) throw chaptersError;

      toast({
        title: "Salvo com sucesso!",
        description: "Todas as alterações foram salvas.",
      });

      // Recarregar para obter IDs atualizados
      await loadEbook();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      title: `Capítulo ${chapters.length + 1}`,
      content: "",
      chapter_order: chapters.length,
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapterId(chapters.length);
  };

  const handleDeleteChapter = (index: number) => {
    if (chapters.length === 1) {
      toast({
        title: "Ação não permitida",
        description: "O ebook precisa ter pelo menos um capítulo.",
        variant: "destructive",
      });
      return;
    }
    const newChapters = chapters.filter((_, i) => i !== index);
    setChapters(newChapters);
    if (selectedChapterId >= index && selectedChapterId > 0) {
      setSelectedChapterId(selectedChapterId - 1);
    }
  };

  const updateChapter = (index: number, field: "title" | "content", value: string) => {
    const newChapters = [...chapters];
    newChapters[index][field] = value;
    setChapters(newChapters);
  };

  const handleDownloadPDF = async () => {
    if (!ebook) return;

    try {
      toast({
        title: "Gerando PDF...",
        description: "Isso pode levar alguns segundos.",
      });

      const previewElement = document.getElementById("ebook-preview");
      if (!previewElement) return;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Capturar cada capítulo como uma página
      for (let i = 0; i < chapters.length; i++) {
        const chapterElement = document.getElementById(`chapter-${i}`);
        if (!chapterElement) continue;

        const canvas = await html2canvas(chapterElement, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      }

      pdf.save(`${ebook.title}.pdf`);

      toast({
        title: "PDF gerado!",
        description: "O download foi iniciado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderTemplate = () => {
    if (!ebook) return null;

    const templateProps = {
      title: ebook.title,
      author: "Autor",
      coverImage: ebook.cover_image || "",
      chapters: chapters.map((ch) => ({
        title: ch.title,
        content: ch.content,
      })),
    };

    switch (ebook.template_id) {
      case "minimal":
        return <MinimalTemplate {...templateProps} />;
      case "visual":
        return <VisualTemplate {...templateProps} />;
      default:
        return <ClassicTemplate {...templateProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    );
  }

  if (!ebook) return null;

  const selectedChapter = chapters[Number(selectedChapterId)];

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{ebook.title}</h1>
                <p className="text-sm text-muted-foreground">Editor de Ebook</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("preview")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="edit">
              <FileText className="h-4 w-4 mr-2" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar - Lista de Capítulos */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Capítulos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedChapterId === index
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedChapterId(index)}
                    >
                      <span className="text-sm truncate flex-1">
                        {chapter.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(index);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={handleAddChapter}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Capítulo
                  </Button>
                </CardContent>
              </Card>

              {/* Editor Principal */}
              <div className="lg:col-span-3 space-y-6">
                {/* Metadados do Ebook */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Ebook</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Título</label>
                      <Input
                        value={ebook.title}
                        onChange={(e) =>
                          setEbook({ ...ebook, title: e.target.value })
                        }
                        placeholder="Título do ebook"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        value={ebook.description || ""}
                        onChange={(e) =>
                          setEbook({ ...ebook, description: e.target.value })
                        }
                        placeholder="Descrição do ebook"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Editor do Capítulo Selecionado */}
                {selectedChapter && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Editar Capítulo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">
                          Título do Capítulo
                        </label>
                        <Input
                          value={selectedChapter.title}
                          onChange={(e) =>
                            updateChapter(
                              Number(selectedChapterId),
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Título do capítulo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Conteúdo
                        </label>
                        <ReactQuill
                          theme="snow"
                          value={selectedChapter.content}
                          onChange={(value) =>
                            updateChapter(
                              Number(selectedChapterId),
                              "content",
                              value
                            )
                          }
                          modules={quillModules}
                          className="h-96 mb-16"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualização do Ebook</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="ebook-preview" className="bg-white p-8 rounded-lg">
                  {renderTemplate()}
                  
                  {/* Capítulos individuais para PDF */}
                  <div className="hidden">
                    {chapters.map((chapter, index) => (
                      <div
                        key={index}
                        id={`chapter-${index}`}
                        className="bg-white p-8 mb-8"
                        style={{ minHeight: "297mm", width: "210mm" }}
                      >
                        <h2 className="text-2xl font-bold mb-4">
                          {chapter.title}
                        </h2>
                        <div
                          dangerouslySetInnerHTML={{ __html: chapter.content }}
                          className="prose max-w-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
