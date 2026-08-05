#!/bin/bash

# ProspectEngine - Vercel Setup Script
# Este script facilita la configuración correcta en Vercel

echo "======================================"
echo "ProspectEngine - Vercel Setup Guide"
echo "======================================"
echo ""
echo "⚠️ IMPORTANTE: Sigue estos pasos exactamente en este orden"
echo ""

# Paso 1: Verificar que estamos en el directorio correcto
echo "✅ Paso 1: Verificar directorio del proyecto"
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: No estamos en el directorio raíz del proyecto"
    echo "   Navega a: /Users/tomas/Downloads/DOCUMENTOS/ProspectEngine-YouTube"
    exit 1
fi
echo "✅ Directorio correcto confirmado"
echo ""

# Paso 2: Verificar que Git está limpio
echo "✅ Paso 2: Verificar estado de Git"
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Hay cambios sin commitear:"
    git status --short
    echo ""
    echo "¿Deseas commitear estos cambios? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        git add -A
        git commit -m "Auto-commit before Vercel deployment"
        git push origin main
        echo "✅ Cambios pusheados a GitHub"
    fi
fi
echo ""

# Paso 3: Mostrar las credenciales a usar
echo "✅ Paso 3: Credenciales para Vercel"
echo ""
echo "Usar estas credenciales en Vercel:"
echo "  Email: tomasnivraone@gmail.com"
echo "  GitHub User: tommynabo"
echo "  Repositorio: tommynabo/ProspectEngine---YouTube"
echo ""

# Paso 4: Mostrar variables de entorno
echo "✅ Paso 4: Variables de Entorno a Configurar en Vercel"
echo ""
echo "En Vercel, en Settings → Environment Variables, configura:"
echo ""
echo "1. DATABASE_URL (marcar como Secret)"
echo "   postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
echo ""
echo "2. POSTGRES_PRISMA_URL (marcar como Secret)"
echo "   postgresql://neondb_owner:npg_2vdSAzstOa0e@ep-little-grass-awpw8jj2-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require"
echo ""
echo "3. JWT_SECRET (marcar como Secret)"
echo "   your-super-secret-key-change-in-production"
echo ""
echo "4. VITE_OPENAI_API_KEY (marcar como Secret, si tienes)"
echo ""
echo "5. VITE_APIFY_API_TOKEN (marcar como Secret, si tienes)"
echo ""

# Paso 5: Instrucciones finales
echo "✅ Paso 5: Ir a Vercel y Crear Nuevo Proyecto"
echo ""
echo "SIGUE EXACTAMENTE ESTOS PASOS:"
echo ""
echo "1. Abre https://vercel.com/dashboard"
echo "2. Verifica que estés logueado como: tomasnivraone@gmail.com"
echo "3. Haz clic en: '+ Add New' → 'Project'"
echo "4. Haz clic en: 'Import Git Repository'"
echo "5. Busca: 'ProspectEngine---YouTube'"
echo "6. Si pide autorización de GitHub, autoriza a tommynabo"
echo "7. Haz clic en: 'Import'"
echo "8. En 'Project Name', escribe: prospect-engine"
echo "9. En 'Framework Preset', selecciona: Vite"
echo "10. Haz clic en: 'Continue'"
echo "11. Ve a pestaña 'Environment Variables'"
echo "12. Copia EXACTAMENTE las variables de arriba"
echo "13. Marca cada variable sensible como 'Secret'"
echo "14. Haz clic en: 'Deploy'"
echo ""
echo "15. ¡ESPERA a que termine el deploy! (~2-3 minutos)"
echo ""

echo "✅ Paso 6: Verificar Deployment"
echo ""
echo "Una vez completado:"
echo "1. Vercel te dará una URL como: https://prospect-engine-xxx.vercel.app"
echo "2. Visita esa URL en tu navegador"
echo "3. Si ve la app, ¡ÉXITO!"
echo "4. Si hay errores, ve a 'Deployments' → 'Build Logs'"
echo ""

echo "📞 Links Útiles:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- GitHub Repo: https://github.com/tommynabo/ProspectEngine---YouTube"
echo "- Neon Console: https://console.neon.tech"
echo ""

echo "======================================"
echo "Script completado. ¡Continúa en Vercel!"
echo "======================================"
