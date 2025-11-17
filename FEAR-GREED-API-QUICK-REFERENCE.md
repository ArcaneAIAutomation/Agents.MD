# Fear & Greed Index API - Quick Reference

## Endpoint

```
GET /api/atge/fear-greed-index
```

**Authentication**: Required (JWT token)

---

## Response

### Success Response

```json
{
  "success": true,
  "value": 14,
  "classification": "Extreme Fear",
  "color": "red",
  "timestamp": "2025-11-17T00:00:00.000Z",
  "metadata": {
    "valueClassification": "Extreme Fear",
    "timeUntilUpdate": "78730",
    "source": "Alternative.me",
    "lastUpdated": "2025-11-17T00:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "value": null,
  "classification": "N/A",
  "color": "gray",
  "error": "Failed to fetch Fear & Greed Index",
  "errorType": "timeout",
  "retryable": true
}
```

---

## Classification Ranges

| Value | Label | Color |
|-------|-------|-------|
| 76-100 | Extreme Greed | Green |
| 56-75 | Greed | Orange |
| 45-55 | Neutral | Yellow |
| 25-44 | Fear | Orange |
| 0-24 | Extreme Fear | Red |

---

## Usage Example

```typescript
const response = await fetch('/api/atge/fear-greed-index', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  console.log(`${data.value}/100 - ${data.classification}`);
} else {
  console.log('N/A');
}
```

---

## Testing

```bash
# Run test script
npx tsx scripts/test-fear-greed-api.ts
```

---

## Data Source

**API**: Alternative.me  
**URL**: https://api.alternative.me/fng/?limit=1  
**Cost**: Free  
**Update**: Daily

---

## Performance

- **Response Time**: 200-500ms
- **Timeout**: 10 seconds
- **Cache**: None (real-time)

---

## Error Types

- `timeout` - Request timeout
- `network` - Network error
- `apiError` - API error
- `unknown` - Unknown error

