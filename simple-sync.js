// 간단한 실시간 동기화 시스템
// PC와 모바일 간 실시간 데이터 동기화

class SimpleSync {
    constructor() {
        this.channel = null;
        this.deviceId = this.generateDeviceId();
        this.isOnline = navigator.onLine;
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
    init() {
        console.log('🔄 간단한 실시간 동기화 시작');
        console.log('디바이스 ID:', this.deviceId);
        
        this.setupBroadcastChannel();
        this.setupEventListeners();
        this.startSync();
        this.initialSync();
    }

    // BroadcastChannel 설정
    setupBroadcastChannel() {
        try {
            this.channel = new BroadcastChannel('gecko-sync');
            
            this.channel.onmessage = (event) => {
                this.handleBroadcastMessage(event.data);
            };
            
            console.log('📡 BroadcastChannel 설정 완료');
        } catch (error) {
            console.warn('⚠️ BroadcastChannel 지원 안됨, localStorage 사용');
        }
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
    }

    // 동기화 시작
    startSync() {
        // 주기적 동기화 (3초마다)
        this.syncInterval = setInterval(() => {
            this.broadcastSync();
        }, 3000);
        
        console.log('🔄 주기적 동기화 시작 (3초마다)');
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
            type: 'sync',
            data: this.getCurrentData(),
            deviceId: this.deviceId,
            timestamp: new Date().toISOString()
        };

        // BroadcastChannel 사용
        if (this.channel) {
            this.channel.postMessage(syncData);
        }

        // localStorage를 통한 폴백
        localStorage.setItem('syncBroadcast', JSON.stringify(syncData));
        
        // 이벤트 발생
        window.dispatchEvent(new CustomEvent('dataSync', {
            detail: syncData
        }));
    }

    // 브로드캐스트 메시지 처리
    handleBroadcastMessage(data) {
        if (data.type === 'sync' && data.deviceId !== this.deviceId) {
            console.log('📡 다른 디바이스에서 동기화 데이터 수신:', data.deviceId);
            this.mergeData(data.data);
        }
    }

    // 현재 데이터 가져오기
    getCurrentData() {
        return {
            animals: JSON.parse(localStorage.getItem('animals') || '[]'),
            hatchings: JSON.parse(localStorage.getItem('hatchings') || '[]'),
            lastSync: localStorage.getItem('lastSync') || null
        };
    }

    // 데이터 병합
    mergeData(remoteData) {
        let hasChanges = false;

        // 동물 데이터 병합
        const currentAnimals = JSON.parse(localStorage.getItem('animals') || '[]');
        const remoteAnimals = remoteData.animals || [];

        for (const remoteAnimal of remoteAnimals) {
            const existingIndex = currentAnimals.findIndex(a => a.id === remoteAnimal.id);
            
            if (existingIndex >= 0) {
                // 기존 데이터가 있으면 더 최신 것으로 업데이트
                const existing = currentAnimals[existingIndex];
                const existingTime = new Date(existing.lastUpdated || existing.createdAt || 0);
                const remoteTime = new Date(remoteAnimal.lastUpdated || remoteAnimal.createdAt || 0);
                
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
                const existingTime = new Date(existing.lastUpdated || existing.createdAt || 0);
                const remoteTime = new Date(remoteHatching.lastUpdated || remoteHatching.createdAt || 0);
                
                if (remoteTime > existingTime) {
                    currentHatchings[existingIndex] = remoteHatching;
                    hasChanges = true;
                }
            } else {
                currentHatchings.push(remoteHatching);
                hasChanges = true;
            }
        }

        // 변경사항이 있으면 저장
        if (hasChanges) {
            localStorage.setItem('animals', JSON.stringify(currentAnimals));
            localStorage.setItem('hatchings', JSON.stringify(currentHatchings));
            localStorage.setItem('lastSync', new Date().toISOString());
            
            this.updateUI();
            this.showNotification('다른 디바이스에서 데이터가 동기화되었습니다');
            
            console.log('✅ 데이터 병합 완료');
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
            statusEl.textContent = this.isOnline ? '실시간 동기화 중...' : '오프라인 모드';
        }
        
        if (stateEl) {
            stateEl.textContent = this.isOnline ? '온라인' : '오프라인';
        }
    }

    // 알림 표시
    showNotification(message) {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.sync-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
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
        console.log('🔄 강제 동기화 시작');
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
        return {
            isOnline: this.isOnline,
            deviceId: this.deviceId,
            dataCount: {
                animals: JSON.parse(localStorage.getItem('animals') || '[]').length,
                hatchings: JSON.parse(localStorage.getItem('hatchings') || '[]').length
            },
            lastSync: localStorage.getItem('lastSync')
        };
    }
}

// 전역 인스턴스 생성
window.simpleSync = new SimpleSync();

// 브로드캐스트 이벤트 리스너
window.addEventListener('dataSync', (event) => {
    console.log('📡 데이터 동기화 이벤트 수신:', event.detail);
    window.simpleSync.handleBroadcastMessage(event.detail);
});

// 로컬 스토리지 브로드캐스트 리스너
window.addEventListener('storage', (e) => {
    if (e.key === 'syncBroadcast') {
        try {
            const broadcastData = JSON.parse(e.newValue);
            console.log('📡 브로드캐스트 데이터 수신:', broadcastData);
            window.simpleSync.handleBroadcastMessage(broadcastData);
        } catch (error) {
            console.error('❌ 브로드캐스트 데이터 파싱 오류:', error);
        }
    }
});

console.log('✅ 간단한 실시간 동기화 시스템 로드 완료'); 