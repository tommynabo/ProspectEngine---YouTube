# ApexEngine - Inmobiliarias LinkedIn Scraper

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Client](https://img.shields.io/badge/client-Marcos-blue)
![Region](https://img.shields.io/badge/region-España-yellow)

## 🎯 Proyecto

Sistema automatizado de scraping en LinkedIn para identificar y contactar dueños de inmobiliarias en España. 

**Cliente:** Marcos  
**Objetivo:** Contactar a ~57.000 dueños de inmobiliarias en España  
**Estrategia:** Scraping + IA + Envío manual de 25 invitaciones/día  

---

## 📋 Características Principales

### 🔍 Motor de Búsqueda Inteligente
- Búsqueda en LinkedIn de perfiles específicos
- Filtros avanzados: 
  - **Ubicación:** España (Nacional)
  - **Sector:** Real Estate / Servicios Inmobiliarios
  - **Tamaño:** 1-10, 11-50, 51-200 empleados
  - **Cargos Incluidos:** CEO, Fundador, Socio, Owner, Director General, Gerente
  - **Excluidos:** Agentes, Asesores, Comerciales, Franquiciados

### 🤖 Análisis con IA (OpenAI)
- Análisis psicológico del perfil
- Detección de momento empresarial
- Generación de **2 mensajes personalizados**:
  - **Mensaje A:** Enfocado en Automatización de atención al cliente
  - **Mensaje B:** Enfocado en NPLs (Créditos Problemáticos)

### 💾 Base de Datos (Supabase)
- Almacenamiento de leads con RLS (Row-Level Security)
- Historial de búsquedas
- Registro de contactos diarios (máx 25)
- Plantillas de mensajes
- Seguimiento de deduplicación

### 🎨 Interfaz Minimalista
- Diseño oscuro y limpio
- Vista de tarjetas para cada lead
- Botones de "Copiar Mensaje" (A y B)
- Control de contactos: "Check" y "Descartar"
- Barra de progreso del día

---

## 🚀 Quick Start

### 1. Instalación

```bash
cd ApexEngine
npm install
```

### 2. Configurar Variables de Entorno

El archivo `.env` ya está configurado con:
- ✅ **Supabase** (Nueva base de datos: biltmzurmhvgdprpekoa)
- ✅ **OpenAI API** (Para análisis y generación de mensajes)
- ✅ **Apify** (Para scraping de LinkedIn)

Verificar que tengas las keys correctas en `.env`:

```env
VITE_SUPABASE_URL=https://biltmzurmhvgdprpekoa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY...
VITE_APIFY_API_TOKEN=YOUR_APIFY_API_TOKEN...
```

### 3. Desplegar Schema en Supabase

```bash
# Opción 1: Con Supabase CLI
bash deploy-schema.sh

# Opción 2: Ejecutar SQL manualmente
# Copia el contenido de supabase/apex_engine_schema.sql
# Pegas en Supabase SQL Editor (https://app.supabase.com)
```

### 4. Iniciar Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## 📊 Estructura de Datos

### Tabla: `leads`
```
id (UUID)
user_id (FK)
name, job_title, company_name
linkedin_url, email, phone
ai_summary, ai_pain_points, ai_business_moment
messageA, messageB (⭐ NEW)
isNPLPotential (⭐ NEW)
status: 'scraped' | 'enriched' | 'ready' | 'contacted' | 'replied' | 'discarded'
```

### Tabla: `message_templates`
Almacena los 2 mensajes generados para cada lead:
```
message_type: 'generic', 'npl', 'custom'
message_a_generic
message_b_npl
prompt_used
generated_at
message_selected: 'a' | 'b'
sent_at
```

### Tabla: `daily_contact_log`
Registro de los ~25 contactos que Marcos realiza manualmente:
```
user_id, lead_id
contact_date, contacted_at
message_type: 'generic' | 'npl'
message_sent
invitation_response: 'pending' | 'accepted' | 'rejected'
```

### Tabla: `search_criteria`
Filtros guardados y reutilizables:
```
name: e.g. "Inmobiliarias España"
location: "España"
industry: "Real Estate"
job_titles: ['CEO', 'Fundador', ...]
exclude_titles: ['Agente', ...]
company_sizes: ['1-10', '11-50', '51-200']
```

---

## 🔄 Flujo de Trabajo Para Marcos

```
1. [SCRAPER] AntiGravity raspa leads en LOTES
   └─ Provincial o por letras del alfabeto
   └─ Evita baneos y saturación

2. [IA] OpenAI analiza cada perfil
   └─ Genera psychologicalProfile, businessMoment, salesAngle
   └─ ⭐ Crea 2 mensajes (A: Genérico, B: NPL)

3. [BASE DE DATOS] Se guardan en Supabase
   └─ Estado: 'ready'
   └─ Listo para Marcos

4. [DASHBOARD] Marcos entra, ve 1 tarjeta por lead
   ├─ Nombre, Cargo, Empresa
   ├─ Botón "Copiar Mensaje A" 
   ├─ Botón "Copiar Mensaje B" 
   ├─ Botón "✓ Contactado"
   └─ Botón "✕ Descartar"

5. [MANUAL] Marcos abre LinkedIn, pega, envía
   ├─ Max 25/día (límite manual)
   ├─ Sistema trackea contactos en daily_contact_log
   └─ Lead pasa a status: 'contacted'

6. [SEGUIMIENTO] En la barra lateral ve progreso
   ├─ Pendientes: XX
   ├─ Contactados hoy: XX
   └─ Descartados: XX
```

---

## ⚙️ Configuración del Proyecto

### En `config/project.ts`:

```typescript
immobiliariasConfig: {
  targetIndustries: ['Real Estate', 'Servicios Inmobiliarios'],
  companySizes: ['1-10', '11-50', '51-200'],
  requiredTitles: ['CEO', 'Fundador', ...],
  excludeTitles: ['Agente', ...],
  dailyContactLimit: 25,
  enableNPLDetection: true,
  batchScrapingStrategy: 'provincial' // o 'alphabetical'
}
```

### Feature Flags (`.env`):

```env
VITE_ENABLE_NPL_DETECTION=true        # Detecta potencial NPL
VITE_ENABLE_MESSAGE_VARIANTS=true     # Genera 2 mensajes
VITE_DAILY_CONTACT_LIMIT=25           # Límite manual de Marcos
VITE_DARK_MODE=true                   # Interfaz oscura
```

---

## 📱 Componentes Principales

### `LeadsCards.tsx` ⭐ **NUEVO**
Interfaz minimalista con tarjetas para cada lead:
- Nombre, Cargo, Empresa
- 2 botones "Copiar" (Mensaje A y B)
- "✓ Contactado" / "✕ Descartar"
- Progreso del día

### `SearchService.ts`
Motor de búsqueda (intacto + función nueva):
- `startSearch()` - Busca en LinkedIn
- `interpretQuery()` - Interpreta búsqueda
- `generateUltraAnalysis()` - Análisis con IA
- `generateTwoMessages()` - ⭐ **NUEVO** Genera los 2 mensajes

### `App.tsx`
Orquestación principal:
- Gestiona estado de leads
- Marca contactos (`handleMarkContacted`)
- Marca descartados (`handleMarkDiscarded`)
- Integra con Supabase

---

## 🔐 Supabase RLS Policy

Todos los datos están protegidos con Row-Level Security:

```sql
-- Usuarios solo pueden ver sus propios datos
CREATE POLICY "Users can view their own X" 
  ON table_name FOR SELECT 
  USING (auth.uid() = user_id);
```

---

## 📊 Prompts del Sistema

Se han configurado en `system_prompts` tabla:

1. **`profile_analysis_immobiliarias`** - Analiza perfiles de inmobiliarias
2. **`message_generation_generic`** - Genera Mensaje A (Automatización)
3. **`npl_detection`** - Detecta potencial de NPLs

*Todos personalizables desde panel de admin si es necesario*

---

## 🐙 GitHub

Repositorio: `git@github.com:tommynabo/ApexEngine.git`

Principal branch: `main`

```bash
git push origin main
```

---

## 📞 Contacto & Soporte

- **Cliente:** Marcos
- **Proyecto:** ApexEngine - Inmobiliarias LinkedIn Scraper
- **Período:** Febrero 2025 - Marchavailable 2025
- **Presupuesto:** ~250€ setup + 25€-75€/month

---

## 📝 Changelog

### v1.0.0 - 2025-02-24
- ✨ Lanzamiento inicial de ApexEngine
- ✨ Nueva interfaz minimalista con tarjetas
- ✨ Generación de 2 mensajes personalizados (A y B)
- ✨ Sistema de tracking de contactos diarios
- ✨ Nueva base de datos Supabase (biltmzurmhvgdprpekoa)
- ✨ Soporte para NPL detection
- ♻️ Motor de búsqueda mantiene intacto

---

**Desarrollado con ❤️ para Marcos**
