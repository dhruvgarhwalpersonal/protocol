/* ═══════════════════════════════════════════════
   CONSTANTS & STATE
═══════════════════════════════════════════════ */
var SK='protocol_v1';
var chartInst={};
var addTaskType='core';
var activeWeekIdx=0;
var activeMonthName=null;
var editingWeekIdx=-1;
var weekTabsScrollX=0;
var isEditingPastDay=false;
var pastDayEdits={};

var START_DATE=new Date('2026-04-07');
START_DATE.setHours(0,0,0,0);
var viewingDate=new Date();viewingDate.setHours(0,0,0,0);
var TODAY=new Date();TODAY.setHours(0,0,0,0);

/* SOLID THEMES (8) */
var THEMES_SOLID=[
  {id:'darkblue',label:'Dark Blue',bg:'#0d0d0f',accent:'#4a8fff',gradient:false},
  {id:'nord',label:'Nord',bg:'#2e3440',accent:'#88c0d0',gradient:false},
  {id:'soft',label:'Soft',bg:'#1a1625',accent:'#c084fc',gradient:false},
  {id:'ocean',label:'Ocean',bg:'#0a1628',accent:'#38bdf8',gradient:false},
  {id:'forest',label:'Forest',bg:'#0d1a0f',accent:'#4ade80',gradient:false},
  {id:'minimal',label:'Minimal',bg:'#f8f8f6',accent:'#2563eb',gradient:false},
  {id:'ember',label:'Ember',bg:'#120a08',accent:'#ff6b35',gradient:false},
  {id:'slate',label:'Slate',bg:'#0f1117',accent:'#64b5f6',gradient:false}
];

/* GRADIENT THEMES (8) */
var THEMES_GRADIENT=[
  {id:'aurora',label:'🌌 Aurora',gradient:true,
   swatchGrad:'linear-gradient(135deg,#070b14 0%,#0a1a3a 35%,#0d2818 65%,#150d28 100%)',
   bodyClass:'aurora'},
  {id:'dusk',label:'🌆 Dusk',gradient:true,
   swatchGrad:'linear-gradient(135deg,#0d0818 0%,#1a0830 35%,#2a0a20 65%,#180838 100%)',
   bodyClass:'dusk'},
  {id:'sol',label:'☀️ Sol',gradient:true,
   swatchGrad:'linear-gradient(135deg,#0c0800 0%,#1a1005 35%,#221400 65%,#100808 100%)',
   bodyClass:'sol'},
  {id:'neo',label:'🌐 Neo',gradient:true,
   swatchGrad:'linear-gradient(135deg,#000a0a 0%,#001818 35%,#002020 65%,#001010 100%)',
   bodyClass:'neo'},
  {id:'volcano',label:'🌋 Volcano',gradient:true,
   swatchGrad:'linear-gradient(135deg,#1a0000 0%,#2d0a00 30%,#1a0010 65%,#0a000a 100%)',
   bodyClass:'volcano'},
  {id:'midnight',label:'🌌 Midnight',gradient:true,
   swatchGrad:'linear-gradient(135deg,#000510 0%,#050028 40%,#100020 70%,#000510 100%)',
   bodyClass:'midnight'},
  {id:'sakura',label:'🌸 Sakura',gradient:true,
   swatchGrad:'linear-gradient(135deg,#1a0818 0%,#280d24 35%,#0d1820 65%,#180820 100%)',
   bodyClass:'sakura'},
  {id:'matrix',label:'💻 Matrix',gradient:true,
   swatchGrad:'linear-gradient(135deg,#000800 0%,#001400 40%,#000d00 70%,#000500 100%)',
   bodyClass:'matrix'}
];

var ALL_THEMES=THEMES_SOLID.concat(THEMES_GRADIENT);

var QUOTES=[
  {q:'The mind is everything. What you think, you become.',a:'Buddha'},
  {q:'Success is the sum of small efforts, repeated day in and day out.',a:'Robert Collier'},
  {q:'Discipline is the bridge between goals and accomplishment.',a:'Jim Rohn'},
  {q:'The secret of getting ahead is getting started.',a:'Mark Twain'},
  {q:'It does not matter how slowly you go as long as you do not stop.',a:'Confucius'},
  {q:'Your time is limited. Do not waste it living someone else\'s life.',a:'Steve Jobs'},
  {q:'Hard work beats talent when talent doesn\'t work hard.',a:'Tim Notke'},
  {q:'The only way to do great work is to love what you do.',a:'Steve Jobs'}
];

var MONTHS=['April','May','June','July','August','September','October','November','December'];

var SHORTCUTS=[
  {id:'daily',label:'Daily',icon:'◈'},
  {id:'data',label:'Data',icon:'◉'},
  {id:'weekly',label:'Weekly',icon:'▦'},
  {id:'monthly',label:'Monthly',icon:'◳'},
  {id:'deadlines',label:'Goals',icon:'◷'}
];

/* ─── LOAD / SAVE — routed through ProtocolDB for per-user isolation ─── */
function loadState(){
  var data = window.ProtocolDB ? window.ProtocolDB.getState() : null;
  if(data && data.tasks && data.weeks) return data;
  return defState();
}
function saveState(){
  if(window.ProtocolDB) window.ProtocolDB.saveState(S);
}
function loadSettings(){
  var cfg = window.ProtocolDB ? window.ProtocolDB.getConfig() : null;
  if(cfg) return cfg;
  /* Build default config — use the logged-in user's display name */
  var uname = 'User';
  if(window.ProtocolAuth){var u=window.ProtocolAuth.currentUser();if(u)uname=u.displayName||u.username;}
  return{theme:'darkblue',username:uname,quotes:true,startdate:'2026-04-07',use12hr:false};
}
function saveSettings2(){
  if(window.ProtocolDB) window.ProtocolDB.saveConfig(CFG);
}

/* ── S and CFG start null; assigned in protocolBoot() AFTER DB prefetch ── */
var S=null;
var CFG=null;

function defState(){
  return{
    tasks:{
      'cat_core':[
        {id:'c1',text:'Study — Sets NCERT Ch.1 (set exact pages each morning)',done:false},
        {id:'c2',text:'Workout — running + pullups + pushups',done:false},
        {id:'c3',text:'Journaling — min 5 honest lines',done:false}
      ],
      'cat_bonus':[
        {id:'b1',text:'Study Block 2 — bridge course / next topic',done:false},
        {id:'b2',text:'Python — minimum 20 min',done:false},
        {id:'b3',text:'Reading — 12 pages',done:false},
        {id:'b4',text:'Podcast — 1 episode',done:false},
        {id:'b5',text:'Meditation — 10 min',done:false}
      ],
      'cat_health':[
        {id:'h1',text:'All meals completed',done:false},
        {id:'h2',text:'Walk after dinner — 15 min',done:false},
        {id:'h3',text:'Sunlight — 10 min midday',done:false}
      ]
    },
    taskCategories:[
      {id:'cat_core',  name:'Core',   color:'#ff5c5c'},
      {id:'cat_bonus', name:'Bonus',  color:'#4a8fff'},
      {id:'cat_health',name:'Health', color:'#3fcf8e'}
    ],
    dayHistory:{},
    activeData:[
      {id:'ad1',text:'Pullup progression: Day1→8,8,5,5,4 | Day2→10,10,6,4 | Day3→15,15'},
      {id:'ad2',text:'PMO trigger window 11am–12pm. Counter: start a task immediately at 11am'},
      {id:'ad3',text:'System collapse pattern: one miss → full day abandoned. Fix: min mode (3 core only)'},
      {id:'ad4',text:'Infection active (eye). Medicines on schedule. Review Apr 21.'},
      {id:'ad5',text:'Study time issue: 9am wrong slot, morning drowsy, evening reading difficult'}
    ],
    passiveData:[],
    weeks:[
      {id:'w1',label:'Week 1 — Apr 7–13',month:'April',goals:['Complete Sets Ch.1 lectures','Start bridge course Physics','Establish workout habit'],
       days:[
        {date:'Apr 7',coreDone:3,bonusDone:2,healthDone:3,total:11,tasks:[
          {text:'Study Sets Lecture 1',cat:'core',done:true},{text:'Workout',cat:'core',done:true},{text:'Journal',cat:'core',done:true},
          {text:'Python 20min',cat:'bonus',done:true},{text:'Reading 12pg',cat:'bonus',done:true},{text:'Podcast',cat:'bonus',done:false},{text:'Meditation',cat:'bonus',done:false},
          {text:'All meals',cat:'health',done:true},{text:'Walk',cat:'health',done:true},{text:'Sunlight',cat:'health',done:true},{text:'Diet',cat:'health',done:false}]},
        {date:'Apr 8',coreDone:3,bonusDone:2,healthDone:3,total:11,tasks:[
          {text:'Study Sets Lecture 2',cat:'core',done:true},{text:'Workout',cat:'core',done:true},{text:'Journal',cat:'core',done:true},
          {text:'Python',cat:'bonus',done:true},{text:'Reading',cat:'bonus',done:true},{text:'Podcast',cat:'bonus',done:false},{text:'Meditation',cat:'bonus',done:false},
          {text:'Meals',cat:'health',done:true},{text:'Walk',cat:'health',done:true},{text:'Sunlight',cat:'health',done:true},{text:'Diet',cat:'health',done:false}]},
        {date:'Apr 9',coreDone:1,bonusDone:1,healthDone:0,total:11,tasks:[
          {text:'Study',cat:'core',done:true},{text:'Workout',cat:'core',done:false},{text:'Journal',cat:'core',done:false},
          {text:'Python',cat:'bonus',done:true},{text:'Reading',cat:'bonus',done:false},{text:'Podcast',cat:'bonus',done:false},{text:'Meditation',cat:'bonus',done:false},
          {text:'Meals',cat:'health',done:false},{text:'Walk',cat:'health',done:false},{text:'Sunlight',cat:'health',done:false},{text:'Diet',cat:'health',done:false}]},
        {date:'Apr 10',coreDone:3,bonusDone:1,healthDone:2,total:11,tasks:[
          {text:'Study',cat:'core',done:true},{text:'Workout',cat:'core',done:true},{text:'Journal',cat:'core',done:true},
          {text:'Python',cat:'bonus',done:true},{text:'Reading',cat:'bonus',done:false},{text:'Podcast',cat:'bonus',done:false},{text:'Meditation',cat:'bonus',done:false},
          {text:'Meals',cat:'health',done:true},{text:'Walk',cat:'health',done:true},{text:'Sunlight',cat:'health',done:false},{text:'Diet',cat:'health',done:false}]},
        {date:'Apr 11',coreDone:2,bonusDone:0,healthDone:0,total:11,tasks:[
          {text:'Study',cat:'core',done:true},{text:'Workout',cat:'core',done:true},{text:'Journal',cat:'core',done:false},
          {text:'Python',cat:'bonus',done:false},{text:'Reading',cat:'bonus',done:false},{text:'Podcast',cat:'bonus',done:false},{text:'Meditation',cat:'bonus',done:false},
          {text:'Meals',cat:'health',done:false},{text:'Walk',cat:'health',done:false},{text:'Sunlight',cat:'health',done:false},{text:'Diet',cat:'health',done:false}]},
        {date:'Apr 13',coreDone:1,bonusDone:0,healthDone:1,total:11,tasks:[
          {text:'Workout',cat:'core',done:true},{text:'Study',cat:'core',done:false},{text:'Journal',cat:'core',done:false},
          {text:'Python',cat:'bonus',done:false},{text:'Reading',cat:'bonus',done:false},{text:'Podcast',cat:'bonus',done:false},{text:'Meditation',cat:'bonus',done:false},
          {text:'Walk',cat:'health',done:true},{text:'Meals',cat:'health',done:false},{text:'Sunlight',cat:'health',done:false},{text:'Diet',cat:'health',done:false}]}
      ]}
    ],
    deadlines:[
      {id:'dl1',name:'Sets — complete',date:'16 Apr 2026'},
      {id:'dl2',name:'Bridge Course — all 3 subjects',date:'19 Apr 2026'},
      {id:'dl3',name:'30 pushups in one set',date:'30 Apr 2026'},
      {id:'dl4',name:'15 pullups in one set',date:'30 Apr 2026'},
      {id:'dl5',name:'Linear Inequations',date:'30 Apr 2026'},
      {id:'dl6',name:'Limitless (book)',date:'15 May 2026'},
      {id:'dl7',name:'12th full syllabus',date:'30 Nov 2026'},
      {id:'dl8',name:'Python — advanced level',date:'31 Dec 2026'}
    ]
  };
}

