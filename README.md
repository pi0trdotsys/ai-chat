# AI Chat

Lokalny LLM (Ollama) wystawiony publicznie przez Cloudflare Tunnel.

## Stack
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + Framer Motion
- **Backend**: Express.js + TypeScript (proxy + JWT auth + rate limiting)
- **AI**: Ollama (dolphin-mistral 7B)
- **Infra**: Docker Compose + Cloudflare Tunnel

## Pierwsze uruchomienie na serwerze

### 1. Zainstaluj Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Sklonuj repo
```bash
git clone https://github.com/TWOJ_LOGIN/ai-chat.git
cd ai-chat
```

### 3. Utwórz plik .env
```bash
cp .env.example .env
nano .env   # uzupełnij JWT_SECRET i ACCESS_PASSWORD
```

### 4. Uruchom
```bash
docker compose up -d
```

### 5. Załaduj model (tylko raz)
```bash
docker exec ollama ollama pull dolphin-mistral:7b-v2.8-q4_K_M

# Utwórz wersję z polskim system promptem
docker exec -it ollama sh
# wewnątrz kontenera:
cat > /tmp/modelfile << 'EOF'
FROM dolphin-mistral:7b-v2.8-q4_K_M
SYSTEM "Zawsze odpowiadaj w języku polskim, niezależnie od języka pytania."
EOF
ollama create dolphin-pl -f /tmp/modelfile
exit
```

### 6. Cloudflare Tunnel
```bash
# Zainstaluj cloudflared
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared

cloudflared tunnel login
cloudflared tunnel create ai-chat
cloudflared tunnel route dns ai-chat ai.twoja-domena.pl
```

Utwórz `/etc/cloudflared/config.yml`:
```yaml
tunnel: ai-chat
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: ai.twoja-domena.pl
    service: http://localhost:5173
  - service: http_status:404
```

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## Aktualizacja (po git push na Macu)

```bash
git pull
docker compose up -d --build
```

## Porty
| Serwis | Port |
|--------|------|
| Frontend | 5173 |
| Backend | 3001 |
| Ollama | 11434 (tylko lokalnie) |
