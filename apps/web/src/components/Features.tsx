import React from "react";
import {
  ClipboardList,
  Layout,
  Share2,
  Download,
  Zap,
  Headphones,
  ListChecks, // For Run of Show
  CalendarClock, // For Production Schedule
  FileText, // Alternative for Patch Lists if ClipboardList is too generic
  Settings2, // For Audio-Specific Tools or Customization
  Mic, // For Mic Plots
  Grid, // For Pixel Maps
} from "lucide-react";

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
      icon: <FileText className="h-6 w-6" />,
      title: "Patch Sheet Editor",
      description:
        "Design detailed input/output lists, map signal flows, specify equipment, and add critical technical notes for any audio setup.",
    },
    {
      icon: <Layout className="h-6 w-6" />,
      title: "Stage Plot Designer",
      description:
        "Visually construct stage layouts with a library of draggable elements for instruments, mics, monitors, and more.",
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "Mic Plot Designer",
      description:
        "Craft detailed Corporate and Theater mic plots. Manage presenters, actors, wireless assignments, photos, and notes with ease.",
    },
    {
      icon: <Grid className="h-6 w-6" />,
      title: "Pixel Map Designer",
      description:
        "Design and visualize LED video wall layouts, then export clear, detailed plans for your video team.",
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: "Run of Show Creator",
      description:
        "Develop detailed event timelines and cue sheets. Utilize 'Show Mode' for real-time event tracking and execution.",
    },
    {
      icon: <CalendarClock className="h-6 w-6" />,
      title: "Production Schedule Manager",
      description:
        "Organize pre-production, setup, rehearsal, show, and strike activities. Keep your entire team aligned and on track.",
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: "AcoustIQ Audio Analyzer",
      description:
        "The first professional, browser-based FFT audio analyzer. Features RTA, SPL, and dual-channel transfer function capabilities.",
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Easy Sharing & Export",
      description:
        "Generate professional PDFs. Share securely via links with venues, artists, and production teams.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-900 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comprehensive Tools for
            <span className="text-indigo-400 block mt-1">
              Professional Event Production Documentation
            </span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            SoundDocs equips event professionals with a full suite of tools to create, manage, and
            share critical documentation—from pixel maps and patch lists to stage plots, mic plots,
            run of shows, production schedules, and now, the first professional, browser-based FFT
            audio analyzer.
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
