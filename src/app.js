/**
 * StyleScan — 截图转 Figma Token
 * Core application logic
 * 
 * Architecture:
 * - Pure frontend, no backend required
 * - Calls Anthropic API directly from browser (API key stored in localStorage)
 * - Outputs W3C Design Token format (.json)
 */

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════

const state = {
  imageFile: null,
  imageBase64: null,
  analysisResult: null,
  isLoading: false,
};

// ══════════════════════════════════════════════
// DOM REFS
// ══════════════════════════════════════════════

const $ = (id) => document.getElementById(id);

const uploadZone   = $('uploadZone');
const fileInput    = $('fileInput');
const previewWrap  = $('previewWrap');
const previewImg   = $('previewImg');
const previewName  = $('previewName');
const clearBtn     = $('clearBtn');
const analyzeBtn   = $('analyzeBtn');
const analyzeBtnText = $('analyzeBtnText');
const emptyState   = $('emptyState');
const loadingState = $('loadingState');
const results      = $('results');
const resultsBody  = $('resultsBody');
const resultsMeta  = $('resultsMeta');
const errorBanner  = $('errorBanner');
const downloadBtn  = $('downloadBtn');
const copyJsonBtn  = $('copyJsonBtn');
const settingsBtn  = $('settingsBtn');
const modalOverlay = $('modalOverlay');
const modalCancel  = $('modalCancel');
const modalSave    = $('modalSave');
const apiKeyInput  = $('apiKeyInput');
const toast        = $('toast');
const toastIcon    = $('toastIcon');
const toastText    = $('toastText');

// ══════════════════════════════════════════════
// UPLOAD HANDLING
// ══════════════════════════════════════════════

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragging');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragging');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    handleFile(file);
  } else {
    showToast('⚠ 请上传 PNG / JPG / WEBP 图片', 'warn');
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

clearBtn.addEventListener('click', clearImage);

function handleFile(file) {
  if (file.size > 20 * 1024 * 1024) {
    showToast('⚠ 文件过大，请上传 20MB 以内的截图', 'warn');
    return;
  }
  state.imageFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    state.imageBase64 = dataUrl.split(',')[1];

    previewImg.src = dataUrl;
    previewName.textContent = file.name;
    previewWrap.classList.add('visible');
    uploadZone.style.display = 'none';

    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = '开始分析截图';
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  state.imageFile = null;
  state.imageBase64 = null;
  state.analysisResult = null;

  previewImg.src = '';
  previewWrap.classList.remove('visible');
  uploadZone.style.display = '';
  fileInput.value = '';

  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = '上传截图以开始分析';

  showEmpty();
}

// ══════════════════════════════════════════════
// PANEL STATES
// ══════════════════════════════════════════════

function showEmpty() {
  emptyState.style.display = '';
  loadingState.classList.remove('visible');
  results.classList.remove('visible');
  errorBanner.classList.remove('visible');
}

function showLoading() {
  emptyState.style.display = 'none';
  loadingState.classList.add('visible');
  results.classList.remove('visible');
  errorBanner.classList.remove('visible');
  animateLoadingSteps();
}

function showResults() {
  emptyState.style.display = 'none';
  loadingState.classList.remove('visible');
  results.classList.add('visible');
}

// ══════════════════════════════════════════════
// LOADING ANIMATION
// ══════════════════════════════════════════════

const STEPS = ['color', 'type', 'spacing', 'radius', 'export'];
const STEP_DELAYS = [0, 1200, 2400, 3600, 4800];

function animateLoadingSteps() {
  STEPS.forEach((step) => {
    const el = $(`step-${step}`);
    el.className = 'loading-step';
  });

  STEPS.forEach((step, i) => {
    setTimeout(() => {
      if (!state.isLoading) return;
      // Mark previous as done
      if (i > 0) {
        $(`step-${STEPS[i - 1]}`).className = 'loading-step done';
      }
      $(`step-${step}`).className = 'loading-step active';
    }, STEP_DELAYS[i]);
  });
}

// ══════════════════════════════════════════════
// ANALYSIS — CLAUDE API CALL
// ══════════════════════════════════════════════

analyzeBtn.addEventListener('click', async () => {
  const apiKey = localStorage.getItem('stylescan_api_key');
  if (!apiKey) {
    openModal();
    return;
  }
  await runAnalysis(apiKey);
});

async function runAnalysis(apiKey) {
  if (!state.imageBase64) return;

  state.isLoading = true;
  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = '分析中…';
  showLoading();

  const options = {
    color: $('opt-color').checked,
    typography: $('opt-typography').checked,
    spacing: $('opt-spacing').checked,
    radius: $('opt-radius').checked,
  };

  const prompt = buildPrompt(options);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: state.imageFile.type,
                  data: state.imageBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '';
    const parsed = parseResponse(raw);

    state.analysisResult = parsed;
    state.isLoading = false;

    // Mark all steps done
    STEPS.forEach((step) => {
      $(`step-${step}`).className = 'loading-step done';
    });

    setTimeout(() => {
      renderResults(parsed);
      showResults();
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = '重新分析';
      resultsMeta.textContent = `${state.imageFile.name} · ${new Date().toLocaleTimeString('zh-CN')}`;
    }, 300);

  } catch (err) {
    state.isLoading = false;
    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = '开始分析截图';

    showResults(); // show panel with error
    errorBanner.textContent = `分析失败：${err.message}。请检查 API Key 是否正确，或网络是否正常。`;
    errorBanner.classList.add('visible');
    loadingState.classList.remove('visible');
    emptyState.style.display = 'none';
  }
}

