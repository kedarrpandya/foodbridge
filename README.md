# 🚀 FoodBridge - Connecting Surplus to Need

A full-stack web application that connects food donors with recipients, featuring advanced analytics, AI-powered insights, and a beautiful, responsive interface.

![FoodBridge Banner](https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=400&fit=crop&crop=center)

## ✨ Features

- **🍎 Food Donation Platform**: Easy-to-use interface for donors to list surplus food
- **🤖 AI-Powered Analytics**: Intelligent insights and predictions for optimal food distribution
- **📊 Advanced Dashboard**: Comprehensive analytics with interactive charts and visualizations
- **🔍 Smart Search**: Find food items by category, location, and availability
- **📱 Responsive Design**: Beautiful UI that works on all devices
- **🔐 Secure Authentication**: User registration and login with JWT tokens
- **📧 Email Notifications**: Automated notifications for donors and recipients
- **🌍 Location-Based Matching**: Connect donors and recipients in the same area

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance async web framework
- **SQLAlchemy** - Database ORM with async support
- **PostgreSQL** - Robust relational database
- **OpenAI API** - AI-powered insights and explanations
- **Pydantic** - Data validation and serialization

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Powerful data fetching and caching
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management

### Infrastructure
- **Docker** - Containerized deployment
- **PostgreSQL** - Database (free tier available)
- **Redis** - Caching (optional, for production)

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **PostgreSQL** (local or cloud)
- **Git**
- **Docker & Docker Compose** (optional, for containerized setup)

### Option 1: Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/foodbridge.git
cd foodbridge

# Start all services with Docker Compose
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### Option 2: Manual Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/foodbridge.git
cd foodbridge
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Option 3: Quick Deployment Script

```bash
# Run the automated deployment script
./deploy.sh
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (if using Docker)

## 🌐 Free Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### 1. Database Setup (Railway)

1. Go to [Railway.app](https://railway.app) and sign up
2. Create a new PostgreSQL database
3. Copy the database URL from Railway dashboard

#### 2. Backend Deployment (Railway)

1. Connect your GitHub repository to Railway
2. Railway will automatically detect your Python app
3. Set environment variables in Railway:
   ```
   DATABASE_URL=your_railway_postgres_url
   SECRET_KEY=your_secret_key_here
   OPENAI_API_KEY=your_openai_key (optional)
   CORS_ORIGINS=https://your-frontend-domain.vercel.app
   ```

4. Deploy your backend

#### 3. Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Connect your GitHub repository
3. Vercel will detect your React app
4. Set environment variable:
   ```
   VITE_API_URL=https://your-railway-backend-url.up.railway.app
   ```
5. Deploy your frontend

**Cost**: Free tiers available, pay only when usage exceeds limits

### Option 2: Render (All-in-One)

#### 1. Database Setup

1. Go to [render.com](https://render.com) and sign up
2. Create a PostgreSQL database (free tier available)
3. Copy the connection details

#### 2. Backend Deployment

1. Connect your GitHub repository
2. Create a new Web Service
3. Configure build settings:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables:
   ```
   DATABASE_URL=your_render_postgres_url
   SECRET_KEY=your_secret_key_here
   OPENAI_API_KEY=your_openai_key (optional)
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ```

#### 3. Frontend Deployment

1. Create another Web Service for frontend
2. Configure build settings:
   - **Environment**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

**Cost**: Free tier with 750 hours/month

### Option 3: Fly.io (High Performance)

#### 1. Install Fly CLI

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
fly auth login
```

#### 2. Database Setup

```bash
# Create PostgreSQL app
fly postgres create --name foodbridge-db

# Get database URL
fly postgres connect --app foodbridge-db
```

#### 3. Deploy Backend

```bash
# Initialize Fly app
fly launch --name foodbridge-backend

# Set secrets
fly secrets set DATABASE_URL="your_db_url"
fly secrets set SECRET_KEY="your_secret_key"
fly secrets set OPENAI_API_KEY="your_openai_key"  # optional

# Deploy
fly deploy
```

