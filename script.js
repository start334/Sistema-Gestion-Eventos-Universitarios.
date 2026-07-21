const K={u:'eu_users',e:'eu_events',i:'eu_enrollments',s:'eu_session'};
const defaults={users:[{id:1,name:'Administrador',email:'admin@universidad.edu',password:'123456',role:'Organizador'}],events:[{id:101,name:'Feria de Emprendimiento',date:'2026-08-12',time:'10:00',place:'Auditorio principal',capacity:80,description:'Exposición de proyectos innovadores desarrollados por estudiantes universitarios.'},{id:102,name:'Taller de Desarrollo Web',date:'2026-08-20',time:'15:00',place:'Laboratorio de informática',capacity:35,description:'Taller práctico sobre fundamentos de HTML, CSS y JavaScript.'},{id:103,name:'Jornada Deportiva',date:'2026-09-05',time:'08:30',place:'Complejo deportivo',capacity:120,description:'Encuentro deportivo para promover la integración y participación estudiantil.'}]};
const load=(k,f)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(f));
const state={users:load(K.u,defaults.users),events:load(K.e,defaults.events),enrollments:load(K.i,[]),session:load(K.s,null)};
const save=()=>{localStorage.setItem(K.u,JSON.stringify(state.users));localStorage.setItem(K.e,JSON.stringify(state.events));localStorage.setItem(K.i,JSON.stringify(state.enrollments));localStorage.setItem(K.s,JSON.stringify(state.session));};
const toast=m=>{const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)};
const fmt=d=>new Date(d+'T00:00:00').toLocaleDateString('es-EC',{day:'2-digit',month:'long',year:'numeric'});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function showSessionTransition(title,text,duration=1050){
  const currentUser=state.users.find(user=>user.id===state.session?.id);
  sessionOverlayTitle.textContent=title||'Cargando';
  sessionOverlayText.textContent=text||'Preparando tu espacio';
  sessionAvatar.src=currentUser?.avatar||avatarFor(currentUser?.role||state.session?.role);
  sessionOverlay.classList.remove('hidden','session-out','session-ready');
  void sessionOverlay.offsetWidth;
  sessionOverlay.classList.add('session-in');
  await sleep(duration);
}

async function completeSessionTransitionToGate(user){
  // La pantalla oscura permanece arriba mientras el portal se prepara debajo.
  // Así nunca se alcanza a ver el formulario, el encabezado o el pie de página entre escenas.
  openReturnPortal(user,{keepMusic:true,prepareOnly:true});
  await sleep(180);
  sessionOverlay.classList.add('session-ready');
  await sleep(280);
  sessionOverlay.classList.add('session-out');
  await sleep(900);
  sessionOverlay.classList.add('hidden');
  sessionOverlay.classList.remove('session-in','session-out','session-ready');
  returnGate.classList.add('gate-arrive');
  setTimeout(()=>returnGate.classList.remove('gate-arrive'),1100);
}
const avatarFor=role=>role==='Organizador'?'assets/avatar-organizador.webp':'assets/avatar-estudiante.png';

// Se normalizan acentos, símbolos y algunas sustituciones frecuentes para evitar insultos disfrazados.
const forbiddenWords=['puta','puto','putas','putos','mierda','mierdas','verga','vergas','pendejo','pendeja','pendejos','pendejas','maricon','maricona','cabron','cabrona','cojudo','cojuda','imbecil','idiota','malparido','malparida','hijueputa','hijodeputa','hp','fuck','bitch','shit','asshole'];
function normalizedName(value){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/0/g,'o').replace(/[1!|]/g,'i').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/[^a-z]/g,'');}
function validateName(name){
  const clean=name.trim().replace(/\s+/g,' ');
  if(clean.length<2||clean.length>45)return 'El nombre debe tener entre 2 y 45 caracteres.';
  if(!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(clean))return 'El nombre solo puede contener letras, espacios, apóstrofes o guiones.';
  const normalized=normalizedName(clean);
  if(forbiddenWords.some(word=>normalized.includes(normalizedName(word))))return 'Ese nombre contiene palabras no permitidas. Escribe un nombre respetuoso.';
  return '';
}

