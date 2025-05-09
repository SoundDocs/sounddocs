import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Helmet>
        <title>Terms of Service | SoundDocs</title>
        <meta
          name="description"
          content="Terms of Service for SoundDocs - Read about the terms and conditions that govern your use of our audio documentation tools."
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
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6">Last Updated: April 24, 2025</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing or using the SoundDocs website and services, you agree to be bound by
              these Terms of Service ("Terms"). If you do not agree to all the terms and conditions
              of this agreement, then you may not access the website or use any services.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-300 mb-4">
              SoundDocs is a web-based application that allows audio engineers and production
              professionals to create, edit, and share technical documentation such as patch sheets
              and stage plots. Our services include creating, storing, and exporting these documents
              in various formats.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-300 mb-4">
              To access certain features of SoundDocs, you must register for an account. You agree
              to provide accurate, current, and complete information during the registration process
              and to update such information to keep it accurate, current, and complete. You are
              responsible for maintaining the confidentiality of your account and password and for
              restricting access to your computer or device, and you agree to accept responsibility
              for all activities that occur under your account.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. User Content</h2>
            <p className="text-gray-300 mb-4">
              Our service allows you to create, post, store, and share content. By providing content
              to SoundDocs, you grant us a worldwide, non-exclusive, royalty-free license to use,
              reproduce, modify, adapt, publish, and display such content in connection with
              providing and promoting our services.
            </p>
            <p className="text-gray-300 mb-4">
              You are solely responsible for all content that you upload, post, email, transmit, or
              otherwise make available via our services. You represent and warrant that: (i) you own
              or control all rights to the content you provide, or that you have the right to
              provide such content to us; and (ii) the content does not violate these Terms.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Prohibited Uses</h2>
            <p className="text-gray-300 mb-4">You agree not to use the SoundDocs service:</p>
            <ul className="list-disc pl-5 text-gray-300 mb-4 space-y-2">
              <li>
                In any way that violates any applicable federal, state, local, or international law
                or regulation
              </li>
              <li>
                To impersonate or attempt to impersonate SoundDocs, a SoundDocs employee, another
                user, or any other person or entity
              </li>
              <li>
                To engage in any other conduct that restricts or inhibits anyone's use or enjoyment
                of the service, or which may harm SoundDocs or users of the service
              </li>
              <li>
                To attempt to gain unauthorized access to, interfere with, damage, or disrupt any
                parts of the service, the server on which the service is stored, or any server,
                computer, or database connected to the service
              </li>
              <li>
                To use the service in any manner that could disable, overburden, damage, or impair
                the site
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              6. Intellectual Property Rights
            </h2>
            <p className="text-gray-300 mb-4">
              The SoundDocs service and its original content (excluding content provided by users),
              features, and functionality are and will remain the exclusive property of SoundDocs
              and its licensors. The service is protected by copyright, trademark, and other laws of
              both the United States and foreign countries. Our trademarks and trade dress may not
              be used in connection with any product or service without the prior written consent of
              SoundDocs.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Termination</h2>
            <p className="text-gray-300 mb-4">
              We may terminate or suspend your account and bar access to the service immediately,
              without prior notice or liability, under our sole discretion, for any reason
              whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
            <p className="text-gray-300 mb-4">
              If you wish to terminate your account, you may simply discontinue using the service,
              or you may contact us at contact@sounddocs.org to request account deletion.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-300 mb-4">
              In no event shall SoundDocs, nor its directors, employees, partners, agents,
              suppliers, or affiliates, be liable for any indirect, incidental, special,
              consequential or punitive damages, including without limitation, loss of profits,
              data, use, goodwill, or other intangible losses, resulting from (i) your access to or
              use of or inability to access or use the service; (ii) any conduct or content of any
              third party on the service; (iii) any content obtained from the service; and (iv)
              unauthorized access, use or alteration of your transmissions or content, whether based
              on warranty, contract, tort (including negligence) or any other legal theory, whether
              or not we have been informed of the possibility of such damage.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">9. Disclaimer</h2>
            <p className="text-gray-300 mb-4">
              Your use of the service is at your sole risk. The service is provided on an "AS IS"
              and "AS AVAILABLE" basis. The service is provided without warranties of any kind,
              whether express or implied, including, but not limited to, implied warranties of
              merchantability, fitness for a particular purpose, non-infringement or course of
              performance.
            </p>
            <p className="text-gray-300 mb-4">
              SoundDocs, its subsidiaries, affiliates, and its licensors do not warrant that a) the
              service will function uninterrupted, secure or available at any particular time or
              location; b) any errors or defects will be corrected; c) the service is free of
              viruses or other harmful components; or d) the results of using the service will meet
              your requirements.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">10. Governing Law</h2>
            <p className="text-gray-300 mb-4">
              These Terms shall be governed and construed in accordance with the laws of the United
              States, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-300 mb-4">
              Our failure to enforce any right or provision of these Terms will not be considered a
              waiver of those rights. If any provision of these Terms is held to be invalid or
              unenforceable by a court, the remaining provisions of these Terms will remain in
              effect.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any
              time. If a revision is material, we will provide at least 30 days' notice prior to any
              new terms taking effect. What constitutes a material change will be determined at our
              sole discretion.
            </p>
            <p className="text-gray-300 mb-4">
              By continuing to access or use our service after any revisions become effective, you
              agree to be bound by the revised terms. If you do not agree to the new terms, you are
              no longer authorized to use the service.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">12. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about these Terms, please contact us at
              contact@sounddocs.org.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
