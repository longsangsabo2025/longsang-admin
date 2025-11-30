# 📡 Copilot API Documentation

**LongSang Admin AI Copilot API** - Complete API Reference

---

## 🔗 Base URL

```
http://localhost:3001/api
```

---

## 🔐 Authentication

Most endpoints require authentication via:
- `Authorization: Bearer <token>` header
- Or `x-user-id` header for development

---

## 📋 Endpoints

### 1. Copilot Chat

**POST** `/api/copilot/chat`

Chat với Copilot AI.

**Request:**
```json
{
  "message": "Tạo post về dự án mới",
  "userId": "user-id",
  "projectId": "project-id",
  "context": {
    "previousMessages": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Tôi sẽ tạo post về dự án mới cho bạn...",
  "contextUsed": {
    "projects": 1,
    "workflows": 0
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "tokens": 150,
    "responseTime": 1234
  }
}
```

---

### 2. Get Suggestions

**GET** `/api/copilot/suggestions`

Lấy proactive suggestions.

**Query Parameters:**
- `userId` (required)
- `projectId` (optional)
- `limit` (default: 10)

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "id": "suggestion-id",
      "type": "action",
      "priority": "high",
      "title": "Tạo post về dự án mới",
      "description": "Bạn có thể tạo post về dự án Vũng Tàu Dream Homes",
      "suggestedAction": {
        "action": "create_post",
        "parameters": {
          "topic": "Vũng Tàu Dream Homes",
          "platform": "facebook"
        }
      },
      "projectId": "project-id",
      "projectName": "Vũng Tàu Dream Homes",
      "confidence": 0.85,
      "createdAt": "2025-01-27T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 3. Generate Suggestions

**POST** `/api/copilot/suggestions/generate`

Generate new suggestions.

**Request:**
```json
{
  "userId": "user-id",
  "projectId": "project-id"
}
```

**Response:**
```json
{
  "success": true,
  "generated": 5,
  "suggestions": [...]
}
```

---

### 4. Execute Suggestion

**POST** `/api/copilot/suggestions/:id/execute`

Execute một suggestion.

**Response:**
```json
{
  "success": true,
  "executionId": "execution-id",
  "result": {
    "workflowId": "workflow-id",
    "status": "completed"
  }
}
```

---

### 5. Dismiss Suggestion

**POST** `/api/copilot/suggestions/:id/dismiss`

Dismiss một suggestion.

**Response:**
```json
{
  "success": true,
  "message": "Suggestion dismissed"
}
```

---

### 6. Planning

**POST** `/api/copilot/plan`

Create execution plan.

**Request:**
```json
{
  "command": "Tạo post và đăng lên Facebook, LinkedIn",
  "userId": "user-id",
  "projectId": "project-id"
}
```

**Response:**
```json
{
  "success": true,
  "plan": {
    "steps": [
      {
        "id": "step-1",
        "name": "Generate Content",
        "description": "Generate post content",
        "dependencies": [],
        "estimatedTime": 5000
      },
      {
        "id": "step-2",
        "name": "Post to Facebook",
        "description": "Post to Facebook",
        "dependencies": ["step-1"],
        "estimatedTime": 2000
      },
      {
        "id": "step-3",
        "name": "Post to LinkedIn",
        "description": "Post to LinkedIn",
        "dependencies": ["step-1"],
        "estimatedTime": 2000
      }
    ],
    "estimatedTotalTime": 7000,
    "canParallel": true
  }
}
```

---

### 7. Preview Plan

**POST** `/api/copilot/plan/preview`

Preview execution plan without executing.

**Request:** Same as `/api/copilot/plan`

**Response:** Same as `/api/copilot/plan`

---

### 8. Execute Plan

**POST** `/api/copilot/plan/execute`

Execute a plan.

**Request:**
```json
{
  "planId": "plan-id",
  "steps": [...],
  "userId": "user-id",
  "projectId": "project-id"
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "execution-id",
  "results": [
    {
      "stepId": "step-1",
      "status": "completed",
      "result": {...}
    }
  ],
  "totalTime": 6500
}
```

---

### 9. Feedback

**POST** `/api/copilot/feedback`

Submit feedback for learning.

**Request:**
```json
{
  "type": "positive",
  "userId": "user-id",
  "message": "Original message",
  "response": "AI response",
  "rating": 5,
  "comment": "Great response!",
  "interactionType": "chat",
  "referenceId": "message-id",
  "referenceType": "message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback received and stored successfully",
  "feedbackId": "feedback-id"
}
```

---

### 10. Analytics Insights

**GET** `/api/copilot/analytics/insights`

Get performance insights.

**Query Parameters:**
- `userId` (required)
- `projectId` (optional)
- `timeRange` (default: "7d", options: "24h", "7d", "30d", "90d")

**Response:**
```json
{
  "success": true,
  "insights": {
    "analytics": {
      "commands": {
        "total": 100,
        "successful": 95,
        "failed": 5
      }
    },
    "insights": [
      {
        "type": "performance",
        "summary": "Response time improved 30%",
        "recommendation": "Continue using cached responses"
      }
    ],
    "recommendations": [...]
  }
}
```

---

### 11. Analytics Recommendations

**GET** `/api/copilot/analytics/recommendations`

Get data-driven recommendations.

**Query Parameters:**
- `userId` (required)
- `projectId` (optional)

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "action",
      "priority": "high",
      "reason": "Based on your usage patterns",
      "suggestedAction": {...},
      "source": "analytics",
      "confidence": 0.9
    }
  ],
  "count": 3
}
```

---

### 12. Track Usage

**POST** `/api/copilot/analytics/track`

Track Copilot usage.

**Request:**
```json
{
  "userId": "user-id",
  "action": "command",
  "details": {
    "command": "create_post",
    "duration": 5000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usage tracked successfully"
}
```

---

## 🛡️ Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "category": "validation",
    "severity": "low",
    "retryable": false,
    "details": "Technical details (dev only)"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## 🔄 Rate Limiting

Rate limits apply to AI endpoints:
- **AI Commands:** 20 requests/minute
- **Suggestions:** 10 requests/minute
- **Analytics:** 30 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1633024800
```

---

## 📚 Examples

### Example: Complete Flow

```javascript
// 1. Get suggestions
const suggestions = await fetch('/api/copilot/suggestions?userId=user-1');

// 2. Execute suggestion
const execution = await fetch('/api/copilot/suggestions/sug-1/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user-1' })
});

// 3. Provide feedback
await fetch('/api/copilot/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'positive',
    userId: 'user-1',
    message: 'Original message',
    response: 'AI response',
    rating: 5
  })
});
```

---

**Last Updated:** 27/01/2025
**Version:** 1.0.0

