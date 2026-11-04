// Shared by the n8n Code nodes and offline tests. No external dependencies.
function isoDate(value) {
  const s = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s)
    throw new Error('Dates must be real YYYY-MM-DD dates: ' + s);
  return s;
}
function berlinDate(value) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) throw new Error('Invalid timestamp: ' + value);
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Berlin', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(d);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function monday(date) {
  const d = new Date(isoDate(date));
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}
function key(week, campaign) { return JSON.stringify([week, campaign]); }
function validateAds(rows, now = new Date().toISOString()) {
  const seen = new Set();
  return rows.filter(r => Object.keys(r).some(k => k !== 'row_number' && String(r[k] ?? '').trim())).map(r => {
    const start = isoDate(r.report_start), end = isoDate(r.report_end);
    if (monday(start) !== start || Date.parse(end) - Date.parse(start) !== 6 * 86400000)
      throw new Error('Export must cover one complete Monday-Sunday week');
    if (end >= berlinDate(now)) throw new Error('Export week is not complete yet');
    const campaign = String(r.campaign_name ?? '').trim();
    if (!campaign || campaign.length > 200) throw new Error('Campaign name is required (max 200 characters)');
    const exportKey = key(start, campaign);
    if (seen.has(exportKey)) throw new Error('Duplicate campaign/week: ' + exportKey);
    seen.add(exportKey);
    const result = {report_start:start, report_end:end, campaign_name:campaign};
    for (const field of ['reach','impressions','link_clicks','amount_spent_eur']) {
      const text = String(r[field] ?? '').trim();
      if (!/^\d+(\.\d+)?$/.test(text)) throw new Error(field + ' requires a non-negative number with a decimal point, no currency or separators');
      const n = Number(text);
      if (!Number.isFinite(n) || n > Number.MAX_SAFE_INTEGER || (field !== 'amount_spent_eur' && !Number.isSafeInteger(n))) throw new Error('Invalid ' + field);
      result[field] = n;
    }
    if (result.reach > result.impressions || result.link_clicks > result.impressions) throw new Error('Reach/clicks cannot exceed impressions for this report contract');
    result.amount_spent_eur = Math.round(result.amount_spent_eur * 100) / 100;
    return {...result, imported_at: now, export_key:exportKey};
  });
}
function buildReport(ads, leads, now = new Date().toISOString()) {
  const valid = validateAds(ads, now);
  const counts = new Map(), seen = new Set();
  for (const r of leads) {
    if (!Object.keys(r).some(k => k !== 'row_number' && String(r[k] ?? '').trim())) continue;
    const id = String(r.crm_id ?? '').trim();
    if (!id || seen.has(id)) throw new Error('Missing or duplicate crm_id; fix Leads before reporting');
    seen.add(id);
    if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(String(r.timestamp))) throw new Error('Lead timestamp requires an explicit timezone');
    const week = monday(berlinDate(r.timestamp));
    const campaign = String(r.utm_campaign ?? '').trim();
    if (!campaign) continue; // Organic/unattributed enquiries are not paid campaign leads.
    const k = key(week, campaign);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return valid.map(r => {
    const leads = counts.get(r.export_key) || 0;
    return {week_start:r.report_start, campaign_name:r.campaign_name, reach:r.reach,
      impressions:r.impressions, link_clicks:r.link_clicks, amount_spent_eur:r.amount_spent_eur,
      leads, ctr:r.impressions ? r.link_clicks/r.impressions : '',
      cpl_eur:leads ? Math.round(r.amount_spent_eur/leads*100)/100 : '', report_key:r.export_key};
  }).sort((a,b) => a.report_key.localeCompare(b.report_key));
}
if (typeof module !== 'undefined') module.exports = {validateAds, buildReport, monday, berlinDate};
