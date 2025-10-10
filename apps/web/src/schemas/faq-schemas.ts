/**
 * FAQ Schema Utilities
 * Generates FAQPage structured data for better SERP display
 * https://schema.org/FAQPage
 */

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Generate FAQPage schema for search engines
 * @param faqs - Array of question/answer pairs
 * @returns Schema.org FAQPage object
 */
export const generateFAQSchema = (faqs: FAQItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};

/**
 * Pre-defined FAQ content for resource pages
 */
export const resourceFAQs = {
  commonPinouts: [
    {
      question: "What is the difference between XLR and TRS cables?",
      answer:
        "XLR cables use a 3-pin connector and are primarily used for balanced microphone and line-level signals in professional audio. TRS (Tip-Ring-Sleeve) cables can carry balanced or stereo signals and are commonly found on headphones and some professional equipment. XLR connectors lock in place, while TRS connectors do not.",
    },
    {
      question: "Which pin is hot on an XLR connector?",
      answer:
        "Pin 2 is the hot (positive) signal on an XLR connector following the standard wiring convention. Pin 1 is ground/shield, Pin 2 is hot (+), and Pin 3 is cold (-). This is the universal standard in professional audio.",
    },
    {
      question: "What is the difference between TS and TRS cables?",
      answer:
        "TS (Tip-Sleeve) cables have two conductors and carry unbalanced mono signals, commonly used for electric guitars and keyboards. TRS (Tip-Ring-Sleeve) cables have three conductors and can carry balanced mono signals or unbalanced stereo signals, providing better noise rejection for balanced applications.",
    },
    {
      question: "Can I use a TRS cable for a balanced connection?",
      answer:
        "Yes, TRS cables can carry balanced signals when connected between balanced equipment (both source and destination must support balanced operation). The Tip carries hot (+), Ring carries cold (-), and Sleeve is ground. This provides common-mode noise rejection.",
    },
    {
      question: "What is phantom power and which cables support it?",
      answer:
        "Phantom power is +48V DC sent through XLR cables to power condenser microphones and active DI boxes. It travels on pins 2 and 3 equally, returning through pin 1 (ground). Only balanced XLR cables support phantom power; TRS cables and unbalanced connections do not.",
    },
  ],

  decibelChart: [
    {
      question: "What is a safe listening level in decibels?",
      answer:
        "For prolonged exposure, sound levels should remain below 85 dB SPL. The National Institute for Occupational Safety and Health (NIOSH) recommends limiting exposure to 85 dB to 8 hours per day. For every 3 dB increase, safe exposure time is cut in half (e.g., 88 dB for 4 hours, 91 dB for 2 hours).",
    },
    {
      question: "How loud is a rock concert in decibels?",
      answer:
        "Rock concerts typically range from 100-120 dB SPL at the audience position, with levels near the stage often exceeding 110 dB. These levels can cause hearing damage with prolonged exposure. Hearing protection is strongly recommended for concerts exceeding 100 dB.",
    },
    {
      question: "What does dB SPL mean?",
      answer:
        "dB SPL (Sound Pressure Level) measures acoustic sound pressure relative to the threshold of human hearing (20 micropascals). It's the standard unit for measuring loudness in the air. 0 dB SPL is the quietest sound a healthy human ear can detect, while 120+ dB SPL can cause immediate hearing damage.",
    },
    {
      question: "What is the difference between dB and dBu?",
      answer:
        "dB is a relative unit expressing ratios, while dBu is an absolute unit measuring electrical voltage. 0 dBu equals 0.775 volts RMS. In professional audio, +4 dBu is the standard line level (approximately 1.23 volts). dBu is used for electrical signals, while dB SPL measures acoustic sound pressure.",
    },
    {
      question: "How much louder is 10 dB?",
      answer:
        "An increase of 10 dB represents a doubling of perceived loudness to the human ear. In terms of acoustic power, 10 dB is actually 10 times more power, but our ears perceive it as roughly twice as loud due to logarithmic hearing response.",
    },
  ],

  frequencyBands: [
    {
      question: "What frequency range is considered bass?",
      answer:
        "Bass frequencies typically range from 60 Hz to 250 Hz. Sub-bass extends down to 20 Hz (the lower limit of human hearing). This range contains the fundamental frequencies of bass guitars, kick drums, and the lowest notes of pianos and synthesizers.",
    },
    {
      question: "What frequencies affect vocal clarity?",
      answer:
        "Vocal clarity is primarily determined by the 2-5 kHz range, where consonants and vocal intelligibility reside. The fundamental frequency of most vocals sits between 80-300 Hz (depending on male/female voice), but presence and articulation come from the upper midrange and lower treble frequencies.",
    },
    {
      question: "What is the frequency range of human hearing?",
      answer:
        "Healthy human hearing spans approximately 20 Hz to 20,000 Hz (20 kHz). Hearing sensitivity peaks around 2-4 kHz. As we age or experience hearing damage, the upper frequency limit typically decreases, often dropping to 15 kHz or lower in adults.",
    },
    {
      question: "What frequencies should I cut to reduce muddiness?",
      answer:
        "Muddiness typically accumulates in the 200-500 Hz range, often called the 'low-mid' or 'mud' frequencies. Cutting 2-4 dB in this range with a broad bell EQ can clean up muddy mixes. However, be careful not to remove too much, as this range also contains warmth and body.",
    },
    {
      question: "What is the difference between midrange and mid-bass?",
      answer:
        "Mid-bass covers approximately 80-200 Hz, containing the low fundamentals of instruments like bass guitar and kick drum. Midrange spans 250 Hz to 2 kHz and contains most instrumental and vocal fundamentals, providing body and punch to a mix. The boundary between them is the 'mud zone' around 200-250 Hz.",
    },
  ],

  glossary: [
    {
      question: "What is gain staging in audio?",
      answer:
        "Gain staging is the process of setting optimal signal levels at each stage of the audio chain (microphone preamp, mixer channels, processing, amplifiers) to maximize signal-to-noise ratio while avoiding distortion. Proper gain staging ensures clean, dynamic sound with minimal noise.",
    },
    {
      question: "What does impedance mean in audio?",
      answer:
        "Impedance is the electrical resistance to alternating current (AC), measured in ohms (Ω). In audio, matching impedance between source and load is important for maximum power transfer and minimal signal loss. Common impedances include 50Ω (microphones), 600Ω (professional line level), and 8Ω (speakers).",
    },
    {
      question: "What is the difference between balanced and unbalanced audio?",
      answer:
        "Balanced audio uses three conductors (hot, cold, ground) to carry the signal, with the cold conductor inverted. At the destination, the signals are recombined, canceling noise picked up along the cable. Unbalanced audio uses two conductors (hot and ground) and is more susceptible to interference, especially over long cable runs.",
    },
    {
      question: "What is a DI box used for?",
      answer:
        "A DI (Direct Injection) box converts high-impedance unbalanced instrument signals to low-impedance balanced signals suitable for mixer microphone inputs. This allows long cable runs without signal degradation and provides electrical isolation to eliminate ground loops. Active DI boxes require power; passive DI boxes use transformers.",
    },
    {
      question: "What does latency mean in digital audio?",
      answer:
        "Latency is the time delay between an audio signal entering a system and exiting it. In digital audio, latency is caused by analog-to-digital conversion, processing, and digital-to-analog conversion. Low latency (under 10ms) is critical for live monitoring and recording, while higher latency is acceptable for mixing and post-production.",
    },
  ],

  microphoneTechniques: [
    {
      question: "What is the 3-to-1 rule for microphone placement?",
      answer:
        "The 3-to-1 rule states that when using multiple microphones, the distance between microphones should be at least three times the distance from each microphone to its sound source. This minimizes phase cancellation and comb filtering effects that occur when the same sound reaches multiple microphones at different times.",
    },
    {
      question: "What is the difference between cardioid and omnidirectional microphones?",
      answer:
        "Cardioid microphones pick up sound primarily from the front (heart-shaped pattern), rejecting sound from the rear. This is ideal for isolating sound sources on stage. Omnidirectional microphones pick up sound equally from all directions, capturing more room ambience and useful for natural sound reproduction in controlled acoustic environments.",
    },
    {
      question: "What is proximity effect?",
      answer:
        "Proximity effect is the increase in bass response that occurs when a directional microphone is placed very close to a sound source (typically within 6 inches). This happens because pressure-gradient microphones respond more to low frequencies at close distances. It can add warmth but may require EQ correction if excessive.",
    },
    {
      question: "What is the Haas effect in audio?",
      answer:
        "The Haas effect (precedence effect) describes how humans perceive the direction of sound based on the first arrival. If the same sound arrives from two sources within 25-35 milliseconds, we perceive it as coming from the earlier source, even if the delayed sound is louder. This is used in delay-based speaker systems and stereo imaging.",
    },
    {
      question: "What microphone pattern is best for vocals?",
      answer:
        "Cardioid is the most common pattern for live vocals because it provides good isolation and feedback rejection by rejecting sound from behind the microphone. Supercardioid offers even more side rejection but picks up some sound from the rear. In controlled studio environments, omnidirectional or figure-8 patterns can capture more natural vocal tone.",
    },
  ],
};