function authTab(t){document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===t));loginForm.classList.toggle('hidden',t!=='login');registerForm.classList.toggle('hidden',t!=='register')}
document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>authTab(b.dataset.authTab));

registerForm.onsubmit=e=>{
  e.preventDefault();
  const name=registerName.value.trim().replace(/\s+/g,' ');
  const nameError=validateName(name);
  if(nameError)return toast(nameError);
  const email=registerEmail.value.trim().toLowerCase();
  if(state.users.some(u=>u.email===email))return toast('El correo ya está registrado.');
  state.users.push({id:Date.now(),name,email,password:registerPassword.value,role:registerRole.value});
  save();e.target.reset();authTab('login');loginEmail.value=email;toast('Usuario registrado correctamente.');
};

loginForm.onsubmit=async e=>{
  e.preventDefault();
  const submitButton=loginForm.querySelector('button[type="submit"]');
  const u=state.users.find(x=>x.email===loginEmail.value.trim().toLowerCase()&&x.password===loginPassword.value);
  if(!u){
    loginForm.classList.remove('form-shake');void loginForm.offsetWidth;loginForm.classList.add('form-shake');
    return toast('Correo o contraseña incorrectos.');
  }
  submitButton.disabled=true;submitButton.textContent='Verificando...';
  state.session={id:u.id,name:u.name,email:u.email,role:u.role,avatar:u.avatar||null,profileConfigured:!!u.profileConfigured};
  save();
  await showSessionTransition('Cargando','Preparando tu espacio',900);
  submitButton.disabled=false;submitButton.textContent='Ingresar';

  if(!u.profileConfigured){
    // En la primera configuración se conserva la experiencia inicial existente.
    sessionOverlay.classList.add('session-out');
    await sleep(720);
    sessionOverlay.classList.add('hidden');
    sessionOverlay.classList.remove('session-in','session-out','session-ready');
    startProfileMusic();
    await startFirstLoginExperience(u);
  }else{
    await completeSessionTransitionToGate(u);
  }
};

logoutBtn.onclick=async()=>{
  if(logoutBtn.disabled)return;
  logoutBtn.disabled=true;
  stopProfileMusic();

  const currentUser=state.users.find(user=>user.id===state.session?.id);
  const avatar=state.session?.avatar||currentUser?.avatar||avatarFor(state.session?.role||currentUser?.role);
  const displayName=state.session?.name||currentUser?.name||'usuario';

  logoutAvatar.src=avatar;
  logoutTitle.textContent=`Hasta pronto, ${displayName}`;
  logoutText.textContent='Cerrando sesión';
  logoutOverlay.classList.remove('hidden','logout-fade','logout-compact');
  void logoutOverlay.offsetWidth;
  logoutOverlay.classList.add('logout-visible');

  await sleep(1050);
  logoutOverlay.classList.add('logout-compact');
  await sleep(650);

  state.session=null;save();render();
  document.body.classList.add('auth-return');
  await sleep(260);
  logoutOverlay.classList.add('logout-fade');
  logoutOverlay.classList.remove('logout-visible');
  await sleep(820);
  logoutOverlay.classList.add('hidden');
  logoutOverlay.classList.remove('logout-fade','logout-compact');
  setTimeout(()=>document.body.classList.remove('auth-return'),500);
  logoutBtn.disabled=false;
};
function returningMessage(user){
  const ownEnrollments=state.enrollments.filter(item=>item.userId===user.id).length;
  const studentEmpty=[
    `¡Bienvenido de nuevo, ${user.name}! Tu agenda se ve vacía sin un buen evento. ¿A cuál nos inscribimos hoy?`,
    `¡Bienvenido de nuevo, ${user.name}! Orion encontró varias experiencias esperando por ti. ¿Revisamos los eventos disponibles?`,
    `¡Bienvenido de nuevo, ${user.name}! Hoy puede ser un gran día para descubrir algo nuevo. Elige un evento y hagamos espacio en tu agenda.`
  ];
  const studentActive=[
    `¡Bienvenido de nuevo, ${user.name}! Tus próximos eventos ya te esperan. Revisemos que todo esté listo.`,
    `¡Bienvenido de nuevo, ${user.name}! Tu agenda universitaria está tomando forma. ¿Exploramos una experiencia más?`,
    `¡Bienvenido de nuevo, ${user.name}! Qué gusto verte. Tus inscripciones están preparadas para continuar.`
  ];
  const organizerMessages=[
    `¡Bienvenido de nuevo, ${user.name}! El panel está listo. Hoy podemos convertir una buena idea en el próximo evento universitario.`,
    `¡Bienvenido de nuevo, ${user.name}! Orion ha preparado el espacio de gestión. Revisemos los eventos y mantengamos todo en orden.`,
    `¡Bienvenido de nuevo, ${user.name}! Qué gusto tenerte aquí. Los estudiantes cuentan con una gran organización, comencemos.`
  ];
  const options=user.role==='Organizador'?organizerMessages:(ownEnrollments?studentActive:studentEmpty);
  return options[Math.floor(Math.random()*options.length)];
}
function updateOrionSuggestion(user){
  const message=returningMessage(user);
  if(typeof orionMessage!=="undefined"&&orionMessage){
    orionMessage.textContent=message.replace(`¡Bienvenido de nuevo, ${user.name}! `,'');
  }
  return message;
}

