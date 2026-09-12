const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = {
  profile: JSON.parse(localStorage.getItem("vista-profile") || "null"),
  history: JSON.parse(localStorage.getItem("vista-history") || "[]"),
  routeHistory: JSON.parse(localStorage.getItem("vista-route-history") || "[]"),
  water: JSON.parse(localStorage.getItem("vista-water") || "{}"),
  nutrition: JSON.parse(localStorage.getItem("vista-nutrition") || '{"calories":2400,"protein":150,"carbs":280,"fat":75}'),
  reminders: JSON.parse(localStorage.getItem("vista-reminders") || "[]"),
  selectedExercise: localStorage.getItem("vista-selected-exercise") || "Push-Ups",
  currentReport: null,
  stream: null,
  watchId: null,
  previousPoint: null,
  routePoints: [],
  goalAlerted: false,
  trackingStartedAt: null,
  trackingStartedPosition: null,
  totalKm: 0,
  lastPosition: null,
  liveMode: false,
  poseLandmarker: null,
  poseReady: false,
  liveReps: 0,
  liveGoodFrames: 0,
  liveFrames: 0,
  livePhase: "Ready",
  liveRepState: "up",
  liveLastPhaseValue: null,
  liveStartedAt: 0,
  liveLastFrameTime: 0,
  liveRepStartedAt: 0,
  liveCycleGoodFrames: 0,
  liveCycleFrames: 0,
  liveCooldown: 0,
  liveHistory: []
};

state.workoutPlan=JSON.parse(localStorage.getItem("vista-workout-plan")||"[]");
state.goals=JSON.parse(localStorage.getItem("vista-goals")||"{}");
state.reflections=JSON.parse(localStorage.getItem("vista-reflections")||"[]");

/* Theme */
function applyTheme(theme){
  const next=theme==="light"?"light":"dark";
  document.documentElement.dataset.theme=next;
  localStorage.setItem("vista-theme",next);
  const button=$("#themeToggle");
  if(button){
    button.textContent=next==="dark"?"Light theme":"Dark theme";
    button.setAttribute("aria-label",next==="dark"?"Switch to light theme":"Switch to dark theme");
  }
}
applyTheme(localStorage.getItem("vista-theme")||"dark");

const exerciseRules = {
  "Push-Ups": { category:"Strength", primary:"Elbow angle", range:"Shoulder-to-hip alignment", good:"Keep a straight line from shoulders through hips and control the descent.", cues:["Keep elbows roughly 30–60° from your torso.","Lower until your upper arms approach parallel with the floor.","Avoid letting your hips sag or pike."] },
  "Squats": { category:"Strength", primary:"Knee angle", range:"Hip depth", good:"Keep the chest controlled while reaching a consistent depth.", cues:["Aim for a repeatable squat depth.","Track knees in line with toes.","Keep your torso stable through the ascent."] },
  "Lunges": { category:"Strength", primary:"Front knee angle", range:"Stride consistency", good:"Use a stable stance and controlled vertical movement.", cues:["Keep the front knee tracking over the foot.","Avoid collapsing the torso forward.","Use similar depth on both sides."] },
  "Plank": { category:"Strength", primary:"Body alignment", range:"Hip height", good:"Maintain a long, stable line from shoulders to heels.", cues:["Keep hips from dropping or lifting too high.","Brace the abdomen throughout the hold.","Keep the neck neutral."] },
  "Jumping Jacks": { category:"Cardio", primary:"Rhythm", range:"Arm/leg excursion", good:"Maintain a repeatable opening and closing cycle.", cues:["Land softly with knees slightly bent.","Keep the rhythm consistent.","Use a comfortable range of motion."] },
  "Yoga Flow": { category:"Flexibility", primary:"Stability", range:"Hold duration", good:"Move smoothly and keep stable positions.", cues:["Use controlled transitions.","Keep breathing steady.","Avoid forcing range of motion."] },
  "Running": { category:"Cardio", primary:"Cadence", range:"Stride consistency", good:"Keep cadence and posture consistent.", cues:["Maintain a relaxed upright posture.","Aim for consistent cadence.","Avoid excessive vertical bounce."] },
  "Para-athlete strength": { category:"Adaptive strength", primary:"Comfortable control", range:"Stable range of motion", good:"Use the setup that feels safe and repeatable for your body.", cues:["Choose stable equipment and a comfortable range.","Keep movements controlled rather than rushed.","Stop if you feel pain or loss of control."] },
  "Cricket bowling": { category:"Sport technique", primary:"Run-up and release", range:"Balanced follow-through", good:"Build a repeatable, balanced action before adding speed.", cues:["Keep the approach controlled.","Land in a balanced position.","Use this guide alongside qualified coaching."] },
  "Football kick": { category:"Sport technique", primary:"Plant foot and follow-through", range:"Controlled contact", good:"Focus on balance, a stable plant foot and a relaxed follow-through.", cues:["Keep the supporting foot stable.","Use a comfortable range of motion.","Build accuracy before power."] },
  "Badminton / tennis": { category:"Racket sport", primary:"Ready position", range:"Balanced recovery", good:"Stay balanced through the stroke and recover to a comfortable ready position.", cues:["Keep knees softly bent.","Avoid forcing shoulder range.","Recover your balance after each stroke."] }
};

function saveAll(){
  localStorage.setItem("vista-profile", JSON.stringify(state.profile));
  localStorage.setItem("vista-history", JSON.stringify(state.history));
  localStorage.setItem("vista-route-history", JSON.stringify(state.routeHistory));
  localStorage.setItem("vista-water", JSON.stringify(state.water));
  localStorage.setItem("vista-nutrition", JSON.stringify(state.nutrition));
  localStorage.setItem("vista-reminders", JSON.stringify(state.reminders));
  localStorage.setItem("vista-selected-exercise", state.selectedExercise);
  localStorage.setItem("vista-workout-plan",JSON.stringify(state.workoutPlan));
  localStorage.setItem("vista-goals",JSON.stringify(state.goals));
  localStorage.setItem("vista-reflections",JSON.stringify(state.reflections));
}

function showApp(){
  $("#opening").remove();
  $("#app").hidden = false;
  $("#profileSetup").hidden = true;
  $("#main").hidden = false;
  renderAll();
}
setTimeout(showApp, 850);

$("#profileForm").addEventListener("submit", e=>{
  e.preventDefault();
  const profile={name:$("#profileName").value.trim(),age:+$("#profileAge").value,height:+$("#profileHeight").value,weight:+$("#profileWeight").value,sex:$("#profileSex").value,activity:Number($("#profileActivity").value)||1.55,weeklyTarget:+$("#weeklyTarget").value||4};
  if(!profile.name||!profile.age||!profile.height||!profile.weight){$("#profileError").textContent="Please complete all profile fields.";return;}
  state.profile=profile; saveAll(); $("#profileSetup").hidden=true; $("#main").hidden=false; renderAll();
});

$("#profileChip").addEventListener("click",()=>{
  const profile=state.profile;
  if(profile){
    $("#profileName").value=profile.name||"";
    $("#profileAge").value=profile.age||"";
    $("#profileHeight").value=profile.height||"";
    $("#profileWeight").value=profile.weight||"";
    $("#profileSex").value=profile.sex||"";
    $("#profileActivity").value=String(profile.activity||1.55);
    $("#weeklyTarget").value=profile.weeklyTarget||4;
  }
  $("#profileError").textContent="";
  $("#profileSetup").hidden=false;
});
$("#themeToggle").addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
$("#closeProfileButton").addEventListener("click",()=>$("#profileSetup").hidden=true);
$("#profileSetup").addEventListener("click",e=>{if(e.target === $("#profileSetup")) $("#profileSetup").hidden=true;});

function initials(name){return name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}
function renderAll(){
  $("#profileChip").textContent=initials(state.profile?.name||"User");
  $("#profileSummary").textContent=`${state.profile?.name||"Athlete"} · ${state.profile?.age||""} years`;
  $("#dashWorkoutGoal").textContent=`/ ${state.profile?.weeklyTarget||4} goal`;
  renderDashboard(); renderProgress(); renderNutrition(); setExercise(state.selectedExercise,false);
}
function renderDashboard(){
  const weekAgo=Date.now()-7*86400000;
  const recent=state.history.filter(x=>new Date(x.date).getTime()>=weekAgo);
  $("#dashWorkouts").textContent=recent.length;
  $("#dashScore").textContent=recent[0]?.score??"—";
  const routeDistance=state.routeHistory.reduce((s,x)=>s+(x.distance||0),0);
  $("#dashDistance").textContent=routeDistance.toFixed(2);
  $("#dashWater").textContent=(getTodayWater()/1000).toFixed(2);
}
function navigate(page){
  $$(".page").forEach(p=>p.classList.remove("active-page"));
  $(`#${page}`).classList.add("active-page");
  $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.nav===page));
  location.hash=page;
  if(page==="progress") renderProgress();
  if(page==="nutrition") renderNutrition();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-btn").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));
$("#openWorkoutButton").addEventListener("click",()=>navigate("workout"));
$("#backHome").addEventListener("click",()=>navigate("home"));

$$(".category-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
  $$(".category-tabs button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");
  const cat=btn.dataset.category;
  $$(".discipline-card").forEach(c=>c.hidden=cat!=="all"&&c.dataset.category!==cat);
}));
$$(".discipline-card").forEach(card=>card.addEventListener("click",()=>{
  $$(".discipline-card").forEach(c=>c.classList.remove("selected"));card.classList.add("selected");
  setExercise(card.dataset.exercise,true);
}));

function setExercise(name,go){
  state.selectedExercise=name;saveAll();
  const rule=exerciseRules[name]||{category:"Movement",primary:"Technique guide",range:"Comfortable control",good:"Use steady, comfortable movement and keep your full body visible.",cues:["Move at a controlled pace.","Use a clear, well-lit camera angle.","Stop if you feel pain or discomfort."]};
  $("#selectedExerciseTitle").textContent=name;
  $("#selectedExerciseHint").textContent=`${rule.category} · ${rule.primary} · ${rule.range}. Upload a clear full-body video for the best result.`;
  $("#movementFeedback").textContent=`${name} selected. Form Review is ready.`;
  renderCameraGuide(name);
  renderExerciseGuide(name);
  if(go) navigate("workout");
}
window.addEventListener("vista:select-exercise",event=>setExercise(event.detail,true));

const cameraGuides={
  "Push-Ups":"Use a side view at hip height. Keep hands, shoulders, hips and feet visible for 5–10 controlled repetitions.",
  "Squats":"Use a side or 45° front-side view. Show your full body including both feet for 5–10 repetitions.",
  "Lunges":"Use a side view with enough space for the full stride. Keep both feet in frame for 5–10 repetitions.",
  "Plank":"Use a side view at hip height. Hold still for 10–20 seconds with shoulders, hips, knees and ankles visible.",
  "Jumping Jacks":"Use a front view from several steps away. Keep hands and feet visible throughout 10 repetitions.",
  "Running":"Use a side view with your entire stride visible. Record 8–12 seconds on stable ground.",
  "Yoga Flow":"Use a side view and move slowly. Keep your entire body in frame during every transition."
};
function renderCameraGuide(name){
  const guide=$("#cameraGuide");if(!guide)return;
  guide.innerHTML=`<b>${escapeHtml(name)} recording guide</b><span>${escapeHtml(cameraGuides[name]||"Use a stable, well-lit camera position and keep the full body visible.")}</span>`;
}

