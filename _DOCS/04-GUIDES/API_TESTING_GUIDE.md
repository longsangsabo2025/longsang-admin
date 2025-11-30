# Google API Endpoints Testing Guide

## Server Status

✅ **API Server:** <http://localhost:3001>
✅ **Frontend:** <http://localhost:8080>

## Available Endpoints

### 📊 Analytics API (`/api/google/analytics`)

#### 1. Get Analytics Overview

```bash
curl -X POST http://localhost:3001/api/google/analytics/overview \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "YOUR_GA4_PROPERTY_ID",
    "startDate": "7daysAgo",
    "endDate": "today"
  }'
```

**Response:**

```json
[
  {
    "date": "20251105",
    "sessions": 1234,
    "users": 567,
    "pageViews": 3456,
    "bounceRate": 45.2,
    "avgSessionDuration": 120.5,
    "conversions": 89
  }
]
```

#### 2. Get Traffic Sources

```bash
curl -X POST http://localhost:3001/api/google/analytics/traffic-sources \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "YOUR_GA4_PROPERTY_ID",
    "startDate": "30daysAgo",
    "endDate": "today"
  }'
```

#### 3. Get Top Pages

```bash
curl -X POST http://localhost:3001/api/google/analytics/top-pages \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "YOUR_GA4_PROPERTY_ID",
    "startDate": "30daysAgo",
    "endDate": "today",
    "limit": 20
  }'
```

#### 4. Get Realtime Users

```bash
curl -X POST http://localhost:3001/api/google/analytics/realtime-users \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "YOUR_GA4_PROPERTY_ID"}'
```

#### 5. Compare Performance

```bash
curl -X POST http://localhost:3001/api/google/analytics/compare-performance \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "YOUR_GA4_PROPERTY_ID",
    "currentStart": "7daysAgo",
    "currentEnd": "today",
    "previousStart": "14daysAgo",
    "previousEnd": "8daysAgo"
  }'
```

#### 6. Get Conversion Paths

```bash
curl -X POST http://localhost:3001/api/google/analytics/conversion-paths \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "YOUR_GA4_PROPERTY_ID",
    "startDate": "30daysAgo",
    "endDate": "today"
  }'
```

#### 7. Get Device Breakdown

```bash
curl -X POST http://localhost:3001/api/google/analytics/device-breakdown \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "YOUR_GA4_PROPERTY_ID",
    "startDate": "30daysAgo",
    "endDate": "today"
  }'
```

---

### 📅 Calendar API (`/api/google/calendar`)

#### 1. Create Calendar Event

```bash
curl -X POST http://localhost:3001/api/google/calendar/create-event \
  -H "Content-Type: application/json" \
  -d '{
    "calendarEmail": "your-calendar@example.com",
    "event": {
      "summary": "Team Meeting",
      "description": "Weekly sync meeting",
      "start": {
        "dateTime": "2025-11-15T10:00:00+07:00",
        "timeZone": "Asia/Ho_Chi_Minh"
      },
      "end": {
        "dateTime": "2025-11-15T11:00:00+07:00",
        "timeZone": "Asia/Ho_Chi_Minh"
      },
      "attendees": [
        {"email": "attendee@example.com"}
      ]
    }
  }'
```

**Response:**

```json
{
  "id": "event_id_123",
  "summary": "Team Meeting",
  "start": {"dateTime": "2025-11-15T10:00:00+07:00"},
  "end": {"dateTime": "2025-11-15T11:00:00+07:00"},
  "status": "confirmed"
}
```

#### 2. Update Calendar Event

```bash
curl -X POST http://localhost:3001/api/google/calendar/update-event \
  -H "Content-Type: application/json" \
  -d '{
    "calendarEmail": "your-calendar@example.com",
    "eventId": "event_id_123",
    "updates": {
      "summary": "Updated Meeting Title",
      "start": {
        "dateTime": "2025-11-15T14:00:00+07:00"
      },
      "end": {
        "dateTime": "2025-11-15T15:00:00+07:00"
      }
    }
  }'
```

#### 3. Cancel Calendar Event

```bash
curl -X POST http://localhost:3001/api/google/calendar/cancel-event \
  -H "Content-Type: application/json" \
  -d '{
    "calendarEmail": "your-calendar@example.com",
    "eventId": "event_id_123"
  }'
```

#### 4. List Upcoming Events

```bash
curl -X POST http://localhost:3001/api/google/calendar/list-events \
  -H "Content-Type: application/json" \
  -d '{
    "calendarEmail": "your-calendar@example.com",
    "maxResults": 10
  }'
```

