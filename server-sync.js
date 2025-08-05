// 서버 기반 동기화 시스템
// Firebase Firestore를 사용한 실제 서버 동기화

class ServerSync {
    constructor() {
        this.db = null;
        this.auth = null;
        this.userId = null;
        this.isOnline = navigator.onLine;
        this.deviceId = this.generateDeviceId();
        this.syncInterval = null;
        
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

    // 초기화
    async init() {
        try {
            console.log('🔄 서버 기반 동기화 시스템 시작');
            
            // Firebase SDK 로드
            await this.loadFirebaseSDK();
            
            // Firebase 초기화
            this.initializeFirebase();
            
            // 익명 로그인
            await this.anonymousLogin();
            
            // 실시간 동기화 시작
            this.startRealTimeSync();
            
            console.log('✅ 서버 기반 동기화 시스템 초기화 완료');
            
        } catch (error) {
            console.error('❌ 서버 동기화 초기화 오류:', error);
            // 오프라인 모드로 폴백
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

    // Firebase 초기화
    initializeFirebase() {
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
        console.log('🔄 서버 실시간 동기화 시작');
        
        // 실시간 리스너 설정
        this.setupRealTimeListeners();
        
        // 주기적 동기화
        this.syncInterval = setInterval(() => {
            this.syncToServer();
        }, 5000);
        
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
                        this.handleServerDataChange('animals', change.doc.data());
                    } else if (change.type === 'removed') {
                        this.handleServerDataDelete('animals', change.doc.id);
                    }
                });
            });

        // 해칭 데이터 실시간 리스너
        this.db.collection('users').doc(this.userId).collection('hatchings')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        this.handleServerDataChange('hatchings', change.doc.data());
                    } else if (change.type === 'removed') {
                        this.handleServerDataDelete('hatchings', change.doc.id);
                    }
                });
            });

        // 이미지 데이터 실시간 리스너
        this.db.collection('users').doc(this.userId).collection('images')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        this.handleServerDataChange('images', change.doc.data());
                    } else if (change.type === 'removed') {
                        this.handleServerDataDelete('images', change.doc.id);
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
            this.syncToServer();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus();
        });

        // 페이지 포커스 시 동기화
        window.addEventListener('focus', () => {
            this.syncFromServer();
        });

        // 페이지 언로드 전 동기화
        window.addEventListener('beforeunload', () => {
            this.syncToServer();
        });
    }

    // 서버로 데이터 동기화
    async syncToServer() {
        if (!this.isOnline || !this.db) {
            return;
        }

        try {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
            const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');

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

            // 이미지 데이터 동기화
            for (const [imageId, imageData] of Object.entries(images)) {
                await this.db.collection('users').doc(this.userId)
                    .collection('images').doc(imageId).set({
                        ...imageData,
                        deviceId: this.deviceId,
                        lastUpdated: new Date().toISOString()
                    });
            }

            console.log('✅ 서버 동기화 완료');
            this.updateLastSync();
            
        } catch (error) {
            console.error('❌ 서버 동기화 오류:', error);
        }
    }

    // 서버에서 데이터 동기화
    async syncFromServer() {
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

            // 이미지 데이터 가져오기
            const imagesSnapshot = await this.db.collection('users').doc(this.userId)
                .collection('images').get();
            
            const images = {};
            imagesSnapshot.forEach(doc => {
                images[doc.id] = doc.data();
            });

            // 로컬 스토리지 업데이트
            localStorage.setItem('animals', JSON.stringify(animals));
            localStorage.setItem('hatchings', JSON.stringify(hatchings));
            localStorage.setItem('syncedImages', JSON.stringify(images));
            localStorage.setItem('lastSync', new Date().toISOString());

            console.log('✅ 서버에서 데이터 동기화 완료');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ 서버 데이터 가져오기 오류:', error);
        }
    }

    // 서버 데이터 변경 처리
    handleServerDataChange(type, data) {
        console.log(`🔄 서버 데이터 변경: ${type}`, data);
        
        if (type === 'animals') {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const existingIndex = animals.findIndex(a => a.id === data.id);
            
            if (existingIndex >= 0) {
                animals[existingIndex] = data;
            } else {
                animals.push(data);
            }
            
            localStorage.setItem('animals', JSON.stringify(animals));
        } else if (type === 'hatchings') {
            const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
            const existingIndex = hatchings.findIndex(h => h.id === data.id);
            
            if (existingIndex >= 0) {
                hatchings[existingIndex] = data;
            } else {
                hatchings.push(data);
            }
            
            localStorage.setItem('hatchings', JSON.stringify(hatchings));
        } else if (type === 'images') {
            const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
            images[data.id] = data;
            localStorage.setItem('syncedImages', JSON.stringify(images));
        }
        
        this.updateUI();
        this.showNotification(`${type} 데이터가 서버에서 업데이트되었습니다`);
    }

    // 서버 데이터 삭제 처리
    handleServerDataDelete(type, id) {
        console.log(`🗑️ 서버 데이터 삭제: ${type}`, id);
        
        if (type === 'animals') {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const filteredAnimals = animals.filter(a => a.id !== id);
            localStorage.setItem('animals', JSON.stringify(filteredAnimals));
        } else if (type === 'hatchings') {
            const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
            const filteredHatchings = hatchings.filter(h => h.id !== id);
            localStorage.setItem('hatchings', JSON.stringify(filteredHatchings));
        } else if (type === 'images') {
            const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
            delete images[id];
            localStorage.setItem('syncedImages', JSON.stringify(images));
        }
        
        this.updateUI();
        this.showNotification(`${type} 데이터가 서버에서 삭제되었습니다`);
    }

    // 개체 등록 (서버 기반)
    async registerAnimal(animalData) {
        try {
            // 로컬에 저장
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            animals.push(animalData);
            localStorage.setItem('animals', JSON.stringify(animals));
            
            // 서버에 저장
            if (this.db && this.isOnline) {
                await this.db.collection('users').doc(this.userId)
                    .collection('animals').doc(animalData.id).set({
                        ...animalData,
                        deviceId: this.deviceId,
                        lastUpdated: new Date().toISOString()
                    });
            }
            
            console.log('✅ 개체 등록 완료 (서버):', animalData.name);
            return true;
        } catch (error) {
            console.error('❌ 개체 등록 오류:', error);
            return false;
        }
    }

    // 개체 수정 (서버 기반)
    async updateAnimal(animalId, updatedData) {
        try {
            // 로컬 업데이트
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const index = animals.findIndex(a => a.id === animalId);
            
            if (index !== -1) {
                animals[index] = { ...animals[index], ...updatedData, updatedAt: new Date().toISOString() };
                localStorage.setItem('animals', JSON.stringify(animals));
                
                // 서버 업데이트
                if (this.db && this.isOnline) {
                    await this.db.collection('users').doc(this.userId)
                        .collection('animals').doc(animalId).update({
                            ...updatedData,
                            deviceId: this.deviceId,
                            lastUpdated: new Date().toISOString()
                        });
                }
                
                console.log('✅ 개체 수정 완료 (서버):', updatedData.name);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ 개체 수정 오류:', error);
            return false;
        }
    }

    // 개체 삭제 (서버 기반)
    async deleteAnimal(animalId) {
        try {
            // 로컬 삭제
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const filteredAnimals = animals.filter(a => a.id !== animalId);
            localStorage.setItem('animals', JSON.stringify(filteredAnimals));
            
            // 서버 삭제
            if (this.db && this.isOnline) {
                await this.db.collection('users').doc(this.userId)
                    .collection('animals').doc(animalId).delete();
            }
            
            console.log('✅ 개체 삭제 완료 (서버):', animalId);
            return true;
        } catch (error) {
            console.error('❌ 개체 삭제 오류:', error);
            return false;
        }
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

        // 동물 목록 새로고침
        if (typeof refreshAnimals === 'function') {
            refreshAnimals();
        }

        // 개체 카드 새로고침
        if (typeof updateStats === 'function') {
            updateStats();
        }
    }

    // 동기화 상태 업데이트
    updateSyncStatus() {
        const statusEl = document.getElementById('syncStatus');
        const stateEl = document.getElementById('syncState');
        
        if (statusEl) {
            statusEl.textContent = this.isOnline ? '서버 실시간 동기화 중...' : '오프라인 모드';
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
        notification.className = 'server-sync-notification';
        notification.innerHTML = `
            <i class="fas fa-server"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4299e1;
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
        if (typeof window.completeSync !== 'undefined') {
            window.completeSync.startRealTimeSync();
        }
    }

    // 강제 서버 동기화
    async forceServerSync() {
        console.log('🔄 강제 서버 동기화 시작');
        await this.syncToServer();
        await this.syncFromServer();
        this.showNotification('강제 서버 동기화가 완료되었습니다');
    }

    // 동기화 중지
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ 서버 동기화 중지');
    }

    // 동기화 재시작
    restartSync() {
        this.stopSync();
        this.startRealTimeSync();
        console.log('🔄 서버 동기화 재시작');
    }

    // 서버 동기화 상태 확인
    getServerSyncStatus() {
        return {
            isOnline: this.isOnline,
            userId: this.userId,
            deviceId: this.deviceId,
            lastSync: localStorage.getItem('lastSync'),
            serverConnected: !!this.db
        };
    }
}

// 전역 인스턴스 생성
window.serverSync = new ServerSync();

console.log('✅ 서버 기반 동기화 시스템 로드 완료'); 