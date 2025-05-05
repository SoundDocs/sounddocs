import React, { useEffect, useState } from 'react';
import { ArrowRight, Headphones, Music, Bookmark, Calendar, Mic, ChevronsRight, Github, Heart } from 'lucide-react'; // Added Heart
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Hero: React.FC = () => {
  const [user, setUser] = useState<any>(null);

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

  return (
    <section className="pt-32 pb-20 px-4 min-h-screen flex items-center bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 md:pr-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              <span className="block">Create Professional</span>
              <span className="text-indigo-400">Patch Lists & Stage Plots</span>
            </h1>
            
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
              The tool that helps audio engineers document, organize, and share technical requirements for live performances and studio sessions. 
              <span className="text-indigo-300"> 100% free and open source.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-center flex items-center justify-center"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <Link 
                  to="/signup" 
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-center flex items-center justify-center"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
              <Link 
                to="/login" 
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-center"
              >
                Log In
              </Link>
            </div>

            <div className="flex items-center space-x-6"> {/* Added space-x-6 */}
              <a 
                href="https://github.com/SoundDocs/sounddocs" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors duration-200"
              >
                <Github className="h-5 w-5 mr-2" />
                <span>Open source on GitHub</span>
              </a>
              {/* Added Donation Link */}
              <a 
                href="https://buy.stripe.com/7sIaFxgFu7ulawEbIJ" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-pink-400 hover:text-pink-300 transition-colors duration-200"
              >
                <Heart className="h-5 w-5 mr-2" />
                <span>Support the Project</span>
              </a>
            </div>
          </div>
          
          {/* Updated patch sheet card that better reflects the actual design */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition-all duration-300 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500 opacity-20 rounded-full blur-2xl"></div>
            <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>
            
            <div className="relative mb-6 flex justify-between items-center pb-4" style={{ borderBottom: '2px solid rgba(99, 102, 241, 0.4)' }}>
              <div className="flex items-center">
                <div className="p-2 rounded-lg mr-3 bg-indigo-600 shadow-lg">
                  <Bookmark className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Main Stage</h2>
                  <p className="text-indigo-400 text-sm">Patch Sheet</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-gray-300 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>July 25, 2025</span>
                </div>
              </div>
            </div>
            
            {/* Input List Table */}
            <div className="bg-gray-850 rounded-lg p-4 mb-5" style={{ border: '1px solid rgba(75, 85, 99, 0.4)' }}>
              <div className="flex items-center mb-3">
                <Mic className="text-indigo-400 mr-2 h-5 w-5" />
                <h3 className="text-white font-semibold">Input List</h3>
              </div>
              
              <div className="overflow-hidden rounded-md">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-750">
                    <tr className="border-b border-gray-700">
                      <th className="py-2 px-3 text-xs text-indigo-400">Ch</th>
                      <th className="py-2 px-3 text-xs text-indigo-400">Source</th>
                      <th className="py-2 px-3 text-xs text-indigo-400">Mic/DI</th>
                      <th className="py-2 px-3 text-xs text-indigo-400">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 1, channel: '1', instrument: 'Kick', mic: 'Beta 52', notes: 'Short stand' },
                      { id: 2, channel: '2', instrument: 'Snare Top', mic: 'SM57', notes: 'Clip on rim' },
                      { id: 3, channel: '3', instrument: 'Snare Bottom', mic: 'KSM137', notes: '' },
                      { id: 4, channel: '4', instrument: 'Hi-Hat', mic: 'SM81', notes: 'Low stand' },
                      { id: 5, channel: '5', instrument: 'Rack Tom', mic: 'MD421', notes: 'Clip mount' },
                    ].map((item, index) => (
                      <tr 
                        key={item.id} 
                        className={`text-sm ${index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800/50'} border-b border-gray-700/50`}
                      >
                        <td className="py-2 px-3 text-indigo-300 font-medium">{item.channel}</td>
                        <td className="py-2 px-3 text-white font-medium">{item.instrument}</td>
                        <td className="py-2 px-3 text-indigo-200">{item.mic}</td>
                        <td className="py-2 px-3 text-gray-400">{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Equipment Information */}
            <div className="bg-gray-850 rounded-lg p-4" style={{ border: '1px solid rgba(75, 85, 99, 0.4)' }}>
              <div className="flex items-center mb-3">
                <Music className="text-indigo-400 mr-2 h-5 w-5" />
                <h3 className="text-white font-semibold">Technical Requirements</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/80 p-2.5 rounded border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1">FOH Console</div>
                  <div className="text-white text-sm font-medium">Avid S6L</div>
                </div>
                <div className="bg-gray-800/80 p-2.5 rounded border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1">PA System</div>
                  <div className="text-white text-sm font-medium">L-Acoustics K2</div>
                </div>
                <div className="bg-gray-800/80 p-2.5 rounded border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1">Monitor Type</div>
                  <div className="text-white text-sm font-medium">6× IEM + 2× Wedges</div>
                </div>
                <div className="bg-gray-800/80 p-2.5 rounded border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1">FOH Engineer</div>
                  <div className="text-white text-sm font-medium">Sarah Johnson</div>
                </div>
              </div>
            </div>
            
            {/* Document footer */}
            <div className="mt-5 pt-3 border-t border-gray-700/30 flex justify-between items-center">
              <div className="flex items-center">
                <Bookmark className="h-4 w-4 text-indigo-400 mr-2" />
                <span className="text-indigo-400 text-xs font-medium">SoundDocs</span>
              </div>
              <span className="text-gray-400 text-xs">Professional Documentation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
