import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Bookmark, AlertCircle, CheckCircle } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Note: Email confirmation is enabled by default in your Supabase project settings.
          // This option is here for clarity but can be removed if you manage this from the Supabase dashboard.
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <Bookmark className="h-8 w-8 text-indigo-400" />
            <span className="text-white text-xl font-bold">SoundDocs</span>
          </Link>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-lg mb-4">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Create an Account</h2>

          {success ? (
            <div className="bg-green-400/10 border border-green-400 text-green-300 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white">Registration Successful!</h3>
                <p className="text-sm text-green-300 mt-1">
                  Please check your email for a confirmation link to finish signing up.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
              {error && (
                <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400">{error}</p>
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
                  required
                  minLength={6}
                />
                 <p className="text-xs text-gray-500 mt-2">Minimum 6 characters required.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Log in
          </Link>
        </p>

        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-400 hover:text-white text-sm">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
