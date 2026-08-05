#!/usr/bin/env node

/**
 * Vercel Deployment Automation Script
 * This script automates the creation of the Vercel project
 * 
 * Usage: 
 *   VERCEL_TOKEN=vck_xxxx node deploy-to-vercel.js
 */

import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Use environment variable for API key (DO NOT hardcode)
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
const GITHUB_REPO = 'tommynabo/ProspectEngine---YouTube';
const PROJECT_NAME = 'prospect-engine';

if (!VERCEL_TOKEN) {
  console.error('❌ Error: VERCEL_TOKEN or VERCEL_API_TOKEN environment variable not set');
  console.error('Usage: VERCEL_TOKEN=your-token node deploy-to-vercel.js');
  process.exit(1);
}

/**
 * Make HTTP request to Vercel API
 */
function vercelRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Main deployment flow
 */
async function deploy() {
  console.log('🚀 ProspectEngine - Vercel Deployment Automation');
  console.log('================================================\n');

  try {
    // Step 1: Check user info
    console.log('1️⃣  Checking Vercel account...');
    const user = await vercelRequest('GET', '/v2/user');
    if (user.status !== 200) {
      throw new Error(`Failed to get user info: ${user.status}`);
    }
    console.log(`   ✅ User: ${user.data.user.email}`);
    console.log(`   ✅ Username: ${user.data.user.username}\n`);

    // Step 2: Try to find or create project
    console.log('2️⃣  Looking for existing project...');
    const projects = await vercelRequest('GET', '/v9/projects');
    
    let projectId = null;
    if (projects.data.projects && projects.data.projects.length > 0) {
      const existing = projects.data.projects.find(p => p.name === PROJECT_NAME);
      if (existing) {
        projectId = existing.id;
        console.log(`   ✅ Found existing project: ${existing.id}\n`);
      }
    }

    // Step 3: Create project if doesn't exist
    if (!projectId) {
      console.log('3️⃣  Creating new project...');
      
      const createPayload = {
        name: PROJECT_NAME,
        gitRepository: {
          repo: GITHUB_REPO,
          type: 'github',
        },
        framework: 'vite',
        rootDirectory: '.',
      };

      const createResult = await vercelRequest('POST', '/v12/projects', createPayload);
      
      if (createResult.status === 403) {
        console.log('   ⚠️  Cannot create via API (permission issue)');
        console.log('   📝 You need to create the project manually in Vercel:\n');
        console.log('      1. Go to https://vercel.com/dashboard');
        console.log('      2. Click "+ Add New" → "Project"');
        console.log('      3. Click "Import Git Repository"');
        console.log('      4. Search and select: ProspectEngine---YouTube');
        console.log('      5. Click "Import"\n');
        console.log('   📖 For detailed instructions, see: VERCEL_FINAL_SETUP.md\n');
        return;
      }

      if (createResult.status !== 201 && createResult.status !== 200) {
        console.log(`   ❌ Error: ${createResult.status}`);
        console.log(`   Error: ${JSON.stringify(createResult.data)}\n`);
        throw new Error('Failed to create project');
      }

      projectId = createResult.data.id;
      console.log(`   ✅ Project created: ${projectId}\n`);
    }

    // Step 4: Configure environment variables
    console.log('4️⃣  Configuring environment variables...');
    
    const envVars = [
      {
        key: 'DATABASE_URL',
        value: process.env.DATABASE_URL,
        type: 'secret',
      },
      {
        key: 'POSTGRES_PRISMA_URL',
        value: process.env.POSTGRES_PRISMA_URL,
        type: 'secret',
      },
      {
        key: 'JWT_SECRET',
        value: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
        type: 'secret',
      },
    ];

    for (const envVar of envVars) {
      if (!envVar.value) {
        console.log(`   ⚠️  Skipping ${envVar.key} (not in environment)`);
        continue;
      }

      const envPath = `/v9/projects/${projectId}/env`;
      const envPayload = {
        key: envVar.key,
        value: envVar.value,
        type: envVar.type,
        target: ['production', 'preview', 'development'],
      };

      const envResult = await vercelRequest('POST', envPath, envPayload);
      
      if (envResult.status === 200 || envResult.status === 201) {
        console.log(`   ✅ ${envVar.key} configured`);
      } else {
        console.log(`   ⚠️  Could not set ${envVar.key} via API (manual needed)`);
      }
    }
    console.log();

    // Final summary
    console.log('================================================');
    console.log('📋 NEXT STEPS:\n');
    console.log('1. Open: https://vercel.com/dashboard');
    console.log('2. Check if "prospect-engine" project exists');
    console.log('3. If not, create it manually (see VERCEL_FINAL_SETUP.md)');
    console.log('4. Configure environment variables if needed');
    console.log('5. View deployment at: https://prospect-engine.vercel.app');
    console.log('\n================================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run deployment
deploy();
