# Design Document

## Overview

The Documentation Time Sync system provides automated and manual tools for maintaining temporal accuracy across project documentation. It classifies documentation into living and historical categories, updates timestamps appropriately, verifies system claims, and establishes sustainable policies for ongoing maintenance.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Documentation Time Sync                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Classifier   │  │   Updater    │  │  Verifier    │      │
│  │              │  │              │  │              │      │
│  │ - Pattern    │  │ - Timestamp  │  │ - API Tests  │      │
│  │   Matching   │  │   Updates    │  │ - Version    │      │
│  │ - Content    │  │ - Metadata   │  │   Checks     │      │
│  │   Analysis   │  │   Sync       │  │ - Status     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Orchestrator  │                        │
│                    │                │                        │
│                    │ - Workflow     │                        │
│                    │ - Backup       │                        │
│                    │ - Reporting    │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │   Policy     │  │   Automation │  │   Reporter   │     │
│  │   Engine     │  │              │  │              │     │
│  │              │  │ - Git Hooks  │  │ - Change Log │     │
│  │ - Rules      │  │ - Scheduled  │  │ - Metrics    │     │
│  │ - Registry   │  │   Tasks      │  │ - Alerts     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Document Classifier

**Purpose**: Categorize documentation files as living or historical

**Interface**:
```typescript
interface DocumentClassifier {
  classify(filePath: string): DocumentType;
  getClassificationRules(): ClassificationRule[];
  addCustomRule(rule: ClassificationRule): void;
}

enum DocumentType {
  LIVING = 'living',
  HISTORICAL = 'historical',
  AMBIGUOUS = 'ambiguous'
}

interface ClassificationRule {
  pattern: RegExp;
  type: DocumentType;
  priority: number;
  description: string;
}
```

**Classification Rules**:
- `*.md` in `.kiro/steering/` → LIVING
- `*-COMPLETE.md` → HISTORICAL
- `*-FIX.md` → HISTORICAL
- `*-SUMMARY.md` → HISTORICAL
- `*-GUIDE.md` → LIVING
- `*-STATUS.md` → LIVING
- `README.md` → LIVING

### 2. Timestamp Updater

**Purpose**: Update date metadata in documentation files

**Interface**:
```typescript
interface TimestampUpdater {
  updateLastUpdated(filePath: string, date: Date): Promise<void>;
  addLastVerified(filePath: string, date: Date): Promise<void>;
  preserveOriginalDate(filePath: string): Promise<void>;
  updateMultiple(files: FileUpdate[]): Promise<UpdateResult[]>;
}

interface FileUpdate {
  path: string;
  updateType: 'last-updated' | 'last-verified' | 'preserve';
  date: Date;
}

interface UpdateResult {
  path: string;
  success: boolean;
  oldDate?: string;
  newDate?: string;
  error?: string;
}
```

**Update Patterns**:
- `**Last Updated**: January 27, 2025` → `**Last Updated**: November 23, 2025`
- Add `**Last Verified**: November 23, 2025` to status sections
- Preserve `**Completed**: January 27, 2025` in historical docs

### 3. System Verifier

**Purpose**: Verify documentation claims against actual system state

**Interface**:
```typescript
interface SystemVerifier {
  verifyAPIs(apiList: string[]): Promise<APIVerificationResult[]>;
  verifyVersions(versionClaims: VersionClaim[]): Promise<VersionVerificationResult[]>;
  verifyFeatures(features: string[]): Promise<FeatureVerificationResult[]>;
  generateVerificationReport(): Promise<VerificationReport>;
}

interface APIVerificationResult {
  apiName: string;
  claimed: 'working' | 'not-working';
  actual: 'working' | 'not-working' | 'unknown';
  responseTime?: number;
  lastChecked: Date;
}

interface VerificationReport {
  timestamp: Date;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: string[];
  details: VerificationResult[];
}
```

### 4. Workflow Orchestrator

**Purpose**: Coordinate the entire documentation sync process

**Interface**:
```typescript
interface WorkflowOrchestrator {
  execute(options: SyncOptions): Promise<SyncResult>;
  createBackup(): Promise<string>;
  rollback(backupId: string): Promise<void>;
  dryRun(options: SyncOptions): Promise<SyncPreview>;
}

interface SyncOptions {
  updateSteering: boolean;
  createStatusReport: boolean;
  verifySystem: boolean;
  createPolicy: boolean;
  dryRun: boolean;
}

interface SyncResult {
  success: boolean;
  filesUpdated: number;
  filesPreserved: number;
  backupPath: string;
  reportPath: string;
  errors: string[];
  warnings: string[];
}
```

