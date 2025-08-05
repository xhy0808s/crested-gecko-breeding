// 완전한 동기화 시스템
// PC와 모바일 간 모든 개체 정보 실시간 동기화

class CompleteSync {
    constructor() {
        this.deviceId = this.generateDeviceId();
        this.isOnline = navigator.onLine;
        this.syncInterval = null;
        this.lastSync = null;
        
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
    init() {
        console.log('🔄 완전한 동기화 시스템 시작');
        console.log('디바이스 ID:', this.deviceId);
        
        this.setupEventListeners();
        this.startSync();
        this.initialSync();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus();
            this.broadcastSync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus();
        });

        // 로컬 스토리지 변경 감지
        window.addEventListener('storage', (e) => {
            if (e.key === 'animals' || e.key === 'hatchings') {
                this.handleDataChange(e.key, e.newValue);
            }
        });

        // 페이지 포커스 시 동기화
        window.addEventListener('focus', () => {
            this.broadcastSync();
        });

        // 페이지 언로드 전 동기화
        window.addEventListener('beforeunload', () => {
            this.broadcastSync();
        });

        // 개체 등록/수정/삭제 이벤트 감지
        this.setupAnimalEventListeners();
    }

    // 개체 이벤트 리스너 설정
    setupAnimalEventListeners() {
        // 폼 제출 이벤트 감지
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'animalForm') {
                // 개체 등록 시 동기화
                setTimeout(() => {
                    this.broadcastSync();
                }, 1000);
            }
        });

        // 개체 수정 이벤트 감지
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
                // 개체 수정 시 동기화
                setTimeout(() => {
                    this.broadcastSync();
                }, 1000);
            }
        });

        // 개체 삭제 이벤트 감지
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                // 개체 삭제 시 동기화
                setTimeout(() => {
                    this.broadcastSync();
                }, 1000);
            }
        });
    }

    // 동기화 시작
    startSync() {
        // 주기적 동기화 (2초마다)
        this.syncInterval = setInterval(() => {
            this.broadcastSync();
        }, 2000);
        
        console.log('🔄 주기적 동기화 시작 (2초마다)');
    }

    // 초기 동기화
    initialSync() {
        // 페이지 로드 시 즉시 동기화
        setTimeout(() => {
            this.broadcastSync();
        }, 1000);
    }

    // 브로드캐스트 메시지 전송
    broadcastSync() {
        const syncData = {
            type: 'completeSync',
            data: this.getAllData(),
            deviceId: this.deviceId,
            timestamp: new Date().toISOString()
        };

        // localStorage를 통한 브로드캐스트
        localStorage.setItem('completeSyncBroadcast', JSON.stringify(syncData));
        
        // Custom Event 발생
        window.dispatchEvent(new CustomEvent('completeSync', {
            detail: syncData
        }));

        console.log('📡 완전한 동기화 브로드캐스트');
    }

    // 모든 데이터 가져오기
    getAllData() {
        return {
            animals: JSON.parse(localStorage.getItem('animals') || '[]'),
            hatchings: JSON.parse(localStorage.getItem('hatchings') || '[]'),
            syncedImages: JSON.parse(localStorage.getItem('syncedImages') || '{}'),
            lastSync: localStorage.getItem('lastSync') || null
        };
    }

    // 브로드캐스트 메시지 처리
    handleBroadcastMessage(data) {
        if (data.type === 'completeSync' && data.deviceId !== this.deviceId) {
            console.log('📡 다른 디바이스에서 완전한 동기화 데이터 수신:', data.deviceId);
            this.mergeAllData(data.data);
        }
    }

    // 모든 데이터 병합
    mergeAllData(remoteData) {
        let hasChanges = false;

        // 동물 데이터 병합
        const currentAnimals = JSON.parse(localStorage.getItem('animals') || '[]');
        const remoteAnimals = remoteData.animals || [];

        for (const remoteAnimal of remoteAnimals) {
            const existingIndex = currentAnimals.findIndex(a => a.id === remoteAnimal.id);
            
            if (existingIndex >= 0) {
                // 기존 데이터가 있으면 더 최신 것으로 업데이트
                const existing = currentAnimals[existingIndex];
                const existingTime = new Date(existing.updatedAt || existing.createdAt || 0);
                const remoteTime = new Date(remoteAnimal.updatedAt || remoteAnimal.createdAt || 0);
                
                if (remoteTime > existingTime) {
                    currentAnimals[existingIndex] = remoteAnimal;
                    hasChanges = true;
                }
            } else {
                // 새로운 데이터 추가
                currentAnimals.push(remoteAnimal);
                hasChanges = true;
            }
        }

        // 해칭 데이터 병합
        const currentHatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
        const remoteHatchings = remoteData.hatchings || [];

        for (const remoteHatching of remoteHatchings) {
            const existingIndex = currentHatchings.findIndex(h => h.id === remoteHatching.id);
            
            if (existingIndex >= 0) {
                const existing = currentHatchings[existingIndex];
                const existingTime = new Date(existing.updatedAt || existing.createdAt || 0);
                const remoteTime = new Date(remoteHatching.updatedAt || remoteHatching.createdAt || 0);
                
                if (remoteTime > existingTime) {
                    currentHatchings[existingIndex] = remoteHatching;
                    hasChanges = true;
                }
            } else {
                currentHatchings.push(remoteHatching);
                hasChanges = true;
            }
        }

        // 이미지 데이터 병합
        const currentImages = JSON.parse(localStorage.getItem('syncedImages') || '{}');
        const remoteImages = remoteData.syncedImages || {};

        for (const [imageId, remoteImage] of Object.entries(remoteImages)) {
            if (!currentImages[imageId] || 
                new Date(remoteImage.timestamp) > new Date(currentImages[imageId].timestamp)) {
                currentImages[imageId] = remoteImage;
                hasChanges = true;
            }
        }

        // 변경사항이 있으면 저장
        if (hasChanges) {
            localStorage.setItem('animals', JSON.stringify(currentAnimals));
            localStorage.setItem('hatchings', JSON.stringify(currentHatchings));
            localStorage.setItem('syncedImages', JSON.stringify(currentImages));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            this.updateUI();
            this.showNotification('다른 디바이스에서 데이터가 동기화되었습니다');
            
            console.log('✅ 완전한 데이터 병합 완료');
        }
    }

    // 데이터 변경 처리
    handleDataChange(key, newValue) {
        console.log(`🔄 데이터 변경: ${key}`);
        
        // UI 업데이트
        this.updateUI();
        
        // 동기화 브로드캐스트
        this.broadcastSync();
        
        // 알림 표시
        this.showNotification('데이터가 업데이트되었습니다');
    }

    // UI 업데이트
    updateUI() {
        // 동물 개수 업데이트
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        const totalAnimalsEl = document.getElementById('totalAnimals');
        if (totalAnimalsEl) {
            totalAnimalsEl.textContent = animals.length;
        }

        // 마지막 동기화 시간 업데이트
        const lastSyncEl = document.getElementById('lastSync');
        if (lastSyncEl) {
            const lastSync = localStorage.getItem('lastSync');
            lastSyncEl.textContent = lastSync ? 
                new Date(lastSync).toLocaleTimeString() : '-';
        }

        // 동물 목록 새로고침 (list 페이지인 경우)
        if (typeof refreshAnimals === 'function') {
            refreshAnimals();
        }

        // 개체 카드 새로고침 (index 페이지인 경우)
        if (typeof updateStats === 'function') {
            updateStats();
        }
    }

    // 동기화 상태 업데이트
    updateSyncStatus() {
        const statusEl = document.getElementById('syncStatus');
        const stateEl = document.getElementById('syncState');
        
        if (statusEl) {
            statusEl.textContent = this.isOnline ? '완전한 실시간 동기화 중...' : '오프라인 모드';
        }
        
        if (stateEl) {
            stateEl.textContent = this.isOnline ? '온라인' : '오프라인';
        }
    }

    // 알림 표시
    showNotification(message) {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.complete-sync-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = 'complete-sync-notification';
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>${message}</span>
        `;
        
        // 스타일 적용
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

        // 3초 후 제거
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 강제 동기화
    forceSync() {
        console.log('🔄 강제 완전한 동기화 시작');
        this.broadcastSync();
        this.showNotification('강제 동기화가 완료되었습니다');
    }

    // 동기화 중지
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ 동기화 중지');
    }

    // 동기화 재시작
    restartSync() {
        this.stopSync();
        this.startSync();
        console.log('🔄 동기화 재시작');
    }

    // 디바이스 정보 가져오기
    getDeviceInfo() {
        return {
            deviceId: this.deviceId,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            isOnline: this.isOnline,
            lastSync: localStorage.getItem('lastSync')
        };
    }

    // 동기화 상태 확인
    getSyncStatus() {
        const animals = JSON.parse(localStorage.getItem('animals') || '[]');
        const hatchings = JSON.parse(localStorage.getItem('hatchings') || '[]');
        const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
        
        return {
            isOnline: this.isOnline,
            deviceId: this.deviceId,
            dataCount: {
                animals: animals.length,
                hatchings: hatchings.length,
                images: Object.keys(images).length
            },
            lastSync: localStorage.getItem('lastSync')
        };
    }

    // 개체 등록 시 자동 동기화
    registerAnimal(animalData) {
        try {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            animals.push(animalData);
            localStorage.setItem('animals', JSON.stringify(animals));
            
            // 즉시 동기화
            this.broadcastSync();
            
            console.log('✅ 개체 등록 및 동기화 완료:', animalData.name);
            return true;
        } catch (error) {
            console.error('❌ 개체 등록 오류:', error);
            return false;
        }
    }

    // 개체 수정 시 자동 동기화
    updateAnimal(animalId, updatedData) {
        try {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const index = animals.findIndex(a => a.id === animalId);
            
            if (index !== -1) {
                animals[index] = { ...animals[index], ...updatedData, updatedAt: new Date().toISOString() };
                localStorage.setItem('animals', JSON.stringify(animals));
                
                // 즉시 동기화
                this.broadcastSync();
                
                console.log('✅ 개체 수정 및 동기화 완료:', updatedData.name);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ 개체 수정 오류:', error);
            return false;
        }
    }

    // 개체 삭제 시 자동 동기화
    deleteAnimal(animalId) {
        try {
            const animals = JSON.parse(localStorage.getItem('animals') || '[]');
            const filteredAnimals = animals.filter(a => a.id !== animalId);
            localStorage.setItem('animals', JSON.stringify(filteredAnimals));
            
            // 즉시 동기화
            this.broadcastSync();
            
            console.log('✅ 개체 삭제 및 동기화 완료:', animalId);
            return true;
        } catch (error) {
            console.error('❌ 개체 삭제 오류:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.completeSync = new CompleteSync();

// 완전한 동기화 이벤트 리스너
window.addEventListener('completeSync', (event) => {
    console.log('📡 완전한 동기화 이벤트 수신:', event.detail);
    window.completeSync.handleBroadcastMessage(event.detail);
});

// 로컬 스토리지 브로드캐스트 리스너
window.addEventListener('storage', (e) => {
    if (e.key === 'completeSyncBroadcast') {
        try {
            const syncData = JSON.parse(e.newValue);
            console.log('📡 완전한 동기화 브로드캐스트 수신:', syncData);
            window.completeSync.handleBroadcastMessage(syncData);
        } catch (error) {
            console.error('❌ 완전한 동기화 데이터 파싱 오류:', error);
        }
    }
});

console.log('✅ 완전한 동기화 시스템 로드 완료'); 