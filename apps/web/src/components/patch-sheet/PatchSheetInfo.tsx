import React from "react";

interface PatchSheetInfoProps {
  info: {
    // Event Details
    event_name?: string;
    venue?: string;
    room?: string;
    address?: string;
    date?: string;
    time?: string;
    load_in?: string;
    sound_check?: string;
    doors_open?: string;
    event_start?: string;
    event_end?: string;

    // Client/Artist Info
    client?: string;
    artist?: string;
    genre?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;

    // Technical Staff
    foh_engineer?: string;
    monitor_engineer?: string;
    av_company?: string;
    production_manager?: string;

    // Equipment Info
    pa_system?: string;
    console_foh?: string;
    console_monitors?: string;
    monitor_type?: string;

    // Additional Details
    event_type?: string;
    estimated_attendance?: string;
    hospitality_notes?: string;
    notes?: string;
  };
  updateInfo: (info: any) => void;
}

const PatchSheetInfo: React.FC<PatchSheetInfoProps> = ({ info, updateInfo }) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    updateInfo({
      ...info,
      [name]: value,
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header with section title */}
      <div className="border-b border-gray-700 pb-2 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white">Event Details</h2>
        <p className="text-gray-400 text-xs md:text-sm">Basic information about the event</p>
      </div>

      {/* Event Name */}
      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="event_name">
          Event Name
        </label>
        <input
          id="event_name"
          name="event_name"
          type="text"
          value={info.event_name || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Annual Company Conference / Summer Tour 2025"
        />
      </div>

      {/* Event Type Selector */}
      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="event_type">
          Event Type
        </label>
        <select
          id="event_type"
          name="event_type"
          value={info.event_type || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Select Event Type</option>
          <option value="concert">Concert</option>
          <option value="corporate">Corporate</option>
          <option value="conference">Conference</option>
          <option value="festival">Festival</option>
          <option value="theater">Theater</option>
          <option value="worship">Worship</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Venue Information - 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="venue">
            Venue
          </label>
          <input
            id="venue"
            name="venue"
            type="text"
            value={info.venue || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., The Fillmore / Convention Center"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="room">
            Room/Space
          </label>
          <input
            id="room"
            name="room"
            type="text"
            value={info.room || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Main Hall / Ballroom B"
          />
        </div>
      </div>

      {/* Venue Address */}
      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="address">
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          value={info.address || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Venue street address"
        />
      </div>

      {/* Dates and Times - Grid layout, responsive */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="date">
            Event Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={info.date || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="load_in">
            Load In
          </label>
          <input
            id="load_in"
            name="load_in"
            type="time"
            value={info.load_in || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="sound_check">
            Sound Check
          </label>
          <input
            id="sound_check"
            name="sound_check"
            type="time"
            value={info.sound_check || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="doors_open">
            Doors Open
          </label>
          <input
            id="doors_open"
            name="doors_open"
            type="time"
            value={info.doors_open || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="event_start">
            Event Start
          </label>
          <input
            id="event_start"
            name="event_start"
            type="time"
            value={info.event_start || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="event_end">
            Event End
          </label>
          <input
            id="event_end"
            name="event_end"
            type="time"
            value={info.event_end || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="estimated_attendance">
          Estimated Attendance
        </label>
        <input
          id="estimated_attendance"
          name="estimated_attendance"
          type="text"
          value={info.estimated_attendance || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., 500"
        />
      </div>

      {/* Client/Artist Information Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Client/Artist Information</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Details about the client, artist, or performer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="client">
            Client
          </label>
          <input
            id="client"
            name="client"
            type="text"
            value={info.client || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., ABC Corporation"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="artist">
            Artist/Performer
          </label>
          <input
            id="artist"
            name="artist"
            type="text"
            value={info.artist || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., The Soundwave Collective"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="genre">
          Genre/Style
        </label>
        <input
          id="genre"
          name="genre"
          type="text"
          value={info.genre || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Rock, Jazz, Corporate Presentation"
        />
      </div>

      {/* Contact Information - Grid layout, responsive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="contact_name">
            Primary Contact
          </label>
          <input
            id="contact_name"
            name="contact_name"
            type="text"
            value={info.contact_name || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Contact name"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="contact_email">
            Email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            value={info.contact_email || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="contact_phone">
            Phone
          </label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            value={info.contact_phone || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Technical Staff Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Technical Staff</h2>
        <p className="text-gray-400 text-xs md:text-sm">Audio and production team information</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="foh_engineer">
            FOH Engineer
          </label>
          <input
            id="foh_engineer"
            name="foh_engineer"
            type="text"
            value={info.foh_engineer || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Name and contact"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="monitor_engineer">
            Monitor Engineer
          </label>
          <input
            id="monitor_engineer"
            name="monitor_engineer"
            type="text"
            value={info.monitor_engineer || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Name and contact"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="production_manager">
            Production Manager
          </label>
          <input
            id="production_manager"
            name="production_manager"
            type="text"
            value={info.production_manager || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Name and contact"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="av_company">
          AV Company/Vendor
        </label>
        <input
          id="av_company"
          name="av_company"
          type="text"
          value={info.av_company || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Pro Audio Services Inc."
        />
      </div>

      {/* Equipment Information Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Equipment Information</h2>
        <p className="text-gray-400 text-xs md:text-sm">Audio equipment details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="pa_system">
            PA System
          </label>
          <input
            id="pa_system"
            name="pa_system"
            type="text"
            value={info.pa_system || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., L-Acoustics K2, d&b audiotechnik"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="console_foh">
            FOH Console
          </label>
          <input
            id="console_foh"
            name="console_foh"
            type="text"
            value={info.console_foh || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Avid S6L, DiGiCo SD12"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="console_monitors">
            Monitor Console
          </label>
          <input
            id="console_monitors"
            name="console_monitors"
            type="text"
            value={info.console_monitors || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Allen & Heath SQ-7, Yamaha CL5"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="monitor_type">
            Monitor Type
          </label>
          <input
            id="monitor_type"
            name="monitor_type"
            type="text"
            value={info.monitor_type || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., 8 wedges, 6x IEM"
          />
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Additional Information</h2>
        <p className="text-gray-400 text-xs md:text-sm">Other important details</p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="hospitality_notes">
          Hospitality Notes
        </label>
        <textarea
          id="hospitality_notes"
          name="hospitality_notes"
          rows={3}
          value={info.hospitality_notes || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Catering requirements, green room details, etc."
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="notes">
          Additional Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={info.notes || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Additional information, requests, or special instructions..."
        />
      </div>
    </div>
  );
};

export default PatchSheetInfo;
