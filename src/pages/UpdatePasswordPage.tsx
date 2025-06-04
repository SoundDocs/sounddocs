import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, Bookmark } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // Supabase handles the token from the URL fragment automatically when the page loads.
    // We listen for the PASSWORD_RECOVERY event to confirm the token was processed.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSession(session); // Session is now active for password update
        setCheckingToken(false);
        setMessage({type: "success", text: "You can now update your password."});
      } else if (event === "SIGNED_IN" && session) {
        // If user is already signed in and somehow lands here, redirect them.
        // Or if they just updated password and got signed in.
        setSession(session);
        setCheckingToken(false);
      } else if (event === "INITIAL_SESSION") {
        // This might fire if there's an existing session, or after token processing.
        setSession(session);
        setCheckingToken(false);
        if (!session?.user?.aud) { // Check if it's a valid user session, not just an initial empty one
             // If no valid session after initial check and not in recovery mode, token might be invalid/expired
            // setMessage({ type: "error", text: "Invalid or expired password reset link. Please request a new one." });
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setCheckingToken(false);
      }
    });
    
    // Initial check for session, in case onAuthStateChange doesn't fire immediately or as expected for token.
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   if (session) {
    //     setSession(session);
    //   }
    //   // If after a short delay and no session, and not in recovery mode (which onAuthStateChange should handle)
    //   // then the token might be invalid.
    //   setTimeout(() => {
    //       if (!session && !authListener?.data?.subscription) { // A bit of a heuristic
    //           // setMessage({ type: "error", text: "Invalid or expired password reset link. Please request a new one." });
    //       }
    //       setCheckingToken(false);
    //   }, 1500); // Wait a bit for Supabase to process URL
    // });


    // Fallback if onAuthStateChange doesn't fire as expected for PASSWORD_RECOVERY
    // This timeout gives Supabase time to process the hash fragment.
    const timer = setTimeout(() => {
        if (checkingToken) { // if still checkingToken after timeout
            supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                if (currentSession) {
                    setSession(currentSession);
                } else {
                    setMessage({ type: "error", text: "Invalid or expired password reset link. Please request a new one." });
                }
                setCheckingToken(false);
            });
        }
    }, 2000); // Adjust timeout as needed


    return () => {
      authListener?.unsubscribe();
      clearTimeout(timer);
    };
  }, [checkingToken]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!session) {
      setMessage({ type: "error", text: "No active session. Invalid or expired link." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: "success", text: "Password updated successfully! Redirecting to login..." });
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: `Error updating password: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <Bookmark className="h-12 w-12 text-indigo-400 mb-6 animate-pulse" />
        <h1 className="text-2xl font-semibold mb-2">Verifying Reset Link...</h1>
        <p className="text-gray-400">Please wait a moment.</p>
      </div>
    );
  }

  if (!session && !message?.text.includes("You can now update your password.")) { // Only show error if not in successful recovery state
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <Bookmark className="h-12 w-12 text-indigo-400 mb-6" />
        <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Link Error</h1>
        <p className="text-gray-300 text-center mb-6">
          {message?.text || "This password reset link is invalid or has expired. Please request a new one."}
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Back to Log In
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <Bookmark className="h-8 w-8 text-indigo-400" />
          <span className="text-white text-xl font-bold ml-2">SoundDocs</span>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Set New Password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {message && (
              <div
                className={`flex items-center p-3 rounded-md text-sm ${
                  message.type === "success"
                    ? "bg-green-600/20 text-green-300"
                    : "bg-red-600/20 text-red-300"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <div className="relative">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
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
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
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

            <button
              type="submit"
              disabled={loading || !session}
              className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
          {message?.type === "success" && message.text.includes("successfully") && (
             <div className="mt-4 text-center">
                <button
                    onClick={() => navigate("/login")}
                    className="text-sm text-indigo-400 hover:text-indigo-300 focus:outline-none"
                >
                    Proceed to Log In
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
