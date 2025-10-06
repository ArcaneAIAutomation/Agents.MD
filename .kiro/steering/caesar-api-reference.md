---
inclusion: always
---

# Caesar API Reference & Integration Guide

## Official API Documentation

### Base URL
```
https://api.caesar.xyz
```

### Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer <token>
```

---

## 1. Create Research Job

### Endpoint
```
POST /research
```

### Description
Start a new research job using a query and optional file IDs.

### Request Headers
- `Authorization: Bearer <token>` (Required)
- `Content-Type: application/json` (Required)

### Request Body
```typescript
{
  query: string;              // Required: Primary research question or instruction
  files?: string[];           // Optional: IDs of previously uploaded files to include
  compute_units?: number;     // Optional: 1-10, defaults to 1. Compute budget for the job
  system_prompt?: string;     // Optional: System prompt to steer the assistant
}
```

### Response (200 - Success)
```typescript
{
  id: string;                 // UUID: Research job identifier
  status: "queued";           // Initial status when job is created
}
```

### Status Values
The `status` field can have the following values:
1. `queued` - Job accepted and waiting to start
2. `researching` - Job is actively running
3. `completed` - Job finished successfully
4. `failed` - Job encountered an error
5. `cancelled` - Job was cancelled
6. `expired` - Job expired before completion
7. `pending` - Job is pending (waiting for resources)

### Error Responses
- `400` - Bad Request Error (invalid parameters)
- `401` - Unauthorized Error (invalid/missing API key)
- `429` - Too Many Requests Error (rate limit exceeded)
- `500` - Internal Server Error (server-side issue)

### Example cURL
```bash
curl -X POST https://api.caesar.xyz/research \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Analyze Bitcoin whale transaction patterns",
    "compute_units": 2,
    "system_prompt": "Return analysis as JSON"
  }'
```

### Example Response
```json
{
  "id": "f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10",
  "status": "queued"
}
```

---

## Implementation Notes

### Compute Units
- **1 CU**: ~1 minute, basic research
- **2 CU**: ~2 minutes, balanced speed/depth (recommended for whale analysis)
- **5 CU**: ~5 minutes, deep research
- **10 CU**: ~10 minutes, comprehensive analysis

### System Prompt Best Practices
- Use system prompts to request structured output (JSON, markdown, etc.)
- Be specific about the format you want
- Include field names and types for JSON responses
- Example: "Return strict JSON with fields: reasoning, confidence, findings"

### Polling Strategy
After creating a research job:
1. Store the returned `id`
2. Poll GET `/research/{id}` every 2-3 seconds
3. Check `status` field for completion
4. Handle timeout after reasonable duration (2-5 minutes depending on CU)
5. Parse `transformed_content` for structured output

---

## TypeScript Client Implementation

```typescript
// Create research job
const job = await Caesar.createResearch({
  query: "Your research question",
  compute_units: 2,
  system_prompt: "Optional formatting instructions"
});

console.log(`Job created: ${job.id}, Status: ${job.status}`);

// Job ID is returned for polling
// Use GET /research/{id} to check status and get results
```

---

## 2. Retrieve Research Object

### Endpoint
```
GET /research/:id
```

### Description
Retrieve a single research object by ID. Use this endpoint to poll for job status and results.

### Path Parameters
- `id` (string, Required): Research job identifier (UUID)

### Request Headers
- `Authorization: Bearer <token>` (Required)

### Response (200 - Success)
```typescript
{
  id: string;                          // UUID: Research job identifier
  created_at: string;                  // ISO 8601 timestamp when job was created
  status: string;                      // Current status (queued, researching, completed, etc.)
  query: string;                       // Original query text
  results: Array<{                     // Ranked retrieval results and citations
    id: string;                        // UUID: Result identifier
    score: number;                     // Relevance score (0-1)
    title: string;                     // Source title
    url: string;                       // Source URL
    citation_index: number;            // Citation number for referencing
  }>;
  content: string | null;              // Final synthesis (null until completed)
  transformed_content: string | null;  // Post-processed content (e.g., JSON if system_prompt used)
}
```

### Status Progression
1. `queued` → Job accepted, waiting to start
2. `researching` → Job is running, `results` may be partially populated
3. `completed` → Job finished, `content` and `transformed_content` available
4. `failed` → Job failed, check error details
5. `cancelled` → Job was cancelled by user
6. `expired` → Job expired before completion
7. `pending` → Job pending (waiting for resources)

### Error Responses
- `401` - Unauthorized Error (invalid/missing API key)
- `404` - Not Found Error (job ID doesn't exist)
- `500` - Internal Server Error (server-side issue)

### Example cURL
```bash
curl https://api.caesar.xyz/research/f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10 \
  -H "Authorization: Bearer <token>"