/* ─── UTILS ─── */
function uid(){return Math.random().toString(36).substr(2,8);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtDate(d){return d.getDate()+' '+d.toLocaleString('en',{month:'short'});}
function fmtDateFull(d){return d.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
function fmtDateKey(d){return d.toISOString().split('T')[0];}
function parseDate(str){var d=new Date(str);d.setHours(0,0,0,0);return d;}
function daysUntil(str){
  var d=new Date(str);
  /* try numeric parse */
  if(isNaN(d.getTime())){
    /* try "DD Mon YYYY" */
    var parts=str.split(' ');
    if(parts.length>=3){
      d=new Date(parts[1]+' '+parts[0]+', '+parts[2]);
    }
  }
  if(isNaN(d.getTime()))return 999;
  d.setHours(0,0,0,0);
  var t=new Date();t.setHours(0,0,0,0);
  return Math.round((d-t)/(864e5));
}
function destroyChart(id){if(chartInst[id]){chartInst[id].destroy();delete chartInst[id];}}
function isToday(){return viewingDate.getTime()===TODAY.getTime();}
function dateKey(){return fmtDateKey(viewingDate);}

/* ─── THEME ─── */
function applyTheme(id){
  if(CFG) CFG.theme=id;
  var el=document.documentElement;
  var body=document.body;
  /* remove all gradient data attrs */
  body.removeAttribute('data-gradient');
  /* find theme */
  var found=ALL_THEMES.find(function(t){return t.id===id;});
  if(!found){el.removeAttribute('data-theme');return;}
  if(found.gradient){
    el.setAttribute('data-theme',id);
    body.setAttribute('data-gradient',id);
  }else{
    if(id==='darkblue')el.removeAttribute('data-theme');
    else el.setAttribute('data-theme',id);
  }
  document.querySelectorAll('.theme-btn').forEach(function(b){b.classList.toggle('active',b.dataset.theme===id);});
}

function buildThemeGrid(){
  buildThemeGridSection('settings-theme-grid-solid',THEMES_SOLID);
  buildThemeGridSection('settings-theme-grid-gradient',THEMES_GRADIENT);
}

function buildThemeGridSection(gridId,themes){
  var g=document.getElementById(gridId);if(!g)return;g.innerHTML='';
  themes.forEach(function(t){
    var b=document.createElement('button');
    b.className='theme-btn'+(CFG.theme===t.id?' active':'');
    b.dataset.theme=t.id;
    var swatchHtml;
    if(t.gradient){
      swatchHtml='<div class="theme-swatch"><div class="theme-swatch-gradient" style="background:'+t.swatchGrad+'"></div></div>';
    }else{
      swatchHtml='<div class="theme-swatch" style="background:'+t.bg+';border-color:'+(t.id==='minimal'?'#ccc':'rgba(255,255,255,.15)')+'"></div>';
    }
    b.innerHTML=swatchHtml+t.label;
    b.onclick=function(){applyTheme(t.id);saveSettings2();buildThemeGrid();};
    g.appendChild(b);
  });
}

/* ─── SIDEBAR ─── */
var sbVisible=false;
function showSidebar(){sbVisible=true;document.getElementById('sidebar').classList.add('visible');}
function hideSidebar(){sbVisible=false;document.getElementById('sidebar').classList.remove('visible');}
/* sbToggleGoals removed */
document.getElementById('sb-trigger').addEventListener('mouseenter',showSidebar);
document.getElementById('sidebar').addEventListener('mouseleave',hideSidebar);

/* Works whether we're on home or in app */
function sidebarGoHome(){
  hideSidebar();
  updateHomeStats();
  var _h=document.getElementById('home');_h.classList.remove('hidden');_h.classList.add('visible');
}


/* ─── CLOCK (12/24 hr) ─── */
function formatClock(now){
  if(CFG.use12hr){
    var h=now.getHours();
    var ampm=h>=12?'PM':'AM';
    h=h%12||12;
    var m=String(now.getMinutes()).padStart(2,'0');
    return {time:h+':'+m,ampm:ampm};
  }else{
    var h2=String(now.getHours()).padStart(2,'0');
    var m2=String(now.getMinutes()).padStart(2,'0');
    return {time:h2+':'+m2,ampm:''};
  }
}

/* ─── HOME ─── */
function updateClock(){
  if(!CFG)return;
  var now=new Date();
  var fmt=formatClock(now);
  document.getElementById('home-time-hm').textContent=fmt.time;
  document.getElementById('home-time-ampm').textContent=fmt.ampm;
  var greet=now.getHours()<12?'Good morning':now.getHours()<17?'Good afternoon':'Good evening';
  document.getElementById('home-greeting').textContent=greet+', '+(CFG.username||'Dhruv');
  document.getElementById('home-date').textContent=now.toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
}
function buildHomeShortcuts(){}
function enterApp(){
  var _h=document.getElementById('home');
  _h.classList.add('hidden');_h.classList.remove('visible');
}
function goHome(){
  hideSidebar();
  /* Hide all panels instantly before home fades in */
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  updateHomeStats();
  var _h=document.getElementById('home');_h.classList.remove('hidden');_h.classList.add('visible');
}
function closeSettings(){document.getElementById('settings-modal').classList.remove('open');}
/* Font application */
var FONTS=[
  {id:'dmsans',label:'DM Sans',family:"'DM Sans',sans-serif"},
  {id:'spacegrotesk',label:'Space Grotesk',family:"'Space Grotesk',sans-serif"},
  {id:'inter',label:'Inter',family:"'Inter',sans-serif"},
  {id:'outfit',label:'Outfit',family:"'Outfit',sans-serif"},
  {id:'jakarta',label:'Jakarta Sans',family:"'Plus Jakarta Sans',sans-serif"}
];
function applyFont(id){
  if(CFG) CFG.font=id;
  var body=document.body;
  FONTS.forEach(function(f){body.classList.remove('font-'+f.id);});
  body.classList.add('font-'+id);
  document.querySelectorAll('.font-btn').forEach(function(b){b.classList.toggle('active',b.dataset.font===id);});
}
function buildFontGrid(){
  var g=document.getElementById('font-grid');if(!g)return;g.innerHTML='';
  FONTS.forEach(function(f){
    var b=document.createElement('button');
    b.className='theme-btn font-btn'+(( CFG.font||'dmsans')===f.id?' active':'');
    b.dataset.font=f.id;
    b.style.fontFamily=f.family;
    b.innerHTML='<div style="font-size:15px;font-weight:600;margin-bottom:3px">Aa</div><div style="font-size:10px;color:var(--text3)">'+f.label+'</div>';
    b.onclick=function(){applyFont(f.id);saveSettings2();buildFontGrid();};
    g.appendChild(b);
  });
}
function toggleSetting(key,btn){
  CFG[key]=!CFG[key];btn.classList.toggle('on',CFG[key]);saveSettings2();
  if(key==='use12hr')updateClock();
}

/* ─── EXPORT ─── */
function exportData(){
  var exportObj={
    version:'1.0',
    exportedAt:new Date().toISOString(),
    exportedBy:'Dhruv Garhwal',
    appName:'Protocol',
    state:S,
    settings:CFG
  };
  var blob=new Blob([JSON.stringify(exportObj,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  var d=new Date();
  a.download='protocol_export_'+d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'.json';
  a.click();
}

/* ─── IMPORT ─── */
function openImport(){
  document.getElementById('import-file-input').value='';
  openModal('modal-import');
}
function confirmImport(){
  var fileInput=document.getElementById('import-file-input');
  if(!fileInput.files||!fileInput.files[0]){alert('Please select a JSON file first.');return;}
  var file=fileInput.files[0];
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var parsed=JSON.parse(e.target.result);
      /* Support both raw state and wrapped export */
      var importedState=null;
      var importedCfg=null;
      if(parsed.state&&parsed.state.tasks&&parsed.state.weeks){
        importedState=parsed.state;
        importedCfg=parsed.settings||null;
      }else if(parsed.tasks&&parsed.weeks){
        importedState=parsed;
      }else{
        alert('Invalid file format. Please use a file exported from Protocol.');return;
      }
      /* Validate structure */
      if(!importedState.tasks||!importedState.weeks){
        alert('File is missing required data fields.');return;
      }
      /* Ensure all required fields exist */
      if(!importedState.dayHistory)importedState.dayHistory={};
      if(!importedState.activeData)importedState.activeData=[];
      if(!importedState.passiveData)importedState.passiveData=[];
      if(!importedState.deadlines)importedState.deadlines=[];
      /* Apply */
      S=importedState;
      saveState();
      if(importedCfg){
        CFG=importedCfg;
        saveSettings2();
        applyTheme(CFG.theme||'darkblue');
      }
      closeModal('modal-import');
      renderAll();
      updateHomeStats();
      alert('Data imported successfully! All panels updated.');
    }catch(err){
      alert('Error reading file: '+err.message);
    }
  };
  reader.readAsText(file);
}

function resetAll(){
  if(!confirm('Reset ALL data? This cannot be undone.'))return;
  var username="";if(window.ProtocolAuth){var u=window.ProtocolAuth.currentUser();if(u)username=u.username;}if(window.ProtocolDB&&username)window.ProtocolDB.clearUserData(username);S=defState();saveState();location.reload();
}

/* ─── PANEL SWITCH ─── */
function switchPanel(id,el){
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  document.getElementById('panel-'+id).classList.add('active');
  if(el)el.classList.add('active');
  else{var found=document.querySelector('[data-panel="'+id+'"]');if(found)found.classList.add('active');}
  renderAll();hideSidebar();
}

/* ─── MODALS ─── */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.addEventListener('click',function(e){if(e.target.classList.contains('modal-bg'))e.target.classList.remove('open');});
document.getElementById('settings-modal').addEventListener('click',function(e){if(e.target===this)closeSettings();});

/* ═══════════════════════════════════════════════
   DAILY — DATE NAVIGATION
═══════════════════════════════════════════════ */
function navDate(dir){
  var next=new Date(viewingDate.getTime()+dir*864e5);next.setHours(0,0,0,0);
  var maxDate=new Date(TODAY.getTime()+864e5);/* allow today+1 (tomorrow) */
  if(next<START_DATE)return;
  if(next>maxDate)return;
  if(isToday()&&dir<0){snapToday();}
  isEditingPastDay=false;pastDayEdits={};
  viewingDate=next;
  renderDaily();
}
function jumpToToday(){
  isEditingPastDay=false;pastDayEdits={};
  viewingDate=new Date();viewingDate.setHours(0,0,0,0);
  renderDaily();
}
function isTomorrow(){
  var tomorrow=new Date(TODAY.getTime()+864e5);tomorrow.setHours(0,0,0,0);
  return viewingDate.getTime()===tomorrow.getTime();
}
function snapToday(){
  ensureCategories();
  var key=fmtDateKey(TODAY);
  var snapshot={};
  S.taskCategories.forEach(function(cat){
    snapshot[cat.id]=S.tasks[cat.id].map(function(task){return{id:task.id,text:task.text,done:task.done};});
  });
  /* Legacy keys for compatibility */
  snapshot.core=snapshot[S.taskCategories[0]?S.taskCategories[0].id:'cat_core']||[];
  snapshot.bonus=snapshot[S.taskCategories[1]?S.taskCategories[1].id:'cat_bonus']||[];
  snapshot.health=snapshot[S.taskCategories[2]?S.taskCategories[2].id:'cat_health']||[];
  S.dayHistory[key]=snapshot;saveState();
}
function toggleEditMode(){
  isEditingPastDay=!isEditingPastDay;
  if(isEditingPastDay){
    ensureCategories();
    var key=fmtDateKey(viewingDate);
    var existing=S.dayHistory[key];
    if(existing){
      /* Deep-clone with guaranteed ids */
      var cloned={};
      S.taskCategories.forEach(function(cat){
        var src=existing[cat.id]||existing.core||[];
        /* Use category-specific data if available */
        if(existing[cat.id])src=existing[cat.id];
        cloned[cat.id]=src.map(function(t){return{id:t.id||uid(),text:t.text,done:!!t.done};});
      });
      S.dayHistory[key]=cloned;
    }else{
      /* Blank slate from today's templates */
      var blank={};
      S.taskCategories.forEach(function(cat){
        blank[cat.id]=(S.tasks[cat.id]||[]).map(function(t){return{id:uid(),text:t.text,done:false};});
      });
      S.dayHistory[key]=blank;
    }
    saveState();
  }else{
    pastDayEdits={};
  }
  var btn=document.getElementById('edit-toggle-btn');
  var sbtn=document.getElementById('save-day-btn');
  if(btn)btn.textContent=isEditingPastDay?'Cancel edit':'Edit';
  if(sbtn)sbtn.style.display=isEditingPastDay?'block':'none';
  renderDailyPanel();
  renderDynamicTasks();
}

/* Save past day: persist to dayHistory AND update/add in weekly DB */
function savePastDay(){
  ensureCategories();
  var key=fmtDateKey(viewingDate);
  var hist=S.dayHistory[key];
  if(!hist){alert('No data to save.');return;}
  var label=fmtDate(viewingDate);
  /* Count done per category */
  var allDone=0,allTotal=0;
  var cats=S.taskCategories;
  var coreDone=(hist[cats[0]?cats[0].id:'']||[]).filter(function(t){return t.done;}).length;
  var bonusDone=(hist[cats[1]?cats[1].id:'']||[]).filter(function(t){return t.done;}).length;
  var healthDone=(hist[cats[2]?cats[2].id:'']||[]).filter(function(t){return t.done;}).length;
  var dayTasks=[];
  cats.forEach(function(cat){
    var tasks=hist[cat.id]||[];
    allTotal+=tasks.length;
    allDone+=tasks.filter(function(t){return t.done;}).length;
    tasks.forEach(function(t){dayTasks.push({text:t.text,cat:cat.id,catName:cat.name,catColor:cat.color,done:t.done});});
  });
  var updatedInWeekly=false;
  S.weeks.forEach(function(w){
    w.days.forEach(function(d){
      if(d.date===label){
        d.coreDone=coreDone;d.bonusDone=bonusDone;d.healthDone=healthDone;
        d.total=allTotal;d.tasks=dayTasks;
        updatedInWeekly=true;
      }
    });
  });
  if(!updatedInWeekly&&S.weeks.length>0){
    var targetWeek=S.weeks[activeWeekIdx]||S.weeks[0];
    targetWeek.days.push({date:label,coreDone:coreDone,bonusDone:bonusDone,healthDone:healthDone,total:allTotal,tasks:dayTasks});
    updatedInWeekly=true;
  }
  isEditingPastDay=false;pastDayEdits={};
  saveState();renderDaily();
  if(updatedInWeekly)alert('Changes saved and synced to Weekly DB.');
  else alert('Saved to history. No week found to sync to — create a week in Weekly DB.');
}

function getPastDayData(){
  var key=fmtDateKey(viewingDate);
  var hist=S.dayHistory[key];
  if(hist)return hist;
  /* Fall back to weekly DB */
  var label=fmtDate(viewingDate);
  for(var i=0;i<S.weeks.length;i++){
    var w=S.weeks[i];
    for(var j=0;j<w.days.length;j++){
      if(w.days[j].date===label){
        /* Reconstruct per-category arrays from flat task list */
        var result={};
        ensureCategories();
        S.taskCategories.forEach(function(cat){result[cat.id]=[];});
        (w.days[j].tasks||[]).forEach(function(t){
          if(result[t.cat])result[t.cat].push({id:uid(),text:t.text,done:t.done});
          else{
            /* Legacy cat names */
            var matched=S.taskCategories.find(function(c){return c.name.toLowerCase()===t.cat.toLowerCase()||c.id===t.cat;});
            if(matched)result[matched.id].push({id:uid(),text:t.text,done:t.done});
          }
        });
        return result;
      }
    }
  }
  return null;
}

/* ─── RENDER DAILY ─── */
function renderAll(){
  if(!S||!CFG)return;
  ensureGoals();ensureCategories();ensureRevOS();
  document.getElementById('sb-date').textContent=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  renderDailyPanel();renderDynamicTasks();renderData();renderWeekly();renderMonthly();renderDeadlines();
  setTimeout(applyGradBars,100);
}

function renderDaily(){
  var isPast=viewingDate.getTime()<TODAY.getTime();
  var isTom=isTomorrow();
  document.getElementById('date-nav-label').textContent=isTom?'Tomorrow → Planning Mode':isPast?fmtDate(viewingDate):'Today';
  document.getElementById('date-nav-sub').textContent=fmtDateFull(viewingDate);
  document.getElementById('date-prev').disabled=viewingDate<=START_DATE;
  var maxViewDate=new Date(TODAY.getTime()+864e5);
  document.getElementById('date-next').disabled=viewingDate>=maxViewDate;
  document.getElementById('date-today-btn').style.display=(isPast||isTom)?'block':'none';
  var bar=document.getElementById('edit-day-bar');
  if(isPast||isTom){
    bar.classList.add('visible');
    document.getElementById('edit-day-label').textContent=fmtDate(viewingDate);
    var prefix=document.getElementById('edit-day-prefix');
    if(prefix)prefix.textContent=isTom?'Planning ahead — ':'Viewing past day — ';
    /* Tomorrow: show planning note, no edit/save to weekly */
    var etBtn=document.getElementById('edit-toggle-btn');
    var sdBtn=document.getElementById('save-day-btn');
    if(isTom){
      if(etBtn)etBtn.style.display='none';
      if(sdBtn)sdBtn.style.display='none';
    }else{
      if(etBtn){etBtn.style.display='inline-block';etBtn.textContent=isEditingPastDay?'Cancel edit':'Edit';}
      if(sdBtn)sdBtn.style.display=isEditingPastDay?'block':'none';
    }
  }else{bar.classList.remove('visible');}
  var saveBtn=document.getElementById('save-week-btn');
  if(saveBtn)saveBtn.style.display=(isPast||isTomorrow())?'none':'inline-block';
  renderDailyPanel();
  renderDynamicTasks();
}

/* renderDailyTasks is now an alias for renderDynamicTasks */
function renderDailyTasks(){renderDynamicTasks();}

/* Unified toggle for today and past */
function toggleTaskAt(type,idx,isPast){
  if(isPast){
    if(!isEditingPastDay)return;
    var key=fmtDateKey(viewingDate);
    var hist=S.dayHistory[key];
    if(hist&&hist[type]&&hist[type][idx]!==undefined){
      hist[type][idx].done=!hist[type][idx].done;
      S.dayHistory[key]=hist;
      /* Also sync weekly DB */
      var label=fmtDate(viewingDate);
      S.weeks.forEach(function(w){
        w.days.forEach(function(d){
          if(d.date===label&&d.tasks){
            var ctr={core:0,bonus:0,health:0};
            var typeIdx=0;
            for(var i=0;i<d.tasks.length;i++){
              if(d.tasks[i].cat===type){
                if(ctr[type]===idx){d.tasks[i].done=hist[type][idx].done;break;}
                ctr[type]++;
              }
            }
            /* Recount */
            var c=0,b=0,h=0;
            d.tasks.forEach(function(t){if(t.cat==='core')c+=t.done?1:0;else if(t.cat==='bonus')b+=t.done?1:0;else h+=t.done?1:0;});
            d.coreDone=c;d.bonusDone=b;d.healthDone=h;
          }
        });
      });
      saveState();renderDailyTasks();
    }
  }else{
    var task=S.tasks[type][idx];
    if(task){task.done=!task.done;saveState();renderDailyTasks();}
  }
}

/* Unified text update */
function updateTaskTextAt(type,idx,val,isPast){
  if(isPast){
    if(!isEditingPastDay)return;
    var key=fmtDateKey(viewingDate);
    var hist=S.dayHistory[key];
    if(hist&&hist[type]&&hist[type][idx]!==undefined){hist[type][idx].text=val.trim();S.dayHistory[key]=hist;saveState();}
  }else{
    var task=S.tasks[type][idx];if(task){task.text=val.trim();saveState();}
  }
}

/* Unified remove */
function removeTaskAt(type,idOrIdx,isPast){
  if(isPast){
    if(!isEditingPastDay)return;
    var key=fmtDateKey(viewingDate);
    var hist=S.dayHistory[key];
    if(hist&&hist[type]){
      var idx=parseInt(idOrIdx);
      if(!isNaN(idx)){hist[type].splice(idx,1);}
      else{hist[type]=hist[type].filter(function(t){return t.id!==idOrIdx;});}
      S.dayHistory[key]=hist;saveState();renderDailyTasks();
    }
  }else{
    S.tasks[type]=S.tasks[type].filter(function(x){return x.id!==idOrIdx;});saveState();renderDailyTasks();
  }
}

function setDailyMetrics(allTasks,coreTasks){
  var done=allTasks.filter(function(t){return t.done;}).length;
  var total=allTasks.length;
  var coreDone=coreTasks.filter(function(t){return t.done;}).length;
  var pct=total>0?Math.round(done/total*100):0;
  document.getElementById('d-score').textContent=done;
  document.getElementById('d-core').textContent=coreDone+'/'+coreTasks.length;
  document.getElementById('d-pct').textContent=pct+'%';
  document.getElementById('d-total').textContent=total;
  document.getElementById('d-pbar').style.width=pct+'%';
  document.getElementById('d-pbar-lbl').textContent=done+' of '+total+' done';
}

function toggleTask(type,id){var t=S.tasks[type].find(function(x){return x.id===id;});if(t){t.done=!t.done;saveState();renderDailyTasks();}}
function removeTask(type,id){S.tasks[type]=S.tasks[type].filter(function(x){return x.id!==id;});saveState();renderDailyTasks();}
function resetDay(){
  if(!confirm('Reset all checkboxes for today?'))return;
  ensureCategories();
  S.taskCategories.forEach(function(cat){
    (S.tasks[cat.id]||[]).forEach(function(x){x.done=false;});
  });
  saveState();renderDynamicTasks();
}

function saveDayToWeek(){
  if(isTomorrow()){alert("Tomorrow's plan is saved locally but won't be logged to Weekly DB until tomorrow becomes today.");return;}
  if(!isToday()){alert('You can only save today from this button.');return;}
  if(S.weeks.length===0){alert('Create a week first in Weekly DB.');return;}
  ensureCategories();
  var todayKey=fmtDateKey(TODAY);
  var visibleCats=S.taskCategories.filter(function(cat){return catVisibleOnDate(cat,todayKey);});
  var w=S.weeks[0];
  var allTasks=[];var dayTasks=[];var catCounts={};
  visibleCats.forEach(function(cat){
    var tasks=S.tasks[cat.id]||[];
    tasks.forEach(function(t){
      allTasks.push(t);
      dayTasks.push({text:t.text,cat:cat.id,catName:cat.name,catColor:cat.color,done:t.done});
    });
    catCounts[cat.id]={done:tasks.filter(function(t){return t.done;}).length,total:tasks.length};
  });
  /* Legacy compat fields */
  var cats=visibleCats;
  var coreDone=cats[0]?catCounts[cats[0].id].done:0;
  var bonusDone=cats[1]?catCounts[cats[1].id].done:0;
  var healthDone=cats[2]?catCounts[cats[2].id].done:0;
  var label=fmtDate(TODAY);
  var dayObj={date:label,coreDone:coreDone,bonusDone:bonusDone,healthDone:healthDone,total:allTasks.length,tasks:dayTasks,catCounts:catCounts};
  var existIdx=w.days.findIndex(function(d){return d.date===label;});
  if(existIdx>=0){w.days[existIdx]=dayObj;}else{w.days.push(dayObj);}
  snapToday();saveState();alert('Day saved to '+w.label);
}

function openAddTask(type){
  var isPast=!isToday();
  addTaskType=type;
  /* Store whether we're adding to past */
  addTaskType=type;
  document.getElementById('modal-task-title').textContent='Add '+type+' task';
  document.getElementById('modal-task-input').value='';
  openModal('modal-task');
  setTimeout(function(){document.getElementById('modal-task-input').focus();},80);
}
function confirmAddTask(){
  var txt=document.getElementById('modal-task-input').value.trim();if(!txt)return;
  var isPast=viewingDate.getTime()<TODAY.getTime();
  var itom=isTomorrow();
  if(itom){
    /* Add to tomorrow's storage */
    if(!S.tomorrowTasks)S.tomorrowTasks={};
    if(!S.tomorrowTasks[addTaskType])S.tomorrowTasks[addTaskType]=[];
    S.tomorrowTasks[addTaskType].push({id:uid(),text:txt,done:false});
  }else if(isPast&&isEditingPastDay){
    var key=fmtDateKey(viewingDate);
    if(!S.dayHistory[key])S.dayHistory[key]={core:[],bonus:[],health:[]};
    if(!Array.isArray(S.dayHistory[key][addTaskType]))S.dayHistory[key][addTaskType]=[];
    S.dayHistory[key][addTaskType].push({id:uid(),text:txt,done:false});
  }else if(!isPast&&!itom){
    S.tasks[addTaskType].push({id:uid(),text:txt,done:false});
  }
  saveState();renderDailyTasks();closeModal('modal-task');
}
document.getElementById('modal-task-input').addEventListener('keydown',function(e){if(e.key==='Enter')confirmAddTask();});

/* ─── DATA PANEL v2 — Structured Sections ─── */

function ensureDataSections(){
  if(!S.dataSections){
    S.dataSections={
      rules:[
        {id:uid(),text:'Failures are data points to learn from. Learn. Apply. Adapt immediately. And Pivot.'},
        {id:uid(),text:'You will be discouraged. It is normal.'},
        {id:uid(),text:'Dropout rate is highest at the beginning, frustration will be highest, it is normal.'},
        {id:uid(),text:'Jor se nahi bolna bilkul bhi — no hyper at any cost.'},
        {id:uid(),text:'Mummy se samne nahi bolna, jab bhi bole instant sorry bolna hai.'},
        {id:uid(),text:'Khud se bolte samay over type nahi hona.'}
      ],
      preventive:[
        {id:uid(),text:'Roj haste time apni hasi per dhayan diya kar and use sahi kar.'},
        {id:uid(),text:'Jab bhi mann na kare, just breathe in and out and just start.'}
      ],
      datadrop:[
        {id:uid(),text:'My pushups — day1: 7,4,6,5,4,4 | day2: 9,6,5,6,4 | day3: 10,7,7,6'},
        {id:uid(),text:'Pullups — day1: 8,8,5,5,4 | day2: 10,10,6,4 | day3: 15,15'},
        {id:uid(),text:'12 baje lunch karne se nind aati hai'},
        {id:uid(),text:'9 baje study time galat hai'},
        {id:uid(),text:'Sham me reading nahi hoti'},
        {id:uid(),text:'Morning study session me bhi nind aati hai'},
        {id:uid(),text:'System ek baar bhi collapse ho jaye to ho hi jaata hai — use min mode immediately.'}
      ],
      problems:[
        {id:uid(),title:'Infection (Eye)',items:[
          {id:uid(),text:'Medicine time per leni hai'},
          {id:uid(),text:'Khujli nahi karni chahe kuch bhi ho'},
          {id:uid(),text:'Eyes are the main infected — now okk (14/4)'}
        ]},
        {id:uid(),title:'Problem B (P, M)',items:[
          {id:uid(),text:'No P at any cost'},
          {id:uid(),text:'Urge window: 11:00–12:00 — engage yourself in that hour'},
          {id:uid(),text:'When trigger activated: wait 2 seconds, breathe in/out, ask — Is this activity important?'}
        ]}
      ],
      viz:[
        {id:uid(),label:'Bike (GT 650)',url:''},
        {id:uid(),label:'House',url:''},
        {id:uid(),label:'Setup',url:''}
      ]
    };
    saveState();
  }
}

/* ── DATA PANEL ACCORDION STATE ── */
var _dsOpen={rules:true,preventive:false,datadrop:false,problems:false,viz:false};

function dataToggleSection(key){
  _dsOpen[key]=!_dsOpen[key];
  var acc=document.getElementById('ds-acc-'+key);
  if(acc)acc.classList.toggle('ds-open',_dsOpen[key]);
}

function dataToggleAll(){
  var anyOpen=Object.values(_dsOpen).some(function(v){return v;});
  var keys=['rules','preventive','datadrop','problems','viz'];
  keys.forEach(function(k){
    _dsOpen[k]=!anyOpen;
    var acc=document.getElementById('ds-acc-'+k);
    if(acc)acc.classList.toggle('ds-open',_dsOpen[k]);
  });
  var btn=document.querySelector('.data-panel-expand-all');
  if(btn)btn.textContent=anyOpen?'Expand All':'Collapse All';
}

function dsUpdateCount(key,n){
  var el=document.getElementById('ds-count-'+key);
  if(el)el.textContent=n;
}

function renderData(){
  ensureDataSections();
  /* Sync accordion open states to DOM */
  ['rules','preventive','datadrop','problems','viz'].forEach(function(k){
    var acc=document.getElementById('ds-acc-'+k);
    if(acc)acc.classList.toggle('ds-open',!!_dsOpen[k]);
  });
  renderDataSection('rules');
  renderDataSection('preventive');
  renderDataSection('datadrop');
  renderDataProblems();
  renderDataViz();
  /* Update counts */
  dsUpdateCount('rules',(S.dataSections.rules||[]).length);
  dsUpdateCount('preventive',(S.dataSections.preventive||[]).length);
  dsUpdateCount('datadrop',(S.dataSections.datadrop||[]).length);
  dsUpdateCount('problems',(S.dataSections.problems||[]).length);
  dsUpdateCount('viz',(S.dataSections.viz||[]).length);
}

function renderDataSection(key){
  var el=document.getElementById('dsb-'+key);if(!el)return;
  var items=S.dataSections[key]||[];
  dsUpdateCount(key,items.length);
  el.innerHTML='';
  if(!items.length){
    el.innerHTML='<div style="padding:14px 16px;font-size:13px;color:var(--text3);font-style:italic">Nothing here yet. Click + Add above.</div>';
    return;
  }
  items.forEach(function(item){
    var row=document.createElement('div');row.className='ds-item';
    var bullet=document.createElement('div');bullet.className='ds-bullet';
    var ta=document.createElement('textarea');
    ta.className='ds-text';ta.rows=1;ta.value=item.text;
    ta.style.height='auto';
    ta.oninput=function(){this.style.height='auto';this.style.height=this.scrollHeight+'px';};
    ta.onblur=function(){item.text=this.value.trim();saveState();};
    setTimeout(function(){ta.style.height=ta.scrollHeight+'px';},0);
    var del=document.createElement('button');del.className='ds-del';del.innerHTML='×';del.title='Remove';
    del.onclick=function(){
      S.dataSections[key]=S.dataSections[key].filter(function(x){return x.id!==item.id;});
      saveState();renderDataSection(key);
    };
    row.appendChild(bullet);row.appendChild(ta);row.appendChild(del);
    el.appendChild(row);
  });
}

function dataAddItem(key){
  ensureDataSections();
  if(!S.dataSections[key])S.dataSections[key]=[];
  S.dataSections[key].push({id:uid(),text:''});
  /* Auto-open accordion */
  _dsOpen[key]=true;
  var acc=document.getElementById('ds-acc-'+key);
  if(acc)acc.classList.add('ds-open');
  saveState();renderDataSection(key);
  /* Focus the new textarea */
  setTimeout(function(){
    var el=document.getElementById('dsb-'+key);
    if(el){var tas=el.querySelectorAll('.ds-text');if(tas.length)tas[tas.length-1].focus();}
  },60);
}

function renderDataProblems(){
  var el=document.getElementById('dsb-problems');if(!el)return;
  el.innerHTML='';
  var problems=S.dataSections.problems||[];
  dsUpdateCount('problems',problems.length);
  problems.forEach(function(prob){
    var block=document.createElement('div');block.className='ds-problem-block';
    /* Header */
    var hdr=document.createElement('div');hdr.className='ds-problem-hdr';
    var icon=document.createElement('span');icon.textContent='⚡';icon.style.fontSize='13px';
    var titleInp=document.createElement('input');
    titleInp.type='text';titleInp.className='ds-problem-title-inp';
    titleInp.value=prob.title||'Problem';titleInp.placeholder='Problem name...';
    titleInp.onblur=function(){prob.title=this.value.trim();saveState();};
    var addItemBtn=document.createElement('button');addItemBtn.className='ds-problem-add-btn';addItemBtn.textContent='+ Point';
    addItemBtn.onclick=(function(p,bl){return function(){
      if(!p.items)p.items=[];
      p.items.push({id:uid(),text:''});
      saveState();renderDataProblems();
      setTimeout(function(){
        var tas=bl.querySelectorAll('.ds-text');
        if(tas.length)tas[tas.length-1].focus();
      },60);
    };})(prob,block);
    var delBtn=document.createElement('button');delBtn.className='ds-problem-del-btn';delBtn.innerHTML='🗑';delBtn.title='Delete this problem';
    delBtn.onclick=(function(pid){return function(){
      if(!confirm('Delete this problem block?'))return;
      S.dataSections.problems=S.dataSections.problems.filter(function(x){return x.id!==pid;});
      saveState();renderDataProblems();
    };})(prob.id);
    hdr.appendChild(icon);hdr.appendChild(titleInp);hdr.appendChild(addItemBtn);hdr.appendChild(delBtn);
    block.appendChild(hdr);
    /* Items */
    var itemsBody=document.createElement('div');
    (prob.items||[]).forEach(function(item){
      var row=document.createElement('div');row.className='ds-item';
      var bullet=document.createElement('div');bullet.className='ds-bullet';
      bullet.style.background='var(--amber)';
      var ta=document.createElement('textarea');
      ta.className='ds-text';ta.rows=1;ta.value=item.text;
      ta.style.height='auto';
      ta.oninput=function(){this.style.height='auto';this.style.height=this.scrollHeight+'px';};
      ta.onblur=function(){item.text=this.value.trim();saveState();};
      setTimeout(function(){ta.style.height=ta.scrollHeight+'px';},0);
      var del=document.createElement('button');del.className='ds-del';del.innerHTML='×';
      del.onclick=(function(iid,p){return function(){
        p.items=p.items.filter(function(x){return x.id!==iid;});saveState();renderDataProblems();
      };})(item.id,prob);
      row.appendChild(bullet);row.appendChild(ta);row.appendChild(del);
      itemsBody.appendChild(row);
    });
    if(!(prob.items||[]).length){
      itemsBody.innerHTML='<div style="padding:10px 16px;font-size:13px;color:var(--text3);font-style:italic">No points yet.</div>';
    }
    block.appendChild(itemsBody);
    el.appendChild(block);
  });
}

function dataAddProblem(){
  ensureDataSections();
  if(!S.dataSections.problems)S.dataSections.problems=[];
  S.dataSections.problems.push({id:uid(),title:'New Problem',items:[]});
  _dsOpen['problems']=true;
  var acc=document.getElementById('ds-acc-problems');
  if(acc)acc.classList.add('ds-open');
  saveState();renderDataProblems();
}

function renderDataViz(){
  var el=document.getElementById('dsb-viz');if(!el)return;
  el.innerHTML='';
  var items=S.dataSections.viz||[];
  dsUpdateCount('viz',items.length);
  if(!items.length){
    el.innerHTML='<div style="padding:14px 16px;font-size:13px;color:var(--text3);font-style:italic">Nothing yet. Add things you want.</div>';
    return;
  }
  items.forEach(function(item){
    var row=document.createElement('div');row.className='ds-viz-item';
    var labelInp=document.createElement('input');
    labelInp.type='text';labelInp.className='ds-viz-label-inp';
    labelInp.value=item.label;labelInp.placeholder='Label (e.g. Bike: GT 650)';
    labelInp.onblur=function(){item.label=this.value.trim();saveState();};
    var sep=document.createElement('span');sep.textContent='→';sep.style.cssText='color:var(--text3);font-size:12px;flex-shrink:0';
    var urlInp=document.createElement('input');
    urlInp.type='text';urlInp.className='ds-viz-url-inp';
    urlInp.value=item.url;urlInp.placeholder='https://... (optional link)';
    urlInp.onblur=function(){item.url=this.value.trim();saveState();};
    var openBtn=document.createElement('button');openBtn.className='ds-viz-open';openBtn.innerHTML='🔗';openBtn.title='Open link';
    openBtn.onclick=function(){if(item.url&&item.url.startsWith('http'))window.open(item.url,'_blank');else alert('Add a valid https:// link first.');};
    var del=document.createElement('button');del.className='ds-viz-del';del.innerHTML='×';
    del.onclick=function(){
      S.dataSections.viz=S.dataSections.viz.filter(function(x){return x.id!==item.id;});
      saveState();renderDataViz();
    };
    row.appendChild(labelInp);row.appendChild(sep);row.appendChild(urlInp);row.appendChild(openBtn);row.appendChild(del);
    el.appendChild(row);
  });
}

function dataAddViz(){
  ensureDataSections();
  if(!S.dataSections.viz)S.dataSections.viz=[];
  S.dataSections.viz.push({id:uid(),label:'',url:''});
  _dsOpen['viz']=true;
  var acc=document.getElementById('ds-acc-viz');
  if(acc)acc.classList.add('ds-open');
  saveState();renderDataViz();
  setTimeout(function(){
    var el=document.getElementById('dsb-viz');
    if(el){var inps=el.querySelectorAll('.ds-viz-label-inp');if(inps.length)inps[inps.length-1].focus();}
  },60);
}

/* ─── WEEKLY DB ─── */
var weekTabsScrollX=0;

/* WEEKS are displayed newest-first: S.weeks[0] is newest */
function renderWeekly(){
  ensureCategories();
  buildWeekTabs();
  var cont=document.getElementById('weekly-content');
  if(S.weeks.length===0){cont.innerHTML='<div class="alert alert-info">No weeks yet. Click "+ New week".</div>';return;}
  var w=S.weeks[activeWeekIdx];
  /* Compute totals dynamically from task data using catCounts if available */
  var td=0,tp=0;
  w.days.forEach(function(d){
    if(d.catCounts){
      Object.keys(d.catCounts).forEach(function(cid){td+=d.catCounts[cid].done;tp+=d.catCounts[cid].total;});
    }else{
      td+=d.coreDone+d.bonusDone+d.healthDone;tp+=d.total;
    }
  });
  var wPct=tp>0?Math.round(td/tp*100):0;
  /* Study days = days where first active category has at least one done task */
  var firstCatId=S.taskCategories[0]?S.taskCategories[0].id:'cat_1';
  var studyDays=w.days.filter(function(d){
    return d.tasks&&d.tasks.some(function(t){return (t.cat===firstCatId||t.cat==='core')&&t.done;});
  }).length;
  var bestDay=w.days.length>0?w.days.reduce(function(a,b){
    var sa=a.catCounts?Object.values(a.catCounts).reduce(function(x,v){return x+v.done;},0):(a.coreDone+a.bonusDone+a.healthDone);
    var sb=b.catCounts?Object.values(b.catCounts).reduce(function(x,v){return x+v.done;},0):(b.coreDone+b.bonusDone+b.healthDone);
    return sb>sa?b:a;
  },w.days[0]):{date:'—'};
  var html='<div class="metrics">';
  html+='<div class="metric"><div class="metric-val">'+wPct+'%</div><div class="metric-lbl">Week score</div></div>';
  html+='<div class="metric"><div class="metric-val">'+w.days.length+'</div><div class="metric-lbl">Days logged</div></div>';
  html+='<div class="metric"><div class="metric-val">'+studyDays+'/'+w.days.length+'</div><div class="metric-lbl">'+esc(S.taskCategories[0]?S.taskCategories[0].name:'Core')+' days</div></div>';
  html+='<div class="metric"><div class="metric-val">'+bestDay.date+'</div><div class="metric-lbl">Best day</div></div>';
  html+='</div>';
  html+='<div class="sec">Weekly goals <button class="btn btn-sm" onclick="openAddGoal()" style="margin-left:auto">+ Add goal</button></div>';
  html+='<div class="card">';
  if(w.goals.length===0)html+='<div class="empty">No goals for this week.</div>';
  w.goals.forEach(function(g,gi){
    html+='<div class="task-row"><input class="task-txt" value="'+esc(g)+'" style="flex:1" onblur="updateWeekGoal('+activeWeekIdx+','+gi+',this.value)"><button class="del-btn" onclick="removeWeekGoal('+activeWeekIdx+','+gi+')">×</button></div>';
  });
  html+='</div>';
  html+='<div class="sec">Daily log</div>';
  if(w.days.length===0){html+='<div class="alert alert-info">No days logged. Use "Save day → Weekly DB" in Daily Panel.</div>';}
  w.days.forEach(function(d,di){
    var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);
    var p2=d.total>0?Math.round(sc/d.total*100):0;
    var col=p2>=80?'#3fcf8e':p2>=50?'#f5a623':'#ff5c5c';
    html+='<div class="day-log-item"><div class="day-log-header" onclick="toggleDayLog(\'dl-'+di+'\',\'dc-'+di+'\')">';
    html+='<span class="day-log-date">'+d.date+'</span>';
    html+='<span class="day-log-score" style="color:'+col+'">'+sc+'/'+d.total+'</span>';
    html+='<div class="day-log-bar-wrap"><div class="day-log-bar-fill" style="width:'+p2+'%;background:'+col+'"></div></div>';
    html+='<span class="day-log-pct">'+p2+'%</span>';
    html+='<span class="day-log-chev" id="dc-'+di+'">▼</span>';
    html+='<button class="del-btn" style="margin-left:6px" onclick="event.stopPropagation();removeDayLog('+activeWeekIdx+','+di+')">×</button>';
    html+='</div><div class="day-log-body" id="dl-'+di+'">';
    /* Per-category breakdown */
    if(d.catCounts){
      var catLine='<div style="margin-bottom:8px;font-size:12px;display:flex;flex-wrap:wrap;gap:10px">';
      S.taskCategories.forEach(function(cat){
        if(d.catCounts[cat.id]&&d.catCounts[cat.id].total>0){
          catLine+='<span style="color:'+cat.color+'">'+esc(cat.name)+': '+d.catCounts[cat.id].done+'/'+d.catCounts[cat.id].total+'</span>';
        }
      });
      catLine+='</div>';
      html+=catLine;
    }else{
      html+='<div style="margin-bottom:8px;font-size:12px"><span style="color:var(--green)">'+esc(S.taskCategories[0]?S.taskCategories[0].name:'Core')+': '+d.coreDone+'</span> &nbsp; <span style="color:var(--accent)">'+esc(S.taskCategories[1]?S.taskCategories[1].name:'Bonus')+': '+d.bonusDone+'</span> &nbsp; <span style="color:var(--amber)">'+esc(S.taskCategories[2]?S.taskCategories[2].name:'Health')+': '+d.healthDone+'</span></div>';
    }
    if(d.tasks&&d.tasks.length>0){
      d.tasks.forEach(function(t){html+='<span class="day-task-tag'+(t.done?' done-tag':'')+'">'+( t.done?'✓ ':'')+esc(t.text)+'</span>';});
    }else{html+='<div class="empty">No task detail.</div>';}
    html+='</div></div>';
  });
  html+='<div class="sec">Weekly analytics</div>';
  html+='<div class="card"><div class="card-title">Daily performance — all categories</div><div class="chart-wrap" style="height:220px"><canvas id="cw1"></canvas></div></div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  html+='<div class="card"><div class="card-title">Category breakdown</div><div class="chart-wrap" style="height:200px"><canvas id="cw2"></canvas></div></div>';
  html+='<div class="card"><div class="card-title">Daily rate — all categories</div><div id="cw3-legend" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)"></div><div class="chart-wrap" style="height:200px"><canvas id="cw3"></canvas></div></div>';
  html+='</div>';
  html+='<div class="card" style="margin-top:12px"><div class="card-title">Key insights</div><div id="week-insights"></div></div>';
  cont.innerHTML=html;
  setTimeout(function(){drawWeekCharts(w);drawWeekInsights(w,wPct,studyDays);},200);
}

function buildWeekTabs(){
  var container=document.getElementById('week-tabs');container.innerHTML='';
  /* Show weeks in order — S.weeks[0] is newest, displayed first */
  S.weeks.forEach(function(w,i){
    var t=document.createElement('div');t.className='week-tab'+(i===activeWeekIdx?' active':'');
    var lbl=document.createElement('span');lbl.textContent=w.label;
    var edBtn=document.createElement('span');edBtn.className='week-tab-edit';edBtn.textContent='✎';edBtn.title='Rename';
    edBtn.onclick=function(e){e.stopPropagation();openEditWeek(i);};
    var delBtn=document.createElement('span');delBtn.className='week-tab-del';delBtn.textContent='×';delBtn.title='Delete week';
    delBtn.onclick=function(e){e.stopPropagation();deleteWeek(i);};
    t.appendChild(lbl);t.appendChild(edBtn);t.appendChild(delBtn);
    t.onclick=(function(idx){return function(){activeWeekIdx=idx;weekTabsScrollX=0;renderWeekly();};})(i);
    container.appendChild(t);
  });
  updateWeekScrollBtns();
}
function updateWeekScrollBtns(){
  var viewport=document.getElementById('week-tabs-viewport');
  var inner=document.getElementById('week-tabs');
  if(!viewport||!inner)return;
  var overflow=inner.scrollWidth>viewport.clientWidth;
  document.getElementById('week-scroll-left').classList.toggle('hidden',!overflow||weekTabsScrollX<=0);
  document.getElementById('week-scroll-right').classList.toggle('hidden',!overflow||weekTabsScrollX>=(inner.scrollWidth-viewport.clientWidth-2));
}
function scrollWeekTabs(dir){
  var viewport=document.getElementById('week-tabs-viewport');
  var inner=document.getElementById('week-tabs');
  var step=120;
  weekTabsScrollX=Math.max(0,Math.min(weekTabsScrollX+dir*step,inner.scrollWidth-viewport.clientWidth));
  inner.style.transform='translateX(-'+weekTabsScrollX+'px)';
  updateWeekScrollBtns();
}
function deleteWeek(idx){
  if(!confirm('Delete "'+S.weeks[idx].label+'"?'))return;
  S.weeks.splice(idx,1);
  if(activeWeekIdx>=S.weeks.length)activeWeekIdx=Math.max(0,S.weeks.length-1);
  saveState();renderWeekly();
}
function openAddWeek(){
  editingWeekIdx=-1;
  document.getElementById('modal-week-title').textContent='New Week';
  document.getElementById('modal-week-label').value='';
  document.getElementById('modal-week-month').value='';
  document.getElementById('modal-week-confirm').textContent='Create';
  openModal('modal-week');
  setTimeout(function(){document.getElementById('modal-week-label').focus();},80);
}
function openEditWeek(idx){
  editingWeekIdx=idx;
  document.getElementById('modal-week-title').textContent='Rename Week';
  document.getElementById('modal-week-label').value=S.weeks[idx].label;
  document.getElementById('modal-week-month').value=S.weeks[idx].month||'';
  document.getElementById('modal-week-confirm').textContent='Save';
  openModal('modal-week');
  setTimeout(function(){document.getElementById('modal-week-label').focus();},80);
}
function confirmWeekModal(){
  var lbl=document.getElementById('modal-week-label').value.trim();
  var mo=document.getElementById('modal-week-month').value.trim();
  if(!lbl||!mo){alert('Fill both fields.');return;}
  if(editingWeekIdx>=0){
    S.weeks[editingWeekIdx].label=lbl;S.weeks[editingWeekIdx].month=mo;
  }else{
    /* Insert new week at FRONT (index 0) so it appears first */
    S.weeks.unshift({id:uid(),label:lbl,month:mo,goals:[],days:[]});
    activeWeekIdx=0;
  }
  saveState();renderWeekly();closeModal('modal-week');
}
function openAddGoal(){document.getElementById('modal-goal-input').value='';openModal('modal-goal');setTimeout(function(){document.getElementById('modal-goal-input').focus();},80);}
function confirmAddGoal(){var g=document.getElementById('modal-goal-input').value.trim();if(!g)return;S.weeks[activeWeekIdx].goals.push(g);saveState();renderWeekly();closeModal('modal-goal');}
document.getElementById('modal-goal-input').addEventListener('keydown',function(e){if(e.key==='Enter')confirmAddGoal();});
function updateWeekGoal(wi,gi,val){S.weeks[wi].goals[gi]=val.trim();saveState();}
function removeWeekGoal(wi,gi){S.weeks[wi].goals.splice(gi,1);saveState();renderWeekly();}
function removeDayLog(wi,di){if(confirm('Remove this day?')){S.weeks[wi].days.splice(di,1);saveState();renderWeekly();}}
function toggleDayLog(bId,cId){
  var b=document.getElementById(bId),c=document.getElementById(cId);
  if(b)b.classList.toggle('open');if(c)c.classList.toggle('open');
}
/* Resolve CSS variable to actual color for Chart.js (canvas context can't use var()) */
function getCSSVar(v){try{return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'';}catch(e){return '';}}

function drawWeekCharts(w){
  ensureCategories();
  destroyChart('cw1');destroyChart('cw2');destroyChart('cw3');
  if(w.days.length===0)return;
  var labels=w.days.map(function(d){return d.date;});
  var gc=getCSSVar('--border')||'rgba(40,40,50,1)';
  var tc=getCSSVar('--text2')||'rgba(180,180,200,1)';
  /* Active (non-archived) categories for chart */
  var activeCats=S.taskCategories.filter(function(cat){return !cat.archived;});
  /* Build per-cat datasets for stacked bar */
  var datasets=activeCats.map(function(cat,ci){
    var data=w.days.map(function(d){
      /* 1: new catCounts */
      if(d.catCounts&&d.catCounts[cat.id]!=null)return d.catCounts[cat.id].done||0;
      /* 2: scan tasks by cat id, color, or legacy name */
      if(d.tasks&&d.tasks.length>0){
        var legacyCore=['core','cat_core','cat_1'];
        var legacyBonus=['bonus','cat_bonus','cat_2'];
        var legacyHealth=['health','cat_health','cat_3'];
        var ct=d.tasks.filter(function(t){
          if(t.cat===cat.id||t.catColor===cat.color)return true;
          if(ci===0&&legacyCore.indexOf(t.cat)>=0)return true;
          if(ci===1&&legacyBonus.indexOf(t.cat)>=0)return true;
          if(ci===2&&legacyHealth.indexOf(t.cat)>=0)return true;
          return false;
        });
        if(ct.length>0)return ct.filter(function(t){return t.done;}).length;
      }
      /* 3: positional legacy fields */
      if(ci===0)return d.coreDone||0;
      if(ci===1)return d.bonusDone||0;
      if(ci===2)return d.healthDone||0;
      return 0;
    });
    return{label:cat.name,data:data,backgroundColor:cat.color,borderRadius:4};
  });
  var c1=document.getElementById('cw1');
  if(c1)chartInst.cw1=new Chart(c1,{type:'bar',data:{labels:labels,datasets:datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:tc,font:{size:11}}}},
      scales:{x:{stacked:true,grid:{color:gc},ticks:{color:tc,font:{size:11}}},
              y:{stacked:true,grid:{color:gc},ticks:{color:tc,font:{size:11},stepSize:1}}}}});
  /* Doughnut: totals per active cat */
  var totals=activeCats.map(function(cat,ci){
    return w.days.reduce(function(sum,d){
      if(d.catCounts&&d.catCounts[cat.id]!=null)return sum+(d.catCounts[cat.id].done||0);
      if(d.tasks&&d.tasks.length>0){
        var legacyCore=['core','cat_core','cat_1'],legacyBonus=['bonus','cat_bonus','cat_2'],legacyHealth=['health','cat_health','cat_3'];
        var ct=d.tasks.filter(function(t){return t.cat===cat.id||t.catColor===cat.color||(ci===0&&legacyCore.indexOf(t.cat)>=0)||(ci===1&&legacyBonus.indexOf(t.cat)>=0)||(ci===2&&legacyHealth.indexOf(t.cat)>=0);});
        if(ct.length>0)return sum+ct.filter(function(t){return t.done;}).length;
      }
      if(ci===0)return sum+(d.coreDone||0);
      if(ci===1)return sum+(d.bonusDone||0);
      if(ci===2)return sum+(d.healthDone||0);
      return sum;
    },0);
  });
  var grandTotal=totals.reduce(function(a,b){return a+b;},0);
  var c2=document.getElementById('cw2');
  if(c2&&grandTotal>0)chartInst.cw2=new Chart(c2,{type:'doughnut',
    data:{labels:activeCats.map(function(c){return c.name;}),
          datasets:[{data:totals,backgroundColor:activeCats.map(function(c){return c.color;}),borderWidth:0,hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{color:tc,font:{size:11},padding:10}}}}});
  /* Line: completion rate per day — all categories */
  var overallRates=w.days.map(function(d){
    var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);
    return d.total>0?Math.round(sc/d.total*100):0;
  });
  var lineDatasets=activeCats.map(function(cat,ci){
    var data=w.days.map(function(d){
      var done=0,total=0;
      if(d.catCounts&&d.catCounts[cat.id]!=null){done=d.catCounts[cat.id].done||0;total=d.catCounts[cat.id].total||0;}
      else if(d.tasks&&d.tasks.length>0){
        var lc=['core','cat_core','cat_1'],lb=['bonus','cat_bonus','cat_2'],lh=['health','cat_health','cat_3'];
        var ct=d.tasks.filter(function(t){return t.cat===cat.id||t.catColor===cat.color||(ci===0&&lc.indexOf(t.cat)>=0)||(ci===1&&lb.indexOf(t.cat)>=0)||(ci===2&&lh.indexOf(t.cat)>=0);});
        done=ct.filter(function(t){return t.done;}).length;total=ct.length;
      }else{
        if(ci===0){done=d.coreDone||0;total=3;}
        else if(ci===1){done=d.bonusDone||0;total=3;}
        else if(ci===2){done=d.healthDone||0;total=3;}
      }
      return total>0?Math.round(done/total*100):null;
    });
    var col=cat.color||'#888';
    var hex=col.replace('#','');
    var rgb=hex.length===6?[parseInt(hex.substr(0,2),16),parseInt(hex.substr(2,2),16),parseInt(hex.substr(4,2),16)]:[100,100,255];
    var ds={label:cat.name,data:data,
      borderColor:col,backgroundColor:'transparent',
      borderWidth:2,pointBackgroundColor:col,pointBorderColor:'transparent',
      pointRadius:3,pointHoverRadius:6,pointHoverBorderWidth:2,pointHoverBorderColor:col,
      fill:false,tension:.4,spanGaps:true};
    ds._bandColor=col;
    return ds;
  });
  /* Overall — bottom dataset, dashed purple line */
  var overallDs={label:'Overall %',data:overallRates,
    borderColor:'#a78bfa',backgroundColor:'transparent',
    borderWidth:2.5,pointBackgroundColor:'#a78bfa',pointBorderColor:'transparent',
    pointRadius:3,pointHoverRadius:6,
    fill:false,tension:.4,borderDash:[5,4]};
  overallDs._bandColor='#a78bfa';
  lineDatasets.unshift(overallDs);

  /* Build custom legend pills for cw3 to avoid Chart.js native legend toggling bug */
  var cw3LegendEl=document.getElementById('cw3-legend');
  var weekHiddenLines={};
  function buildCw3Legend(){
    if(!cw3LegendEl)return;
    cw3LegendEl.innerHTML='';
    lineDatasets.forEach(function(ds,idx){
      var isHid=!!weekHiddenLines[idx];
      var pill=document.createElement('div');
      pill.style.cssText='display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:99px;border:1px solid var(--border2);background:'+(isHid?'transparent':'var(--bg3)')+';cursor:pointer;opacity:'+(isHid?'0.35':'1')+';transition:all .18s;user-select:none;margin:2px';
      var lineStyle=ds.borderDash?'background:repeating-linear-gradient(90deg,'+ds.borderColor+' 0,'+ds.borderColor+' 5px,transparent 5px,transparent 9px);':'background:'+ds.borderColor+';';
      pill.innerHTML='<span style="width:14px;height:3px;border-radius:2px;display:inline-block;flex-shrink:0;'+lineStyle+'"></span><span style="color:var(--text2);white-space:nowrap">'+ds.label+'</span>';
      pill.onclick=(function(i){return function(){
        weekHiddenLines[i]=!weekHiddenLines[i];
        var chart=chartInst.cw3;
        if(chart){var meta=chart.getDatasetMeta(i);meta.hidden=weekHiddenLines[i]?true:null;chart.update();}
        buildCw3Legend();
      };})(idx);
      cw3LegendEl.appendChild(pill);
    });
  }

  var c3=document.getElementById('cw3');
  if(c3){
    chartInst.cw3=new Chart(c3,{type:'line',data:{labels:labels,datasets:lineDatasets},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},
          tooltip:{
            backgroundColor:'rgba(10,10,18,.95)',
            titleColor:'#e0e0f0',bodyColor:'#a0a0b8',
            borderColor:'rgba(255,255,255,.08)',borderWidth:1,
            padding:12,titleFont:{size:11,weight:'bold'},
            callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+(ctx.parsed.y!==null?ctx.parsed.y+'%':'—');}}
          }
        },
        scales:{
          x:{grid:{color:gc,drawBorder:false},ticks:{color:tc,font:{size:10}},border:{display:false}},
          y:{min:0,max:100,grid:{color:gc,drawBorder:false},ticks:{color:tc,font:{size:11},callback:function(v){return v+'%';}},border:{display:false}}
        }
      }
    });
    buildCw3Legend();
  }
}
function drawWeekInsights(w,pct,studyDays){
  ensureCategories();
  var el=document.getElementById('week-insights');if(!el)return;
  if(w.days.length===0){el.innerHTML='<div class="empty">No days logged yet.</div>';return;}
  var cat0=S.taskCategories[0]||{name:'Core',color:'#3fcf8e'};
  var cat2=S.taskCategories[2]||{name:'Health',color:'#f5a623'};
  var ins=[];
  var rates=w.days.map(function(d){
    var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);
    return d.total>0?Math.round(sc/d.total*100):0;
  });
  var avgRate=rates.length?Math.round(rates.reduce(function(a,b){return a+b;},0)/rates.length):0;
  var peakDay=w.days.length?w.days.reduce(function(a,b){
    var sa=a.catCounts?Object.values(a.catCounts).reduce(function(x,v){return x+v.done;},0):(a.coreDone+a.bonusDone+a.healthDone);
    var sb=b.catCounts?Object.values(b.catCounts).reduce(function(x,v){return x+v.done;},0):(b.coreDone+b.bonusDone+b.healthDone);
    return sb>sa?b:a;}):null;
  var worstDay=w.days.length?w.days.reduce(function(a,b){
    var sa=a.catCounts?Object.values(a.catCounts).reduce(function(x,v){return x+v.done;},0):(a.coreDone+a.bonusDone+a.healthDone);
    var sb=b.catCounts?Object.values(b.catCounts).reduce(function(x,v){return x+v.done;},0):(b.coreDone+b.bonusDone+b.healthDone);
    return sb<sa?b:a;}):null;
  var colDays=w.days.filter(function(d){
    var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);
    return d.total>0&&sc/d.total<0.4;
  });
  var h2Totals=w.days.reduce(function(a,d){
    var v=d.catCounts&&d.catCounts[cat2.id]?d.catCounts[cat2.id].done:(d.healthDone||0);return a+v;},0);
  var healthAvg=w.days.length?Math.round(h2Totals/w.days.length*10)/10:0;
  var studyRate=Math.round(studyDays/Math.max(w.days.length,1)*100);
  var mid=Math.floor(w.days.length/2);
  var firstH=rates.slice(0,mid).reduce(function(a,b){return a+b;},0)/(mid||1);
  var secondH=rates.slice(mid).reduce(function(a,b){return a+b;},0)/(rates.slice(mid).length||1);
  var trending=secondH>firstH+5?'up':secondH<firstH-5?'down':'flat';

  if(pct>=85)ins.push({t:'ok',s:'Elite week at '+pct+'%. Full capacity. Protect this pattern.'});
  else if(pct>=70)ins.push({t:'ok',s:'Solid week at '+pct+'%. The '+Math.round(100-pct)+'% gap is your next growth target — identify which tasks are consistently missed.'});
  else if(pct>=55)ins.push({t:'warn',s:'Moderate week at '+pct+'%. Average '+avgRate+'% per day — losing roughly '+(100-avgRate)+'% of potential output. This compounds over months.'});
  else ins.push({t:'danger',s:'Critical — only '+pct+'% this week. Below minimum viable execution. Cut bonus tasks for 3 days and do '+cat0.name+' only.'});

  if(studyDays===w.days.length)ins.push({t:'ok',s:cat0.name+' attendance perfect — '+studyDays+'/'+w.days.length+' days. Guard this streak.'});
  else if(studyRate>=80)ins.push({t:'ok',s:cat0.name+' on '+studyDays+'/'+w.days.length+' days ('+studyRate+'%). Good discipline.'});
  else ins.push({t:'danger',s:cat0.name+' on only '+studyDays+'/'+w.days.length+' days ('+studyRate+'%). Every missed '+cat0.name+' day requires 2x effort to recover.'});

  if(trending==='up')ins.push({t:'ok',s:'Positive momentum — second half outperformed first ('+Math.round(secondH)+'% vs '+Math.round(firstH)+'%).'});
  else if(trending==='down')ins.push({t:'warn',s:'Declining momentum — started at '+Math.round(firstH)+'% dropped to '+Math.round(secondH)+'%. Add a midweek reset.'});
  else ins.push({t:'warn',s:'Flat performance ~'+Math.round((firstH+secondH)/2)+'% daily. Introduce one deliberately high-output day as a weekly anchor.'});

  if(colDays.length>=2)ins.push({t:'danger',s:colDays.length+' collapse days ('+colDays.map(function(d){return d.date;}).join(', ')+'). Map the trigger — time of day, energy crash, food timing.'});
  else if(colDays.length===1)ins.push({t:'warn',s:'1 collapse day ('+colDays[0].date+'). Watch for 2 consecutive — that is when spirals start.'});

  if(healthAvg>=2.5)ins.push({t:'ok',s:cat2.name+' tasks averaging '+healthAvg+'/day. Physical foundation solid.'});
  else ins.push({t:'warn',s:cat2.name+' tasks low at '+healthAvg+'/day average. Missing rest creates compound fatigue 24–48h later.'});

  if(peakDay&&worstDay&&peakDay.date!==worstDay.date){
    var peakSc=peakDay.catCounts?Object.values(peakDay.catCounts).reduce(function(a,v){return a+v.done;},0):(peakDay.coreDone+peakDay.bonusDone+peakDay.healthDone);
    var worstSc=worstDay.catCounts?Object.values(worstDay.catCounts).reduce(function(a,v){return a+v.done;},0):(worstDay.coreDone+worstDay.bonusDone+worstDay.healthDone);
    ins.push({t:'warn',s:'Largest gap: '+peakDay.date+' ('+peakSc+'/'+peakDay.total+') vs '+worstDay.date+' ('+worstSc+'/'+worstDay.total+'). '+Math.round((peakSc-worstSc)/Math.max(peakDay.total,1)*100)+'% swing. Standardize your morning routine.'});
  }

  var html='';
  ins.forEach(function(i){
    var col=i.t==='ok'?'var(--green)':i.t==='warn'?'var(--amber)':'var(--red)';
    var icon=i.t==='ok'?'↑':i.t==='warn'?'→':'↓';
    html+='<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;color:'+col+';line-height:1.6"><span style="font-weight:700;margin-right:6px">'+icon+'</span>'+i.s+'</div>';
  });
  el.innerHTML=html;
}

