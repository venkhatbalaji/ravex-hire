# Multi-Tenancy Strategy for Hiring Platform

This document outlines the multi-tenancy strategy for the hiring platform, which uses a shared database with a shared schema. Data segregation is primarily achieved by using an `organizationId` as the tenant identifier.

## 1. Overview of the Strategy

The core of our multi-tenancy approach is to isolate data at the application level within a single database and schema.

*   **Tenant Identifier**: The `id` field of the `Organization` entity serves as the unique `tenantId`.
*   **Tenant-Specific Entities**: Entities that belong to a specific organization will have an `organizationId` column. This includes, but is not limited to:
    *   `JobPosting`: Each job posting belongs to one organization.
    *   `Application`: Each job application is tied to a job posting, and thus to its organization.
    *   `User`: Users with the `ORGANIZATION_ADMIN` role are scoped to a specific organization via an `organizationId` foreign key.
*   **Data Access Filtering**: All data access operations (reads, writes, updates, deletes) for tenant-specific entities must be filtered by the `organizationId` to ensure that users only interact with data belonging to their designated organization.

## 2. Obtaining `organizationId` in Requests

The `organizationId` is crucial for determining the tenant context of an incoming request. It can be obtained through several mechanisms:

*   **JWT Token**:
    *   For authenticated users belonging to an organization (e.g., `ORGANIZATION_ADMIN`, `RECRUITER`), the JSON Web Token (JWT) issued upon successful login will contain the `organizationId` in its payload. This `organizationId` is then extracted on the backend for subsequent operations.
*   **Route Parameters / Request Body**:
    *   **Organization Registration**: When a new organization is being registered, its `id` (which will become the `tenantId`) is not yet in a JWT. Information might be part of the request body.
    *   **Super Admin Operations**: `SUPER_ADMIN` users do not have an `organizationId` in their JWTs by default, as they operate across all tenants or can choose a specific tenant context. For operations where they act on behalf of a specific organization, the `organizationId` might be provided as a route parameter (e.g., `/admin/organizations/:organizationId/jobs`) or in the request body.
    *   **Public Endpoints**: Endpoints for actions like fetching public job details by ID (e.g., `/jobs/:jobId`) will derive the `organizationId` indirectly through the job's association with an organization.

## 3. Injecting `organizationId` into Services/Repositories

Once the `organizationId` is obtained from the request, it needs to be made available to the services and repositories that handle data logic.

