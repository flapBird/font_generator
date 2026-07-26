 # Font Generators
 
 **[https://font-generators.org/](https://font-generators.org/)**
 
 A Unicode text style generator that converts plain text into decorative Unicode characters. Every style lives in the browser — text is never uploaded to a server.
 
 ## How It Works
 
 The generator maps each letter you type to a corresponding character from a different Unicode block. The core set comes from the Mathematical Alphanumeric Symbols block (U+1D400–U+1D7FF), which contains complete alphabets in bold, italic, script, fraktur, double-struck, and monospace styles. Additional character sets come from other Unicode blocks — Enclosed Alphanumerics for circled and squared letters, Letterlike Symbols for script characters, and combining diacritical marks for strikethrough and other effects.
 
 Because the output is made of standard Unicode characters, it survives copy-paste across virtually every platform and application — no CSS, font embedding, or formatting tricks needed.
 
 ## Features
 
 - **Real-time conversion** — text transforms instantly as you type
 - **20+ Unicode styles** — bold, italic, script, fraktur, double-struck, monospace, circled, squared, fullwidth, small caps, superscript, subscript, inverted, strikethrough, and more
 - **One-click copy** — every result row has a copy button
 - **Client-side only** — no data leaves your browser
 - **32 style pages** — each focused on a specific style with its own content, examples, and FAQ
 - **4 fandom pages** — style guides inspired by pop culture franchises
 - **2 guide pages** — articles about Unicode text and community recommendations
 
 ## Tech Stack
 
 | Layer | Technology |
 |---|---|
 | Framework | [Next.js](https://nextjs.org/) 16 |
 | UI Library | [React](https://react.dev/) 19 |
 | Styling | [Tailwind CSS](https://tailwindcss.com/) 3 |
 | Animations | [Framer Motion](https://www.framer.com/motion/) |
 | Languages | TypeScript, CSS |
 
 ## Project Structure
 
 ```
 app/
 ├── layout.tsx          # Root layout (navigation, analytics, metadata)
 ├── page.tsx            # Homepage — main Unicode generator
 ├── sitemap.ts          # Dynamic sitemap generation
 ├── robots.ts           # Robots.txt
 ├── about/              # About page
 ├── privacy/            # Privacy policy
 ├── terms/              # Terms of service
 ├── styles/             # Style generator pages (32 pages)
 │   ├── page.tsx        # Styles index
 │   └── [slug]/         # Individual style pages (dynamic routes)
 ├── fandom/             # Fandom style pages (4 pages)
 │   ├── page.tsx        # Fandom index
 │   └── [slug]/         # Individual fandom pages (dynamic routes)
 └── guides/             # Guide articles (2 pages)
     ├── page.tsx        # Guides index
     └── [slug]/         # Individual guide pages (dynamic routes)
 
 components/
 ├── PageTemplate.tsx     # Reusable layout for style/fandom pages
 ├── GuideTemplate.tsx    # Article layout for guide pages
 ├── Header.tsx           # Site header with navigation
 └── Footer.tsx           # Site footer with link grid
 
 lib/
 ├── fonts.ts             # Unicode character mappings and conversion utilities
 └── data.ts              # Page content definitions (metadata, FAQ, examples)
 ```
 
 ## Getting Started
 
 ```bash
 # Install dependencies
 npm install
 
 # Set up environment variables
 cp .env.local.example .env.local
 
 # Start development server
 npm run dev
 ```
 
 Open [http://localhost:3000](http://localhost:3000) in your browser.
 
 To build for production:
 
 ```bash
 npm run build
 ```
 
 ## Environment Variables
 
 | Variable | Purpose |
 |---|---|
 | `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID |
 
 ## Deployment
 
 Build the project and deploy the `.next` output directory to any Node.js hosting platform (Vercel, Netlify, Railway, etc.). The site is fully static — all pages are pre-rendered at build time.
 
 ## License
 
 MIT
