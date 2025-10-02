import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Video, Briefcase, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

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
        title: "Missing information",
        description: "Please fill in all required fields",
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
        title: "Ebook created!",
        description: "Your ebook has been created successfully.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
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
      name: "Standard Ebook",
      description: "Perfect for text-based content with images",
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "interactive" as const,
      name: "Interactive Ebook",
      description: "Engage readers with video, audio, and quizzes",
      icon: Video,
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      id: "professional" as const,
      name: "Professional Ebook",
      description: "Business-focused with marketing features",
      icon: Briefcase,
      gradient: "from-indigo-500 to-purple-500",
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
              Create New Ebook
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Step: Select Type */}
        {step === "type" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Choose Your Ebook Type</h2>
              <p className="text-muted-foreground">
                Select the format that best suits your content
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
                <h2 className="text-3xl font-bold">Choose a Template</h2>
              </div>
              <p className="text-muted-foreground">
                Pick a template designed for {selectedType} ebooks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`p-6 cursor-pointer hover:shadow-card transition-all border-2 ${
                    selectedTemplate?.id === template.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="aspect-[3/4] bg-gradient-primary rounded-lg mb-4 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
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
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep("type")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("details")}
                disabled={!selectedTemplate}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Enter Details */}
        {step === "details" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Ebook Details</h2>
                <p className="text-muted-foreground">
                  Add the details for your new ebook
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your ebook title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your ebook..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pages">Number of Pages</Label>
                  <Input
                    id="pages"
                    type="number"
                    placeholder={selectedTemplate?.suggested_pages || "e.g., 20"}
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    min="1"
                  />
                  {selectedTemplate && (
                    <p className="text-xs text-muted-foreground">
                      Suggested: {selectedTemplate.suggested_pages}
                    </p>
                  )}
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium">Selected Template</p>
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
                  Back
                </Button>
                <Button
                  onClick={handleCreateEbook}
                  disabled={loading || !title}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {loading ? "Creating..." : "Create Ebook"}
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
