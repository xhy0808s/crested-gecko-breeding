// Firebase 실시간 동기화 시스템
// PC와 모바일 간 실시간 데이터 동기화

class FirebaseSync {
    constructor() {
        this.db = null;
        this.auth = null;
        this.userId = null;
        this.syncInterval = null;
        this.isOnline = navigator.onLine;
        this.deviceId = this.generateDeviceId();
        
        this.init();
    }

    // 디바이스 ID 생성
    generateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    // Firebase 초기화
    async init() {
        try {
            // Firebase SDK 로드
            await this.loadFirebaseSDK();
            
            // Firebase 설정
            const firebaseConfig = {
                apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                authDomain: "crested-gecko-breeding.firebaseapp.com",
                projectId: "crested-gecko-breeding",
                storageBucket: "crested-gecko-breeding.appspot.com",
                messagingSenderId: "123456789012",
                appId: "1:123456789012:web:abcdefghijklmnop"
            };

            // Firebase 초기화
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.auth = firebase.auth();

            console.log('🔥 Firebase 초기화 완료');
            
            // 익명 로그인
            await this.anonymousLogin();
            
            // 실시간 동기화 시작
            this.startRealTimeSync();
            
        } catch (error) {
            console.error('❌ Firebase 초기화 오류:', error);
            // Firebase 실패 시 로컬 동기화로 폴백
            this.fallbackToLocalSync();
        }
    }

    // Firebase SDK 로드
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            // Firebase SDK가 이미 로드되어 있는지 확인
            if (window.firebase) {
                resolve();
                return;
            }

