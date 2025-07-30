import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.0';
import { createLedPixelMapSvg } from './createLedSvg.ts';

// --- FONT & WASM LOADING ---
let startupError: Error | null = null;
let interFontBuffer: Uint8Array | null = null;

// This function will be called only once on cold start.
async function initialize() {
  try {
    // 1. Fetch and initialize the WASM binary for the resvg library.
    const wasmUrl = 'https://esm.sh/@resvg/resvg-wasm@2.6.0/index_bg.wasm';
    const wasmResponse = await fetch(wasmUrl);
    if (!wasmResponse.ok) throw new Error(`Failed to fetch resvg WASM module: ${wasmResponse.status}`);
    const wasmBuffer = await wasmResponse.arrayBuffer();
    await initWasm(wasmBuffer);

    // 2. Fetch the TTF font and store it as a Uint8Array buffer.
    const fontUrl = 'https://raw.githubusercontent.com/onokatio/fonts/master/Inter-Regular.otf';
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) throw new Error(`Failed to fetch font: ${fontResponse.statusText}`);
    interFontBuffer = new Uint8Array(await fontResponse.arrayBuffer());
  } catch (e) {
    console.error("--- CRITICAL FUNCTION STARTUP ERROR ---");
    console.error(e);
    startupError = e;
  }
}

const initializePromise = initialize();
// --- END LOADING ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  await initializePromise; // Ensure initialization is complete before handling requests

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  if (startupError || !interFontBuffer) {
    const errorDetails = startupError ? startupError.message : "Font buffer is not available.";
    return new Response(JSON.stringify({
      error: 'Function failed to initialize. See logs for details.',
      details: errorDetails
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }

  try {
    const body = await req.json();
    const { mapWidth, mapHeight, panelWidth, panelHeight } = body;

    if (!mapWidth || !mapHeight || !panelWidth || !panelHeight) {
        throw new Error("Missing required map dimensions in request body.");
    }

    const width = mapWidth * panelWidth;
    const height = mapHeight * panelHeight;

    const svg = createLedPixelMapSvg({ ...body, width, height });

    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: width
      },
      font: {
        fontBuffers: [interFontBuffer],
        defaultFontFamily: 'Inter',
        loadSystemFonts: false
      }
    });

    const renderedImage = resvg.render();
    const pngBuffer = renderedImage.asPng();

    return new Response(pngBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${body.projectName}_${body.screenName}.png"`
      },
      status: 200
    });
  } catch (error) {
    console.error('Error generating PNG:', error);
    return new Response(JSON.stringify({
      error: `Failed to generate image: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
