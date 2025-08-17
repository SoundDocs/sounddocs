import type { TFData } from "@sounddocs/analyzer-protocol";

function applyOffsets(tf: TFData, offsetDb: number, offsetMs: number): TFData {
  const msToSec = 1 / 1000;

  const mag_db = tf.mag_db.map((v) => v + offsetDb);
  const phase_deg = tf.phase_deg.map((p, i) => {
    const f = tf.freqs[i];
    const rot = -360 * f * (offsetMs * msToSec);
    let ph = p + rot;
    // wrap to [-180,180]
    ph = ((((ph + 180) % 360) + 360) % 360) - 180;
    return ph;
  });

  return { ...tf, mag_db, phase_deg };
}

self.onmessage = (e: MessageEvent<{ tf: TFData; offsetDb: number; offsetMs: number }>) => {
  const { tf, offsetDb, offsetMs } = e.data;
  const transformedTf = applyOffsets(tf, offsetDb, offsetMs);
  self.postMessage(transformedTf);
};

// Trick to make TypeScript treat this as a module
export {};
