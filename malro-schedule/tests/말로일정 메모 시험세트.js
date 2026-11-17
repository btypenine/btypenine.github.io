#!/usr/bin/env node
// 말로일정 메모 시험세트 — 「말로 일정」 음성 메모 판별·분류기(KoMemo) 시험
//
// 실행:  node "malro-schedule/tests/말로일정 메모 시험세트.js" [index.html 경로] [--all]
//   - 경로를 안 주면 이 파일 기준 ../index.html 을 읽음
//   - index.html 첫 <script> 안의 KoParse·KoMemo 블록만 꺼내 실행함 (화면 코드·저장소 데이터 미사용)
//   - --all : 통과한 문장도 모두 출력
//
// 기준 시각: 2026-11-18(수) 10:00 고정 (해석기 시험세트와 같음)
//   이번주 11-16(월)~11-22(일) · 어제 11-17 · 이번 주말 11-21(토)
//
// 판정 기준
//   저장(18): 메모로 판별(버튼 모드 문장은 판별 생략) + 본문·분류 일치 + 일정 후보(날짜·시간) 일치
//   확인(8) : 메모 확인 질문으로 판별 + 기간·분류·별표·검색어·읽어주기 일치
//   아님(4) : 메모로 판별하지 않음 + 메모 확인 질문으로도 판별하지 않음 (일정·할 일로 그대로 등록)
//   회귀    : 해석기 시험세트 100문장 전부 — 메모·메모 질문으로 오판 0건, 해석기 결과 그대로 통과
//
// 완료 기준: 메모 시험 통과율 90% 이상 + 회귀 오판 0건 + 해석기 시험세트 95% 이상·기존 예시 전부 통과

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function block(html, head) {
  const start = html.indexOf(head);
  if (start < 0) throw new Error('블록을 찾지 못함: ' + head);
  const end = html.indexOf('\n})();', start);
  if (end < 0) throw new Error('블록 끝을 찾지 못함: ' + head);
  return html.slice(start, end + 6);
}
function loadAll(file) {
  const html = fs.readFileSync(file, 'utf8');
  const code = block(html, 'const KoParse = (() => {') + '\n' + block(html, 'const KoMemo = (() => {') + '\nthis.KoParse = KoParse; this.KoMemo = KoMemo;';
  const ctx = { Date, Math, String, Number, RegExp, Set, Map, Array, Object, JSON };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { K: ctx.KoParse, M: ctx.KoMemo };
}

const NOW = '2026-11-18T10:00:00';
const D = s => (s == null ? null : '2026-' + s);
const C = [];
// 저장: s(문장, 본문, 분류, {when:{date,time}, btn})
const s = (text, body, cat, o = {}) => C.push({ kind: 'save', text, body, cat, when: o.when ? { date: D(o.when[0]), time: o.when[1] || null } : null, btn: !!o.btn, grp: o.grp || '' });
// 확인: q(문장, {from,to,cat,star,kw,speak})
const q = (text, o = {}) => C.push({ kind: 'query', text, from: D(o.from), to: D(o.to || o.from), cat: o.cat || null, star: !!o.star, kw: o.kw || '', speak: !!o.speak });
// 아님: n(문장)
const n = text => C.push({ kind: 'not', text });

