import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// ─── SVG Step Chart (Match Details) ──────────────────────────────────────────

const StepChart = ({ myHistory, oppHistory, duration = 60, width = 600, height = 180 }) => {
  const pad = { top: 12, right: 12, bottom: 28, left: 32 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  // Build (timestamp, cumulativeCorrect) series for both players
  const buildSeries = (history) => {
    const pts = [{ t: 0, c: 0 }];
    let correct = 0;
    for (const e of (history || [])) {
      if (e.isCorrect) {
        correct++;
        pts.push({ t: Math.min(e.timestamp / 1000, duration), c: correct });
      }
    }
    pts.push({ t: duration, c: correct });
    return pts;
  };

  const mySeries = buildSeries(myHistory);
  const oppSeries = buildSeries(oppHistory);
  const maxC = Math.max(
    mySeries[mySeries.length - 1]?.c || 0,
    oppSeries[oppSeries.length - 1]?.c || 0,
    1
  );

  const tx = (t) => pad.left + (t / duration) * w;
  const ty = (c) => pad.top + h - (c / maxC) * h;

  const toPath = (series) => {
    if (series.length < 2) return '';
    let d = `M ${tx(series[0].t)} ${ty(series[0].c)}`;
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1];
      const curr = series[i];
      // Step: horizontal then vertical
      d += ` H ${tx(curr.t)} V ${ty(curr.c)}`;
    }
    return d;
  };

  const xTicks = [0, 15, 30, 45, 60].filter(t => t <= duration);
  const yTicks = Array.from({ length: Math.min(maxC + 1, 6) }, (_, i) =>
    Math.round((i / 5) * maxC)
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 200 }}>
      {/* Grid lines */}
      {xTicks.map(t => (
        <line key={t} x1={tx(t)} y1={pad.top} x2={tx(t)} y2={pad.top + h}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Paths */}
      <path d={toPath(oppSeries)} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinejoin="round" />
      <path d={toPath(mySeries)} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinejoin="round" />
      {/* X axis labels */}
      {xTicks.map(t => (
        <text key={t} x={tx(t)} y={height - 4} textAnchor="middle"
          fill="rgba(255,255,255,0.25)" fontSize="10">{t}s</text>
      ))}
      {/* Y axis labels */}
      <text x={pad.left - 6} y={pad.top + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10">
        {maxC}
      </text>
      <text x={pad.left - 6} y={pad.top + h} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10">
        0
      </text>
    </svg>
  );
};

// ─── SVG Response Time Line Chart (Detailed Insights) ─────────────────────────

const ResponseTimeChart = ({ myHistory, oppHistory, width = 600, height = 160 }) => {
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const myTimes = (myHistory || []).map(e => e.timeTaken || 0);
  const oppTimes = (oppHistory || []).map(e => e.timeTaken || 0);
  const maxQ = Math.max(myTimes.length, oppTimes.length, 1);
  const maxT = Math.max(...myTimes, ...oppTimes, 5);

  const tx = (i) => pad.left + (i / (maxQ - 1 || 1)) * w;
  const ty = (t) => pad.top + h - (Math.min(t, maxT) / maxT) * h;

  const toPath = (times) => {
    if (times.length < 2) return '';
    return times.map((t, i) => `${i === 0 ? 'M' : 'L'} ${tx(i)} ${ty(t)}`).join(' ');
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 180 }}>
      {/* Grid */}
      {[0, 3, 6, 9, 12].filter(t => t <= maxT).map(t => (
        <line key={t} x1={pad.left} y1={ty(t)} x2={pad.left + w} y2={ty(t)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
      ))}

      {/* Lines */}
      {oppHistory?.length > 1 && (
        <path d={toPath(oppTimes)} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      )}
      {myHistory?.length > 1 && (
        <path d={toPath(myTimes)} fill="none" stroke="#14b8a6" strokeWidth="2" />
      )}

      {/* Dots */}
      {myTimes.map((t, i) => (
        <circle key={i} cx={tx(i)} cy={ty(t)} r="3" fill="#14b8a6" />
      ))}
      {oppTimes.map((t, i) => (
        <circle key={i} cx={tx(i)} cy={ty(t)} r="2.5" fill="rgba(255,255,255,0.35)" />
      ))}

      {/* X labels */}
      {myTimes.map((_, i) => i % 5 === 0 && (
        <text key={i} x={tx(i)} y={height - 4} textAnchor="middle"
          fill="rgba(255,255,255,0.2)" fontSize="9">Q{i + 1}</text>
      ))}

      {/* Y label */}
      <text x={pad.left - 6} y={pad.top + 4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="9">
        {Math.round(maxT)}s
      </text>
    </svg>
  );
};

// ─── Stat Row ─────────────────────────────────────────────────────────────────

const StatRow = ({ label, myVal, oppVal, unit = 's', myWins }) => (
  <div className="flex items-center py-2.5 border-b border-white/6 last:border-0">
    <div
      className="font-heading font-bold text-sm w-20 text-right pr-3"
      style={{ color: myWins ? '#14b8a6' : 'rgba(255,255,255,0.35)' }}
    >
      {myVal}{unit}
    </div>
    {myWins !== undefined && (
      <div className="w-4 flex justify-center">
        {myWins ? <span className="text-accent text-xs">‹</span> : <span className="text-white/20 text-xs">›</span>}
      </div>
    )}
    <div className="flex-1 text-center text-[11px] text-white/35 tracking-widest uppercase">{label}</div>
    {myWins !== undefined && (
      <div className="w-4 flex justify-center">
        {!myWins ? <span className="text-white/50 text-xs">‹</span> : <span className="text-white/20 text-xs">›</span>}
      </div>
    )}
    <div
      className="font-heading font-bold text-sm w-20 text-left pl-3"
      style={{ color: !myWins ? '#14b8a6' : 'rgba(255,255,255,0.35)' }}
    >
      {oppVal}{unit}
    </div>
  </div>
);

// ─── Preset Analysis Table ────────────────────────────────────────────────────

const PresetAnalysisTable = ({ myHistory, oppHistory }) => {
  const typeLabels = {
    addition: 'ADD', subtraction: 'SUB', multiplication: 'MULT',
    division: 'DIV', percentage: 'PCT', sequence: 'SEQ', logic: 'LOGIC', pattern: 'PAT',
  };

  const byType = {};
  for (const e of (myHistory || [])) {
    const t = e.questionType || 'other';
    if (!byType[t]) byType[t] = { myTimes: [], oppTimes: [], count: 0 };
    byType[t].myTimes.push(e.timeTaken || 0);
    byType[t].count++;
  }
  for (const e of (oppHistory || [])) {
    const t = e.questionType || 'other';
    if (!byType[t]) byType[t] = { myTimes: [], oppTimes: [], count: 0 };
    byType[t].oppTimes.push(e.timeTaken || 0);
  }

  const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '—';

  const rows = Object.entries(byType);
  if (!rows.length) return <div className="text-white/20 text-sm text-center py-4">No data yet</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/8">
            {['QUES', 'PRESET', 'YOUR AVG', 'OP AVG'].map(h => (
              <th key={h} className="py-2 px-2 text-white/25 font-semibold tracking-widest text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([type, data]) => (
            <tr key={type} className="border-b border-white/5">
              <td className="py-2 px-2 text-white/50 font-bold">{data.count}</td>
              <td className="py-2 px-2">
                <span className="rounded-full px-2 py-0.5 border border-white/15 text-white/50 text-[10px]">
                  {typeLabels[type] || type.toUpperCase()}
                </span>
              </td>
              <td className="py-2 px-2 font-heading font-bold text-white/70">{avg(data.myTimes)}s</td>
              <td className="py-2 px-2 text-white/35">{avg(data.oppTimes)}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Mind Snap Board Grid (for analysis replay) ───────────────────────────────

const MindSnapBoardGrid = ({ gridSize, pattern, cellResults }) => {
  const patternSet = new Set(pattern || []);
  const total = gridSize * gridSize;
  const maxW = gridSize === 4 ? 240 : 280;

  return (
    <div
      className="grid gap-1.5 mx-auto"
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: maxW, maxWidth: '80vw' }}
    >
      {Array.from({ length: total }, (_, i) => {
        const result = cellResults?.[i];
        const inPattern = patternSet.has(i);
        let bg = '#1c1c1c';

        if (result === 'correct') bg = '#0d9488';
        else if (result === 'wrong') bg = '#e11d48';
        else if (result === 'missed') bg = '#15803d';
        else if (!result && inPattern) bg = '#15803d'; // missed (not stored as 'missed' explicitly)

        return (
          <div
            key={i}
            className="rounded-lg"
            style={{ aspectRatio: '1', backgroundColor: bg }}
          />
        );
      })}
    </div>
  );
};

// ─── Mind Snap Step Chart (score per board, cumulative) ───────────────────────

const MindSnapScoreChart = ({ myBoards, oppBoards, width = 600, height = 160 }) => {
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const buildSeries = (boards) => {
    const pts = [{ b: 0, s: 0 }];
    let cum = 0;
    (boards || []).forEach((bd, i) => {
      cum += bd.points || 0;
      pts.push({ b: i + 1, s: cum });
    });
    return pts;
  };

  const mySeries = buildSeries(myBoards);
  const oppSeries = buildSeries(oppBoards);
  const maxB = Math.max(mySeries.length, oppSeries.length, 1) - 1;
  const maxS = Math.max(
    mySeries[mySeries.length - 1]?.s || 0,
    oppSeries[oppSeries.length - 1]?.s || 0,
    1
  );

  const tx = (b) => pad.left + (b / Math.max(maxB, 1)) * w;
  const ty = (s) => pad.top + h - (s / maxS) * h;

  const toPath = (series) => {
    if (series.length < 2) return '';
    let d = `M ${tx(series[0].b)} ${ty(series[0].s)}`;
    for (let i = 1; i < series.length; i++) {
      d += ` H ${tx(series[i].b)} V ${ty(series[i].s)}`;
    }
    return d;
  };

  const xTicks = Array.from({ length: Math.min(maxB + 1, 6) }, (_, i) => Math.round((i / 5) * maxB));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 180 }}>
      {xTicks.map(b => (
        <line key={b} x1={tx(b)} y1={pad.top} x2={tx(b)} y2={pad.top + h}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={toPath(oppSeries)} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      <path d={toPath(mySeries)} fill="none" stroke="#14b8a6" strokeWidth="2.5" />
      {xTicks.map(b => (
        <text key={b} x={tx(b)} y={height - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">
          B{b}
        </text>
      ))}
      <text x={pad.left - 6} y={pad.top + 4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="9">{maxS}</text>
      <text x={pad.left - 6} y={pad.top + h} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="9">0</text>
    </svg>
  );
};

// ─── Main Analysis Page ───────────────────────────────────────────────────────

const GameAnalysisPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('details'); // 'details' | 'insights'
  const [insightRange, setInsightRange] = useState('all'); // 'all' | '1-10' | '11-15'
  const [msBoardIdx, setMsBoardIdx] = useState(0);

  const { results, gameMode, answerLog, opponent, isMindSnap: isMsFlag } = state || {};
  const myResult = results?.myResult;
  const oppResult = results?.opponentResult;
  const isMindSnap = isMsFlag || gameMode === 'mind_snap';

  const myHistory = myResult?.answerHistory || answerLog || [];
  const oppHistory = oppResult?.answerHistory || [];

  // Mind Snap board histories
  const myBoards = myResult?.boardHistory || [];
  const oppBoards = oppResult?.boardHistory || [];
  const totalBoards = Math.max(myBoards.length, oppBoards.length);

  // Slice by range for Detailed Insights
  const mySlice = useMemo(() => {
    if (insightRange === '1-10') return myHistory.slice(0, 10);
    if (insightRange === '11-15') return myHistory.slice(10, 15);
    return myHistory;
  }, [myHistory, insightRange]);

  const oppSlice = useMemo(() => {
    if (insightRange === '1-10') return oppHistory.slice(0, 10);
    if (insightRange === '11-15') return oppHistory.slice(10, 15);
    return oppHistory;
  }, [oppHistory, insightRange]);

  // Stats computation
  const stats = useMemo(() => {
    const myTimes = myHistory.map(e => e.timeTaken || 0).filter(t => t > 0);
    const oppTimes = oppHistory.map(e => e.timeTaken || 0).filter(t => t > 0);
    const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const fastest = (arr) => arr.length ? Math.min(...arr) : 0;
    const slowest = (arr) => arr.length ? Math.max(...arr) : 0;
    const top3avg = (arr) => arr.length ? avg([...arr].sort((a, b) => a - b).slice(0, 3)) : 0;
    const bot3avg = (arr) => arr.length ? avg([...arr].sort((a, b) => b - a).slice(0, 3)) : 0;

    const byType = (history, type) => history.filter(e => e.questionType === type).map(e => e.timeTaken || 0);

    return {
      myAvg: avg(myTimes).toFixed(2), oppAvg: avg(oppTimes).toFixed(2),
      myFastest: fastest(myTimes).toFixed(2), oppFastest: fastest(oppTimes).toFixed(2),
      mySlowest: slowest(myTimes).toFixed(2), oppSlowest: slowest(oppTimes).toFixed(2),
      my3Fast: top3avg(myTimes).toFixed(2), opp3Fast: top3avg(oppTimes).toFixed(2),
      my3Slow: bot3avg(myTimes).toFixed(2), opp3Slow: bot3avg(oppTimes).toFixed(2),
      myAddAvg: avg(byType(myHistory, 'addition').filter(Boolean)).toFixed(2),
      oppAddAvg: avg(byType(oppHistory, 'addition').filter(Boolean)).toFixed(2),
      myMultAvg: avg(byType(myHistory, 'multiplication').filter(Boolean)).toFixed(2),
      oppMultAvg: avg(byType(oppHistory, 'multiplication').filter(Boolean)).toFixed(2),
      myDivAvg: avg(byType(myHistory, 'division').filter(Boolean)).toFixed(2),
      oppDivAvg: avg(byType(oppHistory, 'division').filter(Boolean)).toFixed(2),
    };
  }, [myHistory, oppHistory]);

  const myScore = myResult?.score ?? 0;
  const oppScore = oppResult?.score ?? 0;
  const myName = 'You';
  const oppName = opponent?.username || 'Opponent';

  // ── Mind Snap analysis ──────────────────────────────────────────────────────
  if (isMindSnap) {
    const curMyBoard = myBoards[msBoardIdx];
    const curOppBoard = oppBoards[msBoardIdx];
    const myAcc = myResult?.totalPatternCells > 0
      ? ((myResult.totalCorrectTaps / myResult.totalPatternCells) * 100).toFixed(1)
      : ((myResult?.accuracy) || 0).toFixed(1);
    const oppAcc = oppResult?.totalPatternCells > 0
      ? ((oppResult.totalCorrectTaps / oppResult.totalPatternCells) * 100).toFixed(1)
      : ((oppResult?.accuracy) || 0).toFixed(1);
    const myMaxPts = myBoards.length ? Math.max(...myBoards.map(b => b.points || 0)) : 0;
    const oppMaxPts = oppBoards.length ? Math.max(...oppBoards.map(b => b.points || 0)) : 0;
    const myAvgTime = myBoards.length ? (myBoards.reduce((s, b) => s + (b.timeTaken || 0), 0) / myBoards.length).toFixed(2) : '0.00';
    const oppAvgTime = oppBoards.length ? (oppBoards.reduce((s, b) => s + (b.timeTaken || 0), 0) / oppBoards.length).toFixed(2) : '0.00';

    const gridSize = curMyBoard?.gridSize || curOppBoard?.gridSize || 4;
    const pattern = curMyBoard?.pattern || curOppBoard?.pattern || [];

    // Reconstruct cellResults for analysis display (missed = in pattern but not correct-tapped)
    const buildDisplayResults = (board) => {
      if (!board) return {};
      const res = { ...board.cellResults };
      (board.missedCells || []).forEach(c => { if (!res[c]) res[c] = 'missed'; });
      return res;
    };

    return (
      <div className="min-h-screen bg-[#0B0B0B] pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0B0B0B]/95 backdrop-blur border-b border-white/8">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white text-sm">←</button>
            <div className="flex gap-1 flex-1">
              {[{ id: 'details', label: 'MATCH DETAILS' }, { id: 'insights', label: 'DETAILED INSIGHTS' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-all
                    ${tab === t.id ? 'text-accent border-b-2 border-accent' : 'text-white/30 hover:text-white/60'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

          {/* Score summary */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="font-heading font-black text-white" style={{ fontSize: 'clamp(3rem,10vw,5rem)' }}>{myScore}</div>
              <div className="text-xs text-white/30 mt-1">{myName}</div>
            </div>
            <div className="text-white/15 text-2xl font-bold">-</div>
            <div className="text-center">
              <div className="font-heading font-black text-white/50" style={{ fontSize: 'clamp(3rem,10vw,5rem)' }}>{oppScore}</div>
              <div className="text-xs text-white/30 mt-1">{oppName}</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2"><div className="w-8 h-0.5 rounded bg-accent" /><span className="text-xs text-white/40">{myName}</span></div>
            <div className="flex items-center gap-2"><div className="w-8 h-0.5 rounded bg-white/25" /><span className="text-xs text-white/40">{oppName}</span></div>
          </div>

          {/* ── Match Details ── */}
          {tab === 'details' && (
            <motion.div key="ms-details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score over boards chart */}
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="text-[10px] text-white/25 tracking-widest uppercase mb-3">Score Over Boards</div>
                <MindSnapScoreChart myBoards={myBoards} oppBoards={oppBoards} />
              </div>

              {/* Stats */}
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-0">
                <StatRow label="ACCURACY" myVal={`${myAcc}%`} oppVal={`${oppAcc}%`} unit="" myWins={parseFloat(myAcc) > parseFloat(oppAcc)} />
                <StatRow label="BOARDS ATTEMPTED" myVal={myBoards.length} oppVal={oppBoards.length} unit="" myWins={myBoards.length > oppBoards.length} />
                <StatRow label="BOARDS COMPLETED" myVal={myResult?.correctCount ?? 0} oppVal={oppResult?.correctCount ?? 0} unit="" myWins={(myResult?.correctCount ?? 0) > (oppResult?.correctCount ?? 0)} />
                <StatRow label="MAX POINTS / BOARD" myVal={myMaxPts} oppVal={oppMaxPts} unit="" myWins={myMaxPts > oppMaxPts} />
                <StatRow label="AVG TIME / BOARD" myVal={myAvgTime} oppVal={oppAvgTime} myWins={parseFloat(myAvgTime) < parseFloat(oppAvgTime)} />
              </div>

              {/* Color legend */}
              <div className="flex items-center gap-4 justify-center text-[10px] text-white/35 tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-700" />MISSED</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-600" />INCORRECT</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-teal-600" />CORRECT</span>
              </div>
            </motion.div>
          )}

          {/* ── Detailed Insights ── */}
          {tab === 'insights' && (
            <motion.div key="ms-insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {totalBoards === 0 ? (
                <div className="text-center text-white/20 py-12">No board data available</div>
              ) : (
                <>
                  {/* Board navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setMsBoardIdx(i => Math.max(0, i - 1))}
                      disabled={msBoardIdx === 0}
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-25 transition-all"
                    >←</button>
                    <div className="font-heading font-black text-white/60 text-sm tracking-widest">
                      {msBoardIdx + 1} OF {totalBoards}
                    </div>
                    <button
                      onClick={() => setMsBoardIdx(i => Math.min(totalBoards - 1, i + 1))}
                      disabled={msBoardIdx === totalBoards - 1}
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-25 transition-all"
                    >→</button>
                  </div>

                  {/* Grid for current board */}
                  <div className="rounded-xl border border-white/8 bg-white/3 p-6">
                    <MindSnapBoardGrid
                      gridSize={gridSize}
                      pattern={pattern}
                      cellResults={buildDisplayResults(curMyBoard)}
                    />
                  </div>

                  {/* Color legend */}
                  <div className="flex items-center gap-4 justify-center text-[10px] text-white/35 tracking-widest">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-700" />MISSED</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-600" />INCORRECT</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-teal-600" />CORRECT</span>
                  </div>

                  {/* Per-board table */}
                  <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/8">
                          <th className="py-2 px-3 text-white/25 font-semibold tracking-widest text-left">POS</th>
                          <th className="py-2 px-3 text-white/25 font-semibold tracking-widest text-left">PLAYER</th>
                          <th className="py-2 px-3 text-white/25 font-semibold tracking-widest text-right">TIME</th>
                          <th className="py-2 px-3 text-white/25 font-semibold tracking-widest text-right">POINTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: myName, board: curMyBoard, isMe: true },
                          { name: oppName, board: curOppBoard, isMe: false },
                        ]
                          .sort((a, b) => (b.board?.points || 0) - (a.board?.points || 0))
                          .map((row, pos) => (
                            <tr key={row.name} className="border-b border-white/5 last:border-0">
                              <td className="py-3 px-3 text-white/40 font-bold">{pos + 1}</td>
                              <td className="py-3 px-3 text-white/70 font-medium">{row.name}</td>
                              <td className="py-3 px-3 text-right text-white/50 font-mono">
                                {row.board?.timeTaken ? `${row.board.timeTaken.toFixed(2)}s` : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-heading font-black"
                                style={{ color: row.isMe ? '#14b8a6' : 'rgba(255,255,255,0.4)' }}>
                                {row.board?.points ?? 0}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/95 backdrop-blur border-t border-white/8 px-4 py-3">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
            <button onClick={() => navigate(-1)}
              className="py-3.5 rounded-xl border border-white/15 text-white font-heading font-bold text-sm tracking-widest hover:border-white/30 transition-all">
              REMATCH
            </button>
            <button onClick={() => navigate('/arena')}
              className="py-3.5 rounded-xl bg-accent text-black font-heading font-bold text-sm tracking-widest hover:bg-accent/90 transition-all">
              NEW GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-32">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0B0B0B]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            ←
          </button>
          <div className="flex gap-1 flex-1">
            {[
              { id: 'details', label: 'MATCH DETAILS' },
              { id: 'insights', label: 'DETAILED INSIGHTS' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-all
                  ${tab === t.id ? 'text-accent border-b-2 border-accent' : 'text-white/30 hover:text-white/60'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Score summary */}
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="font-heading font-black text-white" style={{ fontSize: 'clamp(3rem,10vw,5rem)' }}>{myScore}</div>
            <div className="text-xs text-white/30 mt-1">{myName}</div>
          </div>
          <div className="text-white/15 text-2xl font-bold">-</div>
          <div className="text-center">
            <div className="font-heading font-black text-white/50" style={{ fontSize: 'clamp(3rem,10vw,5rem)' }}>{oppScore}</div>
            <div className="text-xs text-white/30 mt-1">{oppName}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded bg-accent" />
            <span className="text-xs text-white/40">{myName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 rounded bg-white/25" />
            <span className="text-xs text-white/40">{oppName}</span>
          </div>
        </div>

        {/* ── Match Details tab ───────────────────────────────────────────── */}
        {tab === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Step chart */}
            {gameMode === 'sprint' && myHistory.some(e => e.timestamp !== undefined) ? (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="text-[10px] text-white/25 tracking-widest uppercase mb-3">Correct Answers Over Time</div>
                <StepChart
                  myHistory={myHistory}
                  oppHistory={oppHistory}
                  duration={60}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-center text-white/20 text-sm py-8">
                Step chart available for Sprint mode
              </div>
            )}

            {/* Stats table */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="text-[10px] text-white/25 tracking-widest uppercase mb-3">Response Times</div>
              <StatRow label="AVG" myVal={stats.myAvg} oppVal={stats.oppAvg} myWins={parseFloat(stats.myAvg) < parseFloat(stats.oppAvg)} />
              <StatRow label="FASTEST" myVal={stats.myFastest} oppVal={stats.oppFastest} myWins={parseFloat(stats.myFastest) < parseFloat(stats.oppFastest)} />
              <StatRow label="SLOWEST" myVal={stats.mySlowest} oppVal={stats.oppSlowest} myWins={parseFloat(stats.mySlowest) < parseFloat(stats.oppSlowest)} />
              <StatRow label="3 FAST AVG" myVal={stats.my3Fast} oppVal={stats.opp3Fast} myWins={parseFloat(stats.my3Fast) < parseFloat(stats.opp3Fast)} />
              <StatRow label="3 SLOW AVG" myVal={stats.my3Slow} oppVal={stats.opp3Slow} myWins={parseFloat(stats.my3Slow) < parseFloat(stats.opp3Slow)} />
              {parseFloat(stats.myAddAvg) > 0 && (
                <StatRow label="ADD AVG" myVal={stats.myAddAvg} oppVal={stats.oppAddAvg} myWins={parseFloat(stats.myAddAvg) < parseFloat(stats.oppAddAvg)} />
              )}
              {parseFloat(stats.myMultAvg) > 0 && (
                <StatRow label="MULT AVG" myVal={stats.myMultAvg} oppVal={stats.oppMultAvg} myWins={parseFloat(stats.myMultAvg) < parseFloat(stats.oppMultAvg)} />
              )}
              {parseFloat(stats.myDivAvg) > 0 && (
                <StatRow label="DIV AVG" myVal={stats.myDivAvg} oppVal={stats.oppDivAvg} myWins={parseFloat(stats.myDivAvg) < parseFloat(stats.oppDivAvg)} />
              )}
            </div>
          </motion.div>
        )}

        {/* ── Detailed Insights tab ───────────────────────────────────────── */}
        {tab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Range selector */}
            <div className="flex gap-2 justify-center">
              {[
                { id: 'all', label: 'ALL' },
                { id: '1-10', label: 'Q1–Q10' },
                { id: '11-15', label: 'Q11–Q15' },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setInsightRange(r.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all
                    ${insightRange === r.id ? 'bg-accent/20 text-accent border border-accent/40' : 'text-white/30 hover:text-white/60'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Line chart */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="text-[10px] text-white/25 tracking-widest uppercase mb-3">Response Time per Question</div>
              <ResponseTimeChart myHistory={mySlice} oppHistory={oppSlice} />
            </div>

            {/* Preset analysis */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="text-[10px] text-white/25 tracking-widest uppercase mb-3">Preset Analysis</div>
              <PresetAnalysisTable myHistory={mySlice} oppHistory={oppSlice} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B0B0B]/95 backdrop-blur border-t border-white/8 px-4 py-3">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="py-3.5 rounded-xl border border-white/15 text-white font-heading font-bold text-sm tracking-widest hover:border-white/30 transition-all"
          >
            REMATCH
          </button>
          <button
            onClick={() => navigate('/arena')}
            className="py-3.5 rounded-xl bg-accent text-black font-heading font-bold text-sm tracking-widest hover:bg-accent/90 transition-all"
          >
            NEW GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameAnalysisPage;
