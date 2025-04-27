import React from 'react';
import { 
  Mic, 
  Music, 
  Speaker, 
  Square, 
  Type, 
  Users, 
  Headphones, 
  Volume2, 
  Piano, 
  Guitar, 
  Plug, 
  CircleEllipsis, 
  Blinds as Violin, 
  Drum
} from 'lucide-react';

interface ElementToolbarProps {
  onAddElement: (type: string, label: string) => void;
}

interface StageElementCategory {
  title: string;
  elements: {
    type: string;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[];
}

const ElementToolbar: React.FC<ElementToolbarProps> = ({ onAddElement }) => {
  const categories: StageElementCategory[] = [
    {
      title: "Audio Equipment",
      elements: [
        {
          type: 'microphone',
          label: 'Microphone',
          icon: <Mic className="h-4 w-4 text-white" />,
          color: '#4f46e5'
        },
        {
          type: 'di-box',
          label: 'DI Box',
          icon: <Square className="h-3 w-3 text-white" />,
          color: '#eab308'
        },
        {
          type: 'power-strip',
          label: 'Power Strip',
          icon: <Plug className="h-4 w-4 text-white" />,
          color: '#dc2626'
        },
        {
          type: 'monitor-wedge',
          label: 'Wedge Monitor',
          icon: (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" strokeWidth="2" fill="none">
              <path d="M4 6h16l-2 10H6L4 6z" />
              <path d="M4 6l-2 3" />
              <path d="M20 6l2 3" />
            </svg>
          ),
          color: '#16a34a'
        },
        {
          type: 'amplifier',
          label: 'Amplifier',
          icon: <Volume2 className="h-5 w-5 text-white" />,
          color: '#7e22ce'
        },
        {
          type: 'speaker',
          label: 'Speaker',
          icon: <Speaker className="h-5 w-5 text-white" />,
          color: '#0891b2'
        },
        {
          type: 'iem',
          label: 'IEM',
          icon: <Headphones className="h-4 w-4 text-white" />,
          color: '#ea580c'
        }
      ]
    },
    {
      title: "String Instruments",
      elements: [
        {
          type: 'electric-guitar',
          label: 'Electric Guitar',
          icon: <Guitar className="h-4 w-4 text-white" />,
          color: '#2563eb'
        },
        {
          type: 'acoustic-guitar',
          label: 'Acoustic Guitar',
          icon: <Guitar className="h-4 w-4 text-white" />,
          color: '#a16207'
        },
        {
          type: 'bass-guitar',
          label: 'Bass Guitar',
          icon: <Guitar className="h-4 w-4 text-white" />,
          color: '#1d4ed8'
        },
        {
          type: 'violin',
          label: 'Violin',
          icon: <Violin className="h-4 w-4 text-white" />,
          color: '#c2410c'
        },
        {
          type: 'cello',
          label: 'Cello',
          icon: <Violin className="h-4 w-4 text-white" />,
          color: '#9a3412'
        }
      ]
    },
    {
      title: "Keyboards & Percussion",
      elements: [
        {
          type: 'keyboard',
          label: 'Keyboard',
          icon: <Piano className="h-4 w-4 text-white" />,
          color: '#0f766e'
        },
        {
          type: 'drums',
          label: 'Drums',
          icon: <Drum className="h-4 w-4 text-white" />,
          color: '#9333ea'
        },
        {
          type: 'percussion',
          label: 'Percussion',
          icon: <Drum className="h-4 w-4 text-white" />,
          color: '#6d28d9'
        }
      ]
    },
    {
      title: "Wind & Brass",
      elements: [
        {
          type: 'trumpet',
          label: 'Trumpet',
          icon: <Music className="h-4 w-4 text-white" />,
          color: '#b45309'
        },
        {
          type: 'saxophone',
          label: 'Saxophone',
          icon: <Music className="h-4 w-4 text-white" />,
          color: '#b91c1c'
        }
      ]
    },
    {
      title: "Miscellaneous",
      elements: [
        {
          type: 'person',
          label: 'Person',
          icon: <Users className="h-4 w-4 text-white" />,
          color: '#be185d'
        },
        {
          type: 'text',
          label: 'Text Label',
          icon: <Type className="h-4 w-4 text-white" />,
          color: '#6b7280'
        },
        {
          type: 'generic-instrument',
          label: 'Other Instrument',
          icon: <CircleEllipsis className="h-4 w-4 text-white" />,
          color: '#2563eb'
        }
      ]
    }
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-4">Add Elements</h3>
      
      <div className="space-y-6">
        {categories.map((category, index) => (
          <div key={index}>
            <h4 className="text-sm font-medium text-gray-300 mb-2">{category.title}</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {category.elements.map((element) => (
                <button
                  key={element.type}
                  className="flex flex-col items-center p-2 hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                  onClick={() => onAddElement(element.type, element.label)}
                  title={element.label}
                >
                  <div 
                    className="w-10 h-10 rounded-md flex items-center justify-center mb-1" 
                    style={{ backgroundColor: element.color }}
                  >
                    {element.icon}
                  </div>
                  <span className="text-xs text-gray-300 text-center line-clamp-1 max-w-full">
                    {element.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ElementToolbar;