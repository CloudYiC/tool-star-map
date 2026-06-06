import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  BookOpen,
  Check,
  Code,
  Copy,
  ExternalLink,
  Globe,
  Grid3X3,
  Home,
  Moon,
  Palette,
  Search,
  Send,
  Sparkles,
  Star,
  Sun,
  Target,
  Zap
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { categories, siteConfig, tools } from './data/tools.js';
import styles from './App.module.scss';

type Theme = 'dark' | 'light';

type CategoryId = 'all' | 'ai' | 'dev' | 'design' | 'productivity' | 'learn' | 'life' | 'favorites';

type Category = {
  id: CategoryId;
  label: string;
};

type Tool = {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: Exclude<CategoryId, 'all' | 'favorites'>;
  description: string;
  tags: string[];
  featured: boolean;
  updatedAt: string;
};

type Recommendation = {
  name: string;
  url: string;
  reason: string;
};

const STORAGE_KEYS = {
  theme: 'tool-star-map-theme',
  favorites: 'tool-star-map-favorites',
  recent: 'tool-star-map-recent'
} as const;

const typedCategories = categories as Category[];
const typedTools = tools as Tool[];

const categoryIcons: Record<CategoryId, ComponentType<LucideProps>> = {
  all: Grid3X3,
  ai: Sparkles,
  dev: Code,
  design: Palette,
  productivity: Zap,
  learn: BookOpen,
  life: Home,
  favorites: Star
};

const categoryLabels = Object.fromEntries(typedCategories.map((category) => [category.id, category.label])) as Record<
  Tool['category'],
  string
>;

function cx(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
  return stored === 'dark' || stored === 'light' ? stored : 'dark';
}