/* GPS */
const rad=d=>d*Math.PI/180;
function haversine(a,b){
  const R=6371, dLat=rad(b.latitude-a.latitude), dLon=rad(b.longitude-a.longitude);
  const x=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function pointLabel(point){
  return point ? `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}` : "—";
}
function formatDuration(milliseconds){
  const seconds=Math.max(0,Math.round(milliseconds/1000));
  const hours=Math.floor(seconds/3600), minutes=Math.floor((seconds%3600)/60), remainder=seconds%60;
  return hours ? `${hours}h ${minutes}m ${remainder}s` : `${minutes}m ${remainder}s`;
}
function updateRouteCanvas(){
  const canvas=$("#routeCanvas");
  if(!canvas || !state.routePoints.length)return;
  const cssWidth=Math.max(320,canvas.clientWidth||500), cssHeight=Math.max(190,Math.round(cssWidth*.48));
  const ratio=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(cssWidth*ratio);canvas.height=Math.round(cssHeight*ratio);
  const draw=canvas.getContext("2d");draw.setTransform(ratio,0,0,ratio,0,0);
  draw.clearRect(0,0,cssWidth,cssHeight);draw.fillStyle="#09182e";draw.fillRect(0,0,cssWidth,cssHeight);
  const points=state.routePoints;
  const lats=points.map(p=>p.latitude), lons=points.map(p=>p.longitude);
  const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLon=Math.min(...lons),maxLon=Math.max(...lons);
  const latSpan=Math.max(maxLat-minLat,.00012),lonSpan=Math.max(maxLon-minLon,.00012),padding=32;
  const scale=Math.min((cssWidth-padding*2)/lonSpan,(cssHeight-padding*2)/latSpan);
  const routeWidth=lonSpan*scale,routeHeight=latSpan*scale,originX=(cssWidth-routeWidth)/2,originY=(cssHeight-routeHeight)/2;
  const project=p=>({x:originX+(p.longitude-minLon)*scale,y:cssHeight-(originY+(p.latitude-minLat)*scale)});
  draw.strokeStyle="rgba(255,255,255,.07)";draw.lineWidth=1;
  for(let x=24;x<cssWidth;x+=48){draw.beginPath();draw.moveTo(x,0);draw.lineTo(x,cssHeight);draw.stroke();}
  for(let y=24;y<cssHeight;y+=48){draw.beginPath();draw.moveTo(0,y);draw.lineTo(cssWidth,y);draw.stroke();}
  const first=project(points[0]);
  draw.beginPath();draw.moveTo(first.x,first.y);
  points.slice(1).forEach(point=>{const p=project(point);draw.lineTo(p.x,p.y)});
  draw.strokeStyle="#ff632e";draw.lineWidth=4;draw.lineJoin="round";draw.lineCap="round";draw.stroke();
  const last=project(points.at(-1));
  [[first,"#55dfb3","Start"],[last,"#ff632e",state.watchId!==null?"Live":"End"]].forEach(([p,color,label])=>{
    draw.beginPath();draw.arc(p.x,p.y,7,0,Math.PI*2);draw.fillStyle=color;draw.fill();draw.strokeStyle="#ffffff";draw.lineWidth=2;draw.stroke();
    draw.fillStyle="#eef5ff";draw.font="600 12px system-ui";draw.fillText(label,p.x+11,p.y-10);
  });
}
function showRouteReport(){
  const report=$("#routeReport");
  if(!state.routePoints.length){report.hidden=true;return;}
  const start=state.trackingStartedPosition||state.routePoints[0];
  const end=state.routePoints.at(-1);
  const duration=Date.now()-(state.trackingStartedAt||Date.now());
  const averageKmh=duration>0?state.totalKm/(duration/3600000):0;
  const goal=Number($("#distanceGoal").value)||0;
  $("#routeStart").textContent=pointLabel(start);$("#routeEnd").textContent=pointLabel(end);
  $("#routeSummary").textContent=`${state.totalKm.toFixed(2)} km · ${formatDuration(duration)} · average ${averageKmh.toFixed(1)} km/h${goal?` · ${state.totalKm>=goal?"goal reached":"goal in progress"}`:""}`;
  report.hidden=false;updateRouteCanvas();
}
function updatePosition(pos){
  const c=pos.coords; state.lastPosition=c;
  if((c.accuracy||0)>120){$("#mapOverlay").textContent=`GPS accuracy is ±${Math.round(c.accuracy)} m. Move outdoors for a more accurate route.`;$("#trackingFeedback").textContent="Waiting for a more accurate GPS point before adding it to your route.";return;}
  const point={latitude:c.latitude,longitude:c.longitude,accuracy:c.accuracy||0,timestamp:Date.now()};
  $("#latitude").textContent=c.latitude.toFixed(6);$("#longitude").textContent=c.longitude.toFixed(6);
  if(!state.trackingStartedPosition){state.trackingStartedPosition=point;state.routePoints=[point];}
  const previous=state.routePoints.at(-1);
  const gap=previous?haversine(previous,point):0;
  if(previous && gap>=.003){state.totalKm+=gap;state.routePoints.push(point);}
  state.previousPoint=point;
  $("#distance").textContent=`${state.totalKm.toFixed(2)} km`;
  const kmh=(c.speed&&c.speed>0)?c.speed*3.6:0;$("#speed").textContent=`${kmh.toFixed(1)} km/h`;
  $("#locationState").textContent="Tracking live";$("#mapOverlay").textContent=`Accuracy ±${Math.round(c.accuracy||0)} m`;
  $("#mapFrame").src=`https://www.openstreetmap.org/export/embed.html?bbox=${c.longitude-.008}%2C${c.latitude-.006}%2C${c.longitude+.008}%2C${c.latitude+.006}&layer=mapnik&marker=${c.latitude}%2C${c.longitude}`;
  if(c.speed>0) $("#paceReadout").textContent=`Pace ${(60/(kmh||1)).toFixed(1)} min/km`;
  const goal=Number($("#distanceGoal").value)||0;
  if(goal && state.totalKm>=goal && !state.goalAlerted){state.goalAlerted=true;notifyGoalReached(goal);}
  $("#routeReport").hidden=false;updateRouteCanvas();
}
function notifyGoalReached(goal){
  $("#trackingFeedback").textContent=`Goal reached: ${goal.toFixed(2)} km. You can stop tracking when ready.`;
  try{const audio=new (window.AudioContext||window.webkitAudioContext)(),osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=880;gain.gain.setValueAtTime(.06,audio.currentTime);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.22);}catch{}
  if("Notification" in window&&Notification.permission==="granted")new Notification("VISTA distance goal reached",{body:`You reached your ${goal.toFixed(2)} km goal.`});
}
function stopTracking(){
  if(state.watchId!==null)navigator.geolocation.clearWatch(state.watchId);
  state.watchId=null;state.previousPoint=null;
  $("#trackButton").textContent="Start tracking";$("#locationState").textContent="Route completed";
  $("#resetTrackButton").hidden=false;
  if(state.routePoints.length){
    showRouteReport();
    const start=state.trackingStartedPosition||state.routePoints[0],end=state.routePoints.at(-1),duration=Date.now()-(state.trackingStartedAt||Date.now());
    state.routeHistory.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),distance:state.totalKm,duration,start:{latitude:start.latitude,longitude:start.longitude},end:{latitude:end.latitude,longitude:end.longitude},points:state.routePoints.map(point=>({latitude:point.latitude,longitude:point.longitude,timestamp:point.timestamp}))});
    state.routeHistory=state.routeHistory.slice(0,100);saveAll();renderDashboard();renderProgress();
    $("#trackingFeedback").textContent=`Route complete and saved locally. Start and end points were recorded from your GPS.`;
  }
  else $("#trackingFeedback").textContent="No GPS point was received, so no route was recorded.";
}
$("#trackButton").addEventListener("click",()=>{
  if(state.watchId!==null){stopTracking();return}
  if(!navigator.geolocation){$("#trackingFeedback").textContent="This browser does not support GPS.";return}
  state.totalKm=0;state.previousPoint=null;state.routePoints=[];state.trackingStartedPosition=null;state.trackingStartedAt=Date.now();state.goalAlerted=false;
  $("#distance").textContent="0.00 km";$("#speed").textContent="0.0 km/h";$("#paceReadout").textContent="—";$("#routeReport").hidden=true;$("#resetTrackButton").hidden=true;
  $("#trackingFeedback").textContent="Requesting location access…";
  state.watchId=navigator.geolocation.watchPosition(updatePosition,()=>{stopTracking();$("#trackingFeedback").textContent="Location permission was unavailable. Check browser location permission and try again."},{enableHighAccuracy:true,maximumAge:3000,timeout:15000});
  $("#trackButton").textContent="Stop tracking";$("#locationState").textContent="Finding start point";
});
$("#resetTrackButton").addEventListener("click",()=>{if(state.watchId!==null)stopTracking();state.totalKm=0;state.previousPoint=null;state.routePoints=[];state.trackingStartedPosition=null;state.trackingStartedAt=null;$("#distance").textContent="0.00 km";$("#speed").textContent="0.0 km/h";$("#paceReadout").textContent="—";$("#latitude").textContent="0.000000";$("#longitude").textContent="0.000000";$("#routeReport").hidden=true;$("#resetTrackButton").hidden=true;$("#locationState").textContent="Location idle";$("#trackingFeedback").textContent="Route reset. Start tracking to record a new route.";});
$("#openMapButton").addEventListener("click",()=>{if(!state.routePoints.length){$("#trackingFeedback").textContent="Start tracking first to open your GPS position on the map.";return}const point=state.routePoints.at(-1),lat=point.latitude,lon=point.longitude;window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}`,"_blank","noopener")});
$("#downloadRouteImageButton").addEventListener("click",()=>{const canvas=$("#routeCanvas");if(!state.routePoints.length){$("#trackingFeedback").textContent="There is no recorded route image yet.";return}canvas.toBlob(blob=>{const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`vista-route-${new Date().toISOString().slice(0,10)}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},"image/png");});
window.addEventListener("resize",()=>{if(!$("#routeReport").hidden)updateRouteCanvas();});

/* Video + pose model */
const video=$("#analysisVideo"), canvas=$("#poseCanvas"), ctx=canvas.getContext("2d");
let currentObjectUrl=null;
$("#cameraButton").addEventListener("click",async()=>{
  try{
    state.stream?.getTracks().forEach(t=>t.stop());
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=state.stream;video.hidden=false;$("#videoPlaceholder").hidden=true;await video.play();
    // A MediaStream has no finite duration, so recorded-video analysis cannot
    // seek through it. Keep that action for uploaded files and use the live
    // coach for webcams.
    $("#analyzeButton").disabled=true;$("#liveAnalyzeButton").disabled=false;$("#videoFeedback").textContent="Webcam connected. Select Live coaching to analyze your movement in real time.";
    await ensurePose();
  }catch(e){$("#videoFeedback").textContent=`Camera could not start: ${e?.message||"check browser permissions and use localhost or HTTPS."}`}
});
$("#videoInput").addEventListener("change",e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(currentObjectUrl)URL.revokeObjectURL(currentObjectUrl);
  state.stream?.getTracks().forEach(t=>t.stop());state.stream=null;
  currentObjectUrl=URL.createObjectURL(file);video.srcObject=null;video.src=currentObjectUrl;video.hidden=false;$("#videoPlaceholder").hidden=true;
  video.onloadedmetadata=async()=>{
    $("#analyzeButton").disabled=false;$("#liveAnalyzeButton").disabled=true;
    $("#videoFeedback").textContent=`${file.name} loaded. Preparing the pose model…`;
    const ready=await ensurePose();
    $("#videoFeedback").textContent=ready?`${file.name} loaded. Pose analysis is ready.`:`${file.name} loaded, but the pose model could not start. Check your internet connection and reload the page.`;
  };
});

