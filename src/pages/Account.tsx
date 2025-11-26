import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  LogOut,
  Edit2,
  BookOpen,
  Users,
  UserPlus,
  UserMinus,
  Heart,
  ExternalLink,
  Eye,
  Download,
  Edit,
  Trash2,
  Star
} from "lucide-react";
import logo from "@/assets/logo.png";
import logoDark from "@/assets/logo-dark.png";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { stripHtml } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  social_link?: string;
}

interface Stats {
  booksCreated: number;
  followers: number;
  following: number;
  booksRead: number;
}

const Account = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ booksCreated: 0, followers: 0, following: 0, booksRead: 0 });
  const [publicBooks, setPublicBooks] = useState<any[]>([]);
  const [privateBooks, setPrivateBooks] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showBookDialog, setShowBookDialog] = useState(false);
  
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useParams<{ userId?: string }>();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);
    const profileId = userId || session.user.id;
    const isOwnProfile = profileId === session.user.id;

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch stats
    const [booksData, followersData, followingData, purchasesData] = await Promise.all([
      supabase.from("ebooks").select("id", { count: "exact" }).eq("user_id", profileId),
      supabase.from("user_follows").select("id", { count: "exact" }).eq("following_id", profileId),
      supabase.from("user_follows").select("id", { count: "exact" }).eq("follower_id", profileId),
      supabase.from("purchases").select("id", { count: "exact" }).eq("user_id", profileId),
    ]);

    setStats({
      booksCreated: booksData.count || 0,
      followers: followersData.count || 0,
      following: followingData.count || 0,
      booksRead: purchasesData.count || 0,
    });

    // Fetch books
    const { data: books } = await supabase
      .from("ebooks")
      .select("*")
      .eq("user_id", profileId);

    if (books) {
      setPublicBooks(books.filter(b => b.is_public));
      setPrivateBooks(books.filter(b => !b.is_public));
    }

    // Fetch wishlist (only for own profile)
    if (isOwnProfile) {
      const { data: wishlistData } = await supabase
        .from("wishlist")
        .select("*, ebooks(*)")
        .eq("user_id", session.user.id);

      if (wishlistData) {
        setWishlist(wishlistData.map(w => w.ebooks));
      }
    }

    // Check if following (only for other profiles)
    if (!isOwnProfile) {
      const { data: followData } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", session.user.id)
        .eq("following_id", profileId)
        .single();

      setIsFollowing(!!followData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleFollow = async () => {
    if (!currentUserId || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profile.id);
        
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        toast({ title: "Deixou de seguir" });
      } else {
        await supabase
          .from("user_follows")
          .insert({ follower_id: currentUserId, following_id: profile.id });
        
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        toast({ title: "Seguindo" });
      }
    } catch (error) {
      toast({ title: "Erro ao seguir/deixar de seguir", variant: "destructive" });
    }
  };

  const isOwnProfile = !userId || userId === currentUserId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={theme === "dark" ? logoDark : logo} alt="Kutara Mabuku" className="w-10 h-10 rounded-lg" />
            <h1 className="text-2xl font-bold">Perfil</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-white text-3xl">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile?.full_name || "Usuário"}</h2>
              {profile?.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
              
              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold">{stats.booksCreated}</div>
                  <div className="text-xs text-muted-foreground">Trabalhos</div>
                </div>
                <div className="text-center cursor-pointer hover:opacity-80">
                  <div className="text-xl font-bold">{stats.followers}</div>
                  <div className="text-xs text-muted-foreground">Seguidores</div>
                </div>
                <div className="text-center cursor-pointer hover:opacity-80">
                  <div className="text-xl font-bold">{stats.following}</div>
                  <div className="text-xs text-muted-foreground">Seguindo</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{stats.booksRead}</div>
                  <div className="text-xs text-muted-foreground">Lidos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4">
            {isOwnProfile ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                className="w-full"
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Deixar de Seguir
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Seguir
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* About Section */}
        {profile?.bio && (
          <Card className="p-6">
            <h3 className="font-bold mb-2">Sobre</h3>
            <p className="text-muted-foreground">{profile.bio}</p>
            {profile.social_link && (
              <a
                href={profile.social_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Link de Rede Social
              </a>
            )}
          </Card>
        )}

        {/* Public Books */}
        {publicBooks.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Livros Públicos ({publicBooks.length})
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {publicBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => {
                    setSelectedBook(book);
                    setShowBookDialog(true);
                  }}
                  className="flex-shrink-0 w-40 cursor-pointer group"
                >
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-2 overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                    {book.cover_image ? (
                      <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{stripHtml(book.title)}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author || "Autor Desconhecido"}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {book.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {book.downloads || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Private Books (only for own profile) */}
        {isOwnProfile && privateBooks.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Livros Privados ({privateBooks.length})
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {privateBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => {
                    setSelectedBook(book);
                    setShowBookDialog(true);
                  }}
                  className="flex-shrink-0 w-40 cursor-pointer group"
                >
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-2 overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                    {book.cover_image ? (
                      <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{stripHtml(book.title)}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author || "Autor Desconhecido"}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {book.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {book.downloads || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wishlist (only for own profile) */}
        {isOwnProfile && wishlist.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Lista de Desejos ({wishlist.length})
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {wishlist.map((book) => (
                <div
                  key={book.id}
                  onClick={() => {
                    setSelectedBook(book);
                    setShowBookDialog(true);
                  }}
                  className="flex-shrink-0 w-40 cursor-pointer group"
                >
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-2 overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                    {book.cover_image ? (
                      <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{stripHtml(book.title)}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author || "Autor Desconhecido"}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {book.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {book.downloads || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Book Details Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            {selectedBook?.cover_image && (
              <div className="aspect-[2/3] w-full max-w-xs mx-auto rounded-lg overflow-hidden">
                <img src={selectedBook.cover_image} alt={selectedBook.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{stripHtml(selectedBook?.title || "")}</h2>
              
              {selectedBook?.author && (
                <p className="text-sm text-muted-foreground">
                  Por {selectedBook.author}
                </p>
              )}
              
              {selectedBook?.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {stripHtml(selectedBook.description)}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                {selectedBook?.genre && (
                  <Badge variant="secondary">{selectedBook.genre}</Badge>
                )}
                {selectedBook?.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{selectedBook.rating}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Visualizações</p>
                  <p className="font-medium flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedBook?.views || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="font-medium flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {selectedBook?.downloads || 0}
                  </p>
                </div>
              </div>

              {selectedBook?.price !== undefined && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="text-lg font-bold">
                    {selectedBook.price > 0 ? `${selectedBook.price} MZN` : "Grátis"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBookDialog(false);
                  navigate(`/book/${selectedBook?.id}`);
                }}
                className="w-full sm:w-auto"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Button>
              <Button
                onClick={() => {
                  setShowBookDialog(false);
                  navigate(`/editor?id=${selectedBook?.id}`);
                }}
                className="w-full sm:w-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </DialogFooter>
          )}
          
          {!isOwnProfile && (
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowBookDialog(false);
                  navigate(`/book/${selectedBook?.id}`);
                }}
                className="w-full"
              >
                Ver Detalhes
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      {profile && (
        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          profile={profile}
          onProfileUpdated={fetchData}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Account;
