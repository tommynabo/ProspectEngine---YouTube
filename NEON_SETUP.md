# ProspectEngine - Neon PostgreSQL Setup

## 🚀 Migracion Completada: Supabase → Neon

Este proyecto ha sido completamente configurado para usar **Neon PostgreSQL** en lugar de Supabase, proporcionando una base de datos robusta y confiable sin dependencias de terceros para autenticación.

## 📋 Estado Actual

✅ **Base de datos Neon**: Completamente configurada y funcional
- 13 tablas principales creadas
- Índices optimizados para búsquedas rápidas
- Triggers y funciones automáticas implementadas
- PostgreSQL 17.10 (Enterprise-grade)

✅ **Autenticación**: Sistema JWT nativo implementado
- No hay dependencia de Supabase Auth
- Contraseñas hasheadas con bcryptjs
- Tokens JWT con expiración configurable

✅ **Cliente TypeScript/JavaScript**: Listo para usar
- Cliente frontend con métodos simples
- Autenticación persistente via localStorage
- Métodos para CRUD de leads, criterios de búsqueda, etc.

## 🔑 Credenciales de Base de Datos

```
Endpoint: ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech
Usuario: neondb_owner
Contraseña: npg_2vdSAzstOa0e
Base de Datos: neondb
```

**⚠️ SEGURIDAD CRÍTICA**: Estas credenciales están en `.env`. Rota las credenciales en Neon después de la primera verificación.

## 📁 Estructura de Carpetas Nuevas

```
lib/
├── db.ts          # Cliente PostgreSQL connection pool
├── auth.ts        # Funciones de autenticación (JWT, hash, etc)
└── client.ts      # Cliente TypeScript para frontend

api/
└── auth.ts        # API endpoint handler para login/registro
```

## 🛠️ Instalación & Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales Neon
```

### 3. Verificar conexión a BD
```bash
npm run db:test
```

## 💻 Uso en Frontend

### Registrarse
```typescript
import { getClient } from '@/lib/client';

const client = getClient();

const auth = await client.register(
  'user@example.com',
  'password123',
  'John Doe',
  'Acme Corp'
);

console.log(auth.token);  // JWT token
console.log(auth.user);   // User data
```

### Login
```typescript
const auth = await client.login('user@example.com', 'password123');
// Token se guarda automáticamente en localStorage
```

### Crear un Lead
```typescript
const lead = await client.createLead({
  name: 'Carlos Silva',
  email: 'carlos@example.com',
  company: 'Tech Corp',
  status: 'new',
});
```

### Obtener Todos los Leads
```typescript
const leads = await client.getLeads();
leads.forEach(lead => console.log(lead.name));
```

## 📊 Tablas de Base de Datos

### users
- Todos los usuarios del sistema
- Campos: id, email, password_hash, full_name, company_name, status, last_login_at

### profiles
- Información extendida del usuario
- Campos: target_icp, industry, business_size, preferences

### leads
- Leads encontrados por búsquedas
- Campos: name, email, company, status, lead_score, tags

### search_criteria
- Criterios de búsqueda guardados
- Campos: name, platform, keywords, location, filters

### search_history
- Historial de búsquedas realizadas
- Campos: query, results_count, execution_time, status

### message_templates
- Plantillas de mensajes reutilizables
- Campos: name, subject_line, content, template_type, variables

### daily_contact_log
- Log de contactos realizados
- Campos: contact_type, message_template_id, status, response_text

### linkedin_campaigns
- Campañas específicas de LinkedIn
- Campos: campaign_name, status, target_profile, leads_count

### sessions
- Sesiones activas de usuarios
- Campos: token, expires_at, ip_address, user_agent

### api_usage_tracking
- Tracking de uso de APIs externas
- Campos: api_endpoint, request_count, response_status

### deduplication_log
- Log de deduplicación de leads
- Campos: original_lead_id, duplicate_lead_id, match_score, merge_status

### user_configuration
- Configuración personalizada del usuario
- Campos: daily_contact_limit, automation_enabled, api_quota_limit

### system_prompts
- Prompts del sistema para AI
- Campos: name, prompt_text, version, is_active

## 🔐 Seguridad

### Cambiar JWT Secret
```bash
# En .env, cambiar:
JWT_SECRET=your-super-secret-key-change-in-production
# Por una clave segura generada aleatoriamente
```

### Rotar Credenciales Neon
1. Ir a https://console.neon.tech
2. Crear usuario nuevo con permisos limitados
3. Usar esas credenciales en .env
4. Eliminar usuario anterior

## 📈 Escalado Futuro

- **Prisma ORM**: Se puede agregar para mejor manejo de modelos
- **API REST completo**: Extender los endpoints en `/api`
- **GraphQL**: Alternativa a REST para consultas complejas
- **Caché con Redis**: Mejorar performance
- **Full-text search**: Búsqueda avanzada de leads

## 🆘 Troubleshooting

### Error: "ECONNREFUSED"
- Verificar que Neon esté accesible
- Comprobar que DATABASE_URL está correcta en .env

### Error: "Invalid or expired token"
- Limpiar localStorage: `localStorage.clear()`
- Hacer login nuevamente

### Error: "Extension not in allowed list"
- Usar solo extensiones permitidas por Neon (pgcrypto, uuid-ossp, etc)

## 📞 Comandos Útiles

```bash
# Conectar a la BD directamente
PGPASSWORD="npg_2vdSAzstOa0e" psql -h ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech -U neondb_owner -d neondb

# Ver todas las tablas
\dt

# Ver esquema de una tabla
\d leads

# Ejecutar query
SELECT * FROM users;
```

## ✅ Checklist Próximos Pasos

- [ ] Rotar credenciales Neon en producción
- [ ] Configurar JWT_SECRET único
- [ ] Agregar validaciones de email
- [ ] Implementar 2FA
- [ ] Crear backup automático
- [ ] Configurar logging centralizado
- [ ] Agregar rate limiting en APIs

---

**Última actualización**: 2026-08-04
**Versión**: 1.0 (Neon Migration)
