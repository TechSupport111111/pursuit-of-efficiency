export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\nSitemap: https://pursuitofefficiency.com/sitemap.xml`, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (request.method === "GET" && url.pathname === "/sitemap.xml") {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://pursuitofefficiency.com/</loc></url></urlset>`,
        { headers: { "content-type": "application/xml; charset=utf-8" } }
      );
    }

    if (request.method === "POST" && url.pathname === "/api/invite") {
      try {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const company = String(body.company || "").trim();
        const size = String(body.size || "").trim();
        const goal = String(body.goal || "").trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !company || !size || !goal) {
          return json({ error: "Please complete all fields." }, 400);
        }

        // BREVO_SENDER_EMAIL is only needed for sending campaigns/emails. It is
        // not required to add someone to the waitlist, so do not block signups on it.
        if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
          console.error("Missing Brevo waitlist configuration", {
            hasApiKey: Boolean(env.BREVO_API_KEY),
            hasListId: Boolean(env.BREVO_LIST_ID),
          });
          return json({ error: "Waitlist is temporarily unavailable." }, 503);
        }

        const listId = Number(env.BREVO_LIST_ID);
        if (!Number.isInteger(listId) || listId <= 0) {
          console.error("BREVO_LIST_ID is invalid");
          return json({ error: "Waitlist is temporarily unavailable." }, 503);
        }

        const payload = {
          email,
          attributes: {
            COMPANY: company,
            COMPANY_SIZE: size,
            GOAL: goal,
          },
          listIds: [listId],
          updateEnabled: true,
        };

        let contact = await createBrevoContact(env.BREVO_API_KEY, payload);

        // Brevo rejects unknown custom attributes. If this account does not yet
        // have COMPANY / COMPANY_SIZE / GOAL configured, still capture the email
        // and add the contact to the list instead of losing the signup.
        if (!contact.ok && contact.status === 400) {
          const firstError = await contact.text();
          console.warn("Brevo rejected contact attributes; retrying without custom attributes", firstError);
          contact = await createBrevoContact(env.BREVO_API_KEY, {
            email,
            listIds: [listId],
            updateEnabled: true,
          });
        }

        if (!contact.ok) {
          const detail = await contact.text();
          console.error("Brevo contact creation failed", contact.status, detail);
          return json({ error: "We couldn't complete the request right now." }, 502);
        }

        return json({ ok: true });
      } catch (error) {
        console.error("Invite request failed", error);
        return json({ error: "Invalid request." }, 400);
      }
    }

    return env.ASSETS.fetch(request);
  },
};

function createBrevoContact(apiKey, payload) {
  return fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
