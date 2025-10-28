# Railway Logs - Guía de Debugging Self Protocol

## 🚂 Cómo Ver Logs en Railway

### Opción 1: Railway Dashboard (Web)

1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto **cPiggy**
3. Click en tu servicio (frontend/backend)
4. Click en la pestaña **"Logs"**
5. Los logs se actualizan en tiempo real

### Opción 2: Railway CLI (Terminal)

```bash
# Instalar Railway CLI (una vez)
npm i -g @railway/cli

# Login
railway login

# Ver logs en tiempo real
railway logs --follow

# Ver logs con filtros
railway logs --service=frontend
railway logs --service=backend
```

## 📋 Logs que Verás Durante Verificación

### 1. Inicio de la App

```
🗄️  Verification store initialized
🔧 Initializing verifier with SCOPE: cpiggy-prod
🔧 Initializing verifier with ENDPOINT: https://cpiggy.xyz/api/verify
```

### 2. Usuario Abre Self App en Móvil

**Frontend logs** (navegador - opcional):
```javascript
📱 ENHANCED MOBILE DETECTION: {
  isMobileUserAgent: true,
  windowWidth: 390,
  isNarrowViewport: true,
  isFarcasterNativeMobile: true,
  shouldUseMobileUI: true,
  decision: "🔘 BUTTON"
}

🚀 User clicked to open Self app
🎭 Context detected: { isInFarcaster: true, message: "..." }
```

### 3. Usuario Verifica en Self App

**Backend logs** (Railway):
```
================================================================================
🔐 [2025-01-15T10:30:45.123Z] Self Verification Request - ID: abc123
================================================================================
📱 Request Context: {
  requestId: 'abc123',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...',
  referer: 'https://cpiggy.xyz/self',
  origin: 'https://cpiggy.xyz',
  isMobile: true,
  isFarcaster: false
}
📦 [abc123] Request payload received: {
  hasAttestationId: true,
  hasProof: true,
  hasPublicSignals: true,
  userContextData: '0x8f51dc0791cddddce08052fff939eb7cf0c17856',
  attestationIdPreview: '0x1234567...'
}
⏳ [abc123] Starting verification for userId: 0x8f51dc0791cddddce08052fff939eb7cf0c17856
🔍 [abc123] Calling selfBackendVerifier.verify()...
⏱️ [abc123] Verification took 1234ms
🔍 [abc123] Verification result: {
  isValid: true,
  hasDiscloseOutput: true,
  details: { isValid: true }
}
✅ [abc123] Verification SUCCESSFUL for userId: 0x8f51dc0791cddddce08052fff939eb7cf0c17856
💾 [abc123] Marking user as verified in store...
✅ User 0x8f51dc07... marked as VERIFIED
💾 Store now contains 1 verified users
⏰ Verification timestamp: 2025-01-15T10:30:46.357Z
✅ [abc123] User marked as verified. Store updated.
📤 [abc123] Returning success response to client
================================================================================
```

### 4. Polling desde el Frontend

**Backend logs** (Railway):
```
🔄 [2025-01-15T10:30:47.000Z] Polling status for userId: 0x8f51dc07...
⏳ [xyz789] Not verified yet: 0x8f51dc07...

🔄 [2025-01-15T10:30:50.000Z] Polling status for userId: 0x8f51dc07...
✅ [xyz789] USER VERIFIED! userId: 0x8f51dc07..., timestamp: 2025-01-15T10:30:46.357Z
🔍 Lookup: User 0x8f51dc07... is VERIFIED
```

### 5. Usuario Redirigido a Home

**Frontend logs** (navegador - opcional):
```javascript
✅ Verification detected via polling!
✅ Verification successful! Context: farcaster
🔄 Redirecting to home...
```

## 🔍 Buscar Problemas en Railway

### Buscar por Usuario Específico

En Railway dashboard, usa el filtro de búsqueda:

```
userId: 0x8f51dc07
```

o

```
0x8f51dc07
```

### Buscar Errores

```
❌
```

o

```
💥
```

o

```
ERROR
```

### Buscar Verificaciones Exitosas

```
✅ Verification SUCCESSFUL
```

### Buscar Polling

```
🔄 Polling
```

## 🐛 Escenarios de Error

