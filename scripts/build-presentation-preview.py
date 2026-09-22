"""Create a single-file offline review of the compiled Astro presentation.
Run npm run build in astro-site first, then python3 scripts/build-presentation-preview.py OUTPUT.html.
Source pages and their production URLs remain unchanged. The wrapper only adapts offline navigation/assets.
"""
import base64,json,mimetypes,pathlib,re,sys
root=pathlib.Path(__file__).resolve().parents[1]/'astro-site'/'dist'
output=pathlib.Path(sys.argv[1])
pages={}
for path in root.rglob('index.html'):
 route='/'+str(path.parent.relative_to(root)).replace('\\','/')+'/'
 if route=='/./':route='/'
 html=path.read_text()
 def script(match):
  attrs,body=match.groups()
  src=re.search(r'src="([^"]+)"',attrs)
  if src:
   relative=src.group(1).split('/_astro/')[-1]
   body=(root/'_astro'/relative).read_text()
  if not body.strip():return ''
  # Each original Astro module has its own lexical scope; preserve it in the offline IIFE.
  return '<script>document.addEventListener("DOMContentLoaded",()=>{'+body+'});</script>'
 html=re.sub(r'<script([^>]*)>([\s\S]*?)</script>',script,html)
 pages[route]=html
assets={}
for path in root.rglob('*'):
 if not path.is_file() or path.suffix in ['.html','.js','.css','.map']:continue
 relative='/'+path.relative_to(root).as_posix()
 assets[relative]={'type':mimetypes.guess_type(path.name)[0] or 'application/octet-stream','data':base64.b64encode(path.read_bytes()).decode()}
css={'/'+p.relative_to(root).as_posix():p.read_text() for p in root.rglob('*.css')}
data=json.dumps({'pages':pages,'assets':assets,'css':css},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
wrapper=r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0c1220"><title>Immortals Macau — Presentation Preview</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0c1220}iframe{display:block;width:100%;height:100%;border:0}#loading{position:fixed;inset:0;display:grid;place-content:center;color:#f3f0e8;font:15px Arial,sans-serif;letter-spacing:.05em}#loading[hidden]{display:none}</style></head><body><div id="loading">Opening Immortals Macau…</div><iframe id="site" title="Immortals Macau presentation" allow="fullscreen"></iframe><script id="site-data" type="application/json">__DATA__</script><script>
const data=JSON.parse(document.getElementById('site-data').textContent);document.getElementById('site-data').remove();
const frame=document.getElementById('site'), blobs=new Map();let currentRoute='',currentHash='',previousPage='';
function clean(path){return path.replace(/^\/immortals-site(?=\/)/,'').split(/[?#]/)[0]}
function assetURL(path,relative='/'){
 if(!path||/^(data:|blob:|https?:|#)/.test(path))return path;
 const key=clean(new URL(path,'https://preview.invalid'+relative).pathname);
 if(blobs.has(key))return blobs.get(key);
 const asset=data.assets[key];if(!asset)return path;
 const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:asset.type}));blobs.set(key,url);return url;
}
function patchCSS(css,path){return css.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g,(_,q,value)=>'url("'+assetURL(value,path)+'")')}
function readLocation(){const route=decodeURI(location.hash.slice(1)||'/');const i=route.indexOf('#');return {path:i<0?route:route.slice(0,i),hash:i<0?'':route.slice(i)}}
function navigate(target){const value=target||'/';if(location.hash.slice(1)===value)render();else location.hash=value;}
function render(){
 let {path,hash}=readLocation();path=clean(path);if(!path.endsWith('/'))path+='/';if(!data.pages[path]){navigate('/');return;}
 if(path===currentRoute&&frame.contentWindow&&previousPage){currentHash=hash;frame.contentWindow.location.hash=hash;frame.contentWindow.document.querySelector(hash||'#top')?.scrollIntoView();return;}
 currentRoute=path;currentHash=hash;
 const doc=new DOMParser().parseFromString(data.pages[path],'text/html');
 doc.querySelectorAll('link[rel="stylesheet"]').forEach(link=>{const key=clean(link.getAttribute('href'));const style=doc.createElement('style');style.textContent=patchCSS(data.css[key]||'',key);link.replaceWith(style)});
 doc.querySelectorAll('style').forEach(style=>{style.textContent=patchCSS(style.textContent,path)});
 doc.querySelectorAll('[src]').forEach(el=>el.setAttribute('src',assetURL(el.getAttribute('src'),path)));
 doc.querySelectorAll('link[href]').forEach(el=>el.setAttribute('href',assetURL(el.getAttribute('href'),path)));
 doc.querySelectorAll('[data-lightbox]').forEach(el=>el.setAttribute('data-lightbox',assetURL(el.getAttribute('data-lightbox'),path)));
 const bootstrap=doc.createElement('script');
 bootstrap.textContent=`window.__previewAsset=(path)=>parent.__previewAsset(path,${JSON.stringify(path)});const imageSrc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...imageSrc,set(value){imageSrc.set.call(this,window.__previewAsset(value))}});document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a)return;const raw=a.getAttribute('href');if(!raw||a.target==='_blank'||/^(https?:|mailto:|tel:)/.test(raw))return;if(raw.startsWith('#'))return;event.preventDefault();parent.postMessage({type:'immortals-route',path:raw},'*')});window.addEventListener('hashchange',()=>parent.postMessage({type:'immortals-anchor',hash:location.hash},'*'));`;
 doc.head.prepend(bootstrap);
 // A same-origin blob document supports room hashes, history.replaceState and WebGL textures offline.
 const blob=URL.createObjectURL(new Blob(['<!doctype html>'+doc.documentElement.outerHTML],{type:'text/html'}));
 if(previousPage)URL.revokeObjectURL(previousPage);previousPage=blob;
 frame.onload=()=>{document.getElementById('loading').hidden=true;const w=frame.contentWindow;if(currentHash){w.location.hash=currentHash;setTimeout(()=>{try{w.document.querySelector(currentHash)?.scrollIntoView()}catch{}},80)}document.title=doc.title+' — Preview';};
 frame.src=blob;
}
window.__previewAsset=assetURL;
window.addEventListener('message',event=>{if(event.source!==frame.contentWindow)return;const message=event.data;if(message.type==='immortals-route'){const target=message.path.replace(/^\/immortals-site(?=\/)/,'');navigate(target)}else if(message.type==='immortals-anchor'){currentHash=message.hash;history.replaceState(null,'','#'+currentRoute+currentHash)}});
window.addEventListener('hashchange',render);render();
</script></body></html>'''
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(wrapper.replace('__DATA__',data))
print(json.dumps({'output':str(output),'pages':len(pages),'assets':len(assets),'bytes':output.stat().st_size}))
