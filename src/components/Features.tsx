import React from 'react';
import { 
  ClipboardList, 
  Layout, 
  Share2, 
  Download, 
  PenTool, 
  Zap, 
  Headphones,
  FileText,
  Tag,
  Layers
} from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-indigo-500/30 hover:bg-gray-750 transition-all duration-300 hover:shadow-lg group">
      <div className="p-3 mb-4 inline-block bg-indigo-600/20 rounded-lg text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200 shadow-md">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <ClipboardList className="h-6 w-6" />,
      title: "Patch Lists & Input Lists",
      description: "Create detailed input lists, routing documentation, and technical specifications for your audio setups and studio sessions."
    },
    {
      icon: <Layout className="h-6 w-6" />,
      title: "Professional Stage Plots",
      description: "Design comprehensive stage layouts with intuitive tools for positioning instruments, microphones, and equipment."
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Easy Sharing",
      description: "Generate high-quality exports that can be shared with venues, sound teams, crew members, and performers."
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "High-Quality Export",
      description: "Download your audio documentation as professional images ready for printing and sharing with production teams."
    },
    {
      icon: <Tag className="h-6 w-6" />,
      title: "Custom Labeling & Notation",
      description: "Add detailed labels and technical notes to your documentation for clear communication with your production team."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Intuitive Interface",
      description: "Our user-friendly design makes creating professional audio documentation quick and effortless for sound engineers."
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: "Audio-Specific Tools",
      description: "Features designed specifically for the needs of live sound engineers, studio engineers, and production staff."
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Comprehensive Details",
      description: "Store all important event information in one place, from equipment specifications to venue details for your audio events."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-900 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need for
            <span className="text-indigo-400 block mt-1">Professional Audio Technical Documentation</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            SoundDocs provides sound engineers and audio professionals with all the tools needed to create complete, 
            professional technical documentation for any live performance, recording session, or studio setup.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;