import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Info,
  Loader,
  Mic,
  Video,
  Lightbulb,
  ClipboardCheck,
  ChevronRight,
  Edit2,
  Check,
  X,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [editableUserName, setEditableUserName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [nameUpdateError, setNameUpdateError] = useState<string | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);


  useEffect(() => {
    setLoading(authLoading);
    if (!authLoading) {
      if (authUser) {
        const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "User";
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        setUserName(capitalizedName);
        setEditableUserName(capitalizedName);
      } else {
        navigate("/login");
      }
    }
  }, [authUser, authLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setSupabaseError("Failed to sign out. Please try again.");
    }
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setEditableUserName(userName); // Ensure input starts with current name
    setNameUpdateError(null); // Clear previous errors
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditableUserName(userName); // Reset to original name
    setNameUpdateError(null);
  };

  const handleSaveName = async () => {
    if (editableUserName.trim() === "") {
      setNameUpdateError("Name cannot be empty.");
      return;
    }
    if (editableUserName.trim() === userName) {
      setIsEditingName(false); // No change, just exit edit mode
      return;
    }

    setIsSavingName(true);
    setNameUpdateError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: editableUserName.trim() },
      });
      if (error) throw error;
      // userName will be updated by the useEffect listening to authUser changes
      setIsEditingName(false);
    } catch (error: any) {
      console.error("Error updating user name:", error);
      setNameUpdateError(error.message || "Failed to update name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }
  
  const featureCards = [
    {
      title: "Audio",
      description: "Manage patch lists, stage plots, and audio configurations.",
      icon: <Mic className="h-10 w-10 text-indigo-400" />,
      link: "/audio",
      color: "indigo",
    },
    {
      title: "Video",
      description: "Organize video sources, display setups, and signal flows.",
      icon: <Video className="h-10 w-10 text-rose-400" />,
      link: "/video",
      color: "rose",
    },
    {
      title: "Lighting",
      description: "Plan lighting designs, DMX patching, and fixture control.",
      icon: <Lightbulb className="h-10 w-10 text-amber-400" />,
      link: "/lighting",
      color: "amber",
    },
    {
      title: "Production",
      description: "Coordinate schedules, run of shows, and team communication.",
      icon: <ClipboardCheck className="h-10 w-10 text-emerald-400" />,
      link: "/production",
      color: "emerald",
    },
  ];


  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} onSignOut={handleSignOut} />

      {supabaseError && (
        <div className="bg-red-500 text-white px-4 py-3 shadow-sm my-2">
          <div className="container mx-auto flex items-center">
            <Info className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{supabaseError}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-x-2 sm:gap-x-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white whitespace-nowrap">
              Welcome back,
            </h1>
            {isEditingName ? (
              <input
                type="text"
                value={editableUserName}
                onChange={(e) => setEditableUserName(e.target.value)}
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-transparent text-indigo-400 border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-300 min-w-[100px] max-w-[300px] flex-grow"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEditName();
                }}
              />
            ) : (
              <span 
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer" 
                onClick={handleEditName}
                title="Click to edit name"
              >
                {userName}
              </span>
            )}
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">!</span>
            
            {isEditingName ? (
              <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
                <button 
                  onClick={handleSaveName} 
                  disabled={isSavingName} 
                  className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                  title="Save name"
                >
                  {isSavingName ? <Loader className="h-5 w-5 animate-spin" /> : <Check className="h-6 w-6" />}
                </button>
                <button 
                  onClick={handleCancelEditName} 
                  disabled={isSavingName} 
                  className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
                  title="Cancel edit"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleEditName} 
                className="p-1 text-gray-400 hover:text-indigo-300 ml-1 sm:ml-2"
                title="Edit name"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            )}
          </div>
          {nameUpdateError && (
            <p className="text-red-400 text-sm mt-2">{nameUpdateError}</p>
          )}
          <p className="text-lg sm:text-xl text-gray-300 mt-3">What would you like to manage today?</p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 mb-12">
          {featureCards.map((card) => (
            <Link
              to={card.link}
              key={card.title}
              className={`bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out group border-l-4 border-${card.color}-500`}
            >
              <div className="flex items-center justify-between mb-4">
                {card.icon}
                <ChevronRight className="h-7 w-7 text-gray-500 group-hover:text-${card.color}-400 transition-colors" />
              </div>
              <h2 className={`text-2xl font-semibold text-white mb-2 group-hover:text-${card.color}-400 transition-colors`}>{card.title}</h2>
              <p className="text-gray-400 text-sm">{card.description}</p>
            </Link>
          ))}
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Click your name in the greeting above to change it.</li>
            <li>Select a category above to start managing your documents.</li>
            <li>Use the "Audio" section for patch lists and stage plots.</li>
            <li>Plan events with "Production Schedules" and "Run of Shows" in the "Production" section.</li>
            <li>"Video" and "Lighting" sections are coming soon with specialized tools!</li>
            <li>Ensure your documents are up-to-date for smooth event execution.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
