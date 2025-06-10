{
      /*
      src/pages/RatesPage.tsx
      - Updated "ME" to "Master Electrician (Lighting)" in Lead Technician roles.
      - Added a new "Rigging" role category with typical rates and overtime.
      - Expanded the "Important Considerations" section with:
        - Travel, Accommodation & Per Diems
        - Kit / Gear Rental Fees
        - Cancellation Policies
        - Insurance & Liability
      - Maintained styling and structure.
      */
    }
    import React from "react";
    import Header from "../components/Header";
    import Footer from "../components/Footer";
    import { Link as RouterLink } from "react-router-dom";
    import { ArrowLeft, AlertTriangle, MapPin, Users, Briefcase, Clock, DollarSign, ShieldCheck, FileText, Plane } from "lucide-react";

    interface RateCardProps {
      roleFamily: string;
      titles: string[];
      rate: string;
      overtime: string[];
      notes?: string[];
    }

    const RateCard: React.FC<RateCardProps> = ({
      roleFamily,
      titles,
      rate,
      overtime,
      notes,
    }) => (
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8 transform transition-all duration-300 hover:scale-105">
        <h2 className="text-2xl font-semibold text-indigo-400 mb-3">
          {roleFamily}
        </h2>
        <p className="text-sm text-gray-400 mb-1">Common Titles:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {titles.map((title) => (
            <span
              key={title}
              className="bg-gray-700 text-indigo-300 px-3 py-1 rounded-full text-xs"
            >
              {title}
            </span>
          ))}
        </div>
        <p className="text-lg text-gray-200 mb-2">
          <span className="font-semibold">Typical Rate (USD):</span> {rate} (for a 10-hour day unless noted)
        </p>
        <div className="text-gray-300 mb-2">
          <p className="font-semibold mb-1">Overtime Structure:</p>
          <ul className="list-disc list-inside ml-4 text-sm">
            {overtime.map((ot, index) => (
              <li key={index}>{ot}</li>
            ))}
          </ul>
        </div>
        {notes && notes.length > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            <p className="font-semibold mb-1">Notes:</p>
            <ul className="list-disc list-inside ml-4">
              {notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    const ConsiderationItem: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({icon, title, description}) => (
      <div className="flex items-start p-4 bg-gray-800 rounded-lg">
        <div className="flex-shrink-0 text-indigo-400 mr-4 mt-1">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-indigo-300">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
    );

    const RatesPage: React.FC = () => {
      const ratesData: RateCardProps[] = [
        {
          roleFamily: "Lead Technician / Tier 1",
          titles: [
            "A1 (Audio Lead)",
            "Systems Tech/Engineer (Audio, Video, Lighting)",
            "LD (Lighting Director)",
            "ME (Master Electrician - Lighting)",
            "V1 (Video Lead/Director)",
            "High-Res Operator (e.g., Spyder, E2, Barco X80)",
            "Projectionist (Advanced)",
          ],
          rate: "$650 - $850+",
          overtime: [
            "1.5x hourly rate after 10 hours (up to 16 hours)",
            "2.0x hourly rate after 16 hours",
          ],
          notes: ["Rates can be higher for specialized skills, high-demand events, or significant pre-production work."]
        },
        {
          roleFamily: "Technician / Tier 2",
          titles: ["A2 (Audio Assist)", "V2 (Video Assist)", "L2 (Lighting Tech/Operator)", "Camera Operator (General)"],
          rate: "$450 - $700",
          overtime: [
            "1.5x hourly rate after 10 hours (up to 16 hours)",
            "2.0x hourly rate after 16 hours",
          ],
        },
        {
          roleFamily: "Assistant / Tier 3",
          titles: [
            "Audio Assist (A3)",
            "Lighting Assist (L3)",
            "Video Assist (V3)",
            "General AV Tech",
            "Breakout Room Tech",
          ],
          rate: "$350 - $550",
          overtime: [
            "1.5x hourly rate after 10 hours (up to 16 hours)",
            "2.0x hourly rate after 16 hours",
          ],
        },
        {
          roleFamily: "Stagehand / Utility",
          titles: ["Stagehand", "Loader", "Pusher", "Cable Page"],
          rate: "$250 - $450",
          overtime: [
            "Often based on 8-hour day: 1.5x after 8, 2x after 12.",
            "For 10-hour calls, OT structure similar to Tier 3 may apply.",
          ],
          notes: ["Rates highly dependent on union status and local agreements. Some markets may have minimum call lengths (e.g., 4 hours)."]
        },
        {
          roleFamily: "Camera Operator (Specialized)",
          titles: ["Steadicam Operator", "Jib Operator", "Specialty Camera Op", "Broadcast Camera Op"],
          rate: "$600 - $1000+",
          overtime: [
            "1.5x hourly rate after 10 hours (up to 16 hours)",
            "2.0x hourly rate after 16 hours",
          ],
          notes: ["Often includes kit fee for specialized gear. Broadcast rates can differ significantly and may include different overtime rules."]
        },
        {
          roleFamily: "Production Management & Coordination",
          titles: ["Production Manager (PM)", "Technical Director (TD)", "Production Coordinator", "Show Caller", "Stage Manager"],
          rate: "$700 - $1500+",
          overtime: [
            "Often a flat day rate or project fee, especially for PM/TD roles.",
            "If hourly, OT rules similar to Lead Techs may apply for coordinators/callers.",
          ],
          notes: ["Rates vary widely based on event scale, complexity, team size, and responsibilities. TD roles often command higher rates."]
        },
        {
          roleFamily: "Rigging",
          titles: ["Lead Rigger", "Up Rigger", "Down Rigger", "Ground Rigger"],
          rate: "$500 - $900+",
          overtime: [
            "1.5x hourly rate after 8 or 10 hours (market dependent)",
            "2.0x hourly rate after 12 or 16 hours",
          ],
          notes: ["Extremely safety-critical role. Certification (e.g., ETCP) often required and commands higher rates. Union agreements are common."]
        },
      ];

      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-16 sm:py-24">
            <div className="mb-8">
              <RouterLink
                to="/resources"
                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 group"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to Resources
              </RouterLink>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Typical Freelance Production Rates
            </h1>
            <p className="text-lg text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              A guide to common day rates for audio, video, lighting, rigging, and production roles in the live event industry. These are primarily based on the US market and can vary. All rates are generally for a 10-hour day unless specified otherwise.
            </p>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
              {ratesData.map((rateInfo) => (
                <RateCard key={rateInfo.roleFamily} {...rateInfo} />
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-gray-700">
              <h2 className="text-3xl font-semibold text-center text-indigo-400 mb-10">
                Important Considerations
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ConsiderationItem 
                  icon={<MapPin size={28} />}
                  title="Market & Location"
                  description="Rates vary significantly between countries, states, and cities. Major metropolitan areas or event hubs often have higher rates. Always research local market conditions."
                />
                <ConsiderationItem 
                  icon={<Users size={28} />}
                  title="Union vs. Non-Union"
                  description="Union rates (e.g., IATSE) are typically standardized, often higher, and come with specific work rules, benefits, and overtime calculations. Non-union rates are more variable."
                />
                <ConsiderationItem 
                  icon={<Briefcase size={28} />}
                  title="Experience & Specialization"
                  description="Highly experienced individuals or those with specialized skills (e.g., specific console operation, complex system design, certifications) command higher rates."
                />
                <ConsiderationItem 
                  icon={<Clock size={28} />}
                  title="Project Scope & Duration"
                  description="Large-scale, complex, or long-duration projects might involve different rate structures (e.g., weekly rates, project fees). Short notice or rush calls may also command a premium."
                />
                 <ConsiderationItem 
                  icon={<DollarSign size={28} />}
                  title="Currency & International Markets"
                  description="The rates listed are in USD. For non-US markets, convert and adjust based on local economic factors, cost of living, and industry standards. European, Asian, and other markets have their own distinct rate structures."
                />
                <ConsiderationItem 
                  icon={<Plane size={28} />}
                  title="Travel, Accommodation & Per Diems"
                  description="For work requiring travel, it's standard for clients to cover travel costs, provide accommodation, and offer a daily per diem for meals and incidentals. These should be agreed upon in advance."
                />
                <ConsiderationItem 
                  icon={<Briefcase size={28} />} /* Re-using briefcase, suitable for "kit" */
                  title="Kit / Gear Rental Fees"
                  description="Technicians providing their own specialized equipment (e.g., specific tools, laptops with software, consoles) may charge a 'kit fee' or 'gear rental' in addition to their day rate."
                />
                <ConsiderationItem 
                  icon={<FileText size={28} />}
                  title="Cancellation Policies"
                  description="Freelancers often have cancellation policies (e.g., 50% fee if cancelled within 48 hours, 100% within 24 hours). These protect against last-minute changes and should be part of the agreement."
                />
                 <ConsiderationItem 
                  icon={<ShieldCheck size={28} />}
                  title="Insurance & Liability"
                  description="Clarify insurance responsibilities. Production companies usually carry general liability, but freelancers may need their own professional liability or workers' compensation depending on location and client requirements."
                />
                <ConsiderationItem 
                  icon={<AlertTriangle size={28} />}
                  title="Disclaimer"
                  description="This information is for general guidance only. Actual rates should be negotiated based on specific project requirements, your experience, local market conditions, and a clear scope of work."
                />
              </div>
            </div>
             <p className="text-gray-500 mt-12 text-center">
                This guide provides estimates. Always confirm rates, overtime policies, and all other terms in writing before committing to a project.
              </p>
          </main>
          <Footer />
        </div>
      );
    };

    export default RatesPage;
