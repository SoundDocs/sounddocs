import React, { forwardRef } from "react";

interface PrintStagePlotExportProps {
  stagePlot: {
    name: string;
    created_at: string;
    last_edited?: string;
    stage_size: string;
    elements: any[]; // Use any[] for now
    backgroundImage?: string;
    backgroundOpacity?: number;
  };
}

// Default dimensions for elements if not specified
const getDefaultDimensions = (type: string) => {
  if (
    type === "electric-guitar" ||
    type === "acoustic-guitar" ||
    type === "bass-guitar" ||
    type === "keyboard" ||
    type === "drums" ||
    type === "percussion" ||
    type === "violin" ||
    type === "cello" ||
    type === "trumpet" ||
    type === "saxophone" ||
    type === "generic-instrument"
  ) {
    return { width: 64, height: 64 };
  }

  switch (type) {
    case "microphone":
      return { width: 32, height: 32 };
    case "power-strip":
      return { width: 64, height: 24 };
    case "monitor-wedge":
      return { width: 48, height: 32 };
    case "amplifier":
      return { width: 56, height: 40 };
    case "speaker":
      return { width: 40, height: 64 };
    case "di-box":
      return { width: 24, height: 24 };
    case "iem":
      return { width: 32, height: 32 };
    case "person":
      return { width: 40, height: 40 };
    case "text":
      return { width: 120, height: 40 };
    default:
      return { width: 40, height: 40 };
  }
};

