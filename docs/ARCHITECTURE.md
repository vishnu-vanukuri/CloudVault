# CloudVault Architecture Deep Dive

## 1. High-Level Architecture Overview

CloudVault implements a modern, secure, serverless cloud storage pattern built on Amazon Web Services (AWS). It separates the **Control Plane** (authentication, authorization, URL generation, metadata queries) from the **Data Plane** (actual binary file ingestion and retrieval).

```text
+-----------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                     |
|  - React 18 Single Page Application                                               |
|  - Uploads & Downloads directly to/from Amazon S3 via time-limited Presigned URLs |
+------------------------------------+----------------------------------------------+
                                     |
             1. Authentication       | 2. Presigned URL Request
             (SRP / Password Flow)   |    (Bearer JWT IdToken)
                                     v
                        +----------------------------+
                        |  Amazon API Gateway (REST) |
                        |  + Cognito Authorizer      |
                        +--------------+-------------+
                                       |
                                       | 3. Invoke with claims.sub
                                       v
                        +----------------------------+
                        |   AWS Lambda (Node.js 20)  |
                        |   (Least-Privilege Role)   |
                        +--------------+-------------+
                                       |
                 4. GetSignedUrl /     | 5. Query Versions /
                    Validate Tenant    |    Trigger Restores
                                       v
                        +----------------------------+
                        |      Amazon S3 Bucket      |
                        |  - Block Public Access: ON |
                        |  - SSE-S3 AES-256          |
                        |  - S3 Versioning Enabled   |
                        |  - uploads/{userId}/*      |
                        +--------------+-------------+
                                       |
                                       | 6. Automated Lifecycle
                                       v
                        +----------------------------+
                        |   S3 Glacier Archival      |
                        |   (Older versions > 30d)   |
                        +----------------------------+
```

---

## 2. Security Architecture Principles

### Zero-Trust Multi-Tenancy
Multi-tenant isolation is enforced at the identity layer:
1. Cognito User Pools assign an immutable `sub` claim (Subject ID UUID) to each user upon registration.
2. The user signs in and passes the JWT `IdToken` in the `Authorization: Bearer <token>` header.
3. API Gateway's native Cognito Authorizer validates the cryptographic signature against Cognito's JWKS (`https://cognito-idp.<region>.amazonaws.com/<userPoolId>/.well-known/jwks.json`).
4. The verified claims are passed into the Lambda event at `event.requestContext.authorizer.claims`.
5. Lambda forces the S3 key path to `uploads/${claims.sub}/${sanitizedFileName}`.
6. A user has zero mathematical capability to query, generate presigned URLs for, or overwrite another user's files.

### Private S3 Bucket with Block All Public Access
The S3 bucket has all 4 public access block settings enabled:
- `BlockPublicAcls: true`
- `IgnorePublicAcls: true`
- `BlockPublicPolicy: true`
- `RestrictPublicBuckets: true`

Even if a user or script attempts to send a public ACL (`public-read`), S3 outright rejects it.

### Server-Side Encryption (SSE-S3)
All objects are encrypted at rest with Advanced Encryption Standard (AES) using 256-bit keys (`AES256`).

---

## 3. Storage Cost Optimization & Backup Lifecycle

CloudVault uses S3 Lifecycle rules to optimize storage costs:
- **Rule 1: Transition Non-Current Versions to Glacier**
  - Trigger: Objects that become non-current (i.e. replaced by a newer revision or marked deleted).
  - Transition: Automatically moved to **S3 Glacier Flexible Retrieval** after **30 days**.
  - Cost impact: Reduces storage cost from **$0.023/GB/month** (Standard) to **$0.0036/GB/month** (Glacier)—an **84% reduction**.
- **Rule 2: Purge Expired Delete Markers**
  - Trigger: Delete markers that no longer have non-current versions.
  - Action: Automatically removes empty markers after 90 days.

---

## 4. Observability & Auditing

- **CloudWatch Logs**: Centralized structured logging for Lambda API handlers. Log groups configured with 7-day retention.
- **CloudWatch Metrics**: Tracks API Gateway 4XX/5XX errors, latency, and Lambda invocation errors.
- **CloudTrail**: Audit trail capturing all management events (IAM changes, S3 bucket policy alterations) and optional S3 data events.
