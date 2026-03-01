# 🏫 ASTU Smart Complaint & Issue Tracking System

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-98.6%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
</div>

<div align="center">
  <h3>✨ A modern, AI-powered complaint management system for ASTU</h3>
  <p><i>Streamlining campus issue reporting with transparency, accountability, and smart assistance</i></p>
</div>

<br />

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 📋 **Table of Contents**
- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [🔧 Environment Configuration](#-environment-configuration)
- [📁 Project Structure](#-project-structure)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🌟 **Overview**

**ASTU Smart Complaint & Issue Tracking System** is a full-stack application designed to digitize and revolutionize complaint management at Adama Science and Technology University. 

> 🎯 **Mission**: Replace manual, opaque complaint handling with a transparent, efficient digital workflow that empowers students, staff, and administrators.

### **Why This Matters**
- 📝 **Students**: No more lost complaint forms or status uncertainty
- 👨‍🏫 **Staff**: Prioritize and manage issues effectively
- 📊 **Admin**: Data-driven insights for campus improvement
- 🤖 **Everyone**: 24/7 AI assistance for instant answers

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## ✨ **Key Features**

### 👥 **Multi-Role Dashboard System**
| Role | Capabilities |
|------|-------------|
| **Student** | Submit complaints, track status in real-time, view history, chat with AI assistant |
| **Department Staff** | Manage assigned tickets, update status workflow, add internal remarks |
| **Administrator** | Oversee all complaints, manage users/categories, view advanced analytics |

### 🤖 **AI-Powered Hybrid Search Chatbot**
```mermaid
graph LR
    A[Student Query] --> B{Hybrid Search}
    B --> C[Semantic Search<br/>Vector Embeddings]
    B --> D[Keyword Search<br/>BM25 Algorithm]
    C & D --> E[Ensemble Results]
    E --> F[LLM Generation]
    F --> G[Response + Citations]
```

- **Smart Understanding**: Finds answers even with typos or vague descriptions
- **Dual Search Methods**: Combines semantic understanding with precise keyword matching
- **Configurable Balance**: Adjust between keyword and semantic search
- **Source Citations**: Every answer includes references to source documents
- **Context-Aware**: Remembers conversation history within sessions

### 📊 **Advanced Analytics Dashboard**
- Real-time metrics and KPI tracking
- Interactive charts for category distribution
- Resolution rate trends over time
- Export functionality (PDF/CSV/Excel)

### 🔐 **Enterprise-Grade Security**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting to prevent abuse
- Secure file upload validation
- Comprehensive audit logging

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    🖥️  FRONTEND (Next.js 15)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Student UI  │  │  Staff UI   │  │      Admin UI       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              🤖 AI Chatbot Widget                     │  │
│  │     [Hybrid Search | Source Citations | Feedback]     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ⚙️  BACKEND (Node.js/Express)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   REST API  │  │  WebSocket  │  │   Hybrid Search     │  │
│  │             │  │   Server    │  │     Engine          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │   File      │  │   Rate Limiting &   │  │
│  │   Service   │  │   Upload    │  │     Security        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │           💾 DATA LAYER              │
        │  ┌──────────┐  ┌──────────────────┐  │
        │  │ MongoDB  │  │   Vector DB      │  │
        │  │ (Primary)│  │   (Chroma/FAISS) │  │
        │  └──────────┘  └──────────────────┘  │
        └─────────────────────────────────────┘
```

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🚀 **Quick Start Guide**

### **Prerequisites**
- ✅ Node.js 20.x or higher
- ✅ MongoDB 6.x or higher (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- ✅ npm 10.x or higher
- ✅ Git

### **Installation in 3 Simple Steps**

#### **Step 1: Clone the Repository**
```bash
# Clone with GitHub CLI
gh repo clone Nboss21/ASTU-Smart-Complaint

# Or with Git
git clone https://github.com/Nboss21/ASTU-Smart-Complaint.git

# Navigate to project
cd ASTU-Smart-Complaint
```

#### **Step 2: Backend Setup** ⚙️
```bash
# Enter backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration (see below)
# ⚠️ IMPORTANT: Add your MongoDB URI and API keys

# Start development server
npm run dev
```
✅ Backend running at **http://localhost:4000**

#### **Step 3: Frontend Setup** 🎨
```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your backend URL
# (Default is http://localhost:4000)

# Start development server
npm run dev
```
✅ Frontend running at **http://localhost:3000**

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🔧 **Environment Configuration**

### **Backend (.env)** - MongoDB & API Keys

Create `.env` in the `backend` folder:

```env
# 🍃 MongoDB Connection (Required)
MONGODB_URI=mongodb://localhost:27017/astu_complaints
# For production: mongodb+srv://username:password@cluster.mongodb.net/astu_complaints

# 🔐 JWT Authentication (Required - Generate strong secrets)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=7h
JWT_REFRESH_EXPIRES_IN=18d

# 🌐 Server Configuration
PORT=4000
CLIENT_ORIGIN=http://localhost:3000

# 📁 File Upload
FILE_UPLOAD_DIR=uploads

# 🤖 AI API Keys (For Chatbot - Optional but recommended)
GEMINI_API_KEY=your-google-gemini-api-key-here
VOYAGE_API_KEY=your-voyage-ai-api-key-here
```

### **Frontend (.env.local)** - API Connection

Create `.env.local` in the `frontend` folder:

```env
# 🌐 Backend API URL (Required)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# 📁 File Upload Limits
NEXT_PUBLIC_MAX_FILE_SIZE=5242880  # 5MB
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# 🤖 Chatbot Configuration
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_CHATBOT_TITLE=ASTU Assistant
```

### **🔑 Getting API Keys**

<details>
<summary><b>Click to expand: How to get Gemini API Key (Free)</b></summary>

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Click **"Create API Key"**
5. Copy the key and add to your `.env` as `GEMINI_API_KEY=`
</details>

<details>
<summary><b>Click to expand: How to get Voyage AI Key (For embeddings)</b></summary>

1. Visit [Voyage AI Dashboard](https://dash.voyageai.com/)
2. Sign up for a free account
3. Navigate to **API Keys** section
4. Click **"Generate New Key"**
5. Copy the key to `VOYAGE_API_KEY=`
</details>

<details>
<summary><b>Click to expand: Local Alternative (No API Keys Needed)</b></summary>

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull nomic-embed-text  # For embeddings
ollama pull qwen2.5           # For text generation

# Add to backend .env
OLLAMA_URL=http://localhost:11434
EMBEDDINGS_MODEL=nomic-embed-text
LLM_MODEL=qwen2.5

# Comment out GEMINI_API_KEY and VOYAGE_API_KEY
```
</details>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 📁 **Project Structure**

```
ASTU-Smart-Complaint/
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 controllers/     # Route controllers
│   │   ├── 📂 middleware/       # Auth, validation, rate limiting
│   │   ├── 📂 models/          # MongoDB models
│   │   ├── 📂 routes/          # API routes
│   │   ├── 📂 services/        # Business logic
│   │   │   ├── 📂 chatbot/     # Hybrid search implementation
│   │   │   └── 📂 analytics/   # Analytics engine
│   │   ├── 📂 utils/           # Helpers
│   │   └── app.ts              # Main app
│   ├── 📂 tests/                # Backend tests
│   ├── package.json
│   └── README.md
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 app/             # Next.js app router
│   │   │   ├── 📂 (auth)/      # Login/Register pages
│   │   │   ├── 📂 (dashboard)/ # Role-based dashboards
│   │   │   └── 📂 api/         # API routes
│   │   ├── 📂 components/      # React components
│   │   │   ├── 📂 ui/          # Reusable UI
│   │   │   ├── 📂 chatbot/     # Chatbot components
│   │   │   └── 📂 forms/       # Complaint forms
│   │   └── 📂 lib/             # Utilities
│   ├── package.json
│   └── README.md
│
├── 📂 docs/                     # Documentation
│   ├── API.md
│   └── SECURITY.md
│
├── .gitignore
└── README.md                    # You are here!
```

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 📚 **API Documentation**

### **Core Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Create new account | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/profile` | Get user profile | Authenticated |
| GET | `/api/complaints` | List complaints | Role-based |
| POST | `/api/complaints` | Submit complaint | Student |
| POST | `/api/chatbot/query` | Ask AI assistant | Authenticated |

> 📖 **Full API documentation** available in [docs/API.md](docs/API.md)

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🧪 **Testing**

### **Backend Tests**
```bash
cd backend
npm run test        # Run unit tests
npm run test:watch  # Run in watch mode
npm run test:cov    # Generate coverage report
```

### **Frontend Tests**
```bash
cd frontend
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
```

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🚢 **Deployment**

### **Quick Deploy to Production**

<details>
<summary><b>Backend (Railway/Render)</b></summary>

```bash
# Push to GitHub
git push origin main

# Connect your repository to Railway.app
# Add environment variables
# Deploy!
```
</details>

<details>
<summary><b>Frontend (Vercel)</b></summary>

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Add environment variables in Vercel dashboard
```
</details>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## ✅ **Verification Checklist**

Use this to ensure everything is working:

- [ ] **Backend** running at `http://localhost:4000`
- [ ] **Frontend** running at `http://localhost:3000`
- [ ] **MongoDB** connected successfully
- [ ] **Test user** can login (if seeded)
- [ ] **Complaint submission** works
- [ ] **File upload** functions properly
- [ ] **Chatbot** responds to queries
- [ ] **Role-based views** switch correctly

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🤝 **Contributing**

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### **Contribution Guidelines**
- ✅ Write clear commit messages
- ✅ Add tests for new features
- ✅ Update documentation
- ✅ Follow existing code style

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Developer**

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/Nboss21">
          <img src="https://avatars.githubusercontent.com/Nboss21" width="100px" style="border-radius:50%" alt="Nboss21"/>
          <br />
          <sub><b>Natnael Esayas</b></sub>
        </a>
        <br />
        <sub>Lead Developer</sub>
      </td>
    </tr>
  </table>
</div>

---

## 📞 **Support**

Having issues? Try these:

1. 📖 Check the [docs](docs/) folder
2. 🔍 Search [existing issues](https://github.com/Nboss21/ASTU-Smart-Complaint/issues)
3. 📧 Contact the developer
4. 🐛 Open a new issue with details

---

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

<div align="center">
  <h3>⭐ If you find this project useful, please consider giving it a star! ⭐</h3>
  <p>Built with ❤️ for ASTU students, staff, and administration</p>
  
  <p>
    <a href="https://github.com/Nboss21/ASTU-Smart-Complaint/stargazers">
      <img src="https://img.shields.io/github/stars/Nboss21/ASTU-Smart-Complaint?style=social" />
    </a>
    <a href="https://github.com/Nboss21/ASTU-Smart-Complaint/network/members">
      <img src="https://img.shields.io/github/forks/Nboss21/ASTU-Smart-Complaint?style=social" />
    </a>
  </p>
</div>
