# Vision Canva

Vision Canva is an AI-powered infinite canvas prototype that transforms unstructured text into an interactive entity-relationship graph. It explores how generated structure can become something editable and visual instead of another block of text.

View the AI Studio prototype: https://ai.studio/apps/b069e4d7-1e98-4472-9f17-4119e14e27f4

## What It Explores

- Extracting entities and relationships from messy text.
- Force-directed graph layout for generated knowledge structures.
- Turning AI output into a visual object that can be inspected.
- Where confidence, editing, and source traceability would need to appear in a real tool.

## Technical Notes

- React and Vite frontend.
- Gemini API integration through `@google/genai`.
- D3 force layout and Recharts for visual structure.
- Motion, clsx, tailwind-merge, and lucide-react for UI behavior.

## Current Status

This is a prototype source repo. It demonstrates the interaction pattern, but production use would require editable nodes, source citations, confidence scoring, large-input handling, and persistence.

## Run Locally

Prerequisite: Node.js.

1. Install dependencies:
   `npm install`
2. Create `.env.local` and add your own Gemini API key.
3. Run the app:
   `npm run dev`

## API Key Boundary

Do not deploy this Vite app with a private Gemini key embedded into browser JavaScript. If deploying outside AI Studio, use a server-side API route or an explicit visitor-provided key flow.

## AI-Assisted Build Note

This prototype was built with AI assistance. The useful work is the conversion of a raw generation task into a product surface with inspectable structure, interaction states, and clear next hardening steps.

## Related Public Notes

See the combined prototype overview repo: https://github.com/brycejohnson1417/ai-studio-prototype-overviews
