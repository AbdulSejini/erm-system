# ERM System - Enterprise Risk Management

## Project Overview
A comprehensive Enterprise Risk Management (ERM) system built with Next.js 16, featuring bilingual support (Arabic/English), dark mode, and a modern UI design.

## Tech Stack
- **Framework**: Next.js 16.1.3 with App Router
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with CSS Variables
- **Language**: TypeScript
- **Deployment**: Vercel

## Project Structure
```
src/
├── app/
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── risks/        # Risk register
│   │   ├── treatment/    # Treatment plans
│   │   ├── treatment-monitoring/ # Treatment monitoring dashboard
│   │   ├── dashboard/    # Main dashboard
│   │   ├── assessment/   # Risk assessment
│   │   ├── reports/      # Reports & analytics
│   │   └── settings/     # System settings
│   ├── api/              # API routes
│   └── login/            # Authentication
├── components/
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components (Header, Sidebar)
├── contexts/             # React contexts
├── lib/                  # Utilities and configurations
├── locales/              # Translation files (ar.json, en.json)
└── types/                # TypeScript type definitions
```

## Key Features

### 1. Risk Management
- Risk register with CRUD operations
- Risk categorization and classification
- Inherent and residual risk assessment (5x5 matrix)
- Risk status tracking (Open, In Treatment, Mitigated, Closed)

### 2. Treatment Plans
- Create treatment plans linked to risks
- Treatment strategies: Avoid, Reduce, Transfer, Accept
- Task management within treatment plans
- Progress tracking and monitoring
- **Justification field** for documenting reasons for treatment

### 3. Residual Risk Governance
- **Residual risk is READ-ONLY** in risk edit modal
- Changes to residual risk require creating a treatment plan
- When treatment plan is completed with expected residual values:
  - Auto-approved if completed by Risk Manager/Admin
  - Requires approval from Risk Manager for other users
- Notification system alerts risk managers of pending approvals

### 4. Notification System
- Real-time notifications via API polling (30s interval)
- Animated notification bell with:
  - Ring animation on new notifications
  - Pulsing badge for unread count
  - Glow effect when unread notifications exist
- Notification types:
  - `residual_risk_approval` - Approval requests for residual risk changes
  - `residual_risk_approved` - Approval confirmation
  - `residual_risk_rejected` - Rejection notification

### 5. User Roles
- `admin` - Full system access
- `riskManager` - Risk management and approvals
- `riskAnalyst` - Risk analysis
- `riskChampion` - Department risk champion
- `executive` - Executive reporting access
- `employee` - Basic access

## Database Models (Key)

### Risk
```prisma
model Risk {
  id                    String
  riskNumber            String    @unique
  titleAr               String
  titleEn               String
  inherentLikelihood    Int
  inherentImpact        Int
  inherentScore         Int
  inherentRating        String
  residualLikelihood    Int
  residualImpact        Int
  residualScore         Int
  residualRating        String
  status                String
  // ... relations
}
```

### TreatmentPlan
```prisma
model TreatmentPlan {
  id                          String
  riskId                      String
  titleAr                     String
  titleEn                     String
  strategy                    String    // avoid, reduce, transfer, accept
  status                      String    // notStarted, inProgress, completed
  justificationAr             String?   // Reason/comment for treatment
  justificationEn             String?
  expectedResidualLikelihood  Int?      // Expected residual after treatment
  expectedResidualImpact      Int?
  expectedResidualScore       Int?
  expectedResidualRating      String?
  // ... relations
}
```

### ResidualRiskChangeRequest
```prisma
model ResidualRiskChangeRequest {
  id                  String
  riskId              String
  requesterId         String
  treatmentPlanId     String?
  currentLikelihood   Int?
  currentImpact       Int?
  proposedLikelihood  Int
  proposedImpact      Int
  justificationAr     String
  justificationEn     String?
  status              String    // pending, approved, rejected, auto_approved
  requestType         String    // manual, treatment_completion
  // ... relations
}
```

## API Endpoints

### Risks
- `GET /api/risks` - List all risks
- `POST /api/risks` - Create risk
- `PATCH /api/risks/[id]` - Update risk
- `DELETE /api/risks/[id]` - Delete risk

### Treatment Plans
- `GET /api/risks/[id]/treatments` - List treatments for a risk
- `POST /api/risks/[id]/treatments` - Create treatment plan
- `PATCH /api/risks/[id]/treatments/[treatmentId]` - Update treatment
- `DELETE /api/risks/[id]/treatments/[treatmentId]` - Delete treatment