// ══════════════════════════════════════════════
// PROMPT BUILDER
// ══════════════════════════════════════════════

function buildPrompt(options) {
  const sections = [];

  if (options.color) {
    sections.push(`
"color": {
  "primary": { "value": "#hex", "confidence": "high|mid|low", "label": "主色" },
  "secondary": { "value": "#hex", "confidence": "high|mid|low", "label": "辅色" },
  "background": { "value": "#hex", "confidence": "high|mid|low", "label": "背景色" },
  "surface": { "value": "#hex", "confidence": "high|mid|low", "label": "卡片/容器色" },
  "text_primary": { "value": "#hex", "confidence": "high|mid|low", "label": "主文字色" },
  "text_secondary": { "value": "#hex", "confidence": "high|mid|low", "label": "次文字色" },
  "accent": { "value": "#hex", "confidence": "high|mid|low", "label": "强调色/品牌色" }
}`);
  }

  if (options.typography) {
    sections.push(`
"typography": {
  "h1": { "value": "Npx", "confidence": "high|mid|low", "weight": "N00", "label": "大标题" },
  "h2": { "value": "Npx", "confidence": "high|mid|low", "weight": "N00", "label": "中标题" },
  "h3": { "value": "Npx", "confidence": "mid|low", "weight": "N00", "label": "小标题" },
  "body": { "value": "Npx", "confidence": "high|mid|low", "weight": "N00", "label": "正文" },
  "caption": { "value": "Npx", "confidence": "mid|low", "weight": "N00", "label": "说明文字" },
  "line_height": { "value": "N.N", "confidence": "low", "label": "行高倍数" }
}`);
  }

  if (options.spacing) {
    sections.push(`
"spacing": {
  "base_unit": { "value": "Npx", "confidence": "mid|low", "label": "基础间距单元" },
  "xs": { "value": "Npx", "confidence": "mid|low", "label": "极小间距" },
  "sm": { "value": "Npx", "confidence": "mid|low", "label": "小间距" },
  "md": { "value": "Npx", "confidence": "mid|low", "label": "中间距" },
  "lg": { "value": "Npx", "confidence": "mid|low", "label": "大间距" },
  "xl": { "value": "Npx", "confidence": "low", "label": "超大间距/分区间距" },
  "grid_system": { "value": "N-column", "confidence": "low", "label": "栅格列数" }
}`);
  }

  if (options.radius) {
    sections.push(`
"radius": {
  "button": { "value": "Npx", "confidence": "mid|low", "label": "按钮圆角" },
  "card": { "value": "Npx", "confidence": "mid|low", "label": "卡片圆角" },
  "input": { "value": "Npx", "confidence": "mid|low", "label": "输入框圆角" },
  "badge": { "value": "Npx", "confidence": "low", "label": "徽章/标签圆角" },
  "modal": { "value": "Npx", "confidence": "low", "label": "弹窗圆角" }
}`);
  }

  return `你是一名资深 UI 设计系统专家，请分析这张 UI 截图，提取设计规范参数。

规则：
1. 颜色用精确 hex 值（如 #1A1A2E）
2. 字号、间距、圆角用 px 数值
3. confidence 字段按准确度填写：能直接采样=high，推断但有依据=mid，纯推测=low
4. 如果截图中看不到某类元素（如无按钮），仍填写推断值，confidence 标 low
5. 只返回以下 JSON，不要任何解释文字、markdown 代码块、前缀

{${sections.join(',')},
"style_keywords": ["关键词1", "关键词2", "关键词3"],
"analysis_note": "一句话描述这个设计的整体风格特征"
}`;
}

