# CloudVault: HCL Cloud Computing Technical Interview Guide

> **Target Interview**: HCL Cloud Computing / AWS Serverless / Cloud Engineer Role  
> **Project**: CloudVault – Secure Cloud Storage and Automated Backup System  
> **Level**: Beginner-friendly explanations with senior-grade architectural reasoning.

---

## Part 1: The 2-Minute Interview Elevator Pitch

When the interviewer asks:  
> *"Can you tell me about a cloud computing project you built using AWS?"*

**Deliver this exact response:**

> "Certainly! I designed and built **CloudVault**, a secure, multi-tenant cloud storage and automated backup system using AWS serverless architecture.
>
> The problem I wanted to solve was building an enterprise storage system that guarantees **Zero-Trust Security**, **Data Recovery from Accidental Deletion or Ransomware**, and **Automated Cost Optimization**.
>
> **Here is how the architecture works:**
> 1. On the frontend, I used **React, Vite, and Tailwind CSS**.
> 2. For identity management, I integrated **Amazon Cognito User Pools** to handle user registration, email verification, and issue cryptographically signed JWT tokens.
> 3. For the backend, I built a serverless API using **Amazon API Gateway** with a Cognito Authorizer that delegates to **AWS Lambda** written in Node.js 20 using AWS SDK v3.
> 4. To solve the classic serverless bottleneck—where streaming large files through Lambda exhausts memory and hits the 6 MB API Gateway payload limit—I implemented **S3 Presigned URLs**. When a user uploads or downloads a file, Lambda generates a cryptographically signed, short-lived URL. The client then transfers the file directly to and from a private **Amazon S3** bucket.
> 5. For security, the S3 bucket has **Block All Public Access** enabled, uses **AES-256 Server-Side Encryption (SSE-S3)**, and enforces strict tenant isolation by scoping files to the user's Cognito unique subject ID (`uploads/{userId}/*`).
> 6. For disaster recovery and cost optimization, I enabled **Amazon S3 Versioning**, allowing point-in-time recovery, and configured **S3 Lifecycle Policies** that automatically transition non-current versions to **S3 Glacier** after 30 days and purge expired delete markers after 90 days.
> 7. Finally, for observability and compliance, I integrated **Amazon CloudWatch** for metrics and execution logs and **AWS CloudTrail** for auditing data access.
>
> I also automated the entire infrastructure deployment using an **AWS SAM / CloudFormation** Infrastructure-as-Code template."

---

## Part 2: Core Architecture Defense — "Why Did You Choose This?"

### 1. Why use Presigned URLs instead of uploading through AWS Lambda?
* **Problem with streaming through Lambda**:
  * API Gateway has a strict **10 MB payload limit** for REST APIs (6 MB for Lambda synchronous invocations).
  * Streaming large files holds the Lambda function open for minutes, drastically increasing compute costs (GB-seconds) and risking Lambda execution timeout (15-minute maximum).
  * Lambda memory must be provisioned much higher (e.g. 1024 MB or more) just to buffer binary payloads.
* **Presigned URL Solution**:
  * Lambda only runs for **~120 milliseconds** to sign an HMAC-SHA256 URL token.
  * The client streams the binary payload directly into Amazon S3 over HTTPS.
  * Files of any size up to 5 GB (or 5 TB with multipart upload) can be uploaded without putting any load on API Gateway or Lambda.

### 2. How is Multi-Tenant Data Isolation enforced?
* When the user authenticates with Amazon Cognito, Cognito issues an `IdToken` containing a verified claim called `sub` (Subject ID / User UUID).
* API Gateway validates the JWT signature against Cognito's JWKS.
* Lambda extracts `event.requestContext.authorizer.claims.sub`.
* The S3 object key is strictly constructed as `uploads/${sub}/${fileName}`.
* Even if an attacker manipulates the request parameters, Lambda overrides the folder path with their authenticated `sub`. User A can **never** generate a presigned URL or query files under User B’s prefix.

### 3. How does S3 Versioning protect against Accidental Deletion and Ransomware?
* In an unversioned bucket, a `DeleteObject` API call permanently erases the data block.
* In a version-enabled bucket, deleting a file without specifying a `VersionId` merely places a **Delete Marker** (a 0-byte placeholder) as the new current HEAD.
* The original file data and all previous revisions remain intact with distinct `versionId` strings.
* If a file is corrupted, encrypted by ransomware, or deleted accidentally, CloudVault executes an S3 `CopyObjectCommand` specifying `CopySource: bucket/key?versionId=TARGET_ID`. This instantly restores the historical version as the current file without losing audit history.