let selectedAvatarData=null;
let selectedAvatarMode='default';
let returnPortalBusy=false;

function openReturnPortal(user,options={}){
  const {keepMusic=false,prepareOnly=false}=options;
  loginView.classList.add('hidden');appView.classList.add('hidden');profileArea.classList.add('hidden');
  const avatar=user.avatar||avatarFor(user.role);
  gateAvatar.src=avatar;gateUserName.textContent=user.name;
  returnUserName.textContent=user.name;returnUserRole.textContent=user.role;returnAvatar.src=avatar;
  returnPortal.classList.add('hidden');
  returnGate.classList.remove('hidden','gate-exit','gate-arrive');
  if(prepareOnly)returnGate.classList.add('gate-prepared');
  else returnGate.classList.remove('gate-prepared');
  if(!keepMusic)startProfileMusic();
  else startProfileMusic();
  requestAnimationFrame(()=>returnGate.classList.remove('gate-prepared'));
}

gateProfileButton.onclick=async()=>{
  if(returnPortalBusy)return;returnPortalBusy=true;
  playSelectionSound();

  // Prepara el portal oscuro detrás del perfil antes de iniciar el desvanecido.
  // De esta forma nunca se alcanza a ver la página principal ni el pie de página.
  returnPortal.classList.remove('hidden','portal-exit','portal-enter');
  returnPortal.classList.add('portal-prepared');
  void returnPortal.offsetWidth;

  returnGate.classList.add('gate-exit');
  returnPortal.classList.add('portal-reveal');
  await sleep(760);

  returnGate.classList.add('hidden');
  returnGate.classList.remove('gate-exit');
  returnPortal.classList.remove('portal-prepared','portal-reveal');
  returnPortal.classList.add('portal-enter');
  setTimeout(()=>returnPortal.classList.remove('portal-enter'),950);
  returnPortalBusy=false;
};

returnUserCard.onclick=async()=>{
  if(returnPortalBusy)return;returnPortalBusy=true;
  playSelectionSound();
  waitAvatar.src=returnAvatar.src;
  waitOverlay.classList.remove('hidden','wait-out');
  returnPortal.classList.add('portal-exit');
  await Promise.all([fadeOutProfileMusic(),sleep(800)]);
  returnPortal.classList.add('hidden');returnPortal.classList.remove('portal-exit');
  await sleep(650);
  render();
  animateAppEntrance();
  updateOrionSuggestion(state.session);
  waitOverlay.classList.add('wait-out');
  await sleep(480);
  waitOverlay.classList.add('hidden');waitOverlay.classList.remove('wait-out');
  toast(`Bienvenido de nuevo, ${state.session.name}.`);
  returnPortalBusy=false;
};