            // Firebase SDK 로드
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
            script.onload = () => {
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
                authScript.onload = () => {
                    const firestoreScript = document.createElement('script');
                    firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
                    firestoreScript.onload = resolve;
                    firestoreScript.onerror = reject;
                    document.head.appendChild(firestoreScript);
                };
                authScript.onerror = reject;
                document.head.appendChild(authScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 익명 로그인
    async anonymousLogin() {
        try {
            const userCredential = await this.auth.signInAnonymously();
            this.userId = userCredential.user.uid;
            console.log('👤 익명 로그인 완료:', this.userId);
        } catch (error) {
            console.error('❌ 로그인 오류:', error);
            throw error;
        }
    }

    // 실시간 동기화 시작
    startRealTimeSync() {
        console.log('🔄 Firebase 실시간 동기화 시작');
        
        // 실시간 리스너 설정
        this.setupRealTimeListeners();
        
        // 주기적 동기화
        this.syncInterval = setInterval(() => {
            this.syncToFirebase();
        }, 3000);
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    // 실시간 리스너 설정
    setupRealTimeListeners() {
        // 동물 데이터 실시간 리스너
        this.db.collection('users').doc(this.userId).collection('animals')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        this.handleFirebaseDataChange('animals', change.doc.data());
                    }
                });
            });

        // 해칭 데이터 실시간 리스너
        this.db.collection('users').doc(this.userId).collection('hatchings')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        this.handleFirebaseDataChange('hatchings', change.doc.data());
                    }
                });
            });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus();
            this.syncToFirebase();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus();
        });

        // 로컬 스토리지 변경 감지
        window.addEventListener('storage', (e) => {
            if (e.key === 'animals' || e.key === 'hatchings') {
                this.syncToFirebase();
            }
        });

        // 페이지 포커스 시 동기화
        window.addEventListener('focus', () => {
            this.syncFromFirebase();
        });
    }

    // Firebase로 데이터 동기화
    async syncToFirebase() {
        if (!this.isOnline || !this.db) {
            return;
        }

        try {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');

            // 동물 데이터 동기화
            for (const animal of animals) {
                await this.db.collection('users').doc(this.userId)
                    .collection('animals').doc(animal.id).set({
                        ...animal,
                        deviceId: this.deviceId,
                        lastUpdated: new Date().toISOString()
                    });
            }

            // 해칭 데이터 동기화
            for (const hatching of hatchings) {
                await this.db.collection('users').doc(this.userId)
                    .collection('hatchings').doc(hatching.id).set({
                        ...hatching,
                        deviceId: this.deviceId,
                        lastUpdated: new Date().toISOString()
                    });
            }

            console.log('✅ Firebase 동기화 완료');
            this.updateLastSync();
            
        } catch (error) {
            console.error('❌ Firebase 동기화 오류:', error);
        }
    }

    // Firebase에서 데이터 동기화
    async syncFromFirebase() {
        if (!this.isOnline || !this.db) {
            return;
        }

        try {
            // 동물 데이터 가져오기
            const animalsSnapshot = await this.db.collection('users').doc(this.userId)
                .collection('animals').get();
            
            const animals = [];
            animalsSnapshot.forEach(doc => {
                animals.push(doc.data());
            });

            // 해칭 데이터 가져오기
            const hatchingsSnapshot = await this.db.collection('users').doc(this.userId)
                .collection('hatchings').get();
            
            const hatchings = [];
            hatchingsSnapshot.forEach(doc => {
                hatchings.push(doc.data());
            });

            // 로컬 스토리지 업데이트
            localStorage.setItem('animals', JSON.stringify(animals));
            localStorage.setItem('hatchings', JSON.stringify(hatchings));
            localStorage.setItem('lastSync', new Date().toISOString());

            console.log('✅ Firebase에서 데이터 동기화 완료');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Firebase 데이터 가져오기 오류:', error);
        }
    }

    // Firebase 데이터 변경 처리
    handleFirebaseDataChange(type, data) {
        console.log(`🔄 Firebase 데이터 변경: ${type}`, data);
        
        if (type === 'animals') {
            const currentAnimals = JSON.parse(localStorage.getItem('animals') || '[]');
            const existingIndex = currentAnimals.findIndex(a => a.id === data.id);
            
            if (existingIndex >= 0) {
                currentAnimals[existingIndex] = data;
            } else {
                currentAnimals.push(data);
            }
            
            localStorage.setItem('animals', JSON.stringify(currentAnimals));
        } else if (type === 'hatchings') {
            const currentHatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
            const existingIndex = currentHatchings.findIndex(h => h.id === data.id);
            
            if (existingIndex >= 0) {
                currentHatchings[existingIndex] = data;
            } else {
                currentHatchings.push(data);
            }
            
            localStorage.setItem('hatchings', JSON.stringify(currentHatchings));
        }
        
        this.updateUI();
        this.showNotification(`${type} 데이터가 업데이트되었습니다`);
    }

    // UI 업데이트
    updateUI() {
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        const totalAnimalsEl = document.getElementById('totalAnimals');
        if (totalAnimalsEl) {
            totalAnimalsEl.textContent = animals.length;
        }

        const lastSyncEl = document.getElementById('lastSync');
        if (lastSyncEl) {
            const lastSync = localStorage.getItem('lastSync');
            lastSyncEl.textContent = lastSync ? 
                new Date(lastSync).toLocaleTimeString() : '-';
        }
    }

    // 동기화 상태 업데이트
    updateSyncStatus() {
        const statusEl = document.getElementById('syncStatus');
        const stateEl = document.getElementById('syncState');
        
        if (statusEl) {
            statusEl.textContent = this.isOnline ? 'Firebase 실시간 동기화 중...' : '오프라인 모드';
        }
        
        if (stateEl) {
            stateEl.textContent = this.isOnline ? '온라인' : '오프라인';
        }
    }

    // 마지막 동기화 시간 업데이트
    updateLastSync() {
        localStorage.setItem('lastSync', new Date().toISOString());
    }

    // 알림 표시
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #38a169;
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.5s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 로컬 동기화로 폴백
    fallbackToLocalSync() {
        console.log('🔄 로컬 동기화로 폴백');
        
        // 기존 로컬 동기화 시스템 사용
        if (typeof window.realTimeSyncV2 !== 'undefined') {
            window.realTimeSyncV2.startRealTimeSync();
        }
    }

    // 강제 동기화
    forceSync() {
        console.log('🔄 강제 Firebase 동기화 시작');
        this.syncToFirebase();
        this.syncFromFirebase();
        this.showNotification('강제 동기화가 완료되었습니다');
    }

    // 동기화 중지
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ Firebase 동기화 중지');
    }

    // 동기화 재시작
    restartSync() {
        this.stopSync();
        this.startRealTimeSync();
        console.log('🔄 Firebase 동기화 재시작');
    }
}

// 전역 인스턴스 생성
window.firebaseSync = new FirebaseSync();

console.log('✅ Firebase 실시간 동기화 시스템 로드 완료'); 