async function ensurePose(){
  if(state.poseReady)return true;
  try{
    const {PoseLandmarker,FilesetResolver}=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm");
    const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm");
    const models=[
      ["https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task","GPU"],
      ["https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task","CPU"],
      ["https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task","GPU"],
      ["https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task","CPU"]
    ];
    for(const [modelAssetPath,delegate] of models){
      try{
        state.poseLandmarker=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath,delegate},runningMode:"VIDEO",numPoses:1,minPoseDetectionConfidence:.35,minPosePresenceConfidence:.35,minTrackingConfidence:.35});
        state.poseReady=true;$("#sensorStatus").textContent=`Pose model ready (${modelAssetPath.includes("full")?"full":"lite"} model)`;return true;
      }catch(error){console.warn(`Pose model attempt failed (${delegate})`,error);}
    }
    throw new Error("No compatible pose model could be loaded.");
  }catch(e){$("#sensorStatus").textContent="Pose model unavailable";console.warn(e);return false}
}

function angle(a,b,c){
  if(!a||!b||!c)return 0;
  const ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y};
  const dot=ab.x*cb.x+ab.y*cb.y, den=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);
  return Math.acos(Math.max(-1,Math.min(1,dot/(den||1))))*180/Math.PI;
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function lmAvg(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2}}


function poseFeatures(L){
  const p=i=>L[i];
  const leftVisibility=[11,13,15,23,25,27].reduce((sum,index)=>sum+(p(index)?.visibility??1),0);
  const rightVisibility=[12,14,16,24,26,28].reduce((sum,index)=>sum+(p(index)?.visibility??1),0);
  const side=leftVisibility>=rightVisibility?{sh:11,elbow:13,wrist:15,hip:23,knee:25,ankle:27}:{sh:12,elbow:14,wrist:16,hip:24,knee:26,ankle:28};
  const sh=p(side.sh),hip=p(side.hip),knee=p(side.knee),ankle=p(side.ankle),elbow=p(side.elbow),wrist=p(side.wrist);
  const kneeAngle=angle(hip,knee,ankle);
  const elbowAngle=angle(sh,elbow,wrist);
  const bodyLine=angle(sh,hip,ankle);
  // Deviation from the vertical axis: 0° means upright. The previous formula
  // returned about 180° for an upright person and later treated that as a 90°
  // lean, causing valid squats and lunges to fail.
  const torsoAxisAngle=angle(hip,sh,{x:sh.x,y:sh.y-1,z:sh.z});
  const torsoLean=Math.min(torsoAxisAngle,Math.abs(180-torsoAxisAngle));
  const ankleSpread=dist(p(27),p(28));
  const wristSpread=dist(p(15),p(16));
  const shoulderWidth=Math.max(.01,dist(p(11),p(12)));
  const hipWidth=Math.max(.01,dist(p(23),p(24)));
  return {
    sh,hip,knee,ankle,elbow,wrist,kneeAngle,elbowAngle,bodyLine,torsoLean,side:side.sh===11?"left":"right",
    hipY:hip.y, shoulderY:sh.y, ankleSpread,wristSpread,
    legSpread:ankleSpread/hipWidth, armSpread:wristSpread/shoulderWidth,
    visible:[11,12,13,14,15,16,23,24,25,26,27,28].every(i=>(L[i]?.visibility??1)>.35)
  };
}

function analyzeLandmarks(lms,name){
  const L=lms[0];
  if(!L)return null;
  const f=poseFeatures(L);
  let metrics={}, phaseValue=0, good=true;
  if(name==="Push-Ups"){
    const bodyError=Math.abs(180-f.bodyLine);
    metrics["Average elbow angle"]=`${f.elbowAngle.toFixed(0)}°`;
    metrics["Body alignment error"]=`${bodyError.toFixed(1)}°`;
    metrics["Torso lean"]=`${f.torsoLean.toFixed(0)}°`;
    phaseValue=180-f.elbowAngle;
    good=f.elbowAngle>45&&f.elbowAngle<175&&bodyError<25;
  }else if(name==="Squats"){
    const depthAngle=f.kneeAngle;
    const torsoLean=f.torsoLean;
    metrics["Average knee angle"]=`${depthAngle.toFixed(0)}°`;
    metrics["Hip angle"]=`${angle(f.sh,f.hip,f.knee).toFixed(0)}°`;
    metrics["Torso lean"]=`${torsoLean.toFixed(0)}°`;
    phaseValue=180-depthAngle;
    good=depthAngle>65&&depthAngle<180&&torsoLean<45;
  }else if(name==="Lunges"){
    const left=angle(L[23],L[25],L[27]),right=angle(L[24],L[26],L[28]);
    const active=Math.min(left,right);
    const torsoLean=f.torsoLean;
    metrics["Front knee angle"]=`${active.toFixed(0)}°`;
    metrics["Torso lean"]=`${torsoLean.toFixed(0)}°`;
    metrics["Knee symmetry"]=`${Math.abs(left-right).toFixed(0)}°`;
    phaseValue=180-active;
    good=active>65&&active<180&&torsoLean<40;
  }else if(name==="Plank"){
    const bodyError=Math.abs(180-f.bodyLine);
    metrics["Body line angle"]=`${f.bodyLine.toFixed(0)}°`;
    metrics["Hip alignment error"]=`${bodyError.toFixed(1)}°`;
    phaseValue=180-bodyError;
    good=bodyError<20;
  }else if(name==="Jumping Jacks"){
    phaseValue=(f.armSpread+f.legSpread)/2;
    metrics["Arm excursion"]=`${(f.armSpread*100).toFixed(0)}%`;
    metrics["Leg excursion"]=`${(f.legSpread*100).toFixed(0)}%`;
    good=phaseValue>.75;
  }else{
    phaseValue=f.armSpread;
    metrics["Movement span"]=`${(phaseValue*100).toFixed(0)}%`;
    good=phaseValue>.05;
  }
  return {metrics,phaseValue,good,features:f};
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function smoothSeries(values,window=3){
  return values.map((_,i)=>{
    const lo=Math.max(0,i-Math.floor(window/2)), hi=Math.min(values.length,i+Math.ceil(window/2));
    const s=values.slice(lo,hi); return s.reduce((a,b)=>a+b,0)/s.length;
  });
}

function detectExerciseFromFrames(poseFrames){
  if(poseFrames.length<8)return {exercise:null,confidence:0,scores:{}};
  const fs=poseFrames.map(x=>poseFeatures(x.lms));
  const knee=fs.map(x=>x.kneeAngle), elbow=fs.map(x=>x.elbowAngle), hipY=fs.map(x=>x.hipY);
  const kneeRange=Math.max(...knee)-Math.min(...knee);
  const elbowRange=Math.max(...elbow)-Math.min(...elbow);
  const hipRange=Math.max(...hipY)-Math.min(...hipY);
  const bodyGood=fs.filter(x=>Math.abs(180-x.bodyLine)<25).length/fs.length;
  const spread=fs.map(x=>(x.armSpread+x.legSpread)/2);
  const spreadRange=Math.max(...spread)-Math.min(...spread);
  const kneeSwing=clamp(kneeRange/55,0,1);
  const elbowSwing=clamp(elbowRange/65,0,1);
  const hipSwing=clamp(hipRange/.10,0,1);
  const jackSwing=clamp(spreadRange/.35,0,1);
  const squatScore=.58*kneeSwing+.42*hipSwing;
  const pushScore=.58*elbowSwing+.42*bodyGood;
  const lungeScore=.48*kneeSwing+.30*hipSwing+.22*(1-clamp(Math.abs((fs.reduce((s,x)=>s+x.kneeAngle,0)/fs.length)-120)/120,0,1));
  const jackScore=.85*jackSwing+.15*clamp((Math.max(...spread)-.65)/.7,0,1);
  const scores={"Squats":squatScore,"Push-Ups":pushScore,"Lunges":lungeScore,"Jumping Jacks":jackScore};
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const [exercise,top]=ranked[0], second=ranked[1][1];
  const confidence=clamp(top*.72+(top-second)*.8,0,1);
  return {exercise,confidence,scores};
}

function countRepetitions(poseFrames,name){
  if(!["Squats","Push-Ups","Lunges","Jumping Jacks"].includes(name)) return {reps:0,goodReps:0,depths:[],segments:[]};
  const analyzed=poseFrames.map(x=>({...x,analysis:analyzeLandmarks([x.lms],name)}));
  let values=analyzed.map(x=>x.analysis.phaseValue);
  values=smoothSeries(values,5);
  const isAngle=["Squats","Push-Ups","Lunges"].includes(name);
  if(isAngle){
    const min=Math.min(...values),max=Math.max(...values),range=max-min;
    if(range<22)return {reps:0,goodReps:0,depths:[],segments:[],range};
    // Angle-based exercises use a high threshold to confirm the bottom/deep phase
    // and a low threshold to confirm a full return to the starting position.
    const down=min+range*.62;
    const up=min+range*.18;
    const minCycleSeconds=.45;
    let state="up",start=-1,reps=0,goodReps=0,depths=[],segments=[];
    for(let i=0;i<values.length;i++){
      if(state==="up" && values[i]>=down){
        state="down"; start=i;
      }else if(state==="down" && values[i]<=up){
        const segment=analyzed.slice(Math.max(0,start),i+1);
        const cycleSeconds=(analyzed[i].t??0)-(analyzed[start].t??0);
        if(cycleSeconds>=minCycleSeconds&&cycleSeconds<=8){
          const depth=Math.max(...values.slice(Math.max(0,start),i+1));
          const goodRatio=segment.length?segment.filter(x=>x.analysis.good).length/segment.length:0;
          const required=difficultyFactor().goodRatio;
          reps++; if(goodRatio>=required)goodReps++;
          depths.push(depth);segments.push({start,end:i,good:goodRatio>=required});
        }
        state="up"; start=-1;
      }
    }
    return {reps,goodReps,depths,segments,range};
  }
  const min=Math.min(...values),max=Math.max(...values),range=max-min;
  if(range<.10)return {reps:0,goodReps:0,depths:[],segments:[],range};
  const low=min+range*.22, high=min+range*.72;
  let state="low",start=-1,reps=0,goodReps=0,depths=[],segments=[];
  for(let i=0;i<values.length;i++){
    if(state==="low" && values[i]>=high){state="high";start=i;}
    else if(state==="high" && values[i]<=low){
      const segment=analyzed.slice(Math.max(0,start),i+1);
      const cycleSeconds=(analyzed[i].t??0)-(analyzed[start].t??0);
      if(cycleSeconds>=.35&&cycleSeconds<=8){
        const goodRatio=segment.length?segment.filter(x=>x.analysis.good).length/segment.length:0;
        const required=difficultyFactor().goodRatio;
        reps++; if(goodRatio>=required)goodReps++; depths.push(Math.max(...values.slice(Math.max(0,start),i+1)));
        segments.push({start,end:i,good:goodRatio>=required});
      }
      state="low"; start=-1;
    }
  }
  return {reps,goodReps,depths,segments,range};
}

function consistencyFromDepths(depths,range){
  if(depths.length<2)return depths.length?70:0;
  const mean=depths.reduce((a,b)=>a+b,0)/depths.length;
  const sd=Math.sqrt(depths.reduce((a,b)=>a+(b-mean)**2,0)/depths.length);
  return Math.round(clamp(100-(sd/(Math.max(range,1)))*100,0,100));
}

let analysisTimestamp=0;
function nextPoseTimestamp(preferred){
  const candidate=Number.isFinite(preferred)?preferred:performance.now();
  analysisTimestamp=Math.max(analysisTimestamp+1,candidate);
  return analysisTimestamp;
}
function waitForSeek(target){
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{cleanup();reject(new Error("Video seek timed out."));},5000);
    const cleanup=()=>{clearTimeout(timeout);video.removeEventListener("seeked",done);video.removeEventListener("error",failed);};
    const done=()=>{cleanup();resolve();};
    const failed=()=>{cleanup();reject(new Error("The browser could not decode this video frame."));};
    video.addEventListener("seeked",done,{once:true});
    video.addEventListener("error",failed,{once:true});
    if(Math.abs(video.currentTime-target)<.001) done(); else video.currentTime=target;
  });
}
async function capturePoseAt(t){
  video.pause();
  const target=Math.min(Math.max(t,0),Math.max(0,(video.duration||0)-.03));
  await waitForSeek(target);
  if(!state.poseLandmarker)return null;
  try{return state.poseLandmarker.detectForVideo(video,nextPoseTimestamp());}
  catch(e){console.warn("Pose frame failed",e);return null;}
}
function landmarkVisible(L,index){return (L[index]?.visibility??1)>.2;}
function usableFrameForExercise(L,name){
  const sideA=[11,13,15,23,25,27].every(index=>landmarkVisible(L,index));
  const sideB=[12,14,16,24,26,28].every(index=>landmarkVisible(L,index));
  if(name==="Push-Ups"||name==="Plank")return sideA||sideB;
  if(name==="Squats"||name==="Lunges")return [11,23,25,27].every(index=>landmarkVisible(L,index))||[12,24,26,28].every(index=>landmarkVisible(L,index));
  if(name==="Jumping Jacks")return [11,12,15,16,23,24,27,28].every(index=>landmarkVisible(L,index));
  return [11,12,23,24].every(index=>landmarkVisible(L,index));
}
function assessVideoQuality(poseFrames,name){
  const total=poseFrames.length;
  if(total<8)return {ready:false,frames:[],summary:"Quality check: a body pose was not detected often enough. Keep one person in clear, steady view.",metrics:{"Quality status":"Not ready","Detected pose frames":String(total)}};
  const frames=poseFrames.filter(frame=>usableFrameForExercise(frame.lms,name));
  const visibleRatio=frames.length/total;
  const resolution=`${video.videoWidth} × ${video.videoHeight}`;
  const enoughFrames=frames.length>=12&&visibleRatio>=.32;
  if(!enoughFrames)return {ready:false,frames,summary:`Quality check: only ${frames.length} clear movement frames were available (${Math.round(visibleRatio*100)}% of detected poses). Keep the working side of your body, hands and feet in frame.`,metrics:{"Quality status":"Not ready","Usable movement frames":`${frames.length}/${total}`,"Video resolution":resolution}};
  const coverage=visibleRatio>=.7?"strong":"partial";
  return {ready:true,frames,summary:`Quality check passed: ${frames.length} clear movement frames were selected from ${total} detected poses (${coverage} coverage).`,metrics:{"Quality status":coverage==="strong"?"Ready":"Ready — partial coverage","Usable movement frames":`${frames.length}/${total}`,"Video resolution":resolution}};
}
function showQuality(quality){
  const box=$("#qualityCheck");if(!box)return;
  box.textContent=quality.summary;box.className=`quality-check ${quality.ready?"good":"warn"}`;
}

