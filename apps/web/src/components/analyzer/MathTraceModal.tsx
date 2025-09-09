import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MathTraceEditor from "./MathTraceEditor";

// This would typically be imported from a types file
interface Measurement {
  id: string;
  name: string;
}

interface MathTrace {
  id?: string;
  name: string;
  operation: "average" | "sum" | "subtract";
  source_measurement_ids: string[];
}

interface MathTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMeasurements: Measurement[];
  mathTraces: MathTrace[];
  onSave: (trace: MathTrace) => void;
  onDelete: (id: string) => void;
}

const MathTraceModal: React.FC<MathTraceModalProps> = ({
  isOpen,
  onClose,
  allMeasurements,
  mathTraces,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<MathTrace | null>(null);

  const handleSave = (trace: MathTrace) => {
    onSave(trace);
    setIsEditing(false);
    setSelectedTrace(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedTrace(null);
  };

  const handleEdit = (trace: MathTrace) => {
    setSelectedTrace(trace);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setSelectedTrace(null);
    setIsEditing(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Manage Math Traces</DialogTitle>
        </DialogHeader>
        {isEditing ? (
          <MathTraceEditor
            trace={selectedTrace}
            allMeasurements={allMeasurements}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddNew}>Add New Math Trace</Button>
            </div>
            <div className="space-y-2">
              {mathTraces.map((trace) => (
                <div
                  key={trace.id}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                >
                  <span>{trace.name}</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(trace)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => trace.id && onDelete(trace.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MathTraceModal;
