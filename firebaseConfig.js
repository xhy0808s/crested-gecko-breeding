// 민석님의 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyA7ype5pK17aJGywXfzL88vQPs20QqnQ8I",
  authDomain: "chogang-cab5e.firebaseapp.com",
  projectId: "chogang-cab5e",
  storageBucket: "chogang-cab5e.appspot.com",
  messagingSenderId: "1085073989308",
  appId: "1:1085073989308:web:3cb796bb8087c0b643ab9",
  measurementId: "G-25EG4YQ8J3"
};

// 초기화 (테스터용 - 로컬 스토리지 사용)
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const storage = getStorage(app);

// 전역에 저장 (테스터용)
window.firebaseApp = null;
window.db = null;
window.storage = null;

console.log("로컬 스토리지 모드로 초기화 완료");
console.log("Project ID:", firebaseConfig.projectId);