# Synapse Notes

A full-stack academic productivity SaaS application for document annotation, media linking, and AI-powered intelligence. Built with Next.js, Supabase, and OpenAI.

## Features

### Core Functionality
- **Document Management**: Upload and annotate PDF and DOCX files
- **Media Integration**: Upload audio/video with automatic transcription
- **Annotation System**: Highlights, drawings, text notes, and shapes
- **Split-View Mode**: View and annotate two documents side-by-side
- **Media Linking**: Link annotations to specific media timestamps
- **Project Organization**: Organize documents and media into projects and folders

### AI Intelligence
- **Automatic Transcription**: Using OpenAI Whisper API
- **Document Summaries**: AI-generated summaries per document/media/project
- **Semantic Search**: Search across documents, transcripts, and annotations using embeddings
- **Ask Questions**: Query your entire project with natural language

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Vector Search)
- **AI**: OpenAI API (Whisper, GPT-4, Embeddings)
- **UI Components**: shadcn/ui
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- OpenAI API account

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase (Already configured via Softgen integration)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The database schema is already created via Supabase migrations. Tables include:

- `profiles` - User profiles
- `projects` - User projects
- `folders` - Project folder organization
- `documents` - Uploaded PDF/DOCX files
- `media_files` - Audio/video files
- `annotations` - Document annotations with optional media timestamps
- `transcripts` - Auto-generated transcripts
- `embeddings` - Vector embeddings for semantic search

All tables have Row Level Security (RLS) enabled for data privacy.

### Storage Buckets

Two storage buckets are configured in Supabase:

1. **documents** - For PDF and DOCX files
2. **media** - For audio and video files

## Project Structure

```
src/
├── components/
│   ├── dashboard/         # Dashboard UI components
│   ├── workspace/         # Document viewer, media panel, annotations
│   └── ui/                # shadcn/ui components
├── services/
│   ├── authService.ts     # Authentication
│   ├── projectService.ts  # Project management
│   ├── documentService.ts # Document CRUD + annotations
│   ├── mediaService.ts    # Media files + transcripts
│   └── aiService.ts       # AI features wrapper
├── pages/
│   ├── api/ai/           # AI API routes (transcribe, summarize, search, ask)
│   ├── auth/             # Login/register pages
│   ├── dashboard/        # Dashboard + project workspace
│   └── index.tsx         # Landing page
├── integrations/
│   └── supabase/         # Supabase client + types
└── styles/
    └── globals.css       # Global styles
```

## Key Features Implementation

### Document Viewer
- Render PDF/DOCX files (placeholder in MVP - integrate PDF.js or react-pdf for production)
- Canvas overlay for annotations
- Zoom controls and page navigation
- Split-view support for comparing documents

### Media Player
- Audio/video playback with controls
- Synced transcript display
- Click-to-jump functionality (transcript → media, annotation → media)
- Timeline scrubbing

### Annotation System
- Toolbar with multiple annotation tools (highlight, draw, text, shapes)
- Color picker for customization
- Undo/redo support
- Persistent storage linked to user and document

### AI Integration
The AI layer is accessible via API routes in `/api/ai/`:

- **`/api/ai/transcribe`** - Generate transcript from audio/video
- **`/api/ai/summarize`** - Summarize document/media/project
- **`/api/ai/search`** - Semantic search using embeddings
- **`/api/ai/ask`** - Q&A with context retrieval
- **`/api/ai/embed`** - Generate embeddings for text

## Development Workflow

1. **Add Features**: Extend services in `src/services/`
2. **Update UI**: Add components in `src/components/`
3. **API Routes**: Create new routes in `src/pages/api/`
4. **Database Changes**: Update schema via Supabase dashboard or migrations

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Backend (Supabase)
Already configured and running. No additional deployment needed.

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Mobile app (iOS/Android)
- [ ] Export annotations as PDF
- [ ] OCR for scanned documents
- [ ] Advanced AI features (auto-tagging, concept maps)
- [ ] Public sharing and collaboration
- [ ] Integration with note-taking apps (Notion, Obsidian)

## License

MIT

## Support

For issues or questions, please contact support or open an issue on GitHub.