/* ─── MONTHLY ─── */

/* ─── YEARLY LINE CHART ─── */

function drawYearlyChart(){
  ensureCategories();
  var gc=getCSSVar('--border')||'rgba(40,40,50,1)';
  var tc=getCSSVar('--text2')||'rgba(180,180,200,1)';
  /* Use application font from CFG */
  var uiFont=(getCSSVar('--ui-font')||'DM Sans').replace(/['"]/g,'').split(',')[0].trim();
  var activeCats=S.taskCategories.filter(function(cat){return !cat.archived;});

  /* Collect all logged days across ALL weeks — parse date for correct sort */
  var MONTH_MAP={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  function parseLogDate(str){
    /* str is like "19 Apr" or "19 Apr 2026" */
    if(!str)return 0;
    var parts=str.trim().split(' ');
    var day=parseInt(parts[0])||1;
    var mon=MONTH_MAP[parts[1]]||0;
    var yr=parts[2]?parseInt(parts[2]):2026;
    return new Date(yr,mon,day).getTime();
  }
  var allLoggedDays=[];
  S.weeks.forEach(function(w){
    w.days.forEach(function(d){allLoggedDays.push(d);});
  });
  /* Sort chronologically using parsed date */
  allLoggedDays.sort(function(a,b){return parseLogDate(a.date)-parseLogDate(b.date);});
  /* Remove duplicates (same date label) — keep last entry */
  var seen={};var deduped=[];
  allLoggedDays.forEach(function(d){
    seen[d.date]=d;
  });
  /* Rebuild in sorted order */
  allLoggedDays=allLoggedDays.filter(function(d){return seen[d.date]===d;});

  var section=document.getElementById('yearly-chart-section');
  var emptyEl=document.getElementById('yearly-chart-empty');
  var wrapEl=document.getElementById('yearly-chart-wrap');
  if(!section)return;

  if(allLoggedDays.length===0){
    if(emptyEl)emptyEl.style.display='block';
    if(wrapEl)wrapEl.style.display='none';
    section.style.display='block';
    return;
  }
  if(emptyEl)emptyEl.style.display='none';
  if(wrapEl)wrapEl.style.display='block';
  section.style.display='block';

  var labels=allLoggedDays.map(function(d){return d.date;});

  /* Build one dataset per category + overall */
  var catDatasets=activeCats.map(function(cat,ci){
    var data=allLoggedDays.map(function(d){
      var done=0,total=0;
      if(d.catCounts&&d.catCounts[cat.id]!=null){done=d.catCounts[cat.id].done||0;total=d.catCounts[cat.id].total||0;}
      else if(d.tasks&&d.tasks.length>0){
        var lc=['core','cat_core','cat_1'],lb=['bonus','cat_bonus','cat_2'],lh=['health','cat_health','cat_3'];
        var ct=d.tasks.filter(function(t){return t.cat===cat.id||t.catColor===cat.color||(ci===0&&lc.indexOf(t.cat)>=0)||(ci===1&&lb.indexOf(t.cat)>=0)||(ci===2&&lh.indexOf(t.cat)>=0);});
        done=ct.filter(function(t){return t.done;}).length;total=ct.length;
      }else{if(ci===0){done=d.coreDone||0;total=3;}else if(ci===1){done=d.bonusDone||0;total=3;}else if(ci===2){done=d.healthDone||0;total=3;}}
      return total>0?Math.round(done/total*100):null;
    });
    var col=cat.color||'#888';
    var hex=col.replace('#','');
    var r=parseInt(hex.substr(0,2),16)||128;
    var g=parseInt(hex.substr(2,2),16)||128;
    var b2=parseInt(hex.substr(4,2),16)||128;
    var yds={
      label:cat.name,data:data,
      borderColor:col,backgroundColor:'transparent',
      borderWidth:2,pointRadius:2,pointHoverRadius:5,
      pointBackgroundColor:col,pointBorderColor:'transparent',pointBorderWidth:0,
      fill:false,tension:.4,spanGaps:true
    };
    yds._bandColor=col;
    return yds;
  });

  /* Overall line */
  var overallData=allLoggedDays.map(function(d){
    var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);
    return d.total>0?Math.round(sc/d.total*100):null;
  });
  var yOverallDs={
    label:'Overall',data:overallData,
    borderColor:'#a78bfa',backgroundColor:'transparent',
    borderWidth:2.5,pointRadius:2,pointHoverRadius:6,
    pointBackgroundColor:'#a78bfa',pointBorderColor:'transparent',pointBorderWidth:0,
    fill:false,tension:.4,spanGaps:true,borderDash:[5,4]
  };
  yOverallDs._bandColor='#a78bfa';
  catDatasets.unshift(yOverallDs);

  /* Legend — clickable toggles, index-based (same as weekly/monthly) */
  var yearlyHiddenByIdx={};
  var legendEl=document.getElementById('yearly-legend');

  function buildYearlyLegend(){
    if(!legendEl)return;
    legendEl.innerHTML='';
    catDatasets.forEach(function(ds,idx){
      var isHid=!!yearlyHiddenByIdx[idx];
      var pill=document.createElement('div');
      pill.style.cssText='display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:99px;border:1px solid var(--border2);background:'+(isHid?'transparent':'var(--bg3)')+';cursor:pointer;opacity:'+(isHid?'0.35':'1')+';transition:all .18s;user-select:none;margin:2px';
      var lineStyle=ds.borderDash?'background:repeating-linear-gradient(90deg,'+ds.borderColor+' 0,'+ds.borderColor+' 5px,transparent 5px,transparent 9px);':'background:'+ds.borderColor+';';
      pill.innerHTML='<span style="width:14px;height:3px;border-radius:2px;display:inline-block;flex-shrink:0;'+lineStyle+'"></span><span style="color:var(--text2);white-space:nowrap">'+esc(ds.label)+'</span>';
      pill.onclick=(function(i){return function(){
        yearlyHiddenByIdx[i]=!yearlyHiddenByIdx[i];
        var chart=chartInst['yearly-line-chart'];
        if(chart){var meta=chart.getDatasetMeta(i);meta.hidden=yearlyHiddenByIdx[i]?true:null;chart.update();}
        buildYearlyLegend();
      };})(idx);
      legendEl.appendChild(pill);
    });
  }

  /* Destroy previous chart */
  destroyChart('yearly-line-chart');

  var canvas=document.getElementById('yearly-line-chart');
  if(!canvas)return;

  chartInst['yearly-line-chart']=new Chart(canvas,{
    type:'line',
    data:{labels:labels,datasets:catDatasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'rgba(10,10,18,.95)',
          titleColor:'#e0e0f0',bodyColor:'#a0a0b8',
          borderColor:'rgba(255,255,255,.08)',borderWidth:1,
          padding:12,titleFont:{size:11,weight:'bold'},
          callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+(ctx.parsed.y!==null?ctx.parsed.y+'%':'—');}}
        }
      },
      scales:{
        x:{
          grid:{color:gc,drawBorder:false},
          ticks:{color:tc,font:{size:9,family:uiFont},maxRotation:45,maxTicksLimit:24,autoSkip:true},
          border:{display:false}
        },
        y:{
          min:0,max:100,
          grid:{color:gc,drawBorder:false},
          ticks:{color:tc,font:{size:11,family:uiFont},callback:function(v){return v+'%';},stepSize:20},
          border:{display:false}
        }
      }
    }
  });

  buildYearlyLegend();

  /* Stats row */
  var statsEl=document.getElementById('yearly-stats-row');
  if(statsEl&&allLoggedDays.length>0){
    var avgOverall=Math.round(overallData.filter(function(v){return v!==null;}).reduce(function(a,b){return a+b;},0)/Math.max(1,overallData.filter(function(v){return v!==null;}).length));
    var bestDay=allLoggedDays.reduce(function(best,d,i){
      var v=overallData[i];
      if(v===null)return best;
      return(!best||v>best.v)?{d:d,v:v}:best;
    },null);
    var perfectCount=overallData.filter(function(v){return v!==null&&v>=90;}).length;
    var totalDays=allLoggedDays.length;
    var stats=[
      {lbl:'Days Logged',val:totalDays,sub:'across all weeks'},
      {lbl:'Avg Daily Score',val:avgOverall+'%',sub:'overall completion'},
      {lbl:'Perfect Days',val:perfectCount,sub:'≥90% completion'},
      {lbl:'Best Day',val:bestDay?bestDay.v+'%':'—',sub:bestDay?bestDay.d.date:'no data'}
    ];
    statsEl.innerHTML=stats.map(function(s){
      return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;text-align:center">'+
        '<div style="font-size:22px;font-weight:700;font-family:DM Mono,monospace;color:var(--accent)">'+s.val+'</div>'+
        '<div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-top:3px">'+s.lbl+'</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:1px;font-style:italic">'+s.sub+'</div>'+
      '</div>';
    }).join('');
  }
}

function renderMonthly(){
  ensureCategories();
  var grid=document.getElementById('month-grid');grid.innerHTML='';
  MONTHS.forEach(function(m){
    var rw=S.weeks.filter(function(w){return w.month&&w.month.toLowerCase()===m.toLowerCase();});
    var td=rw.reduce(function(a,w){return a+w.days.reduce(function(b,d){
      return b+(d.catCounts?Object.values(d.catCounts).reduce(function(x,v){return x+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone));
    },0);},0);
    var tp=rw.reduce(function(a,w){return a+w.days.reduce(function(b,d){return b+d.total;},0);},0);
    var pct=tp>0?Math.round(td/tp*100):null;
    var col=pct===null?'var(--text3)':pct>=80?'#3fcf8e':pct>=60?'#f5a623':'#ff5c5c';
    var card=document.createElement('div');
    card.className='month-card'+(activeMonthName===m?' active-month':'');
    card.innerHTML='<div class="month-name">'+m+' 2026</div><div class="month-meta">'+rw.length+' week'+(rw.length!==1?'s':'')+' logged</div><div class="month-pct" style="color:'+col+'">'+(pct!==null?pct+'%':'—')+'</div>';
    card.onclick=(function(name){return function(){openMonthDetail(name);};})(m);
    grid.appendChild(card);
  });
  var det=document.getElementById('month-detail');
  var yrSection=document.getElementById('yearly-chart-section');
  if(!activeMonthName){
    det.classList.remove('open');det.innerHTML='';
    /* Show yearly chart when all months collapsed */
    if(yrSection)yrSection.style.display='none';
    setTimeout(function(){drawYearlyChart();},200);
    return;
  }
  /* Hide yearly chart when a month is expanded */
  if(yrSection)yrSection.style.display='none';
  var rw=S.weeks.filter(function(w){return w.month&&w.month.toLowerCase()===activeMonthName.toLowerCase();});
  rw=rw.slice().sort(function(a,b){var na=parseInt(a.label.match(/\d+/)||[0]);var nb=parseInt(b.label.match(/\d+/)||[0]);return na-nb;});
  det.classList.add('open');
  var html='<div style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:4px;font-family:Syne,sans-serif">'+activeMonthName+' 2026</div>';
  if(rw.length===0){html+='<div class="alert alert-info">No weeks for '+activeMonthName+' yet.</div>';det.innerHTML=html;return;}
  var mTD=rw.reduce(function(a,w){return a+w.days.reduce(function(b,d){return b+(d.catCounts?Object.values(d.catCounts).reduce(function(x,v){return x+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone));},0);},0);
  var mTP=rw.reduce(function(a,w){return a+w.days.reduce(function(b,d){return b+d.total;},0);},0);
  var mPct=mTP>0?Math.round(mTD/mTP*100):0;
  var mDays=rw.reduce(function(a,w){return a+w.days.length;},0);
  html+='<div class="metrics" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:16px">';
  html+='<div class="metric"><div class="metric-val">'+mPct+'%</div><div class="metric-lbl">Month score</div></div>';
  html+='<div class="metric"><div class="metric-val">'+mDays+'</div><div class="metric-lbl">Days logged</div></div>';
  html+='<div class="metric"><div class="metric-val">'+rw.length+'</div><div class="metric-lbl">Weeks</div></div>';
  html+='</div>';
  html+='<div class="card"><div class="card-title">Week-by-week performance</div><div class="chart-wrap" style="height:220px"><canvas id="cm1"></canvas></div></div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  html+='<div class="card"><div class="card-title">Category totals</div><div class="chart-wrap" style="height:200px"><canvas id="cm2"></canvas></div></div>';
  html+='<div class="card"><div class="card-title">Daily trend — all categories</div><div id="cm3-legend" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)"></div><div class="chart-wrap" style="height:200px"><canvas id="cm3"></canvas></div></div>';
  html+='</div>';
  html+='<div class="card" style="margin-top:12px"><div class="card-title">Monthly analysis & suggestions</div><div id="month-insights"></div></div>';
  html+='<div class="sec">Weeks in '+activeMonthName+'</div>';
  rw.forEach(function(w){
    var wd=w.days.reduce(function(a,d){return a+(d.catCounts?Object.values(d.catCounts).reduce(function(x,v){return x+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone));},0);
    var wp=w.days.reduce(function(a,d){return a+d.total;},0);
    var wpct=wp>0?Math.round(wd/wp*100):0;
    var col=wpct>=80?'#3fcf8e':wpct>=60?'#f5a623':'#ff5c5c';
    html+='<div class="card" style="cursor:pointer" onclick="goToWeek(\''+w.id+'\')"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:14px;font-weight:600">'+w.label+'</div><div style="font-size:20px;font-weight:600;font-family:DM Mono,monospace;color:'+col+'">'+wpct+'%</div></div><div style="font-size:12px;color:var(--text3);margin-top:4px">'+w.days.length+' days · '+w.goals.length+' goals</div></div>';
  });
  det.innerHTML=html;
  setTimeout(function(){drawMonthCharts(rw,mPct,mDays);},200);
}
function openMonthDetail(name){activeMonthName=(activeMonthName===name)?null:name;renderMonthly();if(activeMonthName)setTimeout(function(){document.getElementById('month-detail').scrollIntoView({behavior:'smooth'});},80);}
function goToWeek(wid){
  var idx=S.weeks.findIndex(function(w){return w.id===wid;});if(idx>=0)activeWeekIdx=idx;
  switchPanel('weekly',document.querySelector('[data-panel="weekly"]'));
}
function drawMonthCharts(rw,mPct,mDays){
  ensureCategories();
  destroyChart('cm1');destroyChart('cm2');destroyChart('cm3');
  var gc=getCSSVar('--border')||'rgba(40,40,50,1)';
  var tc=getCSSVar('--text2')||'rgba(180,180,200,1)';
  var allDays=[];rw.forEach(function(w){w.days.forEach(function(d){allDays.push(d);});});
  var activeCats=S.taskCategories.filter(function(cat){return !cat.archived;});

  /* Chart 1 — Stacked bar per week using all active categories */
  var wLabels=rw.map(function(w){return w.label.split('—')[0].trim()||w.label.split('-')[0].trim();});
  var wDatasets=activeCats.map(function(cat,ci){
    return{label:cat.name,backgroundColor:cat.color,stack:'a',
      data:rw.map(function(w){
        return w.days.reduce(function(a,d){
          if(d.catCounts&&d.catCounts[cat.id]!=null)return a+(d.catCounts[cat.id].done||0);
          if(d.tasks&&d.tasks.length>0){
            var lc=['core','cat_core','cat_1'],lb=['bonus','cat_bonus','cat_2'],lh=['health','cat_health','cat_3'];
            var ct=d.tasks.filter(function(t){return t.cat===cat.id||t.catColor===cat.color||(ci===0&&lc.indexOf(t.cat)>=0)||(ci===1&&lb.indexOf(t.cat)>=0)||(ci===2&&lh.indexOf(t.cat)>=0);});
            if(ct.length>0)return a+ct.filter(function(t){return t.done;}).length;
          }
          if(ci===0)return a+(d.coreDone||0);
          if(ci===1)return a+(d.bonusDone||0);
          if(ci===2)return a+(d.healthDone||0);
          return a;
        },0);
      })};
  });
  var c1=document.getElementById('cm1');
  if(c1)chartInst.cm1=new Chart(c1,{type:'bar',data:{labels:wLabels,datasets:wDatasets},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:{size:11}}}},
      scales:{x:{stacked:true,grid:{color:gc},ticks:{color:tc,font:{size:11}}},y:{stacked:true,grid:{color:gc},ticks:{color:tc,font:{size:11}}}}}});

  /* Chart 2 — Category donut for month */
  var catTotals=activeCats.map(function(cat,ci){
    return rw.reduce(function(a,w){return a+w.days.reduce(function(b,d){
      if(d.catCounts&&d.catCounts[cat.id]!=null)return b+(d.catCounts[cat.id].done||0);
      if(d.tasks&&d.tasks.length>0){
        var lc=['core','cat_core','cat_1'],lb=['bonus','cat_bonus','cat_2'],lh=['health','cat_health','cat_3'];
        var ct=d.tasks.filter(function(t){return t.cat===cat.id||t.catColor===cat.color||(ci===0&&lc.indexOf(t.cat)>=0)||(ci===1&&lb.indexOf(t.cat)>=0)||(ci===2&&lh.indexOf(t.cat)>=0);});
        if(ct.length>0)return b+ct.filter(function(t){return t.done;}).length;
      }
      if(ci===0)return b+(d.coreDone||0);
      if(ci===1)return b+(d.bonusDone||0);
      if(ci===2)return b+(d.healthDone||0);
      return b;
    },0);},0);
  });
  var grandTotal=catTotals.reduce(function(a,b){return a+b;},0);
  var c2=document.getElementById('cm2');
  if(c2&&grandTotal>0)chartInst.cm2=new Chart(c2,{type:'doughnut',
    data:{labels:activeCats.map(function(c){return c.name;}),
          datasets:[{data:catTotals,backgroundColor:activeCats.map(function(c){return c.color;}),borderWidth:0,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:tc,font:{size:11},padding:10}}}}});

  /* Chart 3 — Daily completion rate line — all categories */
  var dailyRates=allDays.map(function(d){
    var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);
    return d.total>0?Math.round(sc/d.total*100):0;
  });
  var monthLineDatasets=activeCats.map(function(cat,ci){
    var data=allDays.map(function(d){
      var done=0,total=0;
      if(d.catCounts&&d.catCounts[cat.id]!=null){done=d.catCounts[cat.id].done||0;total=d.catCounts[cat.id].total||0;}
      else if(d.tasks&&d.tasks.length>0){
        var lc=['core','cat_core','cat_1'],lb=['bonus','cat_bonus','cat_2'],lh=['health','cat_health','cat_3'];
        var ct=d.tasks.filter(function(t){return t.cat===cat.id||t.catColor===cat.color||(ci===0&&lc.indexOf(t.cat)>=0)||(ci===1&&lb.indexOf(t.cat)>=0)||(ci===2&&lh.indexOf(t.cat)>=0);});
        done=ct.filter(function(t){return t.done;}).length;total=ct.length;
      }else{if(ci===0){done=d.coreDone||0;total=3;}else if(ci===1){done=d.bonusDone||0;total=3;}else if(ci===2){done=d.healthDone||0;total=3;}}
      return total>0?Math.round(done/total*100):null;
    });
    var col=cat.color||'#888';
    var hex=col.replace('#','');
    var rgb=hex.length===6?[parseInt(hex.substr(0,2),16),parseInt(hex.substr(2,2),16),parseInt(hex.substr(4,2),16)]:[100,100,255];
    var ds2={label:cat.name,data:data,
      borderColor:col,backgroundColor:'transparent',
      borderWidth:2,pointRadius:2,pointHoverRadius:5,
      pointBackgroundColor:col,pointBorderColor:'transparent',
      fill:false,tension:.4,spanGaps:true};
    ds2._bandColor=col;
    return ds2;
  });
  var overallDs2={label:'Overall %',data:dailyRates,
    borderColor:'#a78bfa',backgroundColor:'transparent',
    borderWidth:2.5,pointRadius:2,pointHoverRadius:5,
    pointBackgroundColor:'#a78bfa',pointBorderColor:'transparent',
    fill:false,tension:.4,borderDash:[5,4]};
  overallDs2._bandColor='#a78bfa';
  monthLineDatasets.unshift(overallDs2);

  /* Build custom legend for cm3 to fix category toggle bug */
  var cm3LegendEl=document.getElementById('cm3-legend');
  var monthHiddenLines={};
  function buildCm3Legend(){
    if(!cm3LegendEl)return;
    cm3LegendEl.innerHTML='';
    monthLineDatasets.forEach(function(ds,idx){
      var isHid=!!monthHiddenLines[idx];
      var pill=document.createElement('div');
      pill.style.cssText='display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:99px;border:1px solid var(--border2);background:'+(isHid?'transparent':'var(--bg3)')+';cursor:pointer;opacity:'+(isHid?'0.35':'1')+';transition:all .18s;user-select:none;margin:2px';
      var lineStyle=ds.borderDash?'background:repeating-linear-gradient(90deg,'+ds.borderColor+' 0,'+ds.borderColor+' 5px,transparent 5px,transparent 9px);':'background:'+ds.borderColor+';';
      pill.innerHTML='<span style="width:14px;height:3px;border-radius:2px;display:inline-block;flex-shrink:0;'+lineStyle+'"></span><span style="color:var(--text2);white-space:nowrap">'+ds.label+'</span>';
      pill.onclick=(function(i){return function(){
        monthHiddenLines[i]=!monthHiddenLines[i];
        var chart=chartInst.cm3;
        if(chart){var meta=chart.getDatasetMeta(i);meta.hidden=monthHiddenLines[i]?true:null;chart.update();}
        buildCm3Legend();
      };})(idx);
      cm3LegendEl.appendChild(pill);
    });
  }

  var c3=document.getElementById('cm3');
  if(c3&&allDays.length>0){
    chartInst.cm3=new Chart(c3,{type:'line',
      data:{labels:allDays.map(function(d){return d.date;}),datasets:monthLineDatasets},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},
          tooltip:{
            backgroundColor:'rgba(10,10,18,.95)',
            titleColor:'#e0e0f0',bodyColor:'#a0a0b8',
            borderColor:'rgba(255,255,255,.08)',borderWidth:1,
            padding:12,titleFont:{size:11,weight:'bold'},
            callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+(ctx.parsed.y!==null?ctx.parsed.y+'%':'—');}}
          }
        },
        scales:{
          x:{grid:{color:gc,drawBorder:false},ticks:{color:tc,font:{size:10},maxRotation:45},border:{display:false}},
          y:{min:0,max:100,grid:{color:gc,drawBorder:false},ticks:{color:tc,font:{size:11},callback:function(v){return v+'%';}},border:{display:false}}
        }
      }
    });
    buildCm3Legend();
  }

  /* ─── DEEP MONTHLY INSIGHTS ─── */
  var el=document.getElementById('month-insights');if(!el)return;
  var ins=[];
  var cat0=S.taskCategories[0]||{name:'Core'};
  var studyDaysAll=allDays.filter(function(d){return d.tasks&&d.tasks.some(function(t){return (t.cat===firstCatId||t.cat==='core')&&t.done;});}).length;
  var studyRate=allDays.length?Math.round(studyDaysAll/allDays.length*100):0;
  var avgDaily=dailyRates.length?Math.round(dailyRates.reduce(function(a,b){return a+b;},0)/dailyRates.length):0;
  var colDaysAll=allDays.filter(function(d){var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);return d.total>0&&sc/d.total<0.4;});
  var perfectDaysAll=allDays.filter(function(d){var sc=d.catCounts?Object.values(d.catCounts).reduce(function(a,v){return a+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone);return d.total>0&&sc/d.total>=0.9;});
  var weekTrend='';
  if(rw.length>=2){
    var wRates=rw.map(function(w){var td=w.days.reduce(function(a,d){return a+(d.catCounts?Object.values(d.catCounts).reduce(function(x,v){return x+v.done;},0):(d.coreDone+d.bonusDone+d.healthDone));},0);var tp=w.days.reduce(function(a,d){return a+d.total;},0);return tp>0?td/tp*100:0;});
    weekTrend=wRates[wRates.length-1]>wRates[0]+5?'improving':wRates[wRates.length-1]<wRates[0]-5?'declining':'stable';
  }
  var urgDLs=S.deadlines.filter(function(d){var diff=daysUntil(d.date);return !d.done&&diff>=0&&diff<=60;}).sort(function(a,b){return daysUntil(a.date)-daysUntil(b.date);});

  if(mPct>=85)ins.push({t:'ok',s:'Outstanding month — '+mPct+'% overall, '+avgDaily+'% daily avg across '+allDays.length+' days. Keep raising the target.'});
  else if(mPct>=70)ins.push({t:'ok',s:'Strong month at '+mPct+'% ('+avgDaily+'% daily avg). '+(weekTrend?'Trend: '+weekTrend+'. ':'')+'Close the '+Math.round(100-mPct)+'% gap by targeting consistently skipped tasks.'});
  else if(mPct>=55)ins.push({t:'warn',s:'Moderate month at '+mPct+'% ('+avgDaily+'% daily). Over '+allDays.length+' days roughly '+Math.round(allDays.length*(100-avgDaily)/100*8)+' unfilled task slots.'});
  else ins.push({t:'danger',s:'Below minimum — '+mPct+'% this month, '+colDaysAll.length+' collapse days. Immediate system simplification required.'});

  if(studyRate>=90)ins.push({t:'ok',s:cat0.name+' on '+studyDaysAll+'/'+allDays.length+' days ('+studyRate+'%). Excellent academic discipline.'});
  else if(studyRate>=75)ins.push({t:'ok',s:cat0.name+' on '+studyDaysAll+'/'+allDays.length+' days ('+studyRate+'%). Analyse the '+Math.round(100-studyRate)+'% miss days.'});
  else ins.push({t:'danger',s:cat0.name+' on only '+studyRate+'% of days. Each missed day reduces coverage probability.'});

  if(perfectDaysAll.length>0||colDaysAll.length>0)ins.push({t:colDaysAll.length>perfectDaysAll.length?'warn':'ok',s:''+perfectDaysAll.length+' peak days (90%+) vs '+colDaysAll.length+' collapse days (<40%). '+(colDaysAll.length>perfectDaysAll.length?'Stabilise before pushing output.':'Momentum building correctly.')});
  if(weekTrend==='improving'&&rw.length>=2)ins.push({t:'ok',s:'Week-over-week improvement detected — strongest leading indicator of long-term consistency.'});
  else if(weekTrend==='declining'&&rw.length>=2)ins.push({t:'warn',s:'Week-over-week decline. Schedule a deliberate recovery week.'});
  if(urgDLs.length>0)ins.push({t:'warn',s:'Deadlines in 60 days: '+urgDLs.map(function(d){return d.name+' in '+daysUntil(d.date)+'d';}).join(' · ')});

  var ihtml='';
  ins.forEach(function(i){var col=i.t==='ok'?'var(--green)':i.t==='warn'?'var(--amber)':'var(--red)';var icon=i.t==='ok'?'↑':i.t==='warn'?'→':'↓';ihtml+='<div style="padding:11px 0;border-bottom:1px solid var(--border);font-size:13px;color:'+col+';line-height:1.65"><span style="font-weight:700;margin-right:6px">'+icon+'</span>'+i.s+'</div>';});
  el.innerHTML=ihtml||'<div class="empty">Not enough data yet.</div>';
}

