const fs = require('fs');
const path = require('path');

// Line-ending agnostic frontmatter parser that supports multi-line lists of objects
function parseFrontmatter(content) {
  const match = content.match(/^---[\r\n]+([\s\S]+?)[\r\n]+---/);
  if (!match) {
    return { data: {}, content };
  }
  const yamlBlock = match[1];
  const body = content.substring(match[0].length).trim();
  const data = {};
  
  const lines = yamlBlock.split(/\r?\n/);
  let currentKey = null;
  let currentListItem = null;
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for array items
    if (trimmed.startsWith('-')) {
      if (currentKey && Array.isArray(data[currentKey])) {
        const val = trimmed.substring(1).trim();
        if (val.includes(':')) {
          // Object in a list: e.g. "- id: graphrag"
          const colonIndex = val.indexOf(':');
          const k = val.substring(0, colonIndex).trim().replace(/['"']/g, '');
          let v = val.substring(colonIndex + 1).trim().replace(/['"']/g, '');
          if (!isNaN(v) && v !== '') v = Number(v);
          
          currentListItem = { [k]: v };
          data[currentKey].push(currentListItem);
        } else {
          // String in a list: e.g. "- PyTorch"
          data[currentKey].push(val.replace(/['"']/g, ''));
          currentListItem = null;
        }
      }
      continue;
    }
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmed.substring(0, colonIndex).trim();
    let val = trimmed.substring(colonIndex + 1).trim();
    
    // Check if it's a field of the current list item object
    if (currentListItem && line.startsWith(' ') && !line.trim().startsWith('-')) {
      const k = key.replace(/['"']/g, '');
      let v = val.replace(/['"']/g, '');
      if (!isNaN(v) && v !== '') v = Number(v);
      currentListItem[k] = v;
      continue;
    }
    
    // Otherwise it's a top-level key
    currentListItem = null;
    
    // Check if it's starting a list
    if (val === '' || val === '[]') {
      data[key] = [];
      currentKey = key;
      continue;
    }
    
    // Check for inline array like ["a", "b"]
    if (val.startsWith('[') && val.endsWith(']')) {
      const items = val.slice(1, -1).split(',').map(s => s.trim().replace(/['"']/g, ''));
      data[key] = items.filter(s => s !== '');
      currentKey = key;
      continue;
    }
    
    // Standard scalar value
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    
    // Type conversion
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
  }
  
  return { data, content: body };
}

// Helper to fetch JSON from GitHub API
async function getJson(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`⚠️ GitHub API GET failed for ${url} (status: ${res.status})`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`❌ Failed to fetch JSON from ${url}:`, e.message);
    return null;
  }
}

// Helper to fetch text from GitHub RAW URL
async function getText(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.error(`❌ Failed to fetch text from ${url}:`, e.message);
    return null;
  }
}

// AI Summarization using Gemini API
function truncateToSentence(text, limit) {
  if (!text) return '';
  if (text.length <= limit) return text;
  
  const sub = text.substring(0, limit);
  const lastPeriod = Math.max(
    sub.lastIndexOf('.'),
    sub.lastIndexOf('。'),
    sub.lastIndexOf('?'),
    sub.lastIndexOf('？'),
    sub.lastIndexOf('!'),
    sub.lastIndexOf('！'),
    sub.lastIndexOf(';')
  );
  
  if (lastPeriod > limit * 0.4) {
    return sub.substring(0, lastPeriod + 1);
  }
  return sub.trim() + '...';
}

