# ResumeScore - AI-Powered Resume Scoring SaaS

A premium, modern web application for recruiters to analyze resumes using AI-powered scoring technology.

## Features

- **User Authentication**: Secure login and registration with JWT
- **Job Post Management**: Create and manage job postings
- **Resume Analysis**: Upload multiple resumes (PDF/DOCX) for AI-powered analysis
- **Match Scoring**: Get 0-100% match scores with detailed insights
- **Skill Matching**: Identify matched skills, strengths, and weaknesses
- **Subscription Tiers**: Free, Pro, and Team plans with Stripe integration
- **Modern UI**: Clean, minimalist dashboard inspired by Linear, Notion, and Stripe

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - Server framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **OpenAI GPT-4** - AI analysis
- **Stripe** - Payment processing
- **JWT** - Authentication
- **Multer** - File upload handling
- **pdf-parse & mammoth** - Document parsing

## Project Structure

```
ResumeChecker/
├── frontend/          # Next.js frontend application
│   ├── pages/        # Next.js pages
│   ├── components/   # React components
│   ├── styles/       # Global styles
│   └── package.json
├── backend/          # Express backend API
│   ├── src/
│   │   ├── models/   # MongoDB models
│   │   ├── controllers/ # Route controllers
│   │   ├── routes/   # API routes
│   │   ├── middleware/ # Auth middleware
│   │   └── server.ts # Server entry point
│   └── package.json
└── package.json      # Root workspace config
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- OpenAI API key
- Stripe account (for payments)

### Installation

1. **Clone and install dependencies:**

```bash
npm run install:all
```

2. **Set up environment variables:**

Create `.env` files in both `frontend/` and `backend/` directories:

**backend_python/.env:**
```env
PORT=5000
# Hugging Face Hub Configuration (Optional)
HF_TOKEN=your_huggingface_token_here
HF_MODEL_ID=all-MiniLM-L6-v2  # or PavanRathodR/APi for custom model
```

**backend/.env:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/resumescore
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-here
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret-here
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_TEAM_PRICE_ID=price_xxxxx
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3. **Start MongoDB:**

Make sure MongoDB is running locally or update `MONGODB_URI` to your Atlas connection string.

4. **Run the application:**

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

## Usage

1. **Register/Login**: Create an account or login
2. **Create Job Post**: Add a job title and description (or upload PDF/DOCX)
3. **Upload Resumes**: Upload candidate resumes (PDF/DOCX format)
4. **Analyze**: Click "Analyze" to get AI-powered match scores
5. **View Results**: See detailed analysis with strengths, weaknesses, and skill matches

## Subscription Tiers

- **Free**: 5 resume matches/month
- **Pro ($49/mo)**: Unlimited matches, priority AI, CSV export
- **Team ($99/mo)**: Multi-user, shared dashboard, API access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Job Posts
- `GET /api/jobs` - Get all job posts
- `POST /api/jobs` - Create new job post
- `GET /api/jobs/:id` - Get specific job post
- `GET /api/jobs/:jobId/analyses` - Get analyses for job

### Analysis
- `POST /api/jobs/:jobId/analyze` - Analyze resumes (multipart/form-data)

### Model Management
- `POST /api/models/upload` - Upload trained model to Hugging Face Hub

### Stripe
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler

## Development

### Build for Production

```bash
npm run build
```

### Hugging Face Hub Integration

The resume analyzer supports using custom models from Hugging Face Hub:

1. **Set up your Hugging Face token:**
   ```env
   HF_TOKEN=your_huggingface_token_here
   ```

2. **Use a custom model:**
   ```env
   HF_MODEL_ID=PavanRathodR/APi
   ```

3. **Upload a trained model to Hugging Face Hub:**
   ```bash
   cd backend_python
   python upload_model.py /path/to/local/model PavanRathodR/APi
   ```

   Or use the API endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/models/upload \
     -H "Content-Type: application/json" \
     -d '{"folder_path": "/path/to/local/model", "repo_id": "PavanRathodR/APi"}'
   ```

### Environment Variables

Ensure all required environment variables are set before running the application. See `.env.example` files for reference.

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend (Render/Railway)
1. Connect repository
2. Set environment variables
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`

## License

MIT

## Notes

- Ensure OpenAI API key has sufficient credits
- Stripe webhook URL should be configured in Stripe dashboard
- File uploads are limited to 10MB per file
- Resume limits are enforced based on subscription tier