/* ─── DEADLINES ─── */
function renderDeadlines(){
  var el=document.getElementById('dl-list');el.innerHTML='';
  var doneEl=document.getElementById('dl-done-list');
  var doneSec=document.getElementById('dl-done-sec');
  if(!doneEl)return;
  doneEl.innerHTML='';

  var active=S.deadlines.filter(function(d){return !d.done;});
  var done=S.deadlines.filter(function(d){return d.done;});

  if(active.length===0){el.innerHTML='<div class="empty">No active deadlines.</div>';}
  var sorted=active.slice().sort(function(a,b){return daysUntil(a.date)-daysUntil(b.date);});
  sorted.forEach(function(d){el.appendChild(buildDlRow(d,false));});

  if(done.length>0){
    doneEl.style.display='block';if(doneSec)doneSec.style.display='flex';
    done.forEach(function(d){doneEl.appendChild(buildDlRow(d,true));});
  }else{
    doneEl.style.display='none';if(doneSec)doneSec.style.display='none';
  }
}
function buildDlRow(d,isDone){
  var diff=daysUntil(d.date);
  var cls=isDone?'c-ok':diff<0?'c-urgent':diff<=7?'c-urgent':diff<=20?'c-soon':'c-ok';
  var lbl=isDone?'Done':diff<0?'Overdue '+Math.abs(diff)+'d':diff===0?'Today':diff+' days';
  var pctU=isDone?100:diff<0?100:Math.max(0,100-Math.round(diff/365*100));
  var bCol=isDone?'var(--green)':diff<=7?'var(--amber)':diff<=20?'var(--amber)':'var(--green)';
  var row=document.createElement('div');
  row.className='dl-row'+(isDone?' dl-done':'');
  var tick=document.createElement('div');
  tick.className='dl-tick'+(isDone?' done':'');
  tick.title=isDone?'Mark as active':'Mark as done';
  tick.onclick=(function(did,wasDone){return function(){toggleDeadlineDone(did,wasDone);};})(d.id,isDone);
  row.appendChild(tick);
  var name=document.createElement('div');name.className='dl-name';name.textContent=d.name;row.appendChild(name);
  var dt=document.createElement('div');dt.className='dl-date-txt';dt.textContent=d.date;row.appendChild(dt);
  var pb=document.createElement('div');pb.className='dl-pbar';
  pb.innerHTML='<div class="dl-pbfill" style="width:'+pctU+'%;background:'+bCol+'"></div>';row.appendChild(pb);
  var days=document.createElement('div');days.className='dl-days '+cls;days.textContent=lbl;row.appendChild(days);
  var del=document.createElement('button');del.className='del-btn';del.textContent='×';
  del.onclick=(function(did){return function(){removeDeadline(did);};})(d.id);
  row.appendChild(del);
  return row;
}
function toggleDeadlineDone(id,wasDone){
  var d=S.deadlines.find(function(x){return x.id===id;});
  if(d){d.done=!wasDone;saveState();renderDeadlines();}
}
function addDeadline(){
  var n=document.getElementById('dl-name-in').value.trim();var dt=document.getElementById('dl-date-in').value.trim();
  if(!n||!dt){alert('Enter both name and date.');return;}
  S.deadlines.push({id:uid(),name:n,date:dt,done:false});
  document.getElementById('dl-name-in').value='';document.getElementById('dl-date-in').value='';
  saveState();renderDeadlines();
}
function removeDeadline(id){if(!confirm('Remove deadline?'))return;S.deadlines=S.deadlines.filter(function(d){return d.id!==id;});saveState();renderDeadlines();}
document.getElementById('dl-name-in').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('dl-date-in').focus();});
document.getElementById('dl-date-in').addEventListener('keydown',function(e){if(e.key==='Enter')addDeadline();});

/* ─── POMODORO / FOCUS TIMER ─── */
var POM={
  running:false,timer:null,
  phase:'focus',
  session:1,totalSessions:4,
  secsLeft:0,totalSecs:0,
  audioCtx:null,
  /* Audio elements keyed by id */
  audioEls:{},
  activeSounds:{},
  soundVols:{rain:.5,ocean:.5,forest:.5,grassland:.5,fire:.5},
  /* Timer log: {dateKey: minutesFocused} */
  SOUNDS:[
    {id:'rain',      label:'Rain',      icon:'🌧️', file:'sounds/rain.mp3'},
    {id:'ocean',     label:'Ocean',     icon:'🌊', file:'sounds/ocean.mp3'},
    {id:'forest',    label:'Forest',    icon:'🌲', file:'sounds/forest.mp3'},
    {id:'grassland', label:'Grassland', icon:'🌾', file:'sounds/grassland.mp3'},
    {id:'fire',      label:'Fire',      icon:'🔥', file:'sounds/fire.mp3'}
  ]
};

function pomGetDurations(){
  return{
    focus:(CFG.pomFocus||25)*60,
    short:(CFG.pomShort||5)*60,
    long:(CFG.pomLong||15)*60
  };
}

/* ── Timer log (focus minutes per day) ── */
function pomLogMinute(){
  var key=fmtDateKey(TODAY);
  if(!S.timerLog)S.timerLog={};
  S.timerLog[key]=(S.timerLog[key]||0)+1;
  saveState();
  pomUpdateStreak();
}

/* Streak: consecutive days with ≥10 min focus */
function pomCalcStreak(){
  if(!S.timerLog)return 0;
  var streak=0;
  var d=new Date(TODAY.getTime());
  for(var i=0;i<365;i++){
    var key=d.toISOString().split('T')[0];
    var mins=S.timerLog[key]||0;
    if(mins>=10){streak++;}
    else if(i>0){break;}
    d.setDate(d.getDate()-1);
  }
  return streak;
}

function pomUpdateStreak(){
  var streak=pomCalcStreak();
  var el=document.getElementById('pom-streak-badge');
  if(el)el.textContent='🔥 '+streak+' day streak';
}

function pomInit(){
  var d=pomGetDurations();
  POM.phase='focus';POM.session=1;POM.running=false;
  POM.secsLeft=d.focus;POM.totalSecs=d.focus;
  if(POM.timer){clearInterval(POM.timer);POM.timer=null;}
  if(!S.timerLog)S.timerLog={};
  pomRender();
  pomUpdateStreak();
}

function pomToggle(){
  if(POM.running){
    clearInterval(POM.timer);POM.timer=null;POM.running=false;
    document.getElementById('pom-start-btn').textContent='▶';
    document.getElementById('pom-start-btn').classList.remove('running');
  }else{
    POM.running=true;
    document.getElementById('pom-start-btn').textContent='⏸';
    document.getElementById('pom-start-btn').classList.add('running');
    POM.timer=setInterval(pomTick,1000);
  }
}

var pomSecsSinceSave=0;
function pomTick(){
  POM.secsLeft--;
  /* Log focus minutes */
  if(POM.phase==='focus'){
    pomSecsSinceSave++;
    if(pomSecsSinceSave>=60){pomSecsSinceSave=0;pomLogMinute();}
  }
  if(POM.secsLeft<=0){pomAdvance();}
  else{pomRender();}
}

function pomAdvance(){
  clearInterval(POM.timer);POM.timer=null;POM.running=false;
  document.getElementById('pom-start-btn').textContent='▶';
  document.getElementById('pom-start-btn').classList.remove('running');
  /* Play timer end sound once */
  try{
    var ta=new Audio('sounds/timer.mp3');
    ta.volume=1;
    ta.play().catch(function(){});
  }catch(e){}
  /* Save any partial minute */
  if(POM.phase==='focus'&&pomSecsSinceSave>0){pomLogMinute();pomSecsSinceSave=0;}
  var d=pomGetDurations();
  var wasBreak=(POM.phase==='short'||POM.phase==='long');
  if(POM.phase==='focus'){
    if(POM.session>=POM.totalSessions){POM.phase='long';POM.secsLeft=d.long;POM.totalSecs=d.long;}
    else{POM.phase='short';POM.secsLeft=d.short;POM.totalSecs=d.short;}
  }else if(POM.phase==='short'){
    POM.session++;POM.phase='focus';POM.secsLeft=d.focus;POM.totalSecs=d.focus;
  }else if(POM.phase==='long'){
    POM.session=1;POM.phase='focus';POM.secsLeft=d.focus;POM.totalSecs=d.focus;
  }
  pomRender();
  /* Auto-start break when focus ends; stop automatically when break ends */
  if(!wasBreak){
    /* Focus just ended → auto-start break */
    POM.running=true;
    document.getElementById('pom-start-btn').textContent='⏸';
    document.getElementById('pom-start-btn').classList.add('running');
    POM.timer=setInterval(pomTick,1000);
  }
  /* If break just ended, stay paused so user can start next focus manually */
}

function pomSkip(){
  if(POM.phase!=='focus'){
    clearInterval(POM.timer);POM.timer=null;POM.running=false;
    document.getElementById('pom-start-btn').textContent='▶';
    document.getElementById('pom-start-btn').classList.remove('running');
    var d=pomGetDurations();
    if(POM.phase==='long'){POM.session=1;}else{POM.session++;}
    POM.phase='focus';POM.secsLeft=d.focus;POM.totalSecs=d.focus;
    pomRender();
  }
}

function pomReset(){
  if(POM.timer){clearInterval(POM.timer);POM.timer=null;}
  pomSecsSinceSave=0;
  POM.running=false;
  document.getElementById('pom-start-btn').textContent='▶';
  document.getElementById('pom-start-btn').classList.remove('running');
  var d=pomGetDurations();
  POM.secsLeft=POM.totalSecs=(POM.phase==='focus'?d.focus:POM.phase==='short'?d.short:d.long);
  pomRender();
}

function pomRender(){
  var el=document.getElementById('pom-time');if(!el)return;
  var m=Math.floor(POM.secsLeft/60);var s=POM.secsLeft%60;
  el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  var ring=document.getElementById('pom-ring');
  if(ring){
    var pct=POM.totalSecs>0?POM.secsLeft/POM.totalSecs:1;
    ring.style.strokeDashoffset=String(628.3*(1-pct));
    ring.style.stroke=POM.phase==='focus'?'var(--accent)':POM.phase==='short'?'var(--green)':'var(--amber)';
  }
  var slbl=document.getElementById('pom-session-label');
  if(slbl){
    var phaseLabel=POM.phase==='focus'?'🎯 Focus':POM.phase==='short'?'☕ Short Break':'🛌 Long Break';
    slbl.textContent=(POM.phase==='focus'?'Session '+POM.session+' of '+POM.totalSessions+' — ': '')+phaseLabel;
  }
  var pb=document.getElementById('pom-phase-badge');
  if(pb){pb.textContent=POM.phase==='focus'?'FOCUS':POM.phase==='short'?'SHORT BREAK':'LONG BREAK';}
  var dotsEl=document.getElementById('pom-dots');
  if(dotsEl){
    var dotsHtml='';
    for(var i=1;i<=POM.totalSessions;i++){
      var col=i<POM.session?'var(--green)':i===POM.session&&POM.phase==='focus'?'var(--accent)':'var(--border2)';
      dotsHtml+='<div style="width:10px;height:10px;border-radius:50%;background:'+col+';transition:background .3s"></div>';
    }
    dotsEl.innerHTML=dotsHtml;
  }
}

/* ── SOUNDS — MP3-based with loop ── */
function pomBuildSounds(){
  var el=document.getElementById('pom-sounds');if(!el)return;el.innerHTML='';
  POM.SOUNDS.forEach(function(s){
    var vol=POM.soundVols[s.id]!==undefined?POM.soundVols[s.id]:0.5;
    var isActive=!!POM.activeSounds[s.id];
    var row=document.createElement('div');row.className='pom-sound-row';
    row.innerHTML=
      '<span class="pom-sound-icon">'+s.icon+'</span>'+
      '<span class="pom-sound-name">'+s.label+'</span>'+
      '<button class="pom-sound-toggle'+(isActive?' active':'')+'" id="snd-btn-'+s.id+'" onclick="pomToggleSound(\''+s.id+'\')">'+
        (isActive?'◼':'▶')+'</button>'+
      '<input type="range" class="pom-sound-vol" min="0" max="1" step="0.05" value="'+vol+'" style="flex:1" '+
        'oninput="pomSetVolume(\''+s.id+'\',this.value)">';
    el.appendChild(row);
  });
}

function pomGetAudio(id){
  if(!POM.audioEls[id]){
    var snd=POM.SOUNDS.find(function(s){return s.id===id;});
    if(!snd)return null;
    var audio=new Audio(snd.file);
    audio.loop=true;
    audio.preload='auto';
    audio.volume=POM.soundVols[id]||0.5;
    POM.audioEls[id]=audio;
  }
  return POM.audioEls[id];
}

function pomToggleSound(id){
  if(POM.activeSounds[id]){pomStopSound(id);}else{pomPlaySound(id);}
}

function pomPlaySound(id){
  var audio=pomGetAudio(id);
  if(!audio)return;
  audio.loop=true;
  audio.volume=POM.soundVols[id]||0.5;
  var p=audio.play();
  if(p&&p.catch)p.catch(function(e){console.log('Audio blocked:',e);});
  POM.activeSounds[id]=true;
  var btn=document.getElementById('snd-btn-'+id);
  if(btn){btn.classList.add('active');btn.textContent='◼';}
}

function pomStopSound(id){
  var audio=POM.audioEls[id];
  if(audio){audio.pause();audio.currentTime=0;}
  POM.activeSounds[id]=false;
  var btn=document.getElementById('snd-btn-'+id);
  if(btn){btn.classList.remove('active');btn.textContent='▶';}
}

function pomSetVolume(id,val){
  POM.soundVols[id]=parseFloat(val);
  var audio=POM.audioEls[id];
  if(audio)audio.volume=parseFloat(val);
}

/* ── SOUND DRAWER ── */
function openSoundDrawer(){
  pomBuildSounds();
  document.getElementById('sound-drawer').classList.add('open');
  document.getElementById('sound-drawer-overlay').style.display='block';
}
function closeSoundDrawer(){
  document.getElementById('sound-drawer').classList.remove('open');
  document.getElementById('sound-drawer-overlay').style.display='none';
}

/* ── TIMER ANALYTICS ── */
function openTimerAnalysis(){
  if(!S.timerLog)S.timerLog={};
  var modal=document.getElementById('timer-analysis-modal');
  var cont=document.getElementById('timer-analysis-content');
  if(!modal||!cont)return;
  /* Build data for last 30 days */
  var days=[],labels=[],dailyMins=[];
  for(var i=29;i>=0;i--){
    var d=new Date(TODAY.getTime()-i*864e5);
    var key=d.toISOString().split('T')[0];
    var mins=S.timerLog[key]||0;
    days.push(key);
    labels.push((d.getMonth()+1)+'/'+(d.getDate()));
    dailyMins.push(mins);
  }
  var totalMins=dailyMins.reduce(function(a,b){return a+b;},0);
  var activeDays=dailyMins.filter(function(m){return m>0;}).length;
  var streak=pomCalcStreak();
  var avgMins=activeDays>0?Math.round(totalMins/activeDays):0;
  var bestDay=Math.max.apply(null,dailyMins);

  cont.innerHTML=
    '<div class="metrics" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">'+
    '<div class="metric"><div class="metric-val" style="font-size:20px">'+streak+'</div><div class="metric-lbl">🔥 Streak days</div></div>'+
    '<div class="metric"><div class="metric-val" style="font-size:20px">'+totalMins+'</div><div class="metric-lbl">⏱ Total min (30d)</div></div>'+
    '<div class="metric"><div class="metric-val" style="font-size:20px">'+avgMins+'</div><div class="metric-lbl">📊 Avg min/day</div></div>'+
    '<div class="metric"><div class="metric-val" style="font-size:20px">'+bestDay+'</div><div class="metric-lbl">🏆 Best day (min)</div></div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:12px"><div class="card-title">Daily focus minutes — last 30 days</div>'+
    '<div class="chart-wrap" style="height:200px"><canvas id="ta-bar-chart"></canvas></div></div>'+
    '<div class="card"><div class="card-title">Cumulative focus trend</div>'+
    '<div class="chart-wrap" style="height:200px"><canvas id="ta-line-chart"></canvas></div></div>';

  modal.classList.add('open');

  setTimeout(function(){
    var gc=getCSSVar('--border')||'rgba(40,40,50,1)';
    var tc=getCSSVar('--text2')||'rgba(180,180,200,1)';
    destroyChart('ta-bar');destroyChart('ta-line');
    var c1=document.getElementById('ta-bar-chart');
    if(c1)chartInst['ta-bar']=new Chart(c1,{type:'bar',data:{labels:labels,datasets:[{label:'Minutes',data:dailyMins,backgroundColor:dailyMins.map(function(m){return m>=10?'var(--green)':m>0?'var(--amber)':'var(--border2)';}),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:9},maxRotation:45}},y:{grid:{color:gc},ticks:{color:tc,font:{size:11}},beginAtZero:true}}}});
    /* Cumulative */
    var cumulative=[],sum=0;
    dailyMins.forEach(function(m){sum+=m;cumulative.push(sum);});
    var c2=document.getElementById('ta-line-chart');
    if(c2)chartInst['ta-line']=new Chart(c2,{type:'line',data:{labels:labels,datasets:[{label:'Cumulative min',data:cumulative,borderColor:'var(--accent)',backgroundColor:'rgba(74,143,255,0.08)',borderWidth:2,pointRadius:0,fill:true,tension:.4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:9},maxRotation:45}},y:{grid:{color:gc},ticks:{color:tc,font:{size:11}},beginAtZero:true}}}});
  },60);
}

function closeTimerAnalysis(){
  document.getElementById('timer-analysis-modal').classList.remove('open');
  destroyChart('ta-bar');destroyChart('ta-line');
}

/* Init pomodoro when panel first shown */

/* ═══════════════════════════════════════════════════════════
   UNIFIED ADDITIONS — no wrapper chaining
═══════════════════════════════════════════════════════════ */

/* ── SETTINGS TABS ── */
function switchSettingsTab(tab,btn){
  document.querySelectorAll('.stab').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.stab-panel').forEach(function(p){p.classList.remove('active');});
  if(btn)btn.classList.add('active');
  var panel=document.getElementById('stab-'+tab);
  if(panel)panel.classList.add('active');
  /* Render sub-content on switch */
  if(tab==='appearance'){buildThemeGrid();buildFontGrid();}
  if(tab==='categories'){renderCategoriesSettings();}
  if(tab==='goals'){renderSettingsGoals();buildGoalColorSwatches();}
}

/* Goal color swatches in add row */
var _sgColor='#4a8fff';
function buildGoalColorSwatches(){
  var wrap=document.getElementById('goal-color-swatches');if(!wrap)return;
  var colors=['#4a8fff','#3fcf8e','#f5a623','#a78bfa','#ff5c5c'];
  wrap.innerHTML='';
  colors.forEach(function(c){
    var sw=document.createElement('div');
    sw.className='goal-color-swatch'+(c===_sgColor?' selected':'');
    sw.style.background=c;
    sw.title=c;
    sw.onclick=(function(col){return function(){
      _sgColor=col;
      document.querySelectorAll('.goal-color-swatch').forEach(function(s){s.classList.toggle('selected',s.title===col);});
    };})(c);
    wrap.appendChild(sw);
  });
}

function addGoalSetting(){
  ensureGoals();
  var nameInp=document.getElementById('sg-name');
  var name=nameInp?nameInp.value.trim():'';
  if(!name){alert('Enter a goal name.');return;}
  S.goals.push({id:uid(),name:name,color:_sgColor,tree:[]});
  if(nameInp)nameInp.value='';
  saveState();renderSettingsGoals();renderGoalDB();renderGoalsPanel();
}
/* ═══════════════════════════════════════════════
   CATEGORIES — 5 fixed, color-locked, archive-only
   Colors: 1=green, 2=blue, 3=yellow, 4=pink, 5=orange
   id is stable, color is stable, name is editable
═══════════════════════════════════════════════ */
var CAT_COLORS=['#3fcf8e','#4a8fff','#f5a623','#ec4899','#f97316'];
var CAT_COLOR_LABELS=['Green','Blue','Yellow','Pink','Orange'];
var FIXED_CAT_IDS=['cat_1','cat_2','cat_3','cat_4','cat_5'];
var FIXED_CAT_DEFAULTS=['Core','Bonus','Health','Study','Fitness'];

function ensureCategories(){
  if(!S.taskCategories||!Array.isArray(S.taskCategories)||S.taskCategories.length<5){
    /* Always ensure exactly 5 fixed categories */
    var existing=S.taskCategories||[];
    S.taskCategories=FIXED_CAT_IDS.map(function(fid,i){
      var found=existing.find(function(c){return c.id===fid;});
      return found?found:{id:fid,name:FIXED_CAT_DEFAULTS[i],color:CAT_COLORS[i],archived:false};
    });
    /* Migrate old data if needed */
    var oldMap={'cat_core':'cat_1','cat_bonus':'cat_2','cat_health':'cat_3','core':'cat_1','bonus':'cat_2','health':'cat_3'};
    Object.keys(oldMap).forEach(function(ok){
      var nk=oldMap[ok];
      if(S.tasks[ok]&&S.tasks[ok].length>0&&(!S.tasks[nk]||S.tasks[nk].length===0)){
        S.tasks[nk]=S.tasks[ok];
      }
    });
  }
  /* Ensure colors are always the fixed ones (color = identity) */
  S.taskCategories.forEach(function(c,i){
    c.color=CAT_COLORS[i];/* color is always positional, immutable */
    if(!S.tasks[c.id])S.tasks[c.id]=[];
  });
}

/* Archive a category: records the date it was archived */
function archiveCat(id){
  ensureCategories();
  var cat=S.taskCategories.find(function(c){return c.id===id;});
  if(!cat)return;
  var activeCount=S.taskCategories.filter(function(c){return !c.archived;}).length;
  if(activeCount<=1){alert('Cannot archive the last active category.');return;}
  cat.archived=true;
  cat.archivedDate=fmtDateKey(TODAY);
  /* Clear unarchivedDate so old unarchive doesn't interfere */
  delete cat.unarchivedDate;
  saveState();
  renderCategoriesSettings();
  renderDailyPanel();
  renderWeekly();
  renderMonthly();
}

/* Unarchive: records the date it was unarchived */
function unarchiveCat(id){
  ensureCategories();
  var cat=S.taskCategories.find(function(c){return c.id===id;});
  if(!cat)return;
  cat.archived=false;
  cat.unarchivedDate=fmtDateKey(TODAY);
  saveState();
  renderCategoriesSettings();
  renderDailyPanel();
  renderWeekly();
  renderMonthly();
}

/* Check if a category should be VISIBLE for a given dateKey string (YYYY-MM-DD) */
function catVisibleOnDate(cat,dateKey){
  /* Never been archived: always visible */
  if(!cat.archivedDate)return true;

  var ad=cat.archivedDate;   /* date archived */
  var ud=cat.unarchivedDate||null; /* date unarchived (null = still archived) */

  /* Rule: visible if dateKey < archivedDate (before it was ever archived) */
  if(dateKey<ad)return true;

  /* dateKey >= archivedDate */
  if(!ud){
    /* Currently archived and never unarchived → hidden on archivedDate and all future */
    return false;
  }

  /* Was unarchived at ud */
  if(ud<=ad){
    /* Unarchived same day or before archive date — treat as never archived */
    return true;
  }

  /* dateKey is in [ad, ud) → hidden (the archived window) */
  if(dateKey>=ad&&dateKey<ud)return false;

  /* dateKey >= ud → visible again */
  return true;
}

/* Is category active right now (today) */
function catActiveNow(cat){
  return catVisibleOnDate(cat,fmtDateKey(TODAY));
}

function renderCategoriesSettings(){
  ensureCategories();
  var el=document.getElementById('settings-cat-list');if(!el)return;
  el.innerHTML='';
  S.taskCategories.forEach(function(cat,i){
    var isArchived=!!cat.archived;
    var row=document.createElement('div');
    row.className='scat-row';
    row.style.opacity=isArchived?'0.55':'1';
    /* Color dot — fixed, not editable */
    var dot=document.createElement('div');
    dot.className='scat-dot';
    dot.style.background=cat.color;
    dot.title=CAT_COLOR_LABELS[i]+' (fixed)';
    /* Name input — editable */
    var nameInp=document.createElement('input');
    nameInp.type='text';nameInp.className='scat-name-inp';nameInp.value=cat.name;
    nameInp.disabled=isArchived;
    nameInp.placeholder='Category name';
    nameInp.onblur=(function(cid,inp){return function(){
      var c=S.taskCategories.find(function(x){return x.id===cid;});
      if(c&&inp.value.trim()&&inp.value.trim()!==c.name){
        c.name=inp.value.trim();saveState();
        renderDailyPanel();renderWeekly();renderMonthly();
      }
    };})(cat.id,nameInp);
    nameInp.onkeydown=function(e){if(e.key==='Enter')this.blur();};
    /* Color label badge */
    var colorBadge=document.createElement('span');
    colorBadge.style.cssText='font-size:11px;color:'+cat.color+';font-weight:700;padding:3px 8px;background:'+cat.color+'18;border-radius:99px;white-space:nowrap;flex-shrink:0';
    colorBadge.textContent=CAT_COLOR_LABELS[i];
    /* Archive / Unarchive toggle */
    var archBtn=document.createElement('button');
    archBtn.style.cssText='padding:5px 12px;font-size:11px;font-weight:600;border-radius:99px;cursor:pointer;border:1px solid;white-space:nowrap;flex-shrink:0;transition:all .15s';
    if(isArchived){
      archBtn.textContent='Unarchive';
      archBtn.style.cssText+=';background:var(--green-bg);color:var(--green);border-color:var(--green)';
      archBtn.onclick=(function(cid){return function(){unarchiveCat(cid);};})(cat.id);
    }else{
      archBtn.textContent='Archive';
      archBtn.style.cssText+=';background:var(--amber-bg);color:var(--amber);border-color:var(--amber)';
      archBtn.onclick=(function(cid){return function(){archiveCat(cid);};})(cat.id);
    }
    /* Archive info */
    var archInfo=document.createElement('span');
    archInfo.style.cssText='font-size:10px;color:var(--text3);white-space:nowrap';
    if(isArchived&&cat.archivedDate)archInfo.textContent='since '+cat.archivedDate;
    row.appendChild(dot);row.appendChild(nameInp);row.appendChild(colorBadge);
    if(cat.archivedDate)row.appendChild(archInfo);
    row.appendChild(archBtn);
    el.appendChild(row);
  });
  /* Hide the old "Add Category" button — fixed 5 cats */
  var addBtn=document.getElementById('cat-add-btn');
  if(addBtn)addBtn.style.display='none';
}