function fallbackMotion(samples){
  let changes=[],prev=null;
  for(const s of samples){if(prev!==null)changes.push(Math.abs(s-prev));prev=s}
  const avg=changes.length?changes.reduce((a,b)=>a+b,0)/changes.length:0;
  return Math.min(100,Math.round(45+avg*5));
}


async function analyzeVideo(){
  if(!video.duration||!Number.isFinite(video.duration)){
    $("#videoFeedback").textContent="Please load a valid video first."; return;
  }
  $("#analyzeButton").disabled=true;
  $("#analysisState").textContent="Analyzing video…";
  $("#analysisProgressBar").style.width="0%";
  const selected=state.selectedExercise;
  const validatedFormExercises=new Set(["Push-Ups","Squats","Lunges","Plank","Jumping Jacks"]);
  const duration=video.duration;
  const count=Math.max(48,Math.min(180,Math.round(duration*5)));
  const poseFrames=[];
  const hasPose=await ensurePose();

  if(hasPose){
    try{
      for(let i=0;i<count;i++){
        const t=duration*(.02+i*.96/(count-1));
        const res=await capturePoseAt(t);
        if(res?.landmarks?.[0])poseFrames.push({t,lms:res.landmarks[0]});
        $("#analysisProgressBar").style.width=`${Math.round((i+1)/count*100)}%`;
        if(i%8===0)await new Promise(resolve=>requestAnimationFrame(resolve));
      }
    }catch(error){
      console.warn("Video analysis stopped",error);
      $("#videoFeedback").textContent=`Analysis stopped: ${error?.message||"the video could not be read."}`;
    }
  }
  const quality=assessVideoQuality(poseFrames,selected);showQuality(quality);
  const usableFrames=quality.frames?.length?quality.frames:poseFrames;

  let name=selected, detection={exercise:null,confidence:0,scores:{}};
  if(quality.ready && validatedFormExercises.has(name)){
    detection=detectExerciseFromFrames(usableFrames);
    const selectedScore=detection.scores[selected]??0;
    const topConfidence=detection.confidence;
    if(detection.exercise && detection.exercise!==selected && topConfidence>=.62 && detection.scores[detection.exercise]-selectedScore>=.12){
      name=detection.exercise;
    }
  }

  const rule=exerciseRules[name]||exerciseRules["Push-Ups"];
  let reps=0,goodReps=0,consistency=0,score=0,metrics={},findings=[],recommendations=[...rule.cues];

  if(quality.ready && validatedFormExercises.has(name)){
    const analyzed=usableFrames.map(x=>({...x,analysis:analyzeLandmarks([x.lms],name)}));
    const repData=countRepetitions(usableFrames,name);
    reps=repData.reps; goodReps=repData.goodReps;
    consistency=consistencyFromDepths(repData.depths,repData.range||1);
    metrics={...analyzed[Math.floor(analyzed.length/2)].analysis.metrics,...quality.metrics};

    if(name==="Plank"){
      reps=1;
      const goodRatio=analyzed.filter(x=>x.analysis.good).length/analyzed.length;
      goodReps=goodRatio>=.72?1:0;
      consistency=Math.round(goodRatio*100);
      score=Math.round(goodRatio*100);
    }else if(name==="Yoga Flow"||name==="Running"){
      const goodRatio=analyzed.filter(x=>x.analysis.good).length/analyzed.length;
      consistency=Math.round(goodRatio*100);
      score=Math.round(goodRatio*100);
    }else if(reps>0){
      const goodRatio=goodReps/reps;
      score=Math.round(clamp(goodRatio*70+consistency*.30,0,100));
    }else{
      const movementRange=repData.range||0;
      score=Math.round(clamp((movementRange/(name==="Jumping Jacks"?0.35:55))*45,0,45));
      findings.push("No complete repetitions were detected. The movement did not clearly complete the required down-and-up cycle.");
    }

    if(name!==selected){
      findings.unshift(`Exercise mismatch detected. You selected ${selected}, but the video most closely matched ${name}. The report was corrected to ${name}.`);
    }
    if(reps>0){
      findings.push(`${reps} complete ${name.toLowerCase()} repetition${reps===1?"":"s"} detected from the pose sequence.`);
      findings.push(`${goodReps} repetition${goodReps===1?"":"s"} met the current form-quality thresholds.`);
    }
    if(consistency<65 && reps>1) findings.push("Repetition depth varied noticeably between cycles.");
    else if(reps>1) findings.push("Repetition depth was reasonably consistent across detected cycles.");

    if(detection.exercise && detection.confidence>=.62){
      metrics["Detected exercise"]=`${detection.exercise} (${Math.round(detection.confidence*100)}% confidence)`;
    }
    metrics["Analysis frames"]=String(usableFrames.length);
  }else if(poseFrames.length>=8){
    score=null; reps=0; goodReps=0; consistency=null;
    metrics={"Analysis mode":"Pose landmarks detected","Analysis frames":String(poseFrames.length),...quality.metrics};
    findings=quality.ready
      ? [`Pose landmarks were detected for ${name}, but VISTA does not yet have a validated form model for this movement.`,"No form score, repetition count, or technique claim was generated."]
      : [quality.summary,"No form score, repetition count, or technique claim was generated."];
    recommendations=quality.ready
      ? ["Use this video for coaching reference or collect labeled examples before enabling automatic form feedback.",...rule.cues]
      : ["Record again from the recommended camera angle with your full body visible.","Use a stable camera and bright, even lighting.",...rule.cues];
  }else{
    const frames=[];
    for(let i=0;i<Math.max(12,Math.min(24,Math.round(duration*3)));i++){
      const t=duration*(.04+i*.92/(Math.max(12,Math.min(24,Math.round(duration*3)))-1));
      frames.push(await capturePixelMotion(t));
      $("#analysisProgressBar").style.width=`${Math.round((i+1)/Math.max(12,Math.min(24,Math.round(duration*3)))*100)}%`;
    }
    score=null; reps=0; goodReps=0; consistency=null;
    metrics={"Analysis mode":"Frame-motion fallback",...quality.metrics};
    findings=["Visible frame-to-frame movement was detected.","Pose landmarks were not available, so exercise-specific repetition and joint-angle claims were not made."];
    recommendations=["Use Chrome or Edge with internet access to load the VISTA pose model.","Keep the full body visible and use a stable camera angle.",...rule.cues];
  }

  if(poseFrames.length>=8 && reps===0 && !findings.some(x=>x.includes("No complete repetitions"))){
    findings.push("No complete repetitions were confidently detected. Try a longer clip with the full body visible.");
  }
  if(!findings.length) findings.push("The movement sequence was analyzed using exercise-specific pose landmarks.");
  const report={
    id:crypto.randomUUID(),date:new Date().toISOString(),exercise:name,selectedExercise:selected,
    detectedExercise:detection.exercise||name,detectionConfidence:detection.confidence,
    duration,score,reps,goodReps,consistency,metrics,findings,recommendations,distance:state.totalKm
  };
  state.currentReport=report;
  renderReport(report);
  $("#analysisState").textContent="Analysis complete";
  $("#videoFeedback").textContent=score===null?`Analysis complete: pose/form confidence was insufficient for a score.`:`Analysis complete: ${name} · ${reps} reps · ${score}/100.`;
  $("#analyzeButton").disabled=false;
}

async function capturePixelMotion(t){
  video.pause();
  await waitForSeek(Math.min(t,Math.max(0,video.duration-.03)));
  const c=document.createElement("canvas");c.width=80;c.height=60;const x=c.getContext("2d");x.drawImage(video,0,0,80,60);const d=x.getImageData(0,0,80,60).data;let sum=0;for(let i=0;i<d.length;i+=16)sum+=d[i]+d[i+1]+d[i+2];return sum/d.length;
}

