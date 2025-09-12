#!/usr/bin/env node

/**
 * ARIA v4 CLI Tool
 * Command-line interface for managing ARIA workflows and development processes
 */

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

// Load ARIA prompt
async function loadARIAPrompt() {
  try {
    const promptPath = path.join(__dirname, '..', '.github', 'prompts', 'aria.prompt.md');
    return await fs.readFile(promptPath, 'utf8');
  } catch (error) {
    console.error('Failed to load ARIA prompt:', error.message);
    return null;
  }
}

// T-shirt sizing utility
function determineTShirtSize(description) {
  const complexity = description.toLowerCase();
  
  // Simple question or clarification
  if (complexity.includes('question') || complexity.includes('how to') || complexity.includes('what is')) {
    return 'XS';
  }
  
  // Small features
  if (complexity.includes('small') || complexity.includes('simple') || complexity.includes('minor')) {
    return 'S';
  }
  
  // Architecture decisions needed
  if (complexity.includes('architecture') || complexity.includes('design') || complexity.includes('system')) {
    return 'M';
  }
  
  // Multiple components affected
  if (complexity.includes('multiple') || complexity.includes('integration') || complexity.includes('complex')) {
    return 'L';
  }
  
  // Large impact or compliance
  if (complexity.includes('compliance') || complexity.includes('security') || complexity.includes('enterprise')) {
    return 'XL';
  }
  
  return 'M'; // Default medium
}

// Get active roles based on size and project type
function getActiveRoles(size, projectType = 'web-application') {
  const roles = ['ScrumMaster', 'PM']; // Always active
  
  if (size !== 'XS') {
    roles.push('Developer');
  }
  
  if (['M', 'L', 'XL'].includes(size)) {
    roles.push('Architect', 'Tester');
  }
  
  // Conditional activation based on project type
  if (projectType.includes('web') || projectType.includes('ui')) {
    roles.push('UXDesigner');
  }
  
  if (projectType.includes('cloud') || projectType.includes('deployment')) {
    roles.push('DevOpsEngineer');
  }
  
  if (projectType.includes('security') || projectType.includes('financial')) {
    roles.push('SecurityEngineer');
  }
  
  return roles;
}

// Generate ARIA control block
function generateControlBlock(options) {
  const size = options.size || determineTShirtSize(options.description || '');
  const workflowPath = ['XS', 'S'].includes(size) ? 'shallow' : 'deep';
  const activeRoles = getActiveRoles(size, options.type);
  
  return {
    role: 'ScrumMaster',
    state: 'S0',
    request_type: options.requestType || 'new',
    tshirt_size: size,
    workflow_path: workflowPath,
    story_id: `ARIA-${Date.now()}`,
    current_step: 'analyzing requirements and sizing',
    next_role: activeRoles.find(r => r !== 'ScrumMaster') || null,
    active_roles: activeRoles,
    blockers: [],
    quality_gates_passed: false,
    todo_ledger_version: 1,
    pm_docs_required: getPMDocsRequired(size)
  };
}

function getPMDocsRequired(size) {
  switch (size) {
    case 'XS': return ['none'];
    case 'S': return ['user_guide'];
    case 'M': return ['user_guide', 'demo'];
    case 'L':
    case 'XL': return ['user_guide', 'exec_summary', 'demo', 'article'];
    default: return ['user_guide'];
  }
}

// Commands
program
  .name('aria')
  .description('ARIA v4 CLI Tool for workflow management')
  .version('4.0.0');

program
  .command('size')
  .description('Determine T-shirt size for a request')
  .argument('<description>', 'Description of the request')
  .option('-t, --type <type>', 'Project type', 'web-application')
  .action((description, options) => {
    const size = determineTShirtSize(description);
    const workflowPath = ['XS', 'S'].includes(size) ? 'shallow' : 'deep';
    const activeRoles = getActiveRoles(size, options.type);
    const estimatedHours = {
      'XS': 0.5,
      'S': 2,
      'M': 8, 
      'L': 24,
      'XL': 72
    }[size];
    
    console.log(`\\n🎯 ARIA v4 Sizing Analysis`);
    console.log(`Description: ${description}`);
    console.log(`T-Shirt Size: ${size}`);
    console.log(`Workflow Path: ${workflowPath}`);
    console.log(`Estimated Hours: ${estimatedHours}`);
    console.log(`Active Roles: ${activeRoles.join(', ')}`);
  });

