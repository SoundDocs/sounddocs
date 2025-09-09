import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface MathTraceEditorProps {
  trace?: MathTrace | null;
  allMeasurements: Measurement[];
  onSave: (trace: MathTrace) => void;
  onCancel: () => void;
}

const MathTraceEditor: React.FC<MathTraceEditorProps> = ({
  trace,
  allMeasurements,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [operation, setOperation] = useState<"average" | "sum" | "subtract">("average");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (trace) {
      setName(trace.name);
      setOperation(trace.operation);
      setSelectedIds(new Set(trace.source_measurement_ids));
    } else {
      // Reset form for new trace
      setName("");
      setOperation("average");
      setSelectedIds(new Set());
    }
  }, [trace]);

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (!name) {
      alert("Please enter a name for the trace.");
      return;
    }
    if (selectedIds.size === 0) {
      alert("Please select at least one source measurement.");
      return;
    }
    if (operation === "subtract" && selectedIds.size !== 2) {
      alert("Subtraction operation requires exactly two measurements.");
      return;
    }

    onSave({
      id: trace?.id,
      name,
      operation,
      source_measurement_ids: Array.from(selectedIds),
    });
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">
        {trace ? "Edit Math Trace" : "Create Math Trace"}
      </h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="trace-name" className="text-gray-300">
            Trace Name
          </Label>
          <Input
            id="trace-name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="e.g., Mains + Subs"
          />
        </div>

        <div>
          <Label className="text-gray-300">Operation</Label>
          <RadioGroup
            value={operation}
            onValueChange={(v: string) => setOperation(v as "average" | "sum" | "subtract")}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="average" id="op-average" />
              <Label htmlFor="op-average" className="text-white">
                Average
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sum" id="op-sum" />
              <Label htmlFor="op-sum" className="text-white">
                Sum
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="subtract" id="op-subtract" />
              <Label htmlFor="op-subtract" className="text-white">
                Subtract
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-gray-300">Source Measurements</Label>
          <ScrollArea className="h-48 mt-2 p-2 border border-gray-600 rounded-md">
            <div className="space-y-2">
              {allMeasurements.map((m) => (
                <div key={m.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`meas-${m.id}`}
                    checked={selectedIds.has(m.id)}
                    onCheckedChange={() => handleToggleSelection(m.id)}
                  />
                  <Label htmlFor={`meas-${m.id}`} className="text-white font-normal">
                    {m.name}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Trace</Button>
      </div>
    </div>
  );
};

export default MathTraceEditor;
