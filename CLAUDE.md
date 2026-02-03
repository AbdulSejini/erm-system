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
4. Use `isAr` from `useTranslation()` to conditionally render content
5. Residual risk changes MUST go through treatment plans - direct editing is disabled
