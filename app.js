const screens=[...document.querySelectorAll(".screen")];
let current=0, timerId=null, timerRemaining=0, timerPaused=true;
const KEY="compas-fairness-lab-v2";
const session=JSON.parse(localStorage.getItem(KEY)||'{"polls":{},"tokens":{},"principles":[]}');
session.polls ||= {}; session.tokens ||= {}; session.principles ||= [];

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const save=()=>localStorage.setItem(KEY,JSON.stringify(session));

function go(i){
  current=Math.max(0,Math.min(screens.length-1,i));
  screens.forEach((s,n)=>s.classList.toggle("active",n===current));
  $("#progressFill").style.width=(current/(screens.length-1)*100)+"%";
  $("#stepLabel").textContent=current===0?"Start":current+"/"+(screens.length-1)+" · "+screens[current].dataset.title;
  $("#prevBtn").disabled=current===0; $("#nextBtn").disabled=current===screens.length-1;
  if(current===screens.length-1) updateFinalSummary();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-go]").forEach(b=>b.onclick=()=>go(+b.dataset.go));
$("#prevBtn").onclick=()=>go(current-1); $("#nextBtn").onclick=()=>go(current+1);

function setTimer(seconds){
  timerRemaining=seconds; timerPaused=false; clearInterval(timerId); renderTimer();
  timerId=setInterval(()=>{if(!timerPaused&&timerRemaining>0){timerRemaining--;renderTimer()}if(timerRemaining===0){clearInterval(timerId);$("#timerText").textContent="TIME"}},1000);
}
function renderTimer(){const m=String(Math.floor(timerRemaining/60)).padStart(2,"0"),s=String(timerRemaining%60).padStart(2,"0");$("#timerText").textContent=m+":"+s}
$$("[data-timer]").forEach(b=>b.onclick=()=>setTimer(+b.dataset.timer));
$("#timerToggle").onclick=()=>timerPaused=!timerPaused;
$("#fullBtn").onclick=()=>!document.fullscreenElement?document.documentElement.requestFullscreen?.():document.exitFullscreen?.();

$$("[data-reveal]").forEach(b=>b.onclick=()=>$("#"+b.dataset.reveal).classList.toggle("show"));

function setupPoll(el){
  const id=el.dataset.poll; session.polls[id] ||= "";
  el.querySelectorAll(".vote").forEach(btn=>{
    btn.onclick=()=>{
      session.polls[id]=btn.dataset.value; save(); renderPoll(el);
      if(id==="initial"||id==="final") updateFinalSummary();
    };
  });
  renderPoll(el);
}
function renderPoll(el){
  const id=el.dataset.poll, value=session.polls[id]||"";
  el.querySelectorAll(".vote").forEach(btn=>btn.classList.toggle("selected",btn.dataset.value===value));
  const out=document.querySelector('[data-poll-result="'+id+'"]');
  if(out) out.textContent=value?"Your choice: "+value:"";
}
$$("[data-poll]").forEach(setupPoll);

$("#shuffleRoles").onclick=()=>{
  const box=$("#roleGrid");
  [...box.children].sort(()=>Math.random()-.5).forEach(x=>box.appendChild(x));
};

const positive=[1,2,4,6,8,10,14,18,20,17], negative=[24,18,16,12,10,8,6,3,2,1];
const sum=(arr,a,b)=>arr.slice(a,b).reduce((x,y)=>x+y,0);
function updateThreshold(){
  const t=+$("#threshold").value, idx=t-1;
  const tp=sum(positive,idx,10),fp=sum(negative,idx,10),fn=sum(positive,0,idx),tn=sum(negative,0,idx);
  $("#thresholdLabel").textContent=t; $("#tp").textContent=tp; $("#fp").textContent=fp; $("#fn").textContent=fn; $("#tn").textContent=tn;
  $("#detainedBar").style.width=((tp+fp)/200*100)+"%";
}
$("#threshold").oninput=updateThreshold; updateThreshold();

