# 🔄 자동 배포 워크플로우

## 수정 → 업로드 → 자동 배포

### 1. 코드 수정
```bash
# 파일 수정 후
git add .
git commit -m "수정 내용 설명"
git push origin main
```

### 2. 자동 배포
- GitHub에 push하면 자동으로 Netlify가 배포
- 1-2분 후 자동으로 업데이트됨
- 핸드폰에서도 바로 확인 가능

### 3. 핸드폰 테스트
- 배포된 URL로 접속
- 수정사항이 바로 반영됨

## 장점:
✅ **자동 배포** - push만 하면 자동 업데이트  
✅ **버전 관리** - 모든 수정 내역 저장  
✅ **롤백 가능** - 이전 버전으로 되돌리기 가능  
✅ **협업 가능** - 다른 사람도 수정 가능  
✅ **무료** - GitHub + Netlify 모두 무료  

## 핸드폰에서 사용:
- 메인: `https://your-site.netlify.app`
- 모바일: `https://your-site.netlify.app/mobile-optimized.html` 