### 4. How do S3 Lifecycle Policies optimize storage costs?
* **S3 Standard** costs ~$0.023 per GB/month.
* **S3 Glacier Flexible Retrieval** costs ~$0.0036 per GB/month (an **84% cost reduction**).
* In CloudVault's lifecycle configuration:
  * Non-current file versions (older revisions) automatically transition to S3 Glacier after 30 days.
  * Expired object delete markers are automatically cleaned up after 90 days.
  * This ensures organizations stay compliant with retention policies while keeping storage bills near zero.

---

## Part 3: Top 25 Technical Interview Questions & Model Answers

### Category 1: Amazon S3 & Storage

#### Q1: What is the consistency model of Amazon S3?
> **Model Answer**: Amazon S3 provides **strong read-after-write consistency** for `PUT` and `DELETE` requests of objects in all AWS Regions. Immediately after an object is written or deleted, any subsequent `GET` or `LIST` request immediately reflects the latest update.

#### Q2: What are the differences between SSE-S3, SSE-KMS, and SSE-C?
> **Model Answer**:
> - **SSE-S3 (Server-Side Encryption with S3-Managed Keys)**: Amazon manages the AES-256 keys. It is free, automatic, and requires zero key management overhead. CloudVault uses SSE-S3.
> - **SSE-KMS (AWS Key Management Service)**: Keys are managed in AWS KMS. Provides customer-managed key rotation, fine-grained IAM key policies, and full CloudTrail audit trails for every key decryption, but incurs KMS API request costs.
> - **SSE-C (Customer-Provided Keys)**: The client provides their own cryptographic key in the HTTP header with every request. S3 encrypts the object and immediately discards the key from memory.

#### Q3: What happens when you delete an object in a bucket with S3 Versioning enabled?
> **Model Answer**: If a delete request is sent without a `versionId`, S3 creates a **Delete Marker** with its own unique version ID and makes it the current version. The object appears deleted in normal listings. However, previous versions are still preserved. If you delete the Delete Marker itself, the previous version becomes the current version again. To permanently delete an object, you must send the delete request specifying the exact `versionId`.

#### Q4: How would you handle uploading files larger than 100 MB or up to 5 TB?
> **Model Answer**: For files exceeding 100 MB, AWS best practice is **S3 Multipart Upload**. In serverless, Lambda coordinates the multipart upload:
> 1. Lambda initiates the upload via `CreateMultipartUploadCommand` and returns an `UploadId`.
> 2. Lambda generates presigned URLs for each separate 5 MB-10 MB part via `UploadPartCommand`.
> 3. The frontend uploads parts in parallel, capturing each part's `ETag`.
> 4. The frontend calls Lambda with all ETags, and Lambda calls `CompleteMultipartUploadCommand`.

#### Q5: What is S3 Block Public Access and why is it important?
> **Model Answer**: S3 Block Public Access is a centralized safety control that overrides all bucket policies and access control lists (ACLs). It consists of 4 settings:
> 1. Block public ACLs
> 2. Ignore public ACLs
> 3. Block public bucket policies
> 4. Restrict public bucket policies  
> In CloudVault, all 4 settings are set to `true`, preventing data leaks even if someone accidentally attempts to apply a public ACL.

---

### Category 2: IAM & Security

#### Q6: Explain the Principle of Least Privilege in the context of your Lambda role.
> **Model Answer**: The Principle of Least Privilege dictates that an identity should only be granted the minimum permissions necessary to perform its intended task. In CloudVault:
> - The Lambda execution role does **not** have `AdministratorAccess` or broad `s3:*`.
> - It is granted only `s3:GetObject*`, `s3:PutObject*`, `s3:DeleteObject*`, and `s3:ListBucket*`.
> - The actions are strictly scoped to the specific bucket ARN (`arn:aws:s3:::cloudvault-storage-*`) rather than `Resource: "*"`.
> - It has `AWSLambdaBasicExecutionRole` allowing it only to write execution logs to CloudWatch.

