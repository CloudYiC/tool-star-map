# 工具发射台

一个公开的常用网站与工具导航站，使用 React 18 + Vite 实现。它适合部署到 Cloudflare Pages、Vercel、Netlify，也可以构建后迁移到自己的服务器或域名。

## 功能

- 清晰的工具列表和详情确认跳转
- 关键词搜索、分类筛选、热门标签筛选
- 暗色 / 浅色主题切换，自动保存到浏览器
- 本地收藏，收藏结果只保存在访客自己的浏览器
- 最近访问记录，记录结果只保存在访客自己的浏览器
- 提交推荐面板，默认复制推荐内容；配置邮箱后可直接发邮件
- 点击工具后弹出详情卡片，确认后再跳转

## 本地运行

```bash
npm install
npm run dev
```

开发地址通常是 `http://localhost:5173`。

## 修改工具数据

工具清单在 [src/data/tools.js](src/data/tools.js)。

新增工具时复制一个对象即可：

```js
{
  id: 'example',
  name: 'Example',
  url: 'https://example.com',
  domain: 'example.com',
  category: 'dev',
  description: '一句话说明它解决什么问题。',
  tags: ['标签', '工具'],
  featured: false,
  updatedAt: '2026-06-06',
  map: { x: 50, y: 50 }
}
```

`category` 需要使用 `ai`、`dev`、`design`、`productivity`、`learn`、`life` 中的一个。

## 配置提交推荐

打开 [src/data/tools.js](src/data/tools.js)，把 `recommendationEmail` 改成你的邮箱：

```js
export const siteConfig = {
  name: '工具发射台',
  tagline: '...',
  recommendationEmail: 'you@example.com'
};
```

不配置邮箱时，访客可以复制推荐内容；配置后，访客可以通过邮件发送推荐。

## 构建

```bash
npm run build
```

构建结果在 `dist` 目录。迁移到自己的服务器时，只需要把 `dist` 里的文件上传到网站根目录。

## 免费部署

Cloudflare Pages：

```bash
npm run deploy:cloudflare
```

首次执行会要求登录 Cloudflare。当前脚本使用兼容 Node 18 的 Wrangler 3；如果你把 Node 升级到 22 或更高，也可以运行 `npm run deploy:cloudflare:latest` 使用最新版 Wrangler。

也可以把代码推到 GitHub，然后在 Cloudflare Pages 控制台导入仓库，构建命令填 `npm run build`，输出目录填 `dist`。这是我更推荐的长期方式，因为之后每次提交都能自动部署。

Vercel：

```bash
npm run deploy:vercel
```

也可以在 Vercel 控制台导入 GitHub 仓库，Framework 选择 Vite，Build Command 填 `npm run build`，Output Directory 填 `dist`。

## 自己服务器迁移

1. 执行 `npm run build`
2. 上传 `dist` 目录里的所有文件
3. 如果使用 Nginx，可参考 [nginx.example.conf](nginx.example.conf)
4. 域名 DNS 解析到服务器 IP
5. 配置 HTTPS 证书

## GitHub 是否必需

不是必需。没有 GitHub，也可以用 CLI 直接部署，或者把 `dist` 上传到自己的服务器。

推荐使用 GitHub 的原因是：后续你只要改数据并提交，Cloudflare Pages / Vercel 可以自动重新部署，迁移平台也更方便。