function detectTechStackFromReadme(readmeText) {
  const stack = new Set();
  if (!readmeText) return [];
  const text = readmeText.toLowerCase();
  
  if (text.includes("react")) stack.add("React");
  if (text.includes("next.js") || text.includes("nextjs")) stack.add("Next.js");
  if (text.includes("vue")) stack.add("Vue");
  if (text.includes("tailwind")) stack.add("Tailwind CSS");
  if (text.includes("three.js") || text.includes("threejs")) stack.add("Three.js");
  if (text.includes("d3.js") || text.includes("d3js")) stack.add("D3.js");
  if (text.includes("tensorflow.js") || text.includes("tfjs")) stack.add("TensorFlow.js");
  if (text.includes("tensorflow") || text.includes("keras")) stack.add("TensorFlow");
  if (text.includes("pytorch") || text.includes("torch")) stack.add("PyTorch");
  if (text.includes("python")) stack.add("Python");
  if (text.includes("javascript") || text.includes(" js ")) stack.add("JavaScript");
  if (text.includes("typescript") || text.includes(" ts ")) stack.add("TypeScript");
  if (text.includes("rust")) stack.add("Rust");
  if (text.includes("golang") || text.includes(" go ")) stack.add("Go");
  if (text.includes("neo4j")) stack.add("Neo4j");
  if (text.includes("networkx")) stack.add("NetworkX");
  if (text.includes("spacy") || text.includes("nltk") || text.includes("transformers") || text.includes("nlp")) stack.add("NLP");
  if (text.includes("html")) stack.add("HTML");
  if (text.includes("css")) stack.add("CSS");
  
  return Array.from(stack);
}

function findCaseInsensitiveKey(map, key) {
  const lowerKey = key.toLowerCase();
  for (const k of map.keys()) {
    if (k.toLowerCase() === lowerKey) {
      return k;
    }
  }
  return null;
}

async function extractMetadataWithAI(readmeText, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are a knowledge graph builder. Analyze the following project README.md text and extract the 'motivation' (why the project was created / what problem it solves), 'purpose' (what it accomplishes / its core goals) in both Chinese and English. Also extract the project's title in Chinese and English, and any referenced 'tech_stack' (technologies like React, Tailwind CSS, Python, PyTorch, Neo4j, JavaScript, TypeScript, Three.js, etc.) and 'concepts'.
Return ONLY a valid JSON object matching this schema:
{
  "title_zh": "...",
  "title_en": "...",
  "motivation_zh": "...",
  "motivation_en": "...",
  "purpose_zh": "...",
  "purpose_en": "...",
  "tech_stack": ["..."],
  "concepts": ["..."]
}
Do not wrap the response in markdown code blocks or add any other text besides the JSON.

Here is the README:
${readmeText}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn('⚠️ Gemini API request failed with status:', response.status);
      return null;
    }

    const data = await response.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) return null;

    return JSON.parse(textResult.trim());
  } catch (e) {
    console.error('❌ Failed to call Gemini API:', e.message);
    return null;
  }
}

