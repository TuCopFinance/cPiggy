# Self Protocol Verification - Farcaster MiniApp Debugging Guide

## 🎭 Contexto

Este documento explica cómo funciona la integración de Self Protocol dentro de Farcaster MiniApps y cómo debuggear problemas.

## 🔍 Detección de Farcaster MiniApp

La aplicación detecta automáticamente si se está ejecutando en Farcaster mediante:

1. **User Agent**: Busca "farcaster" en `navigator.userAgent`
2. **Farcaster SDK**: Verifica si `window.fc` está definido
3. **iframe Detection**: Verifica si `window.self !== window.top`
4. **Viewport Size**: Verifica si el ancho es ≤ 768px

Ver: `frontend/src/app/self/page.tsx:54-94`

## 📱 Flujo de Verificación en Farcaster

### Paso 1: Usuario abre la MiniApp
- URL: `https://cpiggy.xyz/self`
- Se detecta contexto Farcaster
- Se muestra **botón** en lugar de QR
- Mensaje personalizado: "🎭 Verificando tu Identidad en Farcaster MiniApp"

### Paso 2: Usuario toca "Open Self App to Verify"
```javascript
// Se ejecuta onClick del botón
1. Log: "🚀 User clicked to open Self app"
2. Guarda timestamp en sessionStorage
3. Abre Self app vía deeplink/universal link
4. Inicia polling
```

### Paso 3: Usuario verifica en Self App
- Self app se abre
- Usuario completa verificación
- Self app **debe redirigir** a: `https://cpiggy.xyz/self?callback=true`

### Paso 4: Regreso a MiniApp
**Opción A: Callback URL funciona**
```javascript
// URL: cpiggy.xyz/self?callback=true
1. Detecta query param: callback=true
2. Log: "🔙 User returned from Self app via callback"
3. Recupera userId de sessionStorage
4. Muestra spinner: "Checking verification status..."
5. Inicia polling inmediato
```

**Opción B: Callback URL no funciona (Fallback)**
```javascript
// Usuario regresa manualmente a la app
1. Detecta visibilitychange event
2. Verifica si pasaron >5 segundos desde que abrió Self
3. Log: "👁️ Page became visible after Self app switch"
4. Inicia polling
```

### Paso 5: Polling detecta verificación
```javascript
1. Poll cada 3 segundos a /api/verify/status
2. Log: "📊 Polling response: {verified: true/false}"
3. Si verified=true:
   - Log: "✅ Verification detected via polling!"
   - Guarda en localStorage
   - Redirige a home "/"
```

## 🐛 Debugging en Farcaster Mobile

### Ver logs en consola (Mobile)

**Opción 1: Remote Debugging (Android)**
```bash
# Conecta tu Android vía USB
# Chrome DevTools > More tools > Remote devices
# Encuentra la WebView de Farcaster
# Inspecciona
```

**Opción 2: Remote Debugging (iOS)**
```bash
# Safari > Develop > [Tu iPhone] > Farcaster
```

**Opción 3: Eruda (JavaScript Console)**
```javascript
// Temporalmente agregar en page.tsx
useEffect(() => {
  const script = document.createElement('script');
  script.src = '//cdn.jsdelivr.net/npm/eruda';
  document.body.appendChild(script);
  script.onload = () => (window as any).eruda.init();
}, []);
```

### Logs Clave a Revisar

```bash
# 1. Detección de contexto
📱 Device detection: {
  isMobileDevice: true/false,
  isInFarcaster: true/false,
  hasFarcasterSDK: true/false,
  isInIframe: true/false,
  isFarcasterContext: true/false
}

# 2. Mensaje personalizado
🎭 Context detected: {
  isInFarcaster: true,
  message: "🎭 Verificando tu Identidad en Farcaster MiniApp..."
}

# 3. Click en botón
🚀 User clicked to open Self app

# 4. Regreso vía callback
🔙 User returned from Self app via callback
📦 Recovered userId from sessionStorage: 0x...

# 5. Polling
🔄 Starting verification polling for userId: 0x...
📊 Polling response: {verified: false, timestamp: null}
📊 Polling response: {verified: true, timestamp: 1234567890}

# 6. Éxito
✅ Verification detected via polling!
✅ Verification successful! Context: farcaster
🔄 Redirecting to home...
```

## 🔧 Troubleshooting

### Problema: Muestra QR en vez de botón

**Causa**: No detecta contexto mobile/Farcaster

**Solución**:
1. Verifica logs: `📱 Device detection`
2. Debería mostrar `isFarcasterContext: true`
3. Si no, verifica que:
   - `window.innerWidth <= 768`
   - O está en iframe
   - O tiene Farcaster SDK

### Problema: Botón abre Self pero no regresa

**Causa 1**: Callback URL no configurado correctamente

**Solución**:
1. Verifica log: `🔗 Callback URL: https://cpiggy.xyz/self?callback=true`
2. Verifica que Self app soporte `deeplinkCallback`

**Causa 2**: Self no redirige correctamente

**Solución**:
- El fallback con `visibilitychange` debe funcionar
- Verifica log: `👁️ Page became visible after Self app switch`

### Problema: Regresa pero no detecta verificación

**Causa**: Normalización de userId

**Solución**:
1. Verifica que `/api/verify/route.ts` guarde userId en lowercase
2. Verifica que polling envíe userId en lowercase
3. Ver: `page.tsx:178` (normalización)

### Problema: Polling no inicia

**Causa**: No se detecta el regreso

**Solución**:
1. Verifica sessionStorage:
   ```javascript
   sessionStorage.getItem('self_verification_initiated')
   ```
2. Debe tener un timestamp
3. Verifica que `setIsPolling(true)` se llame

## 📊 SessionStorage Items

Durante la verificación, se guardan:

```javascript
{
  'self_verification_userId': '0x8f51...',
  'self_verification_timestamp': '1234567890',
  'self_verification_initiated': '1234567890',
  'self_verification_context': 'farcaster' | 'web'
}
```

Se limpian después de verificación exitosa.

## 🧪 Testing Checklist

- [ ] Detección de Farcaster funciona
- [ ] Muestra botón en vez de QR
- [ ] Mensaje personalizado aparece en Self app
- [ ] Botón abre Self app correctamente
- [ ] Self app muestra: "🎭 Verificando tu Identidad en Farcaster MiniApp"
- [ ] Callback URL funciona (o fallback con visibilitychange)
- [ ] Polling inicia automáticamente
- [ ] Detecta verificación exitosa
- [ ] Redirige a home
- [ ] SessionStorage se limpia

## 📝 Notas Importantes

1. **El mensaje "🎭 Verificando tu Identidad en Farcaster MiniApp"** aparece en la app Self, NO en la UI de tu app
2. **Usa este mensaje para identificar** si la verificación viene de Farcaster o web normal
3. **Si ves este mensaje en Self**, confirmas que la detección de contexto funciona
4. **El contexto se guarda** en `localStorage.getItem('self_verification_context')`

## 🔗 Recursos

- [Self Protocol Docs](https://docs.self.xyz)
- [Farcaster MiniApps Docs](https://docs.farcaster.xyz/developers/frames/v2/mini-apps)
- [cPiggy Self Implementation](./frontend-setup.md#self-protocol-integration)
