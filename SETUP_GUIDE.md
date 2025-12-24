# Hirely - Setup & Running Guide

## Prerequisites
- **Bun** (v1.0+) - [Download from bun.sh](https://bun.sh)
- **Node.js** (v20+) - Required for some dependencies
- **PostgreSQL** (v17) - Can use Supabase managed database
- **Supabase CLI** (optional) - For local development

## Required API Keys & Services

### 1. Supabase (Database & Storage)

#### Step 1: Create Account & Project
- Visit [supabase.com](https://supabase.com) and click **"Start your project"**
- Sign up with GitHub, Google, or email
- After login, click **"New Project"**
- Fill in:
  - **Name**: `hirely` (or any name)
  - **Database Password**: Create a strong password (save this!)
  - **Region**: Choose closest to you
  - **Pricing Plan**: Select **Free** tier
- Click **"Create new project"** (takes ~2 minutes to provision)

#### Step 2: Get API Keys
- Once project is ready, go to **Project Settings** (gear icon in left sidebar)
- Click **"API"** in the Configuration section
- Copy these values:
  - **Project URL** → This is your `SUPABASE_URL` (e.g., `https://abcdefgh.supabase.co`)
  - **Project API keys** section:
    - **anon public** → This is your `SUPABASE_ANON_KEY`
    - **service_role** → This is your `SUPABASE_SERVICE_ROLE_KEY` (click eye icon to reveal)

#### Step 3: Get Database URL
- Still in **Project Settings**, click **"Database"** in Configuration section
- Scroll down to **Connection string** section
- Select **URI** tab
- Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
- Replace `[YOUR-PASSWORD]` with the database password you created in Step 1
- This is your `DATABASE_URL`

#### Step 4: Create Storage Buckets
- Go to **Storage** in the left sidebar (folder icon)
- Click **"Create a new bucket"** button
- Create first bucket:
  - **Name**: `resumes`
  - **Public bucket**: Toggle **ON** (so resumes can be downloaded)
  - Click **"Create bucket"**
- Create second bucket:
  - **Name**: `hr-docs`
  - **Public bucket**: Toggle **ON**
  - Click **"Create bucket"**
- Both buckets should now appear in the Storage list

#### Step 5: Configure Storage Policies (Important!)
For each bucket (`resumes` and `hr-docs`):
- Click on the bucket name
- Go to **"Policies"** tab
- Click **"New Policy"**
- Select **"For full customization"**
- Create policies for each operation:
  1. **INSERT Policy**:
     - Policy name: `Allow authenticated users to upload`
     - Target roles: `authenticated`
     - Policy definition: `true`
  2. **SELECT Policy**:
     - Policy name: `Allow public read access`
     - Target roles: `public`
     - Policy definition: `true`
  3. **DELETE Policy**:
     - Policy name: `Allow authenticated users to delete`
     - Target roles: `authenticated`
     - Policy definition: `true`

**Your Supabase setup is complete!** ✅

### 2. Groq AI (AI/LLM Features)
- Visit [console.groq.com](https://console.groq.com) and sign up
- Create API Key from API Keys section
- `GROQ_API_KEY` - Your API key
- `GROQ_CHAT_MODEL` - Use `llama-3.3-70b-versatile` or `mixtral-8x7b-32768`

### 3. Brevo (Email Service) - Optional
- Visit [brevo.com](https://www.brevo.com) and create account
- Get from Account → SMTP & API:
  - `BREVO_API_KEY` - For API-based emails
  - `BREVO_SMTP_API_KEY` - For SMTP emails

## Installation Steps

### 1. Clone & Install Dependencies
```bash
cd e:\Hirely\hirely

# Install API dependencies
cd api
bun install

# Install Web dependencies
cd ../web
bun install
```

### 2. Configure API Environment
Create `api/.env` file:
```env
PORT=3001
CORS_ORIGIN=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_RESUME_BUCKET=resumes
SUPABASE_HR_DOCS_BUCKET=hr-docs

DATABASE_URL=postgresql://user:password@host:5432/database

GROQ_API_KEY=your-groq-api-key
GROQ_CHAT_MODEL=llama-3.3-70b-versatile

# Optional - Uncomment if using Brevo
# BREVO_API_KEY=your-brevo-api-key
# BREVO_SMTP_API_KEY=your-brevo-smtp-key
```

### 3. Configure Web Environment
Create `web/.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Setup Database
```bash
cd api

# Generate migrations
bun run drizzle:generate

# Run migrations
bun run drizzle:migrate
```

### 5. Run the Application
Open two terminal windows:

**Terminal 1 - API Server:**
```bash
cd api
bun run dev
```
API runs on `http://localhost:3001`

**Terminal 2 - Web App:**
```bash
cd web
bun run dev
```
Web app runs on `http://localhost:3000`

## Verification
- Visit `http://localhost:3000` - Should see login page
- Check `http://localhost:3001` - Should see API response
- Check console logs for any missing environment variables

## Common Issues
- **Database connection failed**: Verify `DATABASE_URL` format and credentials
- **Supabase errors**: Check URL and keys are correct, buckets exist
- **AI features not working**: Verify `GROQ_API_KEY` is valid
- **Port already in use**: Change `PORT` in api/.env or kill existing process

## Project Structure
- `api/` - Backend API (Hono + Drizzle ORM)
- `web/` - Frontend (Next.js + React)
- `supabase/` - Supabase configuration