### Error 1: Falta un Campo Requerido

```
❌ [abc123] Missing required fields: {
  hasProof: true,
  hasPublicSignals: true,
  hasAttestationId: false,  ← PROBLEMA
  hasUserContextData: true
}
```

**Solución**: Self app no envió attestationId completo.

### Error 2: Verificación Falla

```
⚠️ [abc123] Verification FAILED for userId: 0x8f51dc07...
📋 [abc123] Failure details: {
  isValid: false,
  reason: 'Invalid proof signature'
}
```

**Solución**: Problema con la prueba ZK de Self. Usuario debe intentar de nuevo.

### Error 3: Usuario No se Marca como Verificado

```
✅ [abc123] Verification SUCCESSFUL for userId: 0x8f51DC07...  ← Mayúsculas
💾 [abc123] Marking user as verified in store...
✅ User 0x8f51dc07... marked as VERIFIED  ← Lowercase

[Luego en polling...]
🔄 Polling status for userId: 0x8f51DC07...  ← Mayúsculas de nuevo
⏳ Not verified yet: 0x8f51DC07...  ← NO ENCUENTRA!
```

**Causa**: Normalización inconsistente (mayúsculas vs minúsculas)

**Solución**: Verificar que ambos lados normalicen a lowercase

### Error 4: Polling No Inicia

**Frontend logs**:
```javascript
// NO HAY LOGS de polling
// Falta: "🔄 Starting verification polling"
```

**Solución**: Ver si `isPolling` se activó correctamente

## 📊 Monitoreo en Tiempo Real

### Dashboard de Railway

En la pestaña de Logs, puedes:

1. **Filtrar por severidad**:
   - Info (console.log)
   - Warning (console.warn)
   - Error (console.error)

2. **Buscar texto específico**:
   - UserId
   - RequestId
   - Timestamps

3. **Ver en tiempo real**:
   - Auto-scroll activado
   - Actualización continua

### CLI de Railway

```bash
# Ver solo errores
railway logs --follow | grep "❌\|💥"

# Ver solo verificaciones exitosas
railway logs --follow | grep "✅ Verification SUCCESSFUL"

# Ver polling
railway logs --follow | grep "🔄"

# Guardar logs a archivo
railway logs --follow > logs.txt
```

## 🧪 Flujo de Testing Recomendado

1. **Abre Railway logs en una ventana**
   ```bash
   railway logs --follow
   ```

2. **En tu iPhone, abre Farcaster app**
   - Abre MiniApp de cPiggy
   - Ve a `/self`

3. **Observa los logs mientras:**
   - Tocas el botón "Open Self App"
   - Verificas en Self app
   - Regresas a cPiggy

4. **Busca esta secuencia en Railway**:
   ```
   🔐 Self Verification Request - ID: [ID]
   📱 Request Context: { isMobile: true, ... }
   ✅ Verification SUCCESSFUL
   💾 User marked as verified
   🔄 Polling status
   ✅ USER VERIFIED!
   ```

## 📝 Checklist de Debug

- [ ] Los logs muestran `🗄️  Verification store initialized`
- [ ] Request llega con `📱 Request Context: { isMobile: true }`
- [ ] Payload tiene `hasAttestationId: true, hasProof: true`
- [ ] Verificación retorna `isValid: true`
- [ ] Usuario se marca: `✅ User ... marked as VERIFIED`
- [ ] Polling encuentra: `✅ USER VERIFIED!`
- [ ] Frontend redirige a home

## 🚨 Si Todo Falla

1. **Reinicia el servicio en Railway**
2. **Limpia el in-memory store** (se limpia en restart)
3. **Verifica variables de entorno**:
   ```
   NEXT_PUBLIC_SELF_SCOPE=cpiggy-prod
   NEXT_PUBLIC_SELF_ENDPOINT=https://cpiggy.xyz/api/verify
   ```

## 📞 Información de Soporte

Si necesitas compartir logs para debug:

1. Copia el bloque completo de un request:
   ```
   ================================================================================
   🔐 [timestamp] Self Verification Request - ID: [ID]
   ...
   ================================================================================
   ```

2. O exporta con CLI:
   ```bash
   railway logs --since 1h > debug-logs.txt
   ```

3. Busca el userId específico y comparte esa sección