#### Q7: What is the difference between an Identity-Based Policy and a Resource-Based Policy in AWS?
> **Model Answer**:
> - **Identity-Based Policy**: Attached to IAM users, groups, or roles (e.g. the policy attached to our Lambda Execution Role defining what the role can access).
> - **Resource-Based Policy**: Attached directly to the AWS resource itself (e.g. S3 Bucket Policy, KMS Key Policy, or Lambda Function Policy). It defines *who* can access that resource and under what conditions (e.g., enforcing SSL via `aws:SecureTransport: true`).

#### Q8: How did you ensure credentials are never exposed on the frontend?
> **Model Answer**:
> - We never include AWS Access Key IDs or Secret Access Keys anywhere in the frontend code or `.env`.
> - Authentication is handled via **Amazon Cognito**, which exchanges user credentials for short-lived JWT tokens.
> - S3 access is granted strictly through **time-limited Presigned URLs** generated on the backend by Lambda using its temporary IAM execution role credentials via AWS STS. The frontend never possesses IAM permissions.

---

### Category 3: Serverless Compute (Lambda & API Gateway)

#### Q9: What is a Lambda Cold Start and how can it be minimized?
> **Model Answer**: A cold start occurs when a Lambda function receives a request after being idle, or when scaling up to a new concurrent instance. AWS must provision an execution container, download the code package, and initialize the runtime.
> **To minimize cold starts**:
> 1. Use lightweight runtimes like Node.js 20.x or Python instead of JVM.
> 2. Keep package bundles small using ES Modules and AWS SDK v3 modular imports (`@aws-sdk/client-s3` rather than the entire `aws-sdk`).
> 3. Allocate optimal memory (higher memory allocates proportional virtual CPU).
> 4. Use **Provisioned Concurrency** for critical enterprise workloads to keep pre-warmed execution environments ready.

#### Q10: What is the difference between REST API and HTTP API in Amazon API Gateway?
> **Model Answer**:
> - **HTTP APIs**: Designed for low-latency, lower cost (up to 70% cheaper), and simpler proxy integrations. They support basic OIDC/JWT authorizers but lack advanced features.
> - **REST APIs**: Offer full enterprise features including request validation, usage plans, API keys, request/response transformations (VTL templates), WAF integration, and native Amazon Cognito Authorizers. CloudVault utilizes REST API for its built-in Cognito Authorizer and granular resource mapping.

#### Q11: What is Lambda Proxy Integration?
> **Model Answer**: In Lambda Proxy Integration, API Gateway passes the entire raw HTTP request (headers, query parameters, path parameters, body, requestContext, and authorizer claims) directly to the Lambda function as a JSON `event`. The Lambda function is responsible for parsing the input and returning a structured JSON response containing `statusCode`, `headers` (including CORS), and `body`. This decouples routing and business logic into code.

---

### Category 4: Authentication (Amazon Cognito)

#### Q12: What is the difference between Cognito User Pools and Cognito Identity Pools (Federated Identities)?
> **Model Answer**:
> - **Cognito User Pools (CUP)**: A user directory that handles user registration, authentication, MFA, and directory management. It issues **JWT tokens** (IdToken, AccessToken, RefreshToken).
> - **Cognito Identity Pools**: An authorization service that exchanges identity tokens (from Cognito User Pools, Google, Facebook, etc.) for **temporary AWS IAM credentials** via AWS STS.
> In CloudVault, we use **Cognito User Pools** with an API Gateway Cognito Authorizer, keeping the frontend decoupled from IAM.

#### Q13: What claims are stored inside the Cognito ID Token and how do you use them?
> **Model Answer**: The ID Token is an encoded JSON Web Token (JWT) containing standard OIDC claims:
> - `sub`: The unique, immutable UUID representing the user.
> - `email`: The verified email address.
> - `iss`: The issuer URL (`https://cognito-idp.<region>.amazonaws.com/<userPoolId>`).
> - `aud`: The Cognito App Client ID.
> - `exp` / `iat`: Expiration and issued-at timestamps.
> CloudVault uses `claims.sub` to dynamically partition S3 storage (`uploads/{sub}/...`), guaranteeing multi-tenant isolation.

---

### Category 5: Observability & Cloud Operations

