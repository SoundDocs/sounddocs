import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Helmet>
        <title>Privacy Policy | SoundDocs</title>
        <meta
          name="description"
          content="Privacy Policy for SoundDocs - Learn how we collect, use, and protect your data when using our audio documentation tools."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6">Last Updated: August 16, 2025</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              Welcome to SoundDocs ("we," "our," or "us"). We respect your privacy and are committed
              to protecting your personal data. This privacy policy will inform you about how we
              look after your personal data when you visit our website and use our services,
              regardless of where you visit it from, and tell you about your privacy rights.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              2. Information We Collect
            </h2>
            <p className="text-gray-300 mb-4">
              We collect several different types of information for various purposes to provide and
              improve our service to you:
            </p>
            <ul className="list-disc pl-5 text-gray-300 mb-4 space-y-2">
              <li>
                <strong className="text-white">Account Information:</strong> Email address and
                password for authentication purposes.
              </li>
              <li>
                <strong className="text-white">User Content:</strong> Data you create, upload, or
                modify when using SoundDocs, including patch sheets, stage plots, and related
                information.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> Information about how you use
                our website and services, including log data, browser type, and analytics.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-300 mb-4">
              We use the information we collect in various ways, including to:
            </p>
            <ul className="list-disc pl-5 text-gray-300 mb-4 space-y-2">
              <li>Provide, operate, and maintain our services</li>
              <li>Improve, personalize, and expand our services</li>
              <li>Understand and analyze how you use our services</li>
              <li>Develop new features, products, and services</li>
              <li>
                Communicate with you directly or through our partners, including customer service
              </li>
              <li>Send you emails regarding updates or important information</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Data Storage</h2>
            <p className="text-gray-300 mb-4">
              Your data is stored in secure cloud databases. We use Supabase as our database
              provider, which implements industry-standard security measures to protect your data.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Data Retention</h2>
            <p className="text-gray-300 mb-4">
              We will retain your personal information only for as long as is necessary for the
              purposes set out in this Privacy Policy. We will retain and use your information to
              the extent necessary to comply with our legal obligations, resolve disputes, and
              enforce our policies.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Data Security</h2>
            <p className="text-gray-300 mb-4">
              The security of your data is important to us but remember that no method of
              transmission over the Internet or method of electronic storage is 100% secure. While
              we strive to use commercially acceptable means to protect your personal information,
              we cannot guarantee its absolute security.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Your Rights</h2>
            <p className="text-gray-300 mb-4">
              Depending on your location, you may have certain rights regarding your personal
              information, including:
            </p>
            <ul className="list-disc pl-5 text-gray-300 mb-4 space-y-2">
              <li>The right to access the personal information we have about you</li>
              <li>The right to request correction of inaccurate personal information</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to object to processing of your personal information</li>
              <li>The right to data portability</li>
            </ul>
            <p className="text-gray-300 mb-4">
              To exercise any of these rights, please contact us at contact@sounddocs.org.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Cookies</h2>
            <p className="text-gray-300 mb-4">
              We use cookies to enhance your experience on our website. A cookie is a small text
              file that is placed on your device when you visit a website. You can control cookies
              through your browser settings, but disabling cookies may limit your ability to use
              some features of our service.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              9. Sharing of Your Information
            </h2>
            <p className="text-gray-300 mb-4">
              Our service allows you to share your documents with others via a unique link. When you
              share a document, anyone with the link will be able to view its contents. You are
              responsible for managing who you share these links with. We do not share your personal
              information or documents with any third parties, except as necessary to provide the
              service (e.g., our database provider, Supabase) or as required by law.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">10. Third-Party Services</h2>
            <p className="text-gray-300 mb-4">
              We may employ third-party companies and individuals to facilitate our service, provide
              the service on our behalf, perform service-related tasks, or assist us in analyzing
              how our service is used. These third parties have access to your personal information
              only to perform these tasks on our behalf and are obligated not to disclose or use it
              for any other purpose.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-300 mb-4">
              Our service is not intended for use by children under the age of 13. We do not
              knowingly collect personally identifiable information from children under 13. If we
              discover that a child under 13 has provided us with personal information, we will
              immediately delete this from our servers.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              12. AcoustIQ Capture Agent
            </h2>
            <p className="text-gray-300 mb-4">
              Our AcoustIQ Pro audio analysis feature uses a local application called the Capture
              Agent. The Capture Agent processes audio from your selected audio interface in
              real-time on your local machine. It does **not** record, store, or transmit any raw
              audio. Only the resulting anonymized analysis data (such as frequency spectrum and SPL
              levels) is sent to the browser for visualization. All audio processing happens locally
              on your computer.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              13. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-300 mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last Updated" date at
              the top. You are advised to review this Privacy Policy periodically for any changes.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">14. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about this Privacy Policy, please contact us at
              contact@sounddocs.org.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
