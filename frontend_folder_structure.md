```markdown
.
├── app/
│   ├── layout.tsx # Root layout
│   ├── global.css # Or styles/globals.css imported here
│   │
│   ├── (auth)/ # Route group for authentication pages
│   │   ├── layout.tsx # Auth-specific layout (e.g., AuthLayout)
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── register/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── forgot-password/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── reset-password/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   │
│   ├── (admin)/ # Route group for admin users
│   │   ├── layout.tsx # Admin-specific layout (e.g., AdminDashboardLayout)
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── loading.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   │
│   ├── (organization)/ # Route group for organization users
│   │   ├── layout.tsx # Organization-specific layout (e.g., OrgDashboardLayout)
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   └── loading.tsx
│   │   ├── applicants/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   │
│   ├── (candidate)/ # Route group for candidate users
│   │   ├── layout.tsx # Candidate-specific layout (e.g., CandidateDashboardLayout)
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── applications/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   │
│   ├── jobs/ # Public job listings
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── loading.tsx
│   │
│   ├── api/ # Route handlers for backend functionality (if not using a separate backend)
│   │   ├── auth/
│   │   │   └── […nextauth]/route.ts # Example for NextAuth.js
│   │   └── webhooks/
│   │       └── stripe/route.ts
│   │
│   ├── template.tsx # Optional: Re-renders on navigation for specific layouts
│   ├── error.tsx # Root error boundary
│   ├── loading.tsx # Root loading UI
│   └── not-found.tsx # Root 404 page
│
├── components/
│   ├── ui/ # ShadCN UI components (often managed by CLI)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── input.tsx
│   │   └── ... (other ShadCN components)
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx # Could be a base for role-specific dashboard layouts
│   │   ├── AdminDashboardLayout.tsx
│   │   ├── OrgDashboardLayout.tsx
│   │   ├── CandidateDashboardLayout.tsx
│   │   └── SiteLayout.tsx # For public-facing pages
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── job-postings/
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobList.tsx
│   │   │   ├── JobSearchForm.tsx
│   │   │   └── JobForm.tsx
│   │   ├── organization/
│   │   │   ├── OrganizationForm.tsx
│   │   │   └── OrganizationProfile.tsx
│   │   ├── candidate/
│   │   │   ├── CandidateProfileForm.tsx
│   │   │   └── ApplicationList.tsx
│   │   └── admin/
│   │       ├── UserTable.tsx
│   │       └── StatsDisplay.tsx
│   │
│   └── shared/
│       ├── Avatar.tsx
│       ├── DataTable/
│       │    ├── DataTable.tsx
│       │    └── DataTableColumns.tsx
│       ├── FileUpload.tsx
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── ThemeToggle.tsx
│
├── lib/
│   ├── api.ts # Axios instance, base API functions for React Query
│   ├── client.ts # Alias for api.ts or separate client configurations
│   ├── utils.ts # General utility functions (date formatting, string manipulation, etc.)
│   ├── hooks.ts # Global custom hooks (e.g., useDebounce, useLocalStorage)
│   ├── validators.ts # Zod schemas for form validation
│   ├── types.ts # Global TypeScript types/interfaces
│   └── constants.ts # Application-wide constants
│
├── hooks/ # Custom React hooks, especially those using React Query
│   ├── useAuth.ts # Example auth-related hooks
│   ├── queries/ # React Query hooks
│   │   ├── useJobPostings.ts
│   │   ├── useOrganization.ts
│   │   └── useUserProfile.ts
│   └── mutations/ # React Query mutation hooks
│       ├── useCreateJobPosting.ts
│       └── useUpdateUserProfile.ts
│
├── providers/
│   ├── AuthProvider.tsx # For session/user context
│   ├── QueryProvider.tsx # For React Query client
│   ├── ThemeProvider.tsx # For ShadCN/UI theme
│   └── ToasterProvider.tsx # For toast notifications
│
├── store/ # Optional: For global state management (Zustand, Jotai)
│   ├── userStore.ts
│   └── settingsStore.ts
│
├── styles/
│   ├── globals.css # Tailwind base, custom global styles
│   └── themes.css # If managing multiple themes beyond ShadCN
│
├── public/
│   ├── images/
│   │   └── logo.png
│   ├── fonts/
│   │   └── ...
│   └── robots.txt
│
├── .env.local
├── .eslintrc.json
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts # Or .js, for Tailwind CSS configuration
├── tsconfig.json
└── README.md
```
