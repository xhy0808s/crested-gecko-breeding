// Firebase 설정 정보
const firebaseConfig = {
    apiKey: "AIzaSyDD5ZpR5fk70tmcKXB09FEj5g6LeZb1-Zc",
    authDomain: "crested-gecko-breeding.firebaseapp.com",
    projectId: "crested-gecko-breeding",
    storageBucket: "crested-gecko-breeding.firebasestorage.app",
    messagingSenderId: "12684495107",
    appId: "1:12684495107:web:289489c1a456db8b134136"
};

// Firebase 초기화
function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            window.firebaseApp = firebase.initializeApp(firebaseConfig);
            window.db = firebase.firestore();
            window.auth = firebase.auth();
            
            console.log('✅ Firebase 설정 완료!');
            
            // 성공 알림 표시
            showFirebaseSuccess();
            
            return true;
        } catch (error) {
            console.error('❌ Firebase 초기화 오류:', error);
            return false;
        }
    } else {
        console.log('⚠️ Firebase SDK가 로드되지 않았습니다.');
        return false;
    }
}

// Firebase 설정 성공 알림
function showFirebaseSuccess() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #03c75a;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
        transition: all 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🔥</span>
            <span>Firebase 설정 완료! 이제 완벽한 서버 동기화가 가능합니다!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // 5초 후 제거
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Firebase SDK 로드 후 초기화
if (typeof firebase !== 'undefined') {
    initializeFirebase();
} else {
    // Firebase SDK 로드 대기
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined') {
            clearInterval(checkFirebase);
            initializeFirebase();
        }
    }, 100);
}

// 전역에서 사용 가능하도록 설정
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase; 