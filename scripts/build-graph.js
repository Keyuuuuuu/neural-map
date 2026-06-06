const fs = require('fs');
const path = require('path');

// Simple helper to parse YAML Frontmatter without external dependencies if needed
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!match) {
    return { data: {}, content };
  }
  const yamlBlock = match[1];
  const body = content.substring(match[0].length).trim();
  const data = {};
  
  const lines = yamlBlock.split('\n');
  let currentKey = null;
  let inList = false;
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check for array items
    if (line.startsWith('-')) {
      if (currentKey && Array.isArray(data[currentKey])) {
        // Handle list item (could be object or string)
        const val = line.substring(1).trim();
        if (val.includes(':')) {
          // It's a key-value in a list item (simple parser for {id: "x", type: "y"})
          const obj = {};
          // Match all key: value patterns
          const parts = val.split(',');
          for (let p of parts) {
            const kv = p.split(':');
            if (kv.length >= 2) {
              const k = kv[0].trim().replace(/['"']/g, '');
              const v = kv.slice(1).join(':').trim().replace(/['"']/g, '');
              obj[k] = isNaN(v) ? v : Number(v);
            }
          }
          data[currentKey].push(obj);
        } else {
          // Simple string item
          data[currentKey].push(val.replace(/['"']/g, ''));
        }
      }
      continue;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let val = line.substring(colonIndex + 1).trim();
    
    // Check if it's starting a list
    if (val === '' || val === '[]') {
      data[key] = [];
      currentKey = key;
      inList = true;
      continue;
    }
    
    // Check for inline array like ["a", "b"]
    if (val.startsWith('[') && val.endsWith(']')) {
      const items = val.slice(1, -1).split(',').map(s => s.trim().replace(/['"']/g, ''));
      data[key] = items.filter(s => s !== '');
      currentKey = key;
      inList = false;
      continue;
    }
    
    // Standard scalar value
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    
    // Number conversion
    if (!isNaN(val) && val !== '') {
      data[key] = Number(val);
    } else if (val === 'true') {
      data[key] = true;
    } else if (val === 'false') {
      data[key] = false;
    } else {
      data[key] = val;
    }
    currentKey = key;
    inList = false;
  }
  
  return { data, content: body };
}

