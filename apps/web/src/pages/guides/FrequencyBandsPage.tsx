import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Link as RouterLink } from "react-router-dom";
import { ChevronLeft, Radio, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface FrequencyBandInfo {
  bandName: string;
  frequencyRange: string;
  tvChannels?: string;
  usageType: string;
  unlicensedPowerLimit?: string;
  status:
    | "Available"
    | "Partially Available"
    | "No Longer Available"
    | "Licensed Only"
    | "Special Conditions";
  notes: string | React.ReactNode;
}

const frequencyData: FrequencyBandInfo[] = [
  {
    bandName: "TV Bands (VHF & UHF)",
    frequencyRange: "54-608 MHz (approx., excluding 600 MHz service bands)",
    tvChannels: "2-36",
    usageType: "Licensed & Unlicensed",
    unlicensedPowerLimit: "50 mW",
    status: "Available",
    notes:
      "Primary spectrum for wireless microphones. WMAS permitted. Excludes 617-652 MHz & 663-698 MHz.",
  },
  {
    bandName: "600 MHz Guard Band",
    frequencyRange: "614-616 MHz",
    tvChannels: "Part of former Ch. 37/38",
    usageType: "Unlicensed",
    unlicensedPowerLimit: "20 mW",
    status: "Available",
    notes: "Narrow band available for unlicensed use. WMAS permitted.",
  },
  {
    bandName: "600 MHz Service Band (Lower)",
    frequencyRange: "617-652 MHz",
    tvChannels: "Former Ch. 38-44",
    usageType: "N/A",
    status: "No Longer Available",
    notes:
      "Repurposed for 600 MHz service wireless broadband. Wireless microphone operation prohibited.",
  },
  {
    bandName: "600 MHz Duplex Gap (Licensed)",
    frequencyRange: "653-657 MHz",
    tvChannels: "Part of former Ch. 44/45",
    usageType: "Licensed",
    status: "Licensed Only",
    notes: "Available for licensed users. WMAS permitted.",
  },
  {
    bandName: "600 MHz Duplex Gap (Unlicensed)",
    frequencyRange: "657-663 MHz",
    tvChannels: "Part of former Ch. 45/46",
    usageType: "Unlicensed",
    unlicensedPowerLimit: "20 mW",
    status: "Available",
    notes: "Available for unlicensed use. WMAS permitted.",
  },
  {
    bandName: "600 MHz Service Band (Upper)",
    frequencyRange: "663-698 MHz",
    tvChannels: "Former Ch. 46-51",
    usageType: "N/A",
    status: "No Longer Available",
    notes:
      "Repurposed for 600 MHz service wireless broadband. Wireless microphone operation prohibited.",
  },
  {
    bandName: "900 MHz ISM Band",
    frequencyRange: "902-928 MHz",
    usageType: "Unlicensed",
    unlicensedPowerLimit: "Per band rules",
    status: "Available",
    notes: "Subject to specific power levels and operational rules. WMAS permitted.",
  },
  {
    bandName: "1.9 GHz Band (DECT)",
    frequencyRange: "1920-1930 MHz",
    usageType: "Unlicensed",
    unlicensedPowerLimit: "Per band rules",
    status: "Available",
    notes: "Subject to specific power levels and operational rules. WMAS permitted.",
  },
  {
    bandName: "2.4 GHz Band",
    frequencyRange: "Portions of 2.4 GHz",
    usageType: "Unlicensed",
    unlicensedPowerLimit: "Per band rules",
    status: "Available",
    notes: "Shared with Wi-Fi, Bluetooth; potential for interference. WMAS permitted.",
  },
  {
    bandName: "5 GHz Band",
    frequencyRange: "Portions of 5 GHz",
    usageType: "Unlicensed",
    unlicensedPowerLimit: "Per band rules",
    status: "Available",
    notes: "Shared with Wi-Fi; potential for interference. WMAS permitted.",
  },
  {
    bandName: "900 MHz Band (Licensed)",
    frequencyRange: "Portions (e.g., 941.5-952 MHz, 952.850-956.250 MHz, 956.45-959.85 MHz)",
    usageType: "Licensed",
    status: "Licensed Only",
    notes: "Part 74 licensed operations. WMAS permitted.",
  },
  {
    bandName: "1.4 GHz Band (Licensed)",
    frequencyRange: "1435-1525 MHz",
    usageType: "Licensed",
    status: "Licensed Only",
    notes: "Part 74 licensed operations. WMAS permitted.",
  },
  {
    bandName: "7 GHz Band (Licensed)",
    frequencyRange: "6875-7125 MHz",
    usageType: "Licensed",
    status: "Licensed Only",
    notes: "Part 74 licensed operations. WMAS permitted.",
  },
];

const getStatusIcon = (status: FrequencyBandInfo["status"]) => {
  switch (status) {
    case "Available":
    case "Partially Available":
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case "No Longer Available":
      return <AlertTriangle className="h-5 w-5 text-red-400" />;
    case "Licensed Only":
    case "Special Conditions":
      return <Info className="h-5 w-5 text-yellow-400" />;
    default:
      return null;
  }
};

const FrequencyBandsPage: React.FC = () => {
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
          Wireless Microphone Frequency Bands (U.S. FCC)
        </h1>
        <p className="text-lg text-gray-400 text-center mb-12 max-w-3xl mx-auto">
          Understanding available spectrum is crucial for legal and interference-free wireless
          microphone operation. FCC rules have evolved, notably with the 600 MHz band repurposing.
          Always verify your equipment's operating frequencies.
        </p>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-12">
          <h2 className="text-2xl font-semibold text-sky-300 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-3 text-yellow-400" /> Important FCC Changes &
            Equipment Check
          </h2>
          <p className="text-gray-300 mb-3">
            The FCC has made significant changes to wireless microphone rules. Equipment previously
            operating in certain parts of the 600 MHz band (specifically 617-652 MHz and 663-698
            MHz, formerly TV channels 38-51) is no longer legal for use and must be replaced or
            modified.
          </p>
          <p className="text-gray-300">
            <strong>Action Required:</strong> Check your wireless microphone's operating
            frequencies. Consult the manufacturer or user manual. Devices operating in the
            prohibited 600 MHz segments must cease operation.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-12">
          <h2 className="text-2xl font-semibold text-sky-300 mb-4 flex items-center">
            <Radio className="h-6 w-6 mr-3 text-sky-400" /> Wireless Multichannel Audio Systems
            (WMAS)
          </h2>
          <p className="text-gray-300 mb-3">
            In February 2024, the FCC authorized WMAS, a more spectrally efficient technology. WMAS
            transmits multiple audio channels over a wider bandwidth channel, designed for
            professional applications requiring many microphones (e.g., large theaters, sporting
            events).
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 mb-3">
            <li>WMAS can operate in many existing wireless mic bands (licensed and unlicensed).</li>
            <li>It aims to allow more microphones in a given spectrum amount.</li>
            <li>
              <strong>
                Existing conventional (non-WMAS) microphone users are NOT required to change their
                devices or operations due to WMAS rules.
              </strong>
            </li>
          </ul>
        </div>

        <h2 className="text-3xl font-semibold text-center text-sky-300 mb-8">
          Frequency Band Availability Chart
        </h2>
        <div className="overflow-x-auto bg-gray-800 p-2 rounded-lg shadow-xl">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-200 uppercase bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Frequency Band Name
                </th>
                <th scope="col" className="px-4 py-3">
                  Frequency Range (MHz)
                </th>
                <th scope="col" className="px-4 py-3">
                  TV Channels
                </th>
                <th scope="col" className="px-4 py-3">
                  Usage Type
                </th>
                <th scope="col" className="px-4 py-3">
                  Max Unlicensed Power
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {frequencyData.map((band, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{band.bandName}</td>
                  <td className="px-4 py-3">{band.frequencyRange}</td>
                  <td className="px-4 py-3">{band.tvChannels || "N/A"}</td>
                  <td className="px-4 py-3">{band.usageType}</td>
                  <td className="px-4 py-3">{band.unlicensedPowerLimit || "N/A"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(band.status)}
                      <span className="ml-2">{band.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[250px]">{band.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-sky-300 mb-4 flex items-center">
              <Info className="h-6 w-6 mr-3 text-sky-400" /> Devices "Similar" to Wireless
              Microphones
            </h2>
            <p className="text-gray-300">
              Wireless intercoms, wireless in-ear monitors, wireless audio instrument links, and
              wireless cueing equipment must follow the same FCC rules as wireless microphones.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-sky-300 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 mr-3 text-green-400" /> Part 74 Licensed Operations
            </h2>
            <p className="text-gray-300 mb-3">
              Certain entities (e.g., broadcasters, venue owners operating 50+ mics, professional
              sound companies) can obtain Part 74 licenses for operating wireless mics with
              specified rules and interference protections.
            </p>
            <p className="text-gray-300">
              Licensed operators must adhere to their license terms and use authorized bands,
              avoiding the repurposed 600 MHz service bands.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-400 p-6 bg-gray-800 rounded-lg shadow-xl">
          <p className="mb-2">
            <strong>Disclaimer:</strong> This information is a summary based on FCC guidelines and
            is for informational purposes only. Always consult the official FCC website and
            regulations for the most current and complete information.
          </p>
          <p className="mb-2">
            Contact your equipment manufacturer or check user manuals to determine the specific
            frequencies your wireless microphones use.
          </p>
          <p className="font-semibold text-yellow-300">
            Last Updated: 6/10/25. Check with the FCC for more up to date information.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FrequencyBandsPage;
