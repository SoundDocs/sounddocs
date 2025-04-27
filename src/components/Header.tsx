import React, { useState, useEffect } from 'react';
import { Menu, X, Bookmark, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  dashboard?: boolean;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ dashboard = false, onSignOut }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
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

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await supabase.auth.signOut();
        navigate('/');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled ? 'bg-gray-900/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2" aria-label="SoundDocs Home">
          <Bookmark className="h-8 w-8 text-indigo-400" />
          <span className="text-white text-xl font-bold">SoundDocs</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
          {dashboard ? (
            <>
              <button 
                onClick={handleSignOut} 
                className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-200">Features</a>
              <a href="#get-started" className="text-gray-300 hover:text-white transition-colors duration-200">Get Started</a>
              <a href="mailto:contact@sounddocs.org" className="text-gray-300 hover:text-white transition-colors duration-200">Contact</a>
              {user ? (
                <Link to="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200">
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
              {dashboard ? (
                <>
                  <button 
                    onClick={handleSignOut} 
                    className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors duration-200">Features</a>
                  <a href="#get-started" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors duration-200">Get Started</a>
                  <a href="mailto:contact@sounddocs.org" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors duration-200">Contact</a>
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