function renderReport(r){
  $("#reportEmpty").hidden=true;$("#reportContent").hidden=false;$("#scoreBadge").textContent=r.score??"—";
  const reportHeading=$("#reportPanel h2"); if(reportHeading) reportHeading.textContent=`${r.exercise} Motion Analysis Report`;
  const verification=$("#analysisVerification");
  if(verification){
    const selected=r.selectedExercise||r.exercise, detected=r.detectedExercise||r.exercise;
    verification.textContent=detected!==selected
      ? `Exercise corrected: selected ${selected}; detected ${detected}.`
      : `Exercise verified: ${detected}.`;
  }
  $("#scoreBadge").className=`score-badge ${r.score===null?"":r.score>=80?"score-high":r.score>=60?"score-mid":"score-low"}`;
  $("#reportReps").textContent=r.reps||"—";$("#reportGoodReps").textContent=r.reps?r.goodReps:"—";$("#reportConsistency").textContent=r.consistency===null?"—":`${r.consistency}%`;$("#reportDuration").textContent=`${Math.round(r.duration)}s`;
  $("#findingsList").innerHTML=r.findings.map(x=>`<li>${escapeHtml(x)}</li>`).join("");
  $("#recommendationsList").innerHTML=r.recommendations.map(x=>`<li>${escapeHtml(x)}</li>`).join("");
  $("#exerciseMetrics").innerHTML=Object.entries(r.metrics).map(([k,v])=>`<div><span>${escapeHtml(k)}</span><b>${escapeHtml(String(v))}</b></div>`).join("");
  openReportModal(r);
}
function escapeHtml(x){return String(x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function reportText(r){
  const scoreText=r.score===null?"Not scored":`${r.score}/100`, consistencyText=r.consistency===null?"Not scored":`${r.consistency}%`;
  return `VISTA MOTION ANALYSIS REPORT\n\nExercise: ${r.exercise}\nSelected exercise: ${r.selectedExercise||r.exercise}\nDetected exercise: ${r.detectedExercise||r.exercise}\nDetection confidence: ${r.detectionConfidence?Math.round(r.detectionConfidence*100)+"%":"N/A"}\nDate: ${new Date(r.date).toLocaleString()}\nScore: ${scoreText}\nRepetitions: ${r.reps}\nGood repetitions: ${r.goodReps}\nConsistency: ${consistencyText}\nDuration: ${Math.round(r.duration)} seconds\n\nWHAT WE FOUND\n${r.findings.map(x=>"- "+x).join("\n")}\n\nCOACH RECOMMENDATIONS\n${r.recommendations.map(x=>"- "+x).join("\n")}\n\nMETRICS\n${Object.entries(r.metrics).map(([k,v])=>`${k}: ${v}`).join("\n")}\n`;
}
function openReportModal(r){
  $("#reportModalTitle").textContent=`${r.exercise} Motion Analysis Report`;
  const detected=r.detectedExercise||r.exercise;
  const confidence=r.detectionConfidence?` · Detection confidence ${Math.round(r.detectionConfidence*100)}%`:"";
  const scoreText=r.score===null?"Not scored":`${r.score}/100`, consistencyText=r.consistency===null?"Not scored":`${r.consistency}%`;
  $("#reportModalMeta").textContent=`${new Date(r.date).toLocaleString()} · Score ${scoreText}${confidence}`;
  $("#modalReportBody").innerHTML=`
    <div class="modal-report-grid">
      <div class="modal-report-stat"><small>SCORE</small><strong>${scoreText}</strong></div>
      <div class="modal-report-stat"><small>REPS</small><strong>${r.reps||"—"}</strong></div>
      <div class="modal-report-stat"><small>GOOD REPS</small><strong>${r.reps?r.goodReps:"—"}</strong></div>
      <div class="modal-report-stat"><small>CONSISTENCY</small><strong>${consistencyText}</strong></div>
    </div>
    <div class="modal-report-section"><h3>Exercise verification</h3>
      <p class="muted">Selected: <b>${escapeHtml(r.selectedExercise||r.exercise)}</b> · Analyzed: <b>${escapeHtml(detected)}</b>${detected!==r.selectedExercise?" — the video pattern did not match the selected exercise, so VISTA used the detected exercise for the report.":""}</p>
    </div>
    <div class="modal-report-section"><h3>What we found</h3><ul>${r.findings.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
    <div class="modal-report-section"><h3>Coach recommendations</h3><ul>${r.recommendations.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
    <div class="modal-report-section"><h3>Exercise metrics</h3><div class="modal-metrics">${Object.entries(r.metrics).map(([k,v])=>`<div><span>${escapeHtml(k)}</span><b>${escapeHtml(String(v))}</b></div>`).join("")}</div></div>`;
  $("#reportModal").hidden=false;
}
function closeReportModal(){$("#reportModal").hidden=true}
async function saveReportToDesktop(){
  if(!state.currentReport)return;
  const r=state.currentReport, text=reportText(r), filename=`VISTA-${r.exercise.replace(/\s+/g,"-")}-report.txt`;
  try{
    if(window.showSaveFilePicker){
      const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:"VISTA report",accept:{"text/plain":[".txt"]}}]});
      const writable=await handle.createWritable(); await writable.write(text); await writable.close();
      $("#videoFeedback").textContent="Report saved successfully.";
      return;
    }
  }catch(err){if(err?.name==="AbortError")return;}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  $("#videoFeedback").textContent="Report downloaded. Choose the Desktop folder if your browser asks where to save it.";
}
$("#analyzeButton").addEventListener("click",analyzeVideo);
$("#saveReportButton").addEventListener("click",()=>{if(!state.currentReport)return;state.history.unshift(state.currentReport);state.history=state.history.slice(0,100);saveAll();renderProgress();renderDashboard();$("#videoFeedback").textContent="Workout saved to your history."});
$("#openReportButton").addEventListener("click",()=>{if(state.currentReport)openReportModal(state.currentReport)});
$("#downloadReportButton").addEventListener("click",saveReportToDesktop);
$("#modalSaveDesktopButton").addEventListener("click",saveReportToDesktop);
$("#closeReportButton").addEventListener("click",closeReportModal);
$("#modalCloseButton").addEventListener("click",closeReportModal);
$("[data-close-report]").addEventListener("click",closeReportModal);
$("#modalPrintButton").addEventListener("click",()=>window.print());
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#reportModal").hidden)closeReportModal()});

/* Live webcam coaching + repetition counting */

function resetLiveSession(){
  state.liveReps=0;
  state.liveGoodFrames=0;
  state.liveFrames=0;
  state.livePhase="Ready";
  state.liveRepState="up";
  state.liveLastPhaseValue=null;
  state.liveStartedAt=state.liveMode?performance.now():0;
  state.liveLastFrameTime=0;
  state.liveRepStartedAt=0;
  state.liveCycleGoodFrames=0;
  state.liveCycleFrames=0;
  state.liveCooldown=0;
  state.liveHistory=[];
  updateLiveHud();
}
function updateLiveHud(){
  const reps=state.liveReps;
  const form=state.liveFrames?Math.round(state.liveGoodFrames/state.liveFrames*100):null;
  $("#liveRepCount").textContent=reps;
  $("#livePanelRepCount").textContent=reps;
  $("#liveFormScore").textContent=form===null?"—":`${form}`;
  $("#livePanelFormScore").textContent=form===null?"—":`${form}/100`;
  $("#liveRepStatus").textContent=state.livePhase;
  $("#livePanelPhase").textContent=state.livePhase;
  if(state.liveStartedAt){
    const sec=Math.max(0,Math.floor((performance.now()-state.liveStartedAt)/1000));
    $("#liveSessionTime").textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
  }else $("#liveSessionTime").textContent="00:00";
}
function updateLiveRepCounter(analysis){
  const name=state.selectedExercise;
  if(!analysis)return;
  if(name==="Plank"){
    state.livePhase=analysis.good?"Holding":"Adjust position";
    return;
  }
  if(name==="Yoga Flow"||name==="Running")return;

  const value=analysis.phaseValue;
  state.liveLastPhaseValue=value;
  state.liveHistory.push(value);
  if(state.liveHistory.length>90)state.liveHistory.shift();
  state.liveCooldown=Math.max(0,state.liveCooldown-1);

  const vals=state.liveHistory;
  const min=Math.min(...vals),max=Math.max(...vals),range=max-min;
  state.liveFrames++;
  if(analysis.good){
    state.liveGoodFrames++;
    state.liveCycleGoodFrames++;
  }
  state.liveCycleFrames++;

  const isAngleExercise=["Squats","Push-Ups","Lunges"].includes(name);
  const minimumRange=isAngleExercise?18:.10;
  if(range<minimumRange){
    state.livePhase="Calibrating movement";
    return;
  }

  const down=min+range*(isAngleExercise ? .58 : .72);
  const up=min+range*(isAngleExercise ? .18 : .22);

  if(state.liveRepState==="up" && value>=down && state.liveCooldown===0){
    state.liveRepState="down";
    state.liveRepStartedAt=state.liveFrames;
    state.liveCycleGoodFrames=analysis.good?1:0;
    state.liveCycleFrames=1;
    state.livePhase="Down";
  }else if(state.liveRepState==="down"){
    if(value<=up){
      const goodCycle=state.liveCycleFrames>0 && (state.liveCycleGoodFrames/state.liveCycleFrames)>=difficultyFactor().goodRatio;
      state.liveReps++;
      state.liveRepState="up";
      state.liveCooldown=6;
      state.livePhase=goodCycle?"Rep complete · Good":"Rep complete · Check form";
      state.liveCycleGoodFrames=0;
      state.liveCycleFrames=0;
    }else{
      state.livePhase="Down";
    }
  }else{
    state.livePhase="Ready";
  }
}
$("#liveAnalyzeButton").addEventListener("click",async()=>{
  if(!state.stream){$("#videoFeedback").textContent="Start the webcam first.";return}
  state.liveMode=!state.liveMode;
  $("#liveCoachPanel").hidden=!state.liveMode;
  $("#liveHud").hidden=!state.liveMode;
  $("#liveAnalyzeButton").textContent=state.liveMode?"Stop live coaching":"Live coaching";
  $("#liveCoachStatus").textContent=state.liveMode?"LIVE":"Offline";
  if(state.liveMode){
    await ensurePose();
    resetLiveSession();
    liveLoop();
  }else{
    state.liveStartedAt=0;
    updateLiveHud();
  }
});
$("#resetLiveButton").addEventListener("click",()=>{resetLiveSession();$("#coachMessage").textContent="Live count reset. Start the next repetition from the ready position."});
async function liveLoop(){
  if(!state.liveMode)return;
  let message="Keep your full body visible and move with control.";
  if(state.poseLandmarker){
    try{
      const now=performance.now();
      if(now-state.liveLastFrameTime>45){
        state.liveLastFrameTime=now;
        const res=state.poseLandmarker.detectForVideo(video,nextPoseTimestamp(now)), l=res.landmarks?.[0];
        if(l){
          const a=analyzeLandmarks([l],state.selectedExercise);
          updateLiveRepCounter(a);
          if(a?.good)message="Good form. Keep the movement controlled.";
          else message=exerciseRules[state.selectedExercise].cues[0];
        }else{
          state.livePhase="No pose";
          message="Move into the camera view so VISTA can detect your body.";
        }
      }
    }catch{
      message="Live pose detection is temporarily unavailable.";
    }
  }else{
    state.livePhase="Model unavailable";
    message="Pose model unavailable. Check internet access and camera permissions.";
  }
  $("#coachMessage").textContent=message;
  updateLiveHud();
  requestAnimationFrame(liveLoop);
}