const stakeholders=["Data scientists","COMPAS vendor","Judges","Legislators","Defendants","Affected communities"];
function tokenTotal(){return Object.values(session.tokens).reduce((a,b)=>a+b,0)}
function changeToken(name,delta){
  session.tokens[name] ||= 0;
  if(delta>0&&tokenTotal()>=10)return;
  if(delta<0&&session.tokens[name]<=0)return;
  session.tokens[name]+=delta; save(); renderTokens();
}
function setupTokens(){
  const box=$("#tokenGrid");
  stakeholders.forEach(name=>{
    session.tokens[name] ||= 0;
    const d=document.createElement("div"); d.className="stake";
    d.innerHTML='<b>'+name+'</b><div class="token-controls"><button aria-label="remove">−</button><strong>0</strong><button aria-label="add">+</button></div>';
    const [minus,plus]=d.querySelectorAll("button");
    minus.onclick=()=>changeToken(name,-1); plus.onclick=()=>changeToken(name,1);
    box.appendChild(d);
  });
  renderTokens();
}
function renderTokens(){
  $$("#tokenGrid .stake").forEach((d,i)=>d.querySelector("strong").textContent=session.tokens[stakeholders[i]]||0);
  $("#tokensLeft").textContent=10-tokenTotal();
}
setupTokens();

const principles=[
  "Accuracy & calibration","Subgroup error-rate monitoring","Transparency & explainability",
  "Contestability / right to appeal","Human review with real authority",
  "Use only for clearly defined purposes","Audit the target and labels (e.g., rearrest)",
  "Ongoing deployment monitoring"
];
function setupPrinciples(){
  const box=$("#principles");
  principles.forEach(p=>{
    const label=document.createElement("label"); label.className="principle";
    label.innerHTML='<input type="checkbox"> <b>'+p+'</b>';
    const cb=label.querySelector("input"); cb.checked=session.principles.includes(p); label.classList.toggle("selected",cb.checked);
    cb.onchange=()=>{
      if(cb.checked&&session.principles.length>=3){cb.checked=false;return}
      session.principles=cb.checked?[...session.principles,p]:session.principles.filter(x=>x!==p);
      label.classList.toggle("selected",cb.checked); save();
    };
    box.appendChild(label);
  });
}
setupPrinciples();

function updateFinalSummary(){
  $("#initialSummary").textContent=session.polls.initial||"No answer recorded.";
  $("#finalSummary").textContent=session.polls.final||"No answer recorded.";
}
$("#downloadSummary").onclick=()=>{
  const lines=[
    "COMPAS Fairness Lab — Personal Session Summary","",
    "Opening choice: "+(session.polls.initial||"—"),
    "Fairness face-off: "+(session.polls.fairness||"—"),
    "Race-blind question: "+(session.polls.race||"—"),
    "99.9% thought experiment: "+(session.polls.perfect||"—"),
    "Final choice: "+(session.polls.final||"—"),"",
    "Governance tokens:",...stakeholders.map(x=>"- "+x+": "+(session.tokens[x]||0)),"",
    "Top principles:",...(session.principles.length?session.principles.map(x=>"- "+x):["- none selected"])
  ];
  const blob=new Blob([lines.join("\n")],{type:"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="compas-fairness-lab-summary.txt";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$("#resetBtn").onclick=()=>{if(confirm("Reset your saved responses on this device?")){localStorage.removeItem(KEY);location.reload()}};

document.addEventListener("keydown",e=>{
  if(["INPUT","TEXTAREA"].includes(document.activeElement.tagName))return;
  if(e.key==="ArrowRight")go(current+1);
  if(e.key==="ArrowLeft")go(current-1);
  if(e.key.toLowerCase()==="f")$("#fullBtn").click();
  if(e.key.toLowerCase()==="r"){const r=screens[current].querySelector(".reveal");if(r)r.classList.toggle("show")}
  if(e.key===" "){e.preventDefault();timerPaused=!timerPaused}
});
go(0);