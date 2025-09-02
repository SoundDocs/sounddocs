import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Link as RouterLink } from "react-router-dom";
import {
  ChevronLeft,
  Zap,
  AudioWaveform,
  Video,
  Lightbulb,
  Network,
  Speaker,
  Tv,
  Smartphone,
  Usb,
  PowerSquare,
} from "lucide-react";

interface PinoutDetail {
  pin: string;
  signal: string;
  color?: string; // Optional for wire colors
}

interface ConnectorInfo {
  id: string;
  name: string;
  category: "Audio" | "Video" | "Lighting" | "Power" | "Data" | "AV/Data";
  description: string;
  commonUses: string[];
  pinout: PinoutDetail[];
  notes?: string;
  icon?: React.ReactNode;
}

const connectorsData: ConnectorInfo[] = [
  {
    id: "xlr3",
    name: "XLR (3-Pin)",
    category: "Audio",
    description: "Standard connector for balanced audio signals.",
    commonUses: ["Microphones", "Line-level signals", "Intercom systems", "AES/EBU digital audio"],
    pinout: [
      { pin: "Pin 1", signal: "Shield (Ground)" },
      { pin: "Pin 2", signal: "Hot (Positive, +)" },
      { pin: "Pin 3", signal: "Cold (Negative, -)" },
    ],
    icon: <AudioWaveform className="h-6 w-6 text-sky-400" />,
    notes:
      "For AES/EBU (digital audio), Pin 2 is Data + and Pin 3 is Data -. Wire colors inside cables are not universally standardized beyond the pin functions.",
  },
  {
    id: "trs-stereo",
    name: 'TRS (1/4" or 6.35mm Stereo)',
    category: "Audio",
    description: "Tip-Ring-Sleeve connector for stereo unbalanced audio or mono balanced audio.",
    commonUses: ["Headphones (stereo)", "Stereo interconnects", "Insert points (send/return)"],
    pinout: [
      { pin: "Tip", signal: "Left Channel (or Send)" },
      { pin: "Ring", signal: "Right Channel (or Return)" },
      { pin: "Sleeve", signal: "Ground/Shield" },
    ],
    icon: <Speaker className="h-6 w-6 text-purple-400" />,
    notes: "Can also be used for balanced mono signals (see next entry).",
  },
  {
    id: "trs-balanced",
    name: 'TRS (1/4" or 6.35mm Balanced Mono)',
    category: "Audio",
    description: "Tip-Ring-Sleeve connector used for balanced mono audio signals.",
    commonUses: ["Line-level connections between professional audio devices", "Studio monitors"],
    pinout: [
      { pin: "Tip", signal: "Hot (Positive, +)" },
      { pin: "Ring", signal: "Cold (Negative, -)" },
      { pin: "Sleeve", signal: "Ground/Shield" },
    ],
    icon: <Speaker className="h-6 w-6 text-purple-400" />,
  },
  {
    id: "ts-mono",
    name: 'TS (1/4" or 6.35mm Mono Unbalanced)',
    category: "Audio",
    description: "Tip-Sleeve connector for mono unbalanced audio signals.",
    commonUses: [
      "Electric guitars",
      "Keyboards (mono output)",
      "Effects pedals",
      "Unbalanced line-level connections",
    ],
    pinout: [
      { pin: "Tip", signal: "Signal (Hot, +)" },
      { pin: "Sleeve", signal: "Ground/Shield" },
    ],
    icon: <Speaker className="h-6 w-6 text-purple-400" />,
  },
  {
    id: "trrs-35mm",
    name: "TRRS (3.5mm - CTIA/AHJ Standard)",
    category: "Audio",
    description:
      "Tip-Ring-Ring-Sleeve connector, commonly for stereo audio output and microphone input.",
    commonUses: ["Smartphone headsets", "Laptop audio jacks"],
    pinout: [
      { pin: "Tip", signal: "Left Audio Output" },
      { pin: "Ring 1", signal: "Right Audio Output" },
      { pin: "Ring 2", signal: "Ground" },
      { pin: "Sleeve", signal: "Microphone Input" },
    ],
    icon: <Smartphone className="h-6 w-6 text-pink-400" />,
    notes:
      "OMTP is an older, less common standard with Mic and Ground swapped. CTIA (Cellular Telecommunications Industry Association) / AHJ (American Headset Jack) is the modern standard.",
  },
  {
    id: "rca",
    name: "RCA (Phono Connector)",
    category: "AV/Data",
    description: "Common connector for unbalanced audio and composite/component video signals.",
    commonUses: [
      "Consumer audio/video equipment",
      "DJ turntables (phono)",
      "S/PDIF digital audio",
      "Composite video",
      "Component video (YPbPr)",
    ],
    pinout: [
      { pin: "Center Pin", signal: "Signal" },
      { pin: "Outer Shield", signal: "Ground" },
    ],
    icon: <Tv className="h-6 w-6 text-orange-300" />,
    notes:
      "Color coding is common: White (Left Audio), Red (Right Audio), Yellow (Composite Video). For component video: Green (Y), Blue (Pb/Cb), Red (Pr/Cr).",
  },
  {
    id: "dmx5",
    name: "DMX512 (5-Pin XLR)",
    category: "Lighting",
    description:
      "Standard for lighting control, allowing for a primary and optional secondary data link.",
    commonUses: ["Stage lighting control", "Effects control"],
    pinout: [
      { pin: "Pin 1", signal: "Signal Common (Shield/Ground)" },
      { pin: "Pin 2", signal: "Data 1- (Primary Data Link, Negative)" },
      { pin: "Pin 3", signal: "Data 1+ (Primary Data Link, Positive)" },
      { pin: "Pin 4", signal: "Data 2- (Optional Secondary Data Link, Negative)" },
      { pin: "Pin 5", signal: "Data 2+ (Optional Secondary Data Link, Positive)" },
    ],
    icon: <Lightbulb className="h-6 w-6 text-yellow-400" />,
    notes:
      "Pins 4 and 5 are often unused. Wire colors often follow twisted pair conventions if using Cat5-style cable (e.g., Orange/White-Orange for Data 1, Green/White-Green for Data 2).",
  },
  {
    id: "dmx3",
    name: "DMX512 (3-Pin XLR)",
    category: "Lighting",
    description: "A common adaptation using 3-pin XLR connectors for DMX512 lighting control.",
    commonUses: ["Stage lighting control (especially in DJ or smaller setups)"],
    pinout: [
      { pin: "Pin 1", signal: "Signal Common (Shield/Ground)" },
      { pin: "Pin 2", signal: "Data 1- (Primary Data Link, Negative)" },
      { pin: "Pin 3", signal: "Data 1+ (Primary Data Link, Positive)" },
    ],
    icon: <Lightbulb className="h-6 w-6 text-yellow-400" />,
    notes:
      "While common, 5-pin XLR is the official standard to avoid confusion with audio XLR and allow for the secondary data link.",
  },
  {
    id: "sdi",
    name: "SDI (BNC Connector)",
    category: "Video",
    description: "Serial Digital Interface for transmitting uncompressed digital video signals.",
    commonUses: ["Professional video equipment", "Broadcast studios", "Live event video feeds"],
    pinout: [
      { pin: "Center Pin", signal: "Signal" },
      { pin: "Outer Shield", signal: "Ground" },
    ],
    icon: <Video className="h-6 w-6 text-red-400" />,
    notes:
      "Requires 75-ohm coaxial cable and BNC connectors. No specific wire colors beyond cable jacket.",
  },
  {
    id: "bnc-wordclock",
    name: "BNC (Word Clock / Video Sync)",
    category: "AV/Data",
    description:
      "BNC connector used for synchronization signals like Word Clock (audio) or Black Burst/Tri-Level Sync (video).",
    commonUses: ["Digital audio synchronization", "Video genlock"],
    pinout: [
      { pin: "Center Pin", signal: "Signal" },
      { pin: "Outer Shield", signal: "Ground" },
    ],
    icon: <Video className="h-6 w-6 text-red-400" />,
    notes:
      "Requires 75-ohm coaxial cable for video sync and word clock. Word clock can sometimes use 50-ohm cables/termination depending on equipment.",
  },
  {
    id: "nl2",
    name: "Speakon NL2",
    category: "Audio",
    description: "2-pole connector for loudspeaker connections (single channel).",
    commonUses: ["Passive loudspeakers", "Amplifier outputs"],
    pinout: [
      { pin: "1+", signal: "Positive (+)", color: "Red (typical)" },
      { pin: "1-", signal: "Negative (-)", color: "Black (typical)" },
    ],
    icon: <AudioWaveform className="h-6 w-6 text-sky-400" />,
  },
  {
    id: "nl4",
    name: "Speakon NL4",
    category: "Audio",
    description:
      "4-pole connector for loudspeaker connections, supporting up to two channels or bi-amping.",
    commonUses: ["Passive loudspeakers (single or bi-amped)", "Amplifier outputs"],
    pinout: [
      { pin: "1+", signal: "Channel 1 Positive (+)", color: "Red / Brown (typical for Ch1+)" },
      { pin: "1-", signal: "Channel 1 Negative (-)", color: "Black / Blue (typical for Ch1-)" },
      { pin: "2+", signal: "Channel 2 Positive (+)", color: "Yellow / Orange (typical for Ch2+)" },
      { pin: "2-", signal: "Channel 2 Negative (-)", color: "Green / Grey (typical for Ch2-)" },
    ],
    icon: <AudioWaveform className="h-6 w-6 text-sky-400" />,
    notes:
      "Can be wired for single channel (using 1+/1-) or two channels/bi-amping. Colors can vary; always check documentation or test.",
  },
  {
    id: "nl8",
    name: "Speakon NL8",
    category: "Audio",
    description:
      "8-pole connector for loudspeaker connections, supporting up to four channels or complex multi-way systems.",
    commonUses: ["Multi-way passive loudspeaker systems", "Amplifier racks"],
    pinout: [
      { pin: "1+", signal: "Channel 1 Positive (+)" },
      { pin: "1-", signal: "Channel 1 Negative (-)" },
      { pin: "2+", signal: "Channel 2 Positive (+)" },
      { pin: "2-", signal: "Channel 2 Negative (-)" },
      { pin: "3+", signal: "Channel 3 Positive (+)" },
      { pin: "3-", signal: "Channel 3 Negative (-)" },
      { pin: "4+", signal: "Channel 4 Positive (+)" },
      { pin: "4-", signal: "Channel 4 Negative (-)" },
    ],
    icon: <AudioWaveform className="h-6 w-6 text-sky-400" />,
    notes:
      "Wire colors are not strictly standardized for all 8 poles but often follow a logical progression from NL4 colors or use numbered/striped wires.",
  },
  {
    id: "rj45",
    name: "Ethernet (RJ45 - T568B)",
    category: "Data",
    description:
      "Standard connector for networking, also used for digital audio (AoIP) and lighting control.",
    commonUses: [
      "Computer networking",
      "Audio over IP (e.g., Dante)",
      "Art-Net/sACN lighting control",
    ],
    pinout: [
      { pin: "Pin 1", signal: "Transmit+", color: "Orange/White" },
      { pin: "Pin 2", signal: "Transmit-", color: "Orange" },
      { pin: "Pin 3", signal: "Receive+", color: "Green/White" },
      { pin: "Pin 4", signal: "Unused (PoE Power)", color: "Blue" },
      { pin: "Pin 5", signal: "Unused (PoE Power)", color: "Blue/White" },
      { pin: "Pin 6", signal: "Receive-", color: "Green" },
      { pin: "Pin 7", signal: "Unused (PoE Power)", color: "Brown/White" },
      { pin: "Pin 8", signal: "Unused (PoE Power)", color: "Brown" },
    ],
    icon: <Network className="h-6 w-6 text-green-400" />,
    notes:
      "T568A is an alternative wiring standard (swaps Orange and Green pairs). For PoE (Power over Ethernet), pins 4,5,7,8 may carry power.",
  },
  {
    id: "hdmi-a",
    name: "HDMI (Type A)",
    category: "AV/Data",
    description: "High-Definition Multimedia Interface for transmitting digital video and audio.",
    commonUses: ["Connecting displays, TVs, projectors, computers, game consoles"],
    pinout: [
      { pin: "1-9", signal: "TMDS Data Pairs (Data2, Data1, Data0) & Clocks (+/- and Shield)" },
      { pin: "10-12", signal: "TMDS Clock Channel (+/- and Shield)" },
      { pin: "13", signal: "CEC (Consumer Electronics Control)" },
      { pin: "14", signal: "Utility / Reserved" },
      { pin: "15", signal: "SCL (I²C Serial Clock for DDC)" },
      { pin: "16", signal: "SDA (I²C Serial Data for DDC)" },
      { pin: "17", signal: "DDC/CEC Ground / HPD Shield" },
      { pin: "18", signal: "+5V Power" },
      { pin: "19", signal: "Hot Plug Detect" },
    ],
    icon: <Tv className="h-6 w-6 text-red-500" />,
    notes:
      "This is a simplified overview. HDMI has 19 pins with complex signaling. Wire colors within the cable are not standardized for end-users.",
  },
  {
    id: "usb-a",
    name: "USB-A",
    category: "Data",
    description: "Universal Serial Bus Type-A connector.",
    commonUses: [
      "Connecting peripherals to computers (keyboards, mice, flash drives)",
      "Charging devices",
    ],
    pinout: [
      { pin: "Pin 1 (VCC)", signal: "+5V DC", color: "Red" },
      { pin: "Pin 2 (D-)", signal: "Data-", color: "White" },
      { pin: "Pin 3 (D+)", signal: "Data+", color: "Green" },
      { pin: "Pin 4 (GND)", signal: "Ground", color: "Black" },
    ],
    icon: <Usb className="h-6 w-6 text-blue-400" />,
  },
  {
    id: "usb-c",
    name: "USB-C",
    category: "Data",
    description: "Versatile USB connector supporting data, video, and power.",
    commonUses: [
      "Modern smartphones, laptops, tablets",
      "Docking stations",
      "External storage",
      "DisplayPort Alternate Mode",
    ],
    pinout: [
      { pin: "A1/B12, A12/B1", signal: "GND (Ground)" },
      { pin: "A4/B9, A9/B4", signal: "VBUS (+5V to +20V Power)" },
      { pin: "A5, B5", signal: "CC1, CC2 (Configuration Channel)" },
      { pin: "A6/B7, A7/B6", signal: "D+/D- (USB 2.0 Data)" },
      { pin: "A2/B11, A3/B10", signal: "SSTX+/SSTX-, SSRX+/SSRX- (SuperSpeed Data Pairs)" },
    ],
    icon: <Usb className="h-6 w-6 text-blue-400" />,
    notes:
      "USB-C is highly complex with 24 pins. This is a simplified overview. Supports USB Power Delivery (PD) and alternate modes like DisplayPort/Thunderbolt.",
  },
  {
    id: "edison",
    name: "Edison (NEMA 5-15P/R)",
    category: "Power",
    description: "Common North American AC power connector (120V, 15A).",
    commonUses: ["Household appliances", "General purpose stage power"],
    pinout: [
      { pin: "Brass Screw (Narrow Slot)", signal: "Hot (Line)", color: "Black wire" },
      { pin: "Silver Screw (Wide Slot)", signal: "Neutral", color: "White wire" },
      { pin: "Green Screw (Round Pin)", signal: "Ground", color: "Green or Bare wire" },
    ],
    icon: <Zap className="h-6 w-6 text-orange-400" />,
  },
  {
    id: "iec-c13-c14",
    name: "IEC C13 / C14",
    category: "Power",
    description: "Common AC power connector for computers, monitors, and many electronic devices.",
    commonUses: ["Computer power supplies", "Monitors", "Rackmount equipment", "Amplifiers"],
    pinout: [
      { pin: "Line (L)", signal: "Hot / Line", color: "Brown (IEC) / Black (US)" },
      { pin: "Neutral (N)", signal: "Neutral", color: "Blue (IEC) / White (US)" },
      {
        pin: "Earth (E)",
        signal: "Protective Earth / Ground",
        color: "Green/Yellow (IEC) / Green (US)",
      },
    ],
    icon: <PowerSquare className="h-6 w-6 text-gray-400" />,
    notes: "C14 is the male inlet on equipment, C13 is the female connector on power cords.",
  },
  {
    id: "l630",
    name: "L6-30 (NEMA L6-30P/R)",
    category: "Power",
    description: "Locking connector for single-phase AC power (typically 208V or 240V, 30A).",
    commonUses: ["High-power amplifiers", "Servers", "Industrial equipment", "EV charging (older)"],
    pinout: [
      { pin: "X (Brass)", signal: "Hot 1 (Line 1)", color: "Black" },
      {
        pin: "Y (Brass)",
        signal: "Hot 2 (Line 2)",
        color: "Red (for 208V) / White (for 240V from split-phase)",
      },
      { pin: "G (Green)", signal: "Ground", color: "Green" },
    ],
    icon: <Zap className="h-6 w-6 text-orange-400" />,
    notes:
      "Color for Hot 2 can vary based on the source (e.g., Red for 208V three-phase derived, White if it's L2 of a 120/240V split-phase system).",
  },
  {
    id: "l2130",
    name: "L21-30 (NEMA L21-30P/R)",
    category: "Power",
    description: "Locking connector for three-phase AC power (typically 120/208V Y, 30A).",
    commonUses: ["Power distribution units (distros)", "Motor control", "High-power lighting"],
    pinout: [
      { pin: "X (Brass)", signal: "Phase A (Hot)", color: "Black" },
      { pin: "Y (Brass)", signal: "Phase B (Hot)", color: "Red" },
      { pin: "Z (Brass)", signal: "Phase C (Hot)", color: "Blue" },
      { pin: "W (Silver)", signal: "Neutral", color: "White" },
      { pin: "G (Green)", signal: "Ground", color: "Green" },
    ],
    icon: <Zap className="h-6 w-6 text-orange-400" />,
  },
  {
    id: "socapex",
    name: "Socapex (19-Pin)",
    category: "Power",
    description:
      "Multi-pin connector for distributing multiple lighting circuits (typically 6 circuits of 20A).",
    commonUses: ["Stage lighting bars", "Dimmer racks to fixtures"],
    pinout: [
      { pin: "1-6", signal: "Hot for Circuits 1-6 respectively" },
      { pin: "7-12", signal: "Neutral for Circuits 1-6 respectively" },
      { pin: "13-18", signal: "Ground for Circuits 1-6 respectively" },
      { pin: "19", signal: "Alignment Pin (often unused for power)" },
    ],
    icon: <Zap className="h-6 w-6 text-orange-400" />,
    notes:
      "Common Hot wire colors: Ckt 1 (Black), Ckt 2 (Red), Ckt 3 (Blue), Ckt 4 (Brown or second Black), Ckt 5 (Orange or second Red), Ckt 6 (Yellow or second Blue). Neutrals are typically White (sometimes with color trace), Grounds are Green (sometimes with color trace). Always verify wiring.",
  },
  {
    id: "true1",
    name: "powerCON TRUE1 TOP",
    category: "Power",
    description:
      "Locking, true mains connector with breaking capacity (can be connected/disconnected under load). IP65 rated.",
    commonUses: ["Professional audio/video/lighting equipment power input/output"],
    pinout: [
      { pin: "L", signal: "Line (Hot)", color: "Brown (IEC) / Black (US)" },
      { pin: "N", signal: "Neutral", color: "Blue (IEC) / White (US)" },
      { pin: "PE", signal: "Protective Earth (Ground)", color: "Green/Yellow (IEC) / Green (US)" },
    ],
    icon: <Zap className="h-6 w-6 text-orange-400" />,
    notes:
      "TOP (Total Outdoor Protection) version is IP65 rated and backwards compatible with older TRUE1.",
  },
  {
    id: "powercon",
    name: "powerCON (Blue/Grey - NAC3MPA/B, NAC3FCA/B)",
    category: "Power",
    description:
      "Locking AC power connector. Blue (NAC3FCA/MPA) for power-in, Grey (NAC3FCB/MPB) for power-out. Not for breaking capacity.",
    commonUses: ["Powering devices, daisy-chaining power (Grey for output)"],
    pinout: [
      { pin: "L", signal: "Line (Hot)", color: "Brown (IEC) / Black (US)" },
      { pin: "N", signal: "Neutral", color: "Blue (IEC) / White (US)" },
      { pin: "E", signal: "Earth (Ground)", color: "Green/Yellow (IEC) / Green (US)" },
    ],
    icon: <Zap className="h-6 w-6 text-orange-400" />,
    notes:
      "Blue (power-in) and Grey (power-out) connectors are keyed differently and are not intermatable. Always de-energize before connecting/disconnecting.",
  },
];

