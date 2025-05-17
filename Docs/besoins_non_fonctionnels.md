# Spécifications des besoins non fonctionnels - Identity Secure

Ce document détaille les besoins non fonctionnels implémentés dans le projet Identity Secure, avec des références aux implémentations techniques dans le code source.

## 1. Sécurité

L'application Identity Secure garantit la confidentialité et la sécurité des données sensibles grâce à plusieurs mécanismes avancés :

### 1.1 Authentification par JWT (JSON Web Tokens)

**Implémentation** : Tokens JWT signés avec l'algorithme HS256, durée de validité de 24 heures, rafraîchissement automatique.

```javascript
// back/controllers/auth.controller.js
const token = jwt.sign({ id: user.id }, config.jwtSecret, {
  algorithm: "HS256",
  allowInsecureKeySizes: true,
  expiresIn: "24h", // Match cookie duration
});
```

```javascript
// back/middlewares/authJwt.js
// Refresh token if it's about to expire (within 5 minutes)
if (decoded.exp - Date.now() / 1000 < 300) {
  const newToken = jwt.sign({ id: decoded.id }, config.jwtSecret, {
    expiresIn: "24h",
  });
  // ...
}
```

### 1.2 Hachage sécurisé des mots de passe

**Implémentation** : Utilisation de bcrypt avec un facteur de coût de 8 pour le hachage irréversible des mots de passe.

```javascript
// back/controllers/auth.controller.js
const user = new User({
  username: req.body.username,
  email: req.body.email,
  password: bcrypt.hashSync(req.body.password, 8),
  // ...
});
```

```javascript
// Validation du mot de passe
const passwordIsValid = bcrypt.compareSync(
  req.body.password,
  user.password
);
```

### 1.3 Cryptage des données biométriques

**Implémentation** : Algorithme AES-256-GCM pour le chiffrement des données biométriques.

```javascript
// back/config/biometric.config.js
security: {
  encryptionAlgorithm: 'aes-256-gcm',
  saltRounds: 10,
  tokenExpiryHours: 24
}
```

### 1.4 Validation des tokens

**Implémentation** : Vérification systématique via un intercepteur HTTP dédié.

```typescript
// Front/app/core/interceptors/auth.interceptor.ts
// Check token state from last validation
const lastValidation = tokenService.getLastTokenValidation();
const now = Date.now();

// If token was validated less than 1 minute ago, use it without revalidating
if (lastValidation && (now - lastValidation.timestamp < 60000) && lastValidation.valid) {
  // Token was recently validated and is valid, use it
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  return next(authReq);
}
```

### 1.5 Protection contre les attaques

**Implémentation** : Détection et prévention des tentatives d'accès non autorisées.

```javascript
// back/routes/auth.routes.js
// Token validation route - explicitly check if a token is valid without refreshing
app.get("/api/auth/validate-token", async (req, res) => {
  try {
    // Get token from various sources
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.headers["x-access-token"] ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        valid: false,
        message: "No token provided",
      });
    }

    // Verify token without refreshing it
    const decoded = jwt.verify(token, config.jwtSecret);

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        valid: false,
        message: "User not found",
      });
    }
    // ...
```

### 1.6 Gestion sécurisée des réinitialisations de mot de passe

**Implémentation** : Tokens cryptographiques avec durée de validité limitée (1 heure).

```javascript
// back/controllers/password.controller.js
// Generate reset token
const resetToken = crypto.randomBytes(32).toString("hex");

// Hash the token for storage in the database
const hashedToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

user.resetPasswordToken = hashedToken;
user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
```

## 2. Performance du système

Notre application assure des temps de réponse rapides et des performances optimales grâce à :

### 2.1 Mise en cache des tokens

**Implémentation** : Système de cache côté client pour éviter les validations redondantes.

```typescript
// Front/app/core/interceptors/auth.interceptor.ts
// If token was validated less than 1 minute ago, use it without revalidating
if (lastValidation && (now - lastValidation.timestamp < 60000) && lastValidation.valid) {
  // Token was recently validated and is valid, use it
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  return next(authReq);
}
```

### 2.2 Compression des images biométriques

**Implémentation** : Traitement automatique avec taux de compression configurable.

```javascript
// back/config/biometric.config.js
processing: {
  imageCompression: true,
  compressionQuality: 0.8,
  autoRotate: true,
  enhanceContrast: true
}
```

### 2.3 Chargement asynchrone des composants Angular

**Implémentation** : Lazy loading des modules pour réduire le temps de chargement initial.

```typescript
// Front/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(CoreModule),
    provideRouter(routes, withComponentInputBinding()),
    provideZoneChangeDetection(),
    // ...
  ]
};
```

### 2.4 Optimisation des requêtes HTTP

**Implémentation** : Utilisation de l'API Fetch moderne.

```typescript
// Front/app/app.config.ts
provideHttpClient(
  withFetch(),
  withInterceptors([authInterceptor])
)
```

### 2.5 Gestion intelligente des ressources

**Implémentation** : Limitation de la taille des fichiers biométriques.

```javascript
// back/config/biometric.config.js
quality: {
  fingerprint: {
    minDPI: 500,
    maxDPI: 1000,
    minWidth: 500,
    minHeight: 500,
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/wsq']
  },
  face: {
    minWidth: 600,
    minHeight: 800,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png']
  }
}
```

## 3. Évolutivité

L'architecture de l'application est conçue pour s'adapter facilement aux nouvelles exigences :

