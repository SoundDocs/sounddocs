import React from "react";
    import Header from "../../components/Header";
    import Footer from "../../components/Footer";
    import { Link as RouterLink } from "react-router-dom";
    import { ChevronLeft, BookOpen, Mic, Video, Lightbulb, Users } from "lucide-react";

    interface GlossaryTerm {
      term: string;
      definition: string;
    }

    interface GlossaryCategory {
      name: string;
      icon: React.ReactNode;
      terms: GlossaryTerm[];
    }

    const glossaryData: GlossaryCategory[] = [
      {
        name: "Audio",
        icon: <Mic className="h-6 w-6 mr-3 text-green-400" />,
        terms: [
          { term: "Acoustics", definition: "The properties or qualities of a room or building that determine how sound is transmitted in it." },
          { term: "AES/EBU", definition: "A standard for the serial transmission of digital audio signals between professional audio devices." },
          { term: "Amplifier", definition: "An electronic device that increases the power of a signal." },
          { term: "Balanced Audio", definition: "A method of interconnecting audio equipment using impedance-balanced lines. Allows for long cable runs and reduces susceptibility to external noise." },
          { term: "Cardioid", definition: "A heart-shaped pickup pattern for microphones, most sensitive to sound in front and least sensitive to sound from the rear." },
          { term: "Condenser Microphone", definition: "A microphone that uses a capacitor to convert acoustical energy into electrical energy. Requires phantom power." },
          { term: "Crossover", definition: "An electronic circuit that splits an audio signal into different frequency bands, routing them to specific drivers (e.g., woofers, tweeters) in a loudspeaker system." },
          { term: "DAW (Digital Audio Workstation)", definition: "An electronic device or application software used for recording, editing and producing audio files." },
          { term: "Decibel (dB)", definition: "A logarithmic unit used to express the ratio of two values of a physical quantity, often power or intensity. Used for sound level, signal level, etc." },
          { term: "DI Box (Direct Input Box)", definition: "A device that converts an unbalanced, high-impedance signal (e.g., from an electric guitar) to a balanced, low-impedance signal suitable for a mixer." },
          { term: "DSP (Digital Signal Processing)", definition: "The manipulation of audio signals using digital techniques, often for effects, equalization, or dynamics processing." },
          { term: "Dynamic Microphone", definition: "A microphone that uses electromagnetic induction to convert sound into an electrical signal. Generally more rugged than condenser mics and doesn't require phantom power." },
          { term: "Equalizer (EQ)", definition: "A device or circuit that allows the adjustment of the amplitude of specific frequencies in an audio signal." },
          { term: "Feedback", definition: "A howling or ringing sound caused when a microphone picks up sound from its own loudspeaker, creating a loop." },
          { term: "FOH (Front of House)", definition: "The area where the main mixing console and sound engineer are located, typically in the audience area for a live performance." },
          { term: "Frequency", definition: "The number of cycles per second of a sound wave, measured in Hertz (Hz). Determines the pitch of a sound." },
          { term: "Gain", definition: "The amount of amplification applied to an audio signal." },
          { term: "Impedance", definition: "The effective resistance of an electric circuit or component to alternating current, arising from the combined effects of ohmic resistance and reactance. Measured in Ohms (Ω)." },
          { term: "Latency", definition: "The delay between when an audio signal enters a system and when it emerges." },
          { term: "Line Level", definition: "A standard signal strength used for interconnecting audio equipment, typically stronger than mic level." },
          { term: "Mic Level", definition: "The low-level signal produced by a microphone, requiring preamplification to reach line level." },
          { term: "MIDI (Musical Instrument Digital Interface)", definition: "A technical standard that describes a protocol, digital interface and connectors and allows a wide variety of electronic musical instruments, computers and other related devices to connect and communicate with one another." },
          { term: "Monitor Wedge", definition: "A loudspeaker, often wedge-shaped, placed on stage facing performers so they can hear themselves and other parts of the performance." },
          { term: "Omnidirectional", definition: "A microphone pickup pattern that is equally sensitive to sound from all directions." },
          { term: "Phantom Power", definition: "A DC voltage (typically +48V) supplied through a microphone cable to power condenser microphones and active DI boxes." },
          { term: "Phase", definition: "The timing relationship between two or more sound waves. Phase differences can cause constructive or destructive interference (cancellation)." },
          { term: "Reverb (Reverberation)", definition: "The persistence of sound after a sound is produced, created by multiple reflections from surfaces in an enclosed space." },
          { term: "Sample Rate", definition: "The number of samples of audio carried per second, measured in Hz or kHz. Common rates include 44.1 kHz (CDs) and 48 kHz (digital video)." },
          { term: "Snake", definition: "A multicore cable that combines multiple audio lines into a single bundle, used to connect stage equipment to a mixing console." },
          { term: "SPL (Sound Pressure Level)", definition: "A measure of the intensity of sound, typically expressed in decibels (dB SPL)." },
          { term: "Subwoofer", definition: "A loudspeaker designed to reproduce low-frequency audio signals (bass)." },
          { term: "XLR Connector", definition: "A type of electrical connector, primarily found on professional audio, video, and stage lighting equipment. Commonly used for balanced microphone and line-level signals." },
        ].sort((a, b) => a.term.localeCompare(b.term))
      },
      {
        name: "Video",
        icon: <Video className="h-6 w-6 mr-3 text-red-400" />,
        terms: [
          { term: "Aspect Ratio", definition: "The ratio of the width to the height of an image or screen (e.g., 16:9, 4:3)." },
          { term: "Bitrate", definition: "The number of bits processed per unit of time, often used to describe the quality of video or audio encoding." },
          { term: "Codec (Coder-Decoder)", definition: "A device or program that compresses or decompresses digital data, such as video or audio." },
          { term: "Color Temperature", definition: "A characteristic of visible light, measured in Kelvins (K). Lower values are warmer (more red/yellow), higher values are cooler (more blue)." },
          { term: "Composite Video", definition: "An analog video signal format that carries standard definition video (typically at 525 or 625 lines) as a single channel. Often uses an RCA connector." },
          { term: "DVI (Digital Visual Interface)", definition: "A video display interface used to connect a video source, such as a video display controller, to a display device, such as a computer monitor." },
          { term: "Frame Rate (fps)", definition: "The frequency (rate) at which consecutive images (frames) are displayed in an animated display. Measured in frames per second." },
          { term: "Genlock", definition: "A technique where the video output of one source, or a specific reference signal, is used to synchronize other television picture sources together." },
          { term: "HDCP (High-bandwidth Digital Content Protection)", definition: "A form of digital copy protection developed by Intel Corporation to prevent copying of digital audio and video content as it travels across connections." },
          { term: "HDMI (High-Definition Multimedia Interface)", definition: "A proprietary audio/video interface for transmitting uncompressed video data and compressed or uncompressed digital audio data from an HDMI-compliant source device to a compatible display." },
          { term: "Interlaced Scan", definition: "A technique for doubling the perceived frame rate of a video display without consuming extra bandwidth. The image is split into alternating lines (fields) displayed sequentially." },
          { term: "Keystone Correction", definition: "A function that allows multimedia projectors that are not placed perpendicular to the horizontal centerline of the screen to skew the output image, thereby making it rectangular." },
          { term: "LED Wall", definition: "A large display screen made up of many individual LED panels, used for video playback in large venues." },
          { term: "Luminance", definition: "The intensity of light emitted from a surface per unit area in a given direction. Often referred to as 'brightness'." },
          { term: "NTSC", definition: "The analog television system that was used in North America and most of South America from 1954 until digital conversion. (525 lines, ~30 fps)." },
          { term: "PAL", definition: "The analog television system used in large parts of the world, including most of Europe, Asia, Africa, and Australia. (625 lines, 25 fps)." },
          { term: "Pixel (Picture Element)", definition: "The smallest controllable element of a picture represented on a screen." },
          { term: "Progressive Scan", definition: "A way of displaying, storing, or transmitting moving images in which all the lines of each frame are drawn in sequence." },
          { term: "Projector", definition: "An optical device that projects an image (or moving images) onto a surface, commonly a projection screen." },
          { term: "Resolution", definition: "The number of distinct pixels in each dimension that can be displayed. (e.g., 1920x1080 for Full HD, 3840x2160 for 4K UHD)." },
          { term: "Scaler", definition: "A device that converts video signals from one resolution or format to another." },
          { term: "SDI (Serial Digital Interface)", definition: "A family of digital video interfaces standardized by SMPTE. Commonly used in professional video production for transmitting uncompressed, unencrypted digital video signals." },
          { term: "Switcher (Video Switcher)", definition: "A device used to select between several different video sources and, in some cases, composite video sources together and add special effects." },
        ].sort((a, b) => a.term.localeCompare(b.term))
      },
      {
        name: "Lighting",
        icon: <Lightbulb className="h-6 w-6 mr-3 text-yellow-400" />,
        terms: [
          { term: "Barn Doors", definition: "Adjustable metal flaps attached to the front of a lighting fixture to shape the beam of light." },
          { term: "Beam Angle", definition: "The angle at which the light intensity drops to 50% of its maximum value at the center of the beam." },
          { term: "Color Rendering Index (CRI)", definition: "A quantitative measure of the ability of a light source to reveal the colors of various objects faithfully in comparison with an ideal or natural light source." },
          { term: "Console (Lighting Console)", definition: "A device used to control lighting fixtures, allowing for programming and playback of lighting cues." },
          { term: "Conventional Light", definition: "A lighting fixture that requires an external dimmer and typically has fixed parameters (e.g., focus, color) that are manually adjusted." },
          { term: "Cyc Light (Cyclorama Light)", definition: "A lighting instrument used to illuminate a cyclorama or backdrop, typically providing a wide, even wash of light." },
          { term: "Dimmer", definition: "A device used to vary the brightness of a light. In theatrical lighting, dimmers are typically controlled remotely by a lighting console." },
          { term: "DMX512 (DMX)", definition: "A standard for digital communication networks that are commonly used to control stage lighting and effects." },
          { term: "Ellipsoidal (Leko)", definition: "A type of spotlight with a sharp-edged, focused beam, often used for gobo projection and precise illumination." },
          { term: "Focus", definition: "The process of aiming and adjusting lighting fixtures to achieve the desired lighting effect on stage." },
          { term: "Followspot", definition: "A powerful lighting instrument manually operated by a technician to follow a performer on stage." },
          { term: "Fresnel", definition: "A type of spotlight with a soft-edged beam, often used for general wash lighting." },
          { term: "Gobo", definition: "A physical template slotted inside, or placed in front of, a lighting source, used to control the shape of emitted light." },
          { term: "Haze Machine", definition: "A device that creates a fine, atmospheric haze to make light beams visible." },
          { term: "Intelligent Lighting (Moving Lights)", definition: "Lighting fixtures that have automated or mechanical abilities beyond those of traditional, stationary illumination. Parameters like pan, tilt, color, gobo, and focus can be controlled remotely." },
          { term: "Lamp", definition: "The light-producing component of a lighting fixture (e.g., bulb)." },
          { term: "LED (Light Emitting Diode)", definition: "A semiconductor light source used in many modern lighting fixtures, known for energy efficiency and color-changing capabilities." },
          { term: "Lux", definition: "The SI unit of illuminance, equal to one lumen per square metre." },
          { term: "PAR Can", definition: "A type of lighting fixture that uses a PAR (Parabolic Aluminized Reflector) lamp, producing a relatively intense, somewhat oval-shaped beam." },
          { term: "Patch (Lighting Patch)", definition: "The process of assigning DMX addresses or control channels to lighting fixtures." },
          { term: "Rigging", definition: "The process of suspending lighting fixtures, truss, and other equipment above the stage or performance area." },
          { term: "Truss", definition: "A metal framework structure used to hang lighting fixtures, speakers, and other stage equipment." },
          { term: "Wash Light", definition: "A lighting fixture that produces a soft, wide beam of light to illuminate a large area evenly." },
        ].sort((a, b) => a.term.localeCompare(b.term))
      },
      {
        name: "General Production",
        icon: <Users className="h-6 w-6 mr-3 text-purple-400" />,
        terms: [
          { term: "Backline", definition: "Audio amplification equipment, instruments, and speaker cabinets used by musicians on stage (e.g., guitar amps, drum kits)." },
          { term: "Call Time", definition: "The time at which cast and crew are required to arrive at the venue or location." },
          { term: "Downstage", definition: "The area of the stage closest to the audience." },
          { term: "Gig", definition: "A live musical performance or other entertainment engagement." },
          { term: "Green Room", definition: "A lounge or waiting room for performers before, during, and after a performance." },
          { term: "Input List", definition: "A document detailing all audio inputs for a performance, including microphone types, DI boxes, and channel assignments." },
          { term: "Load-in / Load-out", definition: "The process of bringing equipment into a venue and setting it up (load-in), and taking it down and removing it (load-out)." },
          { term: "Production Manager", definition: "The person responsible for overseeing all technical and logistical aspects of a production." },
          { term: "Rider (Technical Rider)", definition: "A document that specifies an artist's technical requirements for a performance, including audio, lighting, video, and staging needs." },
          { term: "Run of Show (ROS)", definition: "A detailed schedule of events, cues, and timings for a performance or event." },
          { term: "Stage Manager", definition: "The person responsible for the overall organization and smooth running of a theatrical production or live event during performances." },
          { term: "Stage Plot", definition: "A diagram showing the placement of equipment, performers, and other items on stage." },
          { term: "Strike", definition: "The process of disassembling and removing all equipment and set pieces from the stage after a production." },
          { term: "Technical Director (TD)", definition: "The person responsible for the technical operations of a theatre or production, including lighting, sound, set construction, and video." },
          { term: "Upstage", definition: "The area of the stage furthest from the audience." },
          { term: "Venue", definition: "The place where an event or performance takes place." },
        ].sort((a, b) => a.term.localeCompare(b.term))
      }
    ];
    

    const GlossariesPage: React.FC = () => {
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
            <h1 className="text-4xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Industry Glossaries
            </h1>
            <p className="text-lg text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              A collection of common terms and acronyms used in the audio, video, lighting, and general event production fields.
            </p>

            {glossaryData.map((category) => (
              <section key={category.name} className="mb-16">
                <h2 className="text-3xl font-semibold text-gray-200 mb-8 flex items-center border-b-2 border-gray-700 pb-3">
                  {category.icon} {category.name} Glossary
                </h2>
                <dl className="space-y-6">
                  {category.terms.map((item) => (
                    <div key={item.term} className="bg-gray-800 p-4 rounded-lg shadow-md">
                      <dt className="text-xl font-semibold text-purple-300 mb-1">{item.term}</dt>
                      <dd className="text-gray-300 leading-relaxed">{item.definition}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
            
            <div className="mt-12 text-center text-gray-400 p-6 bg-gray-800 rounded-lg shadow-xl">
              <p className="mb-2">
                This glossary provides a starting point for understanding common industry terminology.
                The fields of live production and AV technology are constantly evolving, so new terms and technologies emerge regularly.
              </p>
              <p className="font-semibold text-yellow-300">
                For comprehensive definitions or specific technical details, always consult authoritative sources and manufacturer documentation.
              </p>
            </div>

          </main>
          <Footer />
        </div>
      );
    };

    export default GlossariesPage;
