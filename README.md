<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Wawa's 20th Birthday Surprise

Interactive birthday surprise website (React + Vite + Tailwind).

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`

## Add photos to the timeline

- Put your images in `public/photos/`
- Then update the `timelineItems` list in `src/App.tsx` to match your filenames.

## Add background music

- Put an audio file at `public/music.mp3`
- Music starts automatically right after the survey is completed (on the "Lihat Hasil Analisis" click). Some browsers still require an explicit user interaction—this click satisfies it.