const PrintStagePlotExport = forwardRef<HTMLDivElement, PrintStagePlotExportProps>(
  ({ stagePlot }, ref) => {
    // Format date for display
    const formatDate = (dateString: string) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Get stage dimensions
    const getStageDimensions = (stageSize: string) => {
      // Using fixed pixel values for consistency
      switch (stageSize) {
        case "x-small-narrow":
          return { width: 300, height: 300 };
        case "x-small-wide":
          return { width: 500, height: 300 };
        case "small-narrow":
          return { width: 400, height: 400 };
        case "small-wide":
          return { width: 600, height: 400 };
        case "medium-narrow":
          return { width: 500, height: 500 };
        case "medium-wide":
          return { width: 800, height: 500 };
        case "large-narrow":
          return { width: 600, height: 600 };
        case "large-wide":
          return { width: 1000, height: 600 };
        case "x-large-narrow":
          return { width: 700, height: 700 };
        case "x-large-wide":
          return { width: 1200, height: 700 };
        case "small": // Handle legacy sizes
          return { width: 600, height: 400 };
        case "medium": // Handle legacy sizes
          return { width: 800, height: 500 };
        case "large": // Handle legacy sizes
          return { width: 1000, height: 600 };
        default: // Default to medium-wide if size is unknown
          return { width: 800, height: 500 };
      }
    };

    // Function to render element
    const renderElement = (element: any) => {
      const defaultDims = getDefaultDimensions(element.type);
      const elementWidth = element.width || defaultDims.width;
      const elementHeight = element.height || defaultDims.height;

      // Calculate label width based on element size
      const getLabelWidth = () => {
        // Return proportional width based on element size
        return Math.max(60, elementWidth * 1.2); // 120% of width, min 60px
      };

      // Scale font size based on element dimensions
      const getFontSize = () => {
        if (element.type === "text") {
          // For text elements, scale font size based on height
          return Math.max(12, Math.min(18, elementHeight * 0.3)); // 30% of height, min 12px, max 18px
        } else {
          // For other elements, scale based on width
          return Math.max(10, Math.min(14, elementWidth * 0.2)); // 20% of width, min 10px, max 14px
        }
      };

      if (element.type === "text") {
        const fontSize = getFontSize();
        return (
          <div
            key={element.id}
            style={{
              position: "absolute",
              left: `${element.x}px`,
              top: `${element.y}px`,
              width: `${elementWidth}px`, // Use calculated width
              height: `${elementHeight}px`, // Use calculated height
              transform: `rotate(${element.rotation}deg)`,
              transformOrigin: "center center",
              zIndex: 15,
              backgroundColor: "rgba(245, 245, 245, 0.9)",
              border: "1px solid #999",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            <span
              style={{
                color: "#111",
                fontSize: `${fontSize}px`,
                fontWeight: 500,
                textAlign: "center", // Center text
                overflow: "hidden", // Hide overflow
              }}
            >
              {element.label}
            </span>
          </div>
        );
      }

      // Determine element style based on type
      let elementStyle: React.CSSProperties = {
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${elementWidth}px`, // Apply width to the main container
        height: `${elementHeight}px`, // Apply height to the main container
        zIndex: 10,
      };

      // Wrapper for rotation
      let wrapperStyle: React.CSSProperties = {
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: "center center",
        width: "100%", // Ensure wrapper takes full size
        height: "100%", // Ensure wrapper takes full size
        position: "relative", // Needed for absolute positioning of label
      };

      // Inner element style (the visual shape)
      let innerStyle: React.CSSProperties = {
        backgroundColor: "#777",
        border: "1px solid #666",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%", // Inner element takes full size of wrapper
        height: "100%", // Inner element takes full size of wrapper
      };

      // Symbol/icon style
      let symbolStyle: React.CSSProperties = {
        color: "#fff",
        fontSize: "14px", // Base size
        fontWeight: "bold",
      };

      // Scale icon/symbol size based on element dimensions
      const size = Math.min(elementWidth, elementHeight);
      symbolStyle.fontSize = `${Math.max(10, Math.min(16, size * 0.25))}px`; // Scale based on smaller dimension

      // Label style
      const labelWidth = getLabelWidth();
      const fontSize = getFontSize();

      let labelStyle: React.CSSProperties = {
        position: "absolute",
        top: "100%", // Position below the element
        left: "50%", // Center horizontally relative to the element
        transform: "translateX(-50%)", // Adjust centering
        marginTop: "8px", // Space between element and label
        backgroundColor: "white",
        border: "1px solid #aaa",
        padding: "3px 8px",
        borderRadius: "4px",
        fontSize: `${fontSize}px`,
        color: "#333",
        whiteSpace: "nowrap",
        textAlign: "center",
        minWidth: `${labelWidth}px`,
        maxWidth: `${labelWidth * 1.5}px`, // Limit max width
        zIndex: 20,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        overflow: "hidden", // Hide overflow
        textOverflow: "ellipsis", // Add ellipsis for overflow
      };

      // Customize shape based on element type
      switch (element.type) {
        // Instruments - larger squares
        case "electric-guitar":
        case "acoustic-guitar":
        case "bass-guitar":
        case "keyboard":
        case "drums":
        case "percussion":
        case "violin":
        case "cello":
        case "trumpet":
        case "saxophone":
        case "generic-instrument":
          innerStyle.borderRadius = "8px";
          break;

        // Circular elements
        case "microphone":
        case "iem":
        case "person":
          innerStyle.borderRadius = "50%";
          break;

        // Rectangular elements
        case "power-strip":
        case "amplifier":
        case "speaker":
        case "di-box":
          innerStyle.borderRadius = "4px";
          break;

        // Special shapes
        case "monitor-wedge":
          innerStyle.borderRadius = "4px";
          innerStyle.clipPath = "polygon(0 0, 100% 0, 100% 90%, 50% 100%, 0 90%)";
          // Apply rotation directly to the inner style for wedge
          innerStyle.transform = "rotate(15deg)";
          // Reset wrapper rotation if inner element handles it
          wrapperStyle.transform = `rotate(${element.rotation}deg)`;
          break;

        // Default fallback
        default:
          innerStyle.borderRadius = "4px";
      }

      // Get appropriate symbol for the element type
      let symbol = "";
      switch (element.type) {
        case "microphone":
          symbol = "M";
          break;
        case "power-strip":
          symbol = "P";
          break;
        case "electric-guitar":
        case "acoustic-guitar":
        case "bass-guitar":
          symbol = "G";
          break;
        case "keyboard":
          symbol = "K";
          break;
        case "drums":
        case "percussion":
          symbol = "D";
          break;
        case "violin":
        case "cello":
          symbol = "V";
          break;
        case "trumpet":
        case "saxophone":
          symbol = "T";
          break;
        case "generic-instrument":
          symbol = "I";
          break;
        case "amplifier":
          symbol = "A";
          break;
        case "monitor-wedge":
          symbol = "W";
          break;
        case "speaker":
          symbol = "S";
          break;
        case "di-box":
          symbol = "DI";
          break;
        case "iem":
          symbol = "IE";
          break;
        case "person":
          symbol = "P";
          break;
        default:
          symbol = "";
      }

      return (
        <div key={element.id} style={elementStyle}>
          <div style={wrapperStyle}>
            <div style={innerStyle}>
              <span style={symbolStyle}>{symbol}</span>
            </div>
            <div style={labelStyle}>{element.label}</div>
          </div>
        </div>
      );
    };

    const dimensions = getStageDimensions(stagePlot.stage_size);

    return (
      <div
        ref={ref}
        className="print-stage-plot-export"
        style={{
          width: "1600px",
          position: "absolute",
          left: "-9999px",
          fontFamily: "Inter, sans-serif",
          backgroundColor: "white",
          color: "#111",
          padding: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "2px solid #ddd",
            padding: "20px",
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                padding: "12px",
                marginRight: "16px",
                background: "#eee",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {/* Bookmark icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>SoundDocs</h1>
              <p style={{ color: "#666", margin: 0 }}>Professional Audio Documentation</p>
            </div>
          </div>

          {/* Document title and date */}
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "5px" }}>
              {stagePlot.name}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                color: "#666",
              }}
            >
              <span>Stage Plot</span>
            </div>
            <p style={{ fontSize: "14px", color: "#666" }}>
              Last edited: {formatDate(stagePlot.last_edited || stagePlot.created_at)}
            </p>
          </div>
        </div>

        {/* Back of stage label - MOVED OUTSIDE THE STAGE */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              padding: "5px 15px",
              borderRadius: "15px",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            Back of Stage
          </div>
        </div>

        {/* Stage Plot Canvas */}
        <div
          style={{
            width: dimensions.width,
            height: dimensions.height,
            margin: "0 auto",
            border: "1px solid #ccc",
            position: "relative",
            backgroundColor: "#f8f9fa",
            backgroundImage: `
          linear-gradient(#ddd 1px, transparent 1px),
          linear-gradient(90deg, #ddd 1px, transparent 1px)
        `,
            backgroundSize: "20px 20px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            borderRadius: "4px",
          }}
        >
          {/* Background image if present */}
          {stagePlot.backgroundImage && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `url(${stagePlot.backgroundImage})`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "contain",
                opacity:
                  (stagePlot.backgroundOpacity !== undefined ? stagePlot.backgroundOpacity : 50) /
                  100,
                zIndex: 1,
              }}
            />
          )}

          {/* Render each element */}
          {stagePlot.elements && stagePlot.elements.map(renderElement)}
        </div>

        {/* Front of stage label - MOVED OUTSIDE THE STAGE */}
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            marginBottom: "30px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              padding: "5px 15px",
              borderRadius: "15px",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            Front of Stage / Audience
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "40px",
            borderTop: "1px solid #eee",
            paddingTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <div>
            <span style={{ fontWeight: "bold" }}>SoundDocs</span> | Professional Audio Documentation
          </div>
          <div>Generated on {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    );
  },
);

PrintStagePlotExport.displayName = "PrintStagePlotExport";

export default PrintStagePlotExport;
