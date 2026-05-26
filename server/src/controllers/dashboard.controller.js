// Attention-driven dashboard endpoints.
//
// Two endpoints:
//   GET /dashboard/attention  → role-tailored action items
//   GET /dashboard/activity   → recent audit events (formatted)
//
// Items are intentionally clickable on the client — each carries a `patientId`
// and optional `step` so the UI can jump straight to the workflow location.

import db from '../config/db.js';
import { stripPii } from '../middleware/piiFilter.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getAttention(req, res) {
  const isLiegeView = req.user.capabilities?.includes('receive_shipment')
    && !req.user.capabilities?.includes('create_shipment');

  const items = isLiegeView
    ? await buildLiegeAttention(req.user)
    : await buildClinicalAttention(req.user);

  res.json({ items, generatedAt: new Date().toISOString() });
}

async function buildClinicalAttention(user) {
  const items = [];
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

  // 1. Patients with saved-but-unsubmitted PBMC data
  let pbmcQuery = db('pbmc_steps')
    .join('patients', 'patients.id', 'pbmc_steps.patient_id')
    .where('pbmc_steps.submitted', false)
    .where('pbmc_steps.vials', '>', 0)
    .select(
      'patients.id as patient_id',
      'patients.code',
      'patients.name',
      'patients.age',
      'patients.facility',
      'pbmc_steps.updated_at',
    );
  if (user.role === 'entry' && user.sites?.length > 0) {
    pbmcQuery = pbmcQuery.whereIn('patients.facility', user.sites);
  }
  const pbmcRows = await pbmcQuery;
  for (const r of pbmcRows) {
    const daysSince = Math.floor((Date.now() - new Date(r.updated_at).getTime()) / (24 * 60 * 60 * 1000));
    const masked = stripPii({ id: r.patient_id, code: r.code, name: r.name, age: r.age, facility: r.facility }, user);
    items.push({
      type: 'pbmc_unsubmitted',
      severity: daysSince > 7 ? 'warn' : 'info',
      patientId: r.patient_id,
      step: 'pbmc',
      label: `${masked.code}${masked.name ? ' · ' + masked.name : ''} — PBMC saved but not submitted`,
      detail: `${daysSince} day${daysSince === 1 ? '' : 's'} since last edit`,
    });
  }

  // 2. Patients with no workflow activity in >7 days (and not yet fully done).
  //
  // "Activity" = the most recent updated_at across the patient's step rows,
  // floored at enrolled_at. We deliberately do NOT use patients.updated_at:
  // step submissions don't touch it, and schema migrations that rewrite
  // patient columns DO touch it — both make patients.updated_at a misleading
  // signal for "research stalled".
  const stalledSub = db('patients as p')
    .leftJoin('consent_steps as c', 'c.patient_id', 'p.id')
    .leftJoin('questionnaire_steps as q', 'q.patient_id', 'p.id')
    .leftJoin('collection_steps as co', 'co.patient_id', 'p.id')
    .leftJoin('pbmc_steps as pb', 'pb.patient_id', 'p.id')
    .leftJoin('transfer_steps as t', 't.patient_id', 'p.id')
    .where((qb) => qb.whereNull('t.receipt_confirmed').orWhere('t.receipt_confirmed', false))
    .select(
      'p.id as patient_id', 'p.code', 'p.name', 'p.age', 'p.facility',
      db.raw(`GREATEST(
        p.enrolled_at,
        COALESCE(c.updated_at,  p.enrolled_at),
        COALESCE(q.updated_at,  p.enrolled_at),
        COALESCE(co.updated_at, p.enrolled_at),
        COALESCE(pb.updated_at, p.enrolled_at),
        COALESCE(t.updated_at,  p.enrolled_at)
      ) AS last_activity`),
    );
  if (user.role === 'entry' && user.sites?.length > 0) {
    stalledSub.whereIn('p.facility', user.sites);
  }
  const stalledRows = await db
    .select('*')
    .from(stalledSub.as('candidates'))
    .where('last_activity', '<', cutoff)
    .orderBy('last_activity', 'asc')
    .limit(20);

  // Walk results in oldest-first order, skip dupes against PBMC-unsubmitted,
  // stop once we've added 5 — so a clump of dupes at the top doesn't starve
  // the rest of the list.
  let stalledAdded = 0;
  for (const r of stalledRows) {
    if (stalledAdded >= 5) break;
    if (items.some((it) => it.patientId === r.patient_id)) continue;
    const daysSince = Math.floor((Date.now() - new Date(r.last_activity).getTime()) / (24 * 60 * 60 * 1000));
    const masked = stripPii({ id: r.patient_id, code: r.code, name: r.name, age: r.age, facility: r.facility }, user);
    items.push({
      type: 'patient_stalled',
      severity: daysSince > 14 ? 'warn' : 'info',
      patientId: r.patient_id,
      label: `${masked.code}${masked.name ? ' · ' + masked.name : ''} — no activity in ${daysSince} days`,
      detail: 'Workflow paused',
    });
    stalledAdded++;
  }

  // 3. Shipments admin/entry created that are still in transit (so they can follow up)
  if (user.capabilities?.includes('create_shipment')) {
    const inTransit = await db('shipments')
      .whereIn('status', ['shipped', 'in_transit'])
      .select('id', 'ship_date', 'tracking_number', 'status', 'created_at');
    for (const s of inTransit.slice(0, 3)) {
      const daysSince = Math.floor((Date.now() - new Date(s.created_at).getTime()) / (24 * 60 * 60 * 1000));
      items.push({
        type: 'shipment_in_transit',
        severity: daysSince > 14 ? 'warn' : 'info',
        shipmentId: s.id,
        label: `Shipment ${s.tracking_number || s.id.slice(0, 8)} still in transit`,
        detail: `Dispatched ${daysSince} day${daysSince === 1 ? '' : 's'} ago`,
      });
    }
  }

  return items;
}