### 5. Policy Engine

**Purpose**: Manage and enforce documentation policies

**Interface**:
```typescript
interface PolicyEngine {
  loadPolicy(): DocumentationPolicy;
  validateFile(filePath: string): PolicyValidation;
  enforcePolicy(filePath: string): Promise<void>;
  generatePolicyDocument(): string;
}

interface DocumentationPolicy {
  livingDocPatterns: string[];
  historicalDocPatterns: string[];
  updateRules: UpdateRule[];
  verificationSchedule: VerificationSchedule;
}

interface PolicyValidation {
  compliant: boolean;
  violations: string[];
  suggestions: string[];
}
```

## Data Models

### File Metadata

```typescript
interface FileMetadata {
  path: string;
  type: DocumentType;
  dates: {
    created?: Date;
    lastUpdated?: Date;
    completed?: Date;
    lastVerified?: Date;
  };
  status: 'current' | 'stale' | 'historical';
  verificationStatus?: 'verified' | 'unverified' | 'failed';
}
```

### Classification Registry

```typescript
interface ClassificationRegistry {
  rules: ClassificationRule[];
  customRules: ClassificationRule[];
  fileCache: Map<string, DocumentType>;
  lastUpdated: Date;
}
```

### Backup Manifest

```typescript
interface BackupManifest {
  id: string;
  timestamp: Date;
  files: BackupFile[];
  reason: string;
  canRollback: boolean;
}

interface BackupFile {
  originalPath: string;
  backupPath: string;
  hash: string;
  size: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Classification Consistency

*For any* documentation file, if it is classified as "living" or "historical", then re-classifying it with the same rules should produce the same result.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Timestamp Preservation

*For any* file classified as "historical", updating the documentation system should never modify its original completion date.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Backup Completeness

*For any* documentation sync operation, the backup should contain all files that will be modified, and restoring from backup should return the system to its pre-sync state.

**Validates: Requirements 8.1, 8.2, 8.4**

### Property 4: Update Atomicity

*For any* set of steering files, if the update operation begins, then either all files are updated successfully or none are updated (all-or-nothing).

**Validates: Requirements 2.4**

### Property 5: Verification Accuracy

*For any* system claim in documentation (API working, version number, feature operational), the verification result should match the actual system state at the time of verification.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 6: Date Monotonicity

*For any* living documentation file, each "Last Updated" timestamp should be greater than or equal to the previous "Last Updated" timestamp (dates only move forward).

**Validates: Requirements 2.1, 6.1**

### Property 7: Policy Compliance

*For any* documentation file, if it matches a policy pattern, then the system should enforce the corresponding update rule without exception.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 8: Rollback Idempotence

*For any* backup, rolling back and then rolling back again should have no additional effect (the system state after one rollback equals the state after multiple rollbacks).

**Validates: Requirements 8.4**

### Property 9: Report Completeness

*For any* documentation sync operation, the change report should list every file that was modified, with no omissions and no duplicates.

**Validates: Requirements 9.1, 9.2, 9.4**

### Property 10: Stale Detection Accuracy

*For any* documentation file with a "Last Updated" date more than 90 days old, the stale detection system should flag it for review.

**Validates: Requirements 10.2, 10.3**

## Error Handling

### Classification Errors
- **Ambiguous files**: Flag for manual review, do not modify
- **Missing metadata**: Attempt to infer from git history, flag if uncertain
- **Invalid patterns**: Log error, skip file, continue processing

### Update Errors
- **File locked**: Retry up to 3 times with exponential backoff
- **Permission denied**: Log error, skip file, report in summary
- **Invalid date format**: Attempt to parse multiple formats, flag if all fail

### Verification Errors
- **API timeout**: Mark as "unknown", retry once, report in verification log
- **Network failure**: Mark as "unverified", do not update documentation
- **Version mismatch**: Flag as critical, require manual resolution

### Backup Errors
- **Insufficient disk space**: Abort operation, alert user
- **Backup corruption**: Verify checksums, recreate if needed
- **Rollback failure**: Attempt file-by-file restoration, report partial success

## Testing Strategy

### Unit Testing

**Classifier Tests**:
- Test pattern matching for all file types
- Test priority resolution for overlapping patterns
- Test custom rule addition and removal

**Updater Tests**:
- Test date format parsing and replacement
- Test preservation of historical dates
- Test atomic multi-file updates

**Verifier Tests**:
- Test API endpoint checking with mocked responses
- Test version comparison logic
- Test report generation with various result sets

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript)

**Test Configuration**: Minimum 100 iterations per property

**Property Test 1: Classification Consistency**
```typescript
// Feature: documentation-time-sync, Property 1: Classification Consistency
// Validates: Requirements 1.1, 1.2, 1.3

