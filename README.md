# LawSpark AI Platform

A comprehensive legal technology platform featuring AI-powered legal literacy and contract validation tools.

## Features

- **AI Legal Assistant**: Get instant answers to legal questions with our advanced AI chatbot
- **Contract Validator**: Analyze contracts for potential issues and improvement recommendations
- **RAG Search**: Search across legal documents with AI-powered retrieval and get accurate answers with citations
- **Data Preparation**: Prepare, clean, and structure legal documents for AI model fine-tuning
- **Fine-Tuning Management**: Create, monitor, and manage fine-tuning jobs for legal language models

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment variables template:

```bash
cp .env.example .env
```

4. Update the `.env` file with your Supabase and Gemini API credentials

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your Supabase URL and anon key from the project settings
3. Add them to your `.env` file:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Gemini API Setup

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file:

```
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### Supabase Edge Functions Configuration

For the RAG functionality to work properly, you need to configure the Gemini API key in your Supabase Edge Functions:

1. Navigate to your Supabase project dashboard
2. Go to the "Edge Functions" section in the sidebar
3. Click on "Settings" (or the gear icon)
4. Under "Environment Variables", add a new variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
5. Save the changes
6. Redeploy the `document-embeddings` and `rag-query` Edge Functions

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Building for Production

```bash
npm run build
```

## Project Structure

- `/src`: Frontend React application
  - `/components`: Reusable UI components
  - `/hooks`: Custom React hooks
  - `/pages`: Page components
  - `/services`: API and service integrations
  - `/utils`: Utility functions
- `/supabase`: Supabase configuration
  - `/functions`: Edge Functions for serverless backend logic
  - `/migrations`: Database migrations

## Technologies

- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Supabase for backend and authentication
- Google Gemini Pro for AI capabilities