async function buildLiegeAttention(user) {
  const items = [];
  // Shipments awaiting receipt
  const inbound = await db('shipments')
    .whereIn('status', ['shipped', 'in_transit', 'partial'])
    .select('id', 'ship_date', 'tracking_number', 'status', 'created_at')
    .orderBy('created_at', 'asc');

  for (const s of inbound) {
    const daysSince = Math.floor((Date.now() - new Date(s.created_at).getTime()) / (24 * 60 * 60 * 1000));
    const sampleCount = await db('shipment_samples').where('shipment_id', s.id).count('* as c').first();
    items.push({
      type: 'shipment_awaiting_receipt',
      severity: daysSince > 7 ? 'warn' : 'info',
      shipmentId: s.id,
      label: `Shipment ${s.tracking_number || s.id.slice(0, 8)} ${s.status === 'partial' ? '— partial, needs final receipt' : 'awaiting receipt'}`,
      detail: `${sampleCount?.c || 0} samples · dispatched ${daysSince} day${daysSince === 1 ? '' : 's'} ago`,
    });
  }

  return items;
}

export async function getActivity(req, res) {
  // Recent meaningful audit events. We don't filter by site here — the
  // dashboard shows a study-wide pulse for all clinical roles. Liège sees
  // shipment-related events primarily.
  const isLiegeView = req.user.capabilities?.includes('receive_shipment')
    && !req.user.capabilities?.includes('create_shipment');

  let q = db('audit_log').orderBy('id', 'desc').limit(8);

  if (isLiegeView) {
    q = q.whereIn('action', [
      'shipment.create', 'shipment.received', 'shipment.partial_receipt',
    ]);
  } else {
    q = q.whereIn('action', [
      'patient.create', 'patient.update', 'patient.delete',
      'consent.submit', 'questionnaire.submit', 'collection.submit', 'pbmc.submit',
      'shipment.create', 'shipment.received',
    ]);
  }

  const rows = await q.select('id', 'user_name', 'action', 'entity_type', 'entity_id', 'details');
  res.json({ items: rows.map(formatActivity) });
}

function formatActivity(row) {
  const verb = ACTION_VERBS[row.action] || row.action;
  return {
    id: row.id,
    userName: row.user_name || 'system',
    action: row.action,
    verb,
    entityId: row.entity_id,
    details: row.details,
  };
}

const ACTION_VERBS = {
  'patient.create': 'added patient',
  'patient.update': 'updated patient',
  'patient.delete': 'deleted patient',
  'consent.submit': 'submitted consent for',
  'questionnaire.submit': 'submitted questionnaire for',
  'collection.submit': 'submitted collection for',
  'pbmc.submit': 'submitted PBMC for',
  'shipment.create': 'created shipment',
  'shipment.received': 'received shipment',
};

// Weekly enrollment counts for the last N weeks. Returns an array sorted
// chronologically (oldest first) so the line chart can plot left-to-right.
// Each entry: { weekStart: 'YYYY-MM-DD', count: int }
export async function getEnrollmentTrend(req, res) {
  const weeks = Math.min(parseInt(req.query.weeks, 10) || 12, 52);
  const cutoff = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

  let query = db('patients')
    .where('enrolled_at', '>=', cutoff)
    .select('enrolled_at', 'facility');
  if (req.user.role === 'entry' && req.user.sites?.length > 0) {
    query = query.whereIn('facility', req.user.sites);
  }
  const rows = await query;

  // Bucket by ISO week — Monday-start, key is the Monday date as YYYY-MM-DD
  const buckets = new Map();
  // Pre-seed buckets so empty weeks still appear in the chart
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const monday = startOfWeek(d);
    buckets.set(monday, 0);
  }
  for (const r of rows) {
    const monday = startOfWeek(new Date(r.enrolled_at));
    if (buckets.has(monday)) {
      buckets.set(monday, buckets.get(monday) + 1);
    }
  }

  const series = Array.from(buckets.entries()).map(([weekStart, count]) => ({ weekStart, count }));
  res.json({ series });
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  // Treat Monday as start of week (ISO 8601). day=0 (Sun) → -6, day=1 (Mon) → 0, etc.
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split('T')[0];
}