returnAvatarUpload.onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!/^image\/(png|jpeg|webp)$/.test(file.type))return toast('Selecciona una imagen JPG, PNG o WEBP.');
  if(file.size>8*1024*1024)return toast('La imagen debe pesar menos de 8 MB.');
  try{
    playSelectionSound();
    const avatar=await resizeProfileImage(file);
    const index=state.users.findIndex(u=>u.id===state.session.id);if(index<0)return;
    state.users[index].avatar=avatar;state.session.avatar=avatar;save();
    returnAvatar.src=avatar;
    toast('Imagen de perfil actualizada. Pulsa tu usuario para comenzar.');
  }catch(_){toast('No se pudo procesar la imagen seleccionada.');}
  e.target.value='';
};

returnBackBtn.onclick=()=>{
  stopProfileMusic();state.session=null;save();
  returnPortal.classList.add('hidden');returnGate.classList.add('hidden');render();
};

function animateAppEntrance(){
  appView.classList.remove('app-arrive');void appView.offsetWidth;appView.classList.add('app-arrive');
  setTimeout(()=>appView.classList.remove('app-arrive'),1400);
}

async function startFirstLoginExperience(user){
  loginView.classList.add('hidden');profileArea.classList.add('hidden');appView.classList.add('hidden');
  welcomeOverlay.classList.remove('hidden','fade-out');
  overlayWelcome.textContent='';overlayStatus.textContent='Inicializando sistema...';
  await sleep(900);overlayStatus.textContent='Analizando datos del usuario...';
  await sleep(950);overlayStatus.textContent='Preparando tu perfil...';
  await sleep(850);overlayWelcome.textContent=`Welcome, ${user.name}`;overlayStatus.textContent='CONFIGURACIÓN INICIAL';
  await sleep(1500);welcomeOverlay.classList.add('fade-out');await sleep(800);
  welcomeOverlay.classList.add('hidden');welcomeOverlay.classList.remove('fade-out');
  openProfileChooser(user);
}

function openProfileChooser(user){
  selectedAvatarMode='default';selectedAvatarData=null;
  defaultAvatarPreview.src=avatarFor(user.role);
  defaultAvatarLabel.textContent=user.role==='Organizador'?'Perfil de organizador':'Perfil de estudiante';
  customAvatarPreview.src='';customAvatarPreview.classList.add('hidden');uploadPlaceholder.classList.remove('hidden');
  document.querySelectorAll('.profile-option').forEach(x=>x.classList.remove('selected'));
  defaultAvatarOption.classList.add('selected');
  profileChooser.classList.remove('hidden');
}

defaultAvatarOption.onclick=()=>{
  playSelectionSound();
  selectedAvatarMode='default';selectedAvatarData=null;
  document.querySelectorAll('.profile-option').forEach(x=>x.classList.remove('selected'));
  defaultAvatarOption.classList.add('selected');
};

profileUpload.onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!/^image\/(png|jpeg|webp)$/.test(file.type))return toast('Selecciona una imagen JPG, PNG o WEBP.');
  if(file.size>8*1024*1024)return toast('La imagen debe pesar menos de 8 MB.');
  try{
    playSelectionSound();
    selectedAvatarData=await resizeProfileImage(file);
    selectedAvatarMode='custom';customAvatarPreview.src=selectedAvatarData;
    customAvatarPreview.classList.remove('hidden');uploadPlaceholder.classList.add('hidden');
    document.querySelectorAll('.profile-option').forEach(x=>x.classList.remove('selected'));
    document.querySelector('.upload-option').classList.add('selected');
  }catch(_){toast('No se pudo procesar la imagen seleccionada.');}
};

