import React from "react";
import { Link } from "react-router-dom";
import { Home, Compass, ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const NotFoundPage: React.FC = () => {
  return (
    <>
      <Header />
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-3xl text-center">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-sm"
            style={{
              backgroundImage:
                "url('https://images.pexels.com/photos/792416/pexels-photo-792416.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
            }}
          ></div>
          <div className="relative bg-gray-900 bg-opacity-70 p-8 md:p-12 rounded-2xl shadow-2xl border border-gray-700/50">
            <div className="mb-6">
              <span className="text-8xl md:text-9xl font-bold text-indigo-400 tracking-tighter">
                404
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-2">
                Page Not Found
              </h1>
              <p className="text-gray-300 mt-4 max-w-md mx-auto">
                It seems you've unplugged the wrong cable. The page you're looking for might have been moved, deleted, or never existed.
              </p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back Home
              </Link>
              <Link
                to="/resources"
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all duration-300"
              >
                <Compass className="mr-2 h-5 w-5" />
                Explore Resources
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFoundPage;