#### Q14: How does CloudWatch assist in monitoring and troubleshooting CloudVault?
> **Model Answer**:
> 1. **CloudWatch Logs**: Every `console.log` and error stack trace from our Lambda handlers is automatically streamed to `/aws/lambda/CloudVault-ApiHandler` log groups with 7-day retention.
> 2. **CloudWatch Metrics**: Automatically monitors Lambda invocations, duration, error rate, throttling, and API Gateway 4XX/5XX error counts.
> 3. **Alarms**: We can set up a CloudWatch Metric Alarm that triggers an Amazon SNS email notification if Lambda errors exceed 1% or if S3 4xx errors spike.

#### Q15: What is the role of AWS CloudTrail in this project?
> **Model Answer**: AWS CloudTrail continuously records account activity.
> - **Management Events**: Tracks who created or modified the S3 bucket, IAM roles, or Lambda functions.
> - **Data Events**: Can be enabled on the S3 bucket to log individual `PutObject`, `GetObject`, and `DeleteObject` API calls, recording the caller's IP address, timestamp, and IAM identity for security audits and compliance (e.g., SOC2, HIPAA).

---

### Category 6: Scenarios & Architectural Challenges

#### Q16: Interviewer: "What if a user intercepts the Presigned URL request and changes the filename to `../../etc/passwd` or tries to overwrite another user's file?"
> **Model Answer**:
> "That threat is completely neutralized in CloudVault by two defense layers:
> 1. **Path Sanitization**: Lambda regex-sanitizes the filename (`fileName.replace(/[^a-zA-Z0-9._-]/g, '_')`), stripping all relative path characters (`../`).
> 2. **Server-Enforced Prefix**: The object key is constructed entirely on the server using `uploads/${userId}/${sanitizedFileName}`. The client has zero control over the prefix or user folder path."

#### Q17: Interviewer: "How would you improve the download performance for global users who are far from the AWS region?"
> **Model Answer**:
> "I would deploy an **Amazon CloudFront** content delivery network (CDN) distribution in front of the S3 bucket using **Origin Access Control (OAC)**:
> 1. The S3 bucket remains 100% private and accessible only by CloudFront.
> 2. Files are cached at 450+ CloudFront Edge Locations worldwide, drastically reducing latency and egress bandwidth costs.
> 3. For private user downloads, we can use **CloudFront Signed URLs** or **Signed Cookies** rather than direct S3 presigned URLs."

#### Q18: Interviewer: "What is the AWS Well-Architected Framework, and how does CloudVault align with it?"
> **Model Answer**:
> "The AWS Well-Architected Framework consists of 6 pillars:
> 1. **Security**: SSE-256 encryption at rest, TLS 1.3 in transit, Block Public Access, IAM least privilege, Cognito JWT verification.
> 2. **Cost Optimization**: Serverless pay-per-use compute, Presigned URLs (zero Lambda memory wastage), and automated S3 Lifecycle tiering to Glacier.
> 3. **Reliability**: S3 provides 99.999999999% (11 9's) data durability across multiple Availability Zones, and S3 Versioning mitigates ransomware and accidental deletion.
> 4. **Performance Efficiency**: Direct S3 client uploads bypass compute middleware; Lambda cold starts are minimized via modular AWS SDK v3 imports.
> 5. **Operational Excellence**: Infrastructure as Code (SAM/CloudFormation) for repeatable deployments and CloudWatch for centralized logging.
> 6. **Sustainability**: Serverless architecture eliminates idle EC2 instances, consuming compute energy only when requests are actively processed."

---

## Part 4: Cheat Sheet — Key Metrics to Quote in the Interview

| Metric | CloudVault Specification |
| :--- | :--- |
| **S3 Data Durability** | **99.999999999% (11 9's)** across 3+ Availability Zones |
| **Presigned URL Expiration** | **15 minutes** for Uploads (PUT), **5 minutes** for Downloads (GET) |
| **Storage Cost Reduction** | **~84% savings** by transitioning older versions to S3 Glacier ($0.023 &rarr; $0.0036/GB) |
| **Lambda Execution Time** | **< 150 milliseconds** (due to Presigned URL offloading) |
| **Lambda Memory** | **256 MB** (optimized cost-to-performance ratio) |
| **API Gateway Latency** | **< 50 milliseconds** overhead |
| **Data Isolation** | Prefix isolation scoped to Cognito verified `sub` claim |
| **Encryption Standard** | **AES-256** (SSE-S3) at rest, **TLS 1.3** in transit |
