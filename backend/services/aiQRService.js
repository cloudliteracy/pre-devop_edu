const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const AIKnowledgeDocument = require('../models/AIKnowledgeDocument');
const AIKnowledgeBaseState = require('../models/AIKnowledgeBaseState');

/**
 * AI QR Service - Platform Knowledge Assistant
 * Uses OpenAI GPT-4 for answering platform-specific questions
 */
class AIQRService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.maxTokens = 2000;
    this.temperature = 0.7;
    
    // Knowledge base cache
    this.knowledgeBaseCache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Recursively scan directory and read all relevant files
   * @param {string} dirPath Directory to scan
   * @param {Array} fileList Accumulated file list
   * @returns {Promise<Array>} List of file paths
   */
  async scanDirectory(dirPath, fileList = []) {
    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);

        // Skip certain directories
        const skipDirs = [
          'node_modules',
          '.git',
          'dist',
          'build',
          'uploads',
          '.next',
          'coverage',
          '.vscode',
          '.idea'
        ];

        if (stat.isDirectory()) {
          const dirName = path.basename(filePath);
          if (!skipDirs.includes(dirName)) {
            await this.scanDirectory(filePath, fileList);
          }
        } else if (stat.isFile()) {
          // Include relevant file types
          const ext = path.extname(file).toLowerCase();
          const relevantExtensions = [
            '.js', '.jsx', '.ts', '.tsx',
            '.json', '.md', '.txt',
            '.env.example', '.gitignore',
            '.yml', '.yaml'
          ];

          if (relevantExtensions.includes(ext) || file === '.env.example') {
            fileList.push(filePath);
          }
        }
      }

      return fileList;
    } catch (error) {
      this.log('Error scanning directory', 'ERROR', { error: error.message });
      return fileList;
    }
  }

  /**
   * Read file content with error handling
   * @param {string} filePath Path to file
   * @returns {Promise<string>} File content
   */
  async readFileContent(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      this.log('Error reading file', 'WARN', { filePath, error: error.message });
      return '';
    }
  }

  /**
   * Index entire project directory structure
   * @returns {Promise<Object>} Indexing result
   */
  async indexProjectDirectory() {
    const startTime = Date.now();

    try {
      this.log('Starting project directory indexing', 'INFO');

      // Get project root (2 levels up from services directory)
      const projectRoot = path.resolve(__dirname, '..', '..');
      
      // Scan all files
      const allFiles = await this.scanDirectory(projectRoot);

      this.log('Files discovered', 'INFO', { count: allFiles.length });

      // Read and organize file contents
      const fileContents = [];
      let totalSize = 0;

      for (const filePath of allFiles) {
        const content = await this.readFileContent(filePath);
        if (content) {
          const relativePath = path.relative(projectRoot, filePath);
          const fileSize = Buffer.byteLength(content, 'utf-8');
          totalSize += fileSize;

          fileContents.push({
            path: relativePath,
            content: content,
            size: fileSize
          });
        }
      }

      const duration = Date.now() - startTime;

      this.log('Project directory indexed successfully', 'SUCCESS', {
        filesIndexed: fileContents.length,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        duration: `${duration}ms`
      });

      return {
        success: true,
        files: fileContents,
        totalFiles: fileContents.length,
        totalSize,
        duration
      };

    } catch (error) {
      this.log('Project directory indexing failed', 'ERROR', {
        error: error.message,
        duration: `${Date.now() - startTime}ms`
      });

      throw error;
    }
  }

  /**
   * Extract text from PDF file
   * @param {string} filePath Path to PDF file
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);

      return {
        text: data.text,
        pageCount: data.numpages,
        metadata: data.info || {}
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Index a document for the knowledge base
   * @param {string} documentId Document ID to index
   * @returns {Promise<Object>} Indexing result
   */
  async indexDocument(documentId) {
    try {
      const document = await AIKnowledgeDocument.findById(documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }

      // Extract text from PDF
      const extracted = await this.extractTextFromPDF(document.filePath);

      // Update document with extracted text
      document.extractedText = extracted.text;
      document.textLength = extracted.text.length;
      document.metadata = {
        pageCount: extracted.pageCount,
        ...extracted.metadata
      };
      document.status = 'indexed';
      document.isIndexed = true;
      document.indexedAt = new Date();

      await document.save();

      this.log('Document indexed successfully', 'SUCCESS', {
        documentId,
        fileName: document.fileName,
        textLength: document.textLength,
        pageCount: extracted.pageCount
      });

      return {
        success: true,
        documentId,
        textLength: document.textLength,
        pageCount: extracted.pageCount
      };

    } catch (error) {
      // Update document status to failed
      await AIKnowledgeDocument.findByIdAndUpdate(documentId, {
        status: 'failed',
        errorMessage: error.message
      });

      this.log('Document indexing failed', 'ERROR', {
        documentId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Refresh the active knowledge base
   * @param {string} userId Super admin user ID
   * @returns {Promise<Object>} Refresh result
   */
  async refreshKnowledgeBase(userId) {
    const startTime = Date.now();

    try {
      this.log('Starting knowledge base refresh', 'INFO', { userId });

      // 1. Index project directory
      const projectIndex = await this.indexProjectDirectory();

      // 2. Get all indexed PDF documents
      const documents = await AIKnowledgeDocument.find({
        status: 'indexed',
        isIndexed: true
      }).select('_id fileName extractedText textLength');

      // Calculate total text length
      const pdfTextLength = documents.reduce((sum, doc) => sum + (doc.textLength || 0), 0);
      const projectTextLength = projectIndex.totalSize || 0;
      const totalTextLength = pdfTextLength + projectTextLength;

      // Create new knowledge base state
      const state = new AIKnowledgeBaseState({
        lastRefreshedAt: new Date(),
        refreshedBy: userId,
        activeDocuments: documents.map(doc => ({
          documentId: doc._id,
          fileName: doc.fileName,
          textLength: doc.textLength
        })),
        totalDocuments: documents.length + projectIndex.totalFiles,
        totalTextLength,
        version: Date.now(),
        status: 'active',
        refreshDuration: Date.now() - startTime
      });

      await state.save();

      // Clear cache to force reload
      this.knowledgeBaseCache = null;
      this.cacheTimestamp = null;

      this.log('Knowledge base refreshed successfully', 'SUCCESS', {
        projectFiles: projectIndex.totalFiles,
        uploadedDocs: documents.length,
        totalDocuments: documents.length + projectIndex.totalFiles,
        totalTextLength: `${(totalTextLength / 1024 / 1024).toFixed(2)} MB`,
        duration: `${Date.now() - startTime}ms`
      });

      return {
        success: true,
        projectFiles: projectIndex.totalFiles,
        uploadedDocuments: documents.length,
        totalDocuments: documents.length + projectIndex.totalFiles,
        totalTextLength,
        version: state.version,
        duration: Date.now() - startTime
      };

    } catch (error) {
      this.log('Knowledge base refresh failed', 'ERROR', {
        error: error.message,
        duration: `${Date.now() - startTime}ms`
      });

      throw error;
    }
  }

  /**
   * Validate OpenAI API key is configured
   */
  validateConfiguration() {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file. ' +
        'Get your API key from https://platform.openai.com/api-keys'
      );
    }
  }

  /**
   * Load active knowledge base from database AND project files
   * @returns {Promise<string>} Combined knowledge base text
   */
  async loadKnowledgeBase() {
    try {
      // Check cache (valid for 5 minutes)
      if (this.knowledgeBaseCache && this.cacheTimestamp && 
          (Date.now() - this.cacheTimestamp < 300000)) {
        return this.knowledgeBaseCache;
      }

      this.log('Loading knowledge base from project files and uploaded documents', 'INFO');

      const knowledgeTexts = [];

      // 1. Load project directory structure
      const projectIndex = await this.indexProjectDirectory();
      
      if (projectIndex.success && projectIndex.files.length > 0) {
        knowledgeTexts.push('\n\n=== PROJECT CODEBASE AND DOCUMENTATION ===\n');
        
        for (const file of projectIndex.files) {
          knowledgeTexts.push(`\n--- File: ${file.path} ---\n${file.content}`);
        }
      }

      // 2. Load uploaded PDF documents
      const state = await AIKnowledgeBaseState.findOne({ status: 'active' })
        .sort({ version: -1 })
        .populate('activeDocuments.documentId');

      if (state && state.activeDocuments.length > 0) {
        knowledgeTexts.push('\n\n=== UPLOADED DOCUMENTATION (PDFs) ===\n');
        
        for (const docRef of state.activeDocuments) {
          const doc = await AIKnowledgeDocument.findById(docRef.documentId);
          if (doc && doc.extractedText) {
            knowledgeTexts.push(`\n--- Document: ${doc.fileName} ---\n${doc.extractedText}`);
          }
        }
      }

      const combinedKnowledge = knowledgeTexts.join('\n');

      // Cache the result
      this.knowledgeBaseCache = combinedKnowledge;
      this.cacheTimestamp = Date.now();

      this.log('Knowledge base loaded successfully', 'SUCCESS', {
        totalSize: `${(combinedKnowledge.length / 1024).toFixed(2)} KB`,
        projectFiles: projectIndex.files?.length || 0,
        uploadedDocs: state?.activeDocuments?.length || 0
      });

      return combinedKnowledge;

    } catch (error) {
      this.log('Failed to load knowledge base', 'ERROR', { error: error.message });
      return this.getDefaultKnowledge();
    }
  }

  /**
   * Get default knowledge when no documents are indexed
   * @returns {string} Default knowledge text
   */
  getDefaultKnowledge() {
    return `
CloudLiteracy Educational Platform - Core Information

PLATFORM OVERVIEW:
CloudLiteracy is a full-stack educational platform for pre-DevOps learning with integrated payment systems.

KEY FEATURES:
- 7 Pre-DevOps learning modules with PDFs, videos, and quizzes
- Multi-payment gateway support (MTN MoMo, Orange Money, Stripe, PayPal)
- User authentication with JWT tokens
- Role-based access control (user/admin/super admin)
- Admin dashboard with analytics
- CSR access code system
- AWS exam voucher management
- Survey and testimonial systems
- Help desk with E2E encryption
- Real-time features with Socket.io

TECH STACK:
Backend: Node.js, Express, MongoDB, JWT, Socket.io
Frontend: React, React Router, Axios

ADMIN ROLES:
- Super Admin: Full platform access, can create admins
- Regular Admin: Limited permissions based on grants
- User/Learner: Standard platform access

PAYMENT METHODS:
- Stripe (Visa/Mastercard)
- PayPal
- MTN Mobile Money (Cameroon)
- Orange Money (Cameroon)

For detailed information, please upload platform documentation to the knowledge base.
    `.trim();
  }

  /**
   * Generate AI response to user query
   * @param {string} userMessage User's question
   * @param {Array} conversationHistory Previous messages
   * @returns {Promise<Object>} AI response
   */
  async generateResponse(userMessage, conversationHistory = []) {
    try {
      this.validateConfiguration();

      // Load knowledge base
      const knowledgeBase = await this.loadKnowledgeBase();

      // Build system prompt
      const systemPrompt = `You are an AI assistant for the CloudLiteracy educational platform. Your role is to answer questions ONLY about the platform's infrastructure, operations, features, and technical implementation.

You have access to:
1. COMPLETE PROJECT CODEBASE - All source code files (frontend and backend)
2. DOCUMENTATION - README files, setup guides, integration docs
3. CONFIGURATION FILES - Environment examples, package.json, etc.
4. UPLOADED PDFs - Additional documentation provided by admins

KNOWLEDGE BASE:
${knowledgeBase}

STRICT RULES:
1. ONLY answer questions related to CloudLiteracy platform operations, features, technical details, infrastructure, code implementation, or architecture
2. You can reference specific files, functions, components, models, routes, and code snippets from the codebase
3. If a question is about general topics, personal matters, or anything outside the platform scope, respond EXACTLY with: "Sorry buddy! I can't answer that question right now! It's out of my scope."
4. Be concise, accurate, and helpful
5. When referencing code, mention the file path and relevant code sections
6. If you're unsure about platform-specific details, say so clearly

SCOPE EXAMPLES:
✅ IN SCOPE: 
  - "How does the payment system work?"
  - "Show me the User model schema"
  - "What routes are available in the admin API?"
  - "How is JWT authentication implemented?"
  - "Explain the quiz submission flow"
  - "What React components are used in the dashboard?"
  - "How to configure MTN MoMo?"
  - "What's in the package.json dependencies?"
  
❌ OUT OF SCOPE: 
  - "What's the weather?"
  - "Tell me a joke"
  - "How to cook pasta?"
  - "What is Python?" (general programming)
  - "Who won the election?"

When answering:
- Reference specific files when relevant (e.g., "In backend/models/User.js...")
- Quote code snippets when helpful
- Explain technical concepts clearly
- Provide step-by-step guidance when needed`;

      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI API
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiMessage = response.data.choices[0].message.content;
      const isOutOfScope = aiMessage.includes("Sorry buddy! I can't answer that question right now! It's out of my scope.");

      this.log('AI response generated', 'SUCCESS', {
        userMessage: userMessage.substring(0, 50) + '...',
        responseLength: aiMessage.length,
        isOutOfScope
      });

      return {
        success: true,
        message: aiMessage,
        isOutOfScope,
        tokensUsed: response.data.usage.total_tokens
      };

    } catch (error) {
      this.log('AI response generation failed', 'ERROR', {
        error: error.response?.data || error.message
      });

      // Handle specific errors
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 500) {
        throw new Error('OpenAI service error. Please try again later.');
      }

      throw new Error(`AI service error: ${error.message}`);
    }
  }

  /**
   * Get knowledge base statistics
   * @returns {Promise<Object>} Statistics
   */
  async getKnowledgeBaseStats() {
    try {
      const state = await AIKnowledgeBaseState.findOne({ status: 'active' })
        .sort({ version: -1 })
        .populate('refreshedBy', 'name email');

      const totalDocuments = await AIKnowledgeDocument.countDocuments();
      const indexedDocuments = await AIKnowledgeDocument.countDocuments({ status: 'indexed' });
      const pendingDocuments = await AIKnowledgeDocument.countDocuments({ status: 'pending' });
      const failedDocuments = await AIKnowledgeDocument.countDocuments({ status: 'failed' });

      return {
        lastRefreshedAt: state?.lastRefreshedAt || null,
        refreshedBy: state?.refreshedBy || null,
        activeDocuments: state?.totalDocuments || 0,
        totalTextLength: state?.totalTextLength || 0,
        version: state?.version || 0,
        totalDocuments,
        indexedDocuments,
        pendingDocuments,
        failedDocuments,
        needsRefresh: pendingDocuments > 0 || (indexedDocuments > (state?.totalDocuments || 0))
      };

    } catch (error) {
      this.log('Failed to get knowledge base stats', 'ERROR', { error: error.message });
      throw error;
    }
  }

  /**
   * Logging utility
   * @param {string} message Log message
   * @param {string} level Log level
   * @param {Object} data Additional data
   */
  log(message, level = 'INFO', data = {}) {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      ERROR: '\x1b[31m',
      WARN: '\x1b[33m',
      RESET: '\x1b[0m'
    };

    const color = colors[level] || colors.INFO;
    console.log(`${color}[${timestamp}] [AI_QR] [${level}]${colors.RESET} ${message}`);

    if (Object.keys(data).length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

module.exports = new AIQRService();