// ══════════════════════════════════════════════
// RESPONSE PARSER
// ══════════════════════════════════════════════

function parseResponse(raw) {
  // Strip markdown code blocks if present
  let cleaned = raw
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find JSON object boundaries
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt partial recovery — common AI mistake: trailing commas
    try {
      const fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch {
      throw new Error('AI 返回了非预期的格式，请重试');
    }
  }
}

// ══════════════════════════════════════════════
// RENDER RESULTS
// ══════════════════════════════════════════════

function renderResults(data) {
  resultsBody.innerHTML = '';

  if (data.color) {
    resultsBody.appendChild(renderColorSection(data.color));
  }
  if (data.typography) {
    resultsBody.appendChild(renderTypographySection(data.typography));
  }
  if (data.spacing) {
    resultsBody.appendChild(renderSpacingSection(data.spacing));
  }
  if (data.radius) {
    resultsBody.appendChild(renderRadiusSection(data.radius));
  }
  if (data.style_keywords || data.analysis_note) {
    resultsBody.appendChild(renderStyleSection(data));
  }

  resultsBody.appendChild(renderJsonSection(data));
}

// ── Color ──

function renderColorSection(colorData) {
  const section = createSection('色彩系统', Object.keys(colorData).length);

  const grid = document.createElement('div');
  grid.className = 'color-grid';

  Object.entries(colorData).forEach(([key, token]) => {
    const card = document.createElement('div');
    card.className = 'color-card';
    card.dataset.key = key;

    const hex = token.value || '#888888';
    const label = token.label || key;
    const conf = token.confidence || 'low';

    card.innerHTML = `
      <div class="color-swatch" style="background: ${hex}"></div>
      <div class="color-info">
        <div class="color-name">${label}</div>
        <div class="color-edit">
          <div class="color-input-wrap" style="background: ${hex}">
            <input type="color" value="${hex}" data-key="${key}" data-type="color" />
          </div>
          <span class="color-hex" id="hex-${key}">${hex}</span>
        </div>
        <div style="margin-top: 6px">${confidenceBadge(conf)}</div>
      </div>
    `;

    // Color picker change
    const picker = card.querySelector('input[type="color"]');
    picker.addEventListener('input', (e) => {
      const newHex = e.target.value;
      card.querySelector('.color-swatch').style.background = newHex;
      card.querySelector('.color-input-wrap').style.background = newHex;
      card.querySelector('.color-hex').textContent = newHex;
      // Update state
      state.analysisResult.color[key].value = newHex;
    });

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

// ── Typography ──

function renderTypographySection(typeData) {
  const section = createSection('字号体系', Object.keys(typeData).length);

  const preview = document.createElement('div');
  preview.className = 'type-preview';

  const TYPE_ORDER = ['h1', 'h2', 'h3', 'body', 'caption'];
  const SAMPLE_TEXT = {
    h1: '大标题样式', h2: '中等标题', h3: '小号标题',
    body: '正文内容示例，用于段落和描述性文字的展示效果',
    caption: '说明文字 / 辅助信息',
    line_height: null,
  };

  TYPE_ORDER.forEach((key) => {
    if (!typeData[key]) return;
    const token = typeData[key];
    const sampleText = SAMPLE_TEXT[key];
    if (!sampleText) return;

    const sizeNum = parseInt(token.value) || 14;
    const weight = token.weight || '400';
    const conf = token.confidence || 'low';
    const label = token.label || key;

    const row = document.createElement('div');
    row.className = 'type-row';
    row.innerHTML = `
      <div class="type-label">${label}</div>
      <div class="type-sample" style="font-size: ${Math.min(sizeNum, 32)}px; font-weight: ${weight}">
        ${sampleText}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="type-meta">${token.value} / ${weight}</div>
        ${confidenceBadge(conf)}
      </div>
    `;
    preview.appendChild(row);
  });

  // Token list for editing
  const tokenList = document.createElement('div');
  tokenList.className = 'token-list';

  Object.entries(typeData).forEach(([key, token]) => {
    tokenList.appendChild(createTokenRow(
      token.label || key,
      token.value,
      token.confidence,
      (newVal) => { state.analysisResult.typography[key].value = newVal; }
    ));
  });

  section.appendChild(preview);
  section.appendChild(tokenList);
  return section;
}

// ── Spacing ──

function renderSpacingSection(spacingData) {
  const section = createSection('间距体系', Object.keys(spacingData).length);

  const SPACING_ORDER = ['xs', 'sm', 'md', 'lg', 'xl'];
  const maxVal = Math.max(...SPACING_ORDER.map(k => parseInt(spacingData[k]?.value) || 0));

  const vis = document.createElement('div');
  vis.className = 'spacing-vis';

  SPACING_ORDER.forEach((key) => {
    if (!spacingData[key]) return;
    const token = spacingData[key];
    const val = parseInt(token.value) || 0;
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

    const row = document.createElement('div');
    row.className = 'spacing-row-vis';
    row.innerHTML = `
      <div class="spacing-label">${token.label || key}</div>
      <div class="spacing-bar-wrap">
        <div class="spacing-bar" style="width: ${pct}%"></div>
      </div>
      <div class="spacing-val">${token.value}</div>
      ${confidenceBadge(token.confidence || 'low')}
    `;
    vis.appendChild(row);
  });

  // Token list (includes base_unit and grid_system)
  const tokenList = document.createElement('div');
  tokenList.className = 'token-list';

  ['base_unit', 'grid_system'].forEach((key) => {
    if (!spacingData[key]) return;
    const token = spacingData[key];
    tokenList.appendChild(createTokenRow(
      token.label || key,
      token.value,
      token.confidence,
      (newVal) => { state.analysisResult.spacing[key].value = newVal; }
    ));
  });

  section.appendChild(vis);
  section.appendChild(tokenList);
  return section;
}

// ── Radius ──

function renderRadiusSection(radiusData) {
  const section = createSection('圆角规则', Object.keys(radiusData).length);

  const tokenList = document.createElement('div');
  tokenList.className = 'token-list';

  Object.entries(radiusData).forEach(([key, token]) => {
    const val = parseInt(token.value) || 0;
    const preview = document.createElement('div');
    preview.style.cssText = `
      width: 28px; height: 28px;
      background: rgba(198,241,53,0.15);
      border: 1.5px solid rgba(198,241,53,0.4);
      border-radius: ${Math.min(val, 14)}px;
      flex-shrink: 0;
    `;

    const row = createTokenRow(
      token.label || key,
      token.value,
      token.confidence,
      (newVal) => { state.analysisResult.radius[key].value = newVal; }
    );
    // Inject shape preview before label
    row.insertBefore(preview, row.firstChild);

    tokenList.appendChild(row);
  });

  section.appendChild(tokenList);
  return section;
}

// ── Style Keywords ──

function renderStyleSection(data) {
  const section = createSection('设计风格', '');

  if (data.analysis_note) {
    const note = document.createElement('div');
    note.style.cssText = 'font-size:14px;color:var(--text-muted);line-height:1.6;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:6px;margin-bottom:10px;';
    note.textContent = data.analysis_note;
    section.appendChild(note);
  }

  if (data.style_keywords?.length) {
    const tags = document.createElement('div');
    tags.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
    data.style_keywords.forEach((kw) => {
      const tag = document.createElement('span');
      tag.style.cssText = 'background:var(--accent-dim);border:1px solid var(--accent-mid);color:var(--accent);padding:4px 12px;border-radius:100px;font-size:13px;font-family:"DM Mono",monospace;';
      tag.textContent = kw;
      tags.appendChild(tag);
    });
    section.appendChild(tags);
  }

  return section;
}

// ── JSON Preview ──

function renderJsonSection(data) {
  const section = createSection('导出预览 (W3C Token Format)', '');

  const wrap = document.createElement('div');
  wrap.className = 'json-preview';

  const header = document.createElement('div');
  header.className = 'json-preview-header';
  header.innerHTML = `
    <span class="json-preview-title">output.tokens.json</span>
  `;

  const body = document.createElement('div');
  body.className = 'json-preview-body';
  body.innerHTML = syntaxHighlight(JSON.stringify(toW3CTokenFormat(data), null, 2));

  wrap.appendChild(header);
  wrap.appendChild(body);
  section.appendChild(wrap);
  return section;
}

// ══════════════════════════════════════════════
// W3C TOKEN FORMAT CONVERSION
// ══════════════════════════════════════════════

function toW3CTokenFormat(data) {
  const out = {};

  if (data.color) {
    out.color = {};
    Object.entries(data.color).forEach(([key, token]) => {
      out.color[key] = {
        $value: token.value,
        $type: 'color',
        $description: token.label || key,
        _confidence: token.confidence,
      };
    });
  }

  if (data.typography) {
    out.typography = {};
    Object.entries(data.typography).forEach(([key, token]) => {
      out.typography[key] = {
        $value: token.value,
        $type: key === 'line_height' ? 'number' : 'dimension',
        $description: token.label || key,
        _confidence: token.confidence,
        ...(token.weight ? { _fontWeight: token.weight } : {}),
      };
    });
  }

  if (data.spacing) {
    out.spacing = {};
    Object.entries(data.spacing).forEach(([key, token]) => {
      out.spacing[key] = {
        $value: token.value,
        $type: 'dimension',
        $description: token.label || key,
        _confidence: token.confidence,
      };
    });
  }

  if (data.radius) {
    out.borderRadius = {};
    Object.entries(data.radius).forEach(([key, token]) => {
      out.borderRadius[key] = {
        $value: token.value,
        $type: 'dimension',
        $description: token.label || key,
        _confidence: token.confidence,
      };
    });
  }

  return out;
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function createSection(title, count) {
  const section = document.createElement('div');
  section.className = 'token-section';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `
    <div class="section-title">${title}</div>
    ${count !== '' ? `<span class="section-count">${count} tokens</span>` : ''}
  `;
  section.appendChild(header);
  return section;
}

function createTokenRow(label, value, confidence, onChange) {
  const row = document.createElement('div');
  row.className = 'token-row';

  const nameEl = document.createElement('div');
  nameEl.className = 'token-name';
  nameEl.textContent = label;

  const valueEl = document.createElement('input');
  valueEl.className = 'token-edit-input';
  valueEl.value = value;
  valueEl.addEventListener('change', (e) => {
    onChange(e.target.value);
    // Update JSON preview
    rerenderJsonPreview();
  });

  const confEl = document.createElement('div');
  confEl.innerHTML = confidenceBadge(confidence);

  row.appendChild(nameEl);
  row.appendChild(valueEl);
  row.appendChild(confEl);

  return row;
}

function confidenceBadge(level) {
  const labels = { high: '高可信', mid: '推断值', low: '仅供参考' };
  const label = labels[level] || level;
  return `<span class="confidence ${level}">◉ ${label}</span>`;
}

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"(\$?[a-zA-Z_]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "#([A-Fa-f0-9]{3,8})"/g, ': <span class="json-str">"#$1"</span>')
    .replace(/: "([^"]+)"/g, ': <span class="json-str">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-num">$1</span>');
}

function rerenderJsonPreview() {
  if (!state.analysisResult) return;
  const body = document.querySelector('.json-preview-body');
  if (body) {
    body.innerHTML = syntaxHighlight(
      JSON.stringify(toW3CTokenFormat(state.analysisResult), null, 2)
    );
  }
}

// ══════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════

downloadBtn.addEventListener('click', () => {
  if (!state.analysisResult) return;
  const json = JSON.stringify(toW3CTokenFormat(state.analysisResult), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stylescan-tokens-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Token 文件已下载');
});

copyJsonBtn.addEventListener('click', () => {
  if (!state.analysisResult) return;
  const json = JSON.stringify(toW3CTokenFormat(state.analysisResult), null, 2);
  navigator.clipboard.writeText(json).then(() => {
    showToast('✓ 已复制到剪贴板');
  });
});

// ══════════════════════════════════════════════
// SETTINGS MODAL
// ══════════════════════════════════════════════

settingsBtn.addEventListener('click', openModal);
modalCancel.addEventListener('click', () => {
  modalOverlay.classList.remove('visible');
});
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('visible');
});

modalSave.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith('sk-ant-')) {
    showToast('⚠ API Key 格式不正确', 'warn');
    return;
  }
  localStorage.setItem('stylescan_api_key', key);
  modalOverlay.classList.remove('visible');
  showToast('✓ API Key 已保存');

  // If image already uploaded, trigger analysis
  if (state.imageBase64) {
    runAnalysis(key);
  }
});

function openModal() {
  const existing = localStorage.getItem('stylescan_api_key');
  if (existing) apiKeyInput.value = existing;
  modalOverlay.classList.add('visible');
  setTimeout(() => apiKeyInput.focus(), 100);
}

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════

let toastTimer;

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toastText.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════

showEmpty();

// Show settings modal on first load if no API key
if (!localStorage.getItem('stylescan_api_key')) {
  // Don't auto-open, let user click analyze first
  console.log('StyleScan ready. No API key configured yet.');
}
