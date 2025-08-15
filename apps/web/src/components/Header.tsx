import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Bookmark,
  LogOut,
  User as UserIcon,
  Users as UsersIcon,
  Settings,
  ChevronDown,
  BookOpen,
} from "lucide-react"; // Added BookOpen
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface HeaderProps {
  dashboard?: boolean;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ dashboard = false, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isSharedRoute = location.pathname.includes("/shared/");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await supabase.auth.signOut();
        navigate("/");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
    setIsMenuOpen(false);
  };

  const goToHome = () => {
    if (isSharedRoute) {
      window.location.href = "https://sounddocs.org/";
      return;
    }
    navigate("/");
  };

  const navigateToProfile = () => {
    setIsProfileMenuOpen(false);
    navigate("/profile");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled ? "bg-gray-900/95 shadow-md backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div
          onClick={goToHome}
          className="flex items-center space-x-2 cursor-pointer"
          aria-label="SoundDocs Home"
        >
          <Bookmark className="h-8 w-8 text-indigo-400" />
          <span className="text-white text-xl font-bold">SoundDocs</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
          {dashboard && user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/acoustiq"
                className="text-gray-300 hover:text-white transition-colors duration-200 p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="AcoustIQ"
                title="AcoustIQ"
              >
                AcoustIQ
              </Link>
              {/* Reduced space for tighter grouping */}
              <Link
                to="/shared-with-me"
                className="text-gray-300 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Shared with me"
                title="Shared with me"
              >
                <UsersIcon className="h-5 w-5" />
              </Link>
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="User menu"
                  aria-haspopup="true"
                  aria-expanded={isProfileMenuOpen}
                >
                  <UserIcon className="h-5 w-5" />
                  <ChevronDown
                    className={`h-4 w-4 ml-1 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                    <button
                      onClick={navigateToProfile}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : isSharedRoute ? (
            <a
              href="https://sounddocs.org/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
            >
              Go to SoundDocs
            </a>
          ) : (
            <>
              <a
                href="/#features"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/#features");
                }}
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Features
              </a>
              <a
                href="/#get-started"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/#get-started");
                }}
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Get Started
              </a>
              <Link
                to="/resources"
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Resources
              </Link>
              <a
                href="mailto:contact@sounddocs.org"
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
                >
                  Log In
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Mobile Navigation Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4" aria-label="Mobile Navigation">
              {dashboard && user ? (
                <>
                  <Link
                    to="/shared-with-me"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Shared with me
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : isSharedRoute ? (
                <a
                  href="https://sounddocs.org/"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200 text-center"
                >
                  Go to SoundDocs
                </a>
              ) : (
                <>
                  <a
                    href="/#features"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/#features");
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Features
                  </a>
                  <a
                    href="/#get-started"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/#get-started");
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Get Started
                  </a>
                  <Link
                    to="/resources"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Resources
                  </Link>
                  <a
                    href="mailto:contact@sounddocs.org"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Contact
                  </a>
                  {user ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200 text-center"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200 text-center"
                    >
                      Log In
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