*   **Request-Scoped Providers (NestJS)**:
    *   A common approach in NestJS is to use request-scoped providers. A dedicated service, say `TenantContextService`, can be configured as request-scoped. This service would store the `organizationId` (and potentially other tenant-related information like the user's role within the tenant) for the lifecycle of a single HTTP request.
    *   Other services and repositories that require tenant-aware operations can then inject this `TenantContextService` to access the current `organizationId`.
    *   *Example*:
        ```typescript
        // tenant-context.service.ts (request-scoped)
        import { Injectable, Scope } from '@nestjs/common';
        @Injectable({ scope: Scope.REQUEST })
        export class TenantContextService {
          private _organizationId?: string;
          set organizationId(id: string) { this._organizationId = id; }
          get organizationId(): string | undefined { return this._organizationId; }
        }

        // job-posting.service.ts
        import { Injectable } from '@nestjs/common';
        import { TenantContextService } from './tenant-context.service';
        @Injectable()
        export class JobPostingService {
          constructor(private readonly tenantContext: TenantContextService) {}
          async findJobsByCurrentTenant() {
            const organizationId = this.tenantContext.organizationId;
            if (!organizationId) { /* Handle error */ }
            // ... query jobs using organizationId
          }
        }
        ```

*   **CLS (Continuation Local Storage)**:
    *   CLS libraries (like `nestjs-cls` for NestJS) provide an alternative to explicit dependency injection of request-scoped providers. CLS allows storing context data (like `organizationId`) that is accessible throughout the call chain of a request without needing to pass it as a parameter through every function or inject it into every class.
    *   This can simplify code by making the `organizationId` implicitly available where needed, but requires careful setup and understanding of its async behavior.

*   **Custom Parameter Decorators**:
    *   A custom NestJS parameter decorator (e.g., `@TenantId()`) can be created to easily extract the `organizationId` directly in controller methods. This decorator would encapsulate the logic of retrieving the ID from the JWT payload (for `ORGANIZATION_ADMIN`) or other request parts (like route params for `SUPER_ADMIN` operations).
    *   *Example*:
        ```typescript
        // tenant-id.decorator.ts
        import { createParamDecorator, ExecutionContext } from '@nestjs/common';
        export const TenantId = createParamDecorator(
          (data: unknown, ctx: ExecutionContext): string | undefined => {
            const request = ctx.switchToHttp().getRequest();
            // Logic to extract from JWT, then route params, then body
            return request.user?.organizationId || request.params?.organizationId;
          },
        );

        // job-postings.controller.ts
        @Get()
        findAll(@TenantId() tenantId?: string) { // tenantId will be populated
          if (!tenantId) { /* Handle cases where tenantId is required but not found */ }
          return this.jobPostingsService.findAllByOrganization(tenantId);
        }
        ```

## 4. Enforcing Tenant-Based Data Access in Repositories/Services

It's critical to ensure that data access is strictly scoped to the correct tenant.

*   **Automatic Filtering (Ideal but Complex)**:
    *   **Base Repository/Service**: A base repository or service method could be designed to automatically append `WHERE organizationId = :tenantId` to all relevant SQL queries (e.g., `find`, `findOne`, `update`, `delete` operations).
    *   **TypeORM Global Scopes/QueryBuilder**: For TypeORM, this could potentially be implemented using global scopes (though these apply *globally* and might need to be disabled for `SUPER_ADMIN` or specific cross-tenant queries, adding complexity). A more controlled approach is to use the QueryBuilder within a base repository class, ensuring the `organizationId` condition is always added if a tenant context exists.
    *   This approach reduces the chances of developers forgetting to apply tenant filters.

*   **Manual Filtering (Pragmatic and Explicit)**:
    *   If universal automatic filtering proves too complex or inflexible, services and repositories **must** explicitly use the `organizationId` obtained from the context (e.g., `TenantContextService` or passed as a parameter) in their database queries.
    *   *Example (TypeORM)*:
        ```typescript
        // job-posting.repository.ts
        async findByOrganization(organizationId: string): Promise<JobPosting[]> {
          return this.find({ where: { organizationId } });
        }
        async createJobPosting(createDto: CreateJobDto, organizationId: string): Promise<JobPosting> {
          const jobPosting = this.create({ ...createDto, organizationId });
          return this.save(jobPosting);
        }
        ```

*   **Validation**:
    *   **Ownership Checks**: Before any create, update, or delete operation on tenant-specific data, validate that the `organizationId` associated with the data matches the `organizationId` of the currently authenticated user/context.
    *   **Authorization**: Ensure the user has the necessary permissions (role) to perform the action on the specified tenant's data. For example, an `ORGANIZATION_ADMIN` cannot modify data for an `organizationId` other than the one in their JWT.
    *   **Data Integrity**: When creating new tenant-specific resources, the correct `organizationId` must be set.

## 5. Role of JWT and User Roles

The user's role significantly influences how multi-tenancy is applied:

*   **`SUPER_ADMIN`**:
    *   JWT: Typically will **not** contain a specific `organizationId`.
    *   Access: Can access data across all tenants. They might have dashboards for viewing aggregated data or tools to manage individual tenants.
    *   Operations: When performing operations on a specific tenant, they must explicitly provide the `organizationId` (e.g., via route parameter or request body). Their service methods and repository queries will need to accommodate both tenant-specific and cross-tenant data retrieval (i.e., sometimes filtering by `organizationId`, sometimes not).
*   **`ORGANIZATION_ADMIN`**:
    *   JWT: **Must** contain the `organizationId` of the organization they belong to. This ID is embedded during login/authentication.
    *   Access: All their operations are strictly scoped to this `organizationId`. They should never be able to see or modify data from other organizations.
    *   Operations: The `organizationId` from their JWT is used implicitly or explicitly in all data access queries.
*   **`CANDIDATE`**:
    *   JWT: Typically will **not** contain an `organizationId`. Candidates are global users.
    *   Access:
        *   They interact with `JobPosting` entities from various organizations (these postings are public or discoverable via search).
        *   Their own `CandidateProfile` is their personal data and is not directly scoped by an `organizationId` in the same way an organization's internal data is.
        *   When a `CANDIDATE` applies for a job, an `Application` record is created. This `Application` record **will** be associated with the `JobPosting`'s `organizationId`, making the application data tenant-aware from the organization's perspective.
    *   Operations: Candidates primarily read job postings and create applications. Access control for viewing their own applications is based on their `userId`.

## 6. Data Creation

*   When an `ORGANIZATION_ADMIN` (or any user acting within a tenant context) creates a new tenant-specific resource (e.g., a `JobPosting`), the `organizationId` from their JWT or the active tenant context **must** be automatically and correctly assigned to the `organizationId` field of the new resource.
*   This prevents data from being orphaned or assigned to the wrong tenant. Validation should ensure that the `organizationId` being assigned matches the user's tenant context.

## 7. Potential Challenges and Considerations

*   **Accidental Data Exposure**: This is the biggest risk. A bug in the filtering logic could lead to one tenant accessing or modifying another tenant's data. Rigorous automated testing (unit, integration, and end-to-end tests focusing on tenant isolation) is paramount.
*   **Performance**:
    *   **Indexing**: All columns named `organizationId` (and other frequently queried fields within a tenant scope) must be properly indexed in the database to ensure efficient querying.
    *   **Query Complexity**: Complex cross-tenant queries for `SUPER_ADMIN` reporting could be slow if not carefully designed.
*   **Complexity in Code**:
    *   Implementing and consistently maintaining tenant isolation logic adds a layer of complexity throughout the application (controllers, services, repositories).
    *   Developers must be constantly aware of the tenant context.
*   **Reporting and Analytics**:
    *   `SUPER_ADMINS` often require reports that aggregate data across all tenants. These queries need to be designed carefully to be performant and accurate.
    *   Analytics for individual tenants are simpler as they are naturally scoped.
*   **Database Migrations**:
    *   Schema migrations (e.g., using TypeORM migrations) are generally straightforward as they apply to the shared schema.
    *   Data migrations (transforming or backfilling data) must be tenant-aware. If a script iterates through records to update them, it might need to do so tenant by tenant or include `organizationId` in its logic to avoid unintended cross-tenant effects.
*   **Testing**: Testing strategy needs to explicitly cover multi-tenancy scenarios:
    *   Testing that users of one tenant cannot access data of another.
    *   Testing that `SUPER_ADMIN` can access all data or specific tenant data correctly.
    *   Testing data creation to ensure `organizationId` is correctly assigned.
*   **Backup and Restore**: While the database is shared, considerations for tenant-specific backup/restore (if ever needed) are more complex than a dedicated database-per-tenant model. Typically, full database backups are standard.

By carefully implementing these strategies and addressing the potential challenges, a secure and effective multi-tenant system can be built using a shared database and schema approach.
```
