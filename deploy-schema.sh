#!/bin/bash
# ProspectEngine-YouTube - Initialize Supabase Schema
# Usage: SUPABASE_DB_PASSWORD=your_password bash deploy-schema.sh

set -e

echo "🚀 ProspectEngine-YouTube - Supabase Schema Deployment"
echo "======================================================="

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD environment variable is required"
    echo "Usage: SUPABASE_DB_PASSWORD=your_password bash deploy-schema.sh"
    exit 1
fi

# Replace with your new Supabase project ID
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-YOUR_PROJECT_ID}"

echo "📋 Deploying schema to project: $SUPABASE_PROJECT_ID"

psql "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:6543/postgres" < supabase/apex_engine_schema.sql

echo "✅ Schema deployed successfully"
