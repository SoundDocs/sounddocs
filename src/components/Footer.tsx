import React from "react";
import { Bookmark, Mail, Github, MessageSquare, Heart } from "lucide-react"; // Added Heart
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-950 pt-12 pb-8 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-6 md:mb-0">
            <Bookmark className="h-6 w-6 text-indigo-400 mr-2" />
            <span className="text-white text-xl font-bold">SoundDocs</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="mailto:contact@sounddocs.org"
              className="flex items-center text-gray-300 hover:text-white transition-all duration-200"
            >
              <Mail className="h-5 w-5 mr-2" />
              <span>Contact</span>
            </a>
            <a
              href="https://github.com/SoundDocs/sounddocs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-300 hover:text-white transition-all duration-200"
            >
              <Github className="h-5 w-5 mr-2" />
              <span>GitHub</span>
            </a>
            <a
              href="https://discord.gg/NRcRtyxFQa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-300 hover:text-white transition-all duration-200"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              <span>Discord</span>
            </a>
            {/* Added Donation Link */}
            <a
              href="https://buy.stripe.com/7sIaFxgFu7ulawEbIJ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-pink-400 hover:text-pink-300 transition-all duration-200"
            >
              <Heart className="h-5 w-5 mr-2" />
              <span>Donate</span>
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} SoundDocs. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm">
              <Link
                to="/privacy-policy"
                className="text-gray-500 hover:text-white transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-gray-500 hover:text-white transition-colors duration-200"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
