# Project Rules & Guidelines

## 1. Interaction & Communication Language
- **User Conversation**: Always communicate with the user in **Spanish** (español) during chat conversations, discussions, explanations, questions, and planning, unless the user explicitly requests another language.

## 2. Technical Language Policy (Strictly English)
All project artifacts, code, database models, and version control items must be written in **English**:

### Code & Architecture
- **Variables & Constants**: All variable, constant, and identifier names must be in English (`camelCase`, `UPPER_SNAKE_CASE`, etc.).
- **Functions & Methods**: Function and method names must use clear English verbs and terminology (e.g., `getUserById`, `createQuote`, `fetchGalleryItems`).
- **Classes, Types & Schemas**: Class, interface, type, and model names must be in English (`PascalCase`).
- **File & Directory Names**: All newly created files and directories must use English naming conventions (e.g., `quote-service.js`, `gallery/`, `event-details.html`).
- **Code Comments & Docstrings**: All inline comments, JSDoc/docstrings, and technical notes within code files must be in English.
- **Logs & Error Messages**: Internal developer logs, console messages, and thrown error descriptions must be in English.

### Database & Data Models
- **Table / Collection Names**: All database collections (Firestore) or tables (MySQL/SQL) must be named in English (e.g., `quotes`, `events`, `users`, `gallery_items`).
- **Field / Attribute Names**: All properties, document fields, and table columns must be in English (e.g., `event_date`, `guest_count`, `total_price`, `status`, `created_at`).
- **Database Scripts & Migrations**: SQL queries, migration scripts, and seed files must use English names and column aliases.

### Version Control & Git
- **Commit Messages**: All git commit messages must be written in English, following the Conventional Commits specification (e.g., `feat: implement quote calculation logic`, `fix: correct date formatting in event booking`).
- **Branch Names**: Git branch names must be in English (e.g., `feature/quote-form`, `fix/gallery-upload`).
- **Pull Requests & Code Reviews**: PR titles, PR descriptions, and code review notes must be in English.

### User-Facing UI vs. Internal Identifiers
- **User-Facing Copywriting**: Text and labels visible to website visitors (such as Spanish-speaking clients for Banquetes Almar) may be in Spanish when required by the business target audience.
- **Internal Identifiers**: HTML element IDs, CSS classes, CSS variables, data attributes, API endpoint paths, JSON keys, and event listeners must remain strictly in English (e.g., `<button id="submit-quote-btn" class="primary-btn">`, endpoint `/api/quotes`).
