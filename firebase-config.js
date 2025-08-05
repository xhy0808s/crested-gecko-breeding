// Firebase 설정
// 실제 서버 기반 동기화를 위한 Firebase Firestore 설정

// Firebase SDK 로드
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "crested-gecko-breeding.firebaseapp.com",
    projectId: "crested-gecko-breeding",
    storageBucket: "crested-gecko-breeding.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};

// Firebase 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firestore 데이터베이스
const db = firebase.firestore();
const auth = firebase.auth();

// 전역 변수로 설정
window.firebaseApp = firebase;
window.db = db;
window.auth = auth;

console.log('🔥 Firebase 설정 완료'); 