# NexusMart Developer Git Workflow Guide

Welcome to the Developer Guide! This document outlines the professional Git workflow standards we follow for the NexusMart Monorepo. Whether you are a solo developer pushing the initial history or a team member trying to clone a specific microservice, follow the guides below.

---

## 1. The Professional Branching Strategy

If you want to operate exactly like a professional software engineer at a real tech company, you must follow a strict branching strategy.

### Step 1: Never Work on the `main` Branch
The `main` branch is sacred because it represents what is running in production. When you want to build a new feature or fix a bug, you always create a "Feature Branch".
```bash
# Make sure you have the latest code
git checkout main
git pull

# Create a new branch named after your task
git checkout -b feature/add-stripe-payments
```

### Step 2: Write Code and Make "Atomic" Commits
Professionals make small, logical commits (called "atomic commits") as they work.
```bash
# Check what files you changed
git status

# Stage only the files related to the specific thing you just fixed
git add backend/payment-service/main.py

# Write a clear, descriptive commit message
git commit -m "feat(payment): integrate Stripe API for checkouts"
```

### Step 3: Push Your Branch to GitHub
Once your feature is complete, push your *Feature Branch* to the cloud (not the `main` branch!).
```bash
git push -u origin feature/add-stripe-payments
```

### Step 4: Open a Pull Request (PR)
Go to GitHub.com, and open a "Pull Request". This allows automated CI/CD pipelines (GitHub Actions) to test your code, and allows other developers to review your code before it is merged into `main`.

---

## 2. Pushing the Initial Monorepo (Folder-by-Folder)

If you are initializing the repository for the first time, committing folder-by-folder is an incredibly professional way to build your initial repository history. Your GitHub commit history will be clean, readable, and perfectly organized.

### Step 1: Initialize the Repository and Add Core Files
```bash
git init
git add README.md .gitignore docker-compose.yml start_all.ps1 architecture.mmd database_schema.mmd GIT_WORKFLOW.md
git commit -m "chore(core): initialize project repository, documentation, and orchestrator scripts"
```

### Step 2: Commit the Database Configuration
```bash
git add database/
git commit -m "chore(database): add PostgreSQL initialization scripts and schemas"
```

### Step 3: Commit the Frontend Portals (One by One)
```bash
git add frontend/react-customer-app/
git commit -m "feat(frontend): add customer shopping portal UI"

git add frontend/react-seller-dashboard/
git commit -m "feat(frontend): add seller inventory management dashboard"

git add frontend/react-admin-dashboard/
git commit -m "feat(frontend): add master admin control panel"

git add frontend/react-delivery-partner-app/
git commit -m "feat(frontend): add delivery driver logistics portal"
```

### Step 4: Commit the Backend Microservices (One by One)
```bash
git add backend/api-gateway/
git commit -m "feat(backend): add Spring Boot API Gateway for route mapping"

git add backend/auth-service/
git commit -m "feat(backend): add JWT authentication and security service"

git add backend/user-service/
git commit -m "feat(backend): add Java user profile and identity management"

git add backend/product-service/
git commit -m "feat(backend): add Java catalog and product data service"

git add backend/cart-service/
git commit -m "feat(backend): add Java shopping cart state management"

git add backend/order-service/
git commit -m "feat(backend): add Java order processing and lifecycle service"

git add backend/payment-service/
git commit -m "feat(backend): add payment processing microservice"

git add backend/shipping-service/
git commit -m "feat(backend): add Java logistics and delivery tracking service"

git add backend/inventory-service/
git commit -m "feat(backend): add Java stock and warehouse inventory management"

git add backend/seller-service/
git commit -m "feat(backend): add Python FastAPI seller management service"

git add backend/admin-service/
git commit -m "feat(backend): add Python FastAPI master admin operations service"

git add backend/search-service/
git commit -m "feat(backend): add Python FastAPI elastic product search service"

git add backend/wishlist-service/
git commit -m "feat(backend): add Python FastAPI user wishlist management"

git add backend/review-service/
git commit -m "feat(backend): add Python FastAPI customer ratings and reviews service"

git add backend/notification-service/
git commit -m "feat(backend): add Python FastAPI email and push notification service"
```

### Step 5: Final Push
```bash
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

---

## 3. Sparse Checkout (For Team Members)

If a developer on your team *only* wants to see and work with a specific folder (for example, the `backend` folder) to save disk space and reduce IDE clutter, they can use **Git Sparse Checkout**.

Instead of running a normal `git clone`, they run these specific commands:

```bash
# 1. Clone the repository without downloading the files yet (creates an empty shell)
git clone --no-checkout <YOUR_GITHUB_REPO_URL> NexusMart-Backend
cd NexusMart-Backend

# 2. Tell Git to enable Sparse Checkout
git sparse-checkout init --cone

# 3. Tell Git exactly which folders they want (just the backend folder!)
git sparse-checkout set backend

# 4. Finally, download the files for that specific folder
git checkout main
```

When they open their code editor, the only folder they will see is the `backend/` folder! The `frontend`, `database`, and other folders will be completely hidden and ignored by their local machine.
