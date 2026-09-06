# DevLog - Developer Debugging Journal

DevLog is a structured debugging and dev-log journal engineered specifically for software engineers. Instead of raw notes or mood tracking, DevLog allows developers to rubber-duck bugs in real-time with Google Gemini. When a session ends, Gemini uses JSON Schema structured output to extract root causes, solutions, normalized failure tags, and difficulty metrics, persisting them into an owner-isolated Cloud Firestore database.

---

## Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Secure Google Sign-In (federated auth, zero password storage). |
| **Backend Database** | Cloud Firestore | Owner-bound, strictly isolated user collections (`/users/{userId}/devlogs`). |
| **AI Processing Engine** | Gemini API (`@google/genai`) | Interactive debugging chat + structured JSON extraction with automated 4-tier model fallback ladder. |
| **Secret Management** | Cloud Secret Manager / Env | Secure injection of `GEMINI_API_KEY` and Firebase credentials. |
| **Full-Stack Runtime** | Node.js + Express + Vite | Full-stack server hosting API proxies and client assets on port 3000. |

---

## 1. Environment & Prerequisites

1. **Google Cloud SDK**:
   Ensure `gcloud` CLI is installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable Required Google Cloud APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     identitytoolkit.googleapis.com
   ```

---

## 2. Secret Management Setup

Store your Gemini API key securely in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run runtime service account permission to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy secure, owner-bound Firestore security rules ensuring strict user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated devlogs for authenticated owner only
    match /users/{userId}/devlogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Isolated raw chat transcripts
    match /users/{userId}/transcripts/{transcriptId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Structured Reflection Schema (DevLog Specification)

Every finished debugging session is parsed via Gemini structured JSON output:

```json
{
  "title": "string, short human-readable summary of the problem",
  "rootCause": "string, one or two sentences",
  "resolution": "string, what fixed it or current status if unresolved",
  "tags": ["string", "lowercase failure vectors e.g. race-condition, segfault, off-by-one, auth"],
  "difficulty": "integer 1-5",
  "resolved": "boolean",
  "language": "string, e.g. python, cpp, java, typescript (optional)",
  "timeSpentMinutes": "integer, optional, only if user mentioned a duration"
}
```

---

## 5. Cloud Run Deployment Flow

Build and deploy the application container directly to Cloud Run:

```bash
# Deploy from source to Google Cloud Run with secret binding
gcloud run deploy devlog \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"
```

---

## 6. Required Campaign Labeling

Apply the mandatory resource label to register the Cloud Run service for challenge verification:

```bash
gcloud run services update devlog \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Functional Stability & Walkthrough Testing Guide

| Interaction Flow | Step-by-Step Test Procedure | Expected Result |
| :--- | :--- | :--- |
| **Authentication** | 1. Navigate to `/`<br>2. Click **Sign In with Google**<br>3. Complete OAuth popup | User state transitions to the authenticated Dashboard; navigation displays user identity. |
| **New Session Launch** | 1. Click **+ New Log** on dashboard<br>2. Observe session console | Chat interface opens; turn counter starts at 0; welcome instructions display. |
| **Multi-turn Debugging** | 1. Input error message (e.g., *"TypeError: Cannot read properties of undefined"*).<br>2. Send message.<br>3. Inspect Gemini reply. | Gemini provides technical rubber-ducking diagnostics; server executes fallback ladder if primary model is unavailable. |
| **End Session & Extract** | 1. Click **End Session & Extract Log**<br>2. Monitor status banner | Backend executes `/api/extract-log` with JSON Schema mode; validates fields; saves both log & transcript to `/users/{uid}/...` in Firestore. |
| **History & Pattern Radar** | 1. Return to dashboard.<br>2. Check Pattern Radar.<br>3. Click a failure tag. | Tag frequency bar updates; clicking the tag filters the journal feed to matching entries. |
| **Transcript Inspection** | 1. Expand a past DevLog card.<br>2. Click **View Full Original Chat Transcript**. | Full multi-turn conversation messages render cleanly with timestamps. |
| **Record Deletion** | 1. Click the trash icon on a log card.<br>2. Confirm dialog. | Log and transcript document are purged from Firestore; list updates immediately. |
