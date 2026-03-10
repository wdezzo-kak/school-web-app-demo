# School Skills & Behavior Management App

A web application for managing student skills, behaviors, and attendance. Built with React 19, Vite, Tailwind CSS v4, and Supabase.

## Features

- **Three Portals**: Admin, Teacher, and Parent dashboards
- **Student Management**: Add, edit, and manage students
- **Skill Tracking**: Teachers can log and track student skills
- **Behavior Logging**: Record student behaviors (positive and negative)
- **Attendance**: Daily attendance tracking
- **Notifications**: Real-time notifications for parents
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Supports system-based dark/light theme

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123456 |
| Teacher | teacher@school.com | test123456 |
| Parent | parent@school.com | test123456 |

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth)
├── pages/           # Page components
│   ├── admin/       # Admin portal pages
│   ├── teacher/     # Teacher portal pages
│   └── parent/      # Parent portal pages
└── App.tsx          # Main app with routing
```

## License

MIT
