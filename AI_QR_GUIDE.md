# AI QR - Platform Knowledge Assistant
## Setup & Usage Guide for Super Admins

---

## 🎯 **Overview**

AI QR (Query & Response) is an intelligent assistant exclusively for Super Admins that answers questions about CloudLiteracy platform infrastructure, operations, features, and technical implementation.

### **Knowledge Sources**

The AI has access to:

1. **🔄 Auto-Indexed Project Files** (Automatic)
   - All source code (frontend & backend)
   - Configuration files (.env.example, package.json, etc.)
   - Documentation files (README.md, guides, etc.)
   - Model schemas, routes, controllers, components
   - Automatically re-indexed on every knowledge refresh

2. **📄 Uploaded PDF Documents** (Manual)
   - Additional documentation uploaded by super admins
   - Supplementary guides and specifications
   - External documentation

### **Key Features**
- ✅ **Super Admin Only Access**: Restricted to primary and regular super admins
- ✅ **Complete Codebase Access**: AI knows entire project structure
- ✅ **Code-Aware Responses**: Can reference specific files, functions, and code
- ✅ **Manual Knowledge Refresh**: Super admin controls when AI updates
- ✅ **Scope-Restricted Responses**: Only answers platform-related questions
- ✅ **Real-Time Chat Interface**: Industry-standard messaging with typing indicators
- ✅ **Delivery/Read Receipts**: Track message status
- ✅ **Document Management**: Upload, download, delete PDFs
- ✅ **Audit Trail**: Complete logging of all interactions

---

## 🔐 **Access Control**

### **Who Can Access AI QR?**
- ✅ **Primary Super Admin** (canCreateSuperAdmins: true)
- ✅ **Regular Super Admins** (isSuperAdmin: true)
- ❌ **Regular Admins** (No access)
- ❌ **Users/Learners** (No access)

### **How to Access**
1. Log in as Super Admin
2. Go to Admin Dashboard
3. Click **"🤖 AI QR"** tab in the navigation

---

## ⚙️ **Setup Instructions**

### **Step 1: Get OpenAI API Key**

1. Visit https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click **"Create new secret key"**
4. Copy the API key (starts with `sk-...`)
5. Save it securely - you won't see it again!

### **Step 2: Configure Backend**

Add to your `.env` file:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your_actual_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

**Model Options:**
- `gpt-4-turbo-preview` - Most capable, recommended
- `gpt-4` - Stable, reliable
- `gpt-3.5-turbo` - Faster, cheaper (less accurate)

### **Step 3: Install Dependencies**

```bash
cd backend
npm install pdf-parse
```

### **Step 4: Restart Server**

```bash
npm run dev
```

### **Step 5: Verify Setup**

1. Go to Admin Dashboard → AI QR tab
2. You should see the chat interface
3. Try asking: "What is CloudLiteracy?"
4. If you get a response, setup is complete!

---

## 📚 **Building the Knowledge Base**

### **Automatic Project Indexing**

The AI automatically indexes:

**✅ Included Files:**
- `.js`, `.jsx`, `.ts`, `.tsx` - JavaScript/TypeScript code
- `.json` - Configuration and package files
- `.md`, `.txt` - Documentation
- `.env.example` - Environment configuration examples
- `.yml`, `.yaml` - CI/CD and config files

**❌ Excluded Directories:**
- `node_modules/` - Dependencies
- `.git/` - Version control
- `dist/`, `build/` - Build outputs
- `uploads/` - User uploads
- `.vscode/`, `.idea/` - IDE configs

**When Indexing Happens:**
- Every time you click "Refresh Knowledge"
- Scans entire project directory
- Reads all relevant files
- Combines with uploaded PDFs

### **What the AI Knows About Your Code**

The AI can answer questions about:

**Backend:**
- ✅ Models (User, Module, Payment, etc.)
- ✅ Controllers (auth, payment, admin, etc.)
- ✅ Routes and API endpoints
- ✅ Middleware (auth, access control)
- ✅ Services (email, socket, payment gateways)
- ✅ Database schemas and relationships

