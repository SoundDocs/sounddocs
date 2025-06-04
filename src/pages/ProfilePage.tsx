import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    if (user) {
      setCurrentEmail(user.email || "");
    } else {
      // Redirect to login if user data is not available (e.g., page refresh before auth context loads)
      // This might be handled by ProtectedRoute, but an extra check can be useful.
      navigate("/login");
    }
  }, [user, navigate]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);
    if (newEmail !== confirmNewEmail) {
      setEmailMessage({ type: "error", text: "New emails do not match." });
      return;
    }
    if (!newEmail) {
      setEmailMessage({ type: "error", text: "New email cannot be empty." });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMessage({
        type: "success",
        text: "Email update initiated. Please check your new email address for a confirmation link, and your current email for a notification.",
      });
      setNewEmail("");
      setConfirmNewEmail("");
      // Note: Supabase sends confirmation to both old and new email.
      // The email is not actually updated until the new one is confirmed.
    } catch (error: any) {
      setEmailMessage({ type: "error", text: `Error updating email: ${error.message}` });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      setPasswordMessage({ type: "error", text: `Error updating password: ${error.message}` });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />
      <main className="flex-grow container mx-auto px-4 py-12 mt-20">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold text-white mb-10 text-center">User Profile</h1>

        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-1 gap-8">
          {/* Update Email Section */}
          <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <Mail className="h-6 w-6 mr-3 text-indigo-400" />
              Update Email
            </h2>
            <form onSubmit={handleUpdateEmail} className="space-y-6">
              <div>
                <label htmlFor="currentEmail" className="block text-sm font-medium text-gray-300 mb-1">
                  Current Email
                </label>
                <input
                  type="email"
                  id="currentEmail"
                  value={currentEmail}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 focus:ring-indigo-500 focus:border-indigo-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-300 mb-1">
                  New Email
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter new email"
                />
              </div>
              <div>
                <label htmlFor="confirmNewEmail" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Email
                </label>
                <input
                  type="email"
                  id="confirmNewEmail"
                  value={confirmNewEmail}
                  onChange={(e) => setConfirmNewEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm new email"
                />
              </div>
              {emailMessage && (
                <div
                  className={`flex items-center p-3 rounded-md text-sm ${
                    emailMessage.type === "success"
                      ? "bg-green-600/20 text-green-300"
                      : "bg-red-600/20 text-red-300"
                  }`}
                >
                  {emailMessage.type === "success" ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  {emailMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {emailLoading ? "Updating..." : "Update Email"}
              </button>
            </form>
          </div>

          {/* Update Password Section */}
          <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <Lock className="h-6 w-6 mr-3 text-indigo-400" />
              Update Password
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="relative">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter new password (min. 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm new password"
                />
                 <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordMessage && (
                <div
                  className={`flex items-center p-3 rounded-md text-sm ${
                    passwordMessage.type === "success"
                      ? "bg-green-600/20 text-green-300"
                      : "bg-red-600/20 text-red-300"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  {passwordMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