function getFavicon(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function sortByUpdatedAt(items: Tool[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId>('all');
  const [activeTag, setActiveTag] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => readStorage(STORAGE_KEYS.favorites, []));
  const [recentIds, setRecentIds] = useState<string[]>(() => readStorage(STORAGE_KEYS.recent, []));
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation>({
    name: '',
    url: '',
    reason: ''
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#06090c' : '#f5f7fb');
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
    const counts = new Map<string, number>();
    typedTools.forEach((tool) => {
      tool.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      .slice(0, 12);
  }, []);

  const stats = useMemo(
    () => [
      { label: '收录工具', value: typedTools.length },
      { label: '分类频道', value: typedCategories.length - 1 },
      { label: '热门标签', value: tagCounts.length },
      { label: '本地收藏', value: favorites.length }
    ],
    [favorites.length, tagCounts.length]
  );

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortByUpdatedAt(typedTools).filter((tool) => {
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

  const featuredTools = useMemo(() => typedTools.filter((tool) => tool.featured).slice(0, 6), []);

  const recentTools = useMemo(() => {
    const visited = recentIds.map((id) => typedTools.find((tool) => tool.id === id)).filter((tool): tool is Tool => Boolean(tool));

    return visited.length ? visited.slice(0, 5) : sortByUpdatedAt(typedTools).slice(0, 5);
  }, [recentIds]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  function toggleFavorite(toolId: string) {
    setFavorites((current) => {
      if (current.includes(toolId)) {
        return current.filter((id) => id !== toolId);
      }
      return [toolId, ...current].slice(0, 80);
    });
  }

  function recordVisit(toolId: string) {
    setRecentIds((current) => [toolId, ...current.filter((id) => id !== toolId)].slice(0, 12));
  }

  function selectCategory(nextCategory: CategoryId) {
    setCategory(nextCategory);
    if (nextCategory === 'all' || nextCategory === 'favorites') {
      setActiveTag('');
    }
  }

  function confirmJump(tool: Tool) {
    recordVisit(tool.id);
    window.open(tool.url, '_blank', 'noopener,noreferrer');
    setSelectedTool(null);
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
    <div className={styles.appShell}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="工具发射台首页">
          <span className={styles.brandMark}>
            <Target size={22} />
          </span>
          <span>
            <strong>{siteConfig.name}</strong>
            <small>Tool Launch Deck</small>
          </span>
        </a>

        <div className={styles.topbarActions}>
          <button className={styles.iconButton} type="button" onClick={toggleTheme} aria-label="切换主题" title="切换主题">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={styles.primaryAction} type="button" onClick={() => setRecommendOpen(true)} aria-label="提交推荐" title="提交推荐">
            <Send size={16} />
            <span>提交推荐</span>
          </button>
        </div>
      </header>

      <main className={styles.launchLayout}>
        <section className={styles.commandDeck} aria-label="工具控制台">
          <div className={styles.commandTop}>
            <div className={styles.commandIntro}>
              <p className={styles.eyebrow}>ENTERPRISE TOOL HUB</p>
              <h1>工具发射台</h1>
              <p>{siteConfig.tagline}</p>
              <div className={styles.commandSearchRow}>
                <div className={styles.searchBox}>
                  <Search size={20} />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索工具 / 标签 / 使用场景"
                    aria-label="搜索工具"
                  />
                </div>
                <div className={styles.commandBadge} aria-hidden="true">
                  <span>LIVE INDEX</span>
                  <strong>{filteredTools.length}</strong>
                </div>
              </div>
            </div>

            <div className={styles.metricBoard} aria-label="站点统计">
              {stats.map((item) => (
                <div key={item.label} className={styles.metricItem}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.filterRail} aria-label="工具筛选">
            <div className={styles.categoryStrip}>
              {[...typedCategories, { id: 'favorites', label: '本地收藏' } satisfies Category].map((item) => {
                const Icon = categoryIcons[item.id];
                return (
                  <button
                    key={item.id}
                    className={cx(category === item.id && styles.active)}
                    type="button"
                    onClick={() => selectCategory(item.id)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.tagCloud}>
              {tagCounts.map(([tag, count]) => (
                <button
                  key={tag}
                  className={cx(activeTag === tag && styles.active)}
                  type="button"
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                >
                  #{tag}
                  <span>{count}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeTag && (
          <div className={styles.activeFilter}>
            <span>正在筛选：#{activeTag}</span>
            <button type="button" onClick={() => setActiveTag('')}>
              清除
            </button>
          </div>
        )}

        <section className={styles.contentGrid}>
          <section className={styles.toolSection} aria-label="工具列表">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>TOOL INDEX</p>
                <h2>工具列表</h2>
              </div>
              <span>{filteredTools.length} 个结果</span>
            </div>

            {filteredTools.length ? (
              <div className={styles.toolGrid}>
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    favorite={favoriteSet.has(tool.id)}
                    onFavorite={toggleFavorite}
                    onOpen={setSelectedTool}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Sparkles size={24} />
                <strong>没有找到匹配的工具</strong>
                <span>换个关键词、分类或标签试试。</span>
              </div>
            )}
          </section>

          <aside className={styles.dockPanel} aria-label="精选与最近访问">
            <Panel title="站长精选" action="精选">
              <CompactToolList
                tools={featuredTools}
                favoriteSet={favoriteSet}
                onFavorite={toggleFavorite}
                onOpen={setSelectedTool}
              />
            </Panel>

            <Panel title="最近访问" action={recentIds.length ? '本机' : '更新'}>
              <CompactToolList
                tools={recentTools}
                favoriteSet={favoriteSet}
                onFavorite={toggleFavorite}
                onOpen={setSelectedTool}
              />
            </Panel>
          </aside>
        </section>
      </main>

      <footer className={styles.siteFooter}>
        <span>{siteConfig.name}</span>
        <span>React 18 / Vite / Static Deploy Ready</span>
      </footer>

      {selectedTool && (
        <LaunchDialog
          tool={selectedTool}
          favorite={favoriteSet.has(selectedTool.id)}
          onFavorite={toggleFavorite}
          onCancel={() => setSelectedTool(null)}
          onConfirm={confirmJump}
        />
      )}

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

type PanelProps = {
  title: string;
  action: string;
  children: ReactNode;
};

function Panel({ title, action, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeading}>
        <h2>{title}</h2>
        <span>{action}</span>
      </div>
      {children}
    </section>
  );
}

type ToolCardProps = {
  tool: Tool;
  favorite: boolean;
  onFavorite: (toolId: string) => void;
  onOpen: (tool: Tool) => void;
};

function ToolCard({ tool, favorite, onFavorite, onOpen }: ToolCardProps) {
  return (
    <article className={styles.toolCard}>
      <button className={styles.toolCardMain} type="button" onClick={() => onOpen(tool)} aria-label={`查看 ${tool.name} 详情`}>
        <span className={styles.toolLogo}>
          <img src={getFavicon(tool.domain)} alt="" loading="lazy" />
        </span>
        <span className={styles.toolBody}>
          <span className={styles.toolTitleRow}>
            <strong>{tool.name}</strong>
            <small>{categoryLabels[tool.category]}</small>
          </span>
          <span className={styles.toolDescription}>{tool.description}</span>
          <span className={styles.toolTags}>
            {tool.tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </span>
        </span>
      </button>
      <div className={styles.toolActions}>
        <button
          className={cx(styles.favoriteButton, favorite && styles.active)}
          type="button"
          onClick={() => onFavorite(tool.id)}
          aria-label={`${favorite ? '取消' : '加入'}本地收藏：${tool.name}`}
          title="本地收藏"
        >
          <Star size={16} />
        </button>
        <button className={styles.launchLink} type="button" onClick={() => onOpen(tool)}>
          <span>查看详情</span>
          <ExternalLink size={15} />
        </button>
      </div>
    </article>
  );
}

type CompactToolListProps = {
  tools: Tool[];
  favoriteSet: Set<string>;
  onFavorite: (toolId: string) => void;
  onOpen: (tool: Tool) => void;
};

function CompactToolList({ tools: compactTools, favoriteSet, onFavorite, onOpen }: CompactToolListProps) {
  return (
    <div className={styles.compactList}>
      {compactTools.map((tool) => (
        <div className={styles.compactItem} key={tool.id}>
          <button type="button" className={styles.compactOpen} onClick={() => onOpen(tool)}>
            <img src={getFavicon(tool.domain)} alt="" loading="lazy" />
            <span>
              <strong>{tool.name}</strong>
              <small>{tool.tags.slice(0, 2).join(' / ')}</small>
            </span>
          </button>
          <button
            className={cx(styles.compactFavorite, favoriteSet.has(tool.id) && styles.active)}
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

type LaunchDialogProps = {
  tool: Tool;
  favorite: boolean;
  onFavorite: (toolId: string) => void;
  onCancel: () => void;
  onConfirm: (tool: Tool) => void;
};

function LaunchDialog({ tool, favorite, onFavorite, onCancel, onConfirm }: LaunchDialogProps) {
  return (
    <div className={cx(styles.dialogBackdrop, styles.launchBackdrop)} role="presentation" onMouseDown={onCancel}>
      <section
        className={styles.launchDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.mascotScene} aria-hidden="true">
          <div className={styles.mascot}>
            <span className={styles.mascotHead} />
            <span className={styles.mascotBody} />
            <span className={cx(styles.mascotArm, styles.left)} />
            <span className={cx(styles.mascotArm, styles.right)} />
            <span className={cx(styles.mascotLeg, styles.left)} />
            <span className={cx(styles.mascotLeg, styles.right)} />
          </div>
          <div className={styles.mascotSign}>
            <strong>确定要跳转吗？</strong>
            <span>我先帮你确认一下目的地。</span>
          </div>
        </div>

        <div className={styles.launchDetail}>
          <div className={styles.dialogHeading}>
            <div>
              <p className={styles.eyebrow}>READY TO LAUNCH</p>
              <h2 id="launch-title">{tool.name}</h2>
            </div>
            <button className={styles.iconButton} type="button" onClick={onCancel} aria-label="关闭">
              <span aria-hidden="true">x</span>
            </button>
          </div>

          <div className={styles.destinationCard}>
            <img src={getFavicon(tool.domain)} alt="" loading="lazy" />
            <span>
              <strong>{tool.domain}</strong>
              <small>{tool.url}</small>
            </span>
          </div>

          <p className={styles.detailDescription}>{tool.description}</p>

          <div className={styles.detailMeta}>
            <span>分类：{categoryLabels[tool.category]}</span>
            <span>更新：{tool.updatedAt}</span>
          </div>

          <div className={cx(styles.toolTags, styles.detailTags)}>
            {tool.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className={styles.dialogActions}>
            <button className={styles.secondaryAction} type="button" onClick={() => onFavorite(tool.id)}>
              <Star size={16} />
              <span>{favorite ? '取消收藏' : '本地收藏'}</span>
            </button>
            <button className={styles.secondaryAction} type="button" onClick={onCancel}>
              再看看
            </button>
            <button className={styles.primaryAction} type="button" onClick={() => onConfirm(tool)}>
              <ExternalLink size={16} />
              <span>确认跳转</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

type RecommendationDialogProps = {
  recommendation: Recommendation;
  setRecommendation: React.Dispatch<React.SetStateAction<Recommendation>>;
  copied: boolean;
  email: string;
  onCopy: () => void;
  onClose: () => void;
};

function RecommendationDialog({ recommendation, setRecommendation, copied, email, onCopy, onClose }: RecommendationDialogProps) {
  function updateField(field: keyof Recommendation, value: string) {
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
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={onClose}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="recommend-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.dialogHeading}>
          <div>
            <p className={styles.eyebrow}>PUBLIC SUBMISSION</p>
            <h2 id="recommend-title">提交推荐</h2>
          </div>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label="关闭">
            <span aria-hidden="true">x</span>
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
            rows={4}
          />
        </label>

        <div className={styles.dialogActions}>
          <button className={styles.secondaryAction} type="button" onClick={onClose}>
            取消
          </button>
          {email && (
            <button className={styles.secondaryAction} type="button" onClick={onCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? '已复制' : '复制内容'}</span>
            </button>
          )}
          {email ? (
            <a className={styles.primaryAction} href={mailtoHref}>
              <Send size={16} />
              <span>发送邮件</span>
            </a>
          ) : (
            <button className={styles.primaryAction} type="button" onClick={onCopy}>
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
