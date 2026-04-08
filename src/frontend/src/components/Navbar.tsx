import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, LogOut, Menu, Search, Upload, User, X } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: "/search", search: { q: searchQuery.trim() } });
    }
  };

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      qc.clear();
    } else {
      try {
        await login();
      } catch (err: any) {
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const username =
    profile?.username ||
    `${identity?.getPrincipal().toString().slice(0, 8)}...`;

  return (
    <header className="sticky top-0 z-50 bg-card nav-shadow">
      {/* Festive top bar */}
      <div className="festive-bar h-1 w-full" />

      <nav className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-800 text-xl text-saffron leading-none">
              Desi<span className="text-desi-green">Tube</span>
            </span>
          </div>
        </Link>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-xl hidden md:flex"
        >
          <div className="flex w-full rounded-full overflow-hidden border border-border bg-muted/50">
            <Input
              data-ocid="nav.search_input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for videos, channels..."
              className="flex-1 border-0 bg-transparent rounded-none focus-visible:ring-0 text-sm px-4"
            />
            <button
              type="submit"
              className="px-4 bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated && (
            <Button
              data-ocid="nav.upload_button"
              asChild
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/upload">
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            </Button>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full hover:bg-muted p-1 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    to="/channel/$principal"
                    params={{
                      principal: identity?.getPrincipal().toString() ?? "",
                    }}
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Channel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/upload"
                    className="flex items-center gap-2 md:hidden"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAuth}
                  className="flex items-center gap-2 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              data-ocid="nav.login_button"
              onClick={handleAuth}
              disabled={isLoggingIn}
              size="sm"
              className="bg-primary hover:bg-saffron-dark text-primary-foreground rounded-full px-5"
            >
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile search */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-3">
          <form
            onSubmit={handleSearch}
            className="flex rounded-full overflow-hidden border border-border"
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="flex-1 border-0 bg-transparent rounded-none focus-visible:ring-0 text-sm"
            />
            <button
              type="submit"
              className="px-3 bg-primary text-primary-foreground"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
