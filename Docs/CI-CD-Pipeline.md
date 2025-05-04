# 🚀 CI/CD Pipeline for MEAN Stack Application

This guide provides a comprehensive setup for implementing a **Continuous Integration and Continuous Deployment (CI/CD)** pipeline for your MEAN stack application using **GitHub Actions**, with deployment to **Vercel** for the Angular frontend and **Render** for the Express/Node.js backend.

## 📁 Project Structure

Your project follows a standard MEAN stack structure:

```
/Pfe-v0
|-- /src                  # Angular frontend
|   |-- /app              # Angular components, services, etc.
|   |-- /assets           # Static assets
|   |-- /environments     # Environment configurations
|   |-- main.ts           # Angular entry point
|   |-- server.ts         # SSR server configuration
|-- /backend              # Express backend (separate folder)
|-- .github/
|   |-- workflows/ci-cd.yml  # GitHub Actions workflow file
|-- angular.json          # Angular configuration
|-- package.json          # Project dependencies
|-- tsconfig.json         # TypeScript configuration
```

## ✅ GitHub Actions Workflow

Create a `.github/workflows/ci-cd.yml` file with the following configuration:

```yaml
name: CI/CD Pipeline for MEAN Stack

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test-frontend:
    name: Test Angular Frontend
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 19

      - name: Install Dependencies
        run: npm install

      - name: Run Tests
        run: npm run test -- --watch=false --browsers=ChromeHeadless

  build-deploy-frontend:
    name: Build & Deploy Angular Frontend
    runs-on: ubuntu-latest
    needs: test-frontend
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 19

      - name: Install Dependencies
        run: npm install

      - name: Update Production API URL
        run: |
          sed -i "s|apiUrl: 'http://localhost:8080'|apiUrl: '${{ secrets.BACKEND_API_URL }}'|g" src/environments/environment.prod.ts

      - name: Build Angular App
        run: npm run build -- --configuration production

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          vercel-args: '--prod'

  test-deploy-backend:
    name: Test & Deploy Node.js Backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    defaults:
      run:
        working-directory: backend

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 19

      - name: Install Backend Dependencies
        run: npm install

      - name: Run Backend Tests
        run: npm test

      - name: Trigger Deploy to Render
        run: |
          curl -X POST \
          -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
          -H "Content-Type: application/json" \
          https://api.render.com/deploy/${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
```

## 🔧 Setup Instructions

### 1. Frontend (Angular) Setup for Vercel

1. **Create a Vercel account** and install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. **Initialize Vercel in your project**:
   ```bash
   vercel login
   vercel link
   ```

3. **Create a `vercel.json` file** in your project root:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/pfe-v0/server/server.mjs",
         "use": "@vercel/node"
       },
       {
         "src": "dist/pfe-v0/browser/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "${{ secrets.BACKEND_API_URL }}/api/$1"
       },
       {
         "handle": "filesystem"
       },
       {
         "src": "/assets/(.*)",
         "dest": "/dist/pfe-v0/browser/assets/$1"
       },
       {
         "src": "/(.*)",
         "dest": "/dist/pfe-v0/server/server.mjs"
       }
     ]
   }
   ```

4. **Add the following secrets to GitHub**:
   - `VERCEL_TOKEN`: Get from Vercel → Account Settings → Tokens
   - `VERCEL_ORG_ID`: Get from Vercel project settings
   - `VERCEL_PROJECT_ID`: Get from Vercel project settings
   - `BACKEND_API_URL`: Your production backend URL (e.g., https://your-app-api.onrender.com)

### 2. Backend (Express/Node.js) Setup for Render

1. **Create a Render account** and set up a Web Service:
   - Connect your GitHub repository
   - Set the root directory to `/backend`
   - Set the build command: `npm install`
   - Set the start command: `node server.js` (adjust to your entry point)
   - Add environment variables from your `.env` file

2. **Add the following secrets to GitHub**:
   - `RENDER_API_KEY`: Get from Render → Account settings → API Keys
   - `RENDER_SERVICE_ID`: Get from your Render service URL or dashboard

### 3. Environment Variables

#### Frontend Environment Variables (Vercel)

Configure in the Vercel dashboard:
- `NODE_ENV`: production
- Any other frontend-specific variables

#### Backend Environment Variables (Render)

Configure in the Render dashboard:
- `NODE_ENV`: production
- `PORT`: 8080 (or your preferred port)
- `DB_HOST`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `CLIENT_URL`: Your Vercel frontend URL
- Other variables from your `.env` file

## 🧪 Testing the Pipeline

1. **Push changes to your main branch**:
   ```bash
   git add .
   git commit -m "Update for CI/CD pipeline"
   git push origin main
   ```

2. **Monitor the GitHub Actions workflow**:
   - Go to your GitHub repository
   - Click on "Actions" tab
   - Watch the workflow execution

3. **Verify deployments**:
   - Check Vercel dashboard for frontend deployment
   - Check Render dashboard for backend deployment

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check the build logs in GitHub Actions
   - Ensure all dependencies are properly installed
   - Verify that environment variables are correctly set

2. **Deployment Failures**:
   - Verify API keys and tokens are valid
   - Check for any environment-specific code that might fail in production

3. **API Connection Issues**:
   - Ensure CORS is properly configured in your backend
   - Verify that the `BACKEND_API_URL` is correctly set in GitHub secrets
   - Check that environment.prod.ts is properly updated during the build

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Angular Deployment Guide](https://angular.io/guide/deployment)

## 🔄 Continuous Improvement

Consider enhancing your CI/CD pipeline with:

1. **Code Quality Checks**:
   ```yaml
   - name: Run ESLint
     run: npm run lint
   ```

2. **Automated E2E Tests**:
   ```yaml
   - name: Run E2E Tests
     run: npm run e2e
   ```

3. **Semantic Versioning**:
   ```yaml
   - name: Bump version
     uses: phips28/gh-action-bump-version@master
     with:
       tag-prefix: 'v'
   ```

4. **Slack Notifications**:
   ```yaml
   - name: Notify Slack
     uses: 8398a7/action-slack@v3
     with:
       status: ${{ job.status }}
       fields: repo,message,commit,author,action,eventName,ref,workflow
     env:
       SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
     if: always()
   ```