/* Progress */
function calculateStreak(history){
  const days=new Set(history.map(x=>new Date(x.date).toISOString().slice(0,10)));
  let cursor=new Date(); cursor.setHours(0,0,0,0);
  const today=cursor.toISOString().slice(0,10);
  if(!days.has(today)){cursor.setDate(cursor.getDate()-1);}
  let streak=0;
  while(days.has(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-1);}
  return streak;
}
function renderProgress(){
  const h=state.history;$("#historyCount").textContent=h.length;$("#totalReps").textContent=h.reduce((s,x)=>s+(x.reps||0),0);$("#currentStreak").textContent=calculateStreak(h);
  const scores=h.map(x=>x.score).filter(Number.isFinite);$("#averageScore").textContent=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):"—";$("#bestScore").textContent=scores.length?Math.max(...scores):"—";
  $("#historyList").innerHTML=h.length?h.slice(0,30).map((x,i)=>`<div class="history-row"><div><b>${escapeHtml(x.exercise)}</b><br><small>${new Date(x.date).toLocaleString()} · ${Math.round(x.duration)}s · ${x.reps||0} reps</small></div><span class="history-score">${x.score===null?"Not scored":`${x.score}/100`}</span><button class="button secondary delete-history" data-index="${i}">Delete</button></div>`).join(""):`<div class="empty-state"><div></div><b>No saved workouts yet</b><span>Analyze a video and press Save workout.</span></div>`;
  $$(".delete-history").forEach(b=>b.addEventListener("click",()=>{state.history.splice(+b.dataset.index,1);saveAll();renderProgress();renderDashboard()}));
  const recent=h.slice(0,8).reverse();$("#scoreChart").innerHTML=recent.length?recent.map(x=>`<div class="chart-bar" style="height:${Math.max(5,x.score)}%"><b>${x.score}</b><span>${new Date(x.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div>`).join(""):"<div class='empty-state'>No data</div>";
  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], counts=days.map((_,i)=>h.filter(x=>new Date(x.date).getDay()===i&&Date.now()-new Date(x.date).getTime()<7*86400000).length);const max=Math.max(1,...counts);
  $("#weeklyChart").innerHTML=days.map((d,i)=>`<div class="bar-item"><div class="bar" style="height:${Math.max(3,counts[i]/max*85)}%"></div><small>${d}</small></div>`).join("");
}
function exportHistoryCsv(){
  if(!state.history.length){alert("There is no workout history to export yet.");return;}
  const headers=["Date","Exercise","Selected Exercise","Detected Exercise","Score","Reps","Good Reps","Consistency","Duration (s)"];
  const rows=state.history.map(r=>[new Date(r.date).toLocaleString(),r.exercise,r.selectedExercise||"",r.detectedExercise||"",r.score,r.reps,r.goodReps,r.consistency,Math.round(r.duration)]);
  const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const csv=[headers,...rows].map(row=>row.map(esc).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`VISTA-workout-history-${new Date().toISOString().slice(0,10)}.csv`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
$("#exportHistory").addEventListener("click",exportHistoryCsv);
$("#clearHistory").addEventListener("click",()=>{if(confirm("Clear all saved workout history?")){state.history=[];saveAll();renderProgress();renderDashboard()}});

/* Nutrition */
function dateKey(){return new Date().toISOString().slice(0,10)}
function getTodayWater(){return +(state.water[dateKey()]||0)}
function renderNutrition(){
  const goal=+(localStorage.getItem("vista-water-goal")||3), litres=getTodayWater()/1000, pct=Math.min(100,Math.round(litres/goal*100));
  $("#waterGoal").value=goal;$("#waterRingValue").textContent=`${pct}%`;$("#waterRingLabel").textContent=`${litres.toFixed(2)} / ${goal.toFixed(2)} L`;
  $("#reminderList").innerHTML=state.reminders.map((x,i)=>`<li><span><b>${escapeHtml(x.meal)}</b> · ${x.time}</span><button data-rem="${i}">Remove</button></li>`).join("");
  $$("[data-rem]").forEach(b=>b.addEventListener("click",()=>{state.reminders.splice(+b.dataset.rem,1);saveAll();renderNutrition()}));
  $("#calorieGoal").value=state.nutrition.calories;$("#proteinGoal").value=state.nutrition.protein;$("#carbGoal").value=state.nutrition.carbs;$("#fatGoal").value=state.nutrition.fat;
}
$("#waterForm").addEventListener("submit",e=>{e.preventDefault();const n=+$("#waterInput").value;if(n>0){state.water[dateKey()]=getTodayWater()+n;$("#waterInput").value="";saveAll();renderNutrition();renderDashboard()}});
$("#waterGoal").addEventListener("change",()=>localStorage.setItem("vista-water-goal",+$("#waterGoal").value||3));
$("#dietForm").addEventListener("submit",e=>{e.preventDefault();const meal=$("#mealInput").value.trim(),time=$("#mealTimeInput").value;if(!meal||!time)return;state.reminders.push({meal,time});saveAll();$("#mealInput").value="";$("#mealTimeInput").value="";renderNutrition()});
$("#saveNutrition").addEventListener("click",()=>{state.nutrition={calories:+$("#calorieGoal").value,protein:+$("#proteinGoal").value,carbs:+$("#carbGoal").value,fat:+$("#fatGoal").value};saveAll();$("#nutritionFeedback").textContent="Nutrition targets saved."});

function updateWaterReminderStatus(){
  const enabled=localStorage.getItem("vista-water-reminders")==="true", supported="Notification" in window;
  $("#waterReminderButton").textContent=enabled?"Water reminders enabled":"Enable 30-minute water reminders";
  $("#waterReminderStatus").textContent=enabled?"VISTA will remind you every 30 minutes while this website is open.":supported?"Reminders are off.":"This browser does not support notifications.";
}
function sendWaterReminder(){
  if(localStorage.getItem("vista-water-reminders")!=="true")return;
  const message="Time to drink water and update your VISTA hydration log.";
  if("Notification" in window && Notification.permission==="granted")new Notification("VISTA hydration reminder",{body:message});
  else if(document.visibilityState==="visible")$("#waterReminderStatus").textContent=message;
}
$("#waterReminderButton").addEventListener("click",async()=>{
  if(!("Notification" in window)){updateWaterReminderStatus();return;}
  const permission=await Notification.requestPermission();
  if(permission==="granted"){localStorage.setItem("vista-water-reminders","true");sendWaterReminder();}
  else localStorage.setItem("vista-water-reminders","false");
  updateWaterReminderStatus();
});
updateWaterReminderStatus();
setInterval(sendWaterReminder,30*60*1000);

window.addEventListener("hashchange",()=>{const p=location.hash.slice(1);if(["home","workout","progress","nutrition"].includes(p))navigate(p)});

/* VISTA Advanced Upgrade Pack */
state.difficulty = localStorage.getItem("vista-difficulty") || "intermediate";
state.voiceCoach = localStorage.getItem("vista-voice-coach") === "true";
state.skeleton = localStorage.getItem("vista-skeleton") !== "false";
state.calibration = JSON.parse(localStorage.getItem("vista-calibration") || "null");
state.lastVoiceAt = 0;
state.liveRecentFrames = [];

const difficultyConfig = {
  beginner: {goodRatio:.55, repRangeFactor:.45, label:"Beginner"},
  intermediate: {goodRatio:.72, repRangeFactor:.58, label:"Intermediate"},
  advanced: {goodRatio:.82, repRangeFactor:.68, label:"Advanced"}
};

function speakCoach(text, force=false){
  if(!state.voiceCoach || !('speechSynthesis' in window)) return;
  const now=Date.now();
  if(!force && now-state.lastVoiceAt<3500) return;
  state.lastVoiceAt=now;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.rate=.98; utterance.pitch=1; utterance.volume=.9;
  window.speechSynthesis.speak(utterance);
}
function setVoiceState(){
  const on=state.voiceCoach;
  const el=$("#voiceStatus"); if(el) el.textContent=on?"Voice on":"Voice off";
  const cb=$("#voiceCoachToggle"); if(cb) cb.checked=on;
}
function difficultyFactor(){return difficultyConfig[state.difficulty]||difficultyConfig.intermediate}

$("#difficultyLevel").value=state.difficulty;
$("#voiceCoachToggle").checked=state.voiceCoach;
$("#skeletonToggle").checked=state.skeleton;
setVoiceState();
$("#difficultyLevel").addEventListener("change",e=>{
  state.difficulty=e.target.value; localStorage.setItem("vista-difficulty",state.difficulty);
  $("#videoFeedback").textContent=`Coaching level set to ${difficultyConfig[state.difficulty].label}.`;
});
$("#voiceCoachToggle").addEventListener("change",e=>{
  state.voiceCoach=e.target.checked; localStorage.setItem("vista-voice-coach",String(state.voiceCoach)); setVoiceState();
  if(state.voiceCoach) speakCoach("Voice coaching enabled.",true);
});
$("#skeletonToggle").addEventListener("change",e=>{
  state.skeleton=e.target.checked; localStorage.setItem("vista-skeleton",String(state.skeleton));
  if(!state.skeleton) ctx.clearRect(0,0,canvas.width,canvas.height);
});

function drawSkeleton(landmarks){
  if(!state.skeleton || !landmarks || !video.videoWidth) { ctx.clearRect(0,0,canvas.width,canvas.height); return; }
  const rect=video.getBoundingClientRect();
  const w=canvas.width=video.videoWidth, h=canvas.height=video.videoHeight;
  ctx.clearRect(0,0,w,h);
  const pts={};
  landmarks.forEach((p,i)=>{
    if((p.visibility??1)>.35) pts[i]={x:p.x*w,y:p.y*h};
  });
  const connections=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[15,17],[16,18]];
  ctx.lineWidth=Math.max(2,w/500); ctx.strokeStyle="#52d1bd"; ctx.fillStyle="#ff6330";
  connections.forEach(([a,b])=>{if(pts[a]&&pts[b]){ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.stroke();}});
  Object.values(pts).forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,w/220),0,Math.PI*2);ctx.fill();});
}

async function calibrateCamera(){
  if(!state.stream){
    $("#calibrationStatus").textContent="Start the webcam before calibration."; return;
  }
  if(!state.poseLandmarker){await ensurePose();}
  if(!state.poseLandmarker){$("#calibrationStatus").textContent="Pose model is unavailable. Check internet access.";return;}
  $("#calibrationStatus").textContent="Calibrating. Stand in a neutral starting position for about two seconds.";
  const samples=[]; const start=performance.now();
  while(performance.now()-start<1800){
    try{
      const now=performance.now(); const res=state.poseLandmarker.detectForVideo(video,nextPoseTimestamp(now)); const l=res.landmarks?.[0];
      if(l){const f=poseFeatures(l); samples.push({shoulder:dist(l[11],l[12]),hip:dist(l[23],l[24]),hipY:f.hipY});}
    }catch{}
    await new Promise(r=>setTimeout(r,70));
  }
  if(samples.length<5){$("#calibrationStatus").textContent="Calibration failed. Keep your full body visible and try again.";return;}
  const avg=k=>samples.reduce((s,x)=>s+x[k],0)/samples.length;
  state.calibration={shoulder:avg("shoulder"),hip:avg("hip"),hipY:avg("hipY"),date:new Date().toISOString()};
  localStorage.setItem("vista-calibration",JSON.stringify(state.calibration));
  $("#calibrationStatus").textContent=`Camera calibrated from ${samples.length} pose samples. Keep roughly the same camera position.`;
  speakCoach("Camera calibration complete.",true);
}
$("#calibrateButton").addEventListener("click",calibrateCamera);

