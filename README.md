# LightningCraft

Browser-based visual builder for Salesforce Lightning Web Components (LWC).

Drag components onto a canvas, nest them using Salesforce composition rules, configure supported properties, preview the result, and copy LWC HTML.

## Requirements

- Node.js 20.9 or later

## Scripts

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

## Environment variables

None. This MVP is client-side only and does not require a backend, database, or API keys.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Zustand, dnd-kit.
