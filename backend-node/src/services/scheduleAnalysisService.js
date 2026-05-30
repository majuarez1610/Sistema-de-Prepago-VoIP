const { pool } = require('../config/db');

const SCHEDULE_BLOCKS = [
  {
    key: 'madrugada',
    label: 'Madrugada (00-06h)',
    startHour: 0,
    endHour: 6,
    hours_range: '00:00 - 05:59'
  },
  {
    key: 'manana',
    label: 'Mañana (06-12h)',
    startHour: 6,
    endHour: 12,
    hours_range: '06:00 - 11:59'
  },
  {
    key: 'tarde',
    label: 'Tarde (12-18h)',
    startHour: 12,
    endHour: 18,
    hours_range: '12:00 - 17:59'
  },
  {
    key: 'noche',
    label: 'Noche (18-00h)',
    startHour: 18,
    endHour: 24,
    hours_range: '18:00 - 23:59'
  }
];

function toNumber(value) {
  return Number(value || 0);
}

function getSaturationThreshold() {
  const configuredValue = Number(process.env.SATURATION_THRESHOLD || 1);
  return Number.isFinite(configuredValue) && configuredValue > 0
    ? configuredValue
    : 1;
}

function getHourLabel(hour) {
  const start = String(hour).padStart(2, '0');
  const end = String((hour + 1) % 24).padStart(2, '0');

  return `${start}:00 - ${end}:00`;
}

function getBlockForHour(hour) {
  const numericHour = Number(hour);

  return (
    SCHEDULE_BLOCKS.find(
      (block) => numericHour >= block.startHour && numericHour < block.endHour
    ) || SCHEDULE_BLOCKS[0]
  );
}

function classifyTraffic(total, threshold) {
  if (Number(total || 0) >= threshold) return 'SATURADO';
  if (Number(total || 0) > 0) return 'NORMAL';
  return 'SIN_TRAFICO';
}

function normalizeDecision(decision) {
  if (decision === 'ALLOW_CALL') return 'AUTORIZADA';
  if (decision === 'REJECT_CALL') return 'RECHAZADA';
  return 'SIN_CLASIFICAR';
}

function classifyCall(call) {
  const reason = String(call.reason || '').toLowerCase();
  const cost = Number(call.cost || 0);

  if (
    reason.includes('hora pico') ||
    reason.includes('tarifa especial') ||
    reason.includes('tarifa pico') ||
    cost >= 2
  ) {
    return 'TARIFA_PICO';
  }

  if (call.decision === 'ALLOW_CALL') {
    return 'AUTORIZADA';
  }

  if (reason.includes('saldo')) {
    return 'RECHAZADA_SALDO';
  }

  if (reason.includes('usuario') || reason.includes('registrado')) {
    return 'RECHAZADA_USUARIO';
  }

  if (reason.includes('no aceptada') || reason.includes('selección inválida')) {
    return 'RECHAZADA_TARIFA_PICO';
  }

  if (call.decision === 'REJECT_CALL') {
    return 'RECHAZADA';
  }

  return 'SIN_CLASIFICAR';
}

function buildEmptyHour(hour, threshold, currentHour) {
  const block = getBlockForHour(hour);
  const total = 0;

  return {
    hour,
    label: getHourLabel(hour),
    block_key: block.key,
    block_label: block.label,
    total,
    authorized: 0,
    rejected: 0,
    completed: 0,
    failed: 0,
    total_cost: 0,
    classification: classifyTraffic(total, threshold),
    is_saturated: false,
    is_current: hour === currentHour
  };
}

function buildEmptyBlock(block, threshold, currentBlockKey) {
  const total = 0;

  return {
    ...block,
    total,
    authorized: 0,
    rejected: 0,
    completed: 0,
    failed: 0,
    total_cost: 0,
    classification: classifyTraffic(total, threshold),
    is_saturated: false,
    is_current: block.key === currentBlockKey,
    is_peak: false
  };
}

