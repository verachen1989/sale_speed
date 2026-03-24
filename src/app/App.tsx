import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  SendHorizontal,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

type Metric = {
  label: string;
  value: string;
  trend: string;
};

type TableRow = {
  month: string;
  sales: string;
  mom: string;
  projects: number;
};

type EventCard = {
  title: string;
  desc: string;
  tokens: number;
  kind?: 'skill';
};

type Scenario = {
  answer: string;
  metrics: Metric[];
  highlights: string[];
  tableRows?: TableRow[];
  footText: string;
  events: EventCard[];
};

const styles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    background:
      radial-gradient(circle at top left, rgba(198, 235, 213, 0.42), transparent 28%),
      linear-gradient(180deg, #f8fbf9 0%, #ffffff 26%, #ffffff 100%);
    color: #1f2937;
  }
  .page-shell {
    min-height: 100vh;
    padding: 24px 32px 36px;
  }
  .page-head {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 16px;
  }
  .head-badge {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: linear-gradient(135deg, #ffcd67, #f59e0b);
  }
  .workspace {
    max-width: 1160px;
    min-height: calc(100vh - 84px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }
  .workspace.landing {
    justify-content: center;
    gap: 30px;
  }
  .landing-hero {
    text-align: center;
    max-width: 960px;
    margin: 0 auto;
  }
  .landing-hero.hidden { display: none; }
  .landing-title {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-size: 28px;
    font-weight: 600;
    color: #1f7a4f;
    margin-bottom: 18px;
  }
  .landing-title strong { color: #1f7a4f; }
  .landing-bot {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef8f1;
    color: #1f7a4f;
    box-shadow: inset 0 0 0 1px #d7efde;
  }
  .landing-subtitle {
    color: #6b7280;
    font-size: 15px;
    line-height: 1.9;
  }
  .chat-thread {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin: 18px 0 24px;
  }
  .chat-thread.hidden { display: none; }
  .user-row {
    display: flex;
    justify-content: flex-end;
  }
  .user-bubble {
    max-width: 480px;
    padding: 16px 20px;
    border-radius: 16px;
    background: #f2f4f7;
    color: #2d3748;
    line-height: 1.8;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  }
  .assistant-row {
    width: 720px;
    max-width: 100%;
    margin-left: 120px;
  }
  .assistant-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .assistant-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef8f1;
    color: #1f7a4f;
    box-shadow: inset 0 0 0 1px #d7efde;
  }
  .assistant-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    color: #4b5563;
  }
  .typing-dots {
    display: flex;
    gap: 5px;
    align-items: center;
  }
  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9ca3af;
    animation: blink 1.2s infinite ease-in-out;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink {
    0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-2px); }
  }
  .event-stream {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
  }
  .thought-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    padding: 8px 12px;
    border-radius: 999px;
    background: #f8fafb;
    border: 1px solid #e9eef2;
    color: #6b7280;
    font-size: 13px;
  }
  .thought-pill.hidden { display: none; }
  .thought-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef3f6;
    color: #64748b;
    font-size: 11px;
  }
  .event-card {
    opacity: 0;
    transform: translateY(10px);
    background: #f6f8fa;
    border: 1px solid #e8edf2;
    border-radius: 12px;
    padding: 14px 16px;
    animation: fadeUp 0.32s ease forwards;
  }
  .event-card.skill {
    background:
      linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,250,252,0.96)) padding-box,
      linear-gradient(135deg, rgba(79,172,254,0.42), rgba(0,242,254,0.36), rgba(121,40,202,0.34)) border-box;
    border: 1px solid transparent;
    box-shadow: 0 10px 24px rgba(79, 172, 254, 0.10);
  }
  .event-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }
  .event-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }
  .event-card.skill .event-title {
    background: linear-gradient(90deg, #2563eb, #0ea5e9 45%, #7c3aed 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .event-token {
    padding: 4px 8px;
    border-radius: 999px;
    background: #eef6f1;
    color: #1f7a4f;
    font-size: 12px;
    border: 1px solid #d9ece0;
  }
  .event-card.skill .event-token {
    background: linear-gradient(135deg, rgba(79,172,254,0.10), rgba(121,40,202,0.10));
    color: #4c51bf;
    border-color: rgba(99, 102, 241, 0.18);
  }
  .event-desc {
    font-size: 13px;
    line-height: 1.7;
    color: #6b7280;
  }
  .answer-card {
    display: none;
    border-radius: 16px;
    background: #fff;
    border: 1px solid #e8edf2;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
    overflow: hidden;
  }
  .answer-card.show {
    display: block;
    animation: fadeUp 0.32s ease;
  }
  .answer-main {
    padding: 18px 20px 10px;
  }
  .answer-text {
    min-height: 56px;
    white-space: pre-wrap;
    color: #2f3541;
    line-height: 1.9;
  }
  .cursor {
    display: inline-block;
    width: 9px;
    margin-left: 2px;
    color: #9aa4b2;
    animation: blinkCursor 1s infinite;
  }
  @keyframes blinkCursor {
    0%, 45% { opacity: 1; }
    46%, 100% { opacity: 0; }
  }
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 0 20px 18px;
  }
  .metric-card {
    padding: 14px;
    border-radius: 14px;
    background: linear-gradient(180deg, #fbfcfd, #f6f9fb);
    border: 1px solid #edf1f5;
    animation: fadeUp 0.32s ease;
  }
  .metric-label { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
  .metric-value { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 6px; }
  .metric-trend { font-size: 12px; color: #1f7a4f; }
  .highlight-list {
    padding: 0 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .highlight-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    color: #4b5563;
    line-height: 1.8;
    animation: fadeUp 0.32s ease;
  }
  .highlight-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7fc69a;
    margin-top: 10px;
    flex: none;
  }
  .table-card {
    margin: 0 20px 20px;
    border: 1px solid #e8edf2;
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
    display: none;
  }
  .table-card.show {
    display: block;
    animation: fadeUp 0.32s ease;
  }
  .table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    background: #fbfcfd;
    border-bottom: 1px solid #edf1f5;
  }
  .table-title { font-size: 14px; font-weight: 600; color: #1f2937; }
  .table-actions { display: flex; align-items: center; gap: 10px; }
  .action-btn {
    height: 32px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid #d8e0e8;
    background: #fff;
    color: #475569;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .action-btn:hover { border-color: #9ed1b1; color: #1f7a4f; background: #f6fcf8; }
  .action-btn.success { border-color: #b9e3c7; color: #1f7a4f; background: #eefaf2; }
  .download-menu { position: relative; }
  .download-panel {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 128px;
    padding: 6px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e5ebf0;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.10);
    display: none;
    z-index: 5;
  }
  .download-panel.show { display: block; animation: fadeUp 0.2s ease; }
  .download-item {
    width: 100%;
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    text-align: left;
    padding: 0 10px;
    color: #374151;
    cursor: pointer;
  }
  .download-item:hover { background: #f6f8fa; }
  .table-wrap { overflow-x: auto; }
  .result-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    color: #374151;
  }
  .result-table th, .result-table td {
    padding: 12px 14px;
    border-bottom: 1px solid #eef2f5;
    text-align: left;
    white-space: nowrap;
  }
  .result-table th {
    background: #fcfdfd;
    color: #64748b;
    font-weight: 600;
  }
  .answer-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 12px;
  }
  .answer-action {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid transparent;
    background: transparent;
    color: #94a3b8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .answer-action svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.8; }
  .answer-action:hover { color: #475569; background: #f8fafc; }
  .answer-action.active { color: #1f7a4f; background: #eefaf2; border-color: #d9ece0; }
  .foot-note {
    margin-top: 10px;
    color: #9ca3af;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .foot-note.show { opacity: 1; }
  .suggest-block {
    margin-top: 12px;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.28s ease;
  }
  .suggest-block.show { opacity: 1; transform: translateY(0); }
  .suggest-title { color: #4b5563; font-size: 14px; margin-bottom: 10px; }
  .suggest-list { display: flex; flex-wrap: wrap; gap: 10px; }
  .suggest-btn {
    border: 1px solid #d7dde5;
    background: #fff;
    color: #374151;
    font-size: 14px;
    border-radius: 10px;
    padding: 12px 16px;
    cursor: pointer;
  }
  .suggest-btn:hover { border-color: #9ed1b1; color: #1f7a4f; background: #f6fcf8; }
  .composer {
    width: min(1080px, 100%);
    margin: auto auto 0;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(8px);
    border: 1px solid #e8edf2;
    border-radius: 18px;
    min-height: 156px;
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
    padding: 18px 22px 56px;
    position: relative;
  }
  .composer-input {
    width: 100%;
    min-height: 78px;
    border: 0;
    outline: none;
    resize: none;
    background: transparent;
    color: #1f2937;
    font-size: 15px;
    line-height: 1.8;
    font-family: inherit;
  }
  .composer-input::placeholder { color: #b0b8c3; }
  .composer-footer {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .toolbar { display: flex; align-items: center; gap: 10px; }
  .agent-tag {
    height: 30px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid #9ed1b1;
    color: #1f7a4f;
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    background: #f5fcf7;
  }
  .tool-btn {
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid #d7dde5;
    background: #fff;
    color: #475569;
    cursor: pointer;
    font-size: 13px;
  }
  .tool-btn:hover { border-color: #9ed1b1; color: #1f7a4f; background: #f6fcf8; }
  .send-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 0;
    background: linear-gradient(135deg, #b8ead0, #8bd6ae);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(139, 214, 174, 0.34);
  }
  .send-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 1100px) {
    .assistant-row { width: 100%; margin-left: 0; }
    .metric-grid { grid-template-columns: 1fr; }
  }
`;

const trendTable: TableRow[] = [
  { month: '1月', sales: '0.82亿', mom: '+5.2%', projects: 8 },
  { month: '2月', sales: '0.91亿', mom: '+11.0%', projects: 8 },
  { month: '3月', sales: '1.34亿', mom: '+47.3%', projects: 9 },
  { month: '4月', sales: '1.06亿', mom: '-20.9%', projects: 9 },
  { month: '5月', sales: '0.98亿', mom: '-7.5%', projects: 9 },
  { month: '6月', sales: '1.08亿', mom: '+10.2%', projects: 10 },
];

function getScenario(question: string): Scenario {
  const normalized = question.replace(/\s+/g, '');
  const isFlow = normalized.includes('流速');
  const isCompletion = normalized.includes('完成率');

  if (isFlow) {
    return {
      answer:
        '华北区域流速整体在二季度后明显改善，6 月到 8 月去化效率提升较快。\n\n如果继续展开，建议优先看成交套数与库存去化周期的联动变化，也可以继续按城市公司拆分。',
      metrics: [
        { label: '月均去化速度', value: '1.8月', trend: '较上期提升 12%' },
        { label: '成交转化率', value: '14.6%', trend: '较上期提升 2.1pt' },
        { label: '库存压力', value: '中等', trend: '重点关注尾部项目' },
      ],
      highlights: [
        '二季度后流速改善明显，6 月到 8 月提升最显著。',
        '成交套数增长与库存去化周期缩短同步发生，说明去化效率在提升。',
        '建议优先下钻尾部项目，进一步看价格策略和来访转化。',
      ],
      footText: '分析完成，耗时 2.4 秒，消耗 466 tokens',
      events: [
        { title: '正在思考问题意图', desc: '已识别为流速分析问题，需要查看华北区域项目近阶段销售去化节奏。', tokens: 86 },
        { title: '调用了销售流速分析技能', desc: '已选择销售流速分析技能，准备查询成交套数、来访转化率和库存去化周期。', tokens: 132, kind: 'skill' },
        { title: '查询了销售流速月度数据集', desc: '已返回 12 条月度记录，并完成按月份聚合，可继续下钻到城市公司或单项目。', tokens: 248 },
      ],
    };
  }

  if (isCompletion) {
    return {
      answer:
        '华北区域销售业绩完成率整体处于目标区间内，但项目间分化较明显。\n\n其中头部项目完成率较高，尾部项目与目标存在一定差距，建议优先关注低完成率项目的来访与转化情况。',
      metrics: [
        { label: '整体完成率', value: '92%', trend: '接近目标区间' },
        { label: '高完成项目', value: '6个', trend: '表现稳定' },
        { label: '低完成项目', value: '3个', trend: '建议重点跟进' },
      ],
      highlights: [
        '头部项目完成率较高，整体处于目标区间内。',
        '尾部项目与目标存在差距，项目间分化较明显。',
        '建议结合来访与成交转化一起看，更容易定位偏差原因。',
      ],
      footText: '分析完成，耗时 2.6 秒，消耗 418 tokens',
      events: [
        { title: '正在思考问题意图', desc: '已识别为经营目标完成率分析，需要对比目标值与实际销售结果。', tokens: 74 },
        { title: '调用了销售完成率分析技能', desc: '已进入销售完成率分析技能，准备对比目标值与实际销售结果。', tokens: 118, kind: 'skill' },
        { title: '查询了销售目标对比数据集', desc: '已同时获取目标任务与实际完成数据，并完成完成率计算。', tokens: 226 },
      ],
    };
  }

  return {
    answer:
      '华北区域各项目今年销售情况整体呈波动上升趋势，其中 3 月和 8 月为阶段性高点。\n\n如果按月展示，可看到一季度稳步爬升，二季度略有波动，三季度再次抬升，四季度当前保持平稳。若需要，我可以继续按项目名称、城市公司或业态类型进一步拆分。',
    metrics: [
      { label: '累计销售额', value: '12.6亿', trend: '同比提升 8.4%' },
      { label: '高点月份', value: '3月/8月', trend: '阶段性拉升明显' },
      { label: '月均表现', value: '1.05亿', trend: '整体波动上行' },
    ],
    highlights: [
      '一季度稳步爬升，二季度略有波动，三季度再次抬升。',
      '3 月和 8 月为阶段性高点，月度表现存在季节性特征。',
      '如果继续追问，建议按项目或城市公司拆分，定位贡献来源。',
    ],
    tableRows: trendTable,
    footText: '分析完成，耗时 2.8 秒，消耗 502 tokens',
    events: [
      { title: '正在思考问题意图', desc: '已识别为经营数据查询问题，目标是查看华北区域项目今年销售情况，并按月份进行展示。', tokens: 92 },
      { title: '调用了月度销售趋势分析技能', desc: '开始进入月度销售趋势分析技能，准备拉取华北区域今年销售情况。', tokens: 146, kind: 'skill' },
      { title: '查询了销售趋势月度数据集', desc: '已返回 12 个时间点的数据，并完成按月份汇总，可用于趋势图和项目明细展示。', tokens: 264 },
    ],
  };
}

export default function App() {
  const [input, setInput] = useState('');
  const [isLanding, setIsLanding] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [question, setQuestion] = useState('');
  const [statusText, setStatusText] = useState('等待提问');
  const [headerStatus, setHeaderStatus] = useState('等待发送问题');
  const [events, setEvents] = useState<EventCard[]>([]);
  const [answer, setAnswer] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [footText, setFootText] = useState('');
  const [copyDone, setCopyDone] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [sendFeishuText, setSendFeishuText] = useState('发送到飞书');
  const [downloadText, setDownloadText] = useState('下载');
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [showTypingDots, setShowTypingDots] = useState(false);

  const runIdRef = useRef(0);
  const thoughtTimerRef = useRef<number | null>(null);

  const suggestions = useMemo(
    () => [
      '华北区域销售业绩完成率，按项目展示',
      '华北区域流速分析，按月展示',
    ],
    [],
  );

  useEffect(() => () => {
    if (thoughtTimerRef.current) {
      window.clearInterval(thoughtTimerRef.current);
    }
  }, []);

  function clearThoughtTimer() {
    if (thoughtTimerRef.current) {
      window.clearInterval(thoughtTimerRef.current);
      thoughtTimerRef.current = null;
    }
  }

  function resetResultState() {
    setEvents([]);
    setAnswer('');
    setMetrics([]);
    setHighlights([]);
    setTableRows([]);
    setShowAnswer(false);
    setShowSuggestions(false);
    setFootText('');
    setStatusText('等待提问');
    setHeaderStatus('等待发送问题');
    setCopyDone(false);
    setLiked(false);
    setDisliked(false);
    setSendFeishuText('发送到飞书');
    setDownloadText('下载');
    setDownloadMenuOpen(false);
    setShowTypingDots(false);
  }

  async function typeAnswer(text: string, runId: number) {
    setAnswer('');
    for (let i = 0; i < text.length; i += 1) {
      if (runIdRef.current !== runId) return;
      setAnswer(text.slice(0, i + 1));
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => window.setTimeout(resolve, 20));
    }
  }

  async function runScenario(nextQuestion: string) {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    const scenario = getScenario(nextQuestion);

    resetResultState();
    setIsLanding(false);
    setIsRunning(true);
    setQuestion(nextQuestion);
    setHeaderStatus('正在分析问题');
    setShowTypingDots(true);
    setStatusText('正在思考');

    const thoughtStartedAt = Date.now();
    clearThoughtTimer();
    thoughtTimerRef.current = window.setInterval(() => {
      const seconds = Math.max(1, Math.round((Date.now() - thoughtStartedAt) / 1000));
      setStatusText(`已思考 ${seconds} 秒`);
    }, 250);

    for (const event of scenario.events) {
      if (runIdRef.current !== runId) return;
      setHeaderStatus(event.title);
      setEvents(prev => [...prev, event]);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => window.setTimeout(resolve, 850));
    }

    if (runIdRef.current !== runId) return;

    clearThoughtTimer();
    setHeaderStatus('正在生成最终回答');
    setStatusText('结果展示中');
    setShowAnswer(true);
    await typeAnswer(scenario.answer, runId);

    if (runIdRef.current !== runId) return;

    setMetrics(scenario.metrics);
    await new Promise(resolve => window.setTimeout(resolve, 160));
    setHighlights(scenario.highlights);

    if (scenario.tableRows?.length) {
      await new Promise(resolve => window.setTimeout(resolve, 180));
      setTableRows(scenario.tableRows);
    }

    setFootText(scenario.footText);
    setShowSuggestions(true);
    setShowTypingDots(false);
    setHeaderStatus('分析完成');
    setStatusText('回答已生成');
    setIsRunning(false);
  }

  function handleSubmit(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isRunning) return;
    void runScenario(trimmed);
  }

  async function handleCopy() {
    if (!answer.trim()) return;
    try {
      await navigator.clipboard.writeText(answer.trim());
    } catch (_error) {
      // noop
    }
    setCopyDone(true);
  }

  return (
    <>
      <style>{styles}</style>
      <div className="page-shell">
        <div className="page-head">
          <div className="head-badge" />
          <div>问数智能体</div>
        </div>

        <div className={`workspace${isLanding ? ' landing' : ''}`}>
          <div className={`landing-hero${isLanding ? '' : ' hidden'}`}>
            <div className="landing-title">
              <span className="landing-bot">
                <Bot size={22} />
              </span>
              <span>
                Hi～ 我是小绿同学，<strong>问数智能体</strong>
              </span>
            </div>
            <div className="landing-subtitle">
              货值、计划、认购、签约、回款、到访；人数统计、人才分析、招聘效能，这些数据我都有！您想查什么数，来问我吧～
            </div>
          </div>

          <div className={`chat-thread${isLanding ? ' hidden' : ''}`}>
            <div className="user-row">
              <div className="user-bubble">{question}</div>
            </div>

            <div className="assistant-row">
              <div className="assistant-head">
                <div className="assistant-avatar">
                  <Bot size={22} />
                </div>
                <div className="assistant-status">
                  <span>{headerStatus}</span>
                  {showTypingDots ? (
                    <div className="typing-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="event-stream">
                <div className={`thought-pill${isLanding ? ' hidden' : ''}`}>
                  <span className="thought-icon">··</span>
                  <span>{statusText}</span>
                </div>

                {events.map((event, index) => (
                  <div key={`${event.title}-${index}`} className={`event-card${event.kind === 'skill' ? ' skill' : ''}`}>
                    <div className="event-top">
                      <div className="event-title">{event.title}</div>
                      <div className="event-token">{event.tokens} tokens</div>
                    </div>
                    <div className="event-desc">{event.desc}</div>
                  </div>
                ))}
              </div>

              <div className={`answer-card${showAnswer ? ' show' : ''}`}>
                <div className="answer-main">
                  <div className="answer-text">
                    {answer}
                    {isRunning && showAnswer ? <span className="cursor">|</span> : null}
                  </div>
                </div>

                {metrics.length ? (
                  <div className="metric-grid">
                    {metrics.map(metric => (
                      <div key={metric.label} className="metric-card">
                        <div className="metric-label">{metric.label}</div>
                        <div className="metric-value">{metric.value}</div>
                        <div className="metric-trend">{metric.trend}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {highlights.length ? (
                  <div className="highlight-list">
                    {highlights.map(item => (
                      <div key={item} className="highlight-item">
                        <span className="highlight-dot" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className={`table-card${tableRows.length ? ' show' : ''}`}>
                  <div className="table-toolbar">
                    <div className="table-title">月度销售明细表</div>
                    <div className="table-actions">
                      <button
                        type="button"
                        className={`action-btn${sendFeishuText !== '发送到飞书' ? ' success' : ''}`}
                        onClick={async () => {
                          if (!tableRows.length) return;
                          setSendFeishuText('发送中...');
                          await new Promise(resolve => window.setTimeout(resolve, 900));
                          setSendFeishuText('已发送到飞书');
                        }}
                      >
                        {sendFeishuText}
                      </button>
                      <div className="download-menu">
                        <button type="button" className={`action-btn${downloadText !== '下载' ? ' success' : ''}`} onClick={() => setDownloadMenuOpen(value => !value)}>
                          {downloadText}
                        </button>
                        <div className={`download-panel${downloadMenuOpen ? ' show' : ''}`}>
                          {['CSV', 'Excel', '图片'].map(format => (
                            <button
                              key={format}
                              type="button"
                              className="download-item"
                              onClick={async () => {
                                setDownloadMenuOpen(false);
                                setDownloadText(`下载${format}中...`);
                                await new Promise(resolve => window.setTimeout(resolve, 700));
                                setDownloadText(`已下载${format}`);
                              }}
                            >
                              下载{format}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>月份</th>
                          <th>销售额</th>
                          <th>环比</th>
                          <th>项目数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map(row => (
                          <tr key={row.month}>
                            <td>{row.month}</td>
                            <td>{row.sales}</td>
                            <td>{row.mom}</td>
                            <td>{row.projects}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="answer-actions">
                <button type="button" className={`answer-action${liked ? ' active' : ''}`} aria-label="点赞" onClick={() => { setLiked(true); setDisliked(false); }}>
                  <ThumbsUp size={16} />
                </button>
                <button type="button" className={`answer-action${disliked ? ' active' : ''}`} aria-label="点踩" onClick={() => { setDisliked(true); setLiked(false); }}>
                  <ThumbsDown size={16} />
                </button>
                <button type="button" className={`answer-action${copyDone ? ' active' : ''}`} aria-label="复制答案" onClick={() => void handleCopy()}>
                  {copyDone ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className={`foot-note${footText ? ' show' : ''}`}>{footText}</div>

              <div className={`suggest-block${showSuggestions ? ' show' : ''}`}>
                <div className="suggest-title">猜你想继续问：</div>
                <div className="suggest-list">
                  {suggestions.map(item => (
                    <button key={item} type="button" className="suggest-btn" onClick={() => { setInput(item); handleSubmit(item); }}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="composer">
            <textarea
              className="composer-input"
              placeholder="有问题尽管问我，Ctrl+Enter/Shift+Enter 换行"
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
                  event.preventDefault();
                  handleSubmit(input);
                }
              }}
            />
            <div className="composer-footer">
              <div className="toolbar">
                <div className="agent-tag">小绿同学</div>
                <button type="button" className="tool-btn" onClick={() => { if (question) void runScenario(question); }} disabled={isRunning || !question}>
                  重播流程
                </button>
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => {
                    runIdRef.current += 1;
                    clearThoughtTimer();
                    resetResultState();
                    setIsLanding(true);
                    setQuestion('');
                    setInput('');
                    setIsRunning(false);
                  }}
                >
                  清空过程
                </button>
              </div>
              <button type="button" className="send-btn" onClick={() => handleSubmit(input)} disabled={isRunning}>
                <SendHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
