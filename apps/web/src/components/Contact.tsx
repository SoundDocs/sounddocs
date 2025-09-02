import React from "react";
import { Mail, MessageSquare, Globe, Github } from "lucide-react";

const ContactItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
}> = ({ icon, title, description, link }) => {
  return (
    <div className="flex items-start">
      <div className="p-2 bg-gray-800 rounded-lg text-indigo-400 mr-4">{icon}</div>
      <div>
        <h3 className="text-white font-medium mb-1">{title}</h3>
        {link ? (
          <a
            href={link}
            className="text-gray-300 hover:text-indigo-400 transition-colors duration-200"
          >
            {description}
          </a>
        ) : (
          <p className="text-gray-300">{description}</p>
        )}
      </div>
    </div>
  );
};

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-gray-800 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Get in Touch</h2>
            <p className="text-gray-300 mb-8 text-lg">
              Have questions about SoundDocs? We'd love to hear from you! Reach out with any
              questions, feedback, or feature requests.
            </p>

            <div className="space-y-6">
              <ContactItem
                icon={<Mail className="h-5 w-5" />}
                title="Email Us"
                description="support@sounddocs.app"
                link="mailto:support@sounddocs.app"
              />
              <ContactItem
                icon={<MessageSquare className="h-5 w-5" />}
                title="Join Our Community"
                description="Discord Server"
                link="#"
              />
              <ContactItem
                icon={<Github className="h-5 w-5" />}
                title="Contribute"
                description="GitHub Repository"
                link="#"
              />
              <ContactItem
                icon={<Globe className="h-5 w-5" />}
                title="Follow Us"
                description="@SoundDocs on Twitter"
                link="#"
              />
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-white mb-6">Send Us a Message</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your email"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your message"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition-all duration-200"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
