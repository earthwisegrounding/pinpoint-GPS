import {getReveal, mediaElement} from './api.js';
const $ = id => document.getElementById(id);
const initial = [47.5,-120.8];
let map;
if (window.L) {
  map = L.map('map', {zoomControl:false, attributionControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false, boxZoom:false, keyboard:false}).setView(initial,6);
  const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:19, attribution:'Imagery © Esri, Maxar, Earthstar Geographics, USDA, USGS, GIS User Community'}).addTo(map);
  tiles.on('tileerror',()=>{$('map-error').hidden=false;});
  tiles.on('tileload',()=>{$('map-error').hidden=true;});
} else $('map-error').hidden = false;
let running = false;
let chosen = {url:'media/got-you.mp4',mime:'video/mp4'};
let revealMedia;
const revealReady = getReveal().then(value=>{if(value) chosen=value;}).catch(()=>{});
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stages = [
  {center:initial,zoom:6,title:'Acquiring signal',name:'Washington, USA',alt:'850 KM',radius:'STATEWIDE',progress:12,step:0},
  {center:[47.6,-122.9],zoom:8,title:'Resolving regional signal',name:'Western Washington',alt:'210 KM',radius:'80 MI',progress:30,step:0},
  {center:[47.62,-122.68],zoom:10,title:'Narrowing search area',name:'Kitsap County',alt:'52 KM',radius:'20 MI',progress:51,step:1},
  {center:[47.5665,-122.637],zoom:13,title:'Refining coordinates',name:'Bremerton, Washington',alt:'6.5 KM',radius:'2 MI',progress:74,step:1},
  // A fixed public waterfront target, never an address inferred from a phone number.
  {center:[47.5624,-122.6264],zoom:17,title:'Determining final location',name:'Bremerton, Washington',alt:'400 M',radius:'250 FT',progress:93,step:2},
  {center:[47.5624,-122.6264],zoom:19,title:'Location determined',name:'Target acquired',alt:'100 M',radius:'25 FT',progress:100,step:3}
];
function showStage(stage) {
  if(map) map.flyTo(stage.center,stage.zoom,{duration:reducedMotion?0:stage.progress===100?0.8:1.8,animate:!reducedMotion});
  $('stage-title').textContent=stage.title.toUpperCase();$('percent').textContent=`${stage.progress}%`;$('progress').style.width=`${stage.progress}%`;
  $('region-name').textContent=stage.name;$('coordinates').textContent=`${stage.center[0].toFixed(4)}° N   ${Math.abs(stage.center[1]).toFixed(4)}° W`;
  $('zoom-label').textContent=`ALTITUDE / ${stage.alt}`;$('radius').textContent=`SEARCH RADIUS / ${stage.radius}`;$('map-status').textContent=stage.progress===100?'SIGNAL LOCKED':'SCANNING';
  for(let i=0;i<3;i++){const el=$(`step-${i}`);el.className=i<stage.step?'done':i===stage.step?'active':'';el.querySelector('b').textContent=i<stage.step?'✓':i===stage.step?'•••':'—';}
  if(stage.progress===100){document.body.classList.add('locked');$('target-label').textContent='LOCATION CONFIRMED';}
}
function fallback(){const el=document.createElement('div');el.className='reveal-fallback';el.textContent='GOT YOU! 😎';$('reveal-media').replaceChildren(el);}
async function start(raw) {
  if(running) return {started:false,reason:'A sequence is already running.'};
  let digits=raw.replace(/\D/g,'');if(digits.length===11&&digits[0]==='1')digits=digits.slice(1);
  if(digits.length!==10 || !/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)){ $('phone-error').textContent='Enter a valid 10-digit US phone number.';return {started:false,reason:'Invalid US number'}; }
  $('phone-error').textContent='';running=true;$('locate').disabled=true;$('phone').disabled=true;$('locate').firstChild.textContent='Locating phone ';
  document.body.classList.add('scanning');$('region-type').textContent=['360','564'].includes(digits.slice(0,3))?'REGIONAL MATCH / WESTERN WASHINGTON':'SEARCH REGION / WASHINGTON';
  if(matchMedia('(max-width: 720px)').matches) document.querySelector('.map-panel').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
  await revealReady;
  revealMedia=mediaElement(chosen.url,chosen.mime);revealMedia.addEventListener('error',fallback,{once:true});$('reveal-media').replaceChildren(revealMedia);
  // The number is used only for the local area-code label, never sent or stored.
  $('phone').value='';digits='';
  for(const stage of stages){showStage(stage);await pause(stage.progress===100?1100:2300);}
  $('reveal').showModal();
  if(revealMedia.play){revealMedia.muted=false;revealMedia.play().catch(()=>{revealMedia.muted=true;revealMedia.play().catch(()=>{});});}
  document.body.classList.remove('scanning');$('again').focus();return {started:true,revealed:true};
}
function reset(){
  if(revealMedia?.pause)revealMedia.pause();$('reveal').close();running=false;document.body.classList.remove('locked','scanning');$('phone').disabled=false;$('locate').disabled=false;$('locate').firstChild.textContent='Locate phone ';
  showStage({...stages[0],progress:0,step:-1,title:'Awaiting phone number'});$('map-status').textContent='STANDBY';$('region-type').textContent='INITIAL SEARCH REGION';$('target-label').textContent='SEARCH AREA';$('phone').focus();
}
$('locate-form').addEventListener('submit',event=>{event.preventDefault();void start($('phone').value);});$('again').addEventListener('click',reset);$('reveal').addEventListener('cancel',event=>{event.preventDefault();reset();});
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'run_phone_location_prank',description:'Run the simulated Washington satellite zoom and prank reveal. Does not track a phone.',inputSchema:{type:'object',properties:{phone:{type:'string'}},required:['phone'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(typeof input?.phone!=='string')throw new Error('phone must be a string');return start(input.phone);}})).catch(()=>{});}catch{}}
