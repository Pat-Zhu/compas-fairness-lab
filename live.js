(() => {
  const SETTINGS_KEY="compas-fairness-live-v2";
  const settings=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}");
  const cfg=window.SUPABASE_CONFIG||{};
  const hasConfig=Boolean(cfg.url&&cfg.anonKey&&window.supabase);
  const participantId=settings.participantId||crypto.randomUUID();
  settings.participantId=participantId;

  const params=new URLSearchParams(location.search);
  let room=normalizeCode(params.get("session")||"");
  let client=null;
  let rows=new Map();
  let channel=null;
  let currentState=null;
  let initialized=false;
  let createdHere=false;

  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const persist=()=>localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  persist();

  function normalizeCode(v){
    return String(v||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  }

  function randomCode(){
    const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out="";
    crypto.getRandomValues(new Uint32Array(6)).forEach(n=>out+=alphabet[n%alphabet.length]);
    return out;
  }

  function shareUrl(code=room){
    const u=new URL(location.href);
    u.search="";
    u.hash="";
    u.searchParams.set("session",code);
    return u.toString();
  }

  function setBadge(mode,text){
    const b=$("#liveBadge"),t=$("#liveBadgeText");
    if(!b||!t)return;
    b.classList.remove("online","offline","connecting");
    b.classList.add(mode);
    t.textContent=text;
  }

  function setMessage(html){
    const el=$("#liveSetupMessage");
    if(el)el.innerHTML=html;
  }

  function renderQr(){
    const panel=$("#qrJoinPanel");
    const target=$("#classQrCode");
    if(!panel||!target)return;

    if(!room||!createdHere){
      panel.hidden=true;
      target.innerHTML="";
      return;
    }

    panel.hidden=false;
    target.innerHTML="";

    if(window.QRCode){
      new QRCode(target,{
        text:shareUrl(),
        width:192,
        height:192,
        colorDark:"#07111e",
        colorLight:"#ffffff",
        correctLevel:QRCode.CorrectLevel.M
      });
    }else{
      target.innerHTML='<div style="color:#111;text-align:center;padding:16px">QR library did not load.<br>Use “Copy student link”.</div>';
    }
  }

  async function saveState(state){
    currentState=state;
    if(!client||!room)return;

    const payload={
      session_code:room,
      participant_id:participantId,
      state:state,
      updated_at:new Date().toISOString()
    };

    const {error}=await client
      .from("class_responses")
      .upsert(payload,{onConflict:"session_code,participant_id"});

    if(error)setMessage("Live sync error: "+escapeHtml(error.message));
  }

  async function fetchAll(){
    if(!client||!room)return;

    const {data,error}=await client
      .from("class_responses")
      .select("participant_id,state,updated_at")
      .eq("session_code",room);

    if(error){
      setMessage("Could not load the live classroom: "+escapeHtml(error.message));
      return;
    }

    rows=new Map((data||[]).map(r=>[r.participant_id,r]));
    renderAll();
  }

  function subscribe(){
    if(channel){
      client.removeChannel(channel);
      channel=null;
    }
    if(!client||!room)return;

    channel=client
      .channel("room-"+room)
      .on(
        "postgres_changes",
        {event:"*",schema:"public",table:"class_responses",filter:"session_code=eq."+room},
        payload=>{
          const row=payload.new;
          if(row&&row.participant_id)rows.set(row.participant_id,row);
          renderAll();
        }
      )
      .subscribe(status=>{
        if(status==="SUBSCRIBED"){
          setBadge("online",createdHere?"Live classroom":"Connected");
        }
      });
  }

  async function join(code,{facilitator=false}={}){
    if(!hasConfig){
      setMessage('Live mode is not configured. Check <code>config.js</code>.');
      return;
    }

    code=normalizeCode(code);
    if(code.length!==6){
      setMessage("This classroom link is invalid.");
      return;
    }

    createdHere=facilitator;
    setBadge("connecting","Connecting…");
    room=code;

    history.replaceState(null,"","?session="+room);

    $("#copyRoomLinkBtn").hidden=!createdHere;
    $("#leaveRoomBtn").hidden=false;

    renderQr();
    await fetchAll();
    subscribe();
    await saveState(currentState||window.COMPAS_SESSION||{});

    if(createdHere){
      setMessage("Live classroom is ready. Put the QR code on the projector and ask students to scan it.");
    }else{
      setMessage("You are connected to the live classroom. Keep this page open and follow the facilitator.");
    }
  }

  function leave(){
    if(channel&&client)client.removeChannel(channel);

    channel=null;
    room="";
    rows.clear();
    createdHere=false;

    history.replaceState(null,"",location.pathname);

    $("#copyRoomLinkBtn").hidden=true;
    $("#leaveRoomBtn").hidden=true;

    renderQr();

    setBadge("offline",hasConfig?"Live ready":"Local mode");
    setMessage(
      hasConfig
        ?"Create a classroom QR when you are ready to begin."
        :"Local mode is active. Live aggregation needs Supabase configuration."
    );

    renderAll();
  }

  function pollCounts(id){
    const counts={};
    let n=0;

    rows.forEach(r=>{
      const v=r.state?.polls?.[id];
      if(v){
        counts[v]=(counts[v]||0)+1;
        n++;
      }
    });

    return {counts,n};
  }

  function liveBars(title,counts,n){
    if(!n){
      return '<h4>'+title+'</h4><div class="live-empty">Waiting for class responses…</div>';
    }

    const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);

    return '<h4>'+title+'</h4><div class="live-count">'+n+' live response'+(n===1?"":"s")+'</div>'+
      entries.map(([label,count])=>{
        const pct=Math.round(count/n*100);
        return '<div class="live-row"><span class="label">'+escapeHtml(label)+'</span><span class="live-bar"><i style="width:'+pct+'%"></i></span><strong>'+pct+'%</strong></div>';
      }).join("");
  }

  function renderPolls(){
    $$("[data-live-poll]").forEach(el=>{
      if(!room){
        el.classList.remove("active");
        el.innerHTML="";
        return;
      }

      const id=el.dataset.livePoll;
      const {counts,n}=pollCounts(id);

      el.classList.add("active");
      el.innerHTML=liveBars("Live class results",counts,n);
    });
  }

  function renderThreshold(){
    const el=$("[data-live-threshold]");
    if(!el)return;

    if(!room){
      el.classList.remove("active");
      el.innerHTML="";
      return;
    }

    const vals=[];
    rows.forEach(r=>{
      const v=Number(r.state?.threshold);
      if(v>=2&&v<=9)vals.push(v);
    });

    const counts={};
    vals.forEach(v=>{
      counts["Threshold ≥ "+v]=(counts["Threshold ≥ "+v]||0)+1;
    });

    el.classList.add("active");
    el.innerHTML=liveBars("Class threshold choices",counts,vals.length);

    if(vals.length){
      const avg=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
      el.innerHTML+='<div class="live-count">Class mean threshold: <b>'+avg+'</b></div>';
    }
  }

  function renderTokens(){
    const el=$("[data-live-tokens]");
    if(!el)return;

    if(!room){
      el.classList.remove("active");
      el.innerHTML="";
      return;
    }

    const sums={};
    let n=0;

    rows.forEach(r=>{
      const tok=r.state?.tokens;
      if(tok&&Object.values(tok).some(v=>Number(v)>0)){
        n++;
        Object.entries(tok).forEach(([k,v])=>{
          sums[k]=(sums[k]||0)+Number(v||0);
        });
      }
    });

    el.classList.add("active");

    if(!n){
      el.innerHTML='<h4>Live class allocation</h4><div class="live-empty">Waiting for token allocations…</div>';
      return;
    }

    const avgs={};
    Object.entries(sums).forEach(([k,v])=>avgs[k]=v/n);

    const total=Object.values(avgs).reduce((a,b)=>a+b,0)||1;

    el.innerHTML=
      '<h4>Average influence allocation</h4>'+
      '<div class="live-count">'+n+' completed allocation'+(n===1?"":"s")+'</div>'+
      Object.entries(avgs)
        .sort((a,b)=>b[1]-a[1])
        .map(([k,v])=>{
          const pct=Math.round(v/total*100);
          return '<div class="live-row"><span class="label">'+escapeHtml(k)+'</span><span class="live-bar"><i style="width:'+pct+'%"></i></span><strong>'+v.toFixed(1)+'</strong></div>';
        })
        .join("");
  }

  function renderPrinciples(){
    const el=$("[data-live-principles]");
    if(!el)return;

    if(!room){
      el.classList.remove("active");
      el.innerHTML="";
      return;
    }

    const counts={};
    let n=0;

    rows.forEach(r=>{
      const list=r.state?.principles;
      if(Array.isArray(list)&&list.length){
        n++;
        list.forEach(p=>counts[p]=(counts[p]||0)+1);
      }
    });

    el.classList.add("active");
    el.innerHTML=liveBars("Most selected team principles",counts,n);
  }

  function renderComparison(){
    const el=$("[data-live-comparison]");
    if(!el)return;

    if(!room){
      el.classList.remove("active");
      el.innerHTML="";
      return;
    }

    const before=pollCounts("initial");
    const after=pollCounts("final");

    el.classList.add("active");
    el.innerHTML=
      '<h4>Class before / after</h4><div class="grid">'+
      '<div class="card span-6">'+liveBars("Opening vote",before.counts,before.n)+'</div>'+
      '<div class="card span-6">'+liveBars("Final vote",after.counts,after.n)+'</div>'+
      '</div>';
  }

  function renderAll(){
    renderPolls();
    renderThreshold();
    renderTokens();
    renderPrinciples();
    renderComparison();

    if(room&&createdHere){
      const n=rows.size;
      setMessage(
        "Live classroom is ready. "+
        n+
        " device"+
        (n===1?" is":"s are")+
        " currently represented in this session."
      );
    }
  }

  function escapeHtml(v){
    return String(v??"").replace(
      /[&<>"']/g,
      c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])
    );
  }

  function wireUI(){
    if(initialized)return;
    initialized=true;

    if(hasConfig){
      client=window.supabase.createClient(
        cfg.url,
        cfg.anonKey,
        {auth:{persistSession:false}}
      );
      setBadge("offline","Live ready");
      setMessage("Create a classroom QR when you are ready to begin.");
    }else{
      setBadge("offline","Local mode");
      setMessage(
        'Local mode is active. The realtime interface needs Supabase configuration in <code>config.js</code>.'
      );
    }

    $("#createRoomBtn").onclick=async()=>{
      const code=randomCode();
      await join(code,{facilitator:true});
    };

    $("#copyRoomLinkBtn").onclick=async()=>{
      await navigator.clipboard.writeText(shareUrl());
      setMessage(
        "Student link copied. You can use it as a backup if someone cannot scan the QR code."
      );
    };

    $("#leaveRoomBtn").onclick=leave;

    $("#liveBadge").onclick=()=>{
      $("#liveSetup")?.scrollIntoView({behavior:"smooth",block:"center"});
    };
  }

  async function init(state){
    currentState=state;
    wireUI();

    if(room&&hasConfig){
      await join(room,{facilitator:false});
    }
  }

  window.LiveClass={
    init,
    saveState,
    join,
    leave,
    renderAll,
    get room(){return room}
  };
})();