import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Code,
  Copy,
  ExternalLink,
  Globe,
  Grid3X3,
  Home,
  LayoutGrid,
  List,
  Monitor,
  Moon,
  Network,
  Palette,
  Search,
  Send,
  Sparkles,
  Star,
  Sun,
  Zap
} from 'lucide-react';
import { categories, siteConfig, tools } from './data/tools.js';

const STORAGE_KEYS = {
  theme: 'tool-star-map-theme',
  favorites: 'tool-star-map-favorites',
  recent: 'tool-star-map-recent'
};

const categoryIcons = {
  all: Grid3X3,
  ai: Sparkles,
  dev: Code,
  design: Palette,
  productivity: Zap,
  learn: BookOpen,
  life: Home,
  favorites: Star
};

const categoryLabels = Object.fromEntries(categories.map((category) => [category.id, category.label]));

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return 'dark';
}

function getFavicon(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function sortByUpdatedAt(items) {
  return [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTag, setActiveTag] = useState('');
  const [view, setView] = useState('map');
  const [favorites, setFavorites] = useState(() => readStorage(STORAGE_KEYS.favorites, []));
  const [recentIds, setRecentIds] = useState(() => readStorage(STORAGE_KEYS.recent, []));
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendation, setRecommendation] = useState({
    name: '',
    url: '',
    reason: ''
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#071111' : '#f6f8f4');
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.recent, recentIds);
  }, [recentIds]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const tagCounts = useMemo(() => {
    const counts = new Map();
    tools.forEach((tool) => {
      tool.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      .slice(0, 12);
  }, []);

  const stats = useMemo(() => {
    return [
      { label: '收录工具', value: tools.length },
      { label: '分类', value: categories.length - 1 },
      { label: '热门标签', value: tagCounts.length },
      { label: '本地收藏', value: favorites.length }
    ];
  }, [favorites.length, tagCounts.length]);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortByUpdatedAt(tools).filter((tool) => {
      const matchesCategory =
        category === 'all' ||
        tool.category === category ||
        (category === 'favorites' && favoriteSet.has(tool.id));
      const matchesTag = !activeTag || tool.tags.includes(activeTag);
      const searchable = `${tool.name} ${tool.description} ${tool.tags.join(' ')} ${categoryLabels[tool.category]}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      return matchesCategory && matchesTag && matchesQuery;
    });
  }, [activeTag, category, favoriteSet, query]);

  const featuredTools = useMemo(() => tools.filter((tool) => tool.featured).slice(0, 6), []);

  const recentTools = useMemo(() => {
    const visited = recentIds
      .map((id) => tools.find((tool) => tool.id === id))
      .filter(Boolean);

    return visited.length ? visited.slice(0, 5) : sortByUpdatedAt(tools).slice(0, 5);
  }, [recentIds]);

  const mapTools = useMemo(() => filteredTools.slice(0, 12), [filteredTools]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  function toggleFavorite(toolId) {
    setFavorites((current) => {
      if (current.includes(toolId)) {
        return current.filter((id) => id !== toolId);
      }
      return [toolId, ...current].slice(0, 80);
    });
  }

  function recordVisit(toolId) {
    setRecentIds((current) => [toolId, ...current.filter((id) => id !== toolId)].slice(0, 12));
  }

  function selectCategory(nextCategory) {
    setCategory(nextCategory);
    if (nextCategory === 'all' || nextCategory === 'favorites') {
      setActiveTag('');
    }
  }

  function copyRecommendation() {
    const payload = [
      `工具名称：${recommendation.name || '请填写'}`,
      `工具链接：${recommendation.url || '请填写'}`,
      `推荐理由：${recommendation.reason || '请填写'}`
    ].join('\n');

    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="工具星图首页">
          <span className="brand-mark">
            <Network size={22} />
          </span>
          <span>
            <strong>{siteConfig.name}</strong>
            <small>Tool Star Map</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="主导航">
          {categories.map((item) => (
            <button
              key={item.id}
              className={category === item.id ? 'active' : ''}
              type="button"
              onClick={() => selectCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="切换主题" title="切换主题">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="primary-action" type="button" onClick={() => setRecommendOpen(true)} aria-label="提交推荐" title="提交推荐">
            <Send size={16} />
            <span>提交推荐</span>
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="category-rail" aria-label="工具分类">
          {[...categories, { id: 'favorites', label: '本地收藏' }].map((item) => {
            const Icon = categoryIcons[item.id] || Globe;
            return (
              <button
                key={item.id}
                className={category === item.id ? 'active' : ''}
                type="button"
                onClick={() => selectCategory(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <section className="main-stage" aria-label="工具导航">
          <div className="command-row">
            <div className="search-box">
              <Search size={19} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索工具 / 标签 / 场景"
                aria-label="搜索工具"
              />
            </div>

            <div className="view-toggle" aria-label="视图切换">
              <button className={view === 'map' ? 'active' : ''} type="button" onClick={() => setView('map')}>
                <Network size={16} />
                <span>星图</span>
              </button>
              <button className={view === 'list' ? 'active' : ''} type="button" onClick={() => setView('list')}>
                <List size={16} />
                <span>列表</span>
              </button>
            </div>
          </div>

          <div className="mobile-category-strip" aria-label="移动分类">
            {[...categories, { id: 'favorites', label: '本地收藏' }].map((item) => (
              <button
                key={item.id}
                className={category === item.id ? 'active' : ''}
                type="button"
                onClick={() => selectCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="stats-strip" aria-label="站点统计">
            {stats.map((item) => (
              <div key={item.label} className="stat-item">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <section className="feature-band" aria-label="站点简介">
            <div>
              <p className="eyebrow">PUBLIC CURATED MAP</p>
              <h1>{siteConfig.name}</h1>
              <p>{siteConfig.tagline}</p>
            </div>
            <div className="signal-meter" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </section>

          {activeTag && (
            <div className="active-filter">
              <span>正在筛选：#{activeTag}</span>
              <button type="button" onClick={() => setActiveTag('')}>
                清除
              </button>
            </div>
          )}

          {view === 'map' ? (
            <StarMap
              tools={mapTools}
              favoriteSet={favoriteSet}
              onFavorite={toggleFavorite}
              onVisit={recordVisit}
            />
          ) : (
            <ToolGrid
              tools={filteredTools}
              favoriteSet={favoriteSet}
              onFavorite={toggleFavorite}
              onVisit={recordVisit}
            />
          )}

          {filteredTools.length === 0 && (
            <div className="empty-state">
              <Sparkles size={24} />
              <strong>没有找到匹配的工具</strong>
              <span>换个关键词、分类或标签试试。</span>
            </div>
          )}
        </section>

        <aside className="insight-panel" aria-label="精选与标签">
          <Panel title="站长精选" action="精选">
            <CompactToolList
              tools={featuredTools}
              favoriteSet={favoriteSet}
              onFavorite={toggleFavorite}
              onVisit={recordVisit}
            />
          </Panel>

          <Panel title="最近访问" action={recentIds.length ? '本机' : '更新'}>
            <CompactToolList
              tools={recentTools}
              favoriteSet={favoriteSet}
              onFavorite={toggleFavorite}
              onVisit={recordVisit}
            />
          </Panel>

          <Panel title="热门标签" action="筛选">
            <div className="tag-cloud">
              {tagCounts.map(([tag, count]) => (
                <button
                  key={tag}
                  className={activeTag === tag ? 'active' : ''}
                  type="button"
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                >
                  #{tag}
                  <span>{count}</span>
                </button>
              ))}
            </div>
          </Panel>
        </aside>
      </main>

      <footer className="site-footer">
        <span>{siteConfig.name}</span>
        <span>React 18 / Vite / Static Deploy Ready</span>
      </footer>

      {recommendOpen && (
        <RecommendationDialog
          recommendation={recommendation}
          setRecommendation={setRecommendation}
          copied={copied}
          email={siteConfig.recommendationEmail}
          onCopy={copyRecommendation}
          onClose={() => setRecommendOpen(false)}
        />
      )}
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{action}</span>
      </div>
      {children}
    </section>
  );
}

function StarMap({ tools: mapTools, favoriteSet, onFavorite, onVisit }) {
  if (!mapTools.length) {
    return null;
  }

  const lines = mapTools.slice(1).map((tool, index) => ({
    from: mapTools[index].map,
    to: tool.map,
    id: `${mapTools[index].id}-${tool.id}`
  }));

  return (
    <section className="star-map" aria-label="星图视图">
      <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {lines.map((line) => (
          <line
            key={line.id}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {mapTools.map((tool, index) => (
        <article
          className={`map-node tone-${(index % 4) + 1}`}
          key={tool.id}
          style={{ left: `${tool.map.x}%`, top: `${tool.map.y}%` }}
        >
          <a href={tool.url} target="_blank" rel="noreferrer" onClick={() => onVisit(tool.id)}>
            <img src={getFavicon(tool.domain)} alt="" loading="lazy" />
            <span>
              <strong>{tool.name}</strong>
              <small>{categoryLabels[tool.category]}</small>
            </span>
            <ExternalLink size={14} />
          </a>
          <button
            className={favoriteSet.has(tool.id) ? 'active' : ''}
            type="button"
            onClick={() => onFavorite(tool.id)}
            aria-label={`${favoriteSet.has(tool.id) ? '取消' : '加入'}本地收藏：${tool.name}`}
            title="本地收藏"
          >
            <Star size={14} />
          </button>
        </article>
      ))}

      <div className="map-caption">
        <Network size={18} />
        <span>展示当前筛选结果中的前 {mapTools.length} 个节点</span>
      </div>
    </section>
  );
}

function ToolGrid({ tools: gridTools, favoriteSet, onFavorite, onVisit }) {
  return (
    <section className="tool-grid" aria-label="列表视图">
      {gridTools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          favorite={favoriteSet.has(tool.id)}
          onFavorite={onFavorite}
          onVisit={onVisit}
        />
      ))}
    </section>
  );
}

function ToolCard({ tool, favorite, onFavorite, onVisit }) {
  return (
    <article className="tool-card">
      <div className="tool-card-top">
        <img src={getFavicon(tool.domain)} alt="" loading="lazy" />
        <button
          className={favorite ? 'favorite-button active' : 'favorite-button'}
          type="button"
          onClick={() => onFavorite(tool.id)}
          aria-label={`${favorite ? '取消' : '加入'}本地收藏：${tool.name}`}
          title="本地收藏"
        >
          <Star size={16} />
        </button>
      </div>
      <h2>{tool.name}</h2>
      <p>{tool.description}</p>
      <div className="tool-tags">
        {tool.tags.slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <a className="launch-link" href={tool.url} target="_blank" rel="noreferrer" onClick={() => onVisit(tool.id)}>
        <span>打开工具</span>
        <ExternalLink size={15} />
      </a>
    </article>
  );
}

function CompactToolList({ tools: compactTools, favoriteSet, onFavorite, onVisit }) {
  return (
    <div className="compact-list">
      {compactTools.map((tool) => (
        <div className="compact-item" key={tool.id}>
          <a href={tool.url} target="_blank" rel="noreferrer" onClick={() => onVisit(tool.id)}>
            <img src={getFavicon(tool.domain)} alt="" loading="lazy" />
            <span>
              <strong>{tool.name}</strong>
              <small>{tool.tags.slice(0, 2).join(' / ')}</small>
            </span>
          </a>
          <button
            className={favoriteSet.has(tool.id) ? 'active' : ''}
            type="button"
            onClick={() => onFavorite(tool.id)}
            aria-label={`${favoriteSet.has(tool.id) ? '取消' : '加入'}本地收藏：${tool.name}`}
            title="本地收藏"
          >
            <Star size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function RecommendationDialog({ recommendation, setRecommendation, copied, email, onCopy, onClose }) {
  function updateField(field, value) {
    setRecommendation((current) => ({ ...current, [field]: value }));
  }

  const recommendationText = [
    `工具名称：${recommendation.name || '请填写'}`,
    `工具链接：${recommendation.url || '请填写'}`,
    `推荐理由：${recommendation.reason || '请填写'}`
  ].join('\n');
  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(`工具推荐：${recommendation.name || '新工具'}`)}&body=${encodeURIComponent(
        recommendationText
      )}`
    : '';

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="recommend-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">PUBLIC SUBMISSION</p>
            <h2 id="recommend-title">提交推荐</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <label>
          工具名称
          <input
            value={recommendation.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="例如：Readwise"
          />
        </label>
        <label>
          工具链接
          <input
            value={recommendation.url}
            onChange={(event) => updateField('url', event.target.value)}
            placeholder="https://example.com"
          />
        </label>
        <label>
          推荐理由
          <textarea
            value={recommendation.reason}
            onChange={(event) => updateField('reason', event.target.value)}
            placeholder="它解决了什么问题，适合谁使用？"
            rows="4"
          />
        </label>

        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onClose}>
            取消
          </button>
          {email && (
            <button className="secondary-action" type="button" onClick={onCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '已复制' : '复制内容'}</span>
            </button>
          )}
          {email ? (
            <a className="primary-action" href={mailtoHref}>
              <Send size={16} />
              <span>发送邮件</span>
            </a>
          ) : (
            <button className="primary-action" type="button" onClick={onCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '已复制' : '复制推荐内容'}</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
