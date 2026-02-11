
export default async (req, context) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Server Error: GEMINI_API_KEY is missing in environment variables.");
    return new Response(JSON.stringify({ error: "Server Configuration Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { modelName, prompt, systemInstruction, responseSchema } = body;

    // Use default model if not provided
    const model = modelName || "gemini-2.0-flash";
    
    // Construct the Gemini API URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Construct Payload for REST API
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
      }
    };

    // Add System Instruction if present
    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    // Add JSON Schema if present
    if (responseSchema) {
      payload.generationConfig.responseMimeType = "application/json";
      payload.generationConfig.responseSchema = responseSchema;
    }

    // Call Google Gemini API
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Gemini API Error:", data);
      return new Response(JSON.stringify({ error: data.error?.message || "Gemini API Error" }), {
        status: apiResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return the raw data from Gemini to the frontend
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
