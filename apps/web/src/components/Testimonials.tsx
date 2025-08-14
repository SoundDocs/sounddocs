import React from "react";
import { Star } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  stars: number;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, author, role, stars }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-indigo-500/30 transition-all duration-300">
      <div className="flex mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
          />
        ))}
      </div>
      <p className="text-gray-300 mb-4 italic">{quote}</p>
      <div>
        <p className="text-white font-medium">{author}</p>
        <p className="text-gray-400 text-sm">{role}</p>
      </div>
    </div>
  );
};

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      quote:
        "SoundDocs has transformed how I prepare for events. The stage plots are clear, professional, and save me hours of back-and-forth with venues.",
      author: "Alex Martinez",
      role: "FOH Engineer, National Tours",
      stars: 5,
    },
    {
      quote:
        "As a studio engineer, keeping track of session setups used to be a headache. SoundDocs makes it simple to document everything and share with artists.",
      author: "Sarah Johnson",
      role: "Recording Engineer",
      stars: 5,
    },
    {
      quote:
        "I can't believe this tool is free. It has everything I need to create professional documentation for my clients. Highly recommended!",
      author: "David Wong",
      role: "Live Sound Engineer",
      stars: 5,
    },
    {
      quote:
        "The templates are incredibly helpful. I can quickly create patch lists for different types of shows and modify them as needed.",
      author: "Maria Rodriguez",
      role: "Monitor Engineer",
      stars: 4,
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-gray-900 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Audio Professionals
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            See what engineers and producers are saying about SoundDocs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              stars={testimonial.stars}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