// --- 앞에 붙여 말하기 (분류별) ---
s('아이디어 윙스텝 월 구독형 렌탈 서비스로 팔아보기', '윙스텝 월 구독형 렌탈 서비스로 팔아보기', 'biz', { grp: '사업' });
s('생각났는데 스마트스토어에 점프스타터 세트 상품 올리면 매출 늘 듯', '스마트스토어에 점프스타터 세트 상품 올리면 매출 늘 듯', 'biz', { grp: '사업' });
s('메모 교육 키트 학교 대상으로 유료 구독 모델 만들기', '교육 키트 학교 대상으로 유료 구독 모델 만들기', 'biz', { grp: '사업' });
s('아이디어 윙가드 센서를 초음파 말고 레이더로 바꿔보기', '윙가드 센서를 초음파 말고 레이더로 바꿔보기', 'dev', { grp: '제품' });
s('메모 브라켓 두께 3mm로 줄이고 3D 프린터로 시제품 다시 뽑기', '브라켓 두께 3mm로 줄이고 3D 프린터로 시제품 다시 뽑기', 'dev', { grp: '제품' });
s('기억해 앱 화면에서 버튼 글자가 쪼개지는 오류 고치기', '앱 화면에서 버튼 글자가 쪼개지는 오류 고치기', 'dev', { grp: '제품' });
s('메모 부가세 신고 서류 이번달 안에 세무사한테 보내기', '부가세 신고 서류 이번달 안에 세무사한테 보내기', 'work', { grp: '업무' });
s('생각났는데 견적서 양식 새로 정리해서 직원들한테 공유하기', '견적서 양식 새로 정리해서 직원들한테 공유하기', 'work', { grp: '업무' });
s('기억해 줘 동헌이형한테 통관 서류 물어보고 안부 전화하기', '동헌이형한테 통관 서류 물어보고 안부 전화하기', 'people', { grp: '사람' });
s('메모 상도형님 만나면 웹 프로그램 같이 쓰는 거 얘기하기', '상도형님 만나면 웹 프로그램 같이 쓰는 거 얘기하기', 'people', { grp: '사람' });
s('아이디어 주말에 가족이랑 바닷가 캠핑 가기', '주말에 가족이랑 바닷가 캠핑 가기', 'life', { when: ['11-21', null], grp: '생활·일정후보' });
s('메모 어항 산호 조명 시간 바꾸기', '어항 산호 조명 시간 바꾸기', 'life', { grp: '생활' });
s('메모 라디오에서 들은 노래 제목 찾아보기', '라디오에서 들은 노래 제목 찾아보기', 'etc', { grp: '기타' });
// --- 뒤에 붙여 말하기 · 머뭇거림 ---
s('윙스텝 색상 옵션에 매트 블랙 추가 메모해 줘', '윙스텝 색상 옵션에 매트 블랙 추가', 'dev', { grp: '뒤에 붙임' });
s('고객 후기 이벤트 하면 좋겠다고 기록해 둬', '고객 후기 이벤트 하면 좋겠다', 'biz', { grp: '뒤에 붙임' });
s('아 맞다 아이디어 쉼 식당 키오스크랑 식수 체크 묶어서 팔기', '쉼 식당 키오스크랑 식수 체크 묶어서 팔기', 'biz', { grp: '머뭇거림' });
// --- 💡 버튼(메모 모드): 붙이는 말 없이 그대로 ---
s('다음 달 전시회 부스에 윙스텝 실물 시연 장비 가져가기', '다음 달 전시회 부스에 윙스텝 실물 시연 장비 가져가기', 'work', { btn: 1, grp: '버튼' });
s('내일 오후 3시에 금형 업체 미팅 잡기', '내일 오후 3시에 금형 업체 미팅 잡기', 'work', { btn: 1, when: ['11-19', '15:00'], grp: '버튼·일정후보' });

// --- 메모 확인 질문 ---
q('아이디어 메모 보여줘');
q('이번주 메모 읽어줘', { from: '11-16', to: '11-22', speak: 1 });
q('사업 아이디어 메모 보여줘', { cat: 'biz' });
q('윙스텝 관련 메모 찾아줘', { kw: '윙스텝' });
q('별표한 메모 보여줘', { star: 1 });
q('어제 메모한 거 읽어줘', { from: '11-17', speak: 1 });
q('메모에서 동헌이형 찾아줘', { kw: '동헌이형' });
q('제품 개발 메모 몇 개야', { cat: 'dev' });

// --- 메모가 아님 (일정·할 일로 그대로) ---
n('아이디어 회의 내일 오후 2시');
n('메모지랑 볼펜 사기');
n('내일 3시 회의 메모해 줘');
n('회의록 정리하기');