/* Replace live loop with skeleton drawing, voice cues and live exercise verification. */
const baseLiveLoop=liveLoop;
liveLoop=async function(){
  if(!state.liveMode)return;
  let message="Keep your full body visible and move with control.";
  if(state.poseLandmarker){
    try{
      const now=performance.now();
      if(now-state.liveLastFrameTime>45){
        state.liveLastFrameTime=now;
        const res=state.poseLandmarker.detectForVideo(video,nextPoseTimestamp(now)), l=res.landmarks?.[0];
        if(l){
          drawSkeleton(l);
          const a=analyzeLandmarks([l],state.selectedExercise);
          state.liveRecentFrames.push({t:now,lms:l}); if(state.liveRecentFrames.length>45)state.liveRecentFrames.shift();
          updateLiveRepCounter(a);
          if(a?.good) message="Good form. Keep the movement controlled.";
          else message=(exerciseRules[state.selectedExercise]?.cues?.[0])||"Adjust your form and continue.";
          if(state.liveRecentFrames.length>=18 && state.liveFrames%18===0){
            const detection=detectExerciseFromFrames(state.liveRecentFrames);
            if(detection.exercise && detection.confidence>=.72 && detection.exercise!==state.selectedExercise){
              message=`Possible ${detection.exercise} detected. Check the selected exercise.`;
              speakCoach(`Possible ${detection.exercise} detected. Check the selected exercise.`);
            }
          }
          if(state.liveFrames%50===0 && !a.good) speakCoach(message);
        }else{
          state.livePhase="No pose"; message="Move into the camera view so VISTA can detect your body."; speakCoach(message);
          ctx.clearRect(0,0,canvas.width,canvas.height);
        }
      }
    }catch{message="Live pose detection is temporarily unavailable.";}
  }else{state.livePhase="Model unavailable";message="Pose model unavailable. Check internet access and camera permissions.";}
  $("#coachMessage").textContent=message; updateLiveHud(); requestAnimationFrame(liveLoop);
};

/* Better live session reset */
const baseResetLiveSession=resetLiveSession;
resetLiveSession=function(){baseResetLiveSession();state.liveRecentFrames=[];ctx.clearRect(0,0,canvas.width,canvas.height);};

/* Personalized dashboard and achievements */
function getLatestByExercise(name){return state.history.find(x=>x.exercise===name);}
function renderPersonalizedInsights(){
  const box=$("#personalizedFocus"); if(!box)return;
  const recent=state.history.slice(0,5);
  if(!recent.length){box.textContent="Complete a workout to receive a personalized recommendation.";return;}
  const scored=recent.filter(x=>Number.isFinite(x.score));
  const avg=scored.length?Math.round(scored.reduce((s,x)=>s+x.score,0)/scored.length):null;
  const latest=recent[0];
  let text=latest.score===null?`Your latest ${latest.exercise} session was recorded without a form score. `:`Your latest ${latest.exercise} score is ${latest.score}/100. `;
  if(avg===null) text+="Record a supported movement with a clear full-body view to begin score-based feedback.";
  else if(avg<65) text+="Focus on controlled movement and repeatable range of motion before increasing speed.";
  else if(avg<80) text+="Your base performance is developing. Work on consistency and aim to improve one form metric at a time.";
  else text+="Your recent form is strong. Progress gradually by improving consistency or adding a small training challenge.";
  if(state.profile?.weeklyTarget){
    const week=recent.filter(x=>Date.now()-new Date(x.date).getTime()<7*86400000).length;
    text+=` You have completed ${week} of ${state.profile.weeklyTarget} weekly sessions.`;
  }
  box.textContent=text;
}
function renderAchievements(){
  const el=$("#achievementGrid"); if(!el)return;
  const sessions=state.history.length, reps=state.history.reduce((s,x)=>s+(x.reps||0),0), best=state.history.reduce((m,x)=>Math.max(m,Number(x.score)||0),0), streak=calculateStreak(state.history);
  const items=[
    [sessions>=1,"First session","Complete your first workout"],[sessions>=5,"Five sessions","Save five workouts"],[reps>=50,"50 reps","Reach 50 tracked reps"],[best>=90,"90+ form","Score 90 or higher"],[streak>=3,"3-day streak","Train on three consecutive days"],[streak>=7,"7-day streak","Train on seven consecutive days"]
  ];
  el.innerHTML=items.map(([ok,title,desc])=>`<div class="achievement ${ok?"":"locked"}"><b>${title}</b><small>${ok?"Unlocked":"Locked"} · ${desc}</small></div>`).join("");
}
const baseRenderDashboard=renderDashboard;
renderDashboard=function(){baseRenderDashboard();renderPersonalizedInsights();renderAchievements();};

/* Previous-session comparison */
function comparisonForReport(r){
  const previous=state.history.find(x=>x.exercise===r.exercise);
  if(!previous)return null;
  const delta=(a,b)=>Math.round((Number(a)||0)-(Number(b)||0));
  return {previous,score:delta(r.score,previous.score),reps:delta(r.reps,previous.reps),consistency:delta(r.consistency,previous.consistency),goodReps:delta(r.goodReps,previous.goodReps)};
}
function deltaHtml(v){return `<span class="${v>0?"delta-up":v<0?"delta-down":"delta-neutral"}">${v>0?"+":""}${v}</span>`;}
function renderComparisonBlock(r){
  const block=$("#comparisonBlock"), content=$("#comparisonContent"); if(!block||!content)return;
  const c=comparisonForReport(r); if(!c){block.hidden=true;return;}
  block.hidden=false;
  content.innerHTML=`<div class="comparison-grid"><div class="comparison-stat"><small>SCORE CHANGE</small><strong>${deltaHtml(c.score)} points</strong></div><div class="comparison-stat"><small>REP CHANGE</small><strong>${deltaHtml(c.reps)} reps</strong></div><div class="comparison-stat"><small>CONSISTENCY</small><strong>${deltaHtml(c.consistency)}%</strong></div><div class="comparison-stat"><small>GOOD REP CHANGE</small><strong>${deltaHtml(c.goodReps)}</strong></div></div><p class="muted">Compared with ${new Date(c.previous.date).toLocaleString()}.</p>`;
}
const baseRenderReport=renderReport;
renderReport=function(r){baseRenderReport(r);renderComparisonBlock(r);};

function renderProgressComparison(){
  const el=$("#progressComparison"); if(!el)return;
  const latest=state.history[0]; if(!latest){el.textContent="No saved workouts yet.";return;}
  const previous=state.history.find((x,i)=>i>0&&x.exercise===latest.exercise);
  if(!previous){el.innerHTML=`Latest ${escapeHtml(latest.exercise)} score: <b>${latest.score}/100</b>. Save another session of this exercise to compare results.`;return;}
  const c={score:latest.score-previous.score,reps:(latest.reps||0)-(previous.reps||0),consistency:(latest.consistency||0)-(previous.consistency||0)};
  el.innerHTML=`<div class="comparison-grid"><div class="comparison-stat"><small>SCORE</small><strong>${latest.score}/100 <span class="${c.score>=0?"delta-up":"delta-down"}">${c.score>=0?"+":""}${c.score}</span></strong></div><div class="comparison-stat"><small>REPS</small><strong>${latest.reps||0} <span class="${c.reps>=0?"delta-up":"delta-down"}">${c.reps>=0?"+":""}${c.reps}</span></strong></div><div class="comparison-stat"><small>CONSISTENCY</small><strong>${latest.consistency}% <span class="${c.consistency>=0?"delta-up":"delta-down"}">${c.consistency>=0?"+":""}${c.consistency}%</span></strong></div><div class="comparison-stat"><small>PREVIOUS</small><strong>${previous.score}/100</strong></div></div>`;
}
const baseRenderProgress=renderProgress;
renderProgress=function(){baseRenderProgress();renderProgressComparison();renderAchievements();};

/* PDF report: browser print dialog is used so the user can choose Save as PDF. */
$("#pdfReportButton").addEventListener("click",()=>{if(!state.currentReport)return;openReportModal(state.currentReport);setTimeout(()=>window.print(),100);});

/* Ensure the advanced dashboard widgets refresh after profile/history changes. */
const originalSaveReportHandler=document.getElementById("saveReportButton");
originalSaveReportHandler.addEventListener("click",()=>{setTimeout(()=>{renderDashboard();renderProgress();},0);});

/* Initial state refresh after all advanced functions are registered. */
setTimeout(()=>{renderDashboard();renderProgress();setVoiceState();},50);