async function getTrafficAnalysis() {
  const threshold = getSaturationThreshold();

  const [[timeRow]] = await pool.execute(
    'SELECT HOUR(NOW()) AS current_hour, NOW() AS db_now'
  );

  const currentHour = toNumber(timeRow?.current_hour);
  const currentBlockBase = getBlockForHour(currentHour);

  const [rows] = await pool.execute(`
    SELECT
      id,
      user_id,
      from_number,
      to_number,
      twilio_call_sid,
      account_sid,
      call_status,
      direction,
      decision,
      reason,
      cost,
      duration_seconds,
      created_at,
      HOUR(created_at) AS call_hour
    FROM calls
    ORDER BY created_at DESC
  `);

  const hoursMap = new Map();

  for (let hour = 0; hour < 24; hour += 1) {
    hoursMap.set(hour, buildEmptyHour(hour, threshold, currentHour));
  }

  const blocksMap = new Map();

  SCHEDULE_BLOCKS.forEach((block) => {
    blocksMap.set(block.key, buildEmptyBlock(block, threshold, currentBlockBase.key));
  });

  let totalCalls = 0;
  let totalAuthorized = 0;
  let totalRejected = 0;
  let totalCost = 0;

  rows.forEach((call) => {
    const callHour = toNumber(call.call_hour);
    const block = getBlockForHour(callHour);

    const hourData = hoursMap.get(callHour);
    const blockData = blocksMap.get(block.key);

    const cost = Number(call.cost || 0);
    const isAuthorized = call.decision === 'ALLOW_CALL';
    const isRejected = call.decision === 'REJECT_CALL';
    const isCompleted = call.call_status === 'completed';
    const isFailed = call.call_status === 'failed';

    totalCalls += 1;
    totalCost += cost;

    if (isAuthorized) totalAuthorized += 1;
    if (isRejected) totalRejected += 1;

    if (hourData) {
      hourData.total += 1;
      hourData.total_cost += cost;

      if (isAuthorized) hourData.authorized += 1;
      if (isRejected) hourData.rejected += 1;
      if (isCompleted) hourData.completed += 1;
      if (isFailed) hourData.failed += 1;
    }

    if (blockData) {
      blockData.total += 1;
      blockData.total_cost += cost;

      if (isAuthorized) blockData.authorized += 1;
      if (isRejected) blockData.rejected += 1;
      if (isCompleted) blockData.completed += 1;
      if (isFailed) blockData.failed += 1;
    }
  });

  const hours = Array.from(hoursMap.values()).map((hour) => ({
    ...hour,
    total_cost: Number(hour.total_cost || 0),
    classification: classifyTraffic(hour.total, threshold),
    is_saturated: hour.total >= threshold
  }));

  let peakBlock = null;

  const blocks = Array.from(blocksMap.values()).map((block) => {
    const classification = classifyTraffic(block.total, threshold);

    const normalizedBlock = {
      ...block,
      total_cost: Number(block.total_cost || 0),
      classification,
      is_saturated: block.total >= threshold,
      is_current: block.key === currentBlockBase.key,
      is_peak: false
    };

    if (!peakBlock || normalizedBlock.total > peakBlock.total) {
      peakBlock = normalizedBlock;
    }

    return normalizedBlock;
  });

  const blocksWithPeak = blocks.map((block) => ({
    ...block,
    is_peak: peakBlock ? block.key === peakBlock.key : false
  }));

  const currentBlock =
    blocksWithPeak.find((block) => block.key === currentBlockBase.key) ||
    buildEmptyBlock(currentBlockBase, threshold, currentBlockBase.key);

  const currentHourCalls = rows
    .filter((call) => toNumber(call.call_hour) === currentHour)
    .map((call) => ({
      id: call.id,
      user_id: call.user_id,
      from_number: call.from_number,
      to_number: call.to_number,
      twilio_call_sid: call.twilio_call_sid,
      account_sid: call.account_sid,
      call_status: call.call_status,
      direction: call.direction,
      decision: call.decision,
      decision_label: normalizeDecision(call.decision),
      reason: call.reason,
      cost: Number(call.cost || 0),
      duration_seconds: Number(call.duration_seconds || 0),
      created_at: call.created_at,
      call_hour: toNumber(call.call_hour),
      classification: classifyCall(call)
    }));

  return {
    saturation_threshold: threshold,
    current_hour: currentHour,
    current_hour_label: getHourLabel(currentHour),
    current_block: currentBlock,
    peak_block: peakBlock || currentBlock,
    totals: {
      calls: totalCalls,
      authorized: totalAuthorized,
      rejected: totalRejected,
      total_cost: Number(totalCost || 0)
    },
    blocks: blocksWithPeak,
    hours,
    current_hour_calls: currentHourCalls
  };
}

module.exports = {
  getTrafficAnalysis,
  getSaturationThreshold,
  getBlockForHour,
  classifyTraffic
};