**Frontend:**
- ✅ React components
- ✅ Pages and routing
- ✅ Context providers
- ✅ API service calls
- ✅ Styling and UI structure

**Configuration:**
- ✅ Environment variables
- ✅ Package dependencies
- ✅ Server setup
- ✅ Database connection

**Documentation:**
- ✅ README files
- ✅ Setup guides
- ✅ Integration documentation
- ✅ API specifications

### **Uploading Additional PDFs**

While the AI auto-indexes all project files, you can upload PDFs for:
- ✅ External API documentation
- ✅ Business requirements
- ✅ Architecture diagrams (as PDF)
- ✅ Third-party integration guides
- ✅ Compliance documentation

**How to Upload:**
1. Go to **AI QR** → **Knowledge Base** tab
2. Click **"📄 Upload PDF"**
3. Select PDF file (max 50MB)
4. Wait for automatic indexing
5. Click **"Refresh Knowledge"** to activate

---

## 🔄 **Refreshing Knowledge Base**

### **Why Manual Refresh?**

Manual refresh ensures:
- ✅ **Governance**: Super admin controls what AI knows
- ✅ **Transparency**: Clear audit trail of knowledge updates
- ✅ **Accountability**: Documented who updated knowledge and when
- ✅ **Quality Control**: Review documents before activation

### **When to Refresh?**

Refresh knowledge base when:
- ✅ New code committed to repository
- ✅ Documentation files updated
- ✅ New PDFs uploaded
- ✅ PDFs deleted
- ✅ Configuration files changed
- ✅ Want AI to see latest codebase

### **How to Refresh**

1. Go to **Knowledge Base** tab
2. Review uploaded PDFs (if any)
3. Click **"🔄 Refresh Knowledge"**
4. Confirm the action
5. Wait for completion (usually 2-10 seconds)

**What Happens During Refresh:**
1. System scans entire project directory
2. Reads all code files, configs, and docs
3. Loads all indexed PDF documents
4. Combines everything into knowledge base
5. Updates AI's active knowledge
6. Records refresh timestamp and admin

**Refresh Results Show:**
- Project Files: Number of code/doc files indexed
- Uploaded PDFs: Number of PDF documents
- Total Documents: Combined count
- Total Size: Combined text size
- Duration: Time taken to refresh

---

## 💬 **Using the Chat Interface**

### **Asking Questions**

**Code-Related Questions:**
- "Show me the User model schema"
- "What fields are in the Payment model?"
- "How is JWT authentication implemented?"
- "What routes are available in the admin API?"
- "Explain the quiz submission flow"
- "What React components are used in the dashboard?"
- "How does the progress tracking work?"
- "Show me the socket.io implementation"

**Architecture Questions:**
- "How does the payment system work?"
- "What's the database structure?"
- "Explain the authentication flow"
- "How are modules unlocked?"
- "What's the CSR access code system?"

**Configuration Questions:**
- "How to configure MTN Mobile Money?"
- "What environment variables are needed?"
- "What packages are installed?"
- "How to set up the database?"

**Implementation Questions:**
- "How is the admin dashboard structured?"
- "What middleware is used for authentication?"
- "How are files uploaded?"
- "Explain the voucher encryption"

**Bad Questions (Out of Scope):**
- "What's the weather today?"
- "Tell me a joke"
- "How to cook pasta?"
- "What is Python?" (general programming)
- "Who won the election?"

### **Out of Scope Response**

If you ask something outside the platform scope, AI will respond:

```
Sorry buddy! I can't answer that question right now! It's out of my scope.
```

This ensures AI stays focused on platform-specific assistance.

### **Chat Features**

**Typing Indicator:**
- Shows when AI is generating response
- Animated dots indicate processing

**Message Status:**
- ✓ - Sent
- ✓✓ - Delivered
- ✓✓ (green) - Read

**Clear Chat:**
- Click "🗑️ Clear Chat" to delete conversation history
- Useful for starting fresh or removing sensitive discussions

---

## 📊 **Knowledge Base Statistics**

### **Dashboard Metrics**

**Project Files:**
- Shows "Auto-Indexed" status
- All code and documentation files
- Automatically updated on refresh