function resizeProfileImage(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=reject;
    reader.onload=()=>{
      const img=new Image();img.onerror=reject;
      img.onload=()=>{
        const size=320,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
        const ctx=canvas.getContext('2d');
        const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;
        ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
        resolve(canvas.toDataURL('image/jpeg',.84));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

confirmProfileBtn.onclick=async()=>{
  const index=state.users.findIndex(u=>u.id===state.session.id);if(index<0)return;
  const avatar=selectedAvatarMode==='custom'&&selectedAvatarData?selectedAvatarData:avatarFor(state.users[index].role);
  state.users[index].avatar=avatar;state.users[index].profileConfigured=true;
  state.session.avatar=avatar;state.session.profileConfigured=true;save();
  confirmProfileBtn.disabled=true;confirmProfileBtn.textContent='Preparando tu espacio...';
  await fadeOutProfileMusic();
  profileChooser.classList.add('profile-exit');await sleep(700);profileChooser.classList.add('hidden');profileChooser.classList.remove('profile-exit');
  confirmProfileBtn.disabled=false;confirmProfileBtn.textContent='Continuar al sistema';
  render();toast('Perfil configurado correctamente.');
};

function startProfileMusic(){
  profileMusic.pause();
  profileMusic.currentTime=0;
  profileMusic.volume=.16;
  profileMusic.play().catch(()=>{
    // Algunos navegadores requieren una segunda interacción; el primer clic en un avatar lo intentará nuevamente.
  });
}
function playSelectionSound(){
  if(profileMusic.paused)startProfileMusic();
  selectionAudio.pause();selectionAudio.currentTime=0;selectionAudio.volume=.42;
  selectionAudio.play().catch(()=>{});
}
function stopProfileMusic(){profileMusic.pause();profileMusic.currentTime=0;profileMusic.volume=.16;}
function fadeOutProfileMusic(){
  return new Promise(resolve=>{
    if(profileMusic.paused){resolve();return;}
    const start=profileMusic.volume||.16;let step=0,total=24;
    const timer=setInterval(()=>{step++;profileMusic.volume=Math.max(0,start*(1-step/total));if(step>=total){clearInterval(timer);stopProfileMusic();resolve();}},45);
  });
}

document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-view]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const m={events:'eventsSection',manage:'manageSection',enrollments:'enrollmentsSection',users:'usersSection'};Object.values(m).forEach(id=>document.getElementById(id).classList.add('hidden'));document.getElementById(m[b.dataset.view]).classList.remove('hidden');});
searchEvent.oninput=renderEvents;

function render(){
  const on=!!state.session;
  loginView.classList.toggle('hidden',on);
  appView.classList.toggle('hidden',!on);
  profileArea.classList.toggle('hidden',!on);
  if(!on)return;
  const user=state.users.find(u=>u.id===state.session.id);
  const avatar=state.session.avatar||user?.avatar||avatarFor(state.session.role);
  welcomeTitle.textContent='Bienvenido, '+state.session.name;
  welcomeSubtitle.textContent=state.session.role+' · '+state.session.email;
  topUserName.textContent=state.session.name;topUserRole.textContent=state.session.role;
  topAvatar.src=avatar;welcomeAvatar.src=avatar;
  eventCount.textContent=state.events.length;enrollmentCount.textContent=state.enrollments.length;userCount.textContent=state.users.length;
  renderEvents();renderManage();renderEnrollments();renderUsers();updateOrionSuggestion(state.session);
}

