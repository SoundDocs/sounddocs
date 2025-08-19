// supabase/functions/ai-align-systems/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Calculates the cross-correlation of two signals to find the lag.
 * This function finds the lag of s2 relative to s1.
 * @param s1 The reference signal (e.g., front fills).
 * @param s2 The signal to compare (e.g., mains).
 * @returns The lag in samples. A positive value means s2 is delayed relative to s1.
 */
function crossCorrelate(s1: number[], s2: number[]): number {
  const n = s1.length;
  let maxCorr = -Infinity;
  let bestLag = 0;

  // Search for the lag in a reasonable window around the center.
  // This improves performance and avoids spurious peaks.
  const searchWindow = Math.floor(n / 4);

  for (let lag = -searchWindow; lag <= searchWindow; lag++) {
    let corr = 0;
    for (let i = 0; i < n; i++) {
      const s2Index = i - lag; // A positive lag means s2 is shifted right (delayed)
      if (s2Index >= 0 && s2Index < n) {
        corr += s1[i] * s2[s2Index];
      }
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }
  return bestLag;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { measurement1, measurement2, sampleRate } = await req.json();

    if (!measurement1 || !measurement2 || !sampleRate) {
      throw new Error("Missing required parameters: measurement1, measurement2, or sampleRate.");
    }

    const { ir: ir1, capture_delay_ms: captureDelay1 } = measurement1;
    const { ir: ir2, capture_delay_ms: captureDelay2 } = measurement2;

    if (!ir1 || !ir2 || typeof captureDelay1 !== "number" || typeof captureDelay2 !== "number") {
      throw new Error(
        "Invalid measurement data. Both measurements must have 'ir' and 'capture_delay_ms'.",
      );
    }

    // Find the lag of ir2 relative to ir1 in samples.
    const correlationLagSamples = crossCorrelate(ir1, ir2);

    // Convert lag from samples to milliseconds.
    const correlationDelayMs = (correlationLagSamples / sampleRate) * 1000;

    // Calculate the current time offset between the two measurements.
    // This value represents: arrival_time(m2) - arrival_time(m1)
    const currentOffsetMs = captureDelay2 - captureDelay1 + correlationDelayMs;

    // We want the final offset to be +2ms (m2 arrives 2ms after m1).
    // The required delay to add to m2 is: desired_offset - current_offset.
    const requiredDelayForM2 = 2.0 - currentOffsetMs;

    // We can only add positive delay. If the result is negative, it means m2
    // is already more than 2ms behind m1, so no delay is needed.
    const finalDelay = Math.max(0, requiredDelayForM2);

    const data = {
      // This is the delay that should be applied to measurement2 (the rear system).
      alignment_delay_ms: finalDelay,
    };

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 400,
    });
  }
});
