// Firebase 자동 설정 스크립트
// Firebase 설정을 자동으로 확인하고 설정

class FirebaseAutoSetup {
    constructor() {
        this.config = null;
        this.isConfigured = false;
        
        this.init();
    }

    // 초기화
    init() {
        console.log('🔧 Firebase 자동 설정 시작');
        this.checkFirebaseConfig();
        this.setupFirebase();
    }

    // Firebase 설정 확인
    checkFirebaseConfig() {
        // 현재 설정 확인
        const currentConfig = this.getCurrentConfig();
        
        if (currentConfig && currentConfig.apiKey !== 'AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
            console.log('✅ Firebase 설정이 이미 구성되어 있습니다');
            this.isConfigured = true;
            return;
        }

        console.log('⚠️ Firebase 설정이 필요합니다');
        this.showSetupGuide();
    }

    // 현재 설정 가져오기
    getCurrentConfig() {
        try {
            // firebase-config.js에서 설정 가져오기
            if (window.firebase && window.firebase.apps.length > 0) {
                return window.firebase.apps[0].options;
            }
        } catch (error) {
            console.error('설정 확인 오류:', error);
        }
        return null;
    }

    // 설정 가이드 표시
    showSetupGuide() {
        const guide = document.createElement('div');
        guide.className = 'firebase-setup-guide';
        guide.innerHTML = `
            <div class="setup-overlay">
                <div class="setup-modal">
                    <h2>🔥 Firebase 설정 필요</h2>
                    <p>서버 기반 동기화를 위해 Firebase 설정이 필요합니다.</p>
                    
                    <div class="setup-steps">
                        <h3>설정 단계:</h3>
                        <ol>
                            <li>Firebase Console 접속: <a href="https://console.firebase.google.com/" target="_blank">https://console.firebase.google.com/</a></li>
                            <li>새 프로젝트 생성: <strong>crested-gecko-breeding</strong></li>
                            <li>Firestore Database 활성화</li>
                            <li>웹 앱 등록</li>
                            <li>설정 정보 복사 후 아래 입력</li>
                        </ol>
                    </div>

                    <div class="config-form">
                        <h3>Firebase 설정 정보 입력:</h3>
                        <div class="form-group">
                            <label>API Key:</label>
                            <input type="text" id="apiKey" placeholder="AIzaSy...">
                        </div>
                        <div class="form-group">
                            <label>Auth Domain:</label>
                            <input type="text" id="authDomain" placeholder="crested-gecko-breeding.firebaseapp.com">
                        </div>
                        <div class="form-group">
                            <label>Project ID:</label>
                            <input type="text" id="projectId" placeholder="crested-gecko-breeding">
                        </div>
                        <div class="form-group">
                            <label>Storage Bucket:</label>
                            <input type="text" id="storageBucket" placeholder="crested-gecko-breeding.appspot.com">
                        </div>
                        <div class="form-group">
                            <label>Messaging Sender ID:</label>
                            <input type="text" id="messagingSenderId" placeholder="123456789012">
                        </div>
                        <div class="form-group">
                            <label>App ID:</label>
                            <input type="text" id="appId" placeholder="1:123456789012:web:...">
                        </div>
                    </div>

                    <div class="setup-buttons">
                        <button onclick="window.firebaseSetup.saveConfig()" class="btn btn-primary">설정 저장</button>
                        <button onclick="window.firebaseSetup.skipSetup()" class="btn btn-secondary">나중에 설정</button>
                    </div>
                </div>
            </div>
        `;

        // 스타일 적용
        guide.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const modal = guide.querySelector('.setup-modal');
        modal.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        // 폼 스타일
        const formGroups = guide.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.cssText = `
                margin: 15px 0;
            `;
            
            const label = group.querySelector('label');
            label.style.cssText = `
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
            `;
            
            const input = group.querySelector('input');
            input.style.cssText = `
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
            `;
        });

        // 버튼 스타일
        const buttons = guide.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.style.cssText = `
                padding: 10px 20px;
                margin: 5px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
        });

        const primaryBtn = guide.querySelector('.btn-primary');
        primaryBtn.style.background = '#4299e1';
        primaryBtn.style.color = 'white';

        const secondaryBtn = guide.querySelector('.btn-secondary');
        secondaryBtn.style.background = '#718096';
        secondaryBtn.style.color = 'white';

        document.body.appendChild(guide);
    }

    // 설정 저장
    saveConfig() {
        const config = {
            apiKey: document.getElementById('apiKey').value,
            authDomain: document.getElementById('authDomain').value,
            projectId: document.getElementById('projectId').value,
            storageBucket: document.getElementById('storageBucket').value,
            messagingSenderId: document.getElementById('messagingSenderId').value,
            appId: document.getElementById('appId').value
        };

        // 설정 검증
        if (!this.validateConfig(config)) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        // 설정 저장
        localStorage.setItem('firebaseConfig', JSON.stringify(config));
        
        // Firebase 재초기화
        this.updateFirebaseConfig(config);
        
        // 가이드 제거
        this.removeSetupGuide();
        
        console.log('✅ Firebase 설정이 저장되었습니다');
        this.showSuccessMessage();
    }

    // 설정 검증
    validateConfig(config) {
        return config.apiKey && 
               config.authDomain && 
               config.projectId && 
               config.storageBucket && 
               config.messagingSenderId && 
               config.appId;
    }

    // Firebase 설정 업데이트
    updateFirebaseConfig(config) {
        try {
            // 기존 Firebase 앱 제거
            if (window.firebase && window.firebase.apps.length > 0) {
                window.firebase.apps.forEach(app => app.delete());
            }

            // 새 설정으로 초기화
            window.firebase.initializeApp(config);
            
            // 서버 동기화 시스템 재시작
            if (window.serverSync) {
                window.serverSync.restartSync();
            }

            this.isConfigured = true;
            console.log('✅ Firebase 설정이 업데이트되었습니다');
            
        } catch (error) {
            console.error('❌ Firebase 설정 업데이트 오류:', error);
            alert('Firebase 설정 업데이트 중 오류가 발생했습니다.');
        }
    }

    // 설정 가이드 제거
    removeSetupGuide() {
        const guide = document.querySelector('.firebase-setup-guide');
        if (guide) {
            guide.remove();
        }
    }

    // 성공 메시지 표시
    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #38a169;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10001;
                animation: slideInRight 0.5s ease-out;
            ">
                ✅ Firebase 설정이 완료되었습니다!
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // 설정 건너뛰기
    skipSetup() {
        this.removeSetupGuide();
        console.log('⚠️ Firebase 설정을 건너뛰었습니다. 로컬 동기화 모드로 작동합니다.');
    }

    // Firebase 설정
    setupFirebase() {
        // 저장된 설정 확인
        const savedConfig = localStorage.getItem('firebaseConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.updateFirebaseConfig(config);
        }
    }

    // 설정 상태 확인
    getSetupStatus() {
        return {
            isConfigured: this.isConfigured,
            hasSavedConfig: !!localStorage.getItem('firebaseConfig'),
            firebaseConnected: !!(window.firebase && window.firebase.apps.length > 0)
        };
    }

    // 설정 테스트
    testConnection() {
        if (!this.isConfigured) {
            console.log('⚠️ Firebase가 설정되지 않았습니다');
            return false;
        }

        try {
            const db = window.firebase.firestore();
            console.log('✅ Firebase 연결 테스트 성공');
            return true;
        } catch (error) {
            console.error('❌ Firebase 연결 테스트 실패:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.firebaseSetup = new FirebaseAutoSetup();

// 자동 설정 확인
window.addEventListener('load', () => {
    setTimeout(() => {
        const status = window.firebaseSetup.getSetupStatus();
        console.log('Firebase 설정 상태:', status);
        
        if (!status.isConfigured) {
            console.log('🔧 Firebase 설정이 필요합니다');
        }
    }, 2000);
});

console.log('✅ Firebase 자동 설정 스크립트 로드 완료'); 