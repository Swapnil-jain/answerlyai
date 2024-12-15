"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { LogOut, LogIn, LayoutDashboard, Menu, X, ArrowRight } from "lucide-react";

interface HeaderProps {
  className?: string;
}

export default function Header({ className = "" }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollToSection } = useSmoothScroll();
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  const isBuilder = pathname === "/builder";

  useEffect(() => {
    if (isBuilder) return;

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

  const handleNavClick = async (sectionId: string) => {
    if (pathname !== '/') {
      await router.push('/');
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 73;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMenuOpen(false);
    }
  };

  const mobileLink = "/mobile-notice";
  const dashboardLink = session ? "/dashboard" : "/login";
  const loginLink = window.innerWidth < 640 ? mobileLink : "/login";

  const handleNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname !== "/") {
      router.push("/");
    } else {
      if (window.innerWidth < 640) {
        router.push("/mobile-notice");
      } else {
        router.push("/login");
      }
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
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="AnswerlyAI Logo" width={40} height={40} />
            <span className="font-bold text-xl text-blue-600 hover:text-blue-700">AnswerlyAI</span>
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-blue-600">Only.Relevant.Features.</span>
            </div>
          </Link>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
                onClick={() => handleNavClick('demo')}
                className="text-gray-600 hover:text-gray-900"
              >
              Watch
            </button>
            <button
              onClick={() => handleNavClick('features')}
              className="text-gray-600 hover:text-gray-900"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('pricing')}
              className="text-gray-600 hover:text-gray-900"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-gray-600 hover:text-gray-900"
            >
              Contact
            </button>
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {session ? (
              <>
                <Link href="/builder" className="hidden sm:block">
                  <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                    Workflow Editor
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href={window.innerWidth < 640 ? mobileLink : dashboardLink} className="hidden sm:block">
                  <Button variant="outline" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="ghost"
                >
                <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="#" 
                  onClick={handleNavigation} 
                  className="hidden sm:block"
                >
                  <Button variant="ghost" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                </Link>
                <Link 
                  href="#" 
                  onClick={handleNavigation} 
                  className="hidden sm:block"
                >
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started
                    {/* <ArrowRight className="w-4 h-4" /> */}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[73px] bg-white border-t shadow-lg">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <button
                onClick={() => handleNavClick('demo')}
                className="text-gray-600 hover:text-gray-900 py-2"
              >
                Watch
              </button>
              <button
                onClick={() => handleNavClick('features')}
                className="text-gray-600 hover:text-gray-900 py-2"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('pricing')}
                className="text-gray-600 hover:text-gray-900 py-2"
              >
                Pricing
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className="text-gray-600 hover:text-gray-900 py-2"
              >
                Contact
              </button>
              {session ? (
                <>
                  <Link href="/mobile-notice" className="sm:hidden">
                    <Button variant="outline" className="w-full gap-2 flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full gap-2 flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="#" onClick={handleNavigation} className="hidden sm:block w-full">
                    <Button variant="ghost" className="w-full gap-2 flex items-center justify-center">
                      <LogIn className="w-4 h-4" />
                      Login
                    </Button>
                  </Link>
                  <Link href="#" onClick={handleNavigation} className="sm:hidden w-full">
                    <Button className="w-full gap-2 bg-blue-600 text-white flex items-center justify-center">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setAlertOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Log Out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
