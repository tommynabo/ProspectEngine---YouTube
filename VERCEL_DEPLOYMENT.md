# Vercel Deployment Guide - ProspectEngine

## ⚠️ Problema Actual

El deployment fue bloqueado porque la cuenta de GitHub no está vinculada correctamente a Vercel.

**Solución**: Reimportar el proyecto bajo tu cuenta Vercel: `tomasnivraone@gmail.com`

---

## 🚀 Pasos para Desplegar Correctamente

### Paso 1: Ir a Vercel e Iniciar Sesión
1. Abre https://vercel.com
2. Haz clic en **Log in** 
3. **Importante**: Usa `tomasnivraone@gmail.com` para iniciar sesión
   - Si no tienes cuenta, crea una con este email
   - Si ya tienes cuenta, asegúrate de estar en esa sesión

### Paso 2: Importar el Proyecto desde GitHub
1. En el dashboard de Vercel, haz clic en **Add New...** → **Project**
2. Haz clic en **Import Git Repository**
3. Busca: `ProspectEngine---YouTube` 
4. **Importante**: Conecta tu GitHub si aún no está conectado
   - Vercel te pedirá autorizaciones de GitHub
   - Autoriza acceso a `tommynabo/ProspectEngine---YouTube`

### Paso 3: Configurar Nombre del Proyecto
1. **Project Name**: `prospect-engine` (o el que prefieras)
2. **Framework Preset**: Vite
3. Haz clic en **Continue**

### Paso 4: Configurar Variables de Entorno
Vercel te pedirá que agregues las variables. **Cópia exactamente estas desde tu `.env` local**:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` |
| `POSTGRES_PRISMA_URL` | `postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require` |
| `JWT_SECRET` | `your-super-secret-key-change-in-production` |
| `VITE_OPENAI_API_KEY` | Tu API key de OpenAI (si tienes) |
| `VITE_APIFY_API_TOKEN` | Tu API key de Apify (si tienes) |

**En Vercel, es mejor usar "Environment Secrets"** para las credenciales sensibles.

### Paso 5: Deploy
1. Haz clic en **Deploy**
2. Espera a que Vercel compile y despliegue el proyecto
3. Una vez completado, Vercel te dará una URL como:
   - `https://prospect-engine-xyz.vercel.app`

---

## ✅ Verificación Post-Deployment

### Test 1: Verificar que el sitio carga
```bash
curl https://prospect-engine-xyz.vercel.app
# Debe retornar HTML del index
```

### Test 2: Verificar variables de entorno en Vercel
1. En Vercel, ve a tu proyecto
2. Haz clic en **Settings**
3. Ve a **Environment Variables**
4. Verifica que todas las variables estén ahí
5. **IMPORTANTE**: Las contraseñas NO deben ser visibles después de guardadas

### Test 3: Test de conexión a BD
Si tienes un API endpoint para testear:
```bash
curl https://prospect-engine-xyz.vercel.app/api/health
# Debe retornar que la BD está conectada
```

---

## 🔐 Seguridad en Vercel

### Variables Sensibles
✅ **DATABASE_URL** - Guardar como **Secret**
✅ **JWT_SECRET** - Guardar como **Secret**
✅ **OPENAI_API_KEY** - Guardar como **Secret**

### Cambiar Secrets sin Redeployear
1. En Vercel, ve a **Settings** → **Environment Variables**
2. Edita la variable
3. Guarda
4. El secret se actualiza automáticamente para nuevos deploys

---

## 🔧 Configuraciones Avanzadas

### Dominio Personalizado
1. Ve a **Settings** → **Domains**
2. Añade tu dominio personalizado
3. Actualiza DNS records según las instrucciones de Vercel

### GitHub Actions para CI/CD Automático
Cada vez que hagas push a GitHub, Vercel automáticamente:
1. Descarga el código
2. Corre `npm install`
3. Corre `npm run build`
4. Deploya a producción

No necesitas hacer nada manualmente después del primer setup.

### Rollback a Version Anterior
1. En Vercel, ve a **Deployments**
2. Haz clic en el deployment anterior
3. Haz clic en **Promote to Production**

---

## 🆘 Troubleshooting

### Error: "Module not found"
**Causa**: Las dependencias no se instalaron
**Solución**: 
- Verifica que `package.json` esté correcto
- Verifica que `package-lock.json` esté en el repo
- En Vercel, fuerza rebuild en **Deployments** → **Redeploy**

### Error: "Database connection failed"
**Causa**: Las variables `DATABASE_URL` no están configuradas
**Solución**:
- Ve a **Settings** → **Environment Variables** en Vercel
- Copia exactamente el valor desde tu `.env` local
- Reemplaza cualquier valor anterior
- Redeploya

### Error: "Build failed - port already in use"
**Causa**: Normalmente por problemas con dependencias
**Solución**:
- Borra `package-lock.json` localmente
- Corre `npm install` de nuevo
- Haz push a GitHub
- Vercel rebuild automáticamente

### Logs de Deploy
1. En Vercel, ve a **Deployments**
2. Haz clic en el deployment
3. Haz clic en **Build Logs** para ver qué falló
4. Haz clic en **Runtime Logs** para ver errores en tiempo real

---

## 📋 Checklist Final

- [ ] ✅ Cuenta Vercel creada/actualizada con `tomasnivraone@gmail.com`
- [ ] ✅ Proyecto importado desde GitHub
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Deploy completado exitosamente
- [ ] ✅ Sitio accesible en URL de Vercel
- [ ] ✅ Base de datos conectada y funcionando
- [ ] ✅ JWT_SECRET configurado
- [ ] ⏳ Dominio personalizado (opcional)

---

## 🔑 Credenciales a Usar

**Para Vercel deployment**:
- Email: `tomasnivraone@gmail.com`
- GitHub: `tommynabo` (tu usuario actual)
- Neon DB: `neondb_owner` con credenciales en `.env`

**Comando de test local**:
```bash
npm install
npm run dev
# Abre http://localhost:5173
```

---

## 📞 Links Útiles

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Neon Console: https://console.neon.tech
- GitHub: https://github.com/tommynabo/ProspectEngine---YouTube

---

**Última actualización**: 2026-08-05
**Status**: 🔴 Pendiente de re-deployment con cuenta correcta
