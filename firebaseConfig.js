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

// Firebase 초기화 (실시간 동기화 모드)
async function initFirebase() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const storage = getStorage(app);

        // 전역에 저장
        window.firebaseApp = app;
        window.db = db;
        window.storage = storage;
        
        // Firebase 함수들도 전역에 저장
        window.firebaseImports = {
            doc, setDoc, getDoc, collection, onSnapshot, updateDoc, deleteDoc,
            ref, uploadBytes, getDownloadURL, deleteObject
        };

        console.log("🔥 Firebase 실시간 동기화 모드로 초기화 완료");
        console.log("Project ID:", firebaseConfig.projectId);

        // 사용자 ID 생성 또는 가져오기
        function getUserId() {
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('userId', userId);
            }
            return userId;
        }

        window.getUserId = getUserId;
        window.currentUserId = getUserId();

        console.log("👤 사용자 ID:", window.currentUserId);
        
        // Firebase 초기화 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
    } catch (error) {
        console.error("❌ Firebase 초기화 실패:", error);
        
        // 오프라인 모드로 전환
        window.firebaseApp = null;
        window.db = null;
        window.storage = null;
        console.log("📴 오프라인 모드로 전환됨");
    }
}

// Firebase 초기화 실행
initFirebase();