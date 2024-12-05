"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter 
} from "@/components/ui/alert-dialog";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { useSupabase } from "@/lib/supabase/provider";
import { LogOut, LogIn, LayoutDashboard, Sparkles } from "lucide-react";

interface HeaderProps {
  className?: string;
}

export default function Header({ className = "" }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollToSection } = useSmoothScroll();
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  const isBuilder = pathname === "/builder";

  useEffect(() => {
    if (isBuilder) return; // Don't add scroll effect in builder

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isBuilder]);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({
    title: '',
    description: '',
    onClose: () => {}
  });

  const handleLogout = () => {
    setAlertMessage({
      title: 'Confirm Logout',
      description: 'Are you sure you want to logout?',
      onClose: () => setAlertOpen(false)
    });
    setAlertOpen(true);
  };

  const confirmLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setAlertOpen(false);
    }
  };

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      scrollToSection(sectionId);
    }
  };

  return (
    <header
      className={`w-full py-4 fixed top-0 z-50 transition-all duration-200 ${
        isBuilder
          ? className
          : isScrolled
          ? "bg-white/80 backdrop-blur-sm shadow-sm"
          : "bg-transparent"
      }`}
    >
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="secondary" onClick={() => setAlertOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">AnswerlyAI</span>
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">
                Only What You Need.
              </span>
            </div>
          </Link>

          {!isBuilder && (
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavClick("demo")}
                className="text-gray-600 hover:text-blue-600 text-sm font-medium"
              >
                Live Demo
              </button>
              <button
                onClick={() => handleNavClick("features")}
                className="text-gray-600 hover:text-blue-600 text-sm font-medium"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick("pricing")}
                className="text-gray-600 hover:text-blue-600 text-sm font-medium"
              >
                Pricing
              </button>
            </nav>
          )}

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                {!isBuilder && (
                  <Link href="/builder">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                      Workflow Editor
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                </Link>
                <Link href="/builder">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2">
                    Try Now <Sparkles className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