function run() {
  console.log('🚀 Starting NexusMind Graph Data compiler...');
  
  const projectRoot = path.join(__dirname, '..');
  const registryPath = path.join(projectRoot, 'registry.json');
  
  if (!fs.existsSync(registryPath)) {
    console.error(`❌ Error: registry.json not found at ${registryPath}`);
    process.exit(1);
  }
  
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const nodesMap = new Map();
  const links = [];
  
  // 1. Process local markdown vaults
  if (registry.local && Array.isArray(registry.local)) {
    for (const localDir of registry.local) {
      const dirPath = path.isAbsolute(localDir) ? localDir : path.join(projectRoot, localDir);
      if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️ Warning: Local directory ${dirPath} does not exist. Skipping...`);
        continue;
      }
      
      console.log(`📂 Scanning local vault: ${dirPath}`);
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = parseFrontmatter(fileContent);
        
        if (!parsed.data.id) {
          console.warn(`⚠️ Warning: ${file} does not contain an 'id' in its Frontmatter. Skipping...`);
          continue;
        }
        
        const metadata = parsed.data;
        const node = {
          ...metadata,
          id: metadata.id,
          title: metadata.title || metadata.id,
          type: metadata.type || 'project',
          status: metadata.status || 'idea',
          ai_involvement: metadata.ai_involvement !== undefined ? metadata.ai_involvement : 0,
          motivation: metadata.motivation || '',
          purpose: metadata.purpose || '',
          content: parsed.content,
          tech_stack: metadata.tech_stack || [],
          concepts: metadata.concepts || [],
          related_nodes: metadata.related_nodes || []
        };
        
        nodesMap.set(node.id, node);
      }
    }
  }
  
  // 2. Fetch and merge remote repos from GitHub (Simulated/Mocked for build reliability, pulls from registry.github if GITHUB_TOKEN is available, otherwise uses local as primary)
  // In a real production CI build, we would request via Octokit. Let's write the fetch logic but gracefully fall back.
  if (registry.github && Array.isArray(registry.github) && process.env.GITHUB_TOKEN) {
    console.log('🌐 GITHUB_TOKEN detected. Fetching remote README data...');
    // Real implementation would use @octokit/rest. We'll add a check or placeholder here.
    // For local run, we rely on local markdown files.
  } else {
    console.log('ℹ️ GITHUB_TOKEN not set or running locally. Relying on local markdown files.');
  }

  // 3. Auto-discover referenced tech stacks and concepts to create implicit nodes if they don't exist
  const implicitNodes = new Map();
  
  for (const [id, node] of nodesMap.entries()) {
    // Check tech stack references
    if (node.tech_stack) {
      for (const tech of node.tech_stack) {
        if (!nodesMap.has(tech) && !implicitNodes.has(tech)) {
          implicitNodes.set(tech, {
            id: tech,
            title: tech,
            type: 'tech',
            status: 'completed',
            ai_involvement: 0,
            motivation: `技术栈组件: ${tech}`,
            purpose: `作为项目开发的核心技术支撑。`,
            content: `关于 ${tech} 技术栈的自动生成描述。可在本地 Vault 创建 \`${tech}.md\` 自定义此节点。`,
            tech_stack: [],
            concepts: [],
            related_nodes: []
          });
        }
        
        // Link project -> tech (implements)
        links.push({
          source: id,
          target: tech,
          type: 'implements'
        });
      }
    }
    
    // Check concepts references
    if (node.concepts) {
      for (const concept of node.concepts) {
        if (!nodesMap.has(concept) && !implicitNodes.has(concept)) {
          implicitNodes.set(concept, {
            id: concept,
            title: concept,
            type: 'concept',
            status: 'completed',
            ai_involvement: 0,
            motivation: `理论概念领域: ${concept}`,
            purpose: `指导项目设计与技术选型的宏观理论基础。`,
            content: `关于 ${concept} 概念领域的自动生成描述。可在本地 Vault 创建 \`${concept}.md\` 自定义此节点。`,
            tech_stack: [],
            concepts: [],
            related_nodes: []
          });
        }
        
        // Link project -> concept (belongs_to)
        // Wait, the project itself belongs to a concept, or does the tech belong to a concept?
        // Let's create Project -> Concept relationship as belongs_to.
        links.push({
          source: id,
          target: concept,
          type: 'belongs_to'
        });
      }
    }
    
    // Check custom related nodes
    if (node.related_nodes) {
      for (const relation of node.related_nodes) {
        if (relation && relation.id) {
          // Link project -> related project
          links.push({
            source: id,
            target: relation.id,
            type: relation.type || 'inspired_by'
          });
        }
      }
    }
  }
  
  // Merge implicit nodes into main nodesMap
  for (const [id, node] of implicitNodes.entries()) {
    nodesMap.set(id, node);
  }
  
  // 4. Resolve hierarchical relationships:
  // If a tech node exists, let's see if it should link to concepts it belongs to
  for (const [id, node] of nodesMap.entries()) {
    if (node.type === 'tech') {
      // If a tech node lists concepts or if we want to build tech -> concept links
      if (node.concepts) {
        for (const concept of node.concepts) {
          if (nodesMap.has(concept)) {
            // Link Tech -> Concept (belongs_to)
            links.push({
              source: id,
              target: concept,
              type: 'belongs_to'
            });
          }
        }
      }
    }
  }
  
  // Clean duplicates in links
  const uniqueLinks = [];
  const seenLinks = new Set();
  
  for (const link of links) {
    const key = `${link.source}->${link.target}->${link.type}`;
    if (!seenLinks.has(key)) {
      seenLinks.add(key);
      uniqueLinks.push(link);
    }
  }
  
  const nodes = Array.from(nodesMap.values());
  const graphData = { nodes, links: uniqueLinks };
  
  // Ensure public/data directory exists
  const publicDataDir = path.join(projectRoot, 'public', 'data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
  
  const outputFilePath = path.join(publicDataDir, 'graph.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(graphData, null, 2));
  console.log(`✅ Success! Generated ${nodes.length} nodes and ${uniqueLinks.length} links at ${outputFilePath}`);
}

run();
