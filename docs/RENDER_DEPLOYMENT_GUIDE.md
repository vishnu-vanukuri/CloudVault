# Deploying CloudVault to Render (Step-by-Step Beginner Guide)

[Render](https://render.com/) is a modern cloud hosting platform with generous free tiers. You can deploy CloudVault to Render in less than 5 minutes.

---

## Step 1: Push Your Code to GitHub

Render connects directly to your GitHub repository to build and deploy your app automatically on every update.

If you haven't pushed your code to GitHub yet, run these commands in your project folder (`c:\Users\vanuk\OneDrive\Desktop\CloudVault`):

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage all files
git add .

# 3. Commit the changes
git commit -m "Initial CloudVault release for Render deployment"

# 4. Create a new repository on https://github.com/new (e.g. named "CloudVault")

# 5. Link and push to your GitHub repo
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/CloudVault.git
git push -u origin main
```

---

## Step 2: Deploy Frontend on Render (Free Static Site)

The frontend is a React + Vite Single Page Application. Render hosts static sites for **free** on a fast global CDN with automated HTTPS certificates.

### Detailed Click-by-Click Instructions:

1. Sign up or log into [Render](https://dashboard.render.com/).
2. In the top navigation bar, click the blue **+ New** button &rarr; select **Static Site**.
3. Under **Connect a repository**, find your `CloudVault` repository and click **Connect**.
4. Configure the following deployment fields:

| Field | Exact Value to Enter |
| :--- | :--- |
| **Name** | `cloudvault-storage` (or any name you like) |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

5. **(Important) Add Single Page Application (SPA) Rewrite Rule**:
   - Scroll down to the **Redirects / Rewrites** section.
   - Click **Add Rule**.
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`  
   *(This ensures that refreshing the browser or opening sub-routes loads your React app properly instead of showing a 404 error).*

6. Click the blue **Create Static Site** button at the bottom.
7. Render will now clone your repository, run Vite build, and publish the site in ~1 minute.
8. Once finished, you will see your live public URL at the top (e.g. `https://cloudvault-storage.onrender.com`).

---

## Step 3: (Optional) Adding AWS Environment Variables in Render

If you deployed the AWS backend (using CloudFormation or AWS Console), you can inject your AWS credentials into Render:

1. In your Render Static Site dashboard, click **Environment** in the left sidebar.
2. Click **Add Environment Variable** and add:
   - `VITE_AWS_REGION`: `us-east-1`
   - `VITE_COGNITO_USER_POOL_ID`: `<Your User Pool ID>`
   - `VITE_COGNITO_CLIENT_ID`: `<Your App Client ID>`
   - `VITE_API_ENDPOINT_URL`: `<Your API Gateway REST URL>`
3. Click **Save Changes**. Render will automatically redeploy the frontend connected to your live AWS stack!

*Note: If you do not enter AWS credentials, CloudVault automatically runs in its built-in **Interactive Demo Mode**, which works 100% out of the box with simulated S3 Versioning, Presigned URLs, and Cognito authentication!*

---

## Alternative: 1-Click Render Blueprint Deployment

If you prefer an automated setup, CloudVault includes a [`render.yaml`](../render.yaml) file at the root of the project:

1. On the Render Dashboard, click **+ New** &rarr; **Blueprint**.
2. Select your `CloudVault` repository.
3. Render will read `render.yaml` and configure the static site, build commands, publish path, and rewrite rules automatically in one click.
4. Click **Apply**.
