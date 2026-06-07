# Build a self-contained HTML for "Pre-Site Monitor (DTA)" that opens on any machine.
# Embeds the 289-cluster dataset (with real PAC coords) + renders the views with
# React UMD + Babel + Tailwind + Leaflet (all from CDN; needs internet for those + map tiles).
# Run: python build_dta_html.py  -> PreSiteMonitorDTA.html
import json

clusters = json.load(open('_export_clusters.json', encoding='utf-8'))
AS_OF = '2026-05-30'
DATA_JSON = json.dumps(clusters, ensure_ascii=False)

HTML = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pre-Site Monitor (DTA) — Cluster Lifecycle</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" />
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  /* Match ACE UI Kit typography: Inter for UI, JetBrains Mono for numerics */
  html,body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5f7fb;color:#0f172a;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  .mono{font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
  ::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}
</style>
</head>
<body>
<div id="root"></div>
<script>window.__DATA__ = __DATA_PLACEHOLDER__; window.__AS_OF__ = "__ASOF_PLACEHOLDER__";</script>
<script type="text/babel" data-presets="react">
const { useState, useMemo, useEffect, useRef } = React
const CLUSTERS = window.__DATA__
const AS_OF = window.__AS_OF__

const BRAND='#2447d8', GREEN='#16a34a', AMBER='#d97706', RED='#dc2626', PURPLE='#7c3aed', SLATE='#64748b'
const MILESTONES=[
 {id:1,key:'site_onair',label:'Site OnAir',short:'Site',zone:'A'},
 {id:2,key:'dt_gen',label:'DT Route Gen',short:'DT-G',zone:'A'},
 {id:3,key:'dt_approved',label:'DT Route Appr',short:'DT-A',zone:'A'},
 {id:4,key:'cluster_ready',label:'Cluster Ready',short:'Ready',zone:'A'},
 {id:5,key:'init_test',label:'Initial Test',short:'Init',zone:'B'},
 {id:6,key:'pa_open',label:'PA Open Discuss',short:'PA-O',zone:'B'},
 {id:7,key:'pay_40',label:'Payment 40%',short:'40%',zone:'B',isPay:true},
 {id:8,key:'pa_loop',label:'PA Loop (R1-R6)',short:'Loop',zone:'B'},
 {id:9,key:'tuning_closed',label:'Tuning Closed',short:'Tune',zone:'C'},
 {id:10,key:'pac_test',label:'PAC Test',short:'PAC-T',zone:'C'},
 {id:11,key:'pac_submit',label:'PAC Submit',short:'PAC-S',zone:'C'},
 {id:12,key:'pac_approved',label:'PAC Approved',short:'60%',zone:'C',isPay:true},
]
const PA_LOOP_MAX=6
const AS_OF_DATE=new Date(AS_OF+'T00:00:00')
const dayDiff=(a,b)=>Math.round((a-b)/86400000)
const toDate=s=>new Date(s+'T00:00:00')
const fmtDate=d=>d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):null
const healthColor=h=>h==='green'?GREEN:h==='amber'?AMBER:RED
const HEALTH_LABEL={green:'HEALTHY',amber:'WATCH',red:'AT RISK'}
const VAR_MS=[12,9,6]
function variance(c){
  const p=c.plan||{},a=c.dates||{}
  for(const m of VAR_MS) if(p[m]&&a[m]) return {days:dayDiff(toDate(a[m]),toDate(p[m])),done:true}
  for(const m of [...VAR_MS].reverse()) if(p[m]&&!a[m]) return {days:dayDiff(AS_OF_DATE,toDate(p[m])),done:false}
  return null
}
function VBadge({v}){
  if(!v) return null
  const d=v.days
  if(v.done){ if(d<=0) return <Badge tone="green">{Math.abs(d)}d ahead</Badge>; return <Badge tone={d>7?'red':'amber'}>{d}d behind</Badge> }
  if(d>0) return <Badge tone="red">{d}d overdue</Badge>
  return <Badge tone="slate">{Math.abs(d)}d left</Badge>
}
function milestoneDates(c){
  const real=c.dates||{},out={}
  MILESTONES.forEach(m=>{ out[m.id]= real[m.id]?toDate(real[m.id]):null })
  return out
}
const TONE={green:'bg-emerald-50 text-emerald-700 border-emerald-200',red:'bg-rose-50 text-rose-700 border-rose-200',blue:'bg-blue-50 text-blue-700 border-blue-200',amber:'bg-amber-50 text-amber-700 border-amber-200',purple:'bg-purple-50 text-purple-700 border-purple-200',slate:'bg-slate-100 text-slate-600 border-slate-200'}
function Badge({tone='slate',children}){ return <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[.62rem] font-bold '+(TONE[tone]||TONE.slate)}>{children}</span> }
function Card({children,className=''}){ return <div className={'rounded-2xl border border-slate-200 bg-white shadow-sm '+className}>{children}</div> }
function Stat({label,value,accent}){ return <Card className="p-4"><div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div><div className="mt-2 text-3xl font-black" style={accent?{color:accent}:null}>{value}</div></Card> }
function Bar({value,color}){ const w=Math.max(0,Math.min(100,value)); return <div className="h-2.5 flex-1 rounded-full bg-slate-200 overflow-hidden"><div className="h-full rounded-full" style={{width:w+'%',background:color}}/></div> }

const NAV=[
 {id:'EXEC',label:'Executive Summary'},
 {id:'TIMELINE',label:'Cluster Timeline'},
 {id:'BOARD',label:'Owner Board'},
 {id:'FUNNEL',label:'Pipeline Funnel'},
 {id:'MAP',label:'Map View'},
]

function App(){
  const [tab,setTab]=useState('EXEC')
  const [drawer,setDrawer]=useState(null)
  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl text-white font-black" style={{background:'linear-gradient(135deg,#2447d8,#c73b32)'}}>DTA</div>
          <div><div className="text-sm font-black">Pre-Site (DTA)</div><div className="text-[11px] font-bold text-slate-400">TRUE-MERGE · EAS</div></div>
        </div>
        <nav className="mt-8 space-y-1.5">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} className={'flex w-full items-center rounded-2xl px-4 py-2.5 text-left text-sm font-black '+(tab===n.id?'bg-blue-50 text-blue-700':'text-slate-500 hover:bg-slate-50')}>{n.label}</button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] font-semibold text-slate-500">{CLUSTERS.length} clusters · snapshot {AS_OF}</div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-5 py-3 backdrop-blur lg:px-8">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Project · TRUE-MERGE</div>
          <div className="text-sm font-black">Pre-Site Monitor (DTA) — offline export</div>
        </header>
        <div className="px-5 py-6 lg:px-8">
          <div className="mb-4 flex gap-1 overflow-x-auto lg:hidden">
            {NAV.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={'rounded-xl px-3 py-2 text-xs font-black '+(tab===n.id?'bg-blue-600 text-white':'bg-white text-slate-500')}>{n.label}</button>)}
          </div>
          <div className="mb-5"><div className="text-[11px] font-black uppercase tracking-widest text-blue-600">Cluster Lifecycle</div><h1 className="mt-1 text-2xl font-black">{NAV.find(n=>n.id===tab).label}</h1></div>
          {tab==='EXEC'&&<Exec onOpen={setDrawer}/>}
          {tab==='TIMELINE'&&<Timeline onOpen={setDrawer}/>}
          {tab==='BOARD'&&<Board onOpen={setDrawer}/>}
          {tab==='FUNNEL'&&<Funnel/>}
          {tab==='MAP'&&<MapView onOpen={setDrawer}/>}
        </div>
      </div>
      {drawer&&<Drawer c={drawer} onClose={()=>setDrawer(null)}/>}
    </div>
  )
}

