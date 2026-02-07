
import { Search, User as UserIcon, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/context/auth-core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useWatchlistStore();
  const { user, signInWithGoogle, logout } = useAuth();
  const watchlistCount = items.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="py-4 px-4 md:px-8 border-b border-muted/30 z-50 relative bg-background/80 backdrop-blur-md sticky top-0">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-1">
            <span className="text-3xl font-poster text-accent">Next</span>
            <span className="text-3xl font-poster text-white">Trailer</span>
          </Link>
          <div className="hidden md:flex ml-10 space-x-6">
            <Link
              to="/"
              className={`transition-colors ${isActive('/') ? 'text-accent font-medium' : 'hover:text-accent font-medium'}`}
            >
              Home
            </Link>
            <Link
              to="/movies"
              className={`transition-colors ${isActive('/movies') ? 'text-accent font-medium' : 'hover:text-accent font-medium'}`}
            >
              Film
            </Link>
            <Link
              to="/tv"
              className={`transition-colors ${isActive('/tv') ? 'text-accent font-medium' : 'hover:text-accent font-medium'}`}
            >
              Serie TV
            </Link>
            <Link
              to="/oscar"
              className={`transition-colors ${isActive('/oscar') ? 'text-accent font-medium' : 'hover:text-accent font-medium'}`}
            >
              Oscar
            </Link>
            <Link
              to="/genres"
              className={`transition-colors ${isActive('/genres') ? 'text-accent font-medium' : 'hover:text-accent font-medium'}`}
            >
              Sfoglia
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <form
            onSubmit={handleSearch}
            className="hidden md:flex relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca titoli, persone..."
              className="bg-secondary/50 rounded-full px-4 py-2 pl-10 text-sm w-48 lg:w-64 focus:outline-none focus:ring-1 focus:ring-accent transition-all focus:w-80"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </form>

          <Button variant="ghost" className="md:hidden" size="icon" onClick={() => navigate('/search')}>
            <Search className="h-4 w-4" />
          </Button>

          <Link to="/watchlist">
            <Button variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10 relative px-2 sm:px-4">
              <span className="hidden sm:inline">Watchlist</span>
              {watchlistCount > 0 && (
                <span className="bg-accent text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center sm:ml-2 sm:static absolute -top-1 -right-1">
                  {watchlistCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-border hover:border-accent transition-colors">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {user.displayName?.charAt(0) || <UserIcon className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/watchlist')}>
                  Watchlist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Esci</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => signInWithGoogle()}
              className="bg-accent hover:bg-accent/90 text-white font-medium px-4 h-10 flex items-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Accedi</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
