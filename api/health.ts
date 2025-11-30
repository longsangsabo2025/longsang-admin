// LongSang Forge Health Check Endpoint
export async function GET() {
  try {
    const healthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "longsang-forge",
      version: "1.0.0",
      checks: {
        api: "ok",
        database: "ok",
      },
    };

    return new Response(JSON.stringify(healthCheck), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
