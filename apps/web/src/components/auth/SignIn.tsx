import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Bookmark, AlertCircle, Mail, CheckCircle, Zap } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkMessage, setMagicLinkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const clearMessages = () => {
    setError(null);
    setResetMessage(null);
    setMagicLinkMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data.user) {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred during sign in.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setResetLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        setResetMessage({ type: "error", text: resetError.message });
      } else {
        setResetMessage({
          type: "success",
          text: "Password reset instructions sent to your email.",
        });
        setResetEmail("");
      }
    } catch (err) {
      setResetMessage({ type: "error", text: "An unexpected error occurred. Please try again." });
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  const handleMagicLinkSignIn = async () => {
    if (!email) {
      setMagicLinkMessage({ type: "error", text: "Please enter your email address first." });
      return;
    }
    clearMessages();
    setMagicLinkLoading(true);

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`, // Redirect to dashboard after magic link login
        },
      });

      if (magicLinkError) {
        setMagicLinkMessage({ type: "error", text: magicLinkError.message });
      } else {
        setMagicLinkMessage({
          type: "success",
          text: "Magic link sent! Check your email to log in.",
        });
      }
    } catch (err) {
      setMagicLinkMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
      console.error(err);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <Bookmark className="h-8 w-8 text-indigo-400" />
            <span className="text-white text-xl font-bold">SoundDocs</span>
          </Link>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-lg mb-4">
          {!isResettingPassword ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Log In</h2>
              <form onSubmit={handleSignIn} className="space-y-6">
                {error && (
                  <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-red-400">{error}</p>
                  </div>
                )}
                {resetMessage && resetMessage.type === "success" && (
                  <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-green-400">{resetMessage.text}</p>
                  </div>
                )}
                {magicLinkMessage && (
                  <div
                    className={`rounded-lg p-4 flex items-start ${
                      magicLinkMessage.type === "success"
                        ? "bg-green-400/10 border border-green-400"
                        : "bg-red-400/10 border border-red-400"
                    }`}
                  >
                    {magicLinkMessage.type === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    )}
                    <p
                      className={
                        magicLinkMessage.type === "success" ? "text-green-400" : "text-red-400"
                      }
                    >
                      {magicLinkMessage.text}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(true);
                      clearMessages();
                    }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || magicLinkLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Log In with Password"}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-600"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                  <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <button
                  type="button"
                  onClick={handleMagicLinkSignIn}
                  disabled={magicLinkLoading || loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {magicLinkLoading ? "Sending Link..." : "Send Magic Link"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Reset Password</h2>
              <form onSubmit={handlePasswordResetRequest} className="space-y-6">
                {resetMessage && (
                  <div
                    className={`rounded-lg p-4 flex items-start ${
                      resetMessage.type === "success"
                        ? "bg-green-400/10 border border-green-400"
                        : "bg-red-400/10 border border-red-400"
                    }`}
                  >
                    {resetMessage.type === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    )}
                    <p
                      className={
                        resetMessage.type === "success" ? "text-green-400" : "text-red-400"
                      }
                    >
                      {resetMessage.text}
                    </p>
                  </div>
                )}
                <p className="text-gray-400 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="reset-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false);
                      clearMessages();
                    }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 focus:outline-none"
                  >
                    Back to Log In
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {!isResettingPassword && (
          <p className="text-center text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
              Sign up
            </Link>
          </p>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-400 hover:text-white text-sm">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
