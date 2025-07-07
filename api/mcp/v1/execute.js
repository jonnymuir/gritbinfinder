// The default export is the function that handles the request.
export default async function handler(request) {

  // --- 1. Security & Validation ---
  // Ensure we only accept POST requests for execution.
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // --- 2. Parse the Incoming Request ---
    const body = await request.json();
    const { tool_name, parameters } = body;

    if (tool_name !== 'view_gritbins_on_map') {
      return new Response(
        JSON.stringify({ error: `Tool '${tool_name}' not found.` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const postcode = parameters?.postcode;
    if (!postcode) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: 'postcode'" }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- 3. Execute the "Tool" (Build the URL) ---
    // Note: The base URL for the app is now the root of the site,
    // since we don't need the '/app' prefix anymore.
    const tool_url = `/index.html?postcode=${encodeURIComponent(postcode)}`;

    const responsePayload = {
      result: tool_url
    };

    // --- 4. Return the Successful Response ---
    return new Response(
      JSON.stringify(responsePayload),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error executing tool:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
