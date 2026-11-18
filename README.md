# CloudVault – Secure Cloud Storage and Automated Backup System

[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-orange.svg?logo=amazon-aws)](https://aws.amazon.com/)
[![Amazon S3](https://img.shields.io/badge/Amazon-S3%20Versioning%20%26%20Lifecycle-blue.svg?logo=amazon-s3)](https://aws.amazon.com/s3/)
[![Amazon Cognito](https://img.shields.io/badge/Amazon-Cognito%20JWT-purple.svg)](https://aws.amazon.com/cognito/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda%20Node.js%2020-yellow.svg?logo=aws-lambda)](https://aws.amazon.com/lambda/)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg?logo=react)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, beginner-friendly cloud computing project engineered on **Amazon Web Services (AWS)**. Designed to demonstrate cloud computing concepts for technical interviews at companies like **HCL**, covering **Zero-Trust Security**, **Multi-tenant Data Isolation**, **Accidental Deletion & Ransomware Protection**, **Lifecycle-driven Cost Optimization**, and **Serverless Performance**.

---

## 🏛 System Architecture

```text
[ Browser (React + Vite + Tailwind CSS) ]
       │                                  ▲
       │ 1. User Login                    │ 7. Direct Upload / Download
       ▼                                  │    via Presigned URL
[ Amazon Cognito User Pool ]              │
       │ 2. Issues JWT (claims.sub)       │
       ▼                                  │
[ Amazon API Gateway (REST API) ]         │
       │ 3. Cognito JWT Authorizer        │
       ▼                                  │
[ AWS Lambda (Node.js 20.x Handler) ]     │
       │ 4. Scopes uploads/{userId}/*     │
       │ 5. Generates S3 Presigned URL    │
       ▼                                  │
[ Amazon S3 (Private Bucket) ] ───────────┘
       ├── Block All Public Access: TRUE
       ├── Server-Side Encryption: AES-256 (SSE-S3)
       ├── S3 Versioning: ENABLED (Point-in-Time Restore)
       └── S3 Lifecycle Policies: Auto-Transition Noncurrent to Glacier (30 Days)
       │
[ Amazon CloudWatch & AWS CloudTrail ]
       └── Real-Time Logs, Storage Metrics & Security Audit Trails
```

---

## ✨ Key Features & Cloud Architectural Highlights

1. **Direct S3 Presigned Transfers**:
   - Zero raw file buffering through Lambda or API Gateway.
   - Avoids API Gateway's 10 MB payload ceiling and keeps Lambda execution fast (<150ms) and cost-effective.
2. **Multi-Tenant Zero-Trust Isolation**:
   - User identity extracted directly from verified Cognito JWT claims (`sub`).
   - Every file is isolated to `uploads/${userId}/*`. No tenant can access or view another user's files.
3. **Accidental Deletion & Ransomware Mitigation (S3 Versioning)**:
   - Deleting a file places a **Delete Marker** without erasing original bits.
   - Users can inspect historical revisions and restore any older version to HEAD with a single click.
4. **Automated Cost Optimization (S3 Lifecycle Rules)**:
   - Non-current versions transition to **S3 Glacier Flexible Retrieval** after 30 days (~84% storage savings).
   - Expired delete markers are automatically purged after 90 days.
5. **Observability & Auditing**:
   - Lambda execution logs stream to **CloudWatch Logs** with a 7-day retention period.
   - Storage utilization and API metrics tracked in real-time.
   - **CloudTrail** integration ready for audit compliance.
6. **Dual Operating Mode (Live AWS vs Interactive Demo)**:
   - Fully interactive offline **Demo Mode** allows exploring all features, testing version restores, and presenting in an interview even without active AWS internet access.
   - Toggle to **Live AWS Mode** instantly with your deployed stack parameters.

---

## 🚀 Quickstart: Run Locally in 30 Seconds

```bash
# 1. Clone or navigate to the repository
cd CloudVault

# 2. Navigate to frontend and start the development server
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.  
The application runs out-of-the-box in **Interactive Demo Mode**, complete with mock files, simulated version history, and storage analytics!

---

## 🌐 Deploying to Render (Free Cloud Hosting)

CloudVault is pre-configured for 1-click deployment to **[Render](https://render.com/)**:
1. Push your code to GitHub.
2. In the Render Dashboard, click **New** &rarr; **Static Site**.
3. Set **Root Directory** to `frontend`, **Build Command** to `npm install && npm run build`, and **Publish Directory** to `dist`.
4. Add the SPA rewrite rule (`/*` &rarr; `/index.html`).

👉 **[Read the Complete Render Deployment Guide](docs/RENDER_DEPLOYMENT_GUIDE.md)**

---

## ☁️ Deploying to AWS

You have two simple options to deploy the backend to your AWS account:

### Option A: 1-Click AWS CloudFormation Console (Recommended)
1. Open the [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation).
2. Click **Create stack** &rarr; **Upload a template file**.
3. Choose `backend/template.yaml`.
4. Name the stack `CloudVault-Stack` and click **Submit**.
5. Once status is `CREATE_COMPLETE`, view the **Outputs** tab.
6. Copy the `ApiEndpointUrl`, `UserPoolId`, and `UserPoolClientId` into `frontend/.env` or enter them directly in the app's **AWS Stack Settings** drawer.

### Option B: Step-by-Step AWS Management Console
Prefer to learn how each service is configured by hand? Follow the comprehensive guide:  
👉 **[Read the Step-by-Step AWS Console Guide](docs/AWS_CONSOLE_STEP_BY_STEP.md)**

---

## 💼 HCL Technical Interview Preparation

A comprehensive, 30-question technical interview preparation guide specifically tailored for this project is included:  
👉 **[Read HCL_INTERVIEW_PREP.md](HCL_INTERVIEW_PREP.md)**

### Key Topics Covered in the Interview Guide:
- The 2-minute elevator pitch
- Why Presigned URLs solve the 6 MB Lambda / 10 MB API Gateway payload bottlenecks
- S3 Versioning, Delete Markers, and S3 Glacier lifecycle tiering
- SSE-S3 vs SSE-KMS encryption trade-offs
- Cognito User Pools vs Identity Pools & JWT claims validation
- Lambda cold start mitigation and execution lifecycle
- IAM Least Privilege principle & Resource vs Identity policies
- Real-world scenario and troubleshooting questions

---

## 📂 Project Structure

```text
CloudVault/
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── getPresignedUploadUrl.js   # Generates S3 Presigned PUT URL
│   │   │   ├── listUserFiles.js           # Lists active files under user prefix
│   │   │   ├── getPresignedDownloadUrl.js # Generates S3 Presigned GET URL
│   │   │   ├── deleteFile.js              # Soft delete / version delete
│   │   │   ├── listFileVersions.js        # Lists previous versions & delete markers
│   │   │   ├── restoreFileVersion.js      # Restores historical version to HEAD
│   │   │   └── getStorageStats.js         # Computes storage footprint & lifecycle tiering
│   │   ├── utils/
│   │   │   ├── s3Client.js                # AWS SDK v3 S3 client
│   │   │   └── response.js                # Standard CORS response & JWT extractor
│   │   └── api-handler.js                 # Consolidated router Lambda entry point
│   ├── template.yaml                      # AWS SAM / CloudFormation IaC template
│   └── package.json                       # Backend dependencies (@aws-sdk/client-s3)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                 # Header, user badge, AWS mode switch
│   │   │   ├── StorageStatsCards.jsx      # Storage metrics, file counts, tier breakdown
│   │   │   ├── FileUploadModal.jsx        # Presigned upload with live progress bar
│   │   │   ├── FileTable.jsx              # Searchable file table with actions
│   │   │   ├── VersionHistoryModal.jsx    # S3 Version history timeline & restore
│   │   │   ├── BackupInfoCard.jsx         # Architecture & compliance reference
│   │   │   ├── AuthModal.jsx              # Cognito Sign Up, Confirm, Sign In
│   │   │   └── ConfigDrawer.jsx           # Live AWS configuration drawer
│   │   ├── services/
│   │   │   ├── awsConfig.js               # AWS configuration manager
│   │   │   ├── authService.js             # Amazon Cognito authentication client
│   │   │   ├── apiService.js              # API Gateway & direct S3 transfer client
│   │   │   └── mockAwsService.js          # Interactive offline AWS simulator
│   │   ├── App.jsx                        # Main application container
│   │   └── main.jsx                       # React entry point
│   ├── package.json                       # Frontend dependencies
│   ├── vite.config.js                     # Vite configuration
│   └── .env.example                       # Environment variables template
├── docs/
│   ├── AWS_CONSOLE_STEP_BY_STEP.md        # Step-by-step console guide
│   └── ARCHITECTURE.md                    # Architecture documentation
├── HCL_INTERVIEW_PREP.md                  # 30+ HCL interview questions & model answers
└── README.md                              # Main documentation
```

---

## 🔒 Security & Cost Best Practices

- **Zero Hardcoded Secrets**: No AWS credentials or access keys in frontend or git.
- **100% Free Tier Eligible**: Built exclusively using AWS Free Tier services (S3 5GB, Lambda 1M requests/mo, Cognito 50k MAUs free).
- **Private S3 Bucket**: All 4 Block Public Access flags enabled.
- **Server-Side Encryption**: SSE-S3 (AES-256) enforced on all stored objects.

---

## 📜 License
MIT License. Built for educational and interview demonstration purposes.