#### 5. Sync Consultations to Calendar

```bash
curl -X POST http://localhost:3001/api/google/calendar/sync-consultations \
  -H "Content-Type: application/json" \
  -d '{"calendarEmail": "your-calendar@example.com"}'
```

---

### 📧 Gmail API (`/api/google/gmail`)

#### 1. Send Single Email

```bash
curl -X POST http://localhost:3001/api/google/gmail/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "noreply@longsang.com",
    "to": "recipient@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello!</h1><p>This is a test email.</p>"
  }'
```

**Response:**

```json
{
  "success": true,
  "messageId": "18c5d9a1234567"
}
```

#### 2. Send Bulk Emails

```bash
curl -X POST http://localhost:3001/api/google/gmail/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "noreply@longsang.com",
    "recipients": [
      {"email": "user1@example.com", "name": "User 1"},
      {"email": "user2@example.com", "name": "User 2"}
    ],
    "subject": "Newsletter",
    "body": "<h1>Hello {{name}}!</h1><p>This is your newsletter.</p>"
  }'
```

**Response:**

```json
{
  "totalSent": 2,
  "totalFailed": 0,
  "results": [
    {"email": "user1@example.com", "success": true, "messageId": "18c5d9a1"},
    {"email": "user2@example.com", "success": true, "messageId": "18c5d9a2"}
  ]
}
```

#### 3. Send Consultation Confirmation

```bash
curl -X POST http://localhost:3001/api/google/gmail/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "noreply@longsang.com",
    "consultationId": "consultation_uuid_here"
  }'
```

#### 4. Send Newsletter

```bash
curl -X POST http://localhost:3001/api/google/gmail/send-newsletter \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "noreply@longsang.com",
    "subject": "Weekly Newsletter",
    "content": "<h1>Hello {{name}}!</h1><p>Here is your weekly update.</p>"
  }'
```

#### 5. Send Welcome Email

```bash
curl -X POST http://localhost:3001/api/google/gmail/send-welcome \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "noreply@longsang.com",
    "userEmail": "newuser@example.com",
    "userName": "John Doe"
  }'
```

---

## 🔧 Setup Requirements

### 1. Environment Variables

Create `.env` file with:

```env
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Google Cloud Platform Setup

1. **Create Service Account:**
   - Go to Google Cloud Console
   - Create new Service Account
   - Download JSON key file

2. **Enable APIs:**
   - Google Analytics Data API
   - Google Calendar API
   - Gmail API
   - Google Drive API

3. **Grant Permissions:**
   - Share Calendar with service account email
   - Delegate domain-wide authority for Gmail
   - Add service account to GA4 property

### 3. Supabase Database Tables

Required tables:

- `consultations`
- `calendar_events`
- `email_logs`
- `newsletter_subscribers`

---

## ✅ Testing Checklist

### Analytics API

- [ ] Overview endpoint returns metrics
- [ ] Traffic sources shows data
- [ ] Top pages lists correctly
- [ ] Realtime users returns count
- [ ] Performance comparison works
- [ ] Conversion paths shows journey
- [ ] Device breakdown shows devices

### Calendar API

- [ ] Create event succeeds
- [ ] Update event modifies correctly
- [ ] Cancel event removes from calendar
- [ ] List events shows upcoming
- [ ] Sync consultations creates events

### Gmail API

- [ ] Send email delivers successfully
- [ ] Bulk email sends to all recipients
- [ ] Confirmation email sends with consultation data
- [ ] Newsletter sends to all subscribers
- [ ] Welcome email sends to new users

---

## 🐛 Troubleshooting

### "propertyId is required"

- Make sure to include `propertyId` in request body
- Get GA4 property ID from Google Analytics

### "calendarEmail is required"

- Include calendar email in request
- Verify service account has calendar access

### "Google credentials not configured"

- Check `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env`
- Verify JSON format is valid

### "fetch failed" / Connection errors

- Ensure API server is running on port 3001
- Check `npm run dev` is active

---

## 📝 Notes

- All POST requests require `Content-Type: application/json`
- Dates use format: `YYYY-MM-DD` or `7daysAgo`, `today`, etc.
- Email body supports HTML formatting
- Rate limiting: 100ms between bulk emails
- All operations are logged to Supabase

---

## 🔗 Quick Links

- **API Server:** <http://localhost:3001>
- **Frontend:** <http://localhost:8080>
- **Health Check:** <http://localhost:3001/api/health>