```

### Example Response (Researching)
```json
{
  "id": "f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10",
  "created_at": "2025-09-14T12:00:00Z",
  "status": "researching",
  "query": "Is lithium supply a bottleneck for EV adoption?",
  "results": [
    {
      "id": "22b28323-3f18-4dc2-8115-e50e503f7dee",
      "score": 0.88,
      "title": "Benchmarking lithium supply constraints",
      "url": "https://example.org/paper",
      "citation_index": 1
    },
    {
      "id": "fd47d46b-4779-4ace-b01d-c7863703f194",
      "score": 0.81,
      "title": "USGS Mineral Commodity Summaries 2025",
      "url": "https://pubs.usgs.gov/periodicals/mcs2025/mcs2025.pdf",
      "citation_index": 2
    }
  ]
}
```

### Example Response (Completed)
```json
{
  "id": "f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10",
  "created_at": "2025-09-14T12:00:00Z",
  "status": "completed",
  "query": "Is lithium supply a bottleneck for EV adoption?",
  "results": [...],
  "content": "Based on the research, lithium supply presents...",
  "transformed_content": "{\"conclusion\": \"...\", \"confidence\": 85}"
}
```

---

## Implementation Notes

### Polling Best Practices
```typescript
// Poll for results
const pollForResults = async (jobId: string, maxAttempts = 60) => {
  for (let i = 0; i < maxAttempts; i++) {
    const job = await Caesar.getResearch(jobId);
    
    // Check if completed
    if (job.status === 'completed') {
      return {
        content: job.content,
        analysis: job.transformed_content ? JSON.parse(job.transformed_content) : null,
        sources: job.results
      };
    }
    
    // Check if failed
    if (job.status === 'failed') {
      throw new Error('Research job failed');
    }
    
    // Wait before next poll (2-3 seconds recommended)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Polling timeout');
};
```

### Content vs Transformed Content
- **`content`**: Raw synthesis text from the research
- **`transformed_content`**: Formatted output based on `system_prompt`
  - If you used `system_prompt` to request JSON, parse `transformed_content`
  - If no `system_prompt`, use `content` for the raw text

### Results Array
- Contains sources found during research
- Ordered by relevance (`score` field, 0-1)
- Use `citation_index` to reference sources in your UI
- `url` field provides link to original source

---

## TypeScript Client Implementation

```typescript
// Get research job status and results
const job = await Caesar.getResearch(jobId);

console.log(`Status: ${job.status}`);

if (job.status === 'completed') {
  // Parse structured output if system_prompt was used
  const analysis = job.transformed_content 
    ? JSON.parse(job.transformed_content)
    : null;
  
  // Access raw content
  const rawContent = job.content;
  
  // Access sources
  const sources = job.results.map(r => ({
    title: r.title,
    url: r.url,
    relevance: r.score,
    citation: r.citation_index
  }));
}
```

---

## 3. Retrieve Raw Result Content

### Endpoint
```
GET /research/:id/results/:resultId/content
```

### Description
Returns the raw content for a specific result within a research object. Use this to get the full text of a source that was cited in the research.

### Path Parameters
- `id` (string, Required): Research job identifier (UUID)
- `resultId` (string, Required): Result item identifier (UUID)

### Request Headers
- `Authorization: Bearer <token>` (Required)

### Response (200 - Success)
```typescript
{
  content: string;  // Raw extracted content (may include HTML, markdown, or plain text)
}
```

### Error Responses
- `401` - Unauthorized Error (invalid/missing API key)
- `404` - Not Found Error (job ID or result ID doesn't exist)
- `500` - Internal Server Error (server-side issue)

### Example cURL
```bash
curl https://api.caesar.xyz/research/f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10/results/22b28323-3f18-4dc2-8115-e50e503f7dee/content \
  -H "Authorization: Bearer <token>"
```

### Example Response
```json
{
  "content": "Skip to main contentEnable accessibility for low vision...\n\n[Full article text here, may include HTML/markdown formatting]\n\n... (content may be very long) ..."
}
```

---

## Implementation Notes

### When to Use This Endpoint
- **Display full source text**: Show users the complete article/document
- **Deep analysis**: Extract specific data from source documents
- **Verification**: Allow users to verify claims against original sources
- **Context expansion**: Get more context beyond the summary

### Content Format
The `content` field may contain:
- **Plain text**: Clean extracted text
- **HTML**: Original HTML markup from web pages
- **Markdown**: Formatted markdown text
- **Mixed**: Combination of formats

Always sanitize and format appropriately for display.

### Performance Considerations
- Raw content can be very large (100KB+)
- Cache results client-side to avoid repeated requests
- Consider lazy-loading when displaying multiple sources
- Use pagination or truncation for UI display

---

## TypeScript Client Implementation

```typescript
// Get raw content for a specific source
const rawContent = await Caesar.getRawResultContent(jobId, resultId);

console.log(`Content length: ${rawContent.content.length} characters`);

// Display in UI (sanitize HTML if needed)
const sanitizedContent = sanitizeHtml(rawContent.content);
```

### Example: Display Sources with Full Content

```typescript
// After research completes
const job = await Caesar.getResearch(jobId);

if (job.status === 'completed') {
  // Show sources with option to expand
  for (const result of job.results) {
    console.log(`Source ${result.citation_index}: ${result.title}`);
    console.log(`Relevance: ${(result.score * 100).toFixed(0)}%`);
    console.log(`URL: ${result.url}`);
    
    // Optionally fetch full content
    if (needFullContent) {
      const fullContent = await Caesar.getRawResultContent(job.id, result.id);
      console.log(`Full text: ${fullContent.content.substring(0, 500)}...`);
    }
  }
}
```

---

## 4. List Research Jobs

### Endpoint
```
GET /research
```

### Description
Returns a paginated list of research objects. Use this to view all your research jobs.

### Request Headers
- `Authorization: Bearer <token>` (Required)

### Query Parameters
- `page` (integer, Optional): 1-based page index (default: 1, min: 1)
- `limit` (integer, Optional): Page size/items per page (default: 10, min: 1, max: 200)

### Response (200 - Success)
```typescript
{
  data: Array<{                        // List of research objects
    id: string;                        // UUID: Research job identifier
    created_at: string;                // ISO 8601 timestamp
    status: string;                    // Current status
    query: string;                     // Original query
    results: Array<{                   // Results (empty if not completed)
      id: string;
      score: number;
      title: string;
      url: string;
      citation_index: number;
    }>;
    content?: string;                  // Final synthesis (if completed)
    transformed_content?: string;      // Formatted output (if completed)
  }>;
  pagination: {
    limit: number;                     // Items per page
    page: number;                      // Current page (1-based)
    has_next: boolean;                 // True if more pages available
    total?: number;                    // Total number of items (optional)
  };
}
```

### Error Responses
- `401` - Unauthorized Error (invalid/missing API key)
- `500` - Internal Server Error (server-side issue)

### Example cURL
```bash
curl -G https://api.caesar.xyz/research \
  -H "Authorization: Bearer <token>" \
  -d page=1 \
  -d limit=10
```

### Example Response
```json
{
  "data": [
    {
      "id": "f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10",
      "created_at": "2025-09-14T12:00:00Z",
      "status": "queued",
      "query": "Is lithium supply a bottleneck for EV adoption?",
      "results": []
    },
    {
      "id": "11111111-2222-3333-4444-555555555555",
      "created_at": "2025-09-13T18:21:37Z",
      "status": "completed",
      "query": "Summarise key findings from these docs",
      "results": [
        {
          "id": "string",
          "score": 0.92,
          "title": "IEA Global EV Outlook 2025",
          "url": "https://www.iea.org/reports/global-ev-outlook-2025",
          "citation_index": 1
        }
      ],
      "content": "Final synthesis text…"
    }
  ],
  "pagination": {
    "limit": 10,
    "page": 1,
    "has_next": true
  }
}
```

---

## Implementation Notes

### Pagination Best Practices
```typescript
// Fetch first page
let page = 1;
let allJobs = [];

do {
  const response = await Caesar.listResearch(page, 25);
  allJobs.push(...response.data);
  
  if (!response.pagination.has_next) break;
  page++;
} while (page < 10); // Safety limit

console.log(`Total jobs fetched: ${allJobs.length}`);
```

### Use Cases
- **Job History**: Display all past research jobs
- **Status Dashboard**: Monitor multiple jobs at once
- **Job Management**: Find and resume incomplete jobs
- **Analytics**: Track research usage and patterns

### Filtering and Sorting
The API returns jobs in reverse chronological order (newest first). To filter:
```typescript
// Get only completed jobs
const completed = response.data.filter(job => job.status === 'completed');

// Get jobs from last 24 hours
const recent = response.data.filter(job => {
  const created = new Date(job.created_at);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return created > dayAgo;
});
```

### Performance Considerations
- Use reasonable `limit` values (10-50 recommended)
- Cache results to avoid repeated requests
- Only fetch additional pages when needed (lazy loading)
- Consider storing job IDs locally for quick access

---

## TypeScript Client Implementation

```typescript
// List all research jobs (first page)
const response = await Caesar.listResearch(1, 25);

console.log(`Found ${response.data.length} jobs`);
console.log(`Has more pages: ${response.pagination.has_next}`);

// Display jobs
response.data.forEach(job => {
  console.log(`${job.id}: ${job.query} - ${job.status}`);
});

// Fetch next page if available
if (response.pagination.has_next) {
  const nextPage = await Caesar.listResearch(2, 25);
  // Process next page...
}
```

### Example: Job History UI

```typescript
// Build job history for UI
const buildJobHistory = async () => {
  const response = await Caesar.listResearch(1, 50);
  
  return response.data.map(job => ({
    id: job.id,
    query: job.query,
    status: job.status,
    created: new Date(job.created_at).toLocaleString(),
    resultCount: job.results?.length || 0,
    hasContent: !!job.content
  }));
};
```

---

## 5. Upload File

### Endpoint
```
POST /research/files
```

### Description
Upload a file via multipart form and create a Research File object. Uploaded files can be referenced in research queries using their ID.

### Request Headers
- `Authorization: Bearer <token>` (Required)
- `Content-Type: multipart/form-data` (Required)

### Request Body (Multipart Form)
- `file` (file, Required): The file to upload (typically PDF)

### Supported File Types
- **PDF**: `application/pdf` (primary use case)
- Other document formats may be supported (check API response)

### Response (200 - Success)
```typescript
{
  id: string;              // UUID: Unique identifier for the file
  file_name: string;       // Original uploaded filename
  content_type: string;    // MIME type (e.g., "application/pdf")
}
```

### Error Responses
- `400` - Bad Request Error (invalid file format or missing file)
- `401` - Unauthorized Error (invalid/missing API key)
- `429` - Too Many Requests Error (rate limit exceeded)
- `500` - Internal Server Error (server-side issue)

### Example cURL
```bash
curl -X POST https://api.caesar.xyz/research/files \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf"
```

### Example Response
```json
{
  "id": "9c6f8b1a-2a4f-4a35-86b9-0d0b5e25d5e5",
  "file_name": "document.pdf",
  "content_type": "application/pdf"
}
```

---

## Implementation Notes

### Using Uploaded Files in Research
After uploading a file, use its `id` in the `files` array when creating a research job:

```typescript
// 1. Upload file
const uploadedFile = await Caesar.uploadFile(pdfFile, "whitepaper.pdf");
console.log(`File uploaded: ${uploadedFile.id}`);

// 2. Create research job with file
const job = await Caesar.createResearch({
  query: "Summarize the key findings from this whitepaper",
  files: [uploadedFile.id],  // Reference the uploaded file
  compute_units: 2
});
```

### File Size Limits
- Check API documentation for current file size limits
- Typical limit: 10-50 MB per file
- Consider splitting large documents if needed

### File Persistence
- Uploaded files are stored and can be reused in multiple research jobs
- Use `GET /research/files` to list previously uploaded files
- Files remain available until explicitly deleted (if deletion is supported)

### Best Practices
- **Descriptive filenames**: Use clear, descriptive names for easier identification
- **File validation**: Validate file type and size client-side before upload
- **Error handling**: Handle upload failures gracefully with retry logic
- **Progress tracking**: Show upload progress for large files

---

## TypeScript Client Implementation

```typescript
// Upload a PDF file
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://api.caesar.xyz/research/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CAESAR_API_KEY}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  return await response.json();
};

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const uploadedFile = await uploadFile(file);
console.log(`Uploaded: ${uploadedFile.file_name} (${uploadedFile.id})`);
```

### Example: Upload and Research Workflow

```typescript
// Complete workflow: Upload PDF and analyze it
const analyzeDocument = async (pdfFile: File, question: string) => {
  // Step 1: Upload the PDF
  console.log('Uploading document...');
  const uploadedFile = await Caesar.uploadFile(pdfFile, pdfFile.name);
  
  // Step 2: Create research job with the file
  console.log('Starting research...');
  const job = await Caesar.createResearch({
    query: question,
    files: [uploadedFile.id],
    compute_units: 3,
    system_prompt: 'Return analysis as JSON with summary, key_points, and recommendations'
  });
  
  // Step 3: Poll for results
  console.log('Waiting for analysis...');
  const result = await Caesar.pollUntilComplete(job.id);
  
  // Step 4: Parse and return
  const analysis = JSON.parse(result.transformed_content);
  return {
    fileId: uploadedFile.id,
    fileName: uploadedFile.file_name,
    analysis: analysis,
    sources: result.results
  };
};

