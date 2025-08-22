#!/usr/bin/env node

/**
 * Figma MCP Integration Test Script
 * ทดสอบการเชื่อมต่อ Figma MCP และการทำงานของ environment variables
 */

require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// สีสำหรับ console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.blue}=== ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkEnvironmentVariables() {
  logHeader('ตรวจสอบ Environment Variables');
  
  const requiredVars = [
    'FIGMA_ACCESS_TOKEN',
    'FIGMA_TOKEN', 
    'FIGMA_FILE_ID'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName}: ตั้งค่าแล้ว`);
    } else {
      logError(`${varName}: ไม่ได้ตั้งค่า`);
      allPresent = false;
    }
  }
  
  if (!allPresent) {
    logWarning('กรุณาตั้งค่า environment variables ใน .env file');
    logInfo('ดูตัวอย่างใน .env.figma.example');
    return false;
  }
  
  return true;
}

async function checkConfigFiles() {
  logHeader('ตรวจสอบไฟล์การกำหนดค่า');
  
  const configFiles = [
    '.cursor/mcp.json',
    'app/.continue/mcpServers/new-mcp-server.yaml',
    '.env.figma.example',
    'docs/ai/figma-mcp.mdx'
  ];
  
  let allExist = true;
  
  for (const file of configFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      logSuccess(`${file}: พบไฟล์แล้ว`);
    } else {
      logError(`${file}: ไม่พบไฟล์`);
      allExist = false;
    }
  }
  
  return allExist;
}

async function testFigmaAPI() {
  logHeader('ทดสอบ Figma API Connection');
  
  if (!process.env.FIGMA_ACCESS_TOKEN || !process.env.FIGMA_FILE_ID) {
    logError('ไม่สามารถทดสอบ Figma API ได้ - ขาด environment variables');
    return false;
  }
  
  try {
    const fetch = require('node-fetch').default || require('node-fetch');
    
    const response = await fetch(
      `https://api.figma.com/v1/files/${process.env.FIGMA_FILE_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FIGMA_ACCESS_TOKEN}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logSuccess(`เชื่อมต่อ Figma API สำเร็จ`);
      logInfo(`ชื่อไฟล์: ${data.name}`);
      logInfo(`เวอร์ชัน: ${data.version}`);
      return true;
    } else {
      logError(`Figma API Error: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logError(`เกิดข้อผิดพลาดในการเชื่อมต่อ Figma API: ${error.message}`);
    
    // ลองใช้ built-in fetch สำหรับ Node.js 18+
    if (error.message.includes('node-fetch')) {
      logInfo('กำลังลองใช้ built-in fetch...');
      try {
        const response = await fetch(
          `https://api.figma.com/v1/files/${process.env.FIGMA_FILE_ID}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.FIGMA_ACCESS_TOKEN}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          logSuccess(`เชื่อมต่อ Figma API สำเร็จ (built-in fetch)`);
          logInfo(`ชื่อไฟล์: ${data.name}`);
          return true;
        }
      } catch (builtinError) {
        logError(`Built-in fetch ก็ไม่สำเร็จ: ${builtinError.message}`);
      }
    }
    
    return false;
  }
}

async function testFigmaScript() {
  logHeader('ทดสอบ Figma Fetch Script');
  
  const scriptPath = 'packages/tools/figma/fetch-figma-file.js';
  
  if (!fs.existsSync(scriptPath)) {
    logError(`ไม่พบ script: ${scriptPath}`);
    return false;
  }
  
  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], {
      env: { ...process.env },
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logSuccess('Figma fetch script ทำงานสำเร็จ');
        if (output.trim()) {
          logInfo('Output:');
          console.log(output.trim());
        }
        resolve(true);
      } else {
        logError(`Figma fetch script ล้มเหลว (exit code: ${code})`);
        if (errorOutput.trim()) {
          logError('Error output:');
          console.log(errorOutput.trim());
        }
        resolve(false);
      }
    });
    
    // Timeout หลัง 30 วินาที
    setTimeout(() => {
      child.kill();
      logWarning('Figma fetch script timeout');
      resolve(false);
    }, 30000);
  });
}

async function checkMCPServerAvailability() {
  logHeader('ตรวจสอบ MCP Server Availability');
  
  return new Promise((resolve) => {
    const child = spawn('npx', ['@figma/mcp-server', '--help'], {
      stdio: 'pipe'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        logSuccess('@figma/mcp-server พร้อมใช้งาน');
        resolve(true);
      } else {
        logWarning('@figma/mcp-server ยังไม่ได้ติดตั้ง');
        logInfo('รัน: npm install -g @figma/mcp-server');
        resolve(false);
      }
    });
    
    // Timeout หลัง 15 วินาที
    setTimeout(() => {
      child.kill();
      logWarning('MCP server check timeout');
      resolve(false);
    }, 15000);
  });
}

async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    Figma MCP Integration Test                ║');
  console.log('║                      การทดสอบ Figma MCP                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const results = {
    envVars: await checkEnvironmentVariables(),
    configFiles: await checkConfigFiles(),
    figmaAPI: await testFigmaAPI(),
    figmaScript: await testFigmaScript(),
    mcpServer: await checkMCPServerAvailability()
  };
  
  logHeader('สรุปผลการทดสอบ');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n${colors.bold}ผลการทดสอบ: ${passed}/${total} ผ่าน${colors.reset}\n`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ ผ่าน' : '❌ ไม่ผ่าน';
    const testNames = {
      envVars: 'Environment Variables',
      configFiles: 'Configuration Files',
      figmaAPI: 'Figma API Connection',
      figmaScript: 'Figma Fetch Script',
      mcpServer: 'MCP Server Availability'
    };
    console.log(`${status} ${testNames[test]}`);
  });
  
  if (passed === total) {
    logSuccess('\n🎉 การตั้งค่า Figma MCP เสร็จสมบูรณ์!');
    logInfo('ตอนนี้คุณสามารถใช้งาน Figma MCP กับ AI coding assistants ได้แล้ว');
  } else {
    logWarning('\n⚠️  การตั้งค่ายังไม่สมบูรณ์');
    logInfo('กรุณาแก้ไขปัญหาที่พบและรันการทดสอบอีกครั้ง');
    logInfo('ดูเอกสารเพิ่มเติมใน docs/ai/figma-mcp.mdx');
  }
  
  process.exit(passed === total ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkEnvironmentVariables,
  checkConfigFiles,
  testFigmaAPI,
  testFigmaScript,
  checkMCPServerAvailability
};