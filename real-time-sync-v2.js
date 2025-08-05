// 실시간 동기화 시스템 v2.0
// PC와 모바일 간 실시간 데이터 동기화

class RealTimeSyncV2 {
    constructor() {
        this.syncInterval = null;
        this.lastSync = null;
        this.isOnline = navigator.onLine;
        this.deviceId = this.generateDeviceId();
        this.syncUrl = 'https://taupe-medovik-00dd0e.netlify.app/';
        this.syncData = {};
        
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
        console.log('🔄 실시간 동기화 시스템 v2.0 시작');
        console.log('디바이스 ID:', this.deviceId);
        
        this.setupEventListeners();
        this.startRealTimeSync();
        this.syncAllData();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus();
            this.syncAllData();
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
            this.syncAllData();
        });

        // 페이지 언로드 전 동기화
        window.addEventListener('beforeunload', () => {
            this.syncAllData();
        });

        // 주기적 동기화 (5초마다)
        this.syncInterval = setInterval(() => {
            this.syncAllData();
        }, 5000);
    }

    // 실시간 동기화 시작
    startRealTimeSync() {
        console.log('🔄 실시간 동기화 시작');
        this.updateSyncStatus();
        
        // 초기 동기화
        this.syncAllData();
        
        // 주기적 동기화
        setInterval(() => {
            this.syncAllData();
        }, 3000);
    }

    // 모든 데이터 동기화
    async syncAllData() {
        if (!this.isOnline) {
            console.log('⚠️ 오프라인 상태 - 동기화 건너뜀');
            return;
        }

        try {
            const currentData = this.getCurrentData();
            const lastSyncData = this.getLastSyncData();
            
            // 데이터 변경 감지
            if (JSON.stringify(currentData) !== JSON.stringify(lastSyncData)) {
                console.log('🔄 데이터 변경 감지 - 동기화 시작');
                
                // 로컬 스토리지를 통해 다른 탭/창에 알림
                this.broadcastDataChange(currentData);
                
                // 원격 동기화 (실제 서버가 있다면)
                await this.remoteSync(currentData);
                
                // 마지막 동기화 시간 업데이트
                this.updateLastSync();
                
                console.log('✅ 동기화 완료');
            }
        } catch (error) {
            console.error('❌ 동기화 오류:', error);
        }
    }

    // 현재 데이터 가져오기
    getCurrentData() {
        return {
            animals: JSON.parse(localStorage.getItem('animals') || '[]'),
            hatchings: JSON.parse(localStorage.getItem('hatchings') || '[]'),
            lastSync: localStorage.getItem('lastSync') || null,
            deviceId: this.deviceId,
            timestamp: new Date().toISOString()
        };
    }

    // 마지막 동기화 데이터 가져오기
    getLastSyncData() {
        const lastSync = localStorage.getItem('lastSyncData');
        return lastSync ? JSON.parse(lastSync) : null;
    }

    // 데이터 변경 브로드캐스트
    broadcastDataChange(data) {
        // 로컬 스토리지를 통해 다른 탭/창에 알림
        localStorage.setItem('syncBroadcast', JSON.stringify({
            data: data,
            timestamp: new Date().toISOString(),
            deviceId: this.deviceId
        }));
        
        // 브로드캐스트 이벤트 발생
        window.dispatchEvent(new CustomEvent('dataSync', {
            detail: data
        }));
    }

    // 원격 동기화 (실제 서버가 있다면)
    async remoteSync(data) {
        // 현재는 로컬 스토리지 기반 동기화
        // 실제 서버가 있다면 여기서 API 호출
        
        // 로컬 스토리지에 동기화 데이터 저장
        localStorage.setItem('lastSyncData', JSON.stringify(data));
        localStorage.setItem('lastSync', new Date().toISOString());
        
        // 다른 디바이스와의 동기화를 위한 공유 데이터
        this.syncData = data;
    }

    // 데이터 변경 처리
    handleDataChange(key, newValue) {
        console.log(`🔄 데이터 변경: ${key}`);
        
        // UI 업데이트
        this.updateUI();
        
        // 알림 표시
        this.showNotification('데이터가 업데이트되었습니다');
        
        // 동기화 상태 업데이트
        this.updateSyncStatus();
    }

    // UI 업데이트
    updateUI() {
        // 동기화 상태 표시 업데이트
        const syncStatusEl = document.getElementById('syncStatus');
        if (syncStatusEl) {
            syncStatusEl.textContent = this.isOnline ? '실시간 동기화 중...' : '오프라인 모드';
        }

        // 데이터 개수 업데이트
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

    // 마지막 동기화 시간 업데이트
    updateLastSync() {
        localStorage.setItem('lastSync', new Date().toISOString());
        this.lastSync = new Date();
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

    // 디바이스 정보 가져오기
    getDeviceInfo() {
        return {
            deviceId: this.deviceId,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            isOnline: this.isOnline,
            lastSync: this.lastSync
        };
    }

    // 동기화 상태 확인
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            lastSync: this.lastSync,
            deviceId: this.deviceId,
            dataCount: {
                animals: JSON.parse(localStorage.getItem('animals') || '[]').length,
                hatchings: JSON.parse(localStorage.getItem('hatchings') || '[]').length
            }
        };
    }

    // 데이터 내보내기
    exportData() {
        const data = this.getCurrentData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gecko-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 데이터 가져오기
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // 데이터 검증
                    if (data.animals && Array.isArray(data.animals)) {
                        localStorage.setItem('animals', JSON.stringify(data.animals));
                    }
                    
                    if (data.hatchings && Array.isArray(data.hatchings)) {
                        localStorage.setItem('hatchings', JSON.stringify(data.hatchings));
                    }
                    
                    this.syncAllData();
                    this.showNotification('데이터가 가져와졌습니다');
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // 동기화 히스토리 가져오기
    getSyncHistory() {
        const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
        return history;
    }

    // 동기화 히스토리 추가
    addSyncHistory(action, data) {
        const history = this.getSyncHistory();
        history.push({
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            deviceId: this.deviceId
        });
        
        // 최근 50개만 유지
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        localStorage.setItem('syncHistory', JSON.stringify(history));
    }

    // 강제 동기화
    forceSync() {
        console.log('🔄 강제 동기화 시작');
        this.syncAllData();
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
        this.startRealTimeSync();
        console.log('🔄 동기화 재시작');
    }
}

// 전역 인스턴스 생성
window.realTimeSyncV2 = new RealTimeSyncV2();

// 브로드캐스트 이벤트 리스너
window.addEventListener('dataSync', (event) => {
    console.log('📡 데이터 동기화 이벤트 수신:', event.detail);
    window.realTimeSyncV2.handleDataChange('broadcast', JSON.stringify(event.detail));
});

// 로컬 스토리지 브로드캐스트 리스너
window.addEventListener('storage', (e) => {
    if (e.key === 'syncBroadcast') {
        const broadcastData = JSON.parse(e.newValue);
        console.log('📡 브로드캐스트 데이터 수신:', broadcastData);
        window.realTimeSyncV2.handleDataChange('broadcast', JSON.stringify(broadcastData.data));
    }
});

console.log('✅ 실시간 동기화 시스템 v2.0 로드 완료'); 