// Use it
const result = await analyzeDocument(myPDF, "What are the main conclusions?");
console.log(result.analysis);
```

### Browser File Upload Example

```typescript
// React component for file upload
const FileUploadComponent = () => {
  const [uploading, setUploading] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await Caesar.uploadFile(file, file.name);
      setFileId(result.id);
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept=".pdf"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {fileId && <p>File ID: {fileId}</p>}
    </div>
  );
};
```

---

## 6. List Files

### Endpoint
```
GET /research/files
```

### Description
Returns a paginated list of Research File objects. Use this to view all previously uploaded files.

### Request Headers
- `Authorization: Bearer <token>` (Required)

### Query Parameters
- `page` (integer, Optional): 1-based page index (default: 1, min: 1)
- `limit` (integer, Optional): Page size/items per page (default: 10, min: 1, max: 200)

### Response (200 - Success)
```typescript
{
  data: Array<{                        // List of file objects
    id: string;                        // UUID: Unique identifier for the file
    file_name: string;                 // Original uploaded filename
    content_type: string;              // MIME type (e.g., "application/pdf")
  }>;
  pagination: {
    limit: number;                     // Items per page
    page: number;                      // Current page (1-based)
    has_next: boolean;                 // True if more pages available
    total?: number;                    // Total number of items (optional)
  };
}
```

### Error Responses
- `401` - Unauthorized Error (invalid/missing API key)
- `500` - Internal Server Error (server-side issue)

### Example cURL
```bash
curl -G https://api.caesar.xyz/research/files \
  -H "Authorization: Bearer <token>" \
  -d page=1 \
  -d limit=10