**Uploaded PDFs:**
- Number of PDF documents in active knowledge
- Only counts PDFs included in last refresh

**Total Documents:**
- Combined count of project files + PDFs
- Shows complete knowledge base size

**Indexed PDFs:**
- PDFs successfully processed and ready

**Pending PDFs:**
- PDFs being processed or awaiting indexing

**Last Refreshed:**
- Timestamp of last knowledge base update
- Shows which super admin performed the refresh

**Needs Refresh Warning:**
- Appears when new PDFs are uploaded
- Indicates knowledge base should be updated

---

## 🔧 **Document Management**

### **Understanding the System**

**Auto-Indexed Files (No Management Needed):**
- All project code files
- Configuration files
- Documentation files
- Automatically included on every refresh
- No upload/download/delete needed

**Uploaded PDFs (Manual Management):**
- Additional documentation you upload
- Can be downloaded, deleted
- Requires manual refresh to activate

### **Download PDFs**

1. Go to **Knowledge Base** tab
2. Find PDF in table
3. Click **⬇️** download button
4. File downloads to your computer

**Use Cases:**
- Backup documentation
- Share with team members
- Review content before refresh

### **Delete PDFs**

1. Go to **Knowledge Base** tab
2. Find PDF in table
3. Click **🗑️** delete button
4. Confirm deletion
5. **Important**: Click "Refresh Knowledge" to update AI

**Warning:** Deletion is permanent! PDF is removed from:
- Database
- File system
- AI knowledge (after refresh)

---

## 🔒 **Security & Privacy**

### **Data Protection**

**What is Stored:**
- ✅ Uploaded PDF files (encrypted at rest)
- ✅ Extracted text content
- ✅ Chat conversation history
- ✅ Knowledge base versions
- ✅ Refresh audit logs

**What is NOT Stored:**
- ❌ OpenAI API key (only in environment variables)
- ❌ Raw API responses
- ❌ User passwords or sensitive credentials

### **API Key Security**

**Best Practices:**
- ✅ Store API key in `.env` file only
- ✅ Never commit `.env` to version control
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically (every 90 days)
- ✅ Monitor API usage on OpenAI dashboard

**If Key is Compromised:**
1. Immediately revoke key on OpenAI dashboard
2. Generate new key
3. Update `.env` file
4. Restart server
5. Test AI QR functionality

### **Access Logs**

All AI QR interactions are logged:
- User ID and name
- Question asked
- Response generated
- Timestamp
- Knowledge base version used

**View Logs:**
- Check server console for real-time logs
- Logs include color-coded severity levels
- Integrate with logging service (Winston, Bunyan) for production

---

## 💰 **Cost Management**

### **OpenAI Pricing (as of 2024)**

**GPT-4 Turbo:**
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens

**GPT-3.5 Turbo:**
- Input: $0.0005 per 1K tokens
- Output: $0.0015 per 1K tokens

**Typical Costs:**
- Average question: 500-1000 tokens
- Average response: 300-800 tokens
- Cost per interaction: $0.01 - $0.05 (GPT-4)

### **Cost Optimization**

**Reduce Costs:**
1. Use GPT-3.5 Turbo for simple questions
2. Keep knowledge base concise (remove redundant docs)
3. Clear chat history regularly
4. Set usage limits on OpenAI dashboard
5. Monitor token usage in logs

**Set Budget Alerts:**
1. Go to OpenAI dashboard
2. Settings → Billing → Usage limits
3. Set monthly budget cap
4. Enable email notifications

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. "OpenAI API key not configured"**

**Solution:**
- Check `.env` file has `OPENAI_API_KEY=sk-...`
- Ensure no spaces around `=`
- Restart backend server
- Verify key is valid on OpenAI dashboard

#### **2. "Failed to generate AI response"**

**Possible Causes:**
- Invalid API key
- Rate limit exceeded
- OpenAI service down
- Network connectivity issues

**Solution:**
- Check OpenAI status: https://status.openai.com
- Verify API key is active
- Check rate limits on OpenAI dashboard
- Review server logs for detailed error

#### **3. "Document indexing failed"**

