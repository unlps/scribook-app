import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/RichTextEditor";
import { ArrowLeft, Save, Eye, Download, Plus, Trash2, FileText, Upload, X } from "lucide-react";
import jsPDF from "jspdf";
import { sanitizeHtml } from "@/lib/utils";
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
  author: string | null;
}
export default function Editor() {
  const [searchParams] = useSearchParams();
  const ebookId = searchParams.get("id");
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  useEffect(() => {
    if (!ebookId) {
      navigate("/dashboard");
      return;
    }
    loadEbook();
  }, [ebookId]);
  const loadEbook = async () => {
    try {
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
        data: ebookData,
        error: ebookError
      } = await supabase.from("ebooks").select("*").eq("id", ebookId).single();
      if (ebookError) throw ebookError;
      setEbook(ebookData);
      setCoverImagePreview(ebookData.cover_image);
      const {
        data: chaptersData,
        error: chaptersError
      } = await supabase.from("chapters").select("*").eq("ebook_id", ebookId).order("chapter_order", {
        ascending: true
      });
      if (chaptersError) throw chaptersError;
      if (chaptersData && chaptersData.length > 0) {
        setChapters(chaptersData);
      } else {
        setChapters([{
          title: "Capítulo 1",
          content: "",
          chapter_order: 0
        }]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar ebook",
        description: error.message,
        variant: "destructive"
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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;

      // Upload cover image if new one is selected
      let coverImageUrl = ebook.cover_image;
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        const {
          error: uploadError
        } = await supabase.storage.from('ebook-covers').upload(filePath, coverImage);
        if (!uploadError) {
          const {
            data: {
              publicUrl
            }
          } = supabase.storage.from('ebook-covers').getPublicUrl(filePath);
          coverImageUrl = publicUrl;
        }
      }
      const {
        error: ebookError
      } = await supabase.from("ebooks").update({
        title: ebook.title,
        description: ebook.description,
        pages: chapters.length,
        cover_image: coverImageUrl,
        author: ebook.author
      }).eq("id", ebook.id);
      if (ebookError) throw ebookError;
      const {
        error: deleteError
      } = await supabase.from("chapters").delete().eq("ebook_id", ebook.id);
      if (deleteError) throw deleteError;
      const chaptersToInsert = chapters.map((chapter, index) => ({
        ebook_id: ebook.id,
        title: chapter.title,
        content: chapter.content,
        chapter_order: index
      }));
      const {
        error: chaptersError
      } = await supabase.from("chapters").insert(chaptersToInsert);
      if (chaptersError) throw chaptersError;
      toast({
        title: "Salvo com sucesso!",
        description: "Todas as alterações foram salvas."
      });
      await loadEbook();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const handleAddChapter = () => {
    const newChapter: Chapter = {
      title: `Capítulo ${chapters.length + 1}`,
      content: "",
      chapter_order: chapters.length
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapterId(chapters.length);
  };
  const handleDeleteChapter = (index: number) => {
    if (chapters.length === 1) {
      toast({
        title: "Ação não permitida",
        description: "O ebook precisa ter pelo menos um capítulo.",
        variant: "destructive"
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
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    setEbook({
      ...ebook,
      cover_image: null
    });
  };
  const handleDownloadPDF = async () => {
    if (!ebook) return;
    try {
      // Helper function to convert HTML to plain text
      const htmlToText = (html: string) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
      };
      
      const pdf = new jsPDF();
      let yPosition = 20;

      // Cover page with image
      if (coverImagePreview) {
        try {
          const img = new Image();
          img.src = coverImagePreview;
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
      const titleText = htmlToText(ebook.title);
      const titleLines = pdf.splitTextToSize(titleText, 170);
      pdf.text(titleLines, 20, yPosition);
      yPosition += titleLines.length * 12 + 20;
      if (ebook.author) {
        pdf.setFontSize(14);
        pdf.text(`Escrito por ${ebook.author}`, 20, yPosition);
      }

      // Description page
      if (ebook.description) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(12);
        const descText = htmlToText(ebook.description);
        const descLines = pdf.splitTextToSize(descText, 170);
        pdf.text(descLines, 20, yPosition);
      }

      // Chapters
      chapters.forEach((chapter) => {
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
      
      pdf.save(`${htmlToText(ebook.title)}.pdf`);
      toast({
        title: "PDF gerado!",
        description: "O download foi iniciado."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando editor...</p>
        </div>
      </div>;
  }
  if (!ebook) return null;
  const selectedChapter = chapters[selectedChapterId];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                
                <p className="text-sm text-muted-foreground">Editor de Ebook</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}>
                <Eye className="h-4 w-4 mr-2" />
                {activeTab === "edit" ? "Visualizar" : "Editar"}
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
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="edit">
              <FileText className="h-4 w-4 mr-2" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar - Navigation */}
              <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Navegação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant={selectedChapterId === -1 ? "default" : "outline"} className="w-full justify-start" onClick={() => setSelectedChapterId(-1)}>
                    Informações do Ebook
                  </Button>
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Capítulos</h3>
                    {chapters.map((chapter, index) => {
                    // Convert HTML to plain text for display
                    const temp = document.createElement('div');
                    temp.innerHTML = chapter.title;
                    const plainTitle = temp.textContent || temp.innerText || `Capítulo ${index + 1}`;
                    return <div key={index} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedChapterId === index ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setSelectedChapterId(index)}>
                          <span className="text-sm truncate flex-1 pr-2">
                            {plainTitle}
                          </span>
                          {chapters.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={e => {
                        e.stopPropagation();
                        handleDeleteChapter(index);
                      }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>}
                        </div>;
                  })}
                    <Button variant="outline" size="sm" className="w-full mt-4" onClick={handleAddChapter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Capítulo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Main Editor */}
              <div className="lg:col-span-3 space-y-6">
                {/* Ebook Info Section */}
                {selectedChapterId === -1 && <Card>
                    <CardHeader>
                      <CardTitle>Informações do Ebook</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Título</label>
                        <RichTextEditor content={ebook.title} onChange={content => setEbook({
                      ...ebook,
                      title: content
                    })} placeholder="Título do ebook" className="min-h-[100px]" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Descrição</label>
                        <RichTextEditor content={ebook.description || ""} onChange={content => setEbook({
                      ...ebook,
                      description: content
                    })} placeholder="Descrição do ebook" className="min-h-[200px]" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Autor</label>
                        <Input value={ebook.author || ""} onChange={e => setEbook({
                      ...ebook,
                      author: e.target.value
                    })} placeholder="Nome do autor" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Capa do Ebook</label>
                        {coverImagePreview ? <div className="relative">
                            <img src={coverImagePreview} alt="Capa" className="w-full max-w-xs h-auto rounded-lg border" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemoveCoverImage}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div> : <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                            <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" id="cover-upload" />
                            <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center gap-2">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Clique para fazer upload da capa
                              </p>
                            </label>
                          </div>}
                      </div>
                    </CardContent>
                  </Card>}

                {/* Chapter Editor */}
                {selectedChapter && <Card>
                    <CardHeader>
                      <CardTitle>Editar Capítulo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Título do Capítulo
                        </label>
                        <RichTextEditor content={selectedChapter.title} onChange={content => updateChapter(selectedChapterId, "title", content)} placeholder="Título do capítulo" className="min-h-[100px]" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Conteúdo
                        </label>
                        <RichTextEditor content={selectedChapter.content} onChange={content => updateChapter(selectedChapterId, "content", content)} placeholder="Escreva o conteúdo do capítulo..." className="min-h-[400px]" />
                      </div>
                    </CardContent>
                  </Card>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Visualização do Ebook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto space-y-12 p-8 bg-white dark:bg-gray-900 rounded-lg">
                  {/* Cover */}
                  {coverImagePreview && <div className="text-center pb-12 border-b">
                      <div className="flex justify-center">
                        <img src={coverImagePreview} alt={ebook.title} className="w-full max-w-md h-auto rounded-lg shadow-lg" />
                      </div>
                    </div>}

                  {/* Title Page */}
                  <div className="text-center space-y-6 pb-12 border-b">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(ebook.title)
                  }} />
                    {ebook.author && <p className="text-xl text-gray-700 dark:text-gray-300">
                        Escrito por {ebook.author}
                      </p>}
                  </div>

                  {/* Description Page */}
                  {ebook.description && <div className="pb-12 border-b">
                      <div className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(ebook.description)
                  }} />
                    </div>}

                  {/* Chapters */}
                  {chapters.map((chapter, index) => <div key={index} className="space-y-6">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(chapter.title)
                  }} />
                      <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(chapter.content)
                  }} />
                      {index < chapters.length - 1 && <div className="border-t my-8"></div>}
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}