```

### Example Response
```json
{
  "data": [
    {
      "id": "9c6f8b1a-2a4f-4a35-86b9-0d0b5e25d5e5",
      "file_name": "document.pdf",
      "content_type": "application/pdf"
    },
    {
      "id": "1a2b3c4d-1111-2222-3333-444455556666",
      "file_name": "notes.txt",
      "content_type": "text/plain"
    }
  ],
  "pagination": {
    "limit": 10,
    "page": 1,
    "has_next": true
  }
}
```

---

## Implementation Notes

### Use Cases
- **File Library**: Display all uploaded files for reuse
- **File Selection**: Let users select from previously uploaded files
- **File Management**: Track and organize uploaded documents
- **Duplicate Prevention**: Check if file already exists before uploading

### Pagination Best Practices
```typescript
// Fetch all files across multiple pages
const getAllFiles = async () => {
  let page = 1;
  let allFiles = [];
  
  do {
    const response = await Caesar.listFiles(page, 50);
    allFiles.push(...response.data);
    
    if (!response.pagination.has_next) break;
    page++;
  } while (page < 20); // Safety limit
  
  return allFiles;
};
```

### File Filtering
```typescript
// Get only PDF files
const response = await Caesar.listFiles(1, 100);
const pdfFiles = response.data.filter(file => 
  file.content_type === 'application/pdf'
);