#### 4. Deploy Frontend

```bash
# Create frontend app
fly launch --name foodbridge-frontend

# Set environment variable
fly secrets set VITE_API_URL="https://foodbridge-backend.fly.dev"

# Deploy
fly deploy
```

**Cost**: Free tier with generous limits

### Option 4: Netlify + Supabase (No-Code Database)

#### 1. Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com) and create account
2. Create a new project
3. Get your connection string from Settings > Database

#### 2. Backend Deployment (Railway or Render)

Use Railway or Render as described in Option 1 for backend deployment.

#### 3. Frontend Deployment (Netlify)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Connect your GitHub repository
3. Set build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
5. Deploy

**Cost**: Free tiers available

## 🔧 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# OpenAI (Optional)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Email (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis (Optional for production)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL locally
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb foodbridge

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://localhost/foodbridge
```

### Option 2: Cloud Database (Free Tiers)

- **Railway**: 512MB PostgreSQL free
- **Render**: 1GB PostgreSQL free
- **Supabase**: 500MB PostgreSQL free
- **Neon**: 512MB PostgreSQL free
- **ElephantSQL**: 20MB PostgreSQL free

## 📧 Email Setup (Optional)

### Gmail App Password

1. Enable 2-factor authentication on Gmail
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password in SMTP_PASSWORD

### Environment Variables

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 🔍 Testing the Deployment

### 1. Health Check

```bash
# Backend health
curl https://your-backend-url.com/docs

# Frontend check
curl https://your-frontend-url.com
```

### 2. API Testing

```bash
# Test items endpoint
curl https://your-backend-url.com/api/v1/items/

# Test analytics
curl https://your-backend-url.com/api/v1/analytics/summary
```

### 3. Database Connection

```bash
# Test database connection
curl https://your-backend-url.com/api/v1/analytics/summary
```

## 🚀 Production Optimizations

### 1. Environment Variables

- Set `NODE_ENV=production`
- Use strong `SECRET_KEY`
- Configure proper CORS origins
- Set up proper database credentials

### 2. Database Migrations

```bash
# Run migrations on production
alembic upgrade head
```

### 3. Static Files

Frontend assets are automatically optimized by Vercel/Netlify.

### 4. Monitoring

Consider adding:
- Error tracking (Sentry)
- Analytics (Google Analytics, Mixpanel)
- Performance monitoring

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: Can't connect to database
```

**Solution:**
- Check DATABASE_URL format
- Ensure database is running
- Verify firewall settings
- Check database credentials

#### 2. CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Update CORS_ORIGINS in backend .env
- Include both http:// and https:// URLs
- Check for trailing slashes

#### 3. Build Failures

```
Build failed with exit code 1
```

**Solution:**
- Check build logs for specific errors
- Ensure all dependencies are listed in requirements.txt/package.json
- Verify Python/Node versions match deployment platform

#### 4. OpenAI API Issues

```
OpenAI API key invalid
```

**Solution:**
- Verify API key is correct
- Check OpenAI account has credits
- Ensure proper environment variable setup

### Getting Help

- Check the [Issues](https://github.com/yourusername/foodbridge/issues) page
- Review deployment logs in your hosting platform
- Test API endpoints individually

## 📈 Performance Tips

### Frontend
- Enable gzip compression
- Optimize images
- Use CDN for static assets
- Implement lazy loading

### Backend
- Use connection pooling
- Implement caching (Redis)
- Optimize database queries
- Use async/await properly

### Database
- Set up proper indexes
- Monitor query performance
- Use connection pooling
- Regular maintenance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Food images from [Unsplash](https://unsplash.com)
- Icons from [Heroicons](https://heroicons.com)
- UI components inspired by modern design systems

## 📞 Support

For support, email support@foodbridge.com or create an issue on GitHub.

---

**Happy deploying! 🚀**

Built with ❤️ for a hunger-free world.
