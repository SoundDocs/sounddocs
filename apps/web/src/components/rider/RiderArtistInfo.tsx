import React from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { BandMember } from "../../lib/types";

interface RiderArtistInfoProps {
  artistName: string;
  genre: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  bandMembers: BandMember[];
  onUpdateArtistName: (value: string) => void;
  onUpdateGenre: (value: string) => void;
  onUpdateContactName: (value: string) => void;
  onUpdateContactEmail: (value: string) => void;
  onUpdateContactPhone: (value: string) => void;
  onUpdateBandMembers: (members: BandMember[]) => void;
}

const RiderArtistInfo: React.FC<RiderArtistInfoProps> = ({
  artistName,
  genre,
  contactName,
  contactEmail,
  contactPhone,
  bandMembers,
  onUpdateArtistName,
  onUpdateGenre,
  onUpdateContactName,
  onUpdateContactEmail,
  onUpdateContactPhone,
  onUpdateBandMembers,
}) => {
  const handleAddBandMember = () => {
    const newMember: BandMember = {
      id: uuidv4(),
      name: "",
      instrument: "",
      input_needs: "",
    };
    onUpdateBandMembers([...bandMembers, newMember]);
  };

  const handleDeleteBandMember = (id: string) => {
    onUpdateBandMembers(bandMembers.filter((member) => member.id !== id));
  };

  const handleUpdateBandMember = (id: string, field: keyof BandMember, value: string) => {
    onUpdateBandMembers(
      bandMembers.map((member) => (member.id === id ? { ...member, [field]: value } : member)),
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Artist Information Section */}
      <div className="border-b border-gray-700 pb-2 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white">Artist Information</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Basic information about the artist or band
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="artist_name">
            Artist/Band Name
          </label>
          <input
            id="artist_name"
            name="artist_name"
            type="text"
            value={artistName}
            onChange={(e) => onUpdateArtistName(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., The Soundwave Collective"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="genre">
            Genre/Style
          </label>
          <input
            id="genre"
            name="genre"
            type="text"
            value={genre}
            onChange={(e) => onUpdateGenre(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Rock, Jazz, Electronic"
          />
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Primary Contact</h2>
        <p className="text-gray-400 text-xs md:text-sm">Contact person for technical inquiries</p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="contact_name">
          Contact Name
        </label>
        <input
          id="contact_name"
          name="contact_name"
          type="text"
          value={contactName}
          onChange={(e) => onUpdateContactName(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Tour manager or technical contact"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="contact_email">
            Email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            value={contactEmail}
            onChange={(e) => onUpdateContactEmail(e.target.value)}
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
            value={contactPhone}
            onChange={(e) => onUpdateContactPhone(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Band Members Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Band Members</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          List each band member, their instrument, and input requirements
        </p>
      </div>

      <div className="space-y-4">
        {bandMembers.map((member, index) => (
          <div
            key={member.id}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Member #{index + 1}</h3>
              <button
                onClick={() => handleDeleteBandMember(member.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove Member"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2" htmlFor={`name_${member.id}`}>
                  Name
                </label>
                <input
                  id={`name_${member.id}`}
                  type="text"
                  value={member.name}
                  onChange={(e) => handleUpdateBandMember(member.id, "name", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., John Smith"
                />
              </div>

              <div>
                <label
                  className="block text-gray-300 text-sm mb-2"
                  htmlFor={`instrument_${member.id}`}
                >
                  Instrument
                </label>
                <input
                  id={`instrument_${member.id}`}
                  type="text"
                  value={member.instrument}
                  onChange={(e) => handleUpdateBandMember(member.id, "instrument", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Lead Vocals, Guitar"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-gray-300 text-sm mb-2"
                htmlFor={`input_needs_${member.id}`}
              >
                Input Requirements
              </label>
              <input
                id={`input_needs_${member.id}`}
                type="text"
                value={member.input_needs}
                onChange={(e) => handleUpdateBandMember(member.id, "input_needs", e.target.value)}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 2x XLR for vocals and guitar"
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleAddBandMember}
          className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Band Member
        </button>
      </div>
    </div>
  );
};

export default RiderArtistInfo;
