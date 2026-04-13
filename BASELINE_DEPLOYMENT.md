# DEPLOYMENT.md — Project X Developer Guide
> **Read this before doing anything.** The IDE will walk you through each step.  
> Owner: Tech Enablement | Last updated: 2026-03-23

---

## What You Need Before Starting

| Requirement | Status |
|---|---|
| IDE (Antigravity / Claude) open | ✅ You're already in it |
| GitHub account (added to the GitHub Org by TE) | Must be done by TE before you start |
| App idea with a name | e.g. `cmdr-app` |
| App type decided | Business or Personal? |

That's it. You don't need AWS access, Docker knowledge, or Terraform experience.

---

## Step 1 — Create Your App Repo

Type this in your IDE chat:

```
/create-new-service
```

The IDE will ask you three questions, then automatically:
- Clone this baseline as a **private** GitHub repo
- Create the AWS infrastructure (ECR, ECS, DNS) via Terraform
- Configure the CI/CD pipeline
- Print your DEV URL

> ⏱ This takes ~5 minutes. You do not need to do anything while it runs.

---

## Step 2 — Local Development
Before pushing to the cloud, you can run your app locally. 

### Sync Secrets
If your app needs Snowflake or other AWS secrets, run the sync script:
```bash
python scripts/sync_secrets.py {your-app-name}
```
This will:
1. Pull the real secrets from AWS (requires `aws login`).
2. Create a local **`secrets.yaml`** file and a `snowflake_key.p8` private key file.
3. Both are git-ignored to keep your secrets safe.

### Run the App
```bash
# Setup environment
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r app/requirements.txt

# Run!
streamlit run app/main.py
```

---

## Step 3 — Build Your App

Start coding on a `feature/` branch:

```bash
git checkout -b feature/my-first-feature
```

The IDE is your co-pilot. Ask it to:
- Build components
- Fix errors
- Explain anything

**The only rules:**
1. If your app needs a new environment variable (API key, DB URL, etc.) → add its **name** (not value!) to `.env.template`
2. Never commit `.env` files — `.gitignore` blocks this automatically

---

## Step 4 — Ship to DEV

When you're ready to test on a real URL:

1. Tell the IDE: **"I'm ready to open a PR to dev"**
2. The IDE reads your changes and auto-writes the PR description
3. Review the PR description and hit **Submit**
4. GitHub runs CI automatically (~3 minutes):
   - ✅ Lint passes
   - ✅ Tests pass  
   - ✅ Docker build passes
5. Merge the PR → your app auto-deploys to DEV
6. Slack `#px-deployments`: `"✅ DEV Deploy Succeeded"`
7. Test at your DEV URL (provided during `/create-new-service`)

---

## Step 4 — Promote to PROD

When DEV looks good and you're ready to go live:

1. Tell the IDE: **"I'm ready for production"**
2. IDE opens a PR from `dev` → `main`
3. CI runs again (must pass)
4. Merge the PR → pipeline **pauses** automatically
5. Slack notification goes to TE: `"🔔 PROD Deploy Pending Approval"`
6. TE reviews your `app-config.yml` and the changes
7. TE clicks **Approve** on GitHub (~30 seconds for them)
8. Pipeline resumes → PROD deploys
9. Slack: `"🟢 PROD live at https://yourapp.pxltd.ca"`

> **Note:** All repos are private. PROD apps are accessible only at your `pxltd.ca` subdomain over HTTPS. TE will enable SSO if your app requires it — you don't need to do anything for that.

---

## Environment Variables — How They Work

```
Your .env.template             What actually happens
──────────────────────         ────────────────────────────────────
MY_API_KEY=                →   TE stores real value in AWS Secrets Manager
SNOWFLAKE_URL=             →   TE stores real value in AWS Secrets Manager
PORT=8501                  →   Hardcoded default — no secret needed
```

**You never see production secret values.** The CI/CD pipeline reads them from Secrets Manager at deploy time and injects them into your running container.

---

## Governance & Promotion Flow

Project X follows a "Sandbox-First" approach to keep Tech Enablement (TE) from being a blocker while maintaining data quality.

### 1. Build in your Sandbox
- Use your **Personal Snowflake Account** (via SSO).
- Create tables in your personal database: `SANDBOX_{INITIALS}`.
- You have full ADD/DROP privileges here.

### 2. Request Data Model Review
- Before moving to QA/PROD, your **Data Model** must be reviewed by the **Data Architect**.
- Goal: Ensure naming conventions, types, and logic align with the Central Data Warehouse (CEDW).
- Contact the **Data Architect** team on Slack with your proposed schema.

### 3. Promote to App Database
- Once approved, TE uses the **Service Account** to recreate your schema in the App Database (`PX_B_{APPNAME}`).
- Your application will now use its own dedicated service user (configured via `secrets.yaml` or AWS Secrets Manager).

---

## Environment Variables & Config

```
feature/my-feature  ← You work here. No restrictions.
       ↓  PR + CI only
     dev            ← Auto-deploys to DEV on merge
       ↓  PR + CI + TE approval
     main           ← Deploys to PROD after TE approves
```

---

## Getting Help

| Issue | What to do |
|---|---|
| CI failing | Ask the IDE — it can read the failure and suggest a fix |
| Need a new secret / env var | Message TE on Slack with the variable name |
| Need SSO enabled | TE handles this at PROD approval time |
| App crashed in PROD | Message TE immediately — they have CloudWatch logs |
| Anything else | Ask the IDE first, then TE |
