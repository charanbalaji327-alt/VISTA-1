# Run VISTA Fitness

Open PowerShell in this folder and run:

```powershell
cd "C:\Users\PRATHISH\Documents\Codex\2026-09-08\build-x20\VISTA Fitness\app"
npm run dev

Open http://localhost:4173/ in your browser.
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

For form analysis, use Chrome or Edge, allow camera access when using the webcam, and keep an internet connection available for the MediaPipe pose model's first load.

Validated automatic form reports currently cover Push-Ups, Squats, Lunges, Plank, and Jumping Jacks. Other movements use landmark visibility only until their exercise-specific model/rules are validated.
