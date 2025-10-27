# Self Protocol Mobile Detection - Solución Final

## 🎯 Objetivo

Mostrar **BOTÓN** (en vez de QR) cuando:
1. Usuario está en dispositivo móvil (teléfono/tablet)
2. Usuario está en Farcaster native app (iOS/Android)

Mostrar **QR CODE** cuando:
- Usuario está en desktop (computadora)

## 📱 Lógica de Detección

### Señales que detectamos:

```javascript
// 1. User Agent (más confiable)
const isMobileUserAgent = /android|iphone|ipad|ipod/i.test(userAgent);

// 2. Capacidades táctiles
const hasTouchScreen = 'ontouchstart' in window ||
  navigator.maxTouchPoints > 0;

// 3. Viewport estrecho (< 600px = móvil real)
const isNarrowViewport = window.innerWidth < 600;

// 4. Orientación (feature de móviles)
const hasOrientation = typeof screen.orientation !== 'undefined';

// 5. Contexto Farcaster
const isFarcasterMiniApp = (window.self !== window.top) &&
  (window.fc !== undefined);
```

### Decisión Final:

```javascript
// Móvil verdadero
const isTrueMobile = isMobileUserAgent ||
  (hasTouchScreen && isNarrowViewport) ||
  hasOrientation;

// Farcaster nativo en móvil
const isFarcasterNativeMobile = isFarcasterMiniApp &&
  (isMobileUserAgent || isNarrowViewport);

// DECISIÓN: Usar UI móvil (botón) si cualquiera es true
const shouldUseMobileUI = isTrueMobile || isFarcasterNativeMobile;
```

## 🧪 Casos de Prueba

### ✅ Debería mostrar BOTÓN:

| Contexto | User Agent | Width | Touch | iframe | Resultado |
|----------|-----------|-------|-------|--------|-----------|
| iPhone Safari | iPhone | 390px | ✅ | ❌ | 🔘 BOTÓN |
| Android Chrome | Android | 412px | ✅ | ❌ | 🔘 BOTÓN |
| iPad | iPad | 768px | ✅ | ❌ | 🔘 BOTÓN |
| Farcaster iOS | iPhone | 390px | ✅ | ✅ | �� BOTÓN |
| Farcaster Android | Android | 412px | ✅ | ✅ | 🔘 BOTÓN |

### ✅ Debería mostrar QR:

| Contexto | User Agent | Width | Touch | iframe | Resultado |
|----------|-----------|-------|-------|--------|-----------|
| Chrome Desktop | Mac | 1920px | ❌ | ❌ | 📱 QR |
| Firefox Desktop | Windows | 1440px | ❌ | ❌ | 📱 QR |
| Safari Desktop | Mac | 1680px | ❌ | ❌ | 📱 QR |

## 🐛 Debug en Producción

### Badge Rojo (Top-Left)

Muestra información en tiempo real:

```
🐛 DEBUG
Mobile UI: ✅ YES  (o ❌ NO)
Width: 390px
Touch: ✅  (o ❌)
iframe: ✅  (o ❌)
UA: 📱 iPhone  (o 💻 Desktop)
```

### Logs en Consola

```javascript
console.log("📱 ENHANCED MOBILE DETECTION:", {
  isMobileUserAgent: true,
  hasTouchScreen: true,
  hasOrientation: true,
  windowWidth: 390,
  isNarrowViewport: true,
  isFarcasterMiniApp: true,
  isFarcasterNativeMobile: true,
  shouldUseMobileUI: true,
  decision: "🔘 BUTTON"  // o "📱 QR CODE"
});
```

### Alert de Error

Si detecta móvil pero la UI no es móvil, muestra alert automático:

```
⚠️ DETECTION ISSUE!
isMobileUserAgent: true
shouldUseMobileUI: false
Width: 390px
```

## 📝 Cómo Probar

### 1. En iPhone con Farcaster App:

1. Abre Farcaster app nativa
2. Abre la MiniApp de cPiggy
3. Ve a `/self`
4. **Esperado**:
   - Badge rojo muestra: `Mobile UI: ✅ YES`
   - Ves BOTÓN grande azul "Open Self App to Verify"
   - NO ves QR code

### 2. En Desktop (Chrome/Firefox):

1. Abre navegador en computadora
2. Ve a `https://cpiggy.xyz/self`
3. **Esperado**:
   - Badge rojo muestra: `Mobile UI: ❌ NO`
   - Ves QR CODE
   - NO ves botón

### 3. En Mobile Web (Safari iPhone):

1. Abre Safari en iPhone
2. Ve a `https://cpiggy.xyz/self`
3. **Esperado**:
   - Badge rojo muestra: `Mobile UI: ✅ YES`
   - Ves BOTÓN
   - NO ves QR

## 🔧 Si Algo Sale Mal

### Problema: Muestra QR en móvil

**Solución**:
1. Verifica el badge rojo
2. Toma screenshot
3. Revisa logs en consola (Remote debugging)
4. Verifica que `isMobileUserAgent` sea `true`

### Problema: Muestra Botón en desktop

**Solución**:
1. Verifica `window.innerWidth` > 600
2. Verifica que NO haya touch screen
3. Si es laptop con touch, es comportamiento correcto

## 📍 Ubicación del Código

- Detección: `frontend/src/app/self/page.tsx:54-144`
- Renderizado: `frontend/src/app/self/page.tsx:322-376`
- Debug badge: `frontend/src/app/self/page.tsx:317-332`

## 🎨 UI Personalizada por Contexto

### Mensaje en Self App:

```javascript
// Si está en Farcaster:
"🎭 Verificando tu Identidad en Farcaster MiniApp

Verifying your Identity in Farcaster MiniApp"

// Si NO está en Farcaster:
"Verifica tu Identidad en cPiggy! 🐷"
```

### Callback URL:

```javascript
const callbackUrl = `${window.location.origin}/self?callback=true`;
// Ejemplo: https://cpiggy.xyz/self?callback=true
```

## ✅ Checklist Final

- [x] Detección de User Agent móvil
- [x] Detección de touch screen
- [x] Detección de viewport estrecho
- [x] Detección de Farcaster MiniApp
- [x] Detección de Farcaster nativo móvil
- [x] Mensaje personalizado según contexto
- [x] Callback URL configurado
- [x] Debug badge visible
- [x] Logs detallados en consola
- [x] Alert de error automático
- [ ] **Prueba en Farcaster iOS** ← PENDIENTE
- [ ] **Prueba en Farcaster Android** ← PENDIENTE

## 🚀 Siguiente Paso

**Prueba en Farcaster native app y comparte**:
1. Screenshot del badge rojo
2. Logs de consola (Remote debugging)
3. Comportamiento observado

Con eso podemos ajustar si es necesario.
