import React from "react";
    import Header from "../../components/Header";
    import Footer from "../../components/Footer";
    import { Link as RouterLink } from "react-router-dom";
    import { ChevronLeft, Volume2, AlertTriangle, ShieldCheck, Info } from "lucide-react";

    interface SoundLevelExample {
      source: string;
      level_dBSPL: string;
      perception: string;
    }

    interface OshaLimit {
      level_dBA: string;
      duration_hours: string;
    }

    const commonSoundLevels: SoundLevelExample[] = [
      { source: "Threshold of Hearing", level_dBSPL: "0 dB", perception: "Barely audible" },
      { source: "Whisper, Rustling Leaves", level_dBSPL: "20-30 dB", perception: "Very quiet" },
      { source: "Quiet Library, Soft Conversation", level_dBSPL: "40 dB", perception: "Quiet" },
      { source: "Normal Conversation, Office Noise", level_dBSPL: "60-70 dB", perception: "Moderate" },
      { source: "Vacuum Cleaner, City Traffic", level_dBSPL: "70-80 dB", perception: "Loud" },
      { source: "Motorcycle (at 25 ft), Power Mower", level_dBSPL: "90 dB", perception: "Very Loud, Hearing damage possible with prolonged exposure" },
      { source: "Chainsaw, Subway Train", level_dBSPL: "100 dB", perception: "Extremely Loud" },
      { source: "Rock Concert (near speakers), Nightclub", level_dBSPL: "110-120 dB", perception: "Painfully Loud, Immediate risk" },
      { source: "Jet Engine (at 100 ft), Firecracker", level_dBSPL: "130-140 dB", perception: "Threshold of Pain, Immediate damage" },
      { source: "Rocket Launch", level_dBSPL: "180+ dB", perception: "Instantaneous, Irreversible Damage" },
    ];

    const oshaPermissibleLimits: OshaLimit[] = [
      { level_dBA: "85 dBA", duration_hours: "8 hours" },
      { level_dBA: "90 dBA", duration_hours: "8 hours (Action Level / PEL)" },
      { level_dBA: "92 dBA", duration_hours: "6 hours" },
      { level_dBA: "95 dBA", duration_hours: "4 hours" },
      { level_dBA: "97 dBA", duration_hours: "3 hours" },
      { level_dBA: "100 dBA", duration_hours: "2 hours" },
      { level_dBA: "102 dBA", duration_hours: "1.5 hours" },
      { level_dBA: "105 dBA", duration_hours: "1 hour" },
      { level_dBA: "110 dBA", duration_hours: "0.5 hours (30 minutes)" },
      { level_dBA: "115 dBA", duration_hours: "0.25 hours (15 minutes)" },
      { level_dBA: "120 dBA", duration_hours: "Avoid exposure above this level without hearing protection" },
    ];

    const DecibelChartPage: React.FC = () => {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-16">
            <div className="mb-12">
              <RouterLink
                to="/resources/reference-guides"
                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-300 group"
              >
                <ChevronLeft className="mr-2 h-5 w-5 transform transition-transform duration-300 group-hover:-translate-x-1" />
                Back to Reference Guides
              </RouterLink>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-500">
              Decibel (dB) Reference Chart
            </h1>
            <p className="text-lg text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              Understanding decibels is key to audio work and hearing safety. This guide covers common dB scales, sound level examples, and OSHA's guidelines for noise exposure.
            </p>

            {/* Understanding dB Scales Section */}
            <section className="mb-16 bg-gray-800 p-6 rounded-lg shadow-xl">
              <h2 className="text-2xl font-semibold text-sky-300 mb-6 flex items-center">
                <Info className="h-6 w-6 mr-3 text-sky-400" /> Understanding dB Scales
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-xl font-medium text-sky-200 mb-2">dBSPL (Sound Pressure Level)</h3>
                  <p className="text-gray-300">Measures the intensity of sound in the air relative to the threshold of human hearing (0 dBSPL). Used for acoustic measurements (e.g., room noise, speaker output).</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-xl font-medium text-sky-200 mb-2">dBu (Decibels Unloaded)</h3>
                  <p className="text-gray-300">An electrical voltage reference, where 0 dBu = 0.775 Volts. Common in professional audio equipment specifications.</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-xl font-medium text-sky-200 mb-2">dBV (Decibels Volt)</h3>
                  <p className="text-gray-300">Another electrical voltage reference, where 0 dBV = 1 Volt. Often used in consumer and some semi-pro audio gear.</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-xl font-medium text-sky-200 mb-2">dBFS (Decibels Full Scale)</h3>
                  <p className="text-gray-300">Measures digital audio signal levels, where 0 dBFS is the maximum possible level before digital clipping occurs. All values are negative or zero.</p>
                </div>
              </div>
              <p className="text-gray-400 mt-6">
                <strong>Key takeaway:</strong> Decibels are logarithmic and always represent a ratio relative to a reference point. The reference changes depending on the dB scale (e.g., SPL, u, V, FS).
              </p>
            </section>

            {/* Common Sound Levels Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-semibold text-center text-sky-300 mb-8 flex items-center justify-center">
                <Volume2 className="h-8 w-8 mr-3 text-sky-400" /> Common Sound Levels (dBSPL)
              </h2>
              <div className="overflow-x-auto bg-gray-800 p-2 rounded-lg shadow-xl">
                <table className="min-w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-200 uppercase bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3">Sound Source</th>
                      <th scope="col" className="px-4 py-3">Approx. Level (dBSPL)</th>
                      <th scope="col" className="px-4 py-3">Perception / Potential Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commonSoundLevels.map((item, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{item.source}</td>
                        <td className="px-4 py-3">{item.level_dBSPL}</td>
                        <td className="px-4 py-3">{item.perception}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* OSHA Guidelines Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-semibold text-center text-sky-300 mb-8 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 mr-3 text-yellow-400" /> OSHA Permissible Noise Exposure Limits
              </h2>
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
                <p className="text-gray-300 mb-3">
                  The Occupational Safety and Health Administration (OSHA) sets legal limits on noise exposure in the workplace. These are based on a time-weighted average (TWA) over an 8-hour day. If the noise level increases by 5 dBA, the permissible exposure time is halved.
                </p>
                <p className="text-gray-300">
                  OSHA's Action Level is 85 dBA (TWA), requiring employers to implement a hearing conservation program. The Permissible Exposure Limit (PEL) is 90 dBA (TWA).
                </p>
              </div>
              <div className="overflow-x-auto bg-gray-800 p-2 rounded-lg shadow-xl">
                <table className="min-w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-200 uppercase bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3">Sound Level (dBA)</th>
                      <th scope="col" className="px-4 py-3">Maximum Permissible Duration per Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oshaPermissibleLimits.map((limit, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{limit.level_dBA}</td>
                        <td className="px-4 py-3">{limit.duration_hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
               <p className="text-sm text-gray-400 mt-4 text-center">
                *Exposure to impulsive or impact noise should not exceed 140 dB peak sound pressure level.
              </p>
            </section>
            
            {/* Hearing Protection Tips */}
            <section className="mb-16 bg-gray-800 p-6 rounded-lg shadow-xl">
              <h2 className="text-2xl font-semibold text-sky-300 mb-6 flex items-center">
                <ShieldCheck className="h-6 w-6 mr-3 text-green-400" /> Tips for Hearing Protection
              </h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li><strong>Use Hearing Protection:</strong> Wear earplugs or earmuffs in loud environments (concerts, power tool use, etc.). Ensure they have an appropriate Noise Reduction Rating (NRR).</li>
                <li><strong>Limit Exposure Time:</strong> Reduce the amount of time you spend in noisy settings.</li>
                <li><strong>Maintain Distance:</strong> Increase your distance from loud sound sources. Sound intensity decreases significantly with distance.</li>
                <li><strong>Turn Down the Volume:</strong> Especially with headphones and personal listening devices. If others can hear your music, it's too loud.</li>
                <li><strong>Take Quiet Breaks:</strong> Give your ears a rest from loud sounds periodically.</li>
                <li><strong>Get Regular Hearing Checks:</strong> Especially if you are frequently exposed to loud noise.</li>
              </ul>
            </section>

            <div className="mt-12 text-center text-gray-400 p-6 bg-gray-800 rounded-lg shadow-xl">
              <p className="mb-2">
                <strong>Disclaimer:</strong> This information is for educational purposes and summarizes common knowledge and OSHA guidelines.
                Always consult official OSHA documentation and qualified audiologists for specific workplace safety requirements and personal hearing health advice.
              </p>
              <p className="font-semibold text-yellow-300">
                OSHA guidelines can be updated. Always refer to the official OSHA website for the most current regulations.
              </p>
            </div>
          </main>
          <Footer />
        </div>
      );
    };

    export default DecibelChartPage;