### Residual Risk Requests
- `POST /api/residual-risk-requests` - Create change request
- `GET /api/residual-risk-requests` - List requests (filtered by role)
- `PATCH /api/residual-risk-requests/[id]` - Approve/reject request

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark all as read
- `POST /api/notifications` - Create notification (internal)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Push Prisma schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Environment Variables
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Recent Updates

### Risk Creation Wizard & Approval Workflow (Latest)
1. **New Risk Approval Workflow**:
   - When any user creates a new risk, it's sent to Risk Manager for approval
   - Submit button: "إرسال لمدير المخاطر للموافقة" / "Send to Risk Manager for Approval"
   - Double-click prevention on submit button
   - Notifications sent to all Risk Managers when new risk is submitted

2. **Risk Approval Page** (`/risk-approvals`):
   - Accessible to Risk Managers and Admins only
   - Shows pending approval requests
   - Four approval actions:
     - **قبول (Approve)**: Risk is approved and active
     - **رفض (Reject)**: Risk is rejected, status returns to Draft
     - **طلب تعديل (Request Revision)**: User notified to make changes
     - **تأجيل (Defer)**: Review postponed, status set to "Under Discussing"
   - Optional reviewer notes for each action
   - Full risk details displayed before decision

3. **Risk Wizard Form Changes**:
   - **Process & Sub-Process**: Changed from dropdown to free text input
   - **Potential Cause**: Required (Arabic OR English)
   - **Potential Impact**: Required (Arabic OR English)
   - **Existing Controls**: Renamed from "Layers of Protection" / "طبقات الحماية" to "الضوابط الحالية"
   - **Risk Owner**: Now reads from `RiskOwner` table (not `User` table)
   - **Risk Champion**: Filtered to show only users with `riskChampion` role

4. **New Database Model** - `RiskApprovalRequest`:
   ```prisma
   model RiskApprovalRequest {
     id              String    @id
     riskId          String    @unique
     requesterId     String
     status          String    // pending, approved, rejected, deferred, revision_requested
     reviewerId      String?
     reviewNoteAr    String?
     reviewNoteEn    String?
     reviewedAt      DateTime?
   }
   ```

5. **New API Endpoints**:
   - `GET /api/risk-approval-requests` - List approval requests
   - `POST /api/risk-approval-requests` - Create approval request (when risk is submitted)
   - `GET /api/risk-approval-requests/[id]` - Get single request
   - `PATCH /api/risk-approval-requests/[id]` - Review request (approve/reject/defer/revision)

6. **New Notification Types**:
   - `risk_approval_pending` - Sent to Risk Managers when new risk submitted
   - `risk_approved` - Sent to requester when risk is approved
   - `risk_rejected` - Sent to requester when risk is rejected
   - `risk_deferred` - Sent to requester when review is deferred
   - `risk_revision_requested` - Sent to requester when revision is needed

### Treatment Plan Wizard Validation
1. **Step 1 - Required Fields**:
   - Risk selection (required)
   - Responsible person (required) - moved from Step 2
2. **Step 3 - Task Required Fields**:
   - Assigned To / المكلف (required)
   - Title in Arabic OR English (at least one required)
   - Task Description (required)
3. **OneDrive/SharePoint Attachments for Tasks**:
   - **Inline URL paste** - no modal, no OAuth required
   - Auto-adds attachment when valid URL is pasted
   - Visual feedback: green border on valid URL, red on invalid
   - Quick access buttons:
     - OneDrive: `https://onedrive.live.com/`
     - SharePoint: `https://saudicableco.sharepoint.com/sites/Debtors`
   - Supported domains:
     - `onedrive.live.com`, `1drv.ms`
     - `sharepoint.com` (all subdomains)
     - `saudicable.sharepoint.com`, `saudicable-my.sharepoint.com`
     - `saudicableco.sharepoint.com`, `saudicableco-my.sharepoint.com`
     - `sceco.sharepoint.com`, `sceco-my.sharepoint.com`
   - Component: `/src/components/OneDrivePicker.tsx`

### Treatment Plan Permissions
- **Who can create treatment plans**:
  - `admin` - Full access
  - `riskManager` - Risk management access
  - `riskChampion` - Department risk champions
  - `riskAnalyst` - Risk analysts
  - Users in Risk Management department (name contains "risk" or "مخاطر")
