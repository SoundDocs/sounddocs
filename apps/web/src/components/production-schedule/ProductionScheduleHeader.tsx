import React from "react";

interface ProductionScheduleHeaderProps {
  scheduleData: {
    show_name: string;
    job_number: string;
    facility_name: string;
    project_manager: string;
    production_manager: string;
    account_manager: string;
    set_datetime: string;
    strike_datetime: string;
  };
  updateField: (field: string, value: string) => void;
}

const ProductionScheduleHeader: React.FC<ProductionScheduleHeaderProps> = ({
  scheduleData,
  updateField,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(e.target.name, e.target.value);
  };

  // Helper to convert ISO string to yyyy-MM-ddTHH:mm format for datetime-local input
  const formatDateTimeForInput = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) return "";
      // Format to 'YYYY-MM-DDTHH:MM'
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.warn("Error formatting date for input:", isoString, error);
      return ""; // Return empty if there's an error (e.g. invalid date string)
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="border-b border-gray-700 pb-2 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white">Schedule Header</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Key information for the production schedule
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="show_name">
            Show Name
          </label>
          <input
            id="show_name"
            name="show_name"
            type="text"
            value={scheduleData.show_name || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Annual Gala Dinner"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="job_number">
            Job #
          </label>
          <input
            id="job_number"
            name="job_number"
            type="text"
            value={scheduleData.job_number || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., EVT-2024-001"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="facility_name">
          Facility Name
        </label>
        <input
          id="facility_name"
          name="facility_name"
          type="text"
          value={scheduleData.facility_name || ""}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., Grand Ballroom, Convention Center"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="project_manager">
            Project Manager
          </label>
          <input
            id="project_manager"
            name="project_manager"
            type="text"
            value={scheduleData.project_manager || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Name"
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
            value={scheduleData.production_manager || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="account_manager">
            Account Manager
          </label>
          <input
            id="account_manager"
            name="account_manager"
            type="text"
            value={scheduleData.account_manager || ""}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="set_datetime">
            Set Date and Time
          </label>
          <input
            id="set_datetime"
            name="set_datetime"
            type="datetime-local"
            value={formatDateTimeForInput(scheduleData.set_datetime)}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-2" htmlFor="strike_datetime">
            Strike Date and Time
          </label>
          <input
            id="strike_datetime"
            name="strike_datetime"
            type="datetime-local"
            value={formatDateTimeForInput(scheduleData.strike_datetime)}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductionScheduleHeader;
