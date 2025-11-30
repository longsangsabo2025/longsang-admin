const testAPIs = async () => {
  console.log("Testing Google APIs...\n");
  
  // Test Indexing
  try {
    const res = await fetch("http://localhost:3001/api/google/indexing/submit-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://saboarena.com/test-page" })
    });
    const data = await res.json();
    console.log("🔍 Indexing API:", data.success ? "✅ Working" : "❌ Failed");
  } catch (e) { console.log("🔍 Indexing API: ❌", e.message); }
  
  // Test Calendar
  try {
    const res = await fetch("http://localhost:3001/api/google/calendar/create-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calendarEmail: "primary",
        event: {
          summary: "Test Event",
          start: { dateTime: "2025-11-27T10:00:00", timeZone: "Asia/Ho_Chi_Minh" },
          end: { dateTime: "2025-11-27T11:00:00", timeZone: "Asia/Ho_Chi_Minh" }
        }
      })
    });
    const data = await res.json();
    console.log("📅 Calendar API:", data.id ? "✅ Working" : "❌ " + (data.error || "Failed"));
  } catch (e) { console.log("📅 Calendar API: ❌", e.message); }
  
  // Test Gmail
  try {
    const res = await fetch("http://localhost:3001/api/google/gmail/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromEmail: "test@example.com",
        to: "test@example.com",
        subject: "Test",
        body: "Test email"
      })
    });
    const data = await res.json();
    console.log("📧 Gmail API:", data.success ? "✅ Working" : "❌ " + (data.error || "Failed"));
  } catch (e) { console.log("📧 Gmail API: ❌", e.message); }
};

testAPIs();
