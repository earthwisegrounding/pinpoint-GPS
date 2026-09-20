import {configured, request, getReveal, mediaElement, allowedTypes} from '../api.js';
const $ = id => document.getElementById(id);
let token=null,expires=0,selected=null,objectUrl=null,current=null;
function message(text,error=false){$('message').textContent=text;$('message').className=error?'message error':'message';}
function authToken(){if(!token || Date.now()>=expires){logout();throw new Error('Your session expired. Please sign in again.');}return token;}
function logout(){token=null;expires=0;$('studio').hidden=true;$('login').hidden=false;$('password').value='';$('current-media').replaceChildren();$('selected-media').replaceChildren();$('selected-media').hidden=true;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;selected=null;$('file').value='';$('publish').disabled=true;}
async function loadCurrent(){current=await getReveal();const media=current||{url:'../media/got-you.mp4',mime:'video/mp4'};$('current-media').replaceChildren(mediaElement(media.url,media.mime));$('current-caption').textContent=current?'Your custom reveal is live for all visitors.':'The default prank video is live.';$('reset-default').disabled=!current;}
if(!configured){$('setup').hidden=false;$('sign-in').disabled=true;$('email').disabled=true;$('password').disabled=true;}
$('login').addEventListener('submit',async event=>{event.preventDefault();$('sign-in').disabled=true;message('Signing in…');try{
 const result=await request('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});
 token=result.access_token;expires=Date.now()+result.expires_in*1000;$('password').value='';
 const admin=await request('/rest/v1/rpc/is_reveal_admin',{token,method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 if(!admin){logout();throw new Error('This account is not authorized to manage reveals.');}
 $('signed-in').textContent=result.user.email;$('login').hidden=true;$('studio').hidden=false;await loadCurrent();message('Signed in. Choose a file to change the reveal.');
}catch(error){message(error.message,true);}finally{$('sign-in').disabled=!configured;}});
$('sign-out').addEventListener('click',async()=>{const previous=token;logout();message('Signed out.');if(previous)request('/auth/v1/logout',{token:previous,method:'POST'}).catch(()=>{});});
$('file').addEventListener('change',()=>{
 selected=null;$('publish').disabled=true;$('selected-media').hidden=true;$('selected-media').replaceChildren();if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;
 const file=$('file').files[0];if(!file)return;
 if(!allowedTypes.includes(file.type)){message('Choose a supported image, GIF, video, or audio file. Convert MOV/HEIC files to MP4/JPG first.',true);return;}
 if(file.size>50*1024*1024||!file.size){message('Choose a file between 1 byte and 50 MB.',true);return;}
 selected=file;objectUrl=URL.createObjectURL(file);const preview=mediaElement(objectUrl,file.type);preview.addEventListener('error',()=>{selected=null;$('publish').disabled=true;message('This browser cannot play this file. Try an MP4 with H.264 video, or a JPG/PNG.',true);},{once:true});
 $('selected-media').replaceChildren(preview);$('selected-media').hidden=false;$('file-detail').textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`;$('publish').disabled=false;message('Preview your file, then publish when ready.');
});
$('upload-form').addEventListener('submit',async event=>{event.preventDefault();if(!selected)return;const file=selected;$('publish').disabled=true;$('file').disabled=true;$('reset-default').disabled=true;$('sign-out').disabled=true;let uploadedPath=null,saved=false;
 try{const session=authToken();const extension={'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','audio/mpeg':'mp3','audio/wav':'wav','audio/ogg':'ogg'}[file.type];const path=`${crypto.randomUUID()}.${extension}`;message('Uploading your reveal…');
 await request(`/storage/v1/object/reveals/${path}`,{token:session,method:'POST',headers:{'Content-Type':file.type,'Cache-Control':'3600'},body:file,signal:AbortSignal.timeout(180000)});uploadedPath=path;
 await request('/rest/v1/reveal_settings?on_conflict=id',{token:authToken(),method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:1,path,mime:file.type})});saved=true;
 const previous=current;await loadCurrent();if(previous?.path)await request('/storage/v1/object/reveals',{token:authToken(),method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[previous.path]})}).catch(()=>{});
 selected=null;$('file').value='';$('selected-media').replaceChildren();$('selected-media').hidden=true;$('file-detail').textContent='';if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;message('Published! New visitors will see your reveal at the end of the sequence.');
 }catch(error){if(uploadedPath&&!saved&&token)await request('/storage/v1/object/reveals',{token,method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[uploadedPath]})}).catch(()=>{});message(saved?'Your reveal was published, but the preview could not refresh. Reload and sign in again.':error.message,true);
 }finally{$('publish').disabled=!selected;$('file').disabled=false;$('reset-default').disabled=!current;$('sign-out').disabled=false;}
});
$('reset-default').addEventListener('click',async()=>{$('reset-default').disabled=true;try{const previous=current;await request('/rest/v1/reveal_settings?id=eq.1',{token:authToken(),method:'DELETE'});await loadCurrent();if(previous?.path)await request('/storage/v1/object/reveals',{token:authToken(),method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[previous.path]})}).catch(()=>{});message('Default reveal restored.');}catch(error){message(error.message,true);}finally{$('reset-default').disabled=!current;}});
