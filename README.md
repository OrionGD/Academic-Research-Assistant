# ScholarAI - Academic Research Assistant

This is a production-ready frontend for an AI-powered academic research platform.

## Features

- **Paper Upload**: Drag-and-drop PDF upload with metadata extraction.
- **AI Analysis**: Automated summaries, methodology breakdown, and key concepts.
- **Semantic Search**: Natural language search across your research library.
- **AI Chat**: Conversational assistant that can answer questions about your papers with citations.
- **Paper Comparison**: Side-by-side AI comparison of multiple research papers.
- **Dashboard**: Overview of research activity and library stats.

## Tech Stack

- **React 19**
- **Vite**
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion**
- **Lucide Icons**
- **Firebase Authentication**
- **Axios**
- **React Router DOM v7**

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file based on `.env.example` and fill in your Firebase and API configuration.
   ```env
   VITE_API_URL=https://your-api-url.com/api
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Build**:
   ```bash
   npm run build
   ```

## Folder Structure

- `src/components`: Reusable UI components and layouts.
- `src/pages`: Full page implementations.
- `src/services`: API and Firebase service layers.
- `src/context`: React Context for global state (Auth).
- `src/types`: TypeScript interfaces and types.
- `src/utils`: Helper functions.
