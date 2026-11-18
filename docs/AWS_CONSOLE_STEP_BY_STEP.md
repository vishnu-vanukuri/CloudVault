# CloudVault: Step-by-Step AWS Deployment Guide

This guide is designed for **complete beginners**. It gives you two ways to deploy your CloudVault infrastructure:
* **Method 1 (Recommended - 5 Minutes)**: 1-Click Deployment via **AWS CloudFormation Console** (No CLI needed).
* **Method 2 (Educational - Deep Dive)**: Manual AWS Management Console Setup (Learn each AWS service step-by-step).

---

## Method 1: 1-Click CloudFormation Console Deployment (Fast & Error-Free)

AWS CloudFormation reads the infrastructure template (`backend/template.yaml`) and creates all resources (S3, Cognito, IAM, Lambda, API Gateway) automatically.

### Steps:
1. Log into your [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **CloudFormation** and select it.
3. Make sure your desired region is selected in the top-right corner (e.g., `us-east-1` N. Virginia).
4. Click the orange button: **Create stack** &rarr; **With new resources (standard)**.
5. Under **Prerequisite - Prepare template**, select **Template is ready**.
6. Under **Specify template**, select **Upload a template file**.
7. Click **Choose file** and select `CloudVault/backend/template.yaml` from your computer.
8. Click **Next**.
9. Enter a **Stack name**: `CloudVault-Stack`. Leave `EnvironmentName` as `dev`. Click **Next**.
10. On the **Configure stack options** page, leave defaults and click **Next**.
11. Scroll to the bottom of the Review page. Check the box:
    > ☑ *I acknowledge that AWS CloudFormation might create IAM resources.*
12. Click **Submit**.
13. Wait ~2 to 3 minutes until the stack status turns green: `CREATE_COMPLETE`.
14. Click the **Outputs** tab. You will see:
    - `UserPoolId`: Your Cognito User Pool ID
    - `UserPoolClientId`: Your App Client ID
    - `ApiEndpointUrl`: Your API Gateway REST URL
    - `StorageBucketName`: Your S3 bucket name
15. Copy these values into your `frontend/.env` file or paste them directly in the CloudVault web app via the **AWS Config** drawer!

---

## Method 2: Manual AWS Console Setup (Step-by-Step)

If your interviewer asks *"How would you set this up in the AWS Console from scratch?"*, follow these exact steps:

---

### Step 1: Create the Amazon S3 Private Bucket
1. Go to **Amazon S3** in the AWS Console.
2. Click **Create bucket**.
3. **Bucket name**: `cloudvault-storage-<your-name>-2026` (must be globally unique).
4. **AWS Region**: Select `US East (N. Virginia) us-east-1`.
5. **Block Public Access settings for this bucket**:
   - Keep **Block *all* public access** checked (Enabled).
6. **Bucket Versioning**:
   - Select **Enable** (Protects against accidental deletion & ransomware).
7. **Default encryption**:
   - Encryption type: **Server-side encryption with Amazon S3 managed keys (SSE-S3)**.
8. Click **Create bucket**.

#### Configure S3 CORS (Allows browser direct upload):
1. Click into your new bucket &rarr; go to the **Permissions** tab.
2. Scroll down to **Cross-origin resource sharing (CORS)** &rarr; click **Edit**.
3. Paste the following JSON:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3600
  }
]
```
4. Click **Save changes**.

#### Configure S3 Lifecycle Rule (Automated Glacier Archival):
1. Go to the **Management** tab of your bucket.
2. Under **Lifecycle rules**, click **Create lifecycle rule**.
3. **Lifecycle rule name**: `ArchiveOlderVersionsToGlacier`.
4. **Choose a rule scope**: Select **Apply to all objects in the bucket** (check the acknowledgement box).
5. Under **Lifecycle rule actions**, check:
   - ☑ *Move noncurrent versions of objects between storage classes*
   - ☑ *Delete expired object delete markers or incomplete multipart uploads*
6. Under **Move noncurrent versions of objects between storage classes**:
   - Choose storage class: **Glacier Flexible Retrieval** (formerly Glacier).
   - Days after objects become noncurrent: `30`.
7. Click **Create rule**.

---

### Step 2: Create the Amazon Cognito User Pool
1. Go to **Amazon Cognito** in the AWS Console.
2. Click **Create user pool**.
3. **Step 1 (Configure sign-in experience)**:
   - Cognito user pool sign-in options: Select **Email**.
   - Click **Next**.
4. **Step 2 (Configure security requirements)**:
   - Password policy: Select **Cognito defaults** (or minimum 8 characters).
   - Multi-factor authentication (MFA): Select **No MFA** (for free-tier beginner setup).
   - Click **Next**.
5. **Step 3 (Configure sign-up experience)**:
   - Self-service sign-up: Enabled.
   - Required attributes: `email`.
   - Click **Next**.
6. **Step 4 (Configure message delivery)**:
   - Email provider: Select **Send email with Cognito** (up to 50 emails/day free).
   - Click **Next**.
7. **Step 5 (Integrate your app)**:
   - User pool name: `CloudVault-UserPool`.
   - App client name: `CloudVault-WebClient`.
   - Client secret: Select **Don't generate a client secret** (Crucial for Single Page Web Apps!).
   - Click **Next** &rarr; Review and click **Create user pool**.
8. Note down:
   - **User pool ID** (e.g. `us-east-1_xxxxxxxxx`)
   - **App client ID** (under App integration tab &rarr; App clients)

---

### Step 3: Create the AWS IAM Role for Lambda
1. Go to **IAM** &rarr; **Roles** &rarr; Click **Create role**.
2. **Trusted entity type**: Select **AWS service** &rarr; Use case: **Lambda**. Click **Next**.
3. **Add permissions**:
   - Search for `AWSLambdaBasicExecutionRole` and check it.
4. Click **Next**.
5. **Role name**: `CloudVault-Lambda-ExecutionRole`. Click **Create role**.
6. Find the newly created role in the list, click into it, click **Add permissions** &rarr; **Create inline policy**.
7. Select **JSON** tab and paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:DeleteObject",
        "s3:DeleteObjectVersion",
        "s3:ListBucket",
        "s3:ListBucketVersions"
      ],
      "Resource": [
        "arn:aws:s3:::cloudvault-storage-*",
        "arn:aws:s3:::cloudvault-storage-*/*"
      ]
    }
  ]
}
```
8. Click **Next**, name the policy `CloudVaultS3Policy`, and click **Create policy**.

