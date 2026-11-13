// ============================================================================
// OPTIONAL SUPABASE REST CLIENT (ZERO-DEPENDENCY FETCH FOR VERCEL DEPLOYMENTS)
// ============================================================================
const DEFAULT_SB_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  '';
const DEFAULT_SB_KEY =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  '';

function buildSupabaseHeaders(sbKey, extra = {}) {
  const cleanKey = sbKey.trim();
  const headers = {
    apikey: cleanKey,
    ...extra,
  };
  // Only send Authorization: Bearer if using a legacy JWT (eyJ...) key
  if (cleanKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${cleanKey}`;
  }
  return headers;
}

async function supabaseFetchState(sbUrl, sbKey) {
  if (!sbUrl || !sbKey) return null;
  try {
    const cleanUrl = sbUrl.replace(/\/$/, '');
    const res = await fetch(
      `${cleanUrl}/rest/v1/unipool_state?id=eq.main&select=payload`,
      {
        headers: buildSupabaseHeaders(sbKey),
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0].payload) {
      return rows[0].payload;
    }
    return null;
  } catch {
    return null;
  }
}

async function supabaseSaveState(sbUrl, sbKey, payload) {
  if (!sbUrl || !sbKey) return false;
  try {
    const cleanUrl = sbUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/unipool_state`, {
      method: 'POST',
      headers: buildSupabaseHeaders(sbKey, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        id: 'main',
        payload,
        updated_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