// Regex fallback metadata extraction
function extractMetadataRegex(readmeText, id) {
  const result = {
    title_zh: id,
    title_en: id,
    motivation_zh: '',
    motivation_en: '',
    purpose_zh: '',
    purpose_en: '',
    concepts: []
  };

  const titleMatch = readmeText.match(/^#\s+(.*)/m);
  if (titleMatch) {
    result.title_zh = titleMatch[1].trim();
    result.title_en = titleMatch[1].trim();
  }

  const cleanText = readmeText.replace(/^#\s+.*\n+/m, '');

  function getSectionContent(regex) {
    const lines = cleanText.split('\n');
    let found = false;
    let contentLines = [];
    for (let line of lines) {
      if (line.trim().startsWith('#')) {
        if (found) break;
        if (regex.test(line)) {
          found = true;
          continue;
        }
      }
      if (found) {
        contentLines.push(line);
      }
    }
    return contentLines.join('\n').trim();
  }

  const motivationSection = getSectionContent(/(?:motivation|设计动机|动机|背景|background)/i);
  const purposeSection = getSectionContent(/(?:purpose|goals|核心目的|目的|features|核心功能|功能|what is)/i);

  function cleanMarkdown(text) {
    return text
      .replace(/[#*`_-]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (motivationSection) {
    const cleaned = cleanMarkdown(motivationSection);
    result.motivation_zh = truncateToSentence(cleaned, 300);
    result.motivation_en = truncateToSentence(cleaned, 300);
  }
  if (purposeSection) {
    const cleaned = cleanMarkdown(purposeSection);
    result.purpose_zh = truncateToSentence(cleaned, 300);
    result.purpose_en = truncateToSentence(cleaned, 300);
  }

  if (!result.motivation_zh && !result.purpose_zh) {
    const paragraphs = cleanText.split(/\n\s*\n/).map(p => cleanMarkdown(p)).filter(p => p.length > 20);
    if (paragraphs[0]) {
      const cleaned = paragraphs[0];
      result.motivation_zh = truncateToSentence(cleaned, 200);
      result.motivation_en = truncateToSentence(cleaned, 200);
    }
    if (paragraphs[1]) {
      const cleaned = paragraphs[1];
      result.purpose_zh = truncateToSentence(cleaned, 200);
      result.purpose_en = truncateToSentence(cleaned, 200);
    }
  }

  return result;
}

// Auto-detect tech stack from manifest files
function detectTechStack(packageJsonText, requirementsTxtText, cargoTomlText, goModText) {
  const stack = new Set();

  if (packageJsonText) {
    try {
      const pkg = JSON.parse(packageJsonText);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const keys = Object.keys(deps).map(k => k.toLowerCase());
      
      stack.add("JavaScript");
      if (keys.some(k => k.includes("typescript"))) stack.add("TypeScript");
      if (keys.some(k => k.includes("react"))) stack.add("React");
      if (keys.some(k => k.includes("next"))) stack.add("Next.js");
      if (keys.some(k => k.includes("tailwindcss"))) stack.add("Tailwind CSS");
      if (keys.some(k => k.includes("three"))) stack.add("Three.js");
      if (keys.some(k => k.includes("d3"))) stack.add("D3.js");
      if (keys.some(k => k.includes("express"))) stack.add("Express");
      if (keys.some(k => k.includes("vue"))) stack.add("Vue");
    } catch (e) {}
  }

  if (requirementsTxtText) {
    stack.add("Python");
    const reqs = requirementsTxtText.toLowerCase();
    if (reqs.includes("torch") || reqs.includes("pytorch")) stack.add("PyTorch");
    if (reqs.includes("tensorflow")) stack.add("TensorFlow");
    if (reqs.includes("pandas")) stack.add("Pandas");
    if (reqs.includes("numpy")) stack.add("NumPy");
    if (reqs.includes("networkx")) stack.add("NetworkX");
    if (reqs.includes("neo4j")) stack.add("Neo4j");
    if (reqs.includes("transformers") || reqs.includes("spacy") || reqs.includes("nltk")) stack.add("NLP");
    if (reqs.includes("fastapi")) stack.add("FastAPI");
    if (reqs.includes("flask")) stack.add("Flask");
    if (reqs.includes("django")) stack.add("Django");
  }

  if (cargoTomlText) {
    stack.add("Rust");
    const cargo = cargoTomlText.toLowerCase();
    if (cargo.includes("tokio")) stack.add("Tokio");
    if (cargo.includes("actix")) stack.add("Actix-web");
    if (cargo.includes("axum")) stack.add("Axum");
  }

  if (goModText) {
    stack.add("Go");
    const go = goModText.toLowerCase();
    if (go.includes("gin")) stack.add("Gin");
    if (go.includes("fiber")) stack.add("Fiber");
  }

  return Array.from(stack);
}

async function run() {
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
  
  // 2. Fetch and merge remote repos from GitHub using user & topic discovery
  const githubUser = registry.github_username || 'creative-developer';
  const targetTopic = 'neural-map-node';
  const headers = {
    'User-Agent': 'Neural-Map-Builder',
    'Accept': 'application/vnd.github+json'
  };
  
  let reposUrl = `https://api.github.com/users/${githubUser}/repos?per_page=100`;

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    console.log('🌐 GITHUB_TOKEN detected. Performing authenticated requests.');

    // If authenticated user matches the targeted user, scan both public and private repos
    const userProfile = await getJson('https://api.github.com/user', headers);
    if (userProfile && userProfile.login.toLowerCase() === githubUser.toLowerCase()) {
      reposUrl = 'https://api.github.com/user/repos?per_page=100';
      console.log('🔒 Target user matches authenticated user. Scanning public and private repositories.');
    }
  } else {
    console.log('ℹ️ GITHUB_TOKEN not set. Performing unauthenticated requests (lower rate limit).');
  }

  console.log(`🌐 Scanning GitHub repositories for user: "${githubUser}" with topic: "${targetTopic}"`);
  const repos = await getJson(reposUrl, headers);
  
  if (repos && Array.isArray(repos)) {
    // Filter repositories that have targetTopic in their topics list
    const nodeRepos = repos.filter(repo => repo.topics && repo.topics.includes(targetTopic));
    console.log(`🔍 Found ${nodeRepos.length} repositories matching topic "${targetTopic}"`);
    
    for (const repo of nodeRepos) {
      console.log(`🚀 Processing GitHub repository: "${repo.name}"`);
      const defaultBranch = repo.default_branch || 'main';
      const owner = repo.owner.login;
      
      // Fetch README content via GitHub Content API (handles casing gracefully)
      const readmeUrl = `https://api.github.com/repos/${owner}/${repo.name}/readme`;
      const readmeData = await getJson(readmeUrl, headers);
      let readmeText = '';
      
      if (readmeData && readmeData.content) {
        readmeText = Buffer.from(readmeData.content, 'base64').toString('utf8');
      }
      
      // Fetch package manifests to detect tech stack
      const rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo.name}/${defaultBranch}`;
      let packageJsonText = await getText(`${rawBaseUrl}/package.json`, headers);
      let requirementsTxtText = await getText(`${rawBaseUrl}/requirements.txt`, headers);
      let cargoTomlText = await getText(`${rawBaseUrl}/Cargo.toml`, headers);
      let goModText = await getText(`${rawBaseUrl}/go.mod`, headers);
      
      let autoTechStack = detectTechStack(packageJsonText, requirementsTxtText, cargoTomlText, goModText);
      
      // Check common subdirectories
      const subdirs = ['web', 'frontend', 'backend', 'src', 'server', 'client'];
      for (const subdir of subdirs) {
        const pj = await getText(`${rawBaseUrl}/${subdir}/package.json`, headers);
        const req = await getText(`${rawBaseUrl}/${subdir}/requirements.txt`, headers);
        const cargo = await getText(`${rawBaseUrl}/${subdir}/Cargo.toml`, headers);
        const go = await getText(`${rawBaseUrl}/${subdir}/go.mod`, headers);
        if (pj || req || cargo || go) {
          const subTech = detectTechStack(pj, req, cargo, go);
          autoTechStack = Array.from(new Set([...autoTechStack, ...subTech]));
        }
      }
      
      // Auto detect from README keywords as a backup/supplement
      const readmeTechStack = detectTechStackFromReadme(readmeText);
      autoTechStack = Array.from(new Set([...autoTechStack, ...readmeTechStack]));
      
      // Parse README metadata
      let parsed = { data: {}, content: readmeText };
      if (readmeText) {
        parsed = parseFrontmatter(readmeText);
      }
      
      const metadata = parsed.data;
      let titleVal = metadata.title || repo.name;
      let motivationVal = metadata.motivation || '';
      let purposeVal = metadata.purpose || '';
      let titleZh = metadata.title_zh || '';
      let titleEn = metadata.title_en || '';
      let motivationZh = metadata.motivation_zh || '';
      let motivationEn = metadata.motivation_en || '';
      let purposeZh = metadata.purpose_zh || '';
      let purposeEn = metadata.purpose_en || '';
      let conceptsVal = metadata.concepts || [];
      let techStackVal = metadata.tech_stack || [];
      
      // If Motivation/Purpose is missing and Gemini API Key is available, call AI
      if ((!motivationVal && !motivationZh) && process.env.GEMINI_API_KEY && readmeText) {
        console.log(`🤖 Invoking Gemini API for "${repo.name}" text summarization...`);
        const aiMetadata = await extractMetadataWithAI(readmeText, process.env.GEMINI_API_KEY);
        if (aiMetadata) {
          titleZh = aiMetadata.title_zh || titleZh;
          titleEn = aiMetadata.title_en || titleEn;
          motivationZh = aiMetadata.motivation_zh || motivationZh;
          motivationEn = aiMetadata.motivation_en || motivationEn;
          purposeZh = aiMetadata.purpose_zh || purposeZh;
          purposeEn = aiMetadata.purpose_en || purposeEn;
          conceptsVal = Array.from(new Set([...conceptsVal, ...(aiMetadata.concepts || [])]));
          techStackVal = Array.from(new Set([...techStackVal, ...(aiMetadata.tech_stack || [])]));
        }
      }
      
      // Fallback to regex if still missing
      if (!motivationZh && !purposeZh && readmeText) {
        console.log(`🔍 Using regex parsing fallback for "${repo.name}"...`);
        const regMetadata = extractMetadataRegex(readmeText, repo.name);
        titleZh = titleZh || regMetadata.title_zh;
        titleEn = titleEn || regMetadata.title_en;
        motivationZh = motivationZh || regMetadata.motivation_zh;
        motivationEn = motivationEn || regMetadata.motivation_en;
        purposeZh = purposeZh || regMetadata.purpose_zh;
        purposeEn = purposeEn || regMetadata.purpose_en;
      }
      
      const node = {
        ...metadata,
        id: repo.name,
        title: titleVal,
        title_zh: titleZh || titleVal,
        title_en: titleEn || titleVal,
        type: metadata.type || 'project',
        status: metadata.status || 'in-progress',
        ai_involvement: metadata.ai_involvement !== undefined ? metadata.ai_involvement : 50,
        motivation: motivationVal,
        motivation_zh: motivationZh || motivationVal,
        motivation_en: motivationEn || motivationVal,
        purpose: purposeVal,
        purpose_zh: purposeZh || purposeVal,
        purpose_en: purposeEn || purposeVal,
        content: parsed.content || `### Description\nThis project is synced from GitHub: [${repo.name}](${repo.html_url})`,
        tech_stack: Array.from(new Set([...techStackVal, ...autoTechStack])),
        concepts: conceptsVal,
        related_nodes: metadata.related_nodes || []
      };
      
      // Merge with local nodes if duplicates occur (local takes precedence)
      let matchedRepoKey = findCaseInsensitiveKey(nodesMap, repo.name);
      if (matchedRepoKey) {
        console.log(`ℹ️ Node "${repo.name}" already exists locally (matched as "${matchedRepoKey}"). Merging and using local override precedence.`);
        const localNode = nodesMap.get(matchedRepoKey);
        nodesMap.set(matchedRepoKey, {
          ...node,
          ...localNode,
          id: matchedRepoKey, // Preserve local key casing
          tech_stack: Array.from(new Set([...node.tech_stack, ...(localNode.tech_stack || [])])),
          concepts: Array.from(new Set([...node.concepts, ...(localNode.concepts || [])]))
        });
      } else {
        nodesMap.set(repo.name, node);
      }
    }
  }

  // 3. Auto-discover referenced tech stacks and concepts to create implicit nodes if they don't exist
  const implicitNodes = new Map();
  
  for (const [id, node] of nodesMap.entries()) {
    // Check tech stack references
    if (node.tech_stack) {
      const resolvedTechStack = [];
      for (const tech of node.tech_stack) {
        let matchedKey = findCaseInsensitiveKey(nodesMap, tech) || findCaseInsensitiveKey(implicitNodes, tech);
        const targetId = matchedKey || tech;
        
        if (!matchedKey) {
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
        
        resolvedTechStack.push(targetId);
        // Link project -> tech (implements)
        links.push({
          source: id,
          target: targetId,
          type: 'implements'
        });
      }
      node.tech_stack = Array.from(new Set(resolvedTechStack));
    }
    
    // Check concepts references
    if (node.concepts) {
      const resolvedConcepts = [];
      for (const concept of node.concepts) {
        let matchedKey = findCaseInsensitiveKey(nodesMap, concept) || findCaseInsensitiveKey(implicitNodes, concept);
        const targetId = matchedKey || concept;
        
        if (!matchedKey) {
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
        
        resolvedConcepts.push(targetId);
        // Link project -> concept (belongs_to)
        links.push({
          source: id,
          target: targetId,
          type: 'belongs_to'
        });
      }
      node.concepts = Array.from(new Set(resolvedConcepts));
    }
    
    // Check custom related nodes
    if (node.related_nodes) {
      for (const relation of node.related_nodes) {
        if (relation && relation.id) {
          let matchedKey = findCaseInsensitiveKey(nodesMap, relation.id) || findCaseInsensitiveKey(implicitNodes, relation.id);
          const targetId = matchedKey || relation.id;
          // Link project -> related project
          links.push({
            source: id,
            target: targetId,
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
  
  // 4. Resolve hierarchical relationships: Tech -> Concept
  for (const [id, node] of nodesMap.entries()) {
    if (node.type === 'tech') {
      if (node.concepts) {
        for (const concept of node.concepts) {
          let matchedKey = findCaseInsensitiveKey(nodesMap, concept);
          if (matchedKey) {
            links.push({
              source: id,
              target: matchedKey,
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