---

### Step 4: Create the AWS Lambda Function
1. Go to **AWS Lambda** &rarr; Click **Create function**.
2. Select **Author from scratch**.
3. **Function name**: `CloudVault-ApiHandler`.
4. **Runtime**: **Node.js 20.x**.
5. **Change default execution role**:
   - Select **Use an existing role** &rarr; pick `CloudVault-Lambda-ExecutionRole`.
6. Click **Create function**.
7. Go to **Configuration** tab &rarr; **Environment variables** &rarr; **Edit**:
   - Key: `STORAGE_BUCKET_NAME` &rarr; Value: `<your-s3-bucket-name>`
   - Key: `AWS_REGION` &rarr; Value: `us-east-1`
   - Click **Save**.
8. Go to **Configuration** &rarr; **General configuration** &rarr; **Edit**:
   - Memory: `256 MB`
   - Timeout: `15 seconds`
   - Click **Save**.

---

### Step 5: Create Amazon API Gateway (REST API)
1. Go to **Amazon API Gateway** &rarr; Click **Create API**.
2. Find **REST API** (non-private) &rarr; Click **Build**.
3. Choose the protocol: **REST**. Create new API: **New API**.
4. **API name**: `CloudVault-API`. Click **Create API**.

#### Add Cognito Authorizer:
1. In the left menu of your API, click **Authorizers** &rarr; **Create authorizer**.
2. **Authorizer name**: `CognitoAuth`.
3. **Type**: `Cognito`.
4. **Cognito user pool**: Select your `CloudVault-UserPool`.
5. **Token source**: `Authorization`.
6. Click **Create authorizer**.

#### Create Resources and Methods:
Create the following resources under the root `/`:
1. `/health` &rarr; `GET` (Auth: NONE) &rarr; Integrates with Lambda `CloudVault-ApiHandler`.
2. `/files` &rarr; `GET`, `DELETE` (Auth: `CognitoAuth`) &rarr; Integrates with Lambda.
3. `/files/upload-url` &rarr; `POST` (Auth: `CognitoAuth`) &rarr; Integrates with Lambda.
4. `/files/download-url` &rarr; `GET` (Auth: `CognitoAuth`) &rarr; Integrates with Lambda.
5. `/files/versions` &rarr; `GET` (Auth: `CognitoAuth`) &rarr; Integrates with Lambda.
6. `/files/restore` &rarr; `POST` (Auth: `CognitoAuth`) &rarr; Integrates with Lambda.
7. `/files/delete` &rarr; `POST` (Auth: `CognitoAuth`) &rarr; Integrates with Lambda.
8. `/dashboard/stats` &rarr; `GET` (Auth: `CognitoAuth`) &rarr; Integrates with Lambda.

*Make sure to check **Use Lambda Proxy integration** on each method!*

#### Enable CORS:
1. Select the `/` root or `/files` resource.
2. Click **Enable CORS** &rarr; Check `GET, POST, PUT, DELETE, OPTIONS` &rarr; Click **Save**.

#### Deploy the API:
1. Click **Deploy API** button.
2. **Deployment stage**: `[New Stage]` &rarr; Stage name: `dev`.
3. Click **Deploy**.
4. Note your **Invoke URL** (e.g. `https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev`).

---

### Step 6: Connect Frontend
1. Open `frontend/.env` and insert your IDs:
```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_ENDPOINT_URL=https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev
```
2. Start the React app:
```bash
cd frontend
npm run dev
```
3. Open `http://localhost:3000` in your browser.
4. Sign up, verify your email, and start uploading, versioning, and restoring files!
