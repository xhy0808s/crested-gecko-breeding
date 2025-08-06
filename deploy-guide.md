# 🌍 클라우드 배포 가이드

## 방법 1: GitHub Pages + Netlify (무료, 추천)

### 1단계: GitHub에 업로드
```bash
# 새 저장소 생성
git init
git add .
git commit -m "크레스티드 게코 브리딩 시스템"
git branch -M main
git remote add origin https://github.com/사용자명/gecko-breeding.git
git push -u origin main
```

### 2단계: Netlify 배포
1. https://netlify.com 접속
2. "New site from Git" 클릭
3. GitHub 저장소 연결
4. 자동 배포 완료
5. 생성된 URL로 전 세계 어디서든 접속!

## 방법 2: Firebase Hosting (무료)

### 1단계: Firebase CLI 설치
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

### 2단계: 배포
```bash
firebase deploy
```

### 결과: https://프로젝트명.web.app

## 방법 3: Vercel (무료)

### 1단계: Vercel CLI
```bash
npm install -g vercel
vercel
```

### 결과: https://프로젝트명.vercel.app

## 장점:
- ✅ **무료**: 모든 방법이 무료
- ✅ **HTTPS**: 자동으로 보안 연결
- ✅ **빠름**: CDN으로 전 세계 빠른 접속
- ✅ **안정적**: 24/7 가용성
- ✅ **도메인**: 사용자 친화적 URL
- ✅ **자동 백업**: 코드가 클라우드에 안전하게 보관

## 데이터 동기화:
현재 Firebase 실시간 동기화가 이미 구현되어 있어서, 
클라우드에 배포해도 모든 기기에서 동일한 데이터를 볼 수 있습니다!