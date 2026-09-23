// GitHub's short-lived OIDC token only authorizes the renderer endpoints.
function decode(part:string) {
  return Uint8Array.from(atob(part.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
}
export async function verifyRendererToken(token:string):Promise<boolean> {
  try {
    const parts=token.split('.');if(parts.length!==3) return false;
    const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))) as {alg:string;kid:string};
    const c=JSON.parse(new TextDecoder().decode(decode(parts[1]))) as Record<string,unknown>;
    const now=Date.now()/1000;
    if(header.alg!=='RS256'||c.iss!=='https://token.actions.githubusercontent.com'||c.aud!=='kabuki-post-365-render'
      ||c.repository_id!=='1154986673'||c.repository_owner_id!=='210201072'
      ||c.repository!=='kerakabuki/kabuki-ai-agent'||c.ref!=='refs/heads/main'
      ||c.workflow_ref!=='kerakabuki/kabuki-ai-agent/.github/workflows/instagram-reels.yml@refs/heads/main'
      ||!['schedule','workflow_dispatch'].includes(String(c.event_name))
      ||typeof c.exp!=='number'||c.exp<=now||typeof c.nbf!=='number'||c.nbf>now+30) return false;
    const r=await fetch('https://token.actions.githubusercontent.com/.well-known/jwks',{cf:{cacheTtl:3600},signal:AbortSignal.timeout(10000)});
    if(!r.ok) return false;
    const {keys}=await r.json() as {keys:Array<JsonWebKey & {kid:string}>};
    const jwk=keys.find(k=>k.kid===header.kid);if(!jwk) return false;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts.slice(0,2).join('.')));
  }catch{return false;}
}
