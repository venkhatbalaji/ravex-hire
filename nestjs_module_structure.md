# NestJS Module Structure Proposal

This document outlines the proposed structure for the NestJS modules in the hiring platform application. It's based on the previously defined backend folder structure, entities, and DTOs.

---

### `AppModule` (Root Module)
*   **Description**: The root module of the application, responsible for orchestrating all other modules and global configurations.
*   **Imports**:
    *   `ConfigModule` (for application-wide configuration)
    *   `DatabaseModule` (for database connectivity)
    *   `CoreModule` (for global services like logging, interceptors)
    *   `AuthModule`
    *   `UsersModule`
    *   `OrganizationsModule`
    *   `JobPostingsModule`
    *   `CandidatesModule`
    *   `ApplicationsModule`
    *   `SubscriptionsModule`
    *   `PaymentModule`
    *   `AdminModule`
    *   `SharedModule` (if it provides global utilities needed at bootstrap)
    *   `ServeStaticModule` (for serving static assets, if applicable)
    *   `ScheduleModule` (if using NestJS for cron jobs)
*   **Controllers**: `AppController` (optional, for basic health checks or root endpoints)
*   **Providers**: `AppService` (optional, for basic root logic)
*   **Exports**: None (root module typically doesn't export).

---

### `ConfigModule`
*   **Description**: Manages application configuration, loading environment variables, and providing access to configuration values. Uses NestJS's `@nestjs/config`.
*   **Imports**: None (typically self-contained for loading .env files)
*   **Controllers**: None
*   **Providers**: `ConfigService` (from `@nestjs/config`)
*   **Exports**: `ConfigService` (or the entire `NestConfigModule` itself if using `@nestjs/config`'s global option)

---

### `DatabaseModule`
*   **Description**: Responsible for establishing and managing the database connection. Typically uses `TypeOrmModule.forRootAsync` to configure TypeORM, injecting `ConfigService` to get database credentials.
*   **Imports**: `ConfigModule` (to access database configuration settings)
*   **Controllers**: None
*   **Providers**: None (configuration is done via `TypeOrmModule.forRootAsync`)
*   **Exports**: `TypeOrmModule` (implicitly, by being imported into `AppModule`)

---

### `CoreModule`
*   **Description**: Provides truly global, application-wide services, interceptors, filters, and pipes that are part of the application's core infrastructure. This helps keep `AppModule` cleaner.
*   **Imports**: `ConfigModule` (if core services need configuration)
*   **Controllers**: None
*   **Providers**:
    *   `LoggingService` (custom logger)
    *   `HttpExceptionFilter` (global exception filter)
    *   `ResponseInterceptor` (global response formatting)
    *   `TenantContextService` (if using request-scoped service for multi-tenancy context)
    *   `APP_INTERCEPTOR`, `APP_FILTER`, `APP_PIPE` (for globally applying these providers)
*   **Exports**: `LoggingService`, `TenantContextService` (if needed by other modules directly, though often used implicitly via global setup). Could be marked as `@Global()` if appropriate.

---

### `AuthModule`
*   **Description**: Handles user authentication (login, registration of initial organization admin), JWT generation & validation, and password management.
*   **Imports**:
    *   `UsersModule` (to find and create users, especially during organization registration)
    *   `OrganizationsModule` (to create organizations during initial admin registration)
    *   `PassportModule` (for authentication strategies)
    *   `JwtModule.registerAsync` (for JWT configuration, injecting `ConfigService`)
    *   `ConfigModule` (to get JWT secret and expiration)
*   **Controllers**: `AuthController` (handles `/auth/login`, `/auth/register-organization`)
*   **Providers**:
    *   `AuthService`
    *   `JwtStrategy` (for validating JWTs)
    *   `LocalStrategy` (for username/password login)
    *   `UserSerializationService` (or similar for session management if using Passport sessions, less common for JWT APIs)
*   **Exports**: `AuthService`, `JwtModule`, `PassportModule` (so guards like `JwtAuthGuard` can be used elsewhere)

---

### `UsersModule`
*   **Description**: Manages user-related operations, including CRUD for users (primarily by super admins or for profile management by the user themselves), role management, and user profile details not covered by `CandidateProfile`.
*   **Imports**:
    *   `TypeOrmModule.forFeature([User, CandidateProfile])` (if `CandidateProfile` creation is tied here, or handled in `CandidatesModule`)
    *   `forwardRef(() => OrganizationsModule)` (if `User` needs to link to `Organization` and there's a circular dependency)
*   **Controllers**: `UsersController` (e.g., for admin to manage users, or for users to manage their own profiles)
*   **Providers**:
    *   `UsersService`
    *   `UserRepository` (custom repository if complex queries are needed beyond TypeORM's default)
    *   `CandidateProfileService` (if managing basic candidate profile creation alongside user creation, otherwise this is in `CandidatesModule`)
*   **Exports**: `UsersService`, `CandidateProfileService` (if applicable)

---

### `OrganizationsModule`
*   **Description**: Manages organizations (tenants), including their creation (though initial creation might be via `AuthModule`), approval, and details.
*   **Imports**:
    *   `TypeOrmModule.forFeature([Organization, User, Subscription])`
    *   `forwardRef(() => UsersModule)` (if `Organization` needs to link to `User` as owner and there's a circular dependency)
    *   `SubscriptionsModule` (potentially, if organization details page shows subscription status)
*   **Controllers**: `OrganizationsController` (for managing organization details, approval by super admin)
*   **Providers**:
    *   `OrganizationsService`
    *   `OrganizationRepository` (custom repository if needed)
*   **Exports**: `OrganizationsService`

---

### `JobPostingsModule`
*   **Description**: Handles creation, management, and searching of job postings by organizations and viewing by candidates.
*   **Imports**:
    *   `TypeOrmModule.forFeature([JobPosting, Organization, User, Application])`
    *   `AuthModule` (for guards, to ensure authenticated users are posting/managing jobs)
    *   `OrganizationsModule` (to ensure job postings are linked to valid organizations)
*   **Controllers**: `JobPostingsController` (handles `/jobs`, `/organizations/:orgId/jobs`)
*   **Providers**:
    *   `JobPostingsService`
    *   `JobPostingRepository` (custom repository)
*   **Exports**: `JobPostingsService`

---

### `CandidatesModule`
*   **Description**: Manages candidate profiles, including their resumes, skills, and other profile information.
*   **Imports**:
    *   `TypeOrmModule.forFeature([CandidateProfile, User, Application])`
    *   `UsersModule` (as `CandidateProfile` is tightly coupled with a `User`)
    *   `AuthModule` (for guards, ensuring candidates are managing their own profiles)
*   **Controllers**: `CandidatesController` (handles `/candidate/profile`)
*   **Providers**:
    *   `CandidateProfileService`
    *   `CandidateProfileRepository` (custom repository)
*   **Exports**: `CandidateProfileService`

---

### `ApplicationsModule`
*   **Description**: Manages job applications submitted by candidates to job postings.
*   **Imports**:
    *   `TypeOrmModule.forFeature([Application, JobPosting, CandidateProfile, Organization])`
    *   `JobPostingsModule` (to link applications to job postings)
    *   `CandidatesModule` (to link applications to candidate profiles)
    *   `AuthModule` (for guards)
    *   `NotificationsModule` (optional, if notifications are sent upon application status changes)
*   **Controllers**: `ApplicationsController` (handles `/applications`, `/jobs/:jobId/apply`, `/organizations/:orgId/applications`)
*   **Providers**:
    *   `ApplicationsService`
    *   `ApplicationRepository` (custom repository)
*   **Exports**: `ApplicationsService`

---

### `SubscriptionsModule`
*   **Description**: Manages subscription plans, organization subscriptions, and their status.
*   **Imports**:
    *   `TypeOrmModule.forFeature([Subscription, Organization, PaymentTransaction])` // Assuming PaymentTransaction entity
    *   `OrganizationsModule` (as subscriptions are tied to organizations)
    *   `PaymentModule` (to interact with payment processing for subscription renewals, new subscriptions)
    *   `ConfigModule` (for any subscription-related configurations)
*   **Controllers**: `SubscriptionsController` (for organizations to manage their subscription, and for super admins to view/manage subscriptions)
*   **Providers**:
    *   `SubscriptionsService`
    *   `SubscriptionRepository` (custom repository)
*   **Exports**: `SubscriptionsService`

---

### `PaymentModule`
*   **Description**: Integrates with a payment provider (e.g., Stripe) to handle payment processing for subscriptions, one-time job postings (if applicable), etc.
*   **Imports**:
    *   `TypeOrmModule.forFeature([PaymentTransaction, Subscription, Organization])` // Or relevant entities
    *   `ConfigModule` (for Stripe API keys, webhook secrets)
    *   `SubscriptionsModule` (to update subscription status after payment)
    *   `OrganizationsModule` (to associate payments with organizations)
*   **Controllers**: `PaymentController` (e.g., for creating payment intents), `StripeWebhookController` (for handling Stripe webhook events)
*   **Providers**:
    *   `PaymentService` (core payment logic)
    *   `StripeService` (Stripe-specific interactions)
    *   `TransactionRepository` (custom repository for payment transactions)
*   **Exports**: `PaymentService`, `StripeService`

---

### `AdminModule`
*   **Description**: Provides administrative functionalities for super admins, such as managing users, approving organizations, viewing platform-wide statistics, etc.
*   **Imports**:
    *   `UsersModule`
    *   `OrganizationsModule`
    *   `JobPostingsModule`
    *   `SubscriptionsModule`
    *   `AuthModule` (for admin-specific guards)
    *   `TypeOrmModule.forFeature([AdminActionLog])` (if logging admin actions)
*   **Controllers**: `AdminUsersController`, `AdminOrganizationsController`, `AdminDashboardController`
*   **Providers**:
    *   `AdminUsersService`
    *   `AdminOrganizationsService`
    *   `AdminDashboardService`
    *   `AdminActionLogRepository` (if applicable)
*   **Exports**: None (typically self-contained, or services are used internally by its controllers).

---

### `SharedModule` (Optional)
*   **Description**: Contains shared utilities, constants, or simple components that are used across multiple feature modules but don't belong to the `CoreModule` (as they are not "core infrastructure" but rather shared "business-agnostic utilities").
*   **Imports**: None, or other shared utility modules.
*   **Controllers**: None
*   **Providers**: `DateUtilService`, `FileStorageService` (if a generic wrapper), etc.
*   **Exports**: `DateUtilService`, `FileStorageService`, etc. Could be marked as `@Global()` if these utilities are universally needed.

---

This structure provides a modular and scalable architecture for the NestJS backend. Each module has a clear responsibility, promoting separation of concerns and easier maintenance.
```
