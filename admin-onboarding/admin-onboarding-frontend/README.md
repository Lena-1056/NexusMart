# NexusMart Admin Onboarding Portal

This is an Angular application used exclusively for onboarding new administrators into the NexusMart system.

## Prerequisites
- Node.js (v16+)
- Angular CLI (`npm install -g @angular/cli`)

## How to Install
1. Navigate to this directory (`F:/ECommerce/admin-onboarding/admin-onboarding-frontend`).
2. Run `npm install` to install the required Angular packages.

## Project Structure
- **src/app/pages/onboard/**: Contains the `OnboardComponent` where the registration logic and form validation reside.
- **src/app/services/**: Contains the `AdminService` which handles HTTP communication with the onboarding backend.

## How to Run
Run the Angular development server using:
```bash
npm start
# OR
ng serve
```
The application will be accessible at `http://localhost:4200`.

## How to Use
- Open the application in your browser.
- Fill out the form with your Name, Email, and a temporary password.
- Upon submission, the backend will register your admin account and trigger an automated welcome email.
- Once registered, you can log in to the main Admin Dashboard (`http://localhost:5173`).