- API check in `/api/risks/[id]/treatments/route.ts`
- Error message shown if unauthorized

### Risk Owner Management Permissions
- **Who can add/edit/delete risk owners**:
  - `admin` - Full access
  - `riskManager` - Risk management access
  - `riskAnalyst` - Risk analysts
- API check in `/api/risk-owners/route.ts` and `/api/risk-owners/[id]/route.ts`
- GET requests allowed for all authenticated users
- POST/PATCH/DELETE require admin, riskManager, or riskAnalyst role

### Email Copy Feature (After Treatment Plan Creation)
- Modal appears after successful treatment plan creation
- Allows copying email information to send to responsible person:
  - **Copy Subject**: Email subject with risk number and title
  - **Copy Body**: Full email body with plan details, tasks count, and link
  - **Copy All**: Both subject and body
  - **Copy Link Only**: Direct link to treatment plan
  - **Open Email**: Opens default email client with pre-filled data
- Bilingual support (Arabic/English)
- Visual feedback for copy actions (green checkmark)

### Residual Risk Governance
1. **Treatment Plan Justification**: Added `justificationAr`/`justificationEn` fields to treatment plans for documenting reasons
2. **Read-Only Residual Risk**: Residual risk section in risk edit modal is now read-only with info message
3. **Approval Workflow**:
   - Users must create treatment plans to modify residual risk
   - Treatment completion triggers residual risk update request
   - Auto-approval for Risk Manager/Admin
   - Notification sent to risk managers for other users

### Animated Notification Bell
- Bell ring animation on new notifications
- Pulsing badge count
- Glow effect for unread notifications
- 30-second polling interval

### Treatment Monitoring Page
- `/treatment-monitoring` - Comprehensive treatment tracking
- Stats dashboard with animated counters
- Filter by status, priority, department, responsible
- Progress visualization

### Treatment Task Assignment (Fixed)
- **Task Assignment Fields**:
  - `actionOwnerId` - منفذ الإجراء (من ملاك المخاطر / RiskOwner)
  - `monitorOwnerId` - متابع التنفيذ (من ملاك المخاطر / RiskOwner)
  - `assignedToId` - للتوافق القديم مع Users (deprecated)
  - `monitorId` - للتوافق القديم مع Users (deprecated)
- **Task creation now properly saves**:
  - Task titles (Arabic and/or English)
  - Task descriptions
  - Assigned to (actionOwnerId from RiskOwner)
  - Monitor (monitorOwnerId from RiskOwner)
  - OneDrive/SharePoint attachments
- API endpoints updated: `/api/risks/[id]/treatments/[treatmentId]/tasks`

### Treatment Plan Wizard Data Flow
- **Justification fields** (`justificationAr`, `justificationEn`) are saved to database
- **Tasks** are created after treatment plan creation via separate API calls
- **Data flow**:
  1. Step 1: Risk & Responsible selection
  2. Step 2: Strategy, Priority, Dates, Justification, Residual Risk
  3. Step 3: Tasks with assignee/monitor from RiskOwner
  4. Save: POST treatment plan → POST tasks sequentially

### Treatment Plan Edit Mode (Fixed)
- When editing a treatment plan, all existing data is now loaded:
  - `responsibleId` - المسؤول عن الخطة
  - `justificationAr/En` - التبرير/مسببات التعديل
  - `expectedResidualLikelihood/Impact` - إعادة تقييم الخطر المتبقي
  - Task details: `actionOwnerId`, `monitorOwnerId`, `description`, `oneDriveUrl`
- Risk selection is preserved (not editable after creation)

### Risk Details Page - Treatment Plans Display
- Full treatment plan details shown on `/risks/[id]` page
- Includes:
  - Justification section (تعليق / مسببات التعديل)
  - Plan details: responsible, dates, progress, priority
  - Task list with full details:
    - Task title (Arabic + English)
    - Task description
    - Assigned to (المكلف) with email
    - Monitor (المتابع) with email
    - Due date, completion date, status, priority
- Print-friendly styling for PDF export
- Use browser print (Ctrl+P) → Save as PDF

## Localization
- Arabic (default): `/src/locales/ar.json`
- English: `/src/locales/en.json`
- RTL support for Arabic
- Language context: `useTranslation()` hook