function Stepper({phase,health,paRound}){
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-3 h-1 rounded bg-slate-200"/>
      <div className="absolute left-0 top-3 h-1 rounded" style={{width:Math.max(0,(phase-1)/11*100)+'%',background:'linear-gradient(90deg,'+GREEN+','+BRAND+')'}}/>
      <div className="relative flex items-start justify-between">
        {MILESTONES.map(m=>{
          const done=m.id<phase, here=m.id===phase
          const color=done?GREEN:here?(health==='red'?RED:health==='amber'?AMBER:BRAND):'#cbd5e1'
          const showR=m.key==='pa_loop'&&paRound>0&&phase>=m.id
          return (
            <div key={m.id} className="flex flex-col items-center" style={{width:(100/12)+'%'}}>
              <div className="grid h-6 w-6 place-items-center rounded-full border-2 text-[.6rem] font-black text-white" style={{background:showR?PURPLE:(done||here?color:'white'),borderColor:showR?PURPLE:color}}>{showR?paRound:done?'✓':''}</div>
              <div className={'mt-1.5 text-[.55rem] font-bold '+(showR?'text-purple-700':here?'text-blue-700':done?'text-slate-600':'text-slate-300')}>{showR?('R'+paRound+'/'+PA_LOOP_MAX):m.short}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ClusterCard({c,onOpen}){
  const dates=milestoneDates(c)
  return (
    <div onClick={()=>onOpen(c)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-black">{c.code}</div>
        <Badge tone={c.health==='green'?'green':c.health==='amber'?'amber':'red'}>{HEALTH_LABEL[c.health]}</Badge>
        {c.pa_round>0&&<Badge tone="purple">PA R{c.pa_round}/{PA_LOOP_MAX}</Badge>}
        <VBadge v={variance(c)}/>
      </div>
      <div className="mt-1 text-[11px] font-bold text-slate-500">{c.owner} · Target {c.target_month} · {c.site_count} sites · {Math.round(c.readiness*100)}%{c.geo?'':' · approx'}</div>
      <div className="mt-5"><Stepper phase={c.current_phase} health={c.health} paRound={c.pa_round}/></div>
      <div className="mt-4 flex gap-5 text-xs">
        <div><div className="text-[10px] font-black uppercase text-slate-400">Phase</div><div className="font-black" style={{color:healthColor(c.health)}}>{MILESTONES[c.current_phase-1].label}</div></div>
        <div><div className="text-[10px] font-black uppercase text-slate-400">Age</div><div className="font-black">{c.age_total}d</div></div>
        <div><div className="text-[10px] font-black uppercase text-slate-400">Stuck</div><div className="font-black" style={{color:c.age_at_phase>7?RED:SLATE}}>{c.age_at_phase}d</div></div>
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">Status: {c.status}</div>
    </div>
  )
}

function Timeline({onOpen}){
  const [owner,setOwner]=useState('ALL'),[health,setHealth]=useState('ALL'),[q,setQ]=useState('')
  const owners=useMemo(()=>[...new Set(CLUSTERS.map(c=>c.owner))].sort(),[])
  const list=CLUSTERS.filter(c=>{
    if(owner!=='ALL'&&c.owner!==owner) return false
    if(health==='RISK'&&c.health==='green') return false
    if(health==='DONE'&&c.current_phase<12) return false
    if(health==='EARLY'&&c.current_phase>=5) return false
    if(q&&!c.code.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })
  return (
    <div className="grid gap-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search EAS code..." className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none"/>
        <select value={owner} onChange={e=>setOwner(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"><option value="ALL">All DTA</option>{owners.map(o=><option key={o}>{o}</option>)}</select>
        <select value={health} onChange={e=>setHealth(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"><option value="ALL">All Status</option><option value="DONE">Done</option><option value="RISK">At Risk</option><option value="EARLY">Early Stage</option></select>
        <div className="ml-auto text-xs font-black text-slate-500"><span className="text-blue-700 text-base">{list.length}</span> clusters</div>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{list.map(c=><ClusterCard key={c.code} c={c} onOpen={onOpen}/>)}</div>
    </div>
  )
}

function Exec({onOpen}){
  const total=CLUSTERS.length
  const done=CLUSTERS.filter(c=>c.current_phase>=12).length
  const atRisk=CLUSTERS.filter(c=>c.health!=='green').length
  const avgLife=Math.round(CLUSTERS.reduce((s,c)=>s+(c.age_total||0),0)/total)
  let wp=0,op=0; CLUSTERS.forEach(c=>{const v=variance(c);if(v){wp++;if(v.days<=0)op++}})
  const onPlan=wp?Math.round(op/wp*100):0
  const owners=[...new Set(CLUSTERS.map(c=>c.owner))]
  const board=owners.map(o=>{const l=CLUSTERS.filter(c=>c.owner===o);const d=l.filter(c=>c.current_phase>=12).length;return{o,total:l.length,done:d,risk:l.filter(c=>c.health!=='green').length,pct:Math.round(d/l.length*100)}}).sort((a,b)=>b.pct-a.pct)
  const risks=CLUSTERS.filter(c=>c.health!=='green').map(c=>({c,v:variance(c)})).sort((a,b)=>(b.v?.days??0)-(a.v?.days??0)).slice(0,6)
  const prog=Math.round(done/total*100)
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Overall Progress" value={prog+'%'} accent={BRAND}/>
        <Stat label="On-Plan Rate" value={onPlan+'%'} accent={GREEN}/>
        <Stat label="At-Risk Clusters" value={atRisk} accent={RED}/>
        <Stat label="Avg Cluster Life" value={avgLife+'d'}/>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 text-xs font-black uppercase tracking-wide text-slate-500">🏆 Owner Leaderboard</div>
          <div className="grid gap-2">{board.map((b,i)=>(
            <div key={b.o} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
              <span className="w-6 text-center font-black">{['🥇','🥈','🥉'][i]||i+1}</span>
              <span className="flex-1 text-sm font-bold">{b.o}</span>
              {b.risk>0&&<Badge tone="red">{b.risk}</Badge>}
              <span className="mono text-xs font-bold text-slate-400">{b.done}/{b.total}</span>
              <div className="flex w-24 items-center"><Bar value={b.pct} color={b.pct>=80?GREEN:b.pct>=50?AMBER:RED}/></div>
              <span className="mono w-10 text-right text-xs font-black">{b.pct}%</span>
            </div>))}</div>
        </Card>
        <Card className="p-5">
          <div className="mb-4 text-xs font-black uppercase tracking-wide text-slate-500">🚨 Top Risks</div>
          <div className="grid gap-2">{risks.map(({c,v})=>(
            <button key={c.code} onClick={()=>onOpen(c)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:shadow-md">
              <span className="h-9 w-1.5 rounded-full" style={{background:healthColor(c.health)}}/>
              <div className="min-w-0 flex-1"><div className="text-sm font-black">{c.code}</div><div className="truncate text-[11px] font-bold text-slate-400">{c.owner} · {c.status}</div></div>
              <VBadge v={v}/>
            </button>))}</div>
        </Card>
      </div>
    </div>
  )
}

function Board({onOpen}){
  const owners=[...new Set(CLUSTERS.map(c=>c.owner))].sort()
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {owners.map(o=>{
        const list=CLUSTERS.filter(c=>c.owner===o).sort((a,b)=>(variance(b)?.days??-999)-(variance(a)?.days??-999))
        const risk=list.filter(c=>c.health!=='green').length, done=list.filter(c=>c.current_phase>=12).length
        return (
          <div key={o} className="rounded-2xl border border-slate-200 bg-slate-50/60">
            <div className="rounded-t-2xl border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between"><div className="text-sm font-black">{o}</div><span className="mono text-xs font-black text-slate-500">{list.length}</span></div>
              <div className="mt-2 flex gap-1.5"><Badge tone="green">{done} done</Badge>{risk>0&&<Badge tone="red">{risk} risk</Badge>}</div>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-3">{list.map(c=>(
              <button key={c.code} onClick={()=>onOpen(c)} className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:shadow-md">
                <div className="flex items-center justify-between"><span className="text-sm font-black">{c.code}</span><span className="h-2.5 w-2.5 rounded-full" style={{background:healthColor(c.health)}}/></div>
                <div className="mt-1 text-[11px] font-bold text-slate-400">{MILESTONES[c.current_phase-1].label}</div>
                <div className="mt-2 flex gap-1">{c.pa_round>0&&<Badge tone="purple">R{c.pa_round}</Badge>}<VBadge v={variance(c)}/></div>
              </button>))}</div>
          </div>
        )
      })}
    </div>
  )
}

function Funnel(){
  const total=CLUSTERS.length
  const b=MILESTONES.map(m=>({...m,reached:CLUSTERS.filter(c=>c.current_phase>=m.id).length,current:CLUSTERS.filter(c=>c.current_phase===m.id).length}))
  const zt={A:BRAND,B:AMBER,C:GREEN}
  const bn=b.filter(x=>x.id<12).reduce((a,x)=>x.current>a.current?x:a,{current:0})
  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Pipeline Funnel — clusters reaching each stage</div>
        <p className="mb-4 text-[11px] font-semibold text-slate-400">Bar = % of {total} clusters that reached this stage. Pill = how many sit here now.</p>
        <div className="grid gap-2">{b.map(x=>{const w=x.reached/total*100;return(
          <div key={x.id} className="flex items-center gap-3">
            <div className="w-44 shrink-0"><div className="text-xs font-black">{x.id}. {x.label}</div><div className="text-[10px] font-bold text-slate-400">Zone {x.zone}{x.isPay?' · 💰':''}</div></div>
            <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-slate-100"><div className="flex h-full items-center rounded-lg px-3 text-xs font-black text-white" style={{width:Math.max(w,6)+'%',background:zt[x.zone]}}>{x.reached} ({Math.round(w)}%)</div></div>
            <div className="w-28 shrink-0 text-right">{x.current>0?<Badge tone={x.id===12?'green':x.current>=10?'red':x.current>3?'amber':'slate'}>{x.current} here now</Badge>:<span className="text-[11px] text-slate-300">—</span>}</div>
          </div>)})}</div>
      </Card>
      <Card className="border-dashed bg-amber-50/50 p-4 text-xs font-bold text-amber-800">🚨 Bottleneck: <b>{bn.current}</b> clusters stuck at <b>{bn.label}</b>.</Card>
    </div>
  )
}

function MapView({onOpen}){
  const ref=useRef(null), mapRef=useRef(null), layerRef=useRef(null)
  const [q,setQ]=useState('')
  const rows=CLUSTERS.filter(c=>!q||c.code.toLowerCase().includes(q.toLowerCase())||(c.status||'').toLowerCase().includes(q.toLowerCase())||(c.owner||'').toLowerCase().includes(q.toLowerCase()))
  const geoRows=rows.filter(c=>c.lat&&c.lng)
  useEffect(()=>{
    if(!window.L||mapRef.current) return
    const map=L.map(ref.current).setView([13.79,100.6],8)
    mapRef.current=map; layerRef.current=L.layerGroup().addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map)
    setTimeout(()=>map.invalidateSize(),200)
  },[])
  useEffect(()=>{
    const map=mapRef.current,layer=layerRef.current; if(!map||!layer) return
    layer.clearLayers()
    const SC={green:GREEN,amber:AMBER,red:RED}
    geoRows.forEach(c=>{const col=SC[c.health]||BRAND;L.circleMarker([c.lat,c.lng],{radius:8,color:col,fillColor:col,fillOpacity:.85,weight:2}).addTo(layer).bindPopup('<b>'+c.code+'</b><br>'+c.owner+'<br>'+MILESTONES[c.current_phase-1].label)})
    if(geoRows.length){const bb=L.latLngBounds(geoRows.map(c=>[c.lat,c.lng]));map.fitBounds(bb.pad(0.15))}
  },[q])
  return (
    <div className="grid gap-4 xl:grid-cols-[2.4fr_.6fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div><div className="text-sm font-black">Cluster Geo View</div><div className="text-xs font-bold text-slate-500">{geoRows.length} shown · real PAC coords</div></div>
        </div>
        <div className="border-b border-slate-200 px-4 py-3"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search PAC cluster / status / DTA..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none"/></div>
        <div ref={ref} style={{height:'72vh'}}/>
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">{q?('Results ('+rows.length+')'):'At-Risk Clusters'}</div>
        <div className="grid max-h-[68vh] gap-2 overflow-y-auto">{(q?rows:rows.filter(c=>c.health!=='green')).map(c=>(
          <button key={c.code} onClick={()=>onOpen(c)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:shadow-md">
            <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{background:healthColor(c.health)}}>📍</span>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="text-sm font-black">{c.code}</span>{!c.geo&&<Badge tone="slate">approx</Badge>}</div><div className="truncate text-[11px] font-bold text-slate-400">{c.owner} · {c.site_count} sites</div></div>
            <VBadge v={variance(c)}/>
          </button>))}</div>
      </Card>
    </div>
  )
}

function Drawer({c,onClose}){
  const dates=milestoneDates(c)
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
          <div><div className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Cluster Detail</div><div className="text-xl font-black">{c.code}</div><div className="text-xs font-bold text-slate-500">{c.owner} · {c.site_count} sites · Started {c.started}</div></div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-1.5 font-black">✕</button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <Card className="bg-slate-50 p-5"><Stepper phase={c.current_phase} health={c.health} paRound={c.pa_round}/></Card>
          <div className="grid grid-cols-3 gap-3"><Stat label="Total Age" value={c.age_total+'d'}/><Stat label="Stuck" value={c.age_at_phase+'d'} accent={c.age_at_phase>7?RED:SLATE}/><Stat label="PA Round" value={c.pa_round?(c.pa_round+'/'+PA_LOOP_MAX):'—'}/></div>
          <div className="grid gap-2">{MILESTONES.map(m=>{const done=m.id<c.current_phase,here=m.id===c.current_phase;return(
            <div key={m.id} className={'flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 '+(here?'ring-2 ring-blue-200':'')}>
              <div className="grid h-8 w-8 place-items-center rounded-full text-xs font-black" style={{background:done?GREEN:here?BRAND:'#e2e8f0',color:done||here?'#fff':SLATE}}>{m.id}</div>
              <div className="flex-1"><div className="text-sm font-black">{m.label}</div><div className="text-[10px] font-bold text-slate-400">Zone {m.zone}{m.isPay?' · Payment':''}</div></div>
              <div className="text-right"><div className="text-xs font-black" style={{color:dates[m.id]?'#334155':'#cbd5e1'}}>{fmtDate(dates[m.id])||'—'}</div><Badge tone={done?'green':here?'blue':'slate'}>{done?'DONE':here?'CURRENT':'PENDING'}</Badge></div>
            </div>)})}</div>
          <Card className="bg-slate-50 p-4 text-sm font-bold text-slate-700">Status: {c.status}</Card>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>)
</script>
</body>
</html>'''

out = HTML.replace('__DATA_PLACEHOLDER__', DATA_JSON).replace('__ASOF_PLACEHOLDER__', AS_OF)
open('PreSiteMonitorDTA.html', 'w', encoding='utf-8').write(out)
print('Wrote PreSiteMonitorDTA.html', len(out), 'bytes ·', len(clusters), 'clusters')
