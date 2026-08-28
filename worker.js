export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/robots.txt") {
      return new Response(`User-agent: *
Allow: /
Sitemap: https://pursuitofefficiency.com/sitemap.xml`, {headers: {"content-type":"text/plain; charset=utf-8"}});
    }
    if (request.method === "GET" && url.pathname === "/sitemap.xml") {
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://pursuitofefficiency.com/</loc></url></urlset>`, {headers: {"content-type":"application/xml; charset=utf-8"}});
    }
    if (request.method === "POST" && url.pathname === "/api/invite") {
      try {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const company = String(body.company || "").trim();
        const size = String(body.size || "").trim();
        const goal = String(body.goal || "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !company || !size || !goal)
          return json({error:"Please complete all fields."},400);
        if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID || !env.BREVO_SENDER_EMAIL)
          return json({error:"Waitlist is not configured yet."},503);

        const contact = await fetch("https://api.brevo.com/v3/contacts", {
          method:"POST",
          headers:{"accept":"application/json","content-type":"application/json","api-key":env.BREVO_API_KEY},
          body:JSON.stringify({email,attributes:{COMPANY:company,COMPANY_SIZE:size,GOAL:goal},listIds:[Number(env.BREVO_LIST_ID)],updateEnabled:true})
        });
        if (!contact.ok) {
          const t=await contact.text();
          return json({error:"We couldn't complete the request right now."},502);
        }
        return json({ok:true});
      } catch { return json({error:"Invalid request."},400); }
    }
    return env.ASSETS.fetch(request);
  }
};
function json(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
