#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      AI Paper Reader  一键部署       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# ---------- Check prerequisites ----------
check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}[✗] 未找到 $1，请先安装${NC}"
    exit 1
  fi
}

check_cmd python3
check_cmd node
check_cmd npm

echo -e "${GREEN}[✓]${NC} python3 $(python3 --version 2>&1 | awk '{print $2}')"
echo -e "${GREEN}[✓]${NC} node $(node --version)"
echo -e "${GREEN}[✓]${NC} npm $(npm --version)"
echo ""

# ---------- Backend ----------
echo -e "${YELLOW}▸ 配置后端...${NC}"

cd backend

if [ ! -d "venv" ]; then
  echo "  创建 Python 虚拟环境..."
  python3 -m venv venv
fi

source venv/bin/activate
echo "  安装 Python 依赖..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo -e "${YELLOW}  ⚠  已创建 backend/.env，请填入你的 API Key：${NC}"
  echo -e "     ${YELLOW}OPENAI_API_KEY=sk-your-api-key-here${NC}"
  echo ""
  NEED_KEY=true
else
  echo -e "  ${GREEN}[✓]${NC} .env 已存在，跳过"
fi

mkdir -p storage/pdfs

cd ..

# ---------- Frontend ----------
echo -e "${YELLOW}▸ 配置前端...${NC}"

cd frontend

if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
fi

echo "  安装 Node 依赖..."
npm install --silent

cd ..

# ---------- Done ----------
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""

if [ "$NEED_KEY" = true ]; then
  echo -e "${YELLOW}  首先编辑 backend/.env 填入你的 API Key${NC}"
  echo ""
fi

echo "  启动后端:  cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000"
echo "  启动前端:  cd frontend && npm run dev"
echo ""
echo "  然后访问:  http://localhost:3000"
echo ""
