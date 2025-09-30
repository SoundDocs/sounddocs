import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RiderArtistInfo from "../components/rider/RiderArtistInfo";
import RiderInputList from "../components/rider/RiderInputList";
import RiderEquipment from "../components/rider/RiderEquipment";
import RiderTechnicalStaff from "../components/rider/RiderTechnicalStaff";
import { Loader, ArrowLeft, Save, AlertCircle, Users, ListChecks, Wrench, Zap } from "lucide-react";
import { BandMember, InputChannel, BacklineItem, StaffRequirement } from "../lib/types";

interface RiderData {
  id?: string;
  user_id?: string;
  name: string;
  created_at?: string;
  last_edited?: string;
  artist_name: string;
  band_members: BandMember[];
  genre: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage_plot_url?: string;
  input_list: InputChannel[];
  pa_requirements: string;
  monitor_requirements: string;
  console_requirements: string;
  backline_requirements: BacklineItem[];
  artist_provided_gear: BacklineItem[];
  required_staff: StaffRequirement[];
  special_requirements: string;
  power_requirements: string;
  lighting_notes: string;
  hospitality_notes: string;
  additional_notes: string;
}

const RiderEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rider, setRider] = useState<RiderData | null>(null);
  const [activeTab, setActiveTab] = useState("artist");
  const [user, setUser] = useState<unknown>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    };

    const fetchRiderData = async () => {
      setLoading(true);

      if (id === "new") {
        const newRider: RiderData = {
          name: "Untitled Technical Rider",
          artist_name: "",
          band_members: [],
          genre: "",
          contact_name: "",
          contact_email: "",
          contact_phone: "",
          input_list: [],
          pa_requirements: "",
          monitor_requirements: "",
          console_requirements: "",
          backline_requirements: [],
          artist_provided_gear: [],
          required_staff: [],
          special_requirements: "",
          power_requirements: "",
          lighting_notes: "",
          hospitality_notes: "",
          additional_notes: "",
        };
        setRider(newRider);
        setLoading(false);
        return;
      }

      if (!id) {
        navigate("/dashboard");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("technical_riders")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching technical rider from Supabase:", error);
          throw error;
        }
        if (!data) {
          console.error("Technical rider not found or access denied for id:", id);
          navigate("/dashboard");
          setLoading(false);
          return;
        }
        setRider(data as RiderData);
        setLoading(false);
      } catch (error) {
        console.error("Catch block for technical rider fetch error:", error);
        navigate("/dashboard");
        setLoading(false);
      }
    };

    fetchUser();
    fetchRiderData();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!rider || !user) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const riderData = {
        ...rider,
        last_edited: new Date().toISOString(),
      };

      if (id === "new") {
        const { data, error } = await supabase
          .from("technical_riders")
          .insert([{ ...riderData, user_id: (user as { id: string }).id }])
          .select();
        if (error) throw error;
        if (data && data[0]) {
          navigate(`/rider/${data[0].id}`, { state: { from: location.state?.from } });
        }
      } else {
        const { error } = await supabase.from("technical_riders").update(riderData).eq("id", id);
        if (error) throw error;
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving technical rider:", error);
      setSaveError("Failed to save technical rider. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Technical rider not found.</p>
      </div>
    );
  }

  const tabs = [
    { id: "artist", label: "Artist Info", icon: Users },
    { id: "inputs", label: "Input List", icon: ListChecks },
    { id: "equipment", label: "Equipment", icon: Wrench },
    { id: "staff", label: "Staff & Special", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-8">
          <button
            onClick={() => navigate(location.state?.from || "/production")}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={rider.name}
                onChange={(e) => setRider({ ...rider, name: e.target.value })}
                className="text-3xl md:text-4xl font-bold text-white bg-transparent border-b-2 border-gray-700 focus:border-indigo-500 focus:outline-none w-full"
                placeholder="Rider Name"
              />
              <p className="text-sm text-gray-400 mt-2">
                {id === "new"
                  ? `Creating new rider`
                  : `Created: ${new Date(rider.created_at || Date.now()).toLocaleString()}`}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 sm:ml-auto flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">Technical rider saved successfully!</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-indigo-400 border-b-2 border-indigo-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-md mb-8">
          {activeTab === "artist" && (
            <RiderArtistInfo
              artistName={rider.artist_name}
              genre={rider.genre}
              contactName={rider.contact_name}
              contactEmail={rider.contact_email}
              contactPhone={rider.contact_phone}
              bandMembers={rider.band_members}
              onUpdateArtistName={(value) => setRider({ ...rider, artist_name: value })}
              onUpdateGenre={(value) => setRider({ ...rider, genre: value })}
              onUpdateContactName={(value) => setRider({ ...rider, contact_name: value })}
              onUpdateContactEmail={(value) => setRider({ ...rider, contact_email: value })}
              onUpdateContactPhone={(value) => setRider({ ...rider, contact_phone: value })}
              onUpdateBandMembers={(members) => setRider({ ...rider, band_members: members })}
            />
          )}

          {activeTab === "inputs" && (
            <RiderInputList
              inputList={rider.input_list}
              onUpdateInputList={(inputs) => setRider({ ...rider, input_list: inputs })}
            />
          )}

          {activeTab === "equipment" && (
            <RiderEquipment
              paRequirements={rider.pa_requirements}
              monitorRequirements={rider.monitor_requirements}
              consoleRequirements={rider.console_requirements}
              backlineRequirements={rider.backline_requirements}
              artistProvidedGear={rider.artist_provided_gear}
              onUpdatePaRequirements={(value) => setRider({ ...rider, pa_requirements: value })}
              onUpdateMonitorRequirements={(value) =>
                setRider({ ...rider, monitor_requirements: value })
              }
              onUpdateConsoleRequirements={(value) =>
                setRider({ ...rider, console_requirements: value })
              }
              onUpdateBacklineRequirements={(items) =>
                setRider({ ...rider, backline_requirements: items })
              }
              onUpdateArtistProvidedGear={(items) =>
                setRider({ ...rider, artist_provided_gear: items })
              }
            />
          )}

          {activeTab === "staff" && (
            <RiderTechnicalStaff
              requiredStaff={rider.required_staff}
              specialRequirements={rider.special_requirements}
              powerRequirements={rider.power_requirements}
              lightingNotes={rider.lighting_notes}
              hospitalityNotes={rider.hospitality_notes}
              additionalNotes={rider.additional_notes}
              onUpdateRequiredStaff={(staff) => setRider({ ...rider, required_staff: staff })}
              onUpdateSpecialRequirements={(value) =>
                setRider({ ...rider, special_requirements: value })
              }
              onUpdatePowerRequirements={(value) =>
                setRider({ ...rider, power_requirements: value })
              }
              onUpdateLightingNotes={(value) => setRider({ ...rider, lighting_notes: value })}
              onUpdateHospitalityNotes={(value) => setRider({ ...rider, hospitality_notes: value })}
              onUpdateAdditionalNotes={(value) => setRider({ ...rider, additional_notes: value })}
            />
          )}
        </div>

        <div className="flex justify-center py-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
          >
            {saving ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Saving Rider...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Technical Rider
              </>
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RiderEditor;