program
  .command('workflow')
  .description('Generate workflow plan for a request')
  .argument('<description>', 'Description of the request')
  .option('-s, --size <size>', 'T-shirt size (XS, S, M, L, XL)')
  .option('-t, --type <type>', 'Project type', 'web-application')
  .option('-r, --request-type <type>', 'Request type', 'new')
  .action((description, options) => {
    const controlBlock = generateControlBlock({ 
      description, 
      size: options.size,
      type: options.type,
      requestType: options.requestType
    });
    
    console.log(`\\n🚀 ARIA v4 Workflow Plan`);
    console.log(`\\n\`\`\`json`);
    console.log(JSON.stringify(controlBlock, null, 2));
    console.log(`\`\`\``);
    
    console.log(`\\n📋 Workflow Steps:`);
    const { tshirt_size, active_roles } = controlBlock;
    
    if (tshirt_size === 'XS') {
      console.log('1. Scrum Master → Direct Answer → PM (optional micro-docs)');
    } else if (tshirt_size === 'S') {
      console.log('1. Scrum Master → Developer (mini-TDD) → PM (basic docs)');
    } else {
      console.log('1. Scrum Master → Intake & Sizing');
      if (active_roles.includes('Architect')) console.log('2. Architect → System Design');
      if (active_roles.includes('UXDesigner')) console.log('3. UX Designer → User Experience');
      if (active_roles.includes('SecurityEngineer')) console.log('4. Security Engineer → Security Assessment');
      if (active_roles.includes('Developer')) console.log('5. Developer → Implementation');
      if (active_roles.includes('DevOpsEngineer')) console.log('6. DevOps Engineer → Infrastructure');
      if (active_roles.includes('Tester')) console.log('7. Tester → Quality Assurance');
      if (active_roles.includes('PM')) console.log('8. PM → Documentation & Evangelization');
    }
  });

program
  .command('validate')
  .description('Validate ARIA prompt syntax and structure')
  .action(async () => {
    console.log('🔍 Validating ARIA v4 prompt...');
    
    const prompt = await loadARIAPrompt();
    if (!prompt) {
      process.exit(1);
    }
    
    // Basic validation checks
    const checks = [
      { name: 'Contains role definitions', test: () => prompt.includes('## MULTI-ROLE ARCHITECTURE') },
      { name: 'Has T-shirt sizing', test: () => prompt.includes('## T-SHIRT SIZING') },
      { name: 'Includes workflow definitions', test: () => prompt.includes('## ADAPTIVE WORKFLOW DEFINITIONS') },
      { name: 'Has control block format', test: () => prompt.includes('JSON control block') },
      { name: 'Contains FSM definition', test: () => prompt.includes('Finite State Machine') }
    ];
    
    let passed = 0;
    checks.forEach(check => {
      const result = check.test();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
      if (result) passed++;
    });
    
    console.log(`\\n📊 Validation Result: ${passed}/${checks.length} checks passed`);
    
    if (passed === checks.length) {
      console.log('🎉 ARIA v4 prompt is valid!');
    } else {
      console.log('⚠️ ARIA v4 prompt has validation issues');
      process.exit(1);
    }
  });

program
  .command('demo')
  .description('Run ARIA workflow demo')
  .option('-e, --example <example>', 'Example scenario', 'solplay-pdf-processing')
  .action((options) => {
    const examples = {
      'solplay-pdf-processing': {
        description: 'Build system to extract Hero AI use cases from Financial Services solution play PDFs and generate demoable solutions',
        type: 'ai-platform',
        requestType: 'new'
      },
      'simple-form': {
        description: 'Add a contact form to the website',
        type: 'web-application', 
        requestType: 'enhancement'
      },
      'user-auth': {
        description: 'Implement user authentication with OAuth',
        type: 'web-application',
        requestType: 'new'
      }
    };
    
    const example = examples[options.example];
    if (!example) {
      console.log(`❌ Unknown example: ${options.example}`);
      console.log(`Available examples: ${Object.keys(examples).join(', ')}`);
      return;
    }
    
    console.log(`🎬 ARIA v4 Demo: ${options.example}`);
    const controlBlock = generateControlBlock(example);
    
    console.log(`\\n📝 Scenario: ${example.description}`);
    console.log(`\\n\`\`\`json`);
    console.log(JSON.stringify(controlBlock, null, 2));
    console.log(`\`\`\``);
    
    console.log(`\\n🎯 Next Steps:`);
    console.log(`1. Copy the JSON control block above`);
    console.log(`2. Use it to start your ARIA v4 workflow`);
    console.log(`3. Follow the role sequence: ${controlBlock.active_roles.join(' → ')}`);
  });

program.parse();

module.exports = {
  determineTShirtSize,
  getActiveRoles,
  generateControlBlock
};