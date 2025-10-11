import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Video, Briefcase, Sparkles, Type, Image, Minus } from "lucide-react";
import logo from "@/assets/logo.png";
import { EBOOK_TEMPLATES } from "@/components/templates/ebooks";

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  suggested_pages: string;
}

const CreateEbook = () => {
  const [step, setStep] = useState<"type" | "template" | "details">("type");
  const [selectedType, setSelectedType] = useState<"standard" | "interactive" | "professional" | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchTemplates();
    }
  }, [selectedType]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchTemplates = async () => {
    // For standard ebooks, use hardcoded templates
    if (selectedType === "standard") {
      const standardTemplates = EBOOK_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: "standard",
        category: "Layout",
        suggested_pages: "15-30 páginas"
      }));
      setTemplates(standardTemplates);
      return;
    }

    // For other types, fetch from database
    const { data } = await supabase
      .from("templates")
      .select("*")
      .eq("type", selectedType);

    if (data) {
      setTemplates(data);
    }
  };

  const handleCreateEbook = async () => {
    if (!title || !selectedType) {
      toast({
        title: "Informações faltando",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("ebooks").insert({
        user_id: session.user.id,
        title,
        description,
        type: selectedType,
        template_id: selectedTemplate?.id,
        pages: pages ? parseInt(pages) : 0,
      });

      if (error) throw error;

      toast({
        title: "Ebook criado!",
        description: "Seu ebook foi criado com sucesso.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ebookTypes = [
    {
      id: "standard" as const,
      name: "Ebook Padrão",
      description: "Perfeito para conteúdo baseado em texto com imagens",
      icon: BookOpen,
      gradient: "from-[#fc5934] to-[#ff8568]",
    },
    {
      id: "interactive" as const,
      name: "Ebook Interativo",
      description: "Envolva leitores com vídeo, áudio e questionários",
      icon: Video,
      gradient: "from-[#ff8568] to-[#fc5934]",
    },
    {
      id: "professional" as const,
      name: "Ebook Profissional",
      description: "Focado em negócios com recursos de marketing",
      icon: Briefcase,
      gradient: "from-[#191919] to-[#fc5934]",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === "type" ? navigate("/dashboard") : setStep("type")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logo} alt="PageSmith Hub" className="w-10 h-10" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Criar Novo Ebook
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Step: Select Type */}
        {step === "type" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Escolha o Tipo do Seu Ebook</h2>
              <p className="text-muted-foreground">
                Selecione o formato que melhor se adapta ao seu conteúdo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ebookTypes.map((type) => (
                <Card
                  key={type.id}
                  className="p-6 cursor-pointer hover:shadow-glow transition-all border-2 hover:border-primary"
                  onClick={() => {
                    setSelectedType(type.id);
                    setStep("template");
                  }}
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-4`}>
                    <type.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Select Template */}
        {step === "template" && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold">Escolha um Template</h2>
              </div>
              <p className="text-muted-foreground">
                Escolha um template projetado para ebooks {selectedType}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((template) => {
                const templateIcon = template.id === "classic" ? Type : 
                                    template.id === "visual" ? Image : 
                                    template.id === "minimal" ? Minus : BookOpen;
                const TemplateIcon = templateIcon;

                return (
                  <Card
                    key={template.id}
                    className={`p-6 cursor-pointer hover:shadow-card transition-all border-2 ${
                      selectedTemplate?.id === template.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    {selectedType === "standard" ? (
                      <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-4 flex items-center justify-center border-2 border-border relative overflow-hidden">
                        {template.id === "classic" && (
                          <div className="absolute inset-0 p-4 flex flex-col gap-2">
                            <div className="h-3 bg-foreground/80 w-3/4 rounded mx-auto"></div>
                            <div className="h-1 bg-foreground/20 w-full rounded"></div>
                            <div className="h-1 bg-foreground/20 w-full rounded"></div>
                            <div className="h-1 bg-foreground/20 w-4/5 rounded"></div>
                            <div className="flex-1 flex items-center justify-center">
                              <div className="w-16 h-16 bg-primary/20 rounded"></div>
                            </div>
                            <div className="h-1 bg-foreground/20 w-full rounded"></div>
                            <div className="h-1 bg-foreground/20 w-full rounded"></div>
                          </div>
                        )}
                        {template.id === "visual" && (
                          <div className="absolute inset-0 flex flex-col">
                            <div className="h-1/3 bg-primary/30"></div>
                            <div className="flex-1 p-4 space-y-2">
                              <div className="h-1 bg-foreground/20 w-full rounded"></div>
                              <div className="h-1 bg-foreground/20 w-full rounded"></div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="aspect-square bg-primary/20 rounded"></div>
                                <div className="aspect-square bg-primary/20 rounded"></div>
                              </div>
                            </div>
                          </div>
                        )}
                        {template.id === "minimal" && (
                          <div className="absolute inset-0 p-4 flex gap-2">
                            <div className="flex-1 space-y-2">
                              <div className="h-2 bg-foreground/80 w-2/3 rounded"></div>
                              <div className="h-1 bg-foreground/20 w-full rounded"></div>
                              <div className="h-1 bg-foreground/20 w-full rounded"></div>
                              <div className="h-1 bg-foreground/20 w-4/5 rounded"></div>
                              <div className="h-1 bg-foreground/20 w-full rounded"></div>
                            </div>
                            <div className="w-1/3 bg-primary/20 rounded"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[3/4] bg-gradient-primary rounded-lg mb-4 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <h3 className="font-semibold mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-accent rounded-full">
                        {template.category}
                      </span>
                      <span>{template.suggested_pages}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep("type")}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep("details")}
                disabled={!selectedTemplate}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step: Enter Details */}
        {step === "details" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Detalhes do Ebook</h2>
                <p className="text-muted-foreground">
                  Adicione os detalhes do seu novo ebook
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Digite o título do seu ebook"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva seu ebook..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pages">Número de Páginas</Label>
                  <Input
                    id="pages"
                    type="number"
                    placeholder={selectedTemplate?.suggested_pages || "ex: 20"}
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    min="1"
                  />
                  {selectedTemplate && (
                    <p className="text-xs text-muted-foreground">
                      Sugerido: {selectedTemplate.suggested_pages}
                    </p>
                  )}
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium">Template Selecionado</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate?.name} - {selectedType}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("template")}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleCreateEbook}
                  disabled={loading || !title}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {loading ? "Criando..." : "Criar Ebook"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateEbook;