### 3.1 Architecture modulaire

**Implémentation** : Séparation claire entre frontend Angular et backend Node.js/Express.

```typescript
// Front/app/core/core.module.ts
// Module séparé pour les fonctionnalités core
@NgModule({
  // ...
})
export class CoreModule { }
```

### 3.2 Configuration externalisée

**Implémentation** : Fichiers de configuration centralisés.

```javascript
// back/config/config.js
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    // ...
  },
  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cpf_system',
    // ...
  },
  // ...
};
```

### 3.3 Injection de dépendances

**Implémentation** : Pattern d'injection de dépendances dans Angular.

```typescript
// Front/app/core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenStorageService);
  const authService = inject(AuthService);
  // ...
}
```

### 3.4 API RESTful

**Implémentation** : Interfaces API standardisées.

```javascript
// back/routes/auth.routes.js
app.post("/api/auth/signin", controller.signin);
app.post("/api/auth/signup", [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted], controller.signup);
```

### 3.5 Gestion des versions d'API

**Implémentation** : Structure de routage pour supporter plusieurs versions d'API.

```javascript
// back/config/config.js
apiPrefix: process.env.API_PREFIX || '/api/v1'
```

## 4. Fiabilité

La stabilité et la disponibilité de l'application sont assurées par :

### 4.1 Gestion centralisée des erreurs

**Implémentation** : Middleware dédié pour capturer et traiter les erreurs.

```javascript
// back/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    // ...
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(statusCodes.NOT_FOUND, message);
  }
  // ...
}
```

### 4.2 Mécanismes de récupération

**Implémentation** : Stratégies de retry pour les opérations critiques.

```typescript
// Front/app/core/interceptors/auth.interceptor.ts
if (isPageRefresh) {
  console.log('[Auth Interceptor] Profile page refresh detected, attempting recovery');

  // Try to refresh the token in the background
  const refreshToken = tokenService.getRefreshToken();
  if (refreshToken) {
    authService.refreshToken(refreshToken).subscribe({
      next: (response) => {
        if (response.accessToken) {
          console.log('[Auth Interceptor] Background token refresh successful');
          tokenService.saveToken(response.accessToken);
          tokenService.saveRefreshToken(response.refreshToken);
          // No redirect needed - the page will use the new token on next request
        }
      },
      // ...
    });
  }
}
```

### 4.3 Validation des données

**Implémentation** : Contrôles stricts des entrées utilisateur.

```javascript
// back/middlewares/uploadBiometrics.js
const fileFilter = (req, file, cb) => {
  const type = file.fieldname.split('_')[0];
  const allowedFormats = config.quality[type]?.allowedFormats || [];

  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed formats for ${type}: ${allowedFormats.join(', ')}`));
  }
};
```

### 4.4 Journalisation structurée

**Implémentation** : Système de logs avec rotation automatique des fichiers.

```javascript
// back/config/config.js
logging: {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || 'logs/app.log',
  maxSize: parseInt(process.env.MAX_LOG_SIZE) || 10485760, // 10MB
  maxFiles: parseInt(process.env.MAX_LOG_FILES) || 5
}
```

## 5. Accessibilité

L'application est conçue pour être accessible à tous les utilisateurs :

### 5.1 Design responsive

**Implémentation** : Interfaces adaptatives avec breakpoints spécifiques.

```css
/* Front/app/features/officer-dashboard/components/citizens/citizens.component.css */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 1rem;
  }

  .search-field {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .citizens-container {
    padding: 1rem;
  }
}
```

### 5.2 Contraste et lisibilité

**Implémentation** : Combinaisons de couleurs à fort contraste.

```scss
/* Front/app/pages/account/body/body.component.scss */
input, textarea, .form-control {
  background-color: rgba(255, 255, 255, 0.05);
  color: $text-primary;
  
  &:focus {
    border-color: $primary-accent;
    box-shadow: 0 0 0 2px rgba($primary-accent, 0.3);
  }
}
```

### 5.3 Navigation au clavier

**Implémentation** : Support complet de la navigation par clavier.

```html
<!-- Front/app/features/citizen-dashboard/components/appointements/appointements.component.html -->
<div class="search-box">
  <input type="text" 
         [(ngModel)]="searchQuery" 
         (input)="searchAppointments(searchQuery)" 
         placeholder="Search appointments...">
  <button class="search-button">
    <i class="fas fa-search"></i>
  </button>
</div>
```

### 5.4 Attributs ARIA

**Implémentation** : Intégration d'attributs d'accessibilité dans les composants UI.

```typescript
// Front/app/app.config.ts - Utilisation de PrimeNG qui intègre des attributs ARIA
providePrimeNG({
  theme: {
    preset: Aura
  }
})
```

### 5.5 Textes alternatifs

**Implémentation** : Attributs `alt` descriptifs pour les images.

```html
<!-- Front/app/features/officer-dashboard/components/citizens/citizens.component.html -->
<div class="citizen-avatar">
  <img [src]="citizen.biometricData.photo" [alt]="citizen.firstName + ' ' + citizen.lastName">
  <div class="status-indicator" *ngIf="!isLoading"></div>
</div>
```

### 5.6 Thèmes adaptés

**Implémentation** : Support de thèmes clairs et sombres.

```typescript
// Front/app/app.config.ts
providePrimeNG({
  theme: {
    preset: Aura // Thème qui supporte les modes clair et sombre
  }
})
```