// Search by filename
const searchFiles = (files: any[], query: string) => {
  return files.filter(file => 
    file.file_name.toLowerCase().includes(query.toLowerCase())
  );
};
```

### Caching Strategy
- Cache file list locally to reduce API calls
- Refresh cache after new uploads
- Store file IDs for quick reference in research jobs

---

## TypeScript Client Implementation

```typescript
// List all uploaded files
const response = await Caesar.listFiles(1, 25);

console.log(`Found ${response.data.length} files`);
console.log(`Has more pages: ${response.pagination.has_next}`);

// Display files
response.data.forEach(file => {
  console.log(`${file.file_name} (${file.content_type}) - ID: ${file.id}`);
});
```

### Example: File Selector UI

```typescript
// Build file selector for UI
const FileSelector = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await Caesar.listFiles(1, 100);
        setFiles(response.data);
      } catch (error) {
        console.error('Failed to load files:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFiles();
  }, []);
  
  if (loading) return <div>Loading files...</div>;
  
  return (
    <select>
      <option value="">Select a file...</option>
      {files.map(file => (
        <option key={file.id} value={file.id}>
          {file.file_name}
        </option>
      ))}
    </select>
  );
};
```

### Example: File Library with Search

```typescript
// Complete file library implementation
const FileLibrary = () => {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const loadFiles = async (pageNum: number) => {
    const response = await Caesar.listFiles(pageNum, 20);
    setFiles(prev => pageNum === 1 ? response.data : [...prev, ...response.data]);
    setHasMore(response.pagination.has_next);
  };
  
  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <div className="file-list">
        {filteredFiles.map(file => (
          <div key={file.id} className="file-item">
            <span>{file.file_name}</span>
            <span className="file-type">{file.content_type}</span>
            <button onClick={() => useFileInResearch(file.id)}>
              Use in Research
            </button>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <button onClick={() => {
          const nextPage = page + 1;
          setPage(nextPage);
          loadFiles(nextPage);
        }}>
          Load More
        </button>
      )}
    </div>
  );
};
```

---

## Complete API Reference Summary

### Available Endpoints

1. **POST /research** - Create research job
2. **GET /research/:id** - Retrieve research object
3. **GET /research/:id/results/:resultId/content** - Get raw result content
4. **GET /research** - List research jobs
5. **POST /research/files** - Upload file
6. **GET /research/files** - List files

### Typical Workflow

```typescript
// 1. Optional: Upload files
const file = await Caesar.uploadFile(pdfFile, "document.pdf");

// 2. Create research job
const job = await Caesar.createResearch({
  query: "Analyze this document",
  files: [file.id],
  compute_units: 2,
  system_prompt: "Return JSON with summary and key_points"
});

// 3. Poll for completion
const result = await Caesar.pollUntilComplete(job.id);

// 4. Parse results
const analysis = JSON.parse(result.transformed_content);
const sources = result.results;

// 5. Optional: Get full source content
for (const source of sources) {
  const fullContent = await Caesar.getRawResultContent(job.id, source.id);
  console.log(fullContent.content);
}
```

---

*Caesar API Reference Complete*