## Component Library
Located in `/src/components/ui/`:
- Button, Badge, Card, Input
- Modal, Select, Table
- Tabs, Textarea, Avatar
- Loading states and animations

## Notes for Development
1. Always run `npx prisma db push` after schema changes
2. Run `npm run build` before deploying to check for TypeScript errors
3. Translations must be added to both `ar.json` and `en.json`
4. Use `isAr` from `useTranslation()` to contextually render content
5. Residual risk changes MUST go through treatment plans - direct editing is disabled

## Deployment
- **GitHub Repository**: https://github.com/AbdulSejini/erm-system
- **Vercel URL**: https://erm-system-jet.vercel.app
- **Auto-deploy**: Enabled on push to main branch
- After pushing schema changes, run `npx prisma db push` locally (uses production DATABASE_URL from .env)

## Security & Performance Features

### Rate Limiting
- **Location**: `/src/lib/rate-limit.ts`
- **Implementation**: In-memory rate limiter for API routes
- **Configurations**:
  - `standard`: 100 requests/minute (general APIs)
  - `auth`: 10 requests/minute (authentication)
  - `write`: 30 requests/minute (create/update/delete)
  - `heavy`: 10 requests/minute (reports/exports)
- **Usage in API**:
  ```typescript
  import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(`endpoint-${clientIP}`, rateLimitConfigs.standard);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  ```

### API Pagination
- **Risks API** (`/api/risks`) supports pagination:
  - `?page=1&limit=10` - Get page 1 with 10 items
  - `?limit=0` or no limit param - Returns all (backward compatible)
- **Response includes pagination info**:
  ```json
  {
    "success": true,
    "data": [...],
    "count": 10,
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15,
      "hasMore": true
    }
  }
  ```

### Database Indexes
- **Risk Model Indexes**:
  - `categoryId`, `departmentId`, `status`, `statusId`
  - `approvalStatus`, `inherentRating`, `sourceId`
  - `riskOwnerId`, `isDeleted`, `createdAt`
  - `inherentScore`, `residualScore`, `ownerId`, `championId`
- Run `npx prisma db push` after schema changes to apply indexes

### Online Users Tracking
- **Timeout**: 5 minutes (user considered offline after 5 min of inactivity)
- **Heartbeat**: Sent every 2 minutes from client
- **Location**: `/api/users/online` and `/src/components/layout/Sidebar.tsx`

### Treatment Plan Task Details (Fixed)
- **Task Display** (`/treatment/[id]`):
  - Shows task description (Arabic/English)
  - Shows assigned person (المكلف) with name and email
  - Shows monitor (المتابع) with name and email
  - Shows OneDrive/SharePoint attachment links
- **Task Editing**:
  - Full form for editing all task fields
  - Dropdown selection for assignee/monitor from RiskOwner list
  - OneDrive URL input field

### Treatment Plan Tasks Fix (Latest)
- **Problem**: Tasks were not saving when creating new treatment plans
- **Root Cause**: New tasks had IDs starting with `task-` but code checked for `temp-`
- **Solution**: Updated code to recognize both `temp-` and `task-` prefixes as temporary IDs
- **Location**: `/src/app/(dashboard)/treatment/page.tsx`