**Possible Causes:**
- PDF is corrupted
- PDF is password-protected
- PDF contains only images (no text)
- File size exceeds 50MB

**Solution:**
- Ensure PDF has selectable text
- Remove password protection
- Use OCR for image-based PDFs
- Split large PDFs into smaller files

#### **4. "AI gives incorrect answers"**

**Solution:**
- Upload more comprehensive documentation
- Refresh knowledge base
- Verify uploaded documents contain correct information
- Ask more specific questions

#### **5. "Knowledge base not updating"**

**Solution:**
- Click "Refresh Knowledge" button
- Wait for confirmation message
- Check that documents are "Indexed" status
- Review server logs for errors

---

## 📈 **Best Practices**

### **Documentation Quality**

**Good Documentation:**
- ✅ Clear, concise language
- ✅ Well-structured with headings
- ✅ Includes examples and code snippets
- ✅ Up-to-date with current platform
- ✅ Covers common questions and scenarios

**Poor Documentation:**
- ❌ Vague or ambiguous descriptions
- ❌ Outdated information
- ❌ Missing critical details
- ❌ Inconsistent formatting
- ❌ Too technical or too simple

### **Knowledge Base Maintenance**

**Weekly:**
- Review chat logs for unanswered questions
- Identify documentation gaps
- Update outdated documents

**Monthly:**
- Audit all uploaded documents
- Remove obsolete documentation
- Add new feature documentation
- Refresh knowledge base

**Quarterly:**
- Comprehensive documentation review
- Reorganize document structure
- Update API key (security best practice)
- Review AI QR usage analytics

### **Question Formulation**

**Effective Questions:**
- Be specific: "How does MTN MoMo payment verification work?"
- Provide context: "In the admin dashboard, what does the CSR Management tab do?"
- Ask one thing at a time: Avoid multi-part questions

**Ineffective Questions:**
- Too vague: "How does it work?"
- Too broad: "Tell me everything about the platform"
- Multiple questions: "How do payments work and what about quizzes and modules?"

---

## 🚀 **Advanced Features**

### **Custom System Prompts**

Modify AI behavior by editing `aiQRService.js`:

```javascript
const systemPrompt = `You are an AI assistant for CloudLiteracy...
[Customize instructions here]
`;
```

### **Token Limit Adjustment**

Increase response length:

```javascript
this.maxTokens = 3000; // Default: 2000
```

### **Temperature Control**

Adjust creativity vs. accuracy:

```javascript
this.temperature = 0.5; // Lower = more focused (0.0 - 1.0)
```

### **Model Selection**

Switch AI models:

```env
OPENAI_MODEL=gpt-4-turbo-preview  # Most capable
OPENAI_MODEL=gpt-4                # Stable
OPENAI_MODEL=gpt-3.5-turbo        # Faster, cheaper
```

---

## 📞 **Support**

### **Getting Help**

**Technical Issues:**
- Check server logs: `backend/` console output
- Review OpenAI dashboard for API errors
- Consult this guide's troubleshooting section

**Feature Requests:**
- Document desired functionality
- Discuss with development team
- Consider cost implications

**Documentation Updates:**
- Keep this guide updated with platform changes
- Share knowledge with other super admins
- Maintain version history

---

## 📝 **Changelog**

**Version 1.0.0** (January 2024)
- Initial release
- Super admin only access
- PDF document upload and indexing
- Manual knowledge base refresh
- Real-time chat interface
- Scope-restricted responses
- Document management (upload/download/delete)
- Knowledge base statistics
- Comprehensive logging

---

## 🎓 **Quick Start Checklist**

- [ ] Get OpenAI API key
- [ ] Add key to `.env` file
- [ ] Install `pdf-parse` package
- [ ] Restart backend server
- [ ] Access AI QR tab in Admin Dashboard
- [ ] Upload README.md as PDF
- [ ] Upload other platform documentation
- [ ] Click "Refresh Knowledge"
- [ ] Test with sample question
- [ ] Review knowledge base statistics
- [ ] Set up OpenAI budget alerts
- [ ] Document your knowledge base structure

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintained By**: CloudLiteracy Development Team  
**Access Level**: Super Admin Only
