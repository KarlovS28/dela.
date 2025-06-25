import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PersonalCabinet } from "@/components/personal-cabinet/personal-cabinet";
import { LogoIcon } from "@/components/ui/logo";
import { DownloadLogo } from "@/components/ui/download-logo";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, User, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPersonalCabinet, setShowPersonalCabinet] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      queryClient.clear();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
      queryClient.clear();
      window.location.reload();
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "sysadmin":
        return "Системный администратор";
      case "accountant":
        return "Бухгалтер";
      case "office-manager":
        return "Офис-менеджер";
      default:
        return role;
    }
  };

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-primary">dela.</h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon" 
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 sm:space-x-3 h-auto p-1 sm:p-2">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {user?.fullName?.split(" ").map(n => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role ? getRoleDisplayName(user.role) : ""}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowPersonalCabinet(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Личный кабинет
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <PersonalCabinet 
        open={showPersonalCabinet}
        onOpenChange={setShowPersonalCabinet}
      />
    </>
  );
}