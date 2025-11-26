import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  LogOut,
  Edit2,
  BookOpen,
  Users,
  UserPlus,
  UserMinus,
  Heart,
  ExternalLink
} from "lucide-react";
import logo from "@/assets/logo.png";
import logoDark from "@/assets/logo-dark.png";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { BookCard } from "@/components/BookCard";

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {publicBooks.map((book) => (
                <BookCard 
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author || "Autor Desconhecido"}
                  coverImage={book.cover_image}
                  description={book.description}
                  genre={book.genre}
                  price={book.price}
                  downloads={book.downloads}
                  pages={book.pages}
                  formats={book.formats}
                  publishedAt={book.published_at}
                  rating={book.rating}
                />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {privateBooks.map((book) => (
                <BookCard 
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author || "Autor Desconhecido"}
                  coverImage={book.cover_image}
                  description={book.description}
                  genre={book.genre}
                  price={book.price}
                  downloads={book.downloads}
                  pages={book.pages}
                  formats={book.formats}
                  publishedAt={book.published_at}
                  rating={book.rating}
                />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlist.map((book) => (
                <BookCard 
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author || "Autor Desconhecido"}
                  coverImage={book.cover_image}
                  description={book.description}
                  genre={book.genre}
                  price={book.price}
                  downloads={book.downloads}
                  pages={book.pages}
                  formats={book.formats}
                  publishedAt={book.published_at}
                  rating={book.rating}
                />
              ))}
            </div>
          </div>
        )}
      </main>

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
