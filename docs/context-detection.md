# Contextos de Ejecución - cPiggy

## 🎯 Los 4 Contextos Diferentes

### 1. **Web Desktop** (Navegador en computadora)
```javascript
{
  isMobileDevice: false,
  isInFarcaster: false,
  isInIframe: false,
  hasFarcasterSDK: false,
  → Mostrar: QR Code
}
```

### 2. **Web Mobile** (Safari/Chrome en móvil)
```javascript
{
  isMobileDevice: true,
  isInFarcaster: false,
  isInIframe: false,
  hasFarcasterSDK: false,
  → Mostrar: Botón para abrir Self app
}
```

### 3. **Farcaster Web MiniApp** (warpcast.com en navegador)
```javascript
{
  isMobileDevice: false (puede ser desktop),
  isInFarcaster: true (en URL o SDK),
  isInIframe: true (MiniApp corre en iframe),
  hasFarcasterSDK: true (window.fc disponible),
  → Mostrar: ¿QR o Botón? DEPENDE del viewport
}
```

### 4. **Farcaster Native App MiniApp** (App nativa iOS/Android)
```javascript
{
  isMobileDevice: true,
  isInFarcaster: true,
  isInIframe: true,
  hasFarcasterSDK: true,
  viewport: ~390px (mobile size),
  → Mostrar: Botón (CRÍTICO para este caso)
}
```

## 🔍 El Problema

Tu código actual detecta:
- Context 1 ✅
- Context 2 ✅
- Context 4 ❓ (puede fallar si SDK no está listo)

**Context 3 es ambiguo**: Puede ser desktop con iframe pequeño.

## 💡 Solución: Detección Más Inteligente

Necesitamos diferenciar entre:
- **Desktop con MiniApp** → Puede mostrar QR
- **Mobile con MiniApp** → DEBE mostrar Botón

### Lógica Propuesta:

```javascript
const isTrueMobile = (
  // 1. User Agent confirma es móvil
  /android|iphone|ipad|ipod/i.test(userAgent) ||

  // 2. Tiene touch support + viewport pequeño
  ('ontouchstart' in window && window.innerWidth < 768) ||

  // 3. Es MiniApp en iframe + viewport mobile
  (isInIframe && hasFarcasterSDK && window.innerWidth < 600)
);

const shouldShowButton = isTrueMobile;
const shouldShowQR = !isTrueMobile;
```

## 🎯 Tabla de Decisión

| Contexto | User Agent | Iframe | SDK | Width | → Mostrar |
|----------|-----------|--------|-----|-------|-----------|
| Desktop Web | Desktop | ❌ | ❌ | >768 | QR ✅ |
| Mobile Web | Mobile | ❌ | ❌ | <768 | Button ✅ |
| Farcaster Web | Desktop | ✅ | ✅ | >768 | QR ✅ |
| Farcaster Native | Mobile | ✅ | ✅ | <600 | Button ✅ |