const ns = x => String(x || '').replace(/\s/g, '');
function judge({ K, M }, c) {
  const now = new Date(NOW);
  const why = []; let got = '';
  if (c.kind === 'save') {
    let body = c.text;
    if (!c.btn) {
      if (M.parseQuery(c.text, null, now)) why.push('메모 확인 질문으로 오판');
      const d = M.detect(c.text);
      if (!d) { why.push('메모로 판별 못함'); return { ok: false, why, got: '일정으로 처리' }; }
      body = d.body;
    }
    const m = M.make(body, M.DEFAULT_CATS, now);
    got = `본문「${body}」 제목「${m.title}」 분류 ${m.cat} 태그 [${m.tags.join(',')}]` + (m.when ? ` 일정후보 ${m.when.date} ${m.when.time || '종일'}` : '');
    if (ns(body) !== ns(c.body)) why.push(`본문 다름`);
    if (m.cat !== c.cat) why.push(`분류 ${m.cat}≠${c.cat}`);
    if (!m.title) why.push('제목 없음');
    const w = m.when ? { date: m.when.date, time: m.when.time || null } : null;
    if (JSON.stringify(w) !== JSON.stringify(c.when)) why.push(`일정후보 ${JSON.stringify(w)}≠${JSON.stringify(c.when)}`);
  } else if (c.kind === 'query') {
    const r = M.parseQuery(c.text, null, now);
    if (!r) return { ok: false, why: ['메모 질문으로 인식 못함'], got: M.detect(c.text) ? '메모로 저장됨' : '일정으로 처리' };
    got = `기간 ${r.from || '전체'}~${r.to || ''} 분류 ${r.cat || '전체'}${r.star ? ' ⭐' : ''} 검색어「${r.keyword}」${r.speak ? ' 🔊' : ''}`;
    if (r.from !== c.from || r.to !== c.to) why.push(`기간 ${r.from}~${r.to}≠${c.from}~${c.to}`);
    if ((r.cat || null) !== c.cat) why.push(`분류 ${r.cat}≠${c.cat}`);
    if (!!r.star !== c.star) why.push('별표 여부 다름');
    if (ns(r.keyword) !== ns(c.kw)) why.push(`검색어「${r.keyword}」≠「${c.kw}」`);
    if (!!r.speak !== c.speak) why.push('읽어주기 여부 다름');
  } else {
    const d = M.detect(c.text), r = M.parseQuery(c.text, null, now);
    const p = K.parse(c.text, now);
    got = `일정 ${p.date || '미정'} ${p.time || '--:--'} 「${p.title}」`;
    if (d) why.push('메모로 오판');
    if (r) why.push('메모 질문으로 오판');
  }
  return { ok: !why.length, why, got };
}

function regression({ K, M }, schedFile) {
  const T = require(schedFile);
  const bad = [];
  for (const c of T.CASES) {
    const now = new Date(c.now || T.CASES.NOW || NOW);
    if (M.detect(c.s)) bad.push(['메모로 오판', c.s]);
    else if (M.parseQuery(c.s, null, now)) bad.push(['메모 질문으로 오판', c.s]);
  }
  const out = T.run(K, { quiet: true });
  return { bad, sched: out, total: T.CASES.length };
}

function run(mods, { all = false } = {}) {
  const res = C.map(c => ({ c, ...judge(mods, c) }));
  const pass = res.filter(x => x.ok).length;
  console.log(`\n말로일정 메모 시험 — 기준 ${NOW}`);
  for (const x of res) {
    if (x.ok && !all) continue;
    const kind = { save: '저장', query: '확인', not: '아님' }[x.c.kind];
    console.log(`${x.ok ? '✅' : '❌'} [${kind}${x.c.grp ? '·' + x.c.grp : ''}] ${x.c.text}\n    → ${x.got}${x.ok ? '' : '\n    ✗ ' + x.why.join(' / ')}`);
  }
  const by = k => `${res.filter(x => x.c.kind === k && x.ok).length}/${res.filter(x => x.c.kind === k).length}`;
  console.log('\n──────── 결과 ────────');
  console.log(`메모 시험 ${pass}/${C.length} (${(pass / C.length * 100).toFixed(1)}%) — 저장 ${by('save')} · 확인 ${by('query')} · 아님 ${by('not')}`);
  return { pass, total: C.length, rate: pass / C.length };
}

module.exports = { loadAll, CASES: C, run };

if (require.main === module) {
  const args = process.argv.slice(2);
  const file = args.find(a => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html');
  const mods = loadAll(file);
  const out = run(mods, { all: args.includes('--all') });
  const reg = regression(mods, path.join(__dirname, '말로일정 해석기 시험세트.js'));
  for (const [w, t] of reg.bad) console.log(`❌ [회귀] ${w}: ${t}`);
  console.log(`회귀     해석기 시험 문장 ${reg.total}개 중 메모 오판 ${reg.bad.length}건 · 해석기 ${reg.sched.pass}/${reg.sched.total} (기존 예시 실패 ${reg.sched.exFail} · 등록→질문 오판 ${reg.sched.misQ})`);
  const ok = out.rate >= 0.9 && reg.bad.length === 0 && reg.sched.rate >= 0.95 && reg.sched.exFail === 0 && reg.sched.misQ === 0;
  console.log(ok ? '완료 기준 충족 ✅' : '완료 기준 미달 ❌ (메모 90% 이상·회귀 오판 0·해석기 95% 이상)');
  process.exit(ok ? 0 : 1);
}