function renderEvents(){const q=searchEvent.value.trim().toLowerCase();const arr=state.events.filter(e=>e.name.toLowerCase().includes(q)||e.place.toLowerCase().includes(q));eventsGrid.innerHTML=arr.length?arr.map(e=>{const used=state.enrollments.filter(x=>x.eventId===e.id).length,joined=state.enrollments.some(x=>x.eventId===e.id&&x.userId===state.session.id),free=Math.max(0,e.capacity-used);return `<article class="event-card"><div class="event-card-header"><h4>${esc(e.name)}</h4><p>${esc(e.place)}</p></div><div class="event-card-body"><div class="event-meta"><span>📅 ${fmt(e.date)}</span><span>🕒 ${e.time}</span><span>👥 ${free} cupos disponibles</span></div><p class="event-description">${esc(e.description)}</p><button class="btn ${joined?'secondary':'primary'}" onclick="enroll(${e.id})" ${joined||free===0?'disabled':''}>${joined?'Ya inscrito':free===0?'Sin cupos':'Inscribirme'}</button></div></article>`}).join(''):'<div class="empty-state">No se encontraron eventos.</div>';}
window.enroll=id=>{if(state.enrollments.some(x=>x.eventId===id&&x.userId===state.session.id))return;state.enrollments.push({id:Date.now(),eventId:id,userId:state.session.id});save();render();toast('Inscripción registrada correctamente.');};
eventForm.onsubmit=e=>{e.preventDefault();const obj={id:eventId.value?Number(eventId.value):Date.now(),name:eventName.value.trim(),date:eventDate.value,time:eventTime.value,place:eventPlace.value.trim(),capacity:Number(eventCapacity.value),description:eventDescription.value.trim()};const n=state.events.findIndex(x=>x.id===obj.id);n>=0?state.events[n]=obj:state.events.push(obj);save();resetForm();render();toast(n>=0?'Evento actualizado correctamente.':'Evento creado correctamente.');};
function renderManage(){manageEventList.innerHTML=state.events.length?state.events.map(e=>`<div class="list-item"><div><h4>${esc(e.name)}</h4><p>${fmt(e.date)} · ${e.time} · ${esc(e.place)}</p></div><div class="list-actions"><button class="btn secondary" onclick="editEvent(${e.id})">Editar</button><button class="btn danger" onclick="deleteEvent(${e.id})">Eliminar</button></div></div>`).join(''):'<div class="empty-state">No existen eventos.</div>';}
window.editEvent=id=>{const e=state.events.find(x=>x.id===id);eventId.value=e.id;eventName.value=e.name;eventDate.value=e.date;eventTime.value=e.time;eventPlace.value=e.place;eventCapacity.value=e.capacity;eventDescription.value=e.description;eventFormTitle.textContent='Editar evento';cancelEditBtn.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});};
window.deleteEvent=id=>{if(!confirm('¿Deseas eliminar este evento?'))return;state.events=state.events.filter(x=>x.id!==id);state.enrollments=state.enrollments.filter(x=>x.eventId!==id);save();render();toast('Evento eliminado correctamente.');};
function resetForm(){eventForm.reset();eventId.value='';eventCapacity.value=30;eventFormTitle.textContent='Crear nuevo evento';cancelEditBtn.classList.add('hidden');}cancelEditBtn.onclick=resetForm;
function renderEnrollments(){const arr=state.enrollments.filter(x=>x.userId===state.session.id);enrollmentsList.innerHTML=arr.length?arr.map(x=>{const e=state.events.find(y=>y.id===x.eventId);return e?`<div class="list-item"><div><h4>${esc(e.name)}</h4><p>${fmt(e.date)} · ${e.time} · ${esc(e.place)}</p></div><button class="btn danger" onclick="cancelEnrollment(${x.id})">Cancelar inscripción</button></div>`:''}).join(''):'<div class="empty-state">Todavía no tienes inscripciones.</div>';}
window.cancelEnrollment=id=>{state.enrollments=state.enrollments.filter(x=>x.id!==id);save();render();toast('Inscripción cancelada.');};
function renderUsers(){
  const canManage=state.session?.role==='Organizador';
  resetUsersBtn.classList.toggle('hidden',!canManage);
  resetUsersHelp.classList.toggle('hidden',!canManage);
  usersList.innerHTML=state.users.map(u=>`<div class="list-item"><div><h4>${esc(u.name)}</h4><p>${esc(u.email)}</p></div><div class="list-actions"><span class="badge">${esc(u.role)}</span>${canManage&&u.id!==1?`<button class="btn danger" onclick="deleteUser(${u.id})">Eliminar</button>`:''}</div></div>`).join('');
}
window.deleteUser=id=>{
  const user=state.users.find(u=>u.id===id);if(!user)return;
  if(!confirm(`¿Deseas eliminar al usuario ${user.name}?`))return;
  state.users=state.users.filter(u=>u.id!==id);
  state.enrollments=state.enrollments.filter(item=>item.userId!==id);
  save();render();toast('Usuario eliminado correctamente.');
};
resetUsersBtn.onclick=()=>{
  if(!confirm('Esto eliminará todos los usuarios creados, sus inscripciones y reiniciará el perfil del administrador. ¿Deseas continuar?'))return;
  state.users=JSON.parse(JSON.stringify(defaults.users));
  state.enrollments=[];
  state.session=null;
  localStorage.removeItem(K.s);
  save();stopProfileMusic();render();
  toast('Usuarios restablecidos. Ya puedes probar nuevamente desde el inicio.');
};
render();