const ConnectorCard: React.FC<{ connector: ConnectorInfo }> = ({ connector }) => {
  return (
    <div id={connector.id} className="bg-gray-800 p-6 rounded-lg shadow-lg scroll-mt-24">
      <div className="flex items-center mb-4">
        {connector.icon && (
          <div className="mr-3 p-2 bg-gray-700 rounded-full">{connector.icon}</div>
        )}
        <h2 className="text-2xl font-semibold text-sky-300">{connector.name}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-1">Category: {connector.category}</p>
      <p className="text-gray-400 mb-3">{connector.description}</p>

      <h3 className="text-md font-semibold text-sky-200 mt-4 mb-2">Common Uses:</h3>
      <ul className="list-disc list-inside text-gray-400 mb-4 space-y-1">
        {connector.commonUses.map((use, index) => (
          <li key={index}>{use}</li>
        ))}
      </ul>

      <h3 className="text-md font-semibold text-sky-200 mb-2">Pinout:</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-2">
                Pin
              </th>
              <th scope="col" className="px-4 py-2">
                Signal/Function
              </th>
              {connector.pinout.some((p) => p.color) && (
                <th scope="col" className="px-4 py-2">
                  Typical Wire Color
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {connector.pinout.map((p, index) => (
              <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-2 font-medium text-white">{p.pin}</td>
                <td className="px-4 py-2">{p.signal}</td>
                {connector.pinout.some((item) => item.color) && (
                  <td className="px-4 py-2">{p.color || "-"}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {connector.notes && (
        <div className="mt-4 p-3 bg-gray-750 rounded-md">
          <p className="text-sm text-gray-300">
            <strong className="text-sky-400">Note:</strong> {connector.notes}
          </p>
        </div>
      )}
    </div>
  );
};

const categoryOrder: ConnectorInfo["category"][] = [
  "Audio",
  "Video",
  "Lighting",
  "Power",
  "Data",
  "AV/Data",
];

const CommonPinoutsPage: React.FC = () => {
  const sortedConnectors = [...connectorsData].sort((a, b) => {
    const categoryAIndex = categoryOrder.indexOf(a.category);
    const categoryBIndex = categoryOrder.indexOf(b.category);

    if (categoryAIndex !== categoryBIndex) {
      return categoryAIndex - categoryBIndex;
    }
    return a.name.localeCompare(b.name);
  });

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
          Common Connector Pinouts
        </h1>
        <p className="text-lg text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          A quick reference for pin assignments on frequently used audio, video, lighting, power,
          and data connectors. Wire colors are typical and can vary. Always verify with a tester or
          manufacturer's documentation.
        </p>

        <div className="bg-gray-800 py-4 mb-8 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-sky-300 text-center mb-3">
            Quick Jump to Connector:
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4">
            {sortedConnectors.map(
              (
                connector, // Use sortedConnectors for Quick Jump as well
              ) => (
                <a
                  href={`#${connector.id}`}
                  key={connector.id}
                  className="block bg-gray-700 p-2 rounded-md shadow hover:bg-gray-600 transition-colors text-center text-sm text-sky-300 hover:text-sky-200"
                >
                  {connector.name}
                </a>
              ),
            )}
          </div>
        </div>

        <div className="space-y-8">
          {sortedConnectors.map(
            (
              connector, // Use sortedConnectors for the main list
            ) => (
              <ConnectorCard key={connector.id} connector={connector} />
            ),
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommonPinoutsPage;
