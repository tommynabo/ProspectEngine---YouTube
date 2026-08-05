# ⚡ VERCEL SETUP - Guía Rápida Visual

**Status Actual**: Listo para desplegar
**Email Vercel**: tomasnivraone@gmail.com
**GitHub Repo**: tommynabo/ProspectEngine---YouTube

---

## 🔴 PROBLEMA ACTUAL
```
Error: The commit author does not have contributing access to the project on Vercel
```

**Causa**: El proyecto Vercel fue creado bajo una cuenta diferente
**Solución**: Crear un NUEVO proyecto bajo la cuenta correcta (tomasnivraone@gmail.com)

---

## 🚀 PASO 1: Ir a Vercel

Abre en tu navegador:
```
https://vercel.com/dashboard
```

**Verifica que veas**: 
- Tu email en la esquina superior derecha: `tomasnivraone@gmail.com`
- Si NO ves eso, haz clic en tu perfil y cambia a esa cuenta

---

## 📦 PASO 2: Crear Nuevo Proyecto

**Haz clic en**: `+ Add New` → `Project`

![Vercel Dashboard](./images/vercel-dashboard.png)

---

## 🔗 PASO 3: Importar desde GitHub

**Haz clic en**: `Import Git Repository`

En el buscador, escribe:
```
ProspectEngine---YouTube
```

**Resultado esperado**: 
- Verá: `tommynabo/ProspectEngine---YouTube`
- Estado: `(Private)` porque está privado

**Haz clic en**: El repositorio cuando aparezca

---

## ⚠️ PASO 4: Autorización GitHub (SI te pide)

Si Vercel pide autorización:
- Haz clic en: `Authorize Vercel`
- Te llevará a GitHub
- Haz clic en: `Authorize`
- Volverá a Vercel automáticamente

---

## ⚙️ PASO 5: Configuración Básica

**Campo "Project Name":**
```
prospect-engine
```

**Campo "Framework Preset":**
```
Vite
```

**Haz clic en**: `Continue`

---

## 🔐 PASO 6: Environment Variables (MÁS IMPORTANTE)

Vercel te mostrará una sección de "Environment Variables"

**Copia EXACTAMENTE cada una:**

### Variable 1: DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
Tipo: Secret ✅ (MARCAR)
```

### Variable 2: POSTGRES_PRISMA_URL
```
Key: POSTGRES_PRISMA_URL
Value: postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require
Tipo: Secret ✅ (MARCAR)
```

### Variable 3: JWT_SECRET
```
Key: JWT_SECRET
Value: your-super-secret-key-change-in-production
Tipo: Secret ✅ (MARCAR)
```

### Variable 4: VITE_OPENAI_API_KEY (OPCIONAL)
```
Key: VITE_OPENAI_API_KEY
Value: sk-your-actual-key (si tienes)
Tipo: Secret ✅ (MARCAR)
```

### Variable 5: VITE_APIFY_API_TOKEN (OPCIONAL)
```
Key: VITE_APIFY_API_TOKEN
Value: apify_token_here (si tienes)
Tipo: Secret ✅ (MARCAR)
```

---

## 🎬 PASO 7: Deploy

**Haz clic en**: `Deploy` (botón grande)

**Espera**: 2-3 minutos mientras Vercel:
- Descarga el código
- Instala dependencias
- Compila el proyecto
- Lo publica

**Verás una pantalla con**: "Deployment successful!"

---

## ✅ PASO 8: Verificación

Una vez que diga "Deployment successful", Vercel te dará una URL tipo:
```
https://prospect-engine-xxxxx.vercel.app
```

**Abre esa URL en tu navegador** → Deberías ver tu aplicación cargando

---

## 🆘 Si Algo Falla

### Error: "Module not found"
1. Ve a la pestaña: `Deployments`
2. Haz clic en el último deployment
3. Ve a: `Build Logs`
4. Busca líneas rojas (errores)

### Error: "Database connection failed"
1. Verifica que las variables estén bien copiadas
2. Ve a: `Settings` → `Environment Variables`
3. Elimina y re-añade las variables
4. Redeploya

### Error: "Port already in use"
1. Normalmente se soluciona solo
2. Intenta nuevamente desde: `Deployments` → `Redeploy`

---

## 📋 Checklist Final

- [ ] ✅ Estoy logueado como: tomasnivraone@gmail.com
- [ ] ✅ Creé un NUEVO proyecto (no reimporté el viejo)
- [ ] ✅ Seleccioné: ProspectEngine---YouTube
- [ ] ✅ Nombre: prospect-engine
- [ ] ✅ Framework: Vite
- [ ] ✅ Agregué todas 5 variables de entorno
- [ ] ✅ Marqué como "Secret" las que son credenciales
- [ ] ✅ Hice clic en "Deploy"
- [ ] ✅ Esperé el "Deployment successful!"
- [ ] ✅ Visité la URL y vi la app

---

## 🔑 URLs Importantes

| Servicio | URL |
|----------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **GitHub Repo** | https://github.com/tommynabo/ProspectEngine---YouTube |
| **Neon Console** | https://console.neon.tech |
| **Mi Proyecto en Vercel** | https://prospect-engine-xxxxx.vercel.app |

---

## 💡 Tips Importantes

✅ **Las variables "Secret" no se ven después de guardadas** → Normal y seguro
✅ **El deploy toma 2-3 minutos la primera vez** → Paciencia
✅ **Si algo falla, puedes redeploy desde "Deployments"** → Sin costo extra
✅ **El repositorio es privado, Vercel lo sabe** → No hay problema

---

## ❓ ¿Necesitas Ayuda?

Si algo falla:
1. Revisa los "Build Logs" en Vercel
2. Verifica que copiaste las variables EXACTAMENTE
3. Intenta hacer un nuevo deploy desde "Deployments"

**El código está 100% listo. Solo necesitas hacer estos pasos en Vercel.**

---

**Última actualización**: 2026-08-05
**Versión**: 2.0 (Guía Visual)
