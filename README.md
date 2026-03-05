# Phu San An Sinh - Production Deployment Guide

## 🌍 URL Production
- **Domains:** `phusanansinh.pages.dev`
- **Branch:** `main`
- **Preview Domain:** `e4dbac36.phusanansinh.pages.dev`

## 🚀 How to deploy to Cloudflare Pages
**Deploy Command:**
```sh
npm run deploy
# or
npm run build && npx wrangler pages deploy dist --project-name phusanansinh --branch main
```

## 📦 Project Structure
- Astro framework (Static output)
- `src/pages` -> routes
- `src/content` -> markdown contents
- `dist/` -> build output directory

## 🛠️ Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Cài đặt dependencies |
| `npm run dev` | Khởi động server dev (mặc định: port 4321) |
| `npm run build` | Build dự án ra thư mục `dist/` |
| `npm run deploy` | Chạy lệnh build và push thẳng code từ `dist/` lên Cloudflare Pages project: `phusanansinh` |
