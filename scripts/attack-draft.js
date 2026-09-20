// Adversarial pass over a family-facing draft. Objections only; we never adopt its prose.
// usage: node attack.js <context.json>   where {who, message, verified[], draft}
const fs=require('fs');
const ENV=process.env.ENVFILE||'.env.local';
const env=Object.fromEntries(fs.readFileSync(ENV,'utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}));

const SYSTEM=`You fact-check a draft email that a free senior-care service is about to send to a family. You are not rewriting it. Return objections only.

Rules:
- Attack FACTUAL claims: phone numbers, hours, days, deadlines, age thresholds, income limits, program names, which agency does what, and whether a program EXISTS in that state, SERVES that area, and is OPEN today.
- For every objection, FETCH the administering agency's own page and QUOTE the sentence that contradicts the draft. A search summary is not a source. If you cannot find an agency source, say so and mark the objection unsourced.
- Do NOT object to tone, length, hedging, formatting, or the absence of caveats. Do NOT suggest adding bold.
- Do NOT invent restrictions. If a rule limits guardians, do not restate it as limiting relatives.
- Pay attention to WHO IS WHO. The sender may be a professional acting for a client, not a family member.
- If a claim is correct, OMIT IT ENTIRELY. Never return an objection whose problem says the claim is "supported", "confirmed", or "not contradicted". Those are not objections.
- Every objection must be one of: (a) the agency page CONTRADICTS the draft, or (b) the claim is material and you could find NO agency source for it. Nothing else.
- Returning zero objections is a valid and useful answer.

Return ONLY JSON:
{"objections":[{"target":"exact phrase from the draft","problem":"what is wrong","source_quote":"verbatim sentence from the agency page","source_url":"https://...","confidence":"high|medium|low"}]}`;

(async()=>{
  const ctx=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const user=[
    `WHO: ${ctx.who}`,
    ``,
    `THE FAMILY'S OWN MESSAGE, verbatim:`,
    ctx.message,
    ``,
    `ALREADY VERIFIED against the agency's own page today. Do not re-litigate unless you can quote a contradicting agency page:`,
    ...(ctx.verified||[]).map(v=>`- ${v}`),
    ``,
    `TODAY IS ${new Date().toISOString().slice(0,10)}.`,
    ``,
    `THE DRAFT:`,
    ctx.draft,
  ].join('\n');

  const r=await fetch('https://api.perplexity.ai/chat/completions',{
    method:'POST',
    headers:{Authorization:'Bearer '+env.PERPLEXITY_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:'sonar',messages:[{role:'system',content:SYSTEM},{role:'user',content:user}],max_tokens:2000,temperature:0}),
  });
  const j=await r.json();
  if(j.error) return console.error('ERROR',JSON.stringify(j.error));
  const txt=j.choices?.[0]?.message?.content||'';
  const m=txt.match(/\{[\s\S]*\}/);
  let out; try{ out=JSON.parse(m?m[0]:txt); }catch{ console.log('RAW:\n'+txt); return; }
  const cites=(j.citations||[]).map(c=>typeof c==='string'?c:c.url).filter(Boolean);
  const FARM=/carolinahomehealthcare|care-jobs-usa|medicarecoverguide|brevy\.com|medicaidoffice|clearmoneyguide|understoodcare|db101/i;
  console.log(`\n=== ${out.objections.length} objection(s) ===`);
  for(const o of out.objections){
    console.log(`\n[${o.confidence||'?'}] TARGET: ${o.target}`);
    console.log(`  PROBLEM: ${o.problem}`);
    console.log(`  QUOTE  : ${o.source_quote||'(none given -- treat as unsourced)'}`);
    console.log(`  SOURCE : ${o.source_url||'(none)'}${FARM.test(o.source_url||'')?'   <-- CONTENT FARM, verify independently':''}`);
  }
  console.log(`\nall citations: ${cites.join('\n               ')}`);
  const farms=cites.filter(c=>FARM.test(c));
  if(farms.length) console.log(`\nWARNING ${farms.length}/${cites.length} citations are content farms.`);
})();
