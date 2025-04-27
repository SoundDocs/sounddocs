import React from 'react';
import { FileText, Layout, Share2 } from 'lucide-react';

const steps = [
  {
    icon: <FileText className="h-12 w-12 text-indigo-400" />,
    title: "Create Your Documentation",
    description: "Start with templates or build from scratch. Add instruments, input lists, and technical requirements.",
    image: "https://images.pexels.com/photos/8412468/pexels-photo-8412468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  },
  {
    icon: <Layout className="h-12 w-12 text-indigo-400" />,
    title: "Design Your Stage Plot",
    description: "Drag and drop instruments, microphones, and equipment to create accurate stage layouts.",
    image: "https://images.pexels.com/photos/164693/pexels-photo-164693.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  },
  {
    icon: <Share2 className="h-12 w-12 text-indigo-400" />,
    title: "Share & Export",
    description: "Generate PDF files or shareable links to distribute to your team, venues, or artists.",
    image: "https://images.pexels.com/photos/2111015/pexels-photo-2111015.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-gray-800 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How SoundDocs Works</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Create professional documentation for your audio productions in three simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="overflow-hidden rounded-xl aspect-[4/3] mb-6">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent opacity-70"></div>
              </div>
              
              <div className="absolute bottom-6 left-0 right-0 px-6">
                <div className="flex items-center mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-800 text-indigo-400 mr-4 font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-gray-300">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <a 
            href="#get-started" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-all duration-200"
          >
            Start Creating Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;