/* Render dynamic categories in daily panel */
function renderDailyPanel(){
  ensureCategories();
  var cont=document.getElementById('daily-cats-container');
  if(!cont)return;
  cont.innerHTML='';
  var isPast=!isToday();
  var showAdd=!isPast||isEditingPastDay;
  var viewKey=fmtDateKey(viewingDate);
  /* Only show cats that are visible on the viewing date */
  var visibleCats=S.taskCategories.filter(function(cat){return catVisibleOnDate(cat,viewKey);});
  visibleCats.forEach(function(cat,catIdx){
    var sec=document.createElement('div');
    sec.className='sec';
    var isFirstCat=(catIdx===0);
    sec.innerHTML='<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+cat.color+';margin-right:6px;vertical-align:middle"></span>'+
      esc(cat.name)+(isFirstCat?' <span style="color:'+cat.color+';font-size:9px;font-weight:400;text-transform:none;letter-spacing:0">NON-NEGOTIABLE</span>':'');
    cont.appendChild(sec);
    var listDiv=document.createElement('div');listDiv.className='card';listDiv.id='cat-list-'+cat.id;
    cont.appendChild(listDiv);
    var addBtn=document.createElement('button');
    addBtn.className='btn btn-sm';addBtn.style.marginBottom='16px';
    addBtn.textContent='+ Add task';
    addBtn.id='add-btn-'+cat.id;
    addBtn.style.display=showAdd?'block':'none';
    addBtn.onclick=(function(cid){return function(){openAddTaskCat(cid);};})(cat.id);
    cont.appendChild(addBtn);
  });
  renderDynamicTasks();
}
function renderDynamicTasks(){
  ensureCategories();
  var isPast=viewingDate.getTime()<TODAY.getTime();
  var isTom=isTomorrow();
  var canInteract=(!isPast&&!isTom)||isEditingPastDay||isTom;
  var viewKey=fmtDateKey(viewingDate);
  var visibleCats=S.taskCategories.filter(function(cat){return catVisibleOnDate(cat,viewKey);});
  /* Ensure tomorrowTasks store exists */
  if(!S.tomorrowTasks)S.tomorrowTasks={};
  /* Update add button visibility */
  visibleCats.forEach(function(cat){
    var addB=document.getElementById('add-btn-'+cat.id);
    if(addB)addB.style.display=canInteract?'block':'none';
  });
  visibleCats.forEach(function(cat){
    var el=document.getElementById('cat-list-'+cat.id);if(!el)return;
    el.innerHTML='';
    var tasks;
    if(isTom){
      if(!S.tomorrowTasks[cat.id])S.tomorrowTasks[cat.id]=[];
      tasks=S.tomorrowTasks[cat.id];
    }else if(isPast){
      var hist=getPastDayDataForCat(cat.id);
      tasks=hist||[];
    }else{
      tasks=S.tasks[cat.id]||[];
    }
    if(tasks.length===0){
      el.innerHTML='<div class="empty">'+(canInteract?'No tasks yet. Add below.':'No data for this day.')+'</div>';
      return;
    }
    tasks.forEach(function(t,ti){
      var row=document.createElement('div');row.className='task-row';
      var chk=document.createElement('div');chk.className='chk'+(t.done?' on':'');
      if(canInteract){
        chk.onclick=(function(cid,tid,ip,itom){return function(){
          if(itom){
            if(!S.tomorrowTasks[cid])return;
            var task=S.tomorrowTasks[cid].find(function(x){return x.id===tid;});
            if(task){task.done=!task.done;saveState();renderDynamicTasks();}
          }else if(ip){
            if(!isEditingPastDay)return;
            var key=fmtDateKey(viewingDate);
            var hist=S.dayHistory[key];
            if(hist&&hist[cid]){
              var task2=hist[cid].find(function(x){return x.id===tid;});
              if(task2){task2.done=!task2.done;saveState();renderDynamicTasks();}
            }
          }else{
            var arr=S.tasks[cid];var task3=arr?arr.find(function(x){return x.id===tid;}):null;
            if(task3){task3.done=!task3.done;saveState();renderDynamicTasks();}
          }
        };})(cat.id,t.id,isPast,isTom);
      }else{chk.style.cursor='default';}
      var inp=document.createElement('input');inp.type='text';inp.className='task-txt'+(t.done?' done':'');
      inp.value=t.text;inp.style.flex='1';
      if(canInteract){
        inp.onblur=(function(cid,tid,inp_,ip,itom){return function(){
          if(itom){
            if(!S.tomorrowTasks[cid])return;
            var task=S.tomorrowTasks[cid].find(function(x){return x.id===tid;});
            if(task&&inp_.value.trim()){task.text=inp_.value.trim();saveState();}
          }else if(ip){
            var key=fmtDateKey(viewingDate);
            var hist=S.dayHistory[key];
            if(hist&&hist[cid]){var task2=hist[cid].find(function(x){return x.id===tid;});if(task2&&inp_.value.trim()){task2.text=inp_.value.trim();saveState();}}
          }else{
            var arr=S.tasks[cid];var task3=arr?arr.find(function(x){return x.id===tid;}):null;
            if(task3&&inp_.value.trim()){task3.text=inp_.value.trim();saveState();}
          }
        };})(cat.id,t.id,inp,isPast,isTom);
      }else{inp.readOnly=true;}
      var bdg=document.createElement('span');bdg.className='bdg';
      bdg.style.cssText='background:'+cat.color+'22;color:'+cat.color+';border-radius:99px;font-size:10px;padding:2px 8px;font-weight:600';
      bdg.textContent=cat.name;
      row.appendChild(chk);row.appendChild(inp);row.appendChild(bdg);
      if(canInteract){
        var del=document.createElement('button');del.className='del-btn';del.textContent='×';
        del.onclick=(function(cid,tid,ip,itom){return function(){
          if(itom){
            if(S.tomorrowTasks[cid])S.tomorrowTasks[cid]=S.tomorrowTasks[cid].filter(function(x){return x.id!==tid;});
            saveState();renderDynamicTasks();
          }else if(ip){
            var key=fmtDateKey(viewingDate);
            var hist=S.dayHistory[key];
            if(hist&&hist[cid]){hist[cid]=hist[cid].filter(function(x){return x.id!==tid;});saveState();renderDynamicTasks();}
          }else{
            S.tasks[cid]=S.tasks[cid].filter(function(x){return x.id!==tid;});saveState();renderDynamicTasks();
          }
        };})(cat.id,t.id,isPast,isTom);
        row.appendChild(del);
      }
      el.appendChild(row);
    });
  });
  updateDailyMetrics();
  renderRevDailyReminders();
}

/* Get past day tasks for a specific category id */
function getPastDayDataForCat(catId){
  var key=fmtDateKey(viewingDate);
  var hist=S.dayHistory[key];
  if(hist&&hist[catId])return hist[catId];
  return null;
}
function updateDailyMetrics(){
  ensureCategories();
  var isPast=!isToday();
  var viewKey=fmtDateKey(viewingDate);
  var visibleCats=S.taskCategories.filter(function(cat){return catVisibleOnDate(cat,viewKey);});
  var allTasks=[],firstCatTasks=[];
  visibleCats.forEach(function(cat,i){
    var tasks;
    if(isPast){tasks=getPastDayDataForCat(cat.id)||[];}
    else{tasks=S.tasks[cat.id]||[];}
    allTasks=allTasks.concat(tasks);
    if(i===0)firstCatTasks=tasks;
  });
  var done=allTasks.filter(function(t){return t.done;}).length;
  var total=allTasks.length;
  var coreDone=firstCatTasks.filter(function(t){return t.done;}).length;
  var pct=total>0?Math.round(done/total*100):0;
  var ds=document.getElementById('d-score');if(ds)ds.textContent=done;
  var dc=document.getElementById('d-core');if(dc)dc.textContent=coreDone+'/'+(firstCatTasks.length||0);
  var dp=document.getElementById('d-pct');if(dp)dp.textContent=pct+'%';
  var dt=document.getElementById('d-total');if(dt)dt.textContent=total;
  var pb=document.getElementById('d-pbar');if(pb)pb.style.width=pct+'%';
  var pl=document.getElementById('d-pbar-lbl');if(pl)pl.textContent=done+' of '+total+' done';
  var al=document.getElementById('d-alert');if(!al)return;
  if(isPast){al.innerHTML='';return;}
  var fc=visibleCats[0];
  var todayFirstTasks=fc?S.tasks[fc.id]||[]:[];
  var allCoreD=todayFirstTasks.length>0&&todayFirstTasks.every(function(t){return t.done;});
  var somePending=todayFirstTasks.some(function(t){return !t.done;})&&done>0;
  var fn=fc?esc(fc.name):'Core';
  if(allCoreD&&pct===100)al.innerHTML='<div class="alert alert-ok">Perfect day. All tasks done.</div>';
  else if(allCoreD)al.innerHTML='<div class="alert alert-ok">All '+fn+' tasks done. Bonus is extra.</div>';
  else if(somePending)al.innerHTML='<div class="alert alert-warn">'+fn+' task pending. Finish core before bonus.</div>';
  else al.innerHTML='';
}
var _addTaskCatId='';
function openAddTaskCat(catId){
  _addTaskCatId=catId;
  var cat=S.taskCategories.find(function(c){return c.id===catId;});
  var modal=document.getElementById('modal-task');
  var title=document.getElementById('modal-task-title');
  if(title&&cat)title.textContent='Add '+cat.name+' task';
  var inp=document.getElementById('modal-task-input');if(inp)inp.value='';
  if(modal)modal.classList.add('open');
  setTimeout(function(){var i=document.getElementById('modal-task-input');if(i)i.focus();},80);
}
/* Override confirmAddTask to use dynamic categories */
function confirmAddTask(){
  var txt=document.getElementById('modal-task-input').value.trim();if(!txt)return;
  if(!_addTaskCatId&&addTaskType){_addTaskCatId=addTaskType;}
  if(!_addTaskCatId)_addTaskCatId=(S.taskCategories&&S.taskCategories[0])?S.taskCategories[0].id:'cat_core';
  var itom=isTomorrow();
  var isPastDay=viewingDate.getTime()<TODAY.getTime();
  if(itom){
    /* Save to tomorrow planning storage */
    if(!S.tomorrowTasks)S.tomorrowTasks={};
    if(!Array.isArray(S.tomorrowTasks[_addTaskCatId]))S.tomorrowTasks[_addTaskCatId]=[];
    S.tomorrowTasks[_addTaskCatId].push({id:uid(),text:txt,done:false});
  }else if(isPastDay&&isEditingPastDay){
    var key=fmtDateKey(viewingDate);
    if(!S.dayHistory[key])S.dayHistory[key]={};
    if(!Array.isArray(S.dayHistory[key][_addTaskCatId]))S.dayHistory[key][_addTaskCatId]=[];
    S.dayHistory[key][_addTaskCatId].push({id:uid(),text:txt,done:false});
  }else if(!isPastDay&&!itom){
    if(!S.tasks[_addTaskCatId])S.tasks[_addTaskCatId]=[];
    S.tasks[_addTaskCatId].push({id:uid(),text:txt,done:false});
  }
  saveState();renderDynamicTasks();
  closeModal('modal-task');
}

/* ── GRADIENT PROGRESS BARS ── */
function gradBar(pct){
  var p=Math.max(0,Math.min(100,pct||0));
  if(p<25)return'linear-gradient(90deg,#ee2222,#ff6600)';
  if(p<50)return'linear-gradient(90deg,#ff6600,#ffbb00)';
  if(p<75)return'linear-gradient(90deg,#ffbb00,#aacc00)';
  return'linear-gradient(90deg,#88cc00,#00bb55)';
}
function applyGradBars(){
  document.querySelectorAll('.pbar,.hgp-goal-bar-fill,.hgp-year-bar-fill,.dl-pbfill').forEach(function(el){
    el.style.background=gradBar(parseFloat(el.style.width)||0);
  });
}

/* ── GOALS ── */
function ensureGoals(){
  if(!S.goals){
    S.goals=[
      {id:uid(),name:'12th 95%+',color:'#4a8fff',tree:[]},
      {id:uid(),name:'Python Advanced',color:'#3fcf8e',tree:[]},
      {id:uid(),name:'70 kg Lean Bulk',color:'#f5a623',tree:[]},
      {id:uid(),name:'Polaris Entrance',color:'#a78bfa',tree:[]}
    ];
    saveState();
  }
}
function nodeProgress(n){
  if(!n.children||n.children.length===0)return n.done?100:0;
  return Math.round(n.children.reduce(function(a,c){return a+nodeProgress(c);},0)/n.children.length);
}
function goalProgress(g){
  if(!g.tree||g.tree.length===0)return 0;
  return Math.round(g.tree.reduce(function(a,n){return a+nodeProgress(n);},0)/g.tree.length);
}
function yearlyProgress(){
  if(!S.goals||!S.goals.length)return 0;
  return Math.round(S.goals.reduce(function(a,g){return a+goalProgress(g);},0)/S.goals.length);
}
function makeNode(label){return{id:uid(),label:label,done:false,children:[],collapsed:false};}

/* Goals panel */
var goalsPanelOpen=false;
function toggleGoalsPanel(){
  goalsPanelOpen=!goalsPanelOpen;
  var panel=document.getElementById('goals-panel');
  var trigger=document.getElementById('goals-trigger');
  if(panel)panel.classList.toggle('open',goalsPanelOpen);
  if(trigger)trigger.textContent=goalsPanelOpen?'Goals ‹':'Goals ›';
  if(goalsPanelOpen){
    /* Pre-populate instantly if already rendered, then refresh after slide */
    renderGoalsPanel();
  }
}
function renderGoalsPanel(){
  ensureGoals();
  var yp=yearlyProgress();
  var yEl=document.getElementById('hgp-year-pct');
  var yfEl=document.getElementById('hgp-year-fill');
  if(yEl)yEl.textContent=yp+'%';
  if(yfEl){yfEl.style.width=yp+'%';yfEl.style.background=gradBar(yp);}
  var list=document.getElementById('hgp-goals-list');if(!list)return;
  list.innerHTML='';
  S.goals.forEach(function(g){
    var pct=goalProgress(g);
    var div=document.createElement('div');div.className='hgp-goal-item';
    div.style.cssText='border:1px solid '+g.color+'40;background:'+g.color+'0d;border-radius:10px;padding:12px;margin-bottom:10px';
    div.innerHTML='<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
      '<span style="font-size:13px;font-weight:600;color:var(--text)">'+esc(g.name)+'</span>'+
      '<span style="font-size:12px;font-family:DM Mono,monospace;color:'+g.color+'">'+pct+'%</span></div>'+
      '<div style="height:5px;background:var(--border);border-radius:99px">'+
      '<div style="height:5px;border-radius:99px;width:'+pct+'%;background:'+gradBar(pct)+';transition:width .5s"></div></div>';
    list.appendChild(div);
  });
}

