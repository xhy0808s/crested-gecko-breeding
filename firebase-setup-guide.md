# 🔥 Firebase 설정 완전 가이드

## 🚀 1단계: Firebase 프로젝트 생성

### 1. Firebase Console 접속
- https://console.firebase.google.com/ 접속
- Google 계정으로 로그인

### 2. 새 프로젝트 생성
- "프로젝트 만들기" 클릭
- 프로젝트 이름: `crested-gecko-breeding`
- Google Analytics 사용 (선택사항)
- "프로젝트 만들기" 클릭

## 🚀 2단계: Firestore Database 설정

### 1. Firestore Database 활성화
- 왼쪽 메뉴에서 "Firestore Database" 클릭
- "데이터베이스 만들기" 클릭
- "테스트 모드에서 시작" 선택
- 위치: `asia-northeast3 (서울)` 선택
- "완료" 클릭

### 2. 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자별 데이터 접근 허용
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 3단계: 웹 앱 등록

### 1. 웹 앱 추가
- 프로젝트 개요에서 "웹" 아이콘 클릭
- 앱 닉네임: `crested-gecko-breeding-web`
- "앱 등록" 클릭

### 2. Firebase SDK 설정 복사
```javascript
const firebaseConfig = {
  apiKey: "실제_API_키",
  authDomain: "crested-gecko-breeding.firebaseapp.com",
  projectId: "crested-gecko-breeding",
  storageBucket: "crested-gecko-breeding.appspot.com",
  messagingSenderId: "실제_메시징_센더_ID",
  appId: "실제_앱_ID"
};
```

## 🚀 4단계: 인증 설정

### 1. Authentication 활성화
- 왼쪽 메뉴에서 "Authentication" 클릭
- "시작하기" 클릭
- "로그인 방법" 탭에서 "익명" 활성화
- "저장" 클릭

## 🚀 5단계: 코드 설정 업데이트

### 1. firebase-config.js 업데이트
실제 Firebase 설정으로 교체:

```javascript
// Firebase 설정
const firebaseConfig = {
    apiKey: "실제_API_키_입력",
    authDomain: "crested-gecko-breeding.firebaseapp.com",
    projectId: "crested-gecko-breeding",
    storageBucket: "crested-gecko-breeding.appspot.com",
    messagingSenderId: "실제_메시징_센더_ID_입력",
    appId: "실제_앱_ID_입력"
};
```

## 🚀 6단계: 자동 설정 스크립트

### 1. 설정 확인 스크립트 실행
브라우저 콘솔에서 실행:

```javascript
// Firebase 연결 테스트
if (window.serverSync) {
    console.log('서버 동기화 상태:', window.serverSync.getServerSyncStatus());
    console.log('Firebase 연결:', window.serverSync.db ? '성공' : '실패');
} else {
    console.log('서버 동기화 시스템이 로드되지 않았습니다.');
}
```

## 🚀 7단계: 테스트

### 1. 개체 등록 테스트
- PC에서 개체 등록
- Firebase Console에서 데이터 확인
- 모바일에서 동기화 확인

### 2. 실시간 동기화 테스트
- PC에서 개체 수정
- 모바일에서 즉시 반영 확인

## 🔧 문제 해결

### 1. Firebase 연결 오류
```javascript
// 콘솔에서 확인
console.log('Firebase 설정:', window.firebaseApp);
console.log('Firestore DB:', window.db);
```

### 2. 권한 오류
- Firebase Console에서 보안 규칙 확인
- Authentication에서 익명 로그인 활성화 확인

### 3. 동기화 오류
```javascript
// 강제 동기화
window.serverSync.forceServerSync();
```

## 📱 모바일 테스트

### 1. 실제 디바이스 테스트
- PC와 모바일에서 동시 접속
- PC에서 개체 등록
- 모바일에서 실시간 확인

### 2. 오프라인 테스트
- 인터넷 연결 해제
- 로컬에서 작업
- 인터넷 재연결 시 서버 동기화 확인

## 🎯 완료 확인

### 1. 성공 지표
- ✅ Firebase Console에서 데이터 확인 가능
- ✅ PC에서 등록한 데이터가 모바일에서 보임
- ✅ 실시간 동기화 작동
- ✅ 오프라인 모드 지원

### 2. 최종 테스트
```javascript
// 모든 기능 테스트
window.serverSync.getServerSyncStatus();
window.serverSync.forceServerSync();
```

이제 **실제 서버 기반 동기화**가 완전히 작동합니다! 🚀 