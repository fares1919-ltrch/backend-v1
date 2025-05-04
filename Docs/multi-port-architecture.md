# 🏢 TWYN Platform: Multi-Port Architecture Documentation

## 📋 Overview

This document outlines the implementation of a multi-port architecture for the TWYN platform, which allows different user roles to access dedicated interfaces through separate ports while maintaining a single codebase.

## 🎯 Goals

* ✅ Single Angular project with unified codebase
* ✅ Separate ports for different user roles (4200, 4300)
* ✅ Custom domain mapping (admin.twyn.local, user.twyn.local)
* ✅ Role-specific routing and UI
* ✅ Enhanced security through port-based access control

---

## 🏗️ Architecture Design

### User Role Separation

The TWYN platform serves three primary user roles:

| Role | Description | Access Port | Domain |
|------|-------------|------------|--------|
| **Citizen** | Regular users accessing public services | 4300 | user.twyn.local |
| **Officer** | Government employees processing requests | 4200 | admin.twyn.local |
| **Manager** | Administrative staff overseeing operations | 4200 | admin.twyn.local |

### Port-Based Access Control

* **Port 4300**: Public-facing interface for citizens
* **Port 4200**: Administrative interface for officers and managers

---

## 🔧 Implementation Details

### 1. Port Detection

The application detects the current port at runtime to determine which interface to display:

```typescript
// In app.component.ts
ngOnInit() {
  const port = window.location.port;
  this.isAdminPortal = port === '4200';
  this.isUserPortal = port === '4300';
  
  // Redirect based on port
  this.handlePortBasedRedirection();
}
```

### 2. Port-Based Route Guard

A dedicated route guard controls access based on the port:

```typescript
// In port.guard.ts
@Injectable({ providedIn: 'root' })
export class PortGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const port = window.location.port;

    if (port === '4200') {
      // Admin portal - redirect to login or dashboard based on auth status
      if (this.isAuthenticated()) {
        const user = this.tokenStorage.getUser();
        if (user?.roles?.includes('ROLE_MANAGER')) {
          this.router.navigate(['/manager-dashboard']);
        } else if (user?.roles?.includes('ROLE_OFFICER')) {
          this.router.navigate(['/officer-dashboard']);
        } else {
          // Unauthorized role for admin portal
          this.router.navigate(['/access-denied']);
        }
      } else {
        this.router.navigate(['/auth/login']);
      }
      return false;
    } else if (port === '4300') {
      // User portal - redirect to citizen dashboard or home
      if (this.isAuthenticated() && this.tokenStorage.getUser()?.roles?.includes('ROLE_USER')) {
        this.router.navigate(['/citizen-dashboard']);
      } else {
        this.router.navigate(['/home']);
      }
      return false;
    }
    return true;
  }

  private isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken();
  }
}
```

### 3. Conditional UI Components

The application renders different layouts based on the detected port:

```typescript
// In app.component.html
<ng-container *ngIf="isAdminPortal">
  <admin-header></admin-header>
</ng-container>

<ng-container *ngIf="isUserPortal">
  <user-header></user-header>
</ng-container>

<router-outlet></router-outlet>
```

### 4. Role-Based Authentication Flow

#### Admin Portal (Port 4200)

1. Users access admin.twyn.local:4200
2. System redirects to admin login page
3. After authentication, the system:
   - Verifies user has ROLE_MANAGER or ROLE_OFFICER
   - Redirects to appropriate dashboard based on role
   - Denies access if user lacks required roles

#### User Portal (Port 4300)

1. Users access user.twyn.local:4300
2. System shows public homepage with login option
3. After authentication, the system:
   - Verifies user has ROLE_USER
   - Redirects to citizen dashboard
   - Shows appropriate error if user lacks required role

---

## 🚀 Deployment Configuration

### Running on Multiple Ports

To run the application on multiple ports simultaneously:

```bash
# Terminal 1 - Admin Portal
ng serve --port 4200

# Terminal 2 - User Portal
ng serve --port 4300
```

### Custom Domain Mapping

Add the following entries to your hosts file (`/etc/hosts` on Linux/Mac or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
127.0.0.1 admin.twyn.local
127.0.0.1 user.twyn.local
```

---

## 🔒 Security Considerations

### Role Enforcement

* The application enforces role-based access at multiple levels:
  1. Port-based initial routing
  2. Authentication guards on protected routes
  3. Component-level role verification
  4. Backend API authorization checks

### Cross-Port Protection

* JWT tokens include the origin port to prevent token reuse across portals
* Backend validates that requests come from the appropriate origin
* Session management tracks which portal a user is authenticated on

---

## 🔄 Authentication Flow

### Admin Portal Authentication

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Admin      │     │  Login      │     │  Role       │
│  Portal     │────▶│  Page       │────▶│  Validation │
│  (4200)     │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Manager    │     │  Role       │     │  JWT Token  │
│  Dashboard  │◀────│  Check      │◀────│  Generation │
│  or Officer │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### User Portal Authentication

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User       │     │  Home Page  │     │  Login      │
│  Portal     │────▶│  with Login │────▶│  Process    │
│  (4300)     │     │  Option     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Citizen    │     │  Role       │     │  JWT Token  │
│  Dashboard  │◀────│  Check      │◀────│  Generation │
│             │     │  (ROLE_USER)│     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🔄 User Account Management

### Officer and Manager Accounts

* Officer and Manager accounts are pre-created by system administrators
* These accounts cannot self-register through the public registration form
* Credentials are provided directly to staff members
* Password reset is available but requires verification through official channels

### Citizen Accounts

* Citizens can self-register through the public portal
* Email verification is required before account activation
* Citizens can only access the user portal (4300)
* Attempts to access the admin portal are redirected to the appropriate interface

---

## 📱 Responsive Design Considerations

Both portals implement responsive design principles:

* Admin portal (4200) is optimized for desktop-first workflow
* User portal (4300) is optimized for mobile-first experience
* Shared components adapt their appearance based on the current portal

---

## 🧪 Testing the Multi-Port Setup

1. Start both servers:
   ```bash
   # Terminal 1
   ng serve --port 4200
   
   # Terminal 2
   ng serve --port 4300
   ```

2. Access the admin portal:
   ```
   http://admin.twyn.local:4200
   ```

3. Access the user portal:
   ```
   http://user.twyn.local:4300
   ```

4. Verify that:
   - Each portal shows the appropriate interface
   - Authentication works correctly on both portals
   - Role-based access control prevents unauthorized access
   - Redirects work as expected based on user roles

---

## 🔮 Future Enhancements

* Implement Docker containerization for easier deployment
* Add SSL certificates for secure connections
* Explore using a reverse proxy to eliminate port numbers in URLs
* Implement advanced analytics to track usage patterns across portals