### Treatment Plan PDF Export
- **Button Location**: Treatment detail page (`/treatment/[id]`)
- **How to Use**: Click "PDF" button → Opens browser print dialog → Save as PDF
- **Design**: Saudi Cable Company branded theme
  - Orange (#F39200) accent color
  - Company header and footer
  - Professional formatting
  - RTL support for Arabic
- **Print Styles**: Embedded CSS in `/treatment/[id]/page.tsx`
- **Features**:
  - Hides navigation, buttons, and sidebars
  - Shows treatment plan details
  - Lists all tasks with assignees and monitors
  - Includes risk scores and progress

### Email Template Enhancement
- **Location**: Treatment detail page (`/treatment/[id]`) → "Email Template" button
- **Fixed**: Monitor name and email now correctly pulled from `monitorOwner` field
- **Includes for each task**:
  - Assigned To (المكلف) with email
  - Monitor (المتابع) with email
  - Due date and status
- **Copy Options**:
  - Copy email address
  - Copy subject
  - Copy body
  - Copy all
  - Open in email client

### User Impersonation (Admin Only) - Latest
- **Feature**: System Admin can view the system as another user to verify their permissions
- **Location**: Header → UserCog icon button (visible only for admin role)
- **Components**:
  - `/src/app/api/admin/impersonate/route.ts` - API for starting/ending impersonation
  - `/src/contexts/ImpersonationContext.tsx` - State management for impersonation
  - `/src/hooks/useImpersonatedFetch.ts` - Helper hook for API calls with impersonation
- **How It Works**:
  1. Admin clicks UserCog icon in header
  2. Modal shows list of all users with search
  3. Admin selects a user to view as
  4. Orange banner appears showing impersonation status
  5. All API calls use the impersonated user's permissions
  6. Click "Exit View" to return to admin account
- **Security**:
  - Only `admin` role can use this feature
  - All impersonation actions are logged in audit trail
  - Uses `X-Impersonate-User-Id` header for API calls
  - State persists in localStorage (cleared on exit)
- **UI Elements**:
  - UserCog button in header (admin only)
  - User selection modal with search
  - Orange impersonation banner with user info
  - "Exit View" button to end impersonation
- **Audit Actions** (in `/src/lib/audit.ts`):
  - `impersonate_start` - When admin starts viewing as another user
  - `impersonate_end` - When admin exits impersonation mode

### Risk Access Permissions (riskChampion)
- **riskChampion users** can only see risks in:
  - Departments assigned to them (`allowedDepartmentIds`)
  - Risks where they are the champion (`championId`)
  - Risks where they are the owner (`ownerId`)
- **Important**: If a riskChampion has no departments assigned, they will only see risks directly assigned to them
- **API Location**: `/api/risks/route.ts` lines 112-133

### Task Updates Feature (Latest)
- **Feature**: Users can add updates/comments to treatment plan tasks
- **Database Model** (`TaskUpdate`):
  ```prisma
  model TaskUpdate {
    id          String    @id
    taskId      String
    authorId    String
    content     String    // Update content
    type        String    // update, statusChange, comment, progress
    oldStatus   String?   // Old status (for status changes)
    newStatus   String?   // New status (for status changes)
    progress    Int?      // Progress percentage
    attachmentUrl   String?   // OneDrive/SharePoint link
    attachmentName  String?   // Attachment name
    createdAt   DateTime
  }
  ```
- **API Endpoint**: `/api/tasks/[taskId]/updates`
  - `GET` - Fetch all updates for a task
  - `POST` - Add new update (content, type, newStatus, progress, attachmentUrl)
  - `DELETE` - Delete update (author or admin/riskManager only)
- **UI Enhancements** (`/treatment/[id]`):
  - Improved task cards with color-coded sections
  - Task number badge with visual hierarchy
  - Expandable updates section per task
  - Real-time update submission
  - Time-ago formatting for update timestamps
  - Status change history display
  - Support for attachments in updates
- **Components Used**:
  - MessageSquare, Send, ChevronDown, ChevronUp, History, Paperclip icons
  - Collapsible updates section with animation
  - Textarea for new updates
  - Avatar with initial letter for authors
- **Translations Added**:
  - Arabic: `treatment.taskUpdates.*`
  - English: `treatment.taskUpdates.*`

### Task Workflow Steps Feature (Latest)
- **Feature**: Users can add workflow steps (sub-tasks) to treatment plan tasks
- **Use Case**: When a task starts with one approach but the solution changes during execution
- **Database Model** (`TaskStep`):
  ```prisma
  model TaskStep {
    id          String    @id
    taskId      String
    createdById String    // Who created the step
    title       String    // Step title
    description String?   // Optional description
    status      String    // pending, inProgress, completed, cancelled
    order       Int       // Step order
    dueDate     DateTime? // Optional due date
    completedAt DateTime? // Completion date
    completedById String? // Who completed it
    attachmentUrl   String?   // OneDrive/SharePoint link
    attachmentName  String?   // Attachment name
    createdAt   DateTime
  }
  ```
- **API Endpoint**: `/api/tasks/[taskId]/steps`
  - `GET` - Fetch all steps for a task (ordered)
  - `POST` - Add new step (title, description, dueDate, attachmentUrl)
  - `PATCH` - Update step (status, title, description)
  - `DELETE` - Delete step (creator or admin/riskManager only)
- **UI Features** (`/treatment/[id]`):
  - Green-themed collapsible "Workflow Steps" section
  - Input field to add new steps quickly
  - Step cards with numbered badges
  - Status indicators: pending (gray), in progress (blue), completed (green)
  - Quick action buttons: Start, Complete, Undo, Delete
  - Progress badge showing completed/total steps (e.g., 3/5)
  - Creator and completer attribution
  - Strikethrough text for completed steps
- **Translations Added**:
  - Arabic: `treatment.taskSteps.*`
  - English: `treatment.taskSteps.*`

### Treatment Plan Redesign (Latest)
- **Complete redesign of `/treatment/[id]` page**
- **Single Page Layout**: All sections in one scrollable page (no tabs)
  - Overview Section (Hero with progress, scores)
  - Tasks Section (with workflow steps and updates)
  - Risk Details Section
  - Discussions Section (NEW)
  - Change Log Section (NEW)
- **New Features Added**:
  1. **Treatment Plan Change Log** - Track all modifications
  2. **Treatment Plan Discussions** - Comment and reply system
  3. **Quick Navigation** - Sticky header with section shortcuts
  4. **Wider Layout** - max-width 1800px for better visibility
  5. **Smooth Animations** - fadeIn, slideUp, slideDown effects
  6. **Modern UI** - Gradient backgrounds, rounded cards, shadows

### Treatment Plan Change Log (`TreatmentPlanChangeLog`)
- **Database Model**:
  ```prisma
  model TreatmentPlanChangeLog {
    id                String    @id
    treatmentPlanId   String
    userId            String
    changeType        String    // create, update, delete, task_add, task_update, status_change, progress_change
    fieldName         String?   // Field that was changed
    fieldNameAr       String?   // Arabic field name
    oldValue          String?   // Old value (JSON)
    newValue          String?   // New value (JSON)
    description       String?   // Change description
    descriptionAr     String?   // Arabic description
    relatedTaskId     String?   // Related task ID if applicable
    ipAddress         String?
    userAgent         String?
    createdAt         DateTime
  }
  ```
- **API Endpoint**: `/api/treatments/[treatmentId]/changelog`
  - `GET` - Fetch all change logs for a treatment plan
  - `POST` - Add new change log entry
- **UI Features**:
  - Timeline-style display with icons
  - Color-coded change types
  - Shows old vs new values for field changes
  - Time-ago formatting

### Treatment Plan Discussions (`TreatmentDiscussion`)
- **Database Model**:
  ```prisma
  model TreatmentDiscussion {
    id                String    @id
    treatmentPlanId   String
    authorId          String
    content           String    // Comment content
    type              String    // comment, question, reply, mention, decision
    parentId          String?   // For replies
    isResolved        Boolean   // For questions/decisions
    attachmentUrl     String?   // OneDrive/SharePoint link
    attachmentName    String?
    mentionedUserIds  String?   // JSON array of mentioned user IDs
    createdAt         DateTime
    updatedAt         DateTime
  }
  ```
- **API Endpoint**: `/api/treatments/[treatmentId]/discussions`
  - `GET` - Fetch all discussions (with replies)
  - `POST` - Add new comment/reply
  - `PATCH` - Update comment, mark as resolved
  - `DELETE` - Delete comment (author or admin only)
- **UI Features**:
  - Threaded replies
  - Avatar with user initials
  - Question/Decision badges
  - Reply input inline
  - Time-ago formatting
  - @mention support (notifications sent)

### Treatment Detail Page Layout
- **Sticky Navigation Header**:
  - Back button
  - Risk number badge
  - Quick section navigation buttons (Overview, Tasks, Risk, Discussions, Log)
  - Action buttons (PDF, Email, Edit, Delete)
- **Hero Section**:
  - Strategy icon with color gradient
  - Rating badges and status indicators
  - Meta info cards (Department, Responsible, Dates)
  - Justification display
  - Progress bar with percentage
  - Risk scores summary (Inherent/Residual)
  - Tasks completion counter
- **Tasks Section**:
  - Large task cards with numbered badges
  - Task status indicators
  - Assignee and due date info
  - Attachment links
  - Two columns: Workflow Steps | Updates
- **Risk Details Section**:
  - Risk description
  - Potential cause and impact
  - Existing controls
  - Risk matrix (Inherent vs Residual)
- **Discussions Section**:
  - New discussion input
  - Threaded comments
  - Reply functionality
- **Change Log Section**:
  - Timeline view
  - Change type icons and badges
  - Field change diffs
