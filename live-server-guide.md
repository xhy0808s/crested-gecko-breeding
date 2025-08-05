# 📱 실시간 모바일 테스트 가이드

## 🚀 방법 1: VS Code Live Server (가장 간단!)

### 1. VS Code에서 Live Server 설치
- VS Code 열기
- Extensions 탭에서 "Live Server" 검색
- 설치 후 재시작

### 2. Live Server 실행
- `index.html` 파일 우클릭
- "Open with Live Server" 선택
- 자동으로 브라우저가 열림

### 3. 모바일에서 접속
- PC와 같은 WiFi에 연결
- 브라우저에서 `http://[PC_IP]:5500` 접속
- 예: `http://192.168.1.100:5500`

## 🚀 방법 2: Python 서버 (현재 실행 중)

### 현재 서버 상태
```bash
# 서버 실행 중
python3 -m http.server 8000 --bind 0.0.0.0

# 접속 주소
http://192.0.0.2:8000/
```

### 모바일 접속
- 같은 WiFi에 연결
- 브라우저에서 `http://192.0.0.2:8000/` 접속

## 🚀 방법 3: ngrok (외부 접속 가능)

### ngrok 설치
```bash
# Homebrew로 설치
brew install ngrok

# 또는 직접 다운로드
# https://ngrok.com/download
```

### ngrok 실행
```bash
# 8000번 포트 터널링
ngrok http 8000

# 제공되는 URL로 모바일에서 접속
# 예: https://abc123.ngrok.io
```

## 🚀 방법 4: Netlify Dev (추천!)

### Netlify CLI 설치
```bash
npm install -g netlify-cli
```

### 로컬 개발 서버 실행
```bash
netlify dev
```

### 모바일 접속
- 제공되는 로컬 URL로 접속
- 자동으로 HTTPS 지원

## 📱 모바일 테스트 팁

### 1. 개발자 도구 활용
- Chrome: `chrome://inspect`
- Safari: 개발 > 웹사이트 > [PC명] 선택

### 2. 실시간 리로드
- Live Server는 파일 변경 시 자동 새로고침
- 모바일에서도 실시간 반영

### 3. 디바이스 시뮬레이션
- Chrome DevTools > Toggle Device Toolbar
- 다양한 디바이스 크기 테스트

### 4. 네트워크 상태 테스트
- Chrome DevTools > Network 탭
- Slow 3G 등으로 속도 테스트

## 🔧 문제 해결

### 포트 접속 안 될 때
```bash
# 방화벽 확인
sudo ufw status

# 포트 열기 (필요시)
sudo ufw allow 8000
```

### IP 주소 확인
```bash
# macOS
ifconfig en0 | grep "inet "

# Windows
ipconfig

# Linux
ip addr show
```

### 서버 재시작
```bash
# 현재 서버 종료
Ctrl + C

# 새로 시작
python3 -m http.server 8000 --bind 0.0.0.0
```

## 🎯 추천 워크플로우

1. **VS Code Live Server** 사용 (가장 간단)
2. **같은 WiFi**에서 모바일 접속
3. **실시간 수정**하면서 테스트
4. **완성되면 Netlify**에 배포

이렇게 하면 **PC에서 수정하고 모바일에서 바로 확인**할 수 있어요! 🚀 