/* Goal DB */
var gdbGoalId=null;var gdbPath=[];
function renderGoalDB(){
  ensureGoals();
  var cont=document.getElementById('goaldb-content');if(!cont)return;
  if(gdbGoalId===null){
    var html='';
    if(!S.goals.length)html='<div class="empty">No goals yet. Add in Settings → Goals.</div>';
    S.goals.forEach(function(g){
      var pct=goalProgress(g);
      var col=g.color||'var(--accent)';
      var doneCount=(function ct(arr){return arr.reduce(function(a,n){return a+(n.done?1:0)+(n.children?ct(n.children):0);},0);})(g.tree);
      var totalCount=(function ct(arr){return arr.reduce(function(a,n){return a+1+(n.children?ct(n.children):0);},0);})(g.tree);
      var barCol=gradBar(pct);
      var arcR=22,arcC=28,arcStroke=5;
      var arcCircum=Math.PI*arcR; /* half circumference */
      var arcFill=(pct/100)*arcCircum;
      html+=
        '<div class="gdb-goal-section" style="border-color:'+col+'30;cursor:pointer" ondblclick="gdbOpenGoal(\''+g.id+'\')">'+
          '<div class="gdb-section-header" style="background:'+col+'08;padding:16px 18px;gap:14px;align-items:center">'+
            /* Half-arc gauge */
            '<div style="width:56px;height:34px;flex-shrink:0;position:relative">'+
              '<svg width="56" height="34" viewBox="0 0 56 34" style="display:block">'+
                /* Track arc */
                '<path d="M 6,28 A 22,22 0 0,1 50,28" fill="none" stroke="'+col+'22" stroke-width="'+arcStroke+'" stroke-linecap="round"/>'+
                /* Fill arc */
                '<path d="M 6,28 A 22,22 0 0,1 50,28" fill="none" stroke="'+col+'" stroke-width="'+arcStroke+'" stroke-linecap="round"'+
                  ' stroke-dasharray="'+arcFill.toFixed(1)+' '+arcCircum.toFixed(1)+'"/>'+
              '</svg>'+
              '<div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:13px;font-weight:800;font-family:\'DM Mono\',monospace;color:'+col+';line-height:1">'+pct+'%</div>'+
            '</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(g.name)+'</div>'+
              '<div style="height:4px;background:var(--border);border-radius:99px;overflow:hidden;margin-bottom:4px">'+
                '<div style="height:4px;background:'+barCol+';width:'+pct+'%;border-radius:99px;transition:width .5s"></div>'+
              '</div>'+
              '<div style="font-size:11px;color:var(--text3)">'+doneCount+' / '+totalCount+' items done · double-click to open</div>'+
            '</div>'+
          '</div>'+
        '</div>';
    });
    cont.innerHTML=html;
    return;
  }
  renderGDBGoal(cont);
}
function gdbOpenGoal(gid){gdbGoalId=gid;gdbPath=[];renderGoalDB();}
function renderGDBGoal(cont){
  var goal=S.goals.find(function(g){return g.id===gdbGoalId;});
  if(!goal){gdbGoalId=null;renderGoalDB();return;}
  var nodes=goal.tree;
  for(var pi=0;pi<gdbPath.length;pi++){
    var f=nodes.find(function(n){return n.id===gdbPath[pi].id;});
    if(f)nodes=f.children;else{gdbPath=gdbPath.slice(0,pi);break;}
  }
  var levelPct=nodes.length?Math.round(nodes.reduce(function(a,n){return a+nodeProgress(n);},0)/nodes.length):0;
  var crumbs='<span class="gdb-breadcrumb-item" onclick="gdbGoalId=null;gdbPath=[];renderGoalDB()">All Goals</span>'+
    '<span class="gdb-breadcrumb-sep">›</span>'+
    '<span class="gdb-breadcrumb-item" onclick="gdbPath=[];renderGoalDB()">'+esc(goal.name)+'</span>';
  gdbPath.forEach(function(p,pi){
    crumbs+='<span class="gdb-breadcrumb-sep">›</span>';
    if(pi<gdbPath.length-1)crumbs+='<span class="gdb-breadcrumb-item" onclick="gdbPath=gdbPath.slice(0,'+(pi+1)+');renderGoalDB()">'+esc(p.label)+'</span>';
    else crumbs+='<span style="color:var(--text2)">'+esc(p.label)+'</span>';
  });
  var col=goal.color||'var(--accent)';
  var html='<div class="gdb-breadcrumb">'+crumbs+'</div>';
  var dArcR=24,dArcCircum=Math.PI*dArcR,dArcFill=(levelPct/100)*dArcCircum;
  /* Goal detail header card */
  html+='<div style="background:'+col+'08;border:1px solid '+col+'30;border-radius:14px;padding:16px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px">'+
    '<div style="width:62px;height:38px;flex-shrink:0;position:relative">'+
      '<svg width="62" height="38" viewBox="0 0 62 38" style="display:block">'+
        '<path d="M 7,31 A 24,24 0 0,1 55,31" fill="none" stroke="'+col+'22" stroke-width="5.5" stroke-linecap="round"/>'+
        '<path d="M 7,31 A 24,24 0 0,1 55,31" fill="none" stroke="'+col+'" stroke-width="5.5" stroke-linecap="round"'+
          ' stroke-dasharray="'+dArcFill.toFixed(1)+' '+dArcCircum.toFixed(1)+'"/>'+
      '</svg>'+
      '<div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:14px;font-weight:800;font-family:\'DM Mono\',monospace;color:'+col+';line-height:1">'+levelPct+'%</div>'+
    '</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:2px">'+esc(goal.name)+'</div>'+
      '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">'+(gdbPath.length?esc(gdbPath[gdbPath.length-1].label)+' level':'Top level')+'</div>'+
      '<div style="height:4px;background:var(--border);border-radius:99px;overflow:hidden">'+
        '<div style="height:4px;background:'+gradBar(levelPct)+';width:'+levelPct+'%;border-radius:99px;transition:width .5s"></div>'+
      '</div>'+
    '</div>'+
  '</div>';
  html+='<div style="display:flex;gap:6px;margin-bottom:14px">'+
    '<input id="gdb-new-label" class="gdb-add-input" placeholder="Add item here..." style="flex:1" onkeydown="if(event.key===\'Enter\')gdbAddNode()">'+
    '<button class="gdb-add-confirm" onclick="gdbAddNode()">+ Add</button></div>';
  html+='<div id="gdb-nodes-list">';
  nodes.forEach(function(n,ni){html+=renderGDBNode(n,ni,goal.color,nodes,0);});
  html+='</div>';
  cont.innerHTML=html;
}
function renderGDBNode(n,ni,color,siblings,depth){
  var pct=nodeProgress(n);
  var hasChildren=n.children&&n.children.length>0;
  var isCollapsed=n.collapsed===true;
  var tickCls=n.done?'on':hasChildren&&pct>0&&pct<100?'partial':'';
  var indent=(depth*20)+'px';
  var childIndent=((depth+1)*20)+'px';
  /* Full-row dblclick: drill in if has children; otherwise rename */
  var rowDbl=hasChildren
    ?'gdbDrillIn(\''+n.id+'\',\''+n.label.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')' 
    :'gdbEdit(\''+n.id+'\')';
  var html='<div style="padding-left:'+indent+'">';
  /* Row: ondblclick on WHOLE row = drill/rename */
  html+='<div class="gdb-node" ondblclick="'+rowDbl+'" style="cursor:pointer;border-radius:var(--rs)">';
  /* Collapse btn */
  if(hasChildren){
    html+='<span onclick="gdbCollapse(\''+n.id+'\');event.stopPropagation()" style="cursor:pointer;font-size:13px;display:inline-block;transform:rotate('+(isCollapsed?'-90':'0')+'deg);transition:transform .15s;user-select:none;margin-right:2px;color:var(--text2)">▾</span>';
  }else{
    html+='<span style="display:inline-block;width:18px"></span>';
  }
  /* Tick */
  html+='<div class="gdb-node-tick '+tickCls+'" onclick="gdbTick(\''+n.id+'\');event.stopPropagation()" title="Toggle done"></div>';
  /* Label — dblclick on text = rename only (stopPropagation prevents row drill) */
  html+='<div class="gdb-node-indent" style="flex:1;flex-direction:column">';
  html+='<div style="display:flex;align-items:center;gap:6px">'+
    '<span class="gdb-node-label'+(n.done?' done':'')+'" id="gdb-lbl-'+n.id+'" ondblclick="gdbEdit(\''+n.id+'\');event.stopPropagation()" title="Double-click to rename">'+esc(n.label)+'</span>';
  if(hasChildren)html+='<span class="gdb-node-pct">'+pct+'%</span>';
  html+='</div>';
  if(hasChildren)html+='<div class="gdb-node-pbar"><div class="gdb-node-pbar-fill" style="width:'+pct+'%;background:'+gradBar(pct)+'"></div></div>';
  html+='</div>';
  /* Buttons */
  html+='<div class="gdb-node-btns">'+
    '<button class="gdb-btn" onclick="gdbAddChild(\''+n.id+'\');event.stopPropagation()" title="Add child" style="font-size:15px;font-weight:700">+</button>'+
    '<button class="gdb-btn" onclick="gdbDel(\''+n.id+'\');event.stopPropagation()" title="Delete" style="color:var(--red);font-size:15px">−</button>'+
    '</div>';
  html+='</div>';
  if(hasChildren&&!isCollapsed){
    n.children.forEach(function(c,ci){html+=renderGDBNode(c,ci,color,n.children,depth+1);});
  }
  /* Inline add row */
  html+='<div id="gdb-add-'+n.id+'" style="display:none;padding-left:'+childIndent+'">'+
    '<input id="gdb-inp-'+n.id+'" class="gdb-add-input" placeholder="New item..." '+
    'onkeydown="if(event.key===\'Enter\')gdbChildConfirm(\''+n.id+'\');if(event.key===\'Escape\')gdbHideAdd(\''+n.id+'\')">'+
    '<button class="gdb-add-confirm" onclick="gdbChildConfirm(\''+n.id+'\')">✓</button>'+
    '<button class="gdb-add-cancel" onclick="gdbHideAdd(\''+n.id+'\')">✕</button></div>';
  html+='</div>';
  return html;
}
function gdbFindNodes(){
  var goal=S.goals.find(function(g){return g.id===gdbGoalId;});
  if(!goal)return null;
  var nodes=goal.tree;
  for(var i=0;i<gdbPath.length;i++){var f=nodes.find(function(n){return n.id===gdbPath[i].id;});if(f)nodes=f.children;else break;}
  return{goal:goal,nodes:nodes};
}
function gdbAddNode(){
  var inp=document.getElementById('gdb-new-label');if(!inp||!inp.value.trim())return;
  var r=gdbFindNodes();if(!r)return;
  r.nodes.push(makeNode(inp.value.trim()));inp.value='';saveState();renderGoalDB();renderGoalsPanel();
}
function gdbTick(nid){
  function snap(arr,s){arr.forEach(function(n){s[n.id]=n.done;if(n.children)snap(n.children,s);});}
  function markAll(arr,v){arr.forEach(function(n){n.done=v;if(n.children)markAll(n.children,v);});}
  function restoreSnap(arr,s){arr.forEach(function(n){if(n.id in s)n.done=s[n.id];if(n.children)restoreSnap(n.children,s);});}
  function toggle(arr){
    for(var i=0;i<arr.length;i++){
      if(arr[i].id===nid){
        var was=arr[i].done;arr[i].done=!was;
        if(arr[i].children&&arr[i].children.length){
          if(!was){var s={};snap(arr[i].children,s);arr[i]._s=s;markAll(arr[i].children,true);}
          else{if(arr[i]._s)restoreSnap(arr[i].children,arr[i]._s);else markAll(arr[i].children,false);delete arr[i]._s;}
        }
        return true;
      }
      if(arr[i].children&&toggle(arr[i].children))return true;
    }
    return false;
  }
  var goal=S.goals.find(function(g){return g.id===gdbGoalId;});
  if(goal){toggle(goal.tree);saveState();renderGoalDB();renderGoalsPanel();}
}
function gdbCollapse(nid){
  function tog(arr){for(var i=0;i<arr.length;i++){if(arr[i].id===nid){arr[i].collapsed=!arr[i].collapsed;return true;}if(arr[i].children&&tog(arr[i].children))return true;}return false;}
  var goal=S.goals.find(function(g){return g.id===gdbGoalId;});
  if(goal){tog(goal.tree);saveState();renderGoalDB();}
}
function gdbDrillIn(nid,label){gdbPath.push({id:nid,label:label});renderGoalDB();}
function gdbAddChild(nid){
  var row=document.getElementById('gdb-add-'+nid);
  if(row){row.style.display='flex';var i=document.getElementById('gdb-inp-'+nid);if(i)i.focus();}
}
function gdbHideAdd(nid){var r=document.getElementById('gdb-add-'+nid);if(r)r.style.display='none';}
function gdbChildConfirm(nid){
  var inp=document.getElementById('gdb-inp-'+nid);if(!inp||!inp.value.trim())return;
  var txt=inp.value.trim();
  function add(arr){for(var i=0;i<arr.length;i++){if(arr[i].id===nid){if(!arr[i].children)arr[i].children=[];arr[i].children.push(makeNode(txt));return true;}if(arr[i].children&&add(arr[i].children))return true;}return false;}
  var goal=S.goals.find(function(g){return g.id===gdbGoalId;});
  if(goal){add(goal.tree);saveState();renderGoalDB();renderGoalsPanel();}
}
function gdbDel(nid){
  if(!confirm('Delete this item and all children?'))return;
  function del(arr){for(var i=0;i<arr.length;i++){if(arr[i].id===nid){arr.splice(i,1);return true;}if(arr[i].children&&del(arr[i].children))return true;}return false;}
  var goal=S.goals.find(function(g){return g.id===gdbGoalId;});
  if(goal){del(goal.tree);saveState();renderGoalDB();renderGoalsPanel();}
}
function gdbEdit(nid){
  var el=document.getElementById('gdb-lbl-'+nid);if(!el)return;
  el.contentEditable='true';el.focus();
  var r=document.createRange();r.selectNodeContents(el);var s=window.getSelection();s.removeAllRanges();s.addRange(r);
  function done(){
    el.contentEditable='false';
    var txt=el.textContent.trim();if(!txt)return;
    function upd(arr){for(var i=0;i<arr.length;i++){if(arr[i].id===nid){arr[i].label=txt;return;}if(arr[i].children)upd(arr[i].children);}}
    var goal=S.goals.find(function(g){return g.id===gdbGoalId;});if(goal)upd(goal.tree);
    saveState();renderGoalsPanel();
  }
  el.onblur=done;
  el.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();el.blur();}};
}
/* ══════════════════════════════════════════════════════
   GLOBAL KEYBOARD SHORTCUTS
   Natural keys where they make sense — no overrides on typing fields
══════════════════════════════════════════════════════ */
document.addEventListener('keydown',function(e){
  /* Spacebar: play/pause pomodoro timer (only when not typing) */
  if(e.key===' '&&!e.target.matches('input,textarea,[contenteditable]')){
    var pomPanel=document.getElementById('panel-focus');
    if(pomPanel&&pomPanel.classList.contains('active')){
      e.preventDefault();
      pomToggle();
      return;
    }
  }
  /* Never fire when user is typing in an input/textarea/contenteditable */
  var tag=e.target.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable) return;
  /* Never fire when a modal is open */
  if(document.querySelector('.modal-bg.open,.modal-bg[style*="flex"]')) return;

  var key=e.key;

  /* ── GLOBAL ── */
  /* Escape → close sidebar if open */
  if(key==='Escape'){
    if(sbVisible){hideSidebar();e.preventDefault();return;}
  }

  /* ── Detect active panel ── */
  var activePanel=null;
  document.querySelectorAll('.panel.active').forEach(function(p){activePanel=p.id;});
  var homeVisible=!document.getElementById('home').classList.contains('hidden');

  /* ── HOME SCREEN ── */
  if(homeVisible){
    if(key==='Enter'||key===' '){enterApp();e.preventDefault();return;}
    return;
  }

  /* ── DAILY PANEL (panel-daily) ── */
  if(activePanel==='panel-daily'){
    if(key==='ArrowLeft'||key==='ArrowUp'){navDate(-1);e.preventDefault();return;}
    if(key==='ArrowRight'||key==='ArrowDown'){navDate(1);e.preventDefault();return;}
    if(key==='t'||key==='T'||key==='Home'){jumpToToday();e.preventDefault();return;}
    /* Page up/down scroll */
    if(key==='PageUp'){document.getElementById('main').scrollBy({top:-300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='PageDown'){document.getElementById('main').scrollBy({top:300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='End'){document.getElementById('main').scrollTo({top:99999,behavior:'smooth'});e.preventDefault();return;}
    if((key==='Home')&&!e.metaKey&&!e.ctrlKey){document.getElementById('main').scrollTo({top:0,behavior:'smooth'});e.preventDefault();return;}
    return;
  }

  /* ── TT VIEW (panel-ttview) ── */
  if(activePanel==='panel-ttview'){
    if(key==='ArrowLeft'){ttNavDate(-1);e.preventDefault();return;}
    if(key==='ArrowRight'){ttNavDate(1);e.preventDefault();return;}
    if(key==='t'||key==='T'){ttGoToToday();e.preventDefault();return;}
    if(key==='p'||key==='P'){ttPrintSection1();e.preventDefault();return;}
    /* Scroll timeline */
    var tscroll=document.getElementById('tt-timeline-scroll');
    if(tscroll){
      if(key==='ArrowUp'){tscroll.scrollBy({top:-120,behavior:'smooth'});e.preventDefault();return;}
      if(key==='ArrowDown'){tscroll.scrollBy({top:120,behavior:'smooth'});e.preventDefault();return;}
      if(key==='PageUp'){tscroll.scrollBy({top:-360,behavior:'smooth'});e.preventDefault();return;}
      if(key==='PageDown'){tscroll.scrollBy({top:360,behavior:'smooth'});e.preventDefault();return;}
      if(key==='Home'){tscroll.scrollTo({top:0,behavior:'smooth'});e.preventDefault();return;}
      if(key==='End'){tscroll.scrollTo({top:99999,behavior:'smooth'});e.preventDefault();return;}
    }
    return;
  }

  /* ── WEEKLY DB (panel-weekly) ── */
  if(activePanel==='panel-weekly'){
    if(key==='ArrowLeft'){
      if(activeWeekIdx<S.weeks.length-1){activeWeekIdx++;weekTabsScrollX=0;renderWeekly();}
      e.preventDefault();return;
    }
    if(key==='ArrowRight'){
      if(activeWeekIdx>0){activeWeekIdx--;weekTabsScrollX=0;renderWeekly();}
      e.preventDefault();return;
    }
    if(key==='PageUp'){document.getElementById('main').scrollBy({top:-300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='PageDown'){document.getElementById('main').scrollBy({top:300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='Home'){document.getElementById('main').scrollTo({top:0,behavior:'smooth'});e.preventDefault();return;}
    if(key==='End'){document.getElementById('main').scrollTo({top:99999,behavior:'smooth'});e.preventDefault();return;}
    return;
  }

  /* ── MONTHLY DB (panel-monthly) ── */
  if(activePanel==='panel-monthly'){
    if(key==='PageUp'){document.getElementById('main').scrollBy({top:-300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='PageDown'){document.getElementById('main').scrollBy({top:300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='Escape'){activeMonthName=null;renderMonthly();e.preventDefault();return;}
    return;
  }

  /* ── REVISION OS (panel-revos) ── */
  if(activePanel==='panel-revos'){
    /* Tab switching: 1/2/3 keys */
    if(key==='1'){revShowTab('items');e.preventDefault();return;}
    if(key==='2'){revShowTab('week');e.preventDefault();return;}
    if(key==='3'){revShowTab('month');e.preventDefault();return;}
    /* Week navigation when in week tab */
    if(revCurrentTab==='week'){
      if(key==='ArrowLeft'){revWeekNav(-1);e.preventDefault();return;}
      if(key==='ArrowRight'){revWeekNav(1);e.preventDefault();return;}
      if(key==='t'||key==='T'){revWeekOffset=0;renderRevWeek();e.preventDefault();return;}
    }
    /* Month navigation when in month tab */
    if(revCurrentTab==='month'){
      if(key==='ArrowLeft'){revMonthNav(-1);e.preventDefault();return;}
      if(key==='ArrowRight'){revMonthNav(1);e.preventDefault();return;}
      if(key==='t'||key==='T'){revMonthOffset=0;renderRevMonth();e.preventDefault();return;}
    }
    /* Scroll within items */
    var ritems=document.getElementById('rev-view-items');
    if(ritems&&revCurrentTab==='items'){
      if(key==='PageUp'){ritems.scrollBy({top:-300,behavior:'smooth'});e.preventDefault();return;}
      if(key==='PageDown'){ritems.scrollBy({top:300,behavior:'smooth'});e.preventDefault();return;}
      if(key==='Home'){ritems.scrollTo({top:0,behavior:'smooth'});e.preventDefault();return;}
      if(key==='End'){ritems.scrollTo({top:99999,behavior:'smooth'});e.preventDefault();return;}
    }
    if(key==='n'||key==='N'){revOpenAdd();e.preventDefault();return;}
    return;
  }

  /* ── GOAL DB (panel-goaldb) ── */
  if(activePanel==='panel-goaldb'){
    if(key==='Escape'||key==='Backspace'){
      e.preventDefault();
      if(gdbPath.length>0){gdbPath.pop();renderGoalDB();}
      else if(gdbGoalId!==null){gdbGoalId=null;renderGoalDB();}
      return;
    }
    if(key==='PageUp'){document.getElementById('main').scrollBy({top:-300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='PageDown'){document.getElementById('main').scrollBy({top:300,behavior:'smooth'});e.preventDefault();return;}
    return;
  }

  /* ── DEADLINES (panel-deadlines) ── */
  if(activePanel==='panel-deadlines'){
    if(key==='PageUp'){document.getElementById('main').scrollBy({top:-300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='PageDown'){document.getElementById('main').scrollBy({top:300,behavior:'smooth'});e.preventDefault();return;}
    return;
  }

  /* ── DATA VIEW (panel-data) ── */
  if(activePanel==='panel-data'){
    if(key==='PageUp'){document.getElementById('main').scrollBy({top:-300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='PageDown'){document.getElementById('main').scrollBy({top:300,behavior:'smooth'});e.preventDefault();return;}
    if(key==='Home'){document.getElementById('main').scrollTo({top:0,behavior:'smooth'});e.preventDefault();return;}
    if(key==='End'){document.getElementById('main').scrollTo({top:99999,behavior:'smooth'});e.preventDefault();return;}
    return;
  }

  /* ── SIDEBAR NAVIGATION (always, any panel) ── */
  /* Ctrl+1…9 to switch panels */
  if(e.ctrlKey||e.metaKey){
    var panels=['daily','ttview','data','deadlines','times','revos','goaldb','weekly','monthly'];
    var idx=parseInt(key)-1;
    if(idx>=0&&idx<panels.length){
      var panelId=panels[idx];
      var navEl=document.querySelector('[data-panel="'+panelId+'"]');
      sidebarSwitch(panelId,navEl);
      e.preventDefault();
      return;
    }
  }
});

function renderSidebarGoals(){/* sidebar goals removed */}

/* Goal settings */
function renderSettingsGoals(){
  ensureGoals();
  var el=document.getElementById('settings-goals-list');if(!el)return;
  el.innerHTML='';
  if(!S.goals.length){el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:8px 0">No goals yet. Add one below.</div>';return;}
  S.goals.forEach(function(g){
    var row=document.createElement('div');
    row.className='sgoal-row';
    var dot=document.createElement('div');
    dot.className='sgoal-dot';dot.style.background=g.color;
    var nameInp=document.createElement('input');
    nameInp.type='text';nameInp.className='sgoal-name-inp';nameInp.value=g.name;
    nameInp.onblur=(function(gid,inp){return function(){
      var goal=S.goals.find(function(x){return x.id===gid;});
      if(goal&&inp.value.trim()){goal.name=inp.value.trim();saveState();renderGoalDB();renderGoalsPanel();}
    };})(g.id,nameInp);
    var colorRow=document.createElement('div');
    colorRow.style.cssText='display:flex;gap:4px;align-items:center';
    var goalColors=['#4a8fff','#3fcf8e','#f5a623','#a78bfa','#ff5c5c'];
    goalColors.forEach(function(c){
      var sw=document.createElement('div');
      sw.style.cssText='width:16px;height:16px;border-radius:50%;background:'+c+';cursor:pointer;border:2px solid '+(c===g.color?'#fff':'transparent')+';transition:transform .1s';
      sw.title=c;
      sw.onclick=(function(gid,col,d,swEl,allSw){return function(){
        var goal=S.goals.find(function(x){return x.id===gid;});
        if(goal){goal.color=col;d.style.background=col;saveState();renderGoalDB();renderGoalsPanel();}
        /* Update border on all swatches in this row */
        allSw.forEach(function(s){s.style.borderColor=s.title===col?'#fff':'transparent';});
      };})(g.id,c,dot,sw,null);
      colorRow.appendChild(sw);
    });
    /* Back-patch allSw reference */
    var allSwatches=Array.from(colorRow.children);
    Array.from(colorRow.children).forEach(function(sw){
      var origClick=sw.onclick;
      sw.onclick=(function(gid,col,d){return function(){
        var goal=S.goals.find(function(x){return x.id===gid;});
        if(goal){goal.color=col;d.style.background=col;saveState();renderGoalDB();renderGoalsPanel();}
        allSwatches.forEach(function(s){s.style.borderColor=s.title===col?'#fff':'transparent';});
      };})(g.id,sw.title,dot);
    });
    var delBtn=document.createElement('button');
    delBtn.className='sgoal-del';delBtn.textContent='×';delBtn.title='Delete goal';
    delBtn.onclick=(function(gid){return function(){
      if(!confirm('Delete this goal? All Goal DB data for it will be lost.'))return;
      S.goals=S.goals.filter(function(x){return x.id!==gid;});
      saveState();renderSettingsGoals();renderGoalDB();renderGoalsPanel();
    };})(g.id);
    row.appendChild(dot);row.appendChild(nameInp);row.appendChild(colorRow);row.appendChild(delBtn);
    el.appendChild(row);
  });
}

/* ── POMODORO ── */
var pomInitialized=false;

/* ── IMPORT BACKUP ── */
var _origConfirmImport=confirmImport;
confirmImport=function(){
  var fi=document.getElementById('import-file-input');
  if(!fi||!fi.files||!fi.files[0]){alert('Select a JSON file first.');return;}
  var doIt=function(){_origConfirmImport();};
  if(confirm('Before importing, download a backup first?\n\nOK = backup then import\nCancel = import directly')){
    var bk={at:new Date().toISOString(),state:S,settings:CFG};
    var blob=new Blob([JSON.stringify(bk,null,2)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='protocol_backup_'+new Date().toISOString().split('T')[0]+'.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(doIt,400);
  }else doIt();
};

/* ── EXTENDED QUOTES ── */
QUOTES=QUOTES.concat([
  {q:'Excellence is not a destination but a continuous journey.',a:'Brian Tracy'},
  {q:'Do not watch the clock. Do what it does. Keep going.',a:'Sam Levenson'},
  {q:'The difference between ordinary and extraordinary is that little extra.',a:'Jimmy Johnson'},
  {q:'Believe you can and you are halfway there.',a:'Theodore Roosevelt'},
  {q:'Whether you think you can or think you cannot, you are right.',a:'Henry Ford'},
  {q:'It always seems impossible until it is done.',a:'Nelson Mandela'},
  {q:'A person who never made a mistake never tried anything new.',a:'Albert Einstein'},
  {q:'The best time to plant a tree was 20 years ago. The second best time is now.',a:'Chinese Proverb'},
  {q:'In the middle of every difficulty lies opportunity.',a:'Albert Einstein'},
  {q:'Dream big and dare to fail.',a:'Norman Vaughan'},
  {q:'Small daily improvements are the key to staggering long-term results.',a:'Robin Sharma'},
  {q:'Winners never quit and quitters never win.',a:'Vince Lombardi'},
  {q:'I am not a product of my circumstances. I am a product of my decisions.',a:'Stephen Covey'},
  {q:'The only impossible journey is the one you never begin.',a:'Tony Robbins'},
  {q:'Success is not final, failure is not fatal: the courage to continue counts.',a:'Churchill'},
  {q:'All our dreams can come true if we have the courage to pursue them.',a:'Walt Disney'},
  {q:'If you do what you always did, you will get what you always got.',a:'Einstein'},
  {q:'Never let the fear of striking out keep you from playing the game.',a:'Babe Ruth'},
  {q:'Today is your opportunity to build the tomorrow you want.',a:'Ken Poirot'},
  {q:'What you get by achieving goals is not as important as what you become.',a:'Thoreau'},
  {q:'Good things come to people who wait. Better things come to those who go get them.',a:'Anon'},
  {q:'The secret to getting ahead is getting started.',a:'Agatha Christie'},
  {q:'You only live once, but if you do it right, once is enough.',a:'Mae West'},
  {q:'Life is either a daring adventure or nothing at all.',a:'Helen Keller'},
  {q:'Strive not to be a success, but rather to be of value.',a:'Albert Einstein'},
  {q:'You will face many defeats but never let yourself be defeated.',a:'Maya Angelou'}
]);

/* ── DRAG & DROP — Tasks (no text corruption) ── */
var _tdrag=null;
function taskDragStart(e,tp,idx){if(e.target.tagName==='INPUT')return;_tdrag={tp:tp,idx:idx};e.dataTransfer.effectAllowed='move';e.currentTarget.style.opacity='0.5';}
function taskDragEnd(e){e.currentTarget.style.opacity='';_tdrag=null;}
function taskDragOver(e){e.preventDefault();}
function taskDrop(e,tp,toIdx){e.preventDefault();if(!_tdrag||_tdrag.tp!==tp)return;var arr=S.tasks[tp];if(!arr)return;var item=arr.splice(_tdrag.idx,1)[0];arr.splice(toIdx,0,item);_tdrag=null;saveState();renderDynamicTasks();}

/* Deadline drag */
var _ddrag=null;
function dlDragStart(e,id){_ddrag=id;e.dataTransfer.effectAllowed='move';e.currentTarget.style.opacity='0.6';}
function dlDragEnd(e){e.currentTarget.style.opacity='';_ddrag=null;}
function dlDragOver(e){e.preventDefault();}
function dlDrop(e,tid){e.preventDefault();if(!_ddrag||_ddrag===tid)return;var fi=S.deadlines.findIndex(function(d){return d.id===_ddrag;});var ti=S.deadlines.findIndex(function(d){return d.id===tid;});if(fi<0||ti<0)return;var item=S.deadlines.splice(fi,1)[0];S.deadlines.splice(ti,0,item);_ddrag=null;saveState();renderDeadlines();}

/* Data color */
function setDataColor(id,col){var d=S.activeData.find(function(x){return x.id===id;});if(d){d.color=(d.color===col)?'':col;saveState();renderData();}}

/* ── UNIFIED OPEN SETTINGS ── */
function openSettings(){
  document.getElementById('settings-modal').classList.add('open');
  /* Reset to profile tab */
  document.querySelectorAll('.stab').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.stab-panel').forEach(function(p){p.classList.remove('active');});
  var firstTab=document.querySelector('.stab[data-tab="profile"]');
  var firstPanel=document.getElementById('stab-profile');
  if(firstTab)firstTab.classList.add('active');
  if(firstPanel)firstPanel.classList.add('active');
  buildThemeGrid();
  if(typeof buildFontGrid==='function')buildFontGrid();
  var els={
    'setting-username':CFG.username||'',
    'setting-startdate':CFG.startdate||'2026-04-07',
    'setting-pom-focus':String(CFG.pomFocus||25),
    'setting-pom-short':String(CFG.pomShort||5),
    'setting-pom-long':String(CFG.pomLong||15)
  };
  for(var id in els){var el=document.getElementById(id);if(el)el.value=els[id];}
  var t12=document.getElementById('toggle-12hr');if(t12)t12.classList.toggle('on',!!CFG.use12hr);
  var tq=document.getElementById('toggle-quotes');if(tq)tq.classList.toggle('on',CFG.quotes!==false);
  renderSettingsGoals();
  renderCategoriesSettings();
  buildGoalColorSwatches();
}
function closeSettings(){var el=document.getElementById('settings-modal');if(el)el.classList.remove('open');}

/* ── UNIFIED SAVE SETTINGS ── */
function saveSettings(){
  /* User */
  var un=document.getElementById('setting-username');if(un)CFG.username=un.value.trim()||'Dhruv';
  /* Persist the display name to Firebase profile so it survives a refresh.
     updateDisplayName is async — we fire and forget, CFG is already updated above. */
  if(window.ProtocolAuth&&CFG.username){
    var _fbUser=window.ProtocolAuth.currentUser();
    var _fbUname=_fbUser?(_fbUser.username||CFG.username):CFG.username;
    window.ProtocolAuth.updateDisplayName(_fbUname,CFG.username);
  }
  /* Start date */
  var sd=document.getElementById('setting-startdate');if(sd&&sd.value)CFG.startdate=sd.value;
  if(CFG.startdate)START_DATE=parseDate(CFG.startdate);
  /* Pom */
  var pf=document.getElementById('setting-pom-focus');if(pf)CFG.pomFocus=Math.max(5,Math.min(120,parseInt(pf.value)||25));
  var ps=document.getElementById('setting-pom-short');if(ps)CFG.pomShort=Math.max(1,Math.min(30,parseInt(ps.value)||5));
  var pl=document.getElementById('setting-pom-long');if(pl)CFG.pomLong=Math.max(5,Math.min(60,parseInt(pl.value)||15));
  /* Apply */
  var logo=document.getElementById('sb-logo-name');if(logo)logo.textContent=(CFG.sysname||'PROTOCOL').toUpperCase();
  var sub=document.getElementById('sb-logo-sub');if(sub)sub.textContent=(CFG.username||'Dhruv')+' · System';
  /* Always keep the sidebar username (above logout) in sync with the saved name */
  var sidebarName=document.getElementById('sb-user-name');if(sidebarName)sidebarName.textContent=CFG.username||'Dhruv';
  if(typeof applyFont==='function')applyFont(CFG.font||'dmsans');
  saveSettings2();
  /* Update pom timer if not running */
  if(pomInitialized&&!POM.running){
    var d=pomGetDurations();
    POM.secsLeft=POM.totalSecs=(POM.phase==='focus'?d.focus:POM.phase==='short'?d.short:d.long);
    if(typeof pomRender==='function')pomRender();
  }
  updateClock();
  renderDailyPanel();
  renderWeekly();
  renderMonthly();
  closeSettings();
}

/* ── UNIFIED SWITCH PANEL ── */
function sidebarSwitch(id,el){
  var _hh=document.getElementById('home');
  _hh.classList.add('hidden');_hh.classList.remove('visible');
  /* Deactivate all panels and nav items */
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  var panel=document.getElementById('panel-'+id);
  if(panel)panel.classList.add('active');
  if(el)el.classList.add('active');
  /* Panel-specific renders */
  if(id==='goaldb')renderGoalDB();
  if(id==='weekly')renderWeekly();
  if(id==='monthly')renderMonthly();
  if(id==='deadlines')renderDeadlines();
  if(id==='daily'){ensureCategories();renderDailyPanel();renderDynamicTasks();}
  if(id==='data')renderData();
  if(id==='times'&&!pomInitialized){pomInitialized=true;pomInit();}
  if(id==='ttview'){ensureTT();var nowIST=ttNowIST();ttDate=new Date(nowIST.getFullYear(),nowIST.getMonth(),nowIST.getDate());if(ttDate<START_DATE)ttDate=new Date(START_DATE);setTimeout(function(){renderTTView();},80);}
  if(id==='revos'){renderRevOS();setTimeout(function(){var p=document.getElementById('panel-revos');if(p)p.scrollTop=0;var ril=document.getElementById('rev-items-list');if(ril)ril.scrollTop=0;},60);}
  setTimeout(applyGradBars,80);
}

/* ── HOME STATS (NO RECURSION) ── */
function updateHomeStats(){
  if(!S||!CFG)return;
  ensureCategories();
  var allTasks=[];
  S.taskCategories.forEach(function(cat){allTasks=allTasks.concat(S.tasks[cat.id]||[]);});
  var done=allTasks.filter(function(t){return t.done;}).length;
  var pct=allTasks.length>0?Math.round(done/allTasks.length*100):0;
  var hs=document.getElementById('hs-today');if(hs)hs.textContent=pct+'%';
  var nextDl=S.deadlines.filter(function(d){return !d.done&&daysUntil(d.date)>=0;})
    .sort(function(a,b){return daysUntil(a.date)-daysUntil(b.date);})[0];
  var hd=document.getElementById('hs-deadline');if(hd)hd.textContent=nextDl?daysUntil(nextDl.date)+'d':'—';
  /* Streak — based on first category (core equivalent) */
  var streak=0;var checkDate=new Date(TODAY.getTime());
  var firstCatId=S.taskCategories[0]?S.taskCategories[0].id:null;
  for(var i=0;i<365;i++){
    var dkey=checkDate.toISOString().split('T')[0];
    var hist=S.dayHistory[dkey];var allCoreD=false;
    if(hist&&firstCatId&&hist[firstCatId]&&hist[firstCatId].length>0){
      allCoreD=hist[firstCatId].every(function(t){return t.done;});
    }else if(hist&&hist.core&&hist.core.length>0){
      allCoreD=hist.core.every(function(t){return t.done;});
    }else if(i===0){
      var todayCats=firstCatId?S.tasks[firstCatId]||[]:[];
      allCoreD=todayCats.length>0&&todayCats.every(function(t){return t.done;});
    }
    if(allCoreD)streak++;else if(i>0)break;
    checkDate.setDate(checkDate.getDate()-1);
  }
  var hstr=document.getElementById('hs-streak');if(hstr)hstr.textContent=streak;
  /* Urgents */
  var urgents=S.deadlines.filter(function(d){return !d.done&&daysUntil(d.date)>=0&&daysUntil(d.date)<=5;});
  var uel=document.getElementById('home-urgents');
  if(uel)uel.innerHTML=urgents.map(function(d){
    return '<div class="home-urgent-item"><span>'+esc(d.name)+'</span><span class="home-urgent-days">'+daysUntil(d.date)+'d left</span></div>';
  }).join('');
  /* Quote */
  if(CFG.quotes!==false){
    var qi=CFG.lastQuoteIdx||0;var ni;
    do{ni=Math.floor(Math.random()*QUOTES.length);}while(ni===qi&&QUOTES.length>1);
    CFG.lastQuoteIdx=ni;saveSettings2();
    var q=QUOTES[ni];
    var qel=document.getElementById('home-quote');
    if(qel)qel.innerHTML='"'+esc(q.q)+'"<br><span style="font-size:11px;opacity:.45;font-style:normal;letter-spacing:.06em">— '+esc(q.a)+'</span>';
  }
  /* Goals panel */
  renderGoalsPanel();
  if(typeof renderSidebarGoals==='function')renderSidebarGoals();
}


/* ═══════════════════════════════════════════════════════
   REVISION OS
   State: S.revTopics = [{
     id, name, subject, day0: 'YYYY-MM-DD',
     phases: [
       {phase:1, targetDay:1,  doneDate:null},
       {phase:2, targetDay:8,  doneDate:null},
       {phase:3, targetDay:29, doneDate:null},
       {phase:4, targetDay:60, doneDate:null}
     ]
   }]
   phases[i].targetDay is relative to day0 for phase1,
   but for phase2+ it's relative to the doneDate of prev phase.
   actualDueDate computed dynamically.
═══════════════════════════════════════════════════════ */

var REV_PHASE_DAYS = [1, 7, 21, 31]; /* gaps: day1, then +7, +21, +31 */
var REV_PHASE_LABELS = ['Phase 1','Phase 2','Phase 3','Phase 4'];
var REV_PHASE_COLORS = ['#4a8fff','#f5a623','#a78bfa','#3fcf8e'];

/* Current tab + week/month nav offsets */
var revCurrentTab = 'items';
var revWeekOffset = 0;  /* weeks from current week */
var revMonthOffset = 0; /* months from current month */

/* ── ENSURE STATE ── */
function ensureRevOS(){
  if(!S.revTopics) S.revTopics = [];
}

/* ── DATE HELPERS ── */
function revAddDays(dateStr, n){
  /* Parse as local date — split manually to avoid UTC offset shift */
  var parts = String(dateStr).split('-');
  var d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  d.setDate(d.getDate()+n);
  var y=d.getFullYear();var m=String(d.getMonth()+1).padStart(2,'0');var dy=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+dy;
}
function revDaysDiff(a, b){ /* b - a in days */
  return Math.round((new Date(b)-new Date(a))/(86400000));
}
function revTodayStr(){
  var d=new Date();
  var y=d.getFullYear();var m=String(d.getMonth()+1).padStart(2,'0');var dy=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+dy;
}

/* ── PHASE DUE DATE CALCULATION ──
   Phase 1: day0 + 1 day
   Phase 2: phase1.doneDate + 7 days (or if not done: phase1.scheduledDate + 7)
   Phase 3: phase2.doneDate + 21 days
   Phase 4: phase3.doneDate + 31 days
*/
function revPhaseDueDate(topic, phaseIndex){
  var gaps = [1, 7, 21, 31];
  if(phaseIndex === 0){
    return revAddDays(topic.day0, 1);
  }
  /* Based on ACTUAL done date of previous phase, else scheduled date */
  var prevDone = topic.phases[phaseIndex-1].doneDate;
  var prevDue  = revPhaseDueDate(topic, phaseIndex-1);
  var base = prevDone || prevDue;
  return revAddDays(base, gaps[phaseIndex]);
}

/* ── PHASE STATUS ── */
function revPhaseStatus(topic, phaseIndex){
  var phase = topic.phases[phaseIndex];
  if(phase.doneDate) return 'done';
  /* Is this the next phase to do? (all previous done) */
  var allPrevDone = true;
  for(var i=0;i<phaseIndex;i++) if(!topic.phases[i].doneDate) allPrevDone=false;
  if(!allPrevDone) return 'upcoming';
  var due = revPhaseDueDate(topic, phaseIndex);
  var today = revTodayStr();
  if(due <= today) return due < today ? 'overdue' : 'due';
  return 'upcoming'; /* due in future */
}

/* get the "active" phase index (next undone) */
function revActivePhase(topic){
  for(var i=0;i<4;i++) if(!topic.phases[i].doneDate) return i;
  return -1; /* all done */
}

/* ── ALL REVISIONS DUE ON A DATE ── */
function revDueOnDate(dateStr){
  ensureRevOS();
  var due = [];
  var today = revTodayStr();
  S.revTopics.forEach(function(topic){
    for(var i=0;i<4;i++){
      if(topic.phases[i].doneDate) continue;
      /* Only if all previous phases done */
      var allPrev=true;
      for(var j=0;j<i;j++) if(!topic.phases[j].doneDate) allPrev=false;
      if(!allPrev) continue;
      var dueDate = revPhaseDueDate(topic, i);
      /* EXACT match: show on its scheduled due date */
      if(dueDate === dateStr){
        due.push({topic:topic, phaseIdx:i, dueDate:dueDate, carried:false});
      }
      /* OVERDUE: if it was due before today and still not done, show ONLY on today */
      else if(dueDate < today && dateStr === today){
        due.push({topic:topic, phaseIdx:i, dueDate:dueDate, carried:true});
      }
      /* TOMORROW carry: if still not done by end of today (past due), show next day too */
      /* We handle this by showing on today only — user marks done → disappears next day */
    }
  });
  return due;
}

/* ── RENDER MAIN REVOS PANEL ── */
function renderRevOS(){
  ensureRevOS();
  revShowTab(revCurrentTab);
}

function revShowTab(tab, skipSet){
  if(!skipSet) revCurrentTab = tab;
  document.querySelectorAll('.rev-tab-btn').forEach(function(b){ b.classList.remove('active'); });
  var activeBtn = document.getElementById('rev-tab-'+tab);
  if(activeBtn) activeBtn.classList.add('active');
  var views = ['items','week','month'];
  views.forEach(function(v){
    var el = document.getElementById('rev-view-'+v);
    if(!el) return;
    if(v===tab){
      el.classList.add('active-view');
    } else {
      el.classList.remove('active-view');
    }
  });
  if(tab==='items') renderRevItems();
  if(tab==='week')  renderRevWeek();
  if(tab==='month') renderRevMonth();
}

/* ── TOPICS TAB ── */
function renderRevItems(){
  ensureRevOS();
  var cont = document.getElementById('rev-items-list');
  if(!cont) return;
  if(!S.revTopics.length){
    cont.innerHTML =
      '<div style="padding:60px 0;text-align:center">'+
        '<div style="font-size:48px;margin-bottom:14px">🧠</div>'+
        '<div style="color:var(--text2);font-size:15px;font-weight:600;margin-bottom:6px">No revision topics yet</div>'+
        '<div style="color:var(--text3);font-size:13px">Click <b style="color:var(--accent)">+ Add Topic</b> to start spaced repetition.</div>'+
      '</div>';
    return;
  }
  var today = revTodayStr();
  var tomorrow = revAddDays(today, 1);

  /* Stats */
  var totalTopics = S.revTopics.length;
  var completedTopics = S.revTopics.filter(function(t){ return revActivePhase(t) < 0; });
  var overdueItems = [];
  var todayItems = [];
  var upcomingGroups = {}; /* dateStr -> [] */

  S.revTopics.forEach(function(topic){
    var ap = revActivePhase(topic);
    if(ap < 0) return; /* all done */
    var dueDate = revPhaseDueDate(topic, ap);
    if(dueDate < today){
      overdueItems.push({topic:topic, phaseIdx:ap, dueDate:dueDate, status:'overdue'});
    } else if(dueDate === today){
      todayItems.push({topic:topic, phaseIdx:ap, dueDate:dueDate, status:'today'});
    } else {
      if(!upcomingGroups[dueDate]) upcomingGroups[dueDate] = [];
      upcomingGroups[dueDate].push({topic:topic, phaseIdx:ap, dueDate:dueDate, status:'upcoming'});
    }
  });

  var totalDue = overdueItems.length + todayItems.length;

  /* Build HTML */
  var html = '';

  /* Stats strip */
  html += '<div class="rev-stats-strip">';
  html += '<div class="rev-stat-card"><div class="rev-stat-val" style="color:var(--amber)">'+overdueItems.length+'</div><div class="rev-stat-lbl">Overdue</div></div>';
  html += '<div class="rev-stat-card"><div class="rev-stat-val" style="color:var(--green)">'+todayItems.length+'</div><div class="rev-stat-lbl">Due Today</div></div>';
  html += '<div class="rev-stat-card"><div class="rev-stat-val">'+totalTopics+'</div><div class="rev-stat-lbl">Topics</div></div>';
  html += '<div class="rev-stat-card"><div class="rev-stat-val" style="color:var(--green)">'+completedTopics.length+'</div><div class="rev-stat-lbl">Completed</div></div>';
  html += '</div>';

  function buildItem(item){
    var topic = item.topic;
    var pi = item.phaseIdx;
    var phaseColor = REV_PHASE_COLORS[pi];
    var phaseName = REV_PHASE_LABELS[pi];
    var statusCls = item.status;
    var isDone = topic.phases[pi].doneDate !== null;
    /* Previous phase that can be undone (the one just before current) */
    var prevDoneIdx = -1;
    for(var k=pi-1;k>=0;k--){ if(topic.phases[k].doneDate){ prevDoneIdx=k; break; } }
    var undoPrevBtn = '';
    if(prevDoneIdx>=0){
      undoPrevBtn = '<button class="rev-agenda-undo" onclick="revMarkDone(\''+topic.id+'\','+prevDoneIdx+')" title="Undo '+REV_PHASE_LABELS[prevDoneIdx]+'">↩ '+REV_PHASE_LABELS[prevDoneIdx]+'</button>';
    }
    return '<div class="rev-agenda-item '+statusCls+(isDone?' done':'')+'" id="rev-item-'+topic.id+'-'+pi+'">'+
      '<div class="rev-agenda-phase-dot" style="background:'+phaseColor+';color:'+phaseColor+'"></div>'+
      '<div style="flex:1;min-width:0">'+
        '<div class="rev-agenda-name" style="'+(isDone?'text-decoration:line-through':'')+'">'+esc(topic.name)+'</div>'+
        '<div class="rev-agenda-sub">'+
          (topic.subject?'<span style="color:var(--text2)">'+esc(topic.subject)+'</span> · ':'')+
          '<span class="rev-phase-pill" style="background:'+phaseColor+'22;color:'+phaseColor+'">'+phaseName+'</span>'+
          (item.status==='overdue'?' <span style="color:var(--red);font-size:10px">overdue since '+item.dueDate+'</span>':'')+
        '</div>'+
      '</div>'+
      undoPrevBtn+
      (isDone
        ? '<button class="rev-agenda-undo" onclick="revMarkDone(\''+topic.id+'\','+pi+')" title="Undo this phase">↩ Undo</button>'
        : '<button class="rev-agenda-mark" onclick="revMarkDone(\''+topic.id+'\','+pi+')" title="Mark done">✓ Done</button>'
      )+
      '<button class="del-btn" style="margin-left:4px;font-size:14px;opacity:.35;flex-shrink:0" onclick="revDeleteTopic(\''+topic.id+'\')" title="Delete topic">×</button>'+
    '</div>';
  }

  /* OVERDUE section */
  if(overdueItems.length){
    html += '<div class="rev-agenda-group">';
    html += '<div class="rev-agenda-date-hdr hdr-overdue">🔴 Overdue — Revise Now ('+overdueItems.length+')</div>';
    overdueItems.forEach(function(item){ html += buildItem(item); });
    html += '</div>';
  }

  /* TODAY section */
  var todayParts = today.split('-');
  var todayObj = new Date(parseInt(todayParts[0]), parseInt(todayParts[1])-1, parseInt(todayParts[2]));
  var todayLabel = todayObj.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'});
  if(todayItems.length || !overdueItems.length){
    html += '<div class="rev-agenda-group">';
    html += '<div class="rev-agenda-date-hdr hdr-today">📅 Today — '+todayLabel+(todayItems.length?' ('+todayItems.length+')':' — nothing due')+' </div>';
    if(todayItems.length){
      todayItems.forEach(function(item){ html += buildItem(item); });
    } else {
      html += '<div style="color:var(--text3);font-size:13px;padding:12px;text-align:center">✓ Nothing due today. Keep it up!</div>';
    }
    html += '</div>';
  }

  /* UPCOMING sections */
  var upcomingKeys = Object.keys(upcomingGroups).sort();
  upcomingKeys.forEach(function(dateKey){
    var items = upcomingGroups[dateKey];
    /* Parse as local date to avoid UTC offset shifting the day in IST */
    var parts = dateKey.split('-');
    var dObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    var isTomorrow = dateKey === tomorrow;
    var label = isTomorrow
      ? '🟡 Tomorrow — '+dObj.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})
      : '🔵 '+dObj.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short',year:'numeric'});
    html += '<div class="rev-agenda-group">';
    html += '<div class="rev-agenda-date-hdr hdr-upcoming">'+label+' ('+items.length+')</div>';
    items.forEach(function(item){ html += buildItem(item); });
    html += '</div>';
  });

  /* Completed topics */
  if(completedTopics.length){
    html += '<div class="rev-completed-section">';
    html += '<div class="rev-completed-hdr">✅ Completed ('+completedTopics.length+')</div>';
    completedTopics.forEach(function(topic){
      html +=
        '<div class="rev-agenda-item done">'+
        '<div class="rev-agenda-phase-dot" style="background:var(--green);color:var(--green)"></div>'+
        '<div style="flex:1;min-width:0">'+
          '<div class="rev-agenda-name" style="text-decoration:line-through">'+esc(topic.name)+'</div>'+
          (topic.subject?'<div class="rev-agenda-sub">'+esc(topic.subject)+'</div>':'')+
        '</div>'+
        '<button class="rev-agenda-undo" onclick="revUndoLast(\''+topic.id+'\')" title="Undo last phase">↩ Undo</button>'+
        '<button class="del-btn" style="margin-left:4px;font-size:14px;opacity:.35;flex-shrink:0" onclick="revDeleteTopic(\''+topic.id+'\')" title="Delete">×</button>'+
        '</div>';
    });
    html += '</div>';
  }

  if(!html.includes('rev-agenda-item')&&!completedTopics.length){
    html += '<div style="color:var(--text3);font-size:13px;padding:48px;text-align:center">All topics up to date! 🎉</div>';
  }

  cont.innerHTML = html;
}


/* ── MARK DONE / UNDO ── */
function revMarkDone(topicId, phaseIdx){
  ensureRevOS();
  var topic = S.revTopics.find(function(t){return t.id===topicId;});
  if(!topic) return;
  var phase = topic.phases[phaseIdx];
  if(phase.doneDate){
    /* Undo this phase — only if no LATER phases are done */
    var laterDone = false;
    for(var i=phaseIdx+1;i<4;i++) if(topic.phases[i].doneDate) laterDone=true;
    if(laterDone){
      /* Ask to undo all later phases too */
      if(!confirm('Undo Phase '+(phaseIdx+1)+' and all subsequent phases?')) return;
      for(var i=phaseIdx;i<4;i++) topic.phases[i].doneDate = null;
    } else {
      phase.doneDate = null;
    }
  } else {
    /* Check all previous done */
    for(var i=0;i<phaseIdx;i++){
      if(!topic.phases[i].doneDate){ alert('Complete '+REV_PHASE_LABELS[i]+' first.'); return; }
    }
    phase.doneDate = revTodayStr();
  }
  saveState();
  renderRevItems();
  renderRevDailyReminders();
  if(revCurrentTab==='week') renderRevWeek();
  if(revCurrentTab==='month') renderRevMonth();
}

/* Undo the last completed phase of a fully done topic */
function revUndoLast(topicId){
  ensureRevOS();
  var topic = S.revTopics.find(function(t){return t.id===topicId;});
  if(!topic) return;
  /* Find last done phase */
  var lastDone = -1;
  for(var i=3;i>=0;i--) if(topic.phases[i].doneDate){ lastDone=i; break; }
  if(lastDone < 0) return;
  if(!confirm('Undo '+REV_PHASE_LABELS[lastDone]+' for "'+topic.name+'"?')) return;
  topic.phases[lastDone].doneDate = null;
  saveState();
  renderRevItems();
  renderRevDailyReminders();
}

/* ── DELETE ── */
function revDeleteTopic(id){
  if(!confirm('Delete this revision topic?')) return;
  ensureRevOS();
  S.revTopics = S.revTopics.filter(function(t){return t.id!==id;});
  saveState(); renderRevItems(); renderRevDailyReminders();
}

/* ── ADD TOPIC ── */
function revOpenAdd(){
  var d = document.getElementById('rev-add-date');
  if(d) d.value = revTodayStr();
  var n = document.getElementById('rev-add-name');
  if(n) n.value = '';
  var s = document.getElementById('rev-add-subject');
  if(s) s.value = '';
  document.getElementById('rev-modal-add').classList.add('open');
  setTimeout(function(){ var el=document.getElementById('rev-add-name'); if(el) el.focus(); },60);
}
function revConfirmAdd(){
  var name = (document.getElementById('rev-add-name')||{}).value;
  if(!name||!name.trim()){ alert('Enter a topic name.'); return; }
  var subject = (document.getElementById('rev-add-subject')||{}).value||'';
  var day0 = (document.getElementById('rev-add-date')||{}).value || revTodayStr();
  ensureRevOS();
  S.revTopics.push({
    id: uid(),
    name: name.trim(),
    subject: subject.trim(),
    day0: day0,
    phases: [
      {phase:1, doneDate:null},
      {phase:2, doneDate:null},
      {phase:3, doneDate:null},
      {phase:4, doneDate:null}
    ]
  });
  saveState();
  closeModal('rev-modal-add');
  renderRevItems();
  renderRevDailyReminders();
}

/* ── DAILY PANEL REMINDERS ── */
function renderRevDailyReminders(){
  var cont = document.getElementById('rev-daily-reminders');
  if(!cont) return;
  ensureRevOS();

  /* Use LOCAL date string (same format as revTodayStr) to avoid UTC offset shift */
  function localDateStr(d){
    var y=d.getFullYear();var m=String(d.getMonth()+1).padStart(2,'0');var dy=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+dy;
  }
  var dateKey = (typeof viewingDate !== 'undefined') ? localDateStr(viewingDate) : revTodayStr();
  var today = revTodayStr();
  var items = [];

  S.revTopics.forEach(function(topic){
    for(var i=0;i<4;i++){
      var phase = topic.phases[i];
      /* DONE phase — show only if marked done on the viewed date (undo button) */
      if(phase.doneDate){
        if(phase.doneDate === dateKey){
          items.push({topic:topic, phaseIdx:i, dueDate:phase.doneDate, status:'done'});
        }
        continue;
      }
      /* Only process if all previous phases are done */
      var allPrev=true;
      for(var j=0;j<i;j++) if(!topic.phases[j].doneDate){ allPrev=false; break; }
      if(!allPrev) continue;

      var dueDate = revPhaseDueDate(topic, i);

      /* Due exactly on viewed date */
      if(dueDate === dateKey){
        items.push({topic:topic, phaseIdx:i, dueDate:dueDate, status:'today'});
      }
      /* Overdue: due before viewed date — show on ALL days from due date onwards until done */
      else if(dueDate < dateKey){
        items.push({topic:topic, phaseIdx:i, dueDate:dueDate, status:'overdue'});
      }
    }
  });

  var overdueCount = items.filter(function(x){ return x.status==='overdue'; }).length;
  var todayCount   = items.filter(function(x){ return x.status==='today'; }).length;
  var doneCount    = items.filter(function(x){ return x.status==='done'; }).length;

  var headerParts = [];
  if(overdueCount) headerParts.push('<span style="color:var(--red)">'+overdueCount+' overdue</span>');
  if(todayCount)   headerParts.push('<span style="color:var(--amber)">'+todayCount+' due today</span>');
  if(doneCount)    headerParts.push('<span style="color:var(--green)">'+doneCount+' done ↩</span>');

  /* Always render the section — show "No revision schedule" when empty */
  var html = '<div class="rev-daily-section">';
  html += '<div class="rev-daily-header" style="display:flex;align-items:center;justify-content:space-between">'+
    '<span>🧠 Revision OS'+(headerParts.length?' — '+headerParts.join(' &nbsp;'):'')+'</span>'+
    '<button onclick="sidebarSwitch(\'revos\',null)" style="font-size:10px;padding:3px 8px;border-radius:6px;border:1px solid rgba(167,139,250,.3);background:transparent;color:var(--purple);cursor:pointer;font-weight:600;transition:all .15s">Open →</button>'+
  '</div>';

  if(!items.length){
    html += '<div style="padding:12px 4px;font-size:12px;color:var(--text3);font-style:italic;text-align:center;letter-spacing:.02em">No revision schedule for this day ✓</div>';
  } else {
    /* Sort: overdue first, then today, then done */
    var order = {overdue:0, today:1, done:2};
    items.sort(function(a,b){ return order[a.status]-order[b.status]; });

    items.forEach(function(item){
      var topic = item.topic;
      var pi    = item.phaseIdx;
      var phaseColor = REV_PHASE_COLORS[pi];
      var isDone = item.status === 'done';

      var statusLabel = '';
      if(item.status==='overdue') statusLabel = ' <span style="color:var(--red);font-weight:600">· overdue since '+item.dueDate+'</span>';
      if(item.status==='today')   statusLabel = ' <span style="color:var(--amber)">· due today</span>';
      if(item.status==='done')    statusLabel = ' <span style="color:var(--green)">· marked done</span>';

      html +=
        '<div class="rev-daily-item" style="opacity:'+(isDone?0.6:1)+';'+(isDone?'background:var(--green-bg);':'')+'">'+
        '<div style="width:9px;height:9px;border-radius:50%;background:'+(isDone?'var(--green)':phaseColor)+';flex-shrink:0;'+(isDone?'':'box-shadow:0 0 5px '+phaseColor+'66')+'"></div>'+
        '<div class="rev-daily-item-text">'+
          '<div style="font-weight:700;font-size:13px;color:var(--text);'+(isDone?'text-decoration:line-through':'')+'">'+esc(topic.name)+'</div>'+
          '<div style="font-size:11px;color:var(--text3);margin-top:1px">'+
            (topic.subject?esc(topic.subject)+' · ':'')+REV_PHASE_LABELS[pi]+statusLabel+
          '</div>'+
        '</div>'+
        (isDone
          ? '<button class="rev-daily-undo" onclick="revMarkDoneFromDaily(\''+topic.id+'\','+pi+')" title="Undo — unmark this phase">↩ Undo</button>'
          : '<button class="rev-daily-mark" onclick="revMarkDoneFromDaily(\''+topic.id+'\','+pi+')" title="Mark as done">✓ Done</button>'
        )+
        '</div>';
    });
  }

  html += '</div>';
  cont.innerHTML = html;
}

function revMarkDoneFromDaily(topicId, phaseIdx){
  ensureRevOS();
  var topic = S.revTopics.find(function(t){return t.id===topicId;});
  if(!topic) return;
  var phase = topic.phases[phaseIdx];
  if(phase.doneDate){ phase.doneDate=null; }
  else {
    /* Check previous phases done */
    for(var i=0;i<phaseIdx;i++){
      if(!topic.phases[i].doneDate){ alert('Complete Phase '+(i+1)+' first.'); return; }
    }
    phase.doneDate = revTodayStr();
  }
  saveState();
  renderRevDailyReminders();
  var panel=document.getElementById('panel-revos');
  if(panel&&panel.classList.contains('active')) renderRevOS();
}


/* ── WEEK VIEW ── */
function revWeekNav(delta){ revWeekOffset += delta; renderRevWeek(); }
function renderRevWeek(){
  ensureRevOS();
  var today = new Date(); today.setHours(0,0,0,0);
  var dow = today.getDay();
  var monday = new Date(today);
  monday.setDate(today.getDate() - (dow===0?6:dow-1) + revWeekOffset*7);
  var sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
  var label = document.getElementById('rev-week-label');
  if(label) label.textContent = monday.toLocaleDateString('en-IN',{day:'numeric',month:'short'}) + ' – ' + sunday.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  var cont = document.getElementById('rev-week-content');
  if(!cont) return;
  var todayStr = revTodayStr();
  var DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  /* Header row */
  var html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px">';
  for(var di=0;di<7;di++){
    var dayDate = new Date(monday); dayDate.setDate(monday.getDate()+di);
    var dayStr = dayDate.toISOString().split('T')[0];
    var isToday_ = dayStr===todayStr;
    html += '<div style="text-align:center;font-size:12px;font-weight:700;color:'+(isToday_?'var(--accent)':'var(--text3)')+';padding:4px;'+
      (isToday_?'background:rgba(74,143,255,.1);border-radius:6px;':'')+
      'text-transform:uppercase;letter-spacing:.06em">'+
      DAY_NAMES[di]+' '+dayDate.getDate()+'</div>';
  }
  html += '</div>';
  /* Day columns */
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">';
  for(var di=0;di<7;di++){
    var dayDate = new Date(monday); dayDate.setDate(monday.getDate()+di);
    var dayStr = dayDate.toISOString().split('T')[0];
    var isToday_ = dayStr===todayStr;
    var due = revDueOnDate(dayStr);
    html += '<div style="background:var(--bg3);border:1px solid '+(isToday_?'var(--accent)':'var(--border)')+';border-radius:10px;padding:8px;min-height:160px">';
    if(!due.length){
      html += '<div style="font-size:10px;color:var(--text3);text-align:center;margin-top:16px">—</div>';
    }
    due.forEach(function(item){
      var phaseColor = REV_PHASE_COLORS[item.phaseIdx];
      var isDone = item.topic.phases[item.phaseIdx].doneDate !== null;
      html +=
        '<div style="background:'+phaseColor+'22;border:1px solid '+phaseColor+'55;border-radius:6px;padding:6px 7px;margin-bottom:5px;cursor:pointer;opacity:'+(isDone?.5:1)+'" '+
        'onclick="revMarkDone(\''+item.topic.id+'\','+item.phaseIdx+')" title="Click to mark done">'+
        '<div style="font-size:11px;font-weight:700;color:'+phaseColor+';margin-bottom:2px">'+REV_PHASE_LABELS[item.phaseIdx]+'</div>'+
        '<div style="font-size:11px;color:var(--text);font-weight:600;line-height:1.3;word-break:break-word">'+(isDone?'<s>':'')+esc(item.topic.name)+(isDone?'</s>':'')+
        '</div>'+
        (item.topic.subject?'<div style="font-size:10px;color:var(--text3);margin-top:1px">'+esc(item.topic.subject)+'</div>':'')+
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  cont.innerHTML = html;
}


/* ── MONTH VIEW ── */
function revMonthNav(delta){ revMonthOffset += delta; renderRevMonth(); }
function renderRevMonth(){
  ensureRevOS();
  var today = new Date(); today.setHours(0,0,0,0);
  var viewMonth = new Date(today.getFullYear(), today.getMonth()+revMonthOffset, 1);
  var label = document.getElementById('rev-month-label');
  if(label) label.textContent = viewMonth.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  var cont = document.getElementById('rev-month-content');
  if(!cont) return;
  var todayStr = revTodayStr();
  var DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  var startDow = firstDay.getDay(); var startOff = startDow===0?6:startDow-1;
  var gridStart = new Date(firstDay); gridStart.setDate(firstDay.getDate()-startOff);
  var html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:3px">';
  DAY_NAMES.forEach(function(d){
    html += '<div style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);padding:4px;text-transform:uppercase;letter-spacing:.06em">'+d+'</div>';
  });
  html += '</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">';
  var lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 0);
  for(var ci=0;ci<42;ci++){
    var cellDate = new Date(gridStart); cellDate.setDate(gridStart.getDate()+ci);
    var cellStr = cellDate.toISOString().split('T')[0];
    var inMonth = cellDate.getMonth()===viewMonth.getMonth();
    var isToday_ = cellStr===todayStr;
    var due = revDueOnDate(cellStr);
    html += '<div style="background:var(--bg3);border:1px solid '+(isToday_?'var(--accent)':'var(--border)')+';border-radius:6px;padding:4px 5px;min-height:72px;opacity:'+(inMonth?1:.35)+'">';
    html += '<div style="font-size:11px;font-weight:700;color:'+(isToday_?'var(--accent)':'var(--text3)')+';margin-bottom:3px;font-family:DM Mono,monospace">'+cellDate.getDate()+'</div>';
    due.slice(0,3).forEach(function(item){
      var phaseColor = REV_PHASE_COLORS[item.phaseIdx];
      var isDone = item.topic.phases[item.phaseIdx].doneDate !== null;
      html += '<div style="background:'+phaseColor+';color:#fff;font-size:9px;font-weight:700;border-radius:3px;padding:2px 4px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;opacity:'+(isDone?.5:1)+'" '+
        'onclick="revMarkDone(\''+item.topic.id+'\','+item.phaseIdx+')" '+
        'title="'+esc(item.topic.name)+' — '+REV_PHASE_LABELS[item.phaseIdx]+(isDone?' (done)':'')+'">'+
        esc(item.topic.name.length>9?item.topic.name.slice(0,8)+'…':item.topic.name)+
        '</div>';
    });
    if(due.length>3) html += '<div style="font-size:9px;color:var(--text3)">+'+( due.length-3)+'</div>';
    html += '</div>';
    /* Stop after we've shown all days in month + trailing days to complete last week */
    if(ci>=27 && cellDate > lastDay && cellDate.getDay()===0) break; /* stop after Sunday past month end */
  }
  html += '</div>';
  cont.innerHTML = html;
}


/* ─── INIT — deferred until auth completes ─── */
function protocolBoot(){
  /* Re-hydrate from Firestore cache (populated by waitForPrefetch) */
  var _loaded = window.ProtocolDB ? window.ProtocolDB.getState() : null;
  var _loadedCfg = window.ProtocolDB ? window.ProtocolDB.getConfig() : null;
  /* Only fall back to defState for brand-new users — never overwrite existing data */
  S   = (_loaded && _loaded.tasks && _loaded.weeks) ? _loaded : null;
  if(!S){ S=defState(); if(window.ProtocolDB) window.ProtocolDB.saveState(S); }
  CFG = _loadedCfg || null;
  if(!CFG){
    var _uname='User';
    if(window.ProtocolAuth){var _au=window.ProtocolAuth.currentUser();if(_au)_uname=_au.displayName||_au.username;}
    CFG={theme:'darkblue',username:_uname,quotes:true,startdate:'2026-04-07',use12hr:false};
    if(window.ProtocolDB) window.ProtocolDB.saveConfig(CFG);
  }

  applyTheme(CFG.theme||'darkblue');
  applyFont(CFG.font||'dmsans');
  if(CFG.startdate)START_DATE=parseDate(CFG.startdate);
  buildHomeShortcuts();
  updateClock();
  if(window._clockInterval)clearInterval(window._clockInterval);
  window._clockInterval=setInterval(updateClock,60000);
  (function(){
    var sub=document.getElementById('sb-logo-sub');
    if(sub)sub.textContent=(CFG.username||'Dhruv')+' · System';
    /* Sidebar user badge — use CFG.username as the display name (it's the
       source of truth), fall back to Firebase profile only on first boot */
    if(window.ProtocolAuth){
      var u=window.ProtocolAuth.currentUser();
      if(u){
        var dot=document.getElementById('sb-user-dot');
        var nm=document.getElementById('sb-user-name');
        if(dot)dot.style.background=u.avatarColor||'#4a8fff';
        if(nm)nm.textContent=CFG.username||(u.displayName||u.username);
      }
    }
  })();
  updateHomeStats();
  renderAll();
  ensureGoals();
  renderSidebarGoals();
}

/* ── PROTOCOL SPLASH — enhanced, runs every cold load ── */
(function(){
  /* Apply saved theme immediately so accent color AND gradient are correct during splash.
     This prevents the colour-jump when the splash fades on gradient themes. */
  var savedCfg=window.ProtocolDB?JSON.stringify(window.ProtocolDB.getConfig()):localStorage.getItem('protocol_v1_cfg');
  if(savedCfg){
    try{
      var c=JSON.parse(savedCfg);
      if(c.theme){
        document.documentElement.setAttribute('data-theme',c.theme);
        /* Also set gradient attribute on body so the background is ready BEFORE splash fades */
        var isGradientTheme=['aurora','dusk','sol','neo','volcano','midnight','sakura','matrix'].indexOf(c.theme)>=0;
        if(isGradientTheme){
          document.body.setAttribute('data-gradient',c.theme);
          /* Match splash background to the theme's dominant dark colour so the fade is seamless */
          var splashBgMap={
            aurora:'#070b14',dusk:'#0d0818',sol:'#0c0800',neo:'#000a0a',
            volcano:'#1a0000',midnight:'#000510',sakura:'#1a0818',matrix:'#000800'
          };
          var sp=document.getElementById('splash-screen');
          if(sp)sp.style.background=splashBgMap[c.theme]||'#000';
        }
      }
    }catch(e){}
  }

  var splash=document.getElementById('splash-screen');
  var logo=document.getElementById('splash-logo');
  var canvas=document.getElementById('splash-canvas');
  if(!splash||!logo)return;

  /* ── Particle system on canvas ── */
  var accentColor='#4a8fff';
  try{accentColor=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#4a8fff';}catch(e){}

  if(canvas){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    var ctx=canvas.getContext('2d');
    var particles=[];
    for(var i=0;i<60;i++){
      particles.push({
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        r:Math.random()*2+0.5,
        vx:(Math.random()-.5)*0.4,
        vy:(Math.random()-.5)*0.4,
        alpha:Math.random()*0.4+0.1
      });
    }
    var animFrame;
    var particleAlpha=0;
    var particleFading=false;
    function drawParticles(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if(particleFading)particleAlpha=Math.max(0,particleAlpha-0.012);
      else particleAlpha=Math.min(1,particleAlpha+0.018);
      particles.forEach(function(p){
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0)p.x=canvas.width;if(p.x>canvas.width)p.x=0;
        if(p.y<0)p.y=canvas.height;if(p.y>canvas.height)p.y=0;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=accentColor;
        ctx.globalAlpha=p.alpha*particleAlpha;
        ctx.fill();
      });
      ctx.globalAlpha=1;
      if(particleAlpha>0||!particleFading)animFrame=requestAnimationFrame(drawParticles);
    }
    /* Start particles after logo shows */
    setTimeout(function(){drawParticles();},300);
    /* Stop particles when splash cuts */
    setTimeout(function(){particleFading=true;},2000);
  }

  /* ── Expanding accent rings ── */
  function fireRing(delay,size){
    setTimeout(function(){
      var r=document.createElement('div');
      r.className='splash-ring';
      r.style.cssText='width:'+size+'px;height:'+size+'px;margin-left:-'+size/2+'px;margin-top:-'+size/2+'px;top:50%;left:50%;position:absolute;';
      splash.appendChild(r);
      requestAnimationFrame(function(){
        r.style.animation='splashRing '+(size>300?'1.8s':'1.4s')+' cubic-bezier(.16,1,.3,1) forwards';
      });
      setTimeout(function(){if(r.parentNode)r.parentNode.removeChild(r);},1600);
    },delay);
  }

  /* ── Sequence driven by authRunSplash / boot gate ── */
  /* Rings fire after logo show delay */
  fireRing(400,200);
  fireRing(620,320);
  fireRing(880,480);
})();

/* ═══════════════════════════════════════════════════════
   TT VIEW — Time Table / Calendar
   State: S.ttTasks = [{id,name,color,schedule:{}}]
   schedule: { dateKey: {from:'09:00',to:'10:00'} }
═══════════════════════════════════════════════════════ */

var TT_COLORS=[
  '#ef4444','#f97316','#eab308','#22c55e','#10b981',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f43f5e'
];

var ttDate=new Date();
var ttDragTaskId=null;
var ttDragBlockId=null;
var ttDragStartY=0;
var ttResizeTaskId=null;
var ttResizeStartY=0;
var ttResizeStartMin=0;
var ttPendingTaskId=null;
var ttPendingAction=null;
var ttPendingData={};
var ttSelectedColor=TT_COLORS[0];
var ttNowInterval=null;

function ttDateKey(d){
  var y=d.getFullYear();
  var mo=String(d.getMonth()+1).padStart(2,'0');
  var dy=String(d.getDate()).padStart(2,'0');
  return y+'-'+mo+'-'+dy;
}
function ttFmtDate(d){
  return d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function ttFmtTime(hhmm){
  var p=hhmm.split(':');var h=parseInt(p[0]);var m=p[1];
  var ampm=h>=12?'PM':'AM';h=h%12||12;
  return h+':'+m+' '+ampm;
}
function ttMinToHHMM(min){
  return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');
}
function ttHHMMToMin(hhmm){
  var p=hhmm.split(':');return parseInt(p[0])*60+parseInt(p[1]);
}
function ttNowIST(){
  var now=new Date();
  var utc=now.getTime()+now.getTimezoneOffset()*60000;
  return new Date(utc+5.5*3600000);
}
function ttTodayKeyIST(){
  var ist=ttNowIST();
  var y=ist.getFullYear();
  var m=String(ist.getMonth()+1).padStart(2,'0');
  var d=String(ist.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+d;
}
var ttEditMode=false;

function ensureTT(){if(!S.ttTasks)S.ttTasks=[];}

function renderTTView(){
  ensureTT();
  var dateKey=ttDateKey(ttDate);
  var nowIST=ttNowIST();
  var todayKey=ttTodayKeyIST();
  var isPast=dateKey<todayKey;
  var isToday=dateKey===todayKey;
  var dd=document.getElementById('tt-date-display');
  if(dd)dd.textContent=ttFmtDate(ttDate);
  var todayBtn=document.getElementById('tt-today-btn');
  if(todayBtn)todayBtn.classList.toggle('visible',!isToday);
  var editBtn=document.getElementById('tt-edit-btn');
  if(editBtn){
    editBtn.style.display=isPast?'block':'none';
    editBtn.textContent=ttEditMode?'✓ Done Editing':'✏ Edit';
    editBtn.classList.toggle('editing',ttEditMode);
  }
  var labelsEl=document.getElementById('tt-hour-labels');
  var evArea=document.getElementById('tt-events-area');
  if(!labelsEl||!evArea)return;
  labelsEl.innerHTML='';evArea.innerHTML='';
  var pct=function(min){return (min/1440*100).toFixed(4)+'%';};
  for(var hr=0;hr<24;hr++){
    var lbl=document.createElement('div');lbl.className='tt-hour-label';
    lbl.textContent=hr===0?'12 AM':hr<12?hr+' AM':hr===12?'12 PM':(hr-12)+' PM';
    lbl.style.top=pct(hr*60);lbl.style.height=pct(60);
    labelsEl.appendChild(lbl);
    var line=document.createElement('div');line.className='tt-hour-line';
    line.style.top=pct(hr*60);evArea.appendChild(line);
    var half=document.createElement('div');half.className='tt-hour-line-half';
    half.style.top=pct(hr*60+30);evArea.appendChild(half);
  }
  if(isToday){
    var nowMin=nowIST.getHours()*60+nowIST.getMinutes();
    var nowLine=document.createElement('div');nowLine.id='tt-now-line';
    nowLine.style.top=pct(nowMin);
    evArea.appendChild(nowLine);
  }
  var blocks=[];
  S.ttTasks.forEach(function(task){
    var sch=task.schedule&&task.schedule[dateKey];
    if(sch&&sch.from&&sch.to){blocks.push({task:task,from:sch.from,to:sch.to});}
  });
  if(S.ttArchivedSchedules){
    S.ttArchivedSchedules.forEach(function(arc){
      if(arc.dateKey===dateKey){
        blocks.push({task:{id:arc.taskId,name:arc.name+'*',color:arc.color||'#888'},from:arc.from,to:arc.to,archived:true});
      }
    });
  }
  blocks.forEach(function(b,bi){
    b.col=0;b.cols=1;
    blocks.forEach(function(b2,bi2){
      if(bi===bi2)return;
      if(ttHHMMToMin(b.to)>ttHHMMToMin(b2.from)&&ttHHMMToMin(b.from)<ttHHMMToMin(b2.to)){
        b.hasOverlap=true;if(bi2<bi)b.col=1;b.cols=2;
      }
    });
  });
  blocks.forEach(function(b){
    var fromMin=ttHHMMToMin(b.from);
    var toMin=ttHHMMToMin(b.to);
    var block=document.createElement('div');
    block.className='tt-block';
    block.dataset.taskId=b.task.id;
    var topPct=(fromMin/1440*100).toFixed(4)+'%';
    var htPct=Math.max(2,(toMin-fromMin)/1440*100).toFixed(4)+'%';
    block.style.cssText='top:'+topPct+';height:'+htPct+';background:'+b.task.color+';';
    if(b.cols===2){if(b.col===0)block.style.right='52%';else{block.style.left='52%';block.style.right='4px';}}
    if(isPast&&!ttEditMode)block.style.opacity='0.75';
    block.innerHTML=
      '<button class="tt-block-close" onclick="ttOpenRemove(\''+b.task.id+'\',event)" title="Remove">×</button>'+
      '<div class="tt-block-name">'+esc(b.task.name)+'</div>'+
      '<div class="tt-block-time">'+ttFmtTime(b.from)+' – '+ttFmtTime(b.to)+'</div>'+
      '<div class="tt-block-resize" title="Drag to resize"></div>';
    if(!isPast||ttEditMode){
      block.addEventListener('mousedown',function(e){
        if(e.target.classList.contains('tt-block-resize')||e.target.classList.contains('tt-block-close'))return;
        ttStartBlockMove(e,b.task.id,fromMin);
      });
      block.querySelector('.tt-block-resize').addEventListener('mousedown',function(e){
        e.stopPropagation();ttStartResize(e,b.task.id,toMin);
      });
    }
    block.addEventListener('dblclick',function(e){
      e.stopPropagation();
      if(isPast&&!ttEditMode){alert('Past dates are read-only.\nPress Edit to make changes.');return;}
      ttOpenTimeModal(b.task.id,'move',b.from,b.to);
    });
    evArea.appendChild(block);
  });
  renderTTTaskBank();
  if(ttNowInterval)clearInterval(ttNowInterval);
  ttNowInterval=setInterval(function(){
    var nl=document.getElementById('tt-now-line');
    if(nl){var n=ttNowIST();nl.style.top=((n.getHours()*60+n.getMinutes())/1440*100).toFixed(4)+'%';}
  },60000);
  /* Auto-scroll timeline to current time (35% from top) so user never scrolls first */
  setTimeout(function(){
    var scr=document.getElementById('tt-timeline-scroll');
    if(!scr)return;
    var nowIST2=ttNowIST();
    var scrollMin=isToday?(nowIST2.getHours()*60+nowIST2.getMinutes()):360;
    var pctTop=scrollMin/1440;
    var offset=Math.max(0,scr.scrollHeight*pctTop - scr.clientHeight*0.35);
    scr.scrollTop=offset;
  },120);
}

var ttColorChangeTaskId=null;
var ttColorChangeSelected=null;

function renderTTTaskBank(){
  ensureTT();
  var grid=document.getElementById('tt-tasks-grid');if(!grid)return;
  grid.innerHTML='';
  var dateKey=ttDateKey(ttDate);
  var todayKey=ttTodayKeyIST();
  var isPastView=dateKey<todayKey;

  /* Filter which tasks to show for this date:
     - Not soft-deleted (no deletedAt): always show
     - Soft-deleted (deletedAt set): only show on past dates where the task was actually used */
  var visibleTasks=S.ttTasks.filter(function(task){
    if(!task.deletedAt) return true; /* active task — always show */
    /* Soft-deleted: only show on past dates where it has a schedule entry */
    return isPastView&&task.schedule&&task.schedule[dateKey]&&task.schedule[dateKey].from;
  });

  if(!visibleTasks.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:12px;padding:20px">No tasks yet.<br>Click + Add to create.</div>';
    return;
  }

  visibleTasks.forEach(function(task){
    var isDeleted=!!task.deletedAt;
    var isAdded=!!(task.schedule&&task.schedule[dateKey]&&task.schedule[dateKey].from);
    /* Lock deletion ONLY if task is scheduled on today's date in section 1 */
    var isScheduledToday=!!(task.schedule&&task.schedule[todayKey]&&task.schedule[todayKey].from&&task.schedule[todayKey].to);
    var chip=document.createElement('div');
    chip.className='tt-task-chip'+(isAdded?' has-added':'');
    chip.style.borderLeftColor=task.color;
    chip.style.background=task.color+'20';
    chip.style.opacity=isDeleted?'0.55':'1';
    /* Soft-deleted chips are read-only — no drag, no delete btn */
    if(!isDeleted) chip.draggable=true;
    chip.innerHTML=
      '<div class="tt-task-chip-added-dot" title="Scheduled today"></div>'+
      (isDeleted
        ? '<span style="position:absolute;top:3px;right:4px;font-size:9px;color:var(--text3);font-style:italic">deleted</span>'
        : '<button class="tt-task-chip-del" data-tid="'+task.id+'" title="'+(isScheduledToday?'Remove from today\'s timeline first to delete':'Delete task')+'" style="'+(isScheduledToday?'color:var(--amber);cursor:not-allowed;opacity:0.7;':'')+'">'+
            (isScheduledToday?'🔒':'×')+
          '</button>'
      )+
      '<div class="tt-task-chip-name">'+esc(task.name)+'</div>'+
      (isAdded?'<div style="font-size:9px;color:var(--green);margin-top:3px;font-weight:600">✓ added</div>':'');
    if(!isDeleted){
      var delBtn=chip.querySelector('.tt-task-chip-del');
      if(delBtn){delBtn.addEventListener('click',function(e){e.stopPropagation();e.preventDefault();ttDeleteTask(this.dataset.tid);});}
      chip.addEventListener('dragstart',function(e){
        ttDragTaskId=task.id;
        e.dataTransfer.effectAllowed='copy';
        e.dataTransfer.setData('text/plain',task.id);
      });
      chip.addEventListener('dragend',function(){ttDragTaskId=null;});
      chip.addEventListener('dblclick',function(e){e.stopPropagation();ttOpenColorModal(task.id);});
    }
    grid.appendChild(chip);
  });
}

function ttOpenColorModal(taskId){
  ttColorChangeTaskId=taskId;
  var task=S.ttTasks.find(function(t){return t.id===taskId;});
  ttColorChangeSelected=task?task.color:TT_COLORS[0];
  var cp=document.getElementById('tt-color-change-picker');
  if(cp){
    cp.innerHTML='';
    TT_COLORS.forEach(function(col){
      var sw=document.createElement('div');
      sw.className='tt-color-swatch'+(col===ttColorChangeSelected?' selected':'');
      sw.style.cssText='width:34px;height:34px;border-radius:50%;background:'+col+';cursor:pointer;border:2px solid '+(col===ttColorChangeSelected?'#fff':'transparent')+';transition:all .15s;flex-shrink:0';
      sw.onclick=function(){
        ttColorChangeSelected=col;
        document.querySelectorAll('#tt-color-change-picker div').forEach(function(s){s.style.border='2px solid transparent';});
        sw.style.border='2px solid #fff';
      };
      cp.appendChild(sw);
    });
  }
  document.getElementById('tt-modal-color').classList.add('open');
}
function ttConfirmColorChange(){
  if(!ttColorChangeTaskId||!ttColorChangeSelected)return;
  var task=S.ttTasks.find(function(t){return t.id===ttColorChangeTaskId;});
  if(task){task.color=ttColorChangeSelected;saveState();closeModal('tt-modal-color');renderTTView();}
}

function ttDragOver(e){
  e.preventDefault();e.dataTransfer.dropEffect='copy';
  var ea=document.getElementById('tt-events-area');if(ea)ea.classList.add('tt-drag-over');
}
function ttDropOnTimeline(e){
  e.preventDefault();
  document.getElementById('tt-events-area').classList.remove('tt-drag-over');
  if(!ttDragTaskId)return;
  var todayKey=ttTodayKeyIST();
  var dateKey=ttDateKey(ttDate);
  var isPast=dateKey<todayKey;
  if(isPast&&!ttEditMode){alert('Past dates are read-only. Press the edit button.');return;}
  var rect=document.getElementById('tt-events-area').getBoundingClientRect();
  var relY=e.clientY-rect.top;
  var fromMin=Math.round(relY/rect.height*1440/15)*15;
  fromMin=Math.max(0,Math.min(1380,fromMin));
  var toMin=fromMin+60;
  ttOpenTimeModal(ttDragTaskId,'add',ttMinToHHMM(fromMin),ttMinToHHMM(toMin));
}

function ttStartBlockMove(e,taskId,origFromMin){
  e.preventDefault();
  ttDragBlockId=taskId;
  var startY=e.clientY;
  var origFrom=origFromMin;
  function containerH(){var ea=document.getElementById('tt-events-area');return ea?ea.getBoundingClientRect().height:1440;}
  function pxToMin(px){return Math.round(px/containerH()*1440/15)*15;}
  function onMove(ev){
    var delta=ev.clientY-startY;
    var newFrom=Math.max(0,Math.min(1380,origFrom+pxToMin(delta)));
    var block=document.querySelector('.tt-block[data-task-id="'+taskId+'"]');
    if(block)block.style.top=(newFrom/1440*100).toFixed(3)+'%';
  }
  function onUp(ev){
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
    var delta=ev.clientY-startY;
    var newFrom=Math.max(0,Math.min(1380,origFrom+pxToMin(delta)));
    var dateKey=ttDateKey(ttDate);
    var task=S.ttTasks.find(function(t){return t.id===taskId;});
    if(!task)return;
    var dur=task.schedule&&task.schedule[dateKey]?ttHHMMToMin(task.schedule[dateKey].to)-ttHHMMToMin(task.schedule[dateKey].from):60;
    var newTo=Math.min(1440,newFrom+dur);
    ttOpenTimeModal(taskId,'move',ttMinToHHMM(newFrom),ttMinToHHMM(newTo));
    ttDragBlockId=null;
  }
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
}

function ttStartResize(e,taskId,origToMin){
  e.preventDefault();
  var startY=e.clientY;
  var origTo=origToMin;
  function containerH(){var ea=document.getElementById('tt-events-area');return ea?ea.getBoundingClientRect().height:1440;}
  function pxToMin(px){return Math.round(px/containerH()*1440/15)*15;}
  function onMove(ev){
    var delta=ev.clientY-startY;
    var newTo=Math.max(origTo-840,Math.min(1440,origTo+pxToMin(delta)));
    var block=document.querySelector('.tt-block[data-task-id="'+taskId+'"]');
    if(block){
      var topPct=parseFloat(block.style.top)||0;
      var topMin=topPct/100*1440;
      block.style.height=Math.max(2,(newTo-topMin)/1440*100).toFixed(3)+'%';
    }
  }
  function onUp(ev){
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
    var delta=ev.clientY-startY;
    var newTo=Math.max(origTo-840,Math.min(1440,origTo+pxToMin(delta)));
    var task=S.ttTasks.find(function(t){return t.id===taskId;});
    var dateKey=ttDateKey(ttDate);
    var from=task&&task.schedule&&task.schedule[dateKey]?task.schedule[dateKey].from:'00:00';
    ttOpenTimeModal(taskId,'resize',from,ttMinToHHMM(newTo));
  }
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
}

function ttOpenAddTask(){
  var cp=document.getElementById('tt-color-picker');
  if(cp){
    cp.innerHTML='';
    TT_COLORS.forEach(function(col){
      var sw=document.createElement('div');sw.className='tt-color-swatch'+(col===ttSelectedColor?' selected':'');
      sw.style.background=col;
      sw.onclick=function(){
        ttSelectedColor=col;
        document.querySelectorAll('.tt-color-swatch').forEach(function(s){s.classList.remove('selected');});
        sw.classList.add('selected');
      };
      cp.appendChild(sw);
    });
  }
  var inp=document.getElementById('tt-task-name');if(inp)inp.value='';
  document.getElementById('tt-modal-add').classList.add('open');
  setTimeout(function(){var i=document.getElementById('tt-task-name');if(i)i.focus();},60);
}
function ttConfirmAddTask(){
  var name=document.getElementById('tt-task-name').value.trim();
  if(!name){alert('Enter a task name.');return;}
  ensureTT();
  S.ttTasks.push({id:uid(),name:name,color:ttSelectedColor,schedule:{}});
  saveState();closeModal('tt-modal-add');renderTTTaskBank();
}
function ttDeleteTask(id){
  var task=S.ttTasks.find(function(t){return t.id===id;});
  if(!task)return;
  var todayKey=ttTodayKeyIST();
  /* Block if used in today's Section 1 */
  var isScheduledToday=!!(task.schedule&&task.schedule[todayKey]&&task.schedule[todayKey].from&&task.schedule[todayKey].to);
  if(isScheduledToday){
    alert('Cannot delete "'+task.name+'" \u2014 it is scheduled in today\'s timeline.\n\nRemove it from today\'s timeline first (click \u00d7 on the block), then delete it here.');
    return;
  }
  if(!confirm('Remove "'+task.name+'" from the task bank?'))return;
  /* Soft-delete: mark deletedAt so today+ chips vanish but past chips (where it was used) remain */
  task.deletedAt=todayKey;
  /* Remove today and future schedule keys so it won't appear in Section 1 going forward */
  if(task.schedule){
    Object.keys(task.schedule).forEach(function(dk){
      if(dk>=todayKey)delete task.schedule[dk];
    });
  }
  saveState();renderTTView();
}

function ttOpenTimeModal(taskId,action,from,to){
  ttPendingTaskId=taskId;ttPendingAction=action;
  document.getElementById('tt-time-from').value=from;
  document.getElementById('tt-time-to').value=to;
  var title=document.getElementById('tt-modal-time-title');
  if(title)title.textContent=action==='add'?'Set time for task':action==='resize'?'Adjust end time':'Move task';
  document.querySelectorAll('input[name="tt-scope"]').forEach(function(r){r.checked=r.value==='this';});
  document.getElementById('tt-modal-time').classList.add('open');
}
function ttConfirmTime(){
  var from=document.getElementById('tt-time-from').value;
  var to=document.getElementById('tt-time-to').value;
  if(!from||!to){alert('Set both times.');return;}
  if(ttHHMMToMin(to)<=ttHHMMToMin(from)){alert('End time must be after start time.');return;}
  var scope=document.querySelector('input[name="tt-scope"]:checked').value;
  ttApplySchedule(ttPendingTaskId,from,to,scope);
  closeModal('tt-modal-time');
}
function ttApplySchedule(taskId,from,to,scope){
  var task=S.ttTasks.find(function(t){return t.id===taskId;});if(!task)return;
  if(!task.schedule)task.schedule={};
  var currentKey=ttDateKey(ttDate);
  if(scope==='this'){
    task.schedule[currentKey]={from:from,to:to};
  }else if(scope==='following'){
    var d=new Date(ttDate);
    while(true){task.schedule[ttDateKey(d)]={from:from,to:to};d.setDate(d.getDate()+1);if(d.getFullYear()>2099)break;}
  }else{
    var d2=new Date(START_DATE);
    while(true){task.schedule[ttDateKey(d2)]={from:from,to:to};d2.setDate(d2.getDate()+1);if(d2.getFullYear()>2099)break;}
    task._defaultSchedule={from:from,to:to};
  }
  saveState();renderTTView();
}

function ttOpenRemove(taskId,e){
  if(e)e.stopPropagation();
  ttPendingTaskId=taskId;
  document.querySelectorAll('input[name="tt-rm-scope"]').forEach(function(r){r.checked=r.value==='this';});
  document.getElementById('tt-modal-remove').classList.add('open');
}
function ttConfirmRemove(){
  var scope=document.querySelector('input[name="tt-rm-scope"]:checked').value;
  var task=S.ttTasks.find(function(t){return t.id===ttPendingTaskId;});
  if(!task){closeModal('tt-modal-remove');return;}
  if(!task.schedule)task.schedule={};
  var currentKey=ttDateKey(ttDate);
  if(scope==='this'){
    delete task.schedule[currentKey];
  }else if(scope==='following'){
    var d=new Date(ttDate);
    while(true){delete task.schedule[ttDateKey(d)];d.setDate(d.getDate()+1);if(d.getFullYear()>2099)break;}
  }else{task.schedule={};delete task._defaultSchedule;}
  saveState();closeModal('tt-modal-remove');renderTTView();
}

function ttNavDate(delta){
  ttEditMode=false;
  ttDate=new Date(ttDate);ttDate.setDate(ttDate.getDate()+delta);
  if(ttDate<START_DATE)ttDate=new Date(START_DATE);
  renderTTView();
}
function ttGoToToday(){
  ttEditMode=false;
  var nowIST=ttNowIST();
  ttDate=new Date(nowIST.getFullYear(),nowIST.getMonth(),nowIST.getDate());
  renderTTView();
}
function ttToggleEditMode(){
  ttEditMode=!ttEditMode;
  var btn=document.getElementById('tt-edit-btn');
  if(btn){btn.textContent=ttEditMode?'✓ Done Editing':'✏ Edit';btn.classList.toggle('editing',ttEditMode);}
  renderTTView();
}
function ttGoToDate(val){
  if(!val)return;
  var d=new Date(val);d.setHours(0,0,0,0);
  if(isNaN(d.getTime()))return;
  if(d<START_DATE)d=new Date(START_DATE);
  ttDate=d;ttEditMode=false;renderTTView();
}
function ttStartDateEdit(){
  var disp=document.getElementById('tt-date-display');
  var inp=document.getElementById('tt-date-edit-input');
  if(!disp||!inp)return;
  inp.value=ttDateKey(ttDate);
  disp.style.display='none';inp.style.display='block';inp.focus();inp.select();
}
function ttDateEditKey(e){
  if(e.key==='Enter'){ttFinishDateEdit(e.target.value.trim());}
  else if(e.key==='Escape'){ttCancelDateEdit();}
}
function ttDateEditBlur(){ttFinishDateEdit(document.getElementById('tt-date-edit-input').value.trim());}
function ttFinishDateEdit(val){
  ttCancelDateEdit();
  if(!val)return;
  var d=new Date(val);
  if(isNaN(d.getTime())){
    var parts=val.split(/[\-\/\.]/);
    if(parts.length===3){d=parts[0].length===4?new Date(parts[0]+'-'+parts[1]+'-'+parts[2]):new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);}
  }
  if(isNaN(d.getTime())){alert('Invalid date. Use YYYY-MM-DD');return;}
  d.setHours(0,0,0,0);if(d<START_DATE)d=new Date(START_DATE);
  ttDate=d;ttEditMode=false;renderTTView();
}
function ttCancelDateEdit(){
  var disp=document.getElementById('tt-date-display');
  var inp=document.getElementById('tt-date-edit-input');
  if(inp)inp.style.display='none';if(disp)disp.style.display='';
}

function ttPrintSection1(){
  var dateKey=ttDateKey(ttDate);
  var username=(CFG&&CFG.username&&CFG.username.trim())?CFG.username.trim():'Dhruv Garhwal';
  var tzLabel='India Standard Time - Kolkata';

  /* Format date */
  var dateObj=new Date(ttDate);
  var fullDateStr=dateObj.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  /* Collect scheduled blocks */
  var blocks=[];
  S.ttTasks.forEach(function(task){
    var sch=task.schedule&&task.schedule[dateKey];
    if(sch&&sch.from&&sch.to)blocks.push({name:task.name,color:task.color||'#4a8fff',from:sch.from,to:sch.to});
  });
  if(S.ttArchivedSchedules){
    S.ttArchivedSchedules.forEach(function(arc){
      if(arc.dateKey===dateKey)blocks.push({name:arc.name,color:arc.color||'#94a3b8',from:arc.from,to:arc.to});
    });
  }
  blocks.sort(function(a,b){return a.from.localeCompare(b.from);});

  /* 
   * Build a pixel-accurate absolute-positioned layout like Google Calendar.
   * Each hour = ROW_H px. We use a container with relative positioning,
   * time labels on the left, and event blocks absolutely positioned on the right.
   * This ensures perfect alignment — no table row-span juggling.
   */
  var ROW_H=26; /* px per hour — 24 hours × 26px = 624px total, fits A4 */
  var LABEL_W=44; /* px for time label column */
  var TOTAL_H=24*ROW_H;

  /* Time labels + hour grid lines HTML */
  var gridLines='';
  var timeLabels='';
  for(var hr=0;hr<24;hr++){
    var ampm=hr>=12?'pm':'am';
    var hd=hr%12||12;
    var topPx=hr*ROW_H;
    /* Hour line */
    gridLines+='<div style="position:absolute;left:0;right:0;top:'+topPx+'px;border-top:1px solid #dadce0;"></div>';
    /* Half-hour line */
    gridLines+='<div style="position:absolute;left:0;right:0;top:'+(topPx+ROW_H/2)+'px;border-top:1px dashed #f1f3f4;"></div>';
    /* Time label — vertically centred at the hour line */
    timeLabels+='<div style="position:absolute;right:6px;top:'+(topPx-7)+'px;font-size:9px;color:#70757a;line-height:1;white-space:nowrap;">'+hd+ampm+'</div>';
  }

  /* Event blocks */
  var eventBlocks='';
  blocks.forEach(function(b){
    var fromMin=ttHHMMToMin(b.from);
    var toMin=ttHHMMToMin(b.to);
    var topPx=fromMin/60*ROW_H;
    var htPx=Math.max(18,(toMin-fromMin)/60*ROW_H-2);
    var c=b.color;
    var durMins=toMin-fromMin;
    var durH=Math.floor(durMins/60);var durM=durMins%60;
    var durStr=(durH>0?(durH+'h'):'')+(durM>0?(durM+'m'):'');
    eventBlocks+=
      '<div style="position:absolute;left:3px;right:3px;top:'+topPx+'px;height:'+htPx+'px;'+
        'background:'+c+'22;border-left:3px solid '+c+';border-radius:3px;'+
        'padding:2px 6px;overflow:hidden;box-sizing:border-box;">'+
        '<div style="font-size:10px;font-weight:700;color:#202124;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">'+b.name+'</div>'+
        (htPx>22?'<div style="font-size:8px;color:#70757a;margin-top:1px;white-space:nowrap;">'+
          ttFmtTime(b.from)+' – '+ttFmtTime(b.to)+' ('+durStr+')</div>':'')+
      '</div>';
  });

  /* Summary list at top */
  var topList='';
  if(blocks.length){
    topList='<div style="margin-bottom:5mm;padding-bottom:3mm;border-bottom:1px solid #dadce0;line-height:2;flex-wrap:wrap;display:flex;gap:4px 14px;">';
    topList+=blocks.map(function(b){
      return '<span style="font-size:9px;color:#3c4043;display:inline-flex;align-items:center;gap:3px;">'+
        '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+b.color+';flex-shrink:0"></span>'+
        '<b>'+b.name+'</b>, '+ttFmtTime(b.from)+' – '+ttFmtTime(b.to)+'</span>';
    }).join('');
    topList+='</div>';
  }

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<title>'+username+' — '+fullDateStr+'</title>'+
    '<link rel="preconnect" href="https://fonts.googleapis.com">'+
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400&display=swap" rel="stylesheet">'+
    '<style>'+
    '@page{size:A4 portrait;margin:10mm 12mm 12mm 12mm}'+
    '*{box-sizing:border-box;margin:0;padding:0}'+
    'html,body{width:186mm;font-family:"DM Sans",Arial,sans-serif;background:#fff;color:#202124;font-size:10px;'+
      '-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}'+
    '.no-print{position:fixed;top:0;left:0;right:0;background:#1a73e8;padding:8px 16px;'+
      'display:flex;align-items:center;gap:14px;z-index:999;font-family:"DM Sans",Arial,sans-serif}'+
    '.print-btn{padding:6px 18px;background:#fff;color:#1a73e8;border:none;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer}'+
    '.print-hint{font-size:10px;color:rgba(255,255,255,.85)}'+
    '@media print{.no-print{display:none!important}.wrap{margin-top:0!important}}'+
    '.wrap{margin-top:44px}'+
    '.gc-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:5mm;padding-bottom:3mm;border-bottom:2px solid #dadce0}'+
    '.gc-name{font-size:16px;font-weight:600;color:#202124}'+
    '.gc-right{text-align:right}'+
    '.gc-date{font-size:11px;color:#70757a;line-height:1.6}'+
    '.gc-tz{font-size:9px;color:#9aa0a6}'+
    '</style></head><body>'+
    '<div class="no-print">'+
      '<button class="print-btn" onclick="window.print()">📁 Print / Save as PDF</button>'+
      '<span class="print-hint">A4 · Portrait · Tip: Disable headers &amp; footers in print dialog for clean output</span>'+
    '</div>'+
    '<div class="wrap">'+
      '<div class="gc-header">'+
        '<div class="gc-name">'+username+'</div>'+
        '<div class="gc-right">'+
          '<div class="gc-date">'+fullDateStr+'</div>'+
          '<div class="gc-tz">'+tzLabel+'</div>'+
        '</div>'+
      '</div>'+
      topList+
      '<div style="display:flex;width:100%;">'+
        '<div style="width:'+LABEL_W+'px;flex-shrink:0;position:relative;height:'+TOTAL_H+'px;">'+
          timeLabels+
        '</div>'+
        '<div style="flex:1;position:relative;height:'+TOTAL_H+'px;border-left:1px solid #dadce0;">'+
          gridLines+
          eventBlocks+
        '</div>'+
      '</div>'+
    '</div>'+
  '</body></html>';

  var win=window.open('','_blank');
  if(!win){alert('Popup blocked — allow popups and try again');return;}
  win.document.open();win.document.write(html);win.document.close();
  setTimeout(function(){try{win.print();}catch(e){}},900);
}

/* ═══════════════════════════════════════════════
   AUTH CONTROLLER
   Handles UI interactions for login/signup screens,
   boots the app after authentication, manages logout.
═══════════════════════════════════════════════ */
var AUTH_AVATAR_COLORS=['#4a8fff','#3fcf8e','#f5a623','#ff5c5c','#a78bfa','#38bdf8','#fb923c','#e879f9','#00ffcc','#fcd34d'];

function authPickColor(username){
  var idx=0;for(var i=0;i<username.length;i++)idx+=username.charCodeAt(i);
  return AUTH_AVATAR_COLORS[idx%AUTH_AVATAR_COLORS.length];
}

function authSwitchTab(tab){
  document.getElementById('auth-form-login').style.display=tab==='login'?'':'none';
  document.getElementById('auth-form-signup').style.display=tab==='signup'?'':'none';
  document.getElementById('auth-tab-login').classList.toggle('active',tab==='login');
  document.getElementById('auth-tab-signup').classList.toggle('active',tab==='signup');
  document.getElementById('auth-login-error').classList.remove('visible');
  document.getElementById('auth-signup-error').classList.remove('visible');
  setTimeout(function(){
    var inp=document.getElementById(tab==='login'?'auth-login-user':'auth-signup-user');
    if(inp)inp.focus();
  },80);
}

function authPreviewAvatar(){
  var username=(document.getElementById('auth-signup-user').value||'').trim().toLowerCase();
  var av=document.getElementById('auth-signup-avatar');
  if(!av)return;
  if(username){
    av.style.background=authPickColor(username);
    av.textContent=username[0].toUpperCase();
  }else{
    av.style.background='#4a8fff';
    av.textContent='?';
  }
}

function authShowError(id,msg){
  var el=document.getElementById(id);
  if(!el)return;
  el.textContent=msg;
  el.classList.add('visible');
}

function authClearErrors(){
  document.getElementById('auth-login-error').classList.remove('visible');
  document.getElementById('auth-signup-error').classList.remove('visible');
}

function authDoLogin(){
  authClearErrors();
  var user=(document.getElementById('auth-login-user').value||'').trim();
  var pass=document.getElementById('auth-login-pass').value||'';
  if(!user){authShowError('auth-login-error','Please enter your username.');return;}
  if(!pass){authShowError('auth-login-error','Please enter your password.');return;}
  var btn=document.getElementById('auth-login-btn');
  btn.disabled=true;
  btn.textContent='Signing in…';
  /* Tiny setTimeout lets the browser repaint the disabled state before the heavy hash */
  setTimeout(function(){
    var res=window.ProtocolAuth.login(user,pass);
    btn.disabled=false;
    btn.textContent='Sign In →';
    if(!res.success){
      authShowError('auth-login-error',res.error);
      document.getElementById('auth-login-pass').value='';
      return;
    }
    authEnterApp();
  },30);
}

function authDoSignup(){
  authClearErrors();
  var user=(document.getElementById('auth-signup-user').value||'').trim();
  var pass=document.getElementById('auth-signup-pass').value||'';
  var pass2=document.getElementById('auth-signup-pass2').value||'';
  if(!user){authShowError('auth-signup-error','Please choose a username.');return;}
  if(!pass){authShowError('auth-signup-error','Please choose a password.');return;}
  if(pass!==pass2){authShowError('auth-signup-error','Passwords do not match. Please try again.');return;}
  var btn=document.getElementById('auth-signup-btn');
  btn.disabled=true;
  btn.textContent='Creating account…';
  setTimeout(function(){
    var res=window.ProtocolAuth.signup(user,pass);
    if(!res.success){
      btn.disabled=false;
      btn.textContent='Create Account →';
      authShowError('auth-signup-error',res.error);
      return;
    }
    /* Auto-login after successful signup */
    var loginRes=window.ProtocolAuth.login(user,pass);
    btn.disabled=false;
    btn.textContent='Create Account →';
    if(!loginRes.success){
      authShowError('auth-signup-error','Account created! Please sign in.');
      authSwitchTab('login');
      document.getElementById('auth-login-user').value=user;
      return;
    }
    authEnterApp();
  },30);
}

async function authEnterApp(){
  /* Hide auth screen and start splash immediately for good UX */
  var authScr=document.getElementById('auth-screen');
  authScr.classList.remove('visible');
  authScr.classList.add('hidden');
  authRunSplash();
  /* CRITICAL: wait for Firestore data before booting — this is what prevents data wipe */
  if(window.ProtocolDB) await window.ProtocolDB.waitForPrefetch();
  /* Boot with real user data */
  protocolBoot();
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  var homeEl=document.getElementById('home');
  if(homeEl){homeEl.classList.remove('hidden');homeEl.classList.add('visible');}
  var u=window.ProtocolAuth.currentUser();
  if(u){
    var dot=document.getElementById('sb-user-dot');
    var nm=document.getElementById('sb-user-name');
    if(dot)dot.style.background=u.avatarColor||'#4a8fff';
    if(nm)nm.textContent=(CFG&&CFG.username)||(u.displayName||u.username);
    updateClock();
  }
}

function authRunSplash(){
  var splash=document.getElementById('splash-screen');
  var logo=document.getElementById('splash-logo');
  if(!splash||!logo)return;
  /* Reset */
  splash.classList.remove('gone','fade-out');
  splash.style.transition='none';
  logo.classList.remove('show');
  void splash.offsetWidth;
  var canvas=document.getElementById('splash-canvas');
  if(canvas){
    var ctx=canvas.getContext('2d');
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  setTimeout(function(){logo.classList.add('show');},180);
  /* Hard instant cut at 2200ms — no fade ever */
  setTimeout(function(){
    splash.classList.add('gone');
  },2200);
}

/* ─── BOOT GATE ───────────────────────────────────────────────
   Strategy: play the splash animation immediately on every load.
   It runs for ~2.4s which covers Firebase's auth restore time.
   onAuthReady fires in the background — by the time splash ends
   we know the session state and can go straight to app or auth.
──────────────────────────────────────────────────────────────── */
(function(){

  /* ── Fallback: auth.js / db.js didn't load ── */
  if(!window.ProtocolAuth||!window.ProtocolDB){
    var splash=document.getElementById('splash-screen');
    if(splash)splash.classList.add('gone');
    document.getElementById('auth-screen').innerHTML=
      '<div style="color:#f0f0f4;font-family:DM Sans,sans-serif;text-align:center;padding:40px;max-width:480px;margin:auto;">'+
      '<div style="font-family:Syne,sans-serif;font-size:28px;font-weight:800;letter-spacing:.15em;margin-bottom:16px">PRO<span style="color:#4a8fff">T</span>OCOL</div>'+
      '<div style="font-size:15px;color:#ff5c5c;margin-bottom:12px">⚠ Missing files</div>'+
      '<div style="font-size:13px;color:#8888a0;line-height:1.7">'+
      '<code>auth.js</code> and <code>db.js</code> must be in the same folder as <code>index.html</code>.<br><br>'+
      'Open via a local server or place all three files together and reload.</div>'+
      '</div>';
    document.getElementById('auth-screen').classList.add('visible');
    return;
  }

  /* The original splash IIFE (above) fires rings immediately on script load.
     authRunSplash handles logo + fade timing. Call it now. */
  authRunSplash();

  /* Boot sequence:
     1. onAuthReady  — know if logged in
     2. waitForPrefetch — Firestore data in cache  ← THE CRITICAL STEP
     3. protocolBoot — loads real data from cache
     4. _tryReveal   — show correct screen after splash */
  var _authResult = null;
  var _bootDone   = false;

  window.ProtocolAuth.onAuthReady(async function(){
    if(window.ProtocolAuth.isLoggedIn()){
      _authResult = 'in';
      /* Wait for Firestore data — prevents loading defState() instead of real data */
      if(window.ProtocolDB) await window.ProtocolDB.waitForPrefetch();
      protocolBoot();
      _bootDone = true;
    } else {
      _authResult = 'out';
      _bootDone   = true;
    }
    _tryReveal();
  });

  /* Hard cut at 2200ms — matches authRunSplash timing */
  var _splashDone = false;
  setTimeout(function(){ _splashDone = true; _tryReveal(); }, 2200);

  /* Safety net: if Firebase hasn't responded by 6s, show auth screen anyway
     so the user is never stuck on a blank screen */
  setTimeout(function(){
    if(_authResult !== null) return; // already resolved
    _authResult = 'out';
    _bootDone   = true;
    _splashDone = true;
    _tryReveal();
  }, 6000);

  function _tryReveal(){
    /* For logged-out users we don't need _bootDone — show auth immediately.
       For logged-in users wait for boot to finish so data is ready. */
    if(!_splashDone || _authResult === null) return;
    if(_authResult === 'in' && !_bootDone) return;

    if(_authResult === 'in'){
      document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
      var homeEl = document.getElementById('home');
      if(homeEl){homeEl.classList.remove('hidden');homeEl.classList.add('visible');}
      var u = window.ProtocolAuth.currentUser();
      if(u){
        var dot=document.getElementById('sb-user-dot');
        var nm=document.getElementById('sb-user-name');
        if(dot)dot.style.background=u.avatarColor||'#4a8fff';
        if(nm)nm.textContent=(CFG&&CFG.username)||(u.displayName||u.username);
      }
      updateClock();
      updateHomeStats();
}else{
  try{ applyTheme('darkblue'); }catch(e){}
  var authScr=document.getElementById('auth-screen');
  if(authScr){ authScr.classList.remove('hidden'); authScr.classList.add('visible'); }
  var inp=document.getElementById('auth-login-user');
  if(inp)setTimeout(function(){inp.focus();},100);
}
  }
})();

