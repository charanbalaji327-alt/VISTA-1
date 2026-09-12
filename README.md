# VISTA Ultimate — AI Motion & Fitness Tracker

## Included upgrades
- Profile + weekly goals
- Dashboard metrics
- GPS route tracking, distance, speed and OSM map
- Activity catalogue with Form Review screen
- Webcam and video upload
- MediaPipe Pose Landmarker integration (Tasks Vision 1.0.1 runtime)
- Exercise-specific pose metrics for push-ups, squats, lunges and plank
- Automatic movement/repetition estimation where landmarks are available
- Form score, consistency score, findings and coaching recommendations
- Live webcam coaching
- Workout history with local browser persistence
- Progress charts
- Water tracking and daily hydration target
- Meal reminders
- Nutrition targets
- Report popup after analysis
- Save report to Desktop using the browser file picker
- Print / Save report as PDF
- Responsive mobile layout

## Run
1. Extract the ZIP.
2. Open PowerShell in the extracted folder.
3. Run `npm install` (optional) and then `npm run dev`.
4. Open the local Vite URL shown in the terminal, usually `http://localhost:5173/`.
5. You can also open `index.html` directly, but `npm run dev` is recommended for webcam/GPS behavior.
3. For webcam/GPS, browser permissions are required.
4. Pose analysis loads the MediaPipe model from Google's public model hosting, so internet access is required for the AI pose layer.
5. If the pose model cannot load, VISTA automatically falls back to frame-motion analysis and clearly labels the fallback.

## Important
This is a client-side prototype. Profile, workout history, reminders and nutrition settings are stored in localStorage. There is no real account system or cloud database in this ZIP.

The pose layer is an on-device/browser-side analysis aid, not a medical diagnostic system. Camera angle, lighting, clothing, occlusion and exercise visibility affect accuracy.

## Production next steps
- Move authentication and history to a secure backend/database.
- Serve the site over HTTPS.
- Pin and self-host model/runtime assets for reproducible deployments.
- Add a backend for optional LLM-generated coaching rather than exposing an API key in the browser.
- Add automated tests and accessibility QA.
# VISTA
