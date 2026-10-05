/* COMPAS classroom v3: host controls the shared state; students only respond.
 * All authority is checked by Supabase RPCs. The QR never contains a host key.
 */
(() => {
'use strict';
const C=window.LAB_CONTENT,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{showNotice('Browser storage is blocked. Keep this tab open; refreshing may lose your session.');}};
const rand=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
let role='setup',host=null,joinKey='',token='',state=null,busy=false,polling=false,lastSync=0,signature='',serverOffset=0;
let drafts={},dirty={},pollTimer=null;
const rootUrl=()=>{const u=new URL(location.href);u.search='';u.hash='';return u;};
const studentUrl=()=>{const u=rootUrl();u.searchParams.set('join',host.join);return u.toString();};
const activity=()=>C.activities[state?.stage];
const key=()=>state?.stage===5?'threshold_'+state.context:activity()?.key;
const isHost=()=>role==='host';
const fresh=()=>Date.now()-lastSync<9000;
function showNotice(message){$('#notice').textContent=message;$('#notice').hidden=!message;}
function netStatus(){const ok=fresh();$('#connection').textContent=role==='setup'?'Ready':ok?'Connected · auto-sync':lastSync?'Reconnecting…':'Connecting…';$('#connection').classList.toggle('stale',role!=='setup'&&!ok);const b=$('#submit');if(b)b.disabled=!state?.voting_open||state?.ended||busy||!ok;$$('[data-command]').forEach(b=>{b.disabled=busy||!ok;});}
async function rpc(name,args={}){
 const c=window.SUPABASE_CONFIG;if(!c?.url||!c?.anonKey)throw new Error('The classroom backend is not configured.');
 const controller=new AbortController(),id=setTimeout(()=>controller.abort(),10000);
 try{const res=await fetch(c.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:c.anonKey,'Content-Type':'application/json'},body:JSON.stringify(args),signal:controller.signal,cache:'no-store'});
  const text=await res.text();let data=null;try{data=text?JSON.parse(text):null;}catch{throw new Error('The server returned an unreadable response.');}
  if(!res.ok)throw new Error(data?.message||'Server request failed ('+res.status+').');return data;
 }catch(e){if(e.name==='AbortError')throw new Error('Connection timed out. Check Wi-Fi and try again.');throw e;}finally{clearTimeout(id);}
}
function credentials(){return isHost()?{p_session:host.id,p_host:host.host}:{p_join:joinKey,p_token:token};}
async function refresh(){
 if(polling||role==='setup')return;polling=true;
 try{const next=await rpc('lab_snapshot',credentials());if(state&&next.version<state.version)return;state=next;lastSync=Date.now();serverOffset=Date.parse(next.server_now)-Date.now();render();netStatus();}
 catch(e){netStatus();if(!fresh())showNotice('Cannot sync: '+e.message+' Your draft is not a submitted vote.');}
 finally{polling=false;}
}
function schedule(){clearInterval(pollTimer);pollTimer=setInterval(()=>{if(!document.hidden)refresh();},2000);}
function sources(){return '<details class="sources"><summary>Assigned readings</summary>'+C.sources.map(([t,u])=>'<p><a href="'+u+'" target="_blank" rel="noreferrer">'+esc(t)+'</a></p>').join('')+'</details>';}
function setup(){
 role='setup';$('#roleBadge').textContent='Classroom v3';$('#showQr').hidden=true;netStatus();
 $('#main').innerHTML='<section class="panel hero"><div class="eyebrow">Facilitator-led live discussion</div><h1>One room.<br>One conversation.</h1><p class="lead">Create a classroom, project its QR code, then lead the discussion. Students scan once and follow your activity automatically.</p><div class="row"><button id="create" class="primary">Create classroom</button>'+(read('lab3_host')?'<button id="resume">Resume my classroom</button>':'')+'</div><div class="callout"><b>Joining as a student?</b><p>Scan the QR on your facilitator’s screen. You do not need to press Start, create a room, or choose an activity.</p></div><p class="small">No names or email addresses. Classroom links allow participation for 24 hours. This is a discussion tool, not an assessment of defendants.</p>'+sources()+'</section>';
 $('#create').onclick=async()=>{const b=$('#create');b.disabled=true;b.textContent='Creating…';try{host=await rpc('lab_create');write('lab3_host',host);await enterHost();showQR();}catch(e){showNotice(e.message);b.disabled=false;b.textContent='Create classroom';}};
 if($('#resume'))$('#resume').onclick=async()=>{host=read('lab3_host');await enterHost();};
}
async function enterHost(){role='host';state=null;signature='';const u=rootUrl();u.searchParams.set('host',host.id);history.replaceState(null,'',u);$('#roleBadge').textContent='Facilitator';$('#showQr').hidden=false;showNotice('');await refresh();schedule();}
async function enterStudent(j){
 role='student';joinKey=j;token=read('lab3_student_'+j)||rand();write('lab3_student_'+j,token);$('#roleBadge').textContent='Participant';$('#showQr').hidden=true;
 $('#main').innerHTML='<section class="panel waiting"><div class="pulse"></div><h1>Joining your classroom…</h1><p>No sign-in needed.</p></section>';
 try{const r=await rpc('lab_join',{p_join:j,p_token:token});if(r.ended){$('#main').innerHTML='<section class="panel waiting"><h1>This session has ended.</h1><p>Ask your facilitator for a new QR code.</p></section>';return;}await refresh();schedule();}
 catch(e){showNotice(e.message);$('#main').innerHTML='<section class="panel waiting"><h1>Unable to join</h1><p>'+esc(e.message)+'</p><button id="retryJoin">Try again</button></section>';$('#retryJoin').onclick=()=>enterStudent(j);}
}
function showQR(){
 if(!host)return;try{$('#qrMount').innerHTML=ClassroomQR.svg(studentUrl());$('#copyStatus').textContent='Student link only. No facilitator key is encoded.';}catch(e){$('#qrMount').textContent='QR unavailable. Use the student link below.';$('#copyStatus').textContent=e.message;}
 if(!$('#qrDialog').open)$('#qrDialog').showModal();
}
async function copy(text){try{await navigator.clipboard.writeText(text);return true;}catch{window.prompt('Copy this link:',text);return false;}}
$('#showQr').onclick=showQR;$('#closeQr').onclick=()=>$('#qrDialog').close();
$('#copyStudent').onclick=async()=>{await copy(studentUrl());$('#copyStatus').textContent='Student link ready to share. It joins this same classroom.';};
async function command(action,value=null){
 if(!isHost()||busy)return;busy=true;netStatus();
 try{await rpc('lab_control',{p_session:host.id,p_host:host.host,p_action:action,p_value:value});showNotice('');signature='';await refresh();}
 catch(e){showNotice(e.message);}finally{busy=false;netStatus();}
}
function hostToolbar(){
 if(!isHost()||state.ended)return '';
 return '<section class="toolbar"><div class="row spaced"><div class="row"><span class="tag">You control the room</span><span id="participantCount"></span></div><button id="qrInline">Show QR</button></div>'+
 '<div class="row timer-row"><label class="small" for="stageSelect">Activity</label><select id="stageSelect" aria-label="Current activity">'+C.names.map((n,i)=>'<option value="'+i+'" '+(i===state.stage?'selected':'')+'>'+i+' · '+esc(n)+'</option>').join('')+'</select>'+
 (state.stage>0?'<button data-command="previous">Previous</button>':'')+(state.stage<9?'<button class="primary" data-command="next">'+(state.stage===0?'Start discussion':'Next activity')+'</button>':'')+
 '<button id="end" class="danger">End session</button></div>'+
 '<div class="row timer-row"><span class="timer" id="timer">--:--</span><button data-command="timer3">3 min</button><button data-command="timer5">5 min</button><button data-command="timerToggle">'+(state.timer_end?'Pause timer':'Resume timer')+'</button>'+
 (activity()?.kind&&activity().kind!=='discussion'?'<button class="primary" data-command="voteToggle">'+(state.voting_open?'Close voting & show results':'Reopen voting')+'</button>':'')+'</div></section>';
}
function wireHost(){
 if(!isHost()||state.ended)return;
 $('#qrInline').onclick=showQR;
 $('#stageSelect').onchange=e=>command('stage',+e.target.value);
 $$('[data-command]').forEach(b=>b.onclick=()=>{const c=b.dataset.command;
  if(c==='next')command('stage',state.stage+1);if(c==='previous')command('stage',state.stage-1);
  if(c==='timer3')command('timer',180);if(c==='timer5')command('timer',300);
  if(c==='timerToggle')command(state.timer_end?'pause':'resume');
  if(c==='voteToggle')command(state.voting_open?'reveal':'open');
 });
 $('#end').onclick=()=>{if(confirm('End this session for everyone? Responses will be locked. Export the summary before leaving.'))command('end');};
}
function render(){
 const sig=[role,state.stage,state.context,state.ended,state.voting_open,state.results_visible,!!state.timer_end].join('|');
 if(sig!==signature){signature=sig;
  if(state.ended){$('#main').innerHTML='<section class="panel waiting"><div class="eyebrow">Session closed</div><h1>Thank you for the discussion.</h1><p>New answers are no longer accepted.</p>'+(isHost()?'<button id="export" class="primary">Export class summary</button><p><a href="'+rootUrl()+'">Create a new classroom</a></p>':'<p>You may close this page.</p>')+'</section>'+(isHost()?'<div id="results"></div>':'');if(isHost())$('#export').onclick=exportSummary;}
  else if(state.stage===0){$('#main').innerHTML=hostToolbar()+(isHost()?'<section class="panel waiting"><div class="eyebrow">Classroom lobby</div><h1>Ready when your class is.</h1><p>Project the QR, let students join, then press <b>Start discussion</b>. Students will move to Activity 1 automatically.</p><div class="big-count" id="lobbyCount">0</div><p>student browsers joined</p><div class="row" style="justify-content:center"><button id="bigQr" class="primary">Show classroom QR</button><button id="cohost">Copy private co-facilitator link</button></div><p class="small">Share the private facilitator link only with your partner. It grants control of this session.</p></section>':'<section class="panel waiting"><div class="pulse"></div><div class="eyebrow">You are in the classroom</div><h1>Waiting for the facilitator</h1><p>Keep this page open. The first activity will appear here automatically. There is no Start button to press.</p><p class="small">Use one browser on one device. Refreshing the same browser keeps your submitted answers.</p></section>');wireHost();if(isHost()){$('#bigQr').onclick=showQR;$('#cohost').onclick=copyCohost;}}
  else{renderActivity();wireHost();}
 }
 if($('#participantCount'))$('#participantCount').textContent=state.participants+' joined · '+state.active+' recently active';
 if($('#lobbyCount'))$('#lobbyCount').textContent=state.participants;
 if($('#responseCount'))$('#responseCount').textContent=state.response_count+' / '+state.participants+' submitted';
 renderResults();renderAnswerStatus();renderClock();
}
function value(){const k=key();if(Object.prototype.hasOwnProperty.call(drafts,k))return drafts[k];return state.answers?.[k];}
function setDraft(v){drafts[key()]=v;dirty[key()]=true;renderAnswerStatus();}
function evidence(){return '<div class="evidence"><article class="panel"><div class="eyebrow">ProPublica’s concern</div><h3>Who bears false alarms?</h3><strong class="metric">44.9% vs. 23.5%</strong><p>Reported false-positive rates for Black versus White defendants in the 2016 analysis.</p><p class="small">Among those without recorded two-year recidivism, how many received a higher-risk label?</p><a href="'+C.sources[0][1]+'" target="_blank" rel="noreferrer">Assigned ProPublica reading</a></article><article class="panel"><div class="eyebrow">Northpointe’s defense</div><h3>Does a score mean the same thing?</h3><strong class="metric">Comparable observed risk</strong><p>Calibration asks whether people with the same score have similar observed outcome rates across groups.</p><p class="small">This conditions on the score, not on the outcome. It is a different statistical question.</p><a href="'+C.sources[2][1]+'" target="_blank" rel="noreferrer">Assigned Feller et al. analysis</a></article></div>';}
function renderActivity(){
 const a=activity(),hostMode=isHost();let extra='',input='';
 if(state.stage===2)extra=evidence();
 if(state.stage===3){const roles=hostMode?C.roles:[C.roles[state.group_index??0]];input=roles.map(r=>'<article class="group-card"><h3>'+esc(r.name)+'</h3><p>'+esc(r.prompt)+'</p></article>').join('')+'<div class="callout">Group response: “We prioritize ___ because ___. We would accept ___, but would require ___.”</div>';}
 if(state.stage===4)extra='<div class="callout">Problem definition → data and labels → correlated features → score → institutional decision</div>';
 if(a.kind==='poll')input='<div class="options">'+Object.entries(a.options).map(([k,label])=>'<button type="button" class="option '+(hostMode?'demo':'')+(value()===k?' selected':'')+'" data-option="'+k+'" '+(hostMode?'disabled':'')+'>'+esc(label)+'</button>').join('')+'</div>';
 if(a.kind==='threshold'){
  const v=Number(value()??6);
  extra='<div class="callout warn"><b>Scenario: '+(state.context==='detention'?'a higher-risk label may inform pretrial detention':'a higher-risk label triggers an offer of voluntary support')+'</b><p class="small">Illustrative scenario only; the score is not itself a detention order.</p></div>'+(hostMode?'<div class="row"><button data-context="detention">Detention scenario</button><button data-context="support">Support scenario</button></div>':'');
  input='<label for="threshold"><b>Higher-risk threshold: score ≥ <span id="thresholdLabel">'+v+'</span></b></label><input class="slider" id="threshold" type="range" min="2" max="9" step="1" value="'+v+'"><div class="stats" id="stats"></div><p class="small">Synthetic dataset: 200 observations. No real COMPAS records. Dragging is exploration, not submission.</p>';
 }
 if(a.kind==='tokens'){
  const v=value()||{};input='<div class="tokens">'+Object.entries(C.stakeholders).map(([k,label])=>'<div class="token"><span>'+esc(label)+'</span><div><button data-token="'+k+'" data-delta="-1" aria-label="Remove token from '+esc(label)+'" '+(hostMode?'disabled':'')+'>−</button> <output data-total="'+k+'">'+(v[k]||0)+'</output> <button data-token="'+k+'" data-delta="1" aria-label="Add token to '+esc(label)+'" '+(hostMode?'disabled':'')+'>+</button></div></div>').join('')+'</div><p id="remaining"></p>';
 }
 if(a.kind==='principles')input='<div class="principles">'+Object.entries(C.principles).map(([k,label])=>'<label class="check"><input type="checkbox" data-principle="'+k+'" '+((value()||[]).includes(k)?'checked ':'')+(hostMode?'disabled':'')+'><span>'+esc(label)+'</span></label>').join('')+'</div>';
 $('#main').innerHTML=hostToolbar()+'<section class="panel"><div class="row spaced"><div class="eyebrow">Activity '+state.stage+' of 9 · '+esc(C.names[state.stage])+'</div>'+(!hostMode?'<span class="timer" id="timer">--:--</span>':'')+'</div><h1>'+esc(a.title)+'</h1><div class="status">'+(a.kind==='discussion'?'Discuss with your group':state.voting_open?'Voting open · results hidden until the facilitator reveals them':'Voting closed')+' · <span id="responseCount"></span></div>'+extra+'<p class="question">'+esc(a.question)+'</p>'+input+
 (!hostMode&&a.kind!=='discussion'?'<div class="answer-actions row"><button id="submit" class="primary">Submit response</button><span id="answerStatus" role="status"></span></div>':'')+
 '<div id="results" class="resultbox"></div><div class="follow"><b>Discuss:</b> '+esc(a.follow)+'</div>'+(hostMode?'<details><summary>Facilitator notes</summary><p>'+esc(a.notes)+'</p></details>':'')+'</section>'+(state.stage===9&&hostMode?'<button id="export">Export class summary</button>':'')+sources();
 if(!hostMode){$$('[data-option]').forEach(b=>b.onclick=()=>{setDraft(b.dataset.option);$$('[data-option]').forEach(x=>x.classList.toggle('selected',x===b));});
  $$('[data-token]').forEach(b=>b.onclick=()=>{const v={...Object.fromEntries(Object.keys(C.stakeholders).map(k=>[k,0])),...(value()||{})};const sum=Object.values(v).reduce((a,b)=>a+b,0);const d=+b.dataset.delta,k=b.dataset.token;if((d>0&&sum>=10)||(d<0&&v[k]===0))return;v[k]+=d;setDraft(v);renderTokens();});
  $$('[data-principle]').forEach(b=>b.onchange=()=>{const v=$$('[data-principle]:checked').map(x=>x.dataset.principle);if(v.length>3){b.checked=false;showNotice('Choose at most three principles.');return;}setDraft(v);});
  if($('#submit'))$('#submit').onclick=submit;
 }
 if($('#threshold')){$('#threshold').oninput=e=>{setDraft(+e.target.value);renderThreshold();};renderThreshold();}
 if(a.kind==='tokens')renderTokens();
 if(hostMode)$$('[data-context]').forEach(b=>b.onclick=()=>command('context',b.dataset.context));
 if($('#export'))$('#export').onclick=exportSummary;
 netStatus();
}
function renderTokens(){const v=value()||{},n=Object.values(v).reduce((a,b)=>a+b,0);$$('[data-total]').forEach(x=>x.textContent=v[x.dataset.total]||0);if($('#remaining'))$('#remaining').textContent=(10-n)+' tokens remaining. Allocate all 10, then submit.';}
function renderThreshold(){
 const t=+$('#threshold').value,p=[1,2,4,6,8,10,14,18,20,17],n=[24,18,16,12,10,8,6,3,2,1],sum=a=>a.reduce((x,y)=>x+y,0),i=t-1;
 const vals=[['TP',sum(p.slice(i))],['FP',sum(n.slice(i))],['TN',sum(n.slice(0,i))],['FN',sum(p.slice(0,i))]];
 $('#thresholdLabel').textContent=t;$('#stats').innerHTML=vals.map(([label,v])=>'<div class="stat"><b>'+v+'</b><span>'+label+' · '+({TP:'higher risk / positive',FP:'higher risk / negative',TN:'lower risk / negative',FN:'lower risk / positive'}[label])+'</span></div>').join('');
}
function renderAnswerStatus(){if(!$('#answerStatus'))return;const exists=Object.prototype.hasOwnProperty.call(state.answers||{},key());$('#answerStatus').textContent=dirty[key()]?'Draft changed — submit to save.':exists?'Response saved.':state.voting_open?'Choose a response, then submit.':'No response submitted.';$('#submit').textContent=exists?'Update response':'Submit response';netStatus();}
async function submit(){
 if(busy||!fresh())return;let v=value();const a=activity();
 if(a.kind==='threshold'&&v===undefined)v=+$('#threshold').value;
 if(v===undefined){showNotice('Choose a response first.');return;}
 if(a.kind==='tokens'){v={...Object.fromEntries(Object.keys(C.stakeholders).map(k=>[k,0])),...v};if(Object.values(v).reduce((a,b)=>a+b,0)!==10){showNotice('Allocate exactly 10 tokens, then submit.');return;}}
 if(a.kind==='principles'&&(v.length<2||v.length>3)){showNotice('Select two or three principles, then submit.');return;}
 busy=true;netStatus();const k=key();
 try{await rpc('lab_submit',{p_join:joinKey,p_token:token,p_stage:state.stage,p_context:state.context,p_answer:v});dirty[k]=false;state.answers[k]=v;showNotice('');await refresh();renderAnswerStatus();}
 catch(e){showNotice('Not submitted: '+e.message);await refresh();}finally{busy=false;netStatus();}
}
const sumCounts=o=>Object.values(o||{}).reduce((a,b)=>a+Number(b),0);
function bars(counts,labels,denominator){const n=denominator??sumCounts(counts);return !n?'<p>No submitted responses yet.</p>':Object.entries(labels).map(([k,label])=>{const c=counts?.[k]||0,pct=Math.round(c/n*100);return '<div class="bar-row"><span>'+esc(label)+'</span><div class="bar"><i style="width:'+pct+'%"></i></div><span class="bar-value">'+c+' · '+pct+'%</span></div>';}).join('');}
function renderResults(){
 const el=$('#results');if(!el)return;
 if(!state.results_visible&&!state.ended){el.innerHTML='<p class="small">Results remain hidden until voting closes.</p>';return;}
 const a=activity(),agg=state.aggregates||{};let html='<h3>Class responses</h3>';
 if(a?.kind==='poll')html+=bars(agg[a.key],a.options);
 if(a?.kind==='threshold'){
  for(const context of ['detention','support']){const counts=agg['threshold_'+context]||{},n=sumCounts(counts);html+='<h3>'+context[0].toUpperCase()+context.slice(1)+' scenario</h3>'+bars(counts,Object.fromEntries(Array.from({length:8},(_,i)=>[i+2,'Threshold ≥ '+(i+2)])));if(n)html+='<p class="small">'+n+' submitted · mean '+(Object.entries(counts).reduce((s,[k,c])=>s+Number(k)*c,0)/n).toFixed(1)+'</p>';}
 }
 if(a?.kind==='tokens'){const n=agg.tokens_n||0;html+='<p>'+n+' complete allocations · average tokens per respondent</p>';html+=!n?'':Object.entries(C.stakeholders).map(([k,label])=>{const avg=(agg.tokens?.[k]||0)/n;return '<div class="bar-row"><span>'+esc(label)+'</span><div class="bar"><i style="width:'+avg*10+'%"></i></div><span class="bar-value">'+avg.toFixed(1)+' / 10</span></div>';}).join('');}
 if(a?.kind==='principles')html+='<p class="small">Percent of '+(agg.principles_n||0)+' respondents selecting each principle. Multiple choices; percentages need not add to 100%.</p>'+bars(agg.principles,C.principles,agg.principles_n||0);
 if(state.stage===9||state.ended)html+='<div class="cols"><section><h3>Opening vote</h3>'+bars(agg.initial,C.trust)+'</section><section><h3>Final vote</h3>'+bars(agg.final,C.trust)+'</section></div><p class="small">'+(agg.changed_n||0)+' changed answers among '+(agg.paired_n||0)+' browsers that submitted both. These are browser responses, not verified unique people.</p>';
 el.innerHTML=html;
}
function renderClock(){const el=$('#timer');if(!el||!state)return;let sec=state.timer_end?Math.max(0,Math.ceil((Date.parse(state.timer_end)-(Date.now()+serverOffset))/1000)):state.timer_remaining;el.textContent=sec?String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0'):'--:--';}
function exportSummary(){const data={activity:'COMPAS Fairness Lab v3',exported_at:new Date().toISOString(),participants:state.participants,aggregates:state.aggregates};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='COMPAS-class-summary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copyCohost(){const u=rootUrl();u.searchParams.set('host',host.id);u.hash='key='+host.host+'&join='+host.join;if(confirm('This private link grants facilitator control. Share it only with your co-facilitator, never with students.')){await copy(u.toString());showNotice('Private co-facilitator link ready. The student QR remains separate.');}}
setInterval(()=>{renderClock();netStatus();},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&role!=='setup')refresh();});
document.addEventListener('keydown',e=>{if(!isHost()||!state||state.ended||$('#qrDialog').open||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight'&&state.stage<9)command('stage',state.stage+1);if(e.key==='ArrowLeft'&&state.stage>0)command('stage',state.stage-1);});
(async()=>{
 const params=new URLSearchParams(location.search),j=params.get('join'),h=params.get('host'),fragment=new URLSearchParams(location.hash.slice(1));
 if(j){if(!/^[a-f0-9]{32}$/.test(j)){showNotice('Invalid classroom link. Scan the current QR from the facilitator.');$('#main').textContent='Unable to join.';return;}await enterStudent(j);}
 else if(h){const saved=read('lab3_host');host=fragment.get('key')?{id:h,host:fragment.get('key'),join:fragment.get('join')}:saved?.id===h?saved:null;
  if(!host){setup();showNotice('This browser has no facilitator credential for that room. Open the private co-facilitator link, or resume on the original browser.');return;}
  write('lab3_host',host);await enterHost();
 }else{setup();if(params.has('session'))showNotice('This is an old v2 classroom link. Create a new classroom and scan its new QR.');}
})();
})();