fc.assert(
  fc.property(
    fc.string(), // file path
    (filePath) => {
      const classifier = new DocumentClassifier();
      const result1 = classifier.classify(filePath);
      const result2 = classifier.classify(filePath);
      return result1 === result2;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 2: Timestamp Preservation**
```typescript
// Feature: documentation-time-sync, Property 2: Timestamp Preservation
// Validates: Requirements 3.1, 3.2, 3.3

fc.assert(
  fc.property(
    fc.record({
      path: fc.string(),
      originalDate: fc.date(),
      content: fc.string()
    }),
    async ({ path, originalDate, content }) => {
      // Create historical file with original date
      const file = createHistoricalFile(path, originalDate, content);
      
      // Run documentation sync
      await syncDocumentation({ updateSteering: true });
      
      // Verify original date unchanged
      const updatedFile = readFile(path);
      return extractCompletedDate(updatedFile) === originalDate;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 3: Backup Completeness**
```typescript
// Feature: documentation-time-sync, Property 3: Backup Completeness
// Validates: Requirements 8.1, 8.2, 8.4

fc.assert(
  fc.property(
    fc.array(fc.record({
      path: fc.string(),
      content: fc.string()
    })),
    async (files) => {
      // Create files
      files.forEach(f => writeFile(f.path, f.content));
      
      // Create backup
      const backupId = await createBackup();
      
      // Modify files
      files.forEach(f => writeFile(f.path, 'modified'));
      
      // Rollback
      await rollback(backupId);
      
      // Verify all files restored
      return files.every(f => readFile(f.path) === f.content);
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing

**End-to-End Workflow Test**:
1. Create test documentation set with mixed living/historical files
2. Run full sync operation
3. Verify steering files updated
4. Verify historical files preserved
5. Verify status report created
6. Verify policy document created
7. Verify change report accurate

**Rollback Test**:
1. Create initial documentation state
2. Run sync operation
3. Verify changes applied
4. Trigger rollback
5. Verify exact restoration of initial state

**Verification Test**:
1. Mock API endpoints with known responses
2. Create documentation with API status claims
3. Run verification
4. Verify accurate detection of working/broken APIs
5. Verify report generation

## Implementation Notes

### File Processing Order

1. **Backup Phase**: Create backup of all files to be modified
2. **Classification Phase**: Classify all documentation files
3. **Verification Phase**: Verify system claims (if enabled)
4. **Update Phase**: Update living documentation timestamps
5. **Creation Phase**: Create new status report and policy
6. **Reporting Phase**: Generate change report and metrics

### Performance Considerations

- **Parallel Processing**: Classify and verify files in parallel where possible
- **Caching**: Cache classification results to avoid re-analyzing unchanged files
- **Incremental Updates**: Only process files modified since last sync
- **Batch Operations**: Update multiple files in single git commit

### Security Considerations

- **Backup Encryption**: Encrypt backups containing sensitive information
- **Access Control**: Require appropriate permissions for sync operations
- **Audit Trail**: Log all modifications with user, timestamp, and reason
- **Validation**: Validate all file paths to prevent directory traversal

## Deployment Strategy

### Phase 1: Manual Execution (Immediate)
- Provide CLI tool for one-time sync
- Generate reports for review
- Allow dry-run mode for preview

### Phase 2: Automated Monitoring (Week 2)
- Implement git hooks for automatic updates
- Set up scheduled stale detection
- Configure CI/CD integration

### Phase 3: Continuous Maintenance (Ongoing)
- Monitor documentation health metrics
- Alert on stale documentation
- Periodic verification of system claims
