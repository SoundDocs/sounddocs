import React from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { StaffRequirement } from "../../lib/types";

interface RiderTechnicalStaffProps {
  requiredStaff: StaffRequirement[];
  specialRequirements: string;
  powerRequirements: string;
  lightingNotes: string;
  hospitalityNotes: string;
  additionalNotes: string;
  onUpdateRequiredStaff: (staff: StaffRequirement[]) => void;
  onUpdateSpecialRequirements: (value: string) => void;
  onUpdatePowerRequirements: (value: string) => void;
  onUpdateLightingNotes: (value: string) => void;
  onUpdateHospitalityNotes: (value: string) => void;
  onUpdateAdditionalNotes: (value: string) => void;
}

const RiderTechnicalStaff: React.FC<RiderTechnicalStaffProps> = ({
  requiredStaff,
  specialRequirements,
  powerRequirements,
  lightingNotes,
  hospitalityNotes,
  additionalNotes,
  onUpdateRequiredStaff,
  onUpdateSpecialRequirements,
  onUpdatePowerRequirements,
  onUpdateLightingNotes,
  onUpdateHospitalityNotes,
  onUpdateAdditionalNotes,
}) => {
  const handleAddStaff = () => {
    const newStaff: StaffRequirement = {
      id: uuidv4(),
      role: "",
      quantity: "",
      notes: "",
    };
    onUpdateRequiredStaff([...requiredStaff, newStaff]);
  };

  const handleDeleteStaff = (id: string) => {
    onUpdateRequiredStaff(requiredStaff.filter((staff) => staff.id !== id));
  };

  const handleUpdateStaff = (id: string, field: keyof StaffRequirement, value: string) => {
    onUpdateRequiredStaff(
      requiredStaff.map((staff) => (staff.id === id ? { ...staff, [field]: value } : staff)),
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Technical Staff Section */}
      <div className="border-b border-gray-700 pb-2 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white">Required Technical Staff</h2>
        <p className="text-gray-400 text-xs md:text-sm">Venue staff needed for the performance</p>
      </div>

      <div className="space-y-4">
        {requiredStaff.map((staff, index) => (
          <div
            key={staff.id}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Position #{index + 1}</h3>
              <button
                onClick={() => handleDeleteStaff(staff.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove Position"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm mb-2" htmlFor={`role_${staff.id}`}>
                  Role
                </label>
                <input
                  id={`role_${staff.id}`}
                  type="text"
                  value={staff.role}
                  onChange={(e) => handleUpdateStaff(staff.id, "role", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., FOH Engineer, Lighting Operator"
                />
              </div>

              <div>
                <label
                  className="block text-gray-300 text-sm mb-2"
                  htmlFor={`quantity_${staff.id}`}
                >
                  Quantity
                </label>
                <input
                  id={`quantity_${staff.id}`}
                  type="text"
                  value={staff.quantity}
                  onChange={(e) => handleUpdateStaff(staff.id, "quantity", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., 1, 2"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2" htmlFor={`notes_${staff.id}`}>
                Requirements/Notes
              </label>
              <input
                id={`notes_${staff.id}`}
                type="text"
                value={staff.notes}
                onChange={(e) => handleUpdateStaff(staff.id, "notes", e.target.value)}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Must be familiar with DiGiCo consoles"
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleAddStaff}
          className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Staff Position
        </button>
      </div>

      {/* Special Requirements Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Special Requirements</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Additional technical and logistical requirements
        </p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="special_requirements">
          Stage & Production Requirements
        </label>
        <textarea
          id="special_requirements"
          name="special_requirements"
          rows={4}
          value={specialRequirements}
          onChange={(e) => onUpdateSpecialRequirements(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Drum riser (8x8ft minimum), adequate stage lighting, climate control..."
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="power_requirements">
          Power Requirements
        </label>
        <textarea
          id="power_requirements"
          name="power_requirements"
          rows={3}
          value={powerRequirements}
          onChange={(e) => onUpdatePowerRequirements(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., 4x 120V 20A circuits on stage, isolated from house power..."
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="lighting_notes">
          Lighting Requirements
        </label>
        <textarea
          id="lighting_notes"
          name="lighting_notes"
          rows={3}
          value={lightingNotes}
          onChange={(e) => onUpdateLightingNotes(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Full wash lighting, moving lights preferred, DMX control..."
        />
      </div>

      {/* Hospitality Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Hospitality</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Dressing room, catering, and hospitality requirements
        </p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="hospitality_notes">
          Hospitality Requirements
        </label>
        <textarea
          id="hospitality_notes"
          name="hospitality_notes"
          rows={4}
          value={hospitalityNotes}
          onChange={(e) => onUpdateHospitalityNotes(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Private dressing room with shower, hot meal for 6 people, bottled water, dietary restrictions..."
        />
      </div>

      {/* Additional Notes Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Additional Notes</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Any other important information or special requests
        </p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="additional_notes">
          Additional Information
        </label>
        <textarea
          id="additional_notes"
          name="additional_notes"
          rows={4}
          value={additionalNotes}
          onChange={(e) => onUpdateAdditionalNotes(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Any other requests, notes, or important information for the venue..."
        />
      </div>
    </div>
  );
};

export default RiderTechnicalStaff;
