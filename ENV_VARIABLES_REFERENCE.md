# 📋 Variables de Entorno - COPIAR/PEGAR DIRECTO

**IMPORTANTE**: Copia EXACTAMENTE lo que está abajo. No cambies nada.

---

## 🔐 Environment Variables para Vercel

### Variable 1
```
Key: DATABASE_URL
```

Copiar este VALUE entero:
```
postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

**Tipo**: Marcar ☑️ como **Secret**

---

### Variable 2
```
Key: POSTGRES_PRISMA_URL
```

Copiar este VALUE entero:
```
postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require
```

**Tipo**: Marcar ☑️ como **Secret**

---

### Variable 3
```
Key: JWT_SECRET
```

Copiar este VALUE entero:
```
your-super-secret-key-change-in-production
```

**Tipo**: Marcar ☑️ como **Secret**

---

### Variable 4 (OPCIONAL - si tienes API key de OpenAI)
```
Key: VITE_OPENAI_API_KEY
```

Copiar tu API key:
```
sk-xxxxxxxxxxxxx
```

**Tipo**: Marcar ☑️ como **Secret**

---

### Variable 5 (OPCIONAL - si tienes API key de Apify)
```
Key: VITE_APIFY_API_TOKEN
```

Copiar tu API key:
```
apify_xxxxxxxxxxxxx
```

**Tipo**: Marcar ☑️ como **Secret**

---

## ✅ Checklist de Confirmación

Antes de hacer Deploy, verifica:

- [ ] ✅ DATABASE_URL copiado correctamente
- [ ] ✅ POSTGRES_PRISMA_URL copiado correctamente
- [ ] ✅ JWT_SECRET configurado
- [ ] ✅ Todas las variables están marcadas como "Secret"
- [ ] ✅ No agregaste espacios extras
- [ ] ✅ No cambiaste ningún valor

---

## 🚨 Errores Comunes

### ❌ "Database connection refused"
**Causa**: DATABASE_URL está mal copiada
**Solución**: Copia EXACTAMENTE lo de arriba, sin espacios

### ❌ "Variable not found"
**Causa**: El KEY está mal escrito (mayúsculas/minúsculas)
**Solución**: 
- `DATABASE_URL` ✅ (así, todo en MAYÚSCULA)
- `database_url` ❌ (NO en minúsculas)

### ❌ "Build failed"
**Causa**: Algunas variables no se pasaron
**Solución**: En Vercel, ve a Settings → Environment Variables → Verifica todas

---

## 📞 Resumen en 3 Pasos

1. **En Vercel**, crea nuevo proyecto importando: `tommynabo/ProspectEngine---YouTube`
2. **Configura estas 3 variables OBLIGATORIAS**:
   - DATABASE_URL
   - POSTGRES_PRISMA_URL
   - JWT_SECRET
3. **Marca como Secret** cada una ☑️ y haz clic en **Deploy**

¡Eso es! 🚀

---

**Última actualización**: 2026-08-05
