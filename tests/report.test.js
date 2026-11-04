const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validateAds,buildReport,monday,berlinDate} = require('../src/report');
const now='2026-11-03T12:00:00Z';
const ad={report_start:'2026-10-26',report_end:'2026-11-01',campaign_name:'DEMO_phase3',reach:800,impressions:1000,link_clicks:50,amount_spent_eur:40};
const lead={crm_id:'DEMO-1',timestamp:'2026-11-01T22:59:00Z',utm_campaign:'DEMO_phase3'};
test('CTR, CPL, campaign and Berlin week attribution',()=>{
 const r=buildReport([ad],[lead,{...lead,crm_id:'DEMO-2',timestamp:'2026-11-01T23:00:00Z'},{...lead,crm_id:'DEMO-3',utm_campaign:'other'}],now)[0];
 assert.equal(r.leads,1); assert.equal(r.ctr,0.05); assert.equal(r.cpl_eur,40);
});
test('zero denominators are blank, not fabricated zero',()=>{
 const r=buildReport([{...ad,reach:0,impressions:0,link_clicks:0}],[],now)[0];
 assert.equal(r.ctr,'');assert.equal(r.cpl_eur,'');assert.equal(r.leads,0);
});
test('duplicate exports and duplicate leads fail before writes',()=>{
 assert.throws(()=>validateAds([ad,ad],now),/Duplicate/);
 assert.throws(()=>buildReport([ad],[lead,lead],now),/duplicate crm_id/);
});
test('malformed numbers, incomplete and partial weeks fail',()=>{
 for(const patch of [{amount_spent_eur:'4,50'},{reach:-1},{link_clicks:1001},{report_start:'2026-10-27'},{report_end:'2026-11-02'},{report_start:'2026-11-02',report_end:'2026-11-08'},{report_start:'2026-02-30'}])
 assert.throws(()=>validateAds([{...ad,...patch}],now));
});
test('DST transition and year boundary use calendar weeks',()=>{
 assert.equal(berlinDate('2026-10-25T23:30:00Z'),'2026-10-26');
 assert.equal(monday('2027-01-01'),'2026-12-28');
});
test('empty sheets, deterministic keys, late leads',()=>{
 assert.deepEqual(buildReport([],[],now),[]);
 const a=buildReport([ad],[],now)[0], b=buildReport([ad],[lead],now)[0];
 assert.equal(a.report_key,b.report_key);assert.equal(b.leads,1);
});