/* Local-first upgrade tools: route export, coach workspace, demo and offline shell. */
function renderRouteHistory(){
  const list=$("#routeHistoryList");if(!list)return;
  list.innerHTML=state.routeHistory.length?state.routeHistory.slice(0,15).map(route=>`<article class="route-session"><div><b>${route.distance.toFixed(2)} km route</b><small>${new Date(route.date).toLocaleString()} · ${formatDuration(route.duration||0)} · ${pointLabel(route.start)} → ${pointLabel(route.end)}</small></div><span class="pill">${route.points?.length||0} GPS points</span></article>`).join(""):`<div class="empty-state"><b>No saved routes yet</b><span>Start and stop GPS tracking to save your first route.</span></div>`;
}
function exportRoutesGpx(){
  const routes=state.routeHistory.filter(route=>route.points?.length);
  if(!routes.length){alert("There are no GPS routes with recorded points to export yet.");return;}
  const escapeXml=value=>String(value).replace(/[<>&'\"]/g,char=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[char]));
  const tracks=routes.map((route,index)=>`<trk><name>${escapeXml(`VISTA route ${index+1}`)}</name><trkseg>${route.points.map(point=>`<trkpt lat="${point.latitude}" lon="${point.longitude}"><time>${new Date(point.timestamp||route.date).toISOString()}</time></trkpt>`).join("")}</trkseg></trk>`).join("");
  const gpx=`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="VISTA Fitness" xmlns="http://www.topografix.com/GPX/1/1">${tracks}</gpx>`;
  const link=document.createElement("a"),url=URL.createObjectURL(new Blob([gpx],{type:"application/gpx+xml"}));link.href=url;link.download=`vista-routes-${new Date().toISOString().slice(0,10)}.gpx`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("#exportRoutesButton").addEventListener("click",exportRoutesGpx);

state.coachNotes=JSON.parse(localStorage.getItem("vista-coach-notes")||"[]");
function renderCoachWorkspace(){
  const list=$("#coachWorkspaceList");if(!list)return;
  list.innerHTML=state.coachNotes.length?state.coachNotes.map((item,index)=>`<article class="coach-note"><b>${escapeHtml(item.assignment)}</b><p>${escapeHtml(item.note)}</p><small>${new Date(item.date).toLocaleString()}</small> <button class="button secondary delete-coach-note" data-coach-note="${index}">Remove</button></article>`).join(""):`<p class="muted">No local coach notes yet. Add an assignment and feedback above.</p>`;
  $$(".delete-coach-note").forEach(button=>button.addEventListener("click",()=>{state.coachNotes.splice(+button.dataset.coachNote,1);localStorage.setItem("vista-coach-notes",JSON.stringify(state.coachNotes));renderCoachWorkspace();}));
}
$("#coachForm").addEventListener("submit",event=>{event.preventDefault();const assignment=$("#coachAssignment").value.trim(),note=$("#coachNote").value.trim();if(!assignment&&!note)return;state.coachNotes.unshift({assignment:assignment||"Coach note",note:note||"No feedback added.",date:new Date().toISOString()});state.coachNotes=state.coachNotes.slice(0,30);localStorage.setItem("vista-coach-notes",JSON.stringify(state.coachNotes));$("#coachAssignment").value="";$("#coachNote").value="";renderCoachWorkspace();});

$("#demoReportButton").addEventListener("click",()=>{
  const name=state.selectedExercise;
  const report={id:crypto.randomUUID(),date:new Date().toISOString(),exercise:name,selectedExercise:name,detectedExercise:name,detectionConfidence:0,duration:0,score:null,reps:0,goodReps:0,consistency:null,metrics:{"Mode":"Demo preview","Scoring":"Disabled","Next step":"Load a clear full-body video"},findings:["This is a demonstration of the VISTA report layout, not an analysis of your movement.","No exercise score or technique claim was generated."],recommendations:[cameraGuides[name]||"Keep your full body visible.","Use Analyze video after loading a real recording."],distance:0};
  state.currentReport=report;renderReport(report);$("#analysisState").textContent="Demo report — no video analyzed";$("#videoFeedback").textContent="Demo report opened. It contains no generated form score.";
});

const enhancedRenderProgress=renderProgress;
renderProgress=function(){enhancedRenderProgress();renderRouteHistory();renderCoachWorkspace();};
renderCameraGuide(state.selectedExercise);
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));

/* Planning, reflection, privacy and workout utility tools. */
const exerciseDetails={
  "Push-Ups":{benefit:"Upper-body pushing strength and trunk control.",steps:"Hands below shoulders; lower with a straight body line; press back with control.",mistake:"Avoid hips sagging or elbows flaring wide."},
  "Squats":{benefit:"Lower-body strength, balance and mobility.",steps:"Stand stable; sit hips back and down; drive through the feet to stand.",mistake:"Avoid knees collapsing inward or lifting the heels."},
  "Lunges":{benefit:"Single-leg strength and hip stability.",steps:"Step into a stable stance; lower vertically; press through the front foot.",mistake:"Avoid the front knee collapsing inward."},
  "Plank":{benefit:"Trunk endurance and shoulder stability.",steps:"Place elbows under shoulders; brace; keep a long line from shoulders to heels.",mistake:"Avoid dropping or hiking the hips."},
  "Jumping Jacks":{benefit:"Simple full-body cardiovascular conditioning.",steps:"Open arms and legs together; land softly; return under control.",mistake:"Avoid locking the knees on landing."},
  "Running":{benefit:"Cardiovascular endurance and locomotion.",steps:"Run tall with relaxed shoulders; use short controlled strides; land softly.",mistake:"Avoid overstriding and excessive bounce."},
  "Yoga Flow":{benefit:"Mobility, balance and controlled breathing.",steps:"Move slowly between positions; breathe steadily; use a comfortable range.",mistake:"Avoid forcing a painful range of motion."}
};
function renderExerciseGuide(name){
  const box=$("#exerciseGuide");if(!box)return;
  const item=exerciseDetails[name]||exerciseDetails["Push-Ups"];
  box.innerHTML=`<div><b>Benefit</b><span>${escapeHtml(item.benefit)}</span></div><div><b>How to perform</b><span>${escapeHtml(item.steps)}</span></div><div><b>Common mistake</b><span>${escapeHtml(item.mistake)}</span></div><div><b>Warm up / cool down</b><span>Warm up for 3–5 minutes with easy movement; finish with slow breathing and gentle mobility.</span></div>`;
}

let timerId=null,timerSeconds=0;
function renderTimer(){const mins=Math.floor(timerSeconds/60),secs=timerSeconds%60;$("#timerReadout").textContent=`${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;}
function timerAlert(){try{const audio=new (window.AudioContext||window.webkitAudioContext)(),osc=audio.createOscillator();osc.frequency.value=740;osc.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.25);}catch{}$("#timerFeedback").textContent="Timer finished. Rest, hydrate, or begin the next set.";}
$("#startTimerButton").addEventListener("click",()=>{if(timerId){clearInterval(timerId);timerId=null;$("#startTimerButton").textContent="Resume";return;}if(!timerSeconds)timerSeconds=Math.max(1,Number($("#timerMinutes").value)||1)*60;$("#startTimerButton").textContent="Pause";$("#timerFeedback").textContent="Timer is running.";timerId=setInterval(()=>{timerSeconds--;renderTimer();if(timerSeconds<=0){clearInterval(timerId);timerId=null;$("#startTimerButton").textContent="Start";timerAlert();}},1000);renderTimer();});
$("#resetTimerButton").addEventListener("click",()=>{clearInterval(timerId);timerId=null;timerSeconds=0;renderTimer();$("#startTimerButton").textContent="Start";$("#timerFeedback").textContent="Timer reset.";});renderTimer();

function renderWorkoutPlan(){const list=$("#workoutPlanList");if(!list)return;list.innerHTML=state.workoutPlan.length?state.workoutPlan.map((item,index)=>`<div class="plan-item"><b>${escapeHtml(item.exercise)}</b><span>${item.sets} sets × ${item.reps} · ${item.rest}s rest</span><button class="button secondary remove-plan" data-plan="${index}">Remove</button></div>`).join(""):`<p class="muted">No exercises in this plan yet.</p>`;$$('.remove-plan').forEach(button=>button.addEventListener("click",()=>{state.workoutPlan.splice(+button.dataset.plan,1);saveAll();renderWorkoutPlan();}));}
$("#workoutBuilderForm").addEventListener("submit",event=>{event.preventDefault();state.workoutPlan.push({exercise:$("#builderExercise").value,sets:Math.max(1,Number($("#builderSets").value)||1),reps:Math.max(1,Number($("#builderReps").value)||1),rest:Math.max(0,Number($("#builderRest").value)||0)});saveAll();renderWorkoutPlan();});renderWorkoutPlan();

function renderBodyEstimates(){const box=$("#bodyEstimates"),profile=state.profile;if(!box)return;if(!profile?.height||!profile?.weight){box.innerHTML="<p class='muted'>Complete height and weight in your profile to see local estimates.</p>";return;}const meters=profile.height/100,bmi=profile.weight/(meters*meters),label=bmi<18.5?"Below reference":bmi<25?"Reference range":bmi<30?"Above reference":"High reference";const bmr=profile.sex?(profile.sex==="male"?10*profile.weight+6.25*profile.height-5*profile.age+5:10*profile.weight+6.25*profile.height-5*profile.age-161):null,tdee=bmr?Math.round(bmr*(profile.activity||1.55)):null;box.innerHTML=`<div><small>BMI</small><b>${bmi.toFixed(1)}</b><span>${label}</span></div><div><small>BMR</small><b>${bmr?`${Math.round(bmr)} kcal`:"—"}</b><span>${bmr?"daily estimate":"requires sex setting"}</span></div><div><small>TDEE</small><b>${tdee?`${tdee} kcal`:"—"}</b><span>${tdee?"activity-adjusted estimate":"requires sex setting"}</span></div><div><small>WEIGHT</small><b>${profile.weight} kg</b><span>${profile.height} cm profile</span></div>`;}
function renderPersonalRecords(){const box=$("#personalRecords");if(!box)return;const scores=state.history.filter(item=>Number.isFinite(item.score)),bestScore=scores.length?Math.max(...scores.map(item=>item.score)):null,maxReps=state.history.reduce((max,item)=>Math.max(max,item.reps||0),0),longestRoute=state.routeHistory.reduce((max,item)=>Math.max(max,item.distance||0),0),longestHold=state.history.filter(item=>item.exercise==="Plank").reduce((max,item)=>Math.max(max,item.duration||0),0);box.innerHTML=`<div><small>BEST FORM</small><b>${bestScore??"—"}</b><span>validated sessions</span></div><div><small>MOST REPS</small><b>${maxReps||"—"}</b><span>one saved session</span></div><div><small>LONGEST ROUTE</small><b>${longestRoute?`${longestRoute.toFixed(2)} km`:"—"}</b><span>GPS tracked</span></div><div><small>PLANK RECORD</small><b>${longestHold?`${Math.round(longestHold)}s`:"—"}</b><span>video duration</span></div>`;}
function renderStreakCalendar(){const box=$("#streakCalendar");if(!box)return;const active=new Set([...state.history,...state.routeHistory].map(item=>new Date(item.date).toISOString().slice(0,10)));const cells=[];for(let i=27;i>=0;i--){const date=new Date(Date.now()-i*86400000),key=date.toISOString().slice(0,10),on=active.has(key);cells.push(`<div class="streak-day ${on?"active":""}" title="${key}"><small>${date.toLocaleDateString(undefined,{weekday:"narrow"})}</small><b>${date.getDate()}</b></div>`)}box.innerHTML=cells.join("");}

function renderGoals(){const goals=state.goals;$("#weightGoal").value=goals.weight||"";$("#sessionGoal").value=goals.sessions||state.profile?.weeklyTarget||"";$("#weeklyDistanceGoal").value=goals.distance||"";}
$("#goalPlannerForm").addEventListener("submit",event=>{event.preventDefault();state.goals={weight:Number($("#weightGoal").value)||null,sessions:Number($("#sessionGoal").value)||null,distance:Number($("#weeklyDistanceGoal").value)||null};saveAll();$("#goalPlannerFeedback").textContent="Goals saved locally.";});renderGoals();
function renderReflections(){const list=$("#reflectionList");if(!list)return;list.innerHTML=state.reflections.length?state.reflections.slice(0,8).map(item=>`<article class="reflection"><b>${escapeHtml(item.mood)}</b><span>${escapeHtml(item.note)}</span><small>${new Date(item.date).toLocaleString()}</small></article>`).join(""):`<p class="muted">No reflection saved yet.</p>`;}
$("#reflectionForm").addEventListener("submit",event=>{event.preventDefault();const note=$("#reflectionNote").value.trim();state.reflections.unshift({mood:$("#moodInput").value,note:note||"No note added.",date:new Date().toISOString()});state.reflections=state.reflections.slice(0,50);saveAll();$("#reflectionNote").value="";renderReflections();});renderReflections();

function downloadJson(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})),link=document.createElement("a");link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("#backupDataButton").addEventListener("click",()=>{const backup={profile:state.profile,history:state.history,routeHistory:state.routeHistory,water:state.water,nutrition:state.nutrition,reminders:state.reminders,workoutPlan:state.workoutPlan,goals:state.goals,reflections:state.reflections,coachNotes:state.coachNotes};downloadJson(`vista-backup-${new Date().toISOString().slice(0,10)}.json`,backup);$("#privacyFeedback").textContent="Backup downloaded.";});
$("#restoreDataInput").addEventListener("change",event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const backup=JSON.parse(reader.result);["profile","history","routeHistory","water","nutrition","reminders","workoutPlan","goals","reflections","coachNotes"].forEach(key=>{if(backup[key]!==undefined)localStorage.setItem(`vista-${key.replace(/([A-Z])/g,"-$1").toLowerCase()}`,JSON.stringify(backup[key]));});$("#privacyFeedback").textContent="Backup restored. Reloading VISTA…";setTimeout(()=>location.reload(),500);}catch{$("#privacyFeedback").textContent="That file is not a valid VISTA backup.";}};reader.readAsText(file);});
$("#clearRoutesButton").addEventListener("click",()=>{if(!confirm("Clear all saved GPS routes?"))return;state.routeHistory=[];saveAll();renderProgress();renderDashboard();$("#privacyFeedback").textContent="Saved routes cleared.";});
$("#clearLocalDataButton").addEventListener("click",()=>{if(!confirm("Clear every VISTA profile, report, route, reminder and local setting?"))return;Object.keys(localStorage).filter(key=>key.startsWith("vista-")).forEach(key=>localStorage.removeItem(key));location.reload();});

const oldProgressRender=renderProgress;renderProgress=function(){oldProgressRender();renderBodyEstimates();renderPersonalRecords();renderStreakCalendar();};
renderExerciseGuide(state.selectedExercise);renderBodyEstimates();renderPersonalRecords();renderStreakCalendar();
