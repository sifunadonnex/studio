zz8
# Top Autocorrect Garage - Web Application

Welcome to the Top Autocorrect Garage web application! This is a comprehensive platform designed to manage garage operations, customer interactions, and vehicle maintenance. It features role-based access for customers, staff, and administrators, along with AI-powered predictive maintenance.

## Overview

Top Autocorrect Garage aims to streamline the process of booking appointments, managing vehicle service history, handling subscriptions, and providing excellent customer support through an integrated chat system. Administrators have a full suite of tools to manage users, services, appointments, subscriptions, and view reports.

## Key Features

*   **User Authentication:** Secure login and registration for customers, staff, and admins using Firebase Authentication.
*   **Role-Based Dashboards:** Tailored dashboard experiences for Customers, Staff, and Administrators.
*   **Appointment Booking:** Intuitive interface for customers to book services, selecting preferred dates, times, and services.
*   **Vehicle Management:** Customers can manage their vehicle details and service history.
*   **Predictive Maintenance:** AI-powered (Genkit) predictions for upcoming vehicle maintenance needs based on service history.
*   **Subscription Management:** Customers can subscribe to service plans, and admins can manage these subscriptions.
*   **Integrated Chat:** Real-time chat functionality for customers to communicate with staff, and for staff to manage these conversations.
*   **Admin Panel:**
    *   User Management (View, Edit roles)
    *   Appointment Management (View all, Update status)
    *   Service Management (Add, Edit, Delete services)
    *   Subscription Management (View all, Update status)
    *   Reporting (View mock reports with AI insights)
*   **Responsive Design:** UI built with ShadCN UI components and Tailwind CSS for a modern and responsive experience across devices.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **Authentication:** Firebase Authentication
*   **Database:** Firebase Firestore
*   **Generative AI:** Google Genkit (for predictive maintenance, report insights)
*   **State Management:** React Context (for session management)
*   **Forms:** React Hook Form (implicitly used by some ShadCN components, manual for others)
*   **Toast Notifications:** Custom hook based on ShadCN's Toast

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Firebase Account & Project

### Firebase Setup

1.  Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2.  Enable **Authentication** (Email/Password sign-in method).
3.  Set up **Firestore Database** in Native mode.
4.  Create a Web App in your Firebase project settings.
5.  Copy the Firebase configuration object (apiKey, authDomain, etc.).
6.  Create a `.env.local` file in the root of your project and add your Firebase public credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)

    # For Genkit AI features (Google AI Studio API Key)
    GOOGLE_GENAI_API_KEY=your_google_ai_studio_api_key
    ```
7.  **Firestore Security Rules:** Update your Firestore security rules (`firestore.rules`) to allow appropriate access for users, staff, and admins. Basic examples are provided within the chat logs of Firebase Studio during development, but ensure they are secure and meet your application's needs. You'll need rules for `users`, `appointments`, `chats`, `subscriptions`, and `users/{userId}/vehicles`.
8.  **Firestore Indexes:** Some queries (especially those with `orderBy` on different fields or complex `where` clauses) will require composite indexes. Firestore usually provides a link in the server console error message to create these directly. Pay attention to console output during development.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Application

1.  **Development Mode:**
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:3000` (or the port specified in `package.json` if customized, like 9002).

2.  **Genkit Development Server (for AI features):**
    If you are actively developing or testing Genkit flows, run the Genkit emulator in a separate terminal:
    ```bash
    npm run genkit:dev
    # or for auto-reloading on changes
    npm run genkit:watch
    ```

3.  **Production Build & Start:**
    ```bash
    npm run build
    npm run start
    ```

## Available Scripts

*   `npm run dev`: Starts the Next.js development server.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with watch mode.
*   `npm run build`: Creates a production build of the application.
*   `npm run start`: Starts the Next.js production server.
*   `npm run lint`: Lints the codebase using Next.js's default ESLint configuration.
*   `npm run typecheck`: Runs TypeScript type checking.

## Folder Structure (Simplified)

```
.
├── src/
│   ├── actions/        # Server Actions (auth, booking, profile, chat, etc.)
│   ├── ai/             # Genkit AI flows and configuration
│   ├── app/            # Next.js App Router (pages, layouts)
│   │   ├── (auth)/         # Auth-related pages (login, register)
│   │   ├── (dashboards)/   # Authenticated dashboard layouts and pages
│   │   ├── api/            # API routes (if any, Genkit flows are preferred)
│   │   └── ...             # Other public pages (home, services, contact)
│   ├── components/     # Shared UI components (ShadCN UI, custom layout)
│   ├── contexts/       # React Context providers (e.g., SessionContext)
│   ├── hooks/          # Custom React hooks (e.g., useUserSession)
│   ├── lib/            # Utility functions, Firebase config, type definitions
│   └── services/       # Mocked/Placeholder external services (e.g., payment)
├── public/             # Static assets
├── .env.local          # Environment variables (ignored by Git)
├── next.config.ts      # Next.js configuration
├── package.json        # Project dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Default Credentials for Testing

After setting up Firebase, you can register users through the application.

*   **Admin User:**
    *   Register a user normally.
    *   Manually go to your Firebase Firestore console, find the user's document in the `users` collection (by their UID), and change their `role` field to `"admin"`.
*   **Staff User:**
    *   Register another user.
    *   Manually change their `role` field in Firestore to `"staff"`.
*   **Customer User:**
    *   Any user registered through the application will default to the `"customer"` role.

## Contributing

(Placeholder: Detail contribution guidelines if this were an open-source project.)

## License

(Placeholder: e.g., MIT License. Specify if applicable.)

---

This README provides a starting point. Feel free to expand it with more specific details about your project's architecture, deployment, or advanced configurations as needed.
