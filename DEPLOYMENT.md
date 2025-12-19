# Deployment Guide

This guide will help you deploy Comet Studio to Vercel and configure all required environment variables.

## Prerequisites

- A [Vercel](https://vercel.com) account
- A [v0.dev](https://v0.dev) account with an API key
- A PostgreSQL database (Vercel Postgres recommended)

## Critical: AUTH_SECRET Environment Variable

⚠️ **IMPORTANT**: The `AUTH_SECRET` environment variable is **REQUIRED** for the application to work properly. Without it, authentication will fail and the AI chat functionality will not work.

### What is AUTH_SECRET?

`AUTH_SECRET` is used by NextAuth.js to encrypt session tokens and cookies. It must be:
- A random string of at least 32 characters
- Different for each environment (development, staging, production)
- Kept secret and never committed to version control

### How to Generate AUTH_SECRET

You can generate a secure random string using one of these methods:

#### Method 1: Using OpenSSL (Recommended)
```bash
openssl rand -base64 32
```

#### Method 2: Using Online Generator
Visit: https://generate-secret.vercel.app/32

#### Method 3: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deploying to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Fork or push this repository to your GitHub account**

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

3. **Click "Add New" → "Project"**

4. **Import your GitHub repository**

5. **Configure Environment Variables** (Before deploying)
   
   Click on "Environment Variables" and add the following:

   | Name | Value | Description |
   |------|-------|-------------|
   | `AUTH_SECRET` | `<generated-secret>` | **REQUIRED** - Generate using method above |
   | `POSTGRES_URL` | `<your-postgres-url>` | **REQUIRED** - PostgreSQL connection string |
   | `V0_API_KEY` | `<your-v0-api-key>` | **REQUIRED** - Get from https://v0.dev/chat/settings/keys |
   | `V0_API_URL` | `http://localhost:3001/v1` | Optional - Custom v0 API URL |

6. **Deploy**
   
   Click "Deploy" and wait for the deployment to complete.

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add AUTH_SECRET
   vercel env add POSTGRES_URL
   vercel env add V0_API_KEY
   ```

## Adding AUTH_SECRET to Existing Deployment

If you've already deployed but forgot to add `AUTH_SECRET`:

1. **Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Navigate to Settings → Environment Variables**

3. **Add new environment variable:**
   - Name: `AUTH_SECRET`
   - Value: Your generated secret (use one of the generation methods above)
   - Environment: Select all (Production, Preview, Development)

4. **Redeploy your application:**
   - Go to "Deployments" tab
   - Click the three dots (•••) on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger automatic redeployment

## Verifying AUTH_SECRET Configuration

After deployment, check your application logs:

1. **Go to Vercel Dashboard → Your Project → Deployments**
2. **Click on the latest deployment**
3. **Check the "Functions" or "Runtime Logs" tab**

If `AUTH_SECRET` is missing, you'll see this error:
```
❌ Missing AUTH_SECRET environment variable. Please check your .env file.
```

If everything is configured correctly, you should not see this error and authentication should work properly.

## Setting up PostgreSQL Database

### Using Vercel Postgres (Recommended)

1. **Go to your project in Vercel Dashboard**
2. **Navigate to "Storage" tab**
3. **Click "Create Database" → "Postgres"**
4. **Follow the setup wizard**
5. **Copy the `POSTGRES_URL` connection string**
6. **It will be automatically added to your environment variables**

### Run Database Migrations

After deploying, run migrations:

```bash
pnpm db:migrate
```

Or set up a build command in Vercel:
```json
{
  "buildCommand": "pnpm install && pnpm db:migrate && pnpm build"
}
```

## Troubleshooting

### Authentication Not Working

**Symptom**: Users can't log in, or AI responses fail

**Solution**: 
1. Verify `AUTH_SECRET` is set in Vercel environment variables
2. Ensure `AUTH_SECRET` is at least 32 characters long
3. Redeploy the application after adding the variable

### Database Connection Errors

**Symptom**: Database queries fail

**Solution**:
1. Verify `POSTGRES_URL` is correctly set
2. Ensure database migrations have been run
3. Check database connection from Vercel logs

### v0 API Errors

**Symptom**: AI responses fail or timeout

**Solution**:
1. Verify `V0_API_KEY` is valid
2. Check your v0.dev account has sufficient credits
3. Verify API key permissions at https://v0.dev/chat/settings/keys

## Security Best Practices

1. **Never commit** `.env` files to version control
2. **Use different** `AUTH_SECRET` values for development and production
3. **Rotate secrets** regularly (every 90 days recommended)
4. **Limit database** access to only what's needed
5. **Enable Vercel's** security features (DDoS protection, etc.)

## Support

If you encounter any issues:

1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review your application logs in Vercel Dashboard
3. Ensure all environment variables are correctly set
4. Open an issue in the GitHub repository

---

**Remember**: The application **will not work** without `AUTH_SECRET`. This is the most common deployment issue!
