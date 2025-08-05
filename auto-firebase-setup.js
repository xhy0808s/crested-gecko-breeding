// Firebase 자동 설정 스크립트
// Firebase 설정을 자동으로 확인하고 설정

class FirebaseAutoSetup {
    constructor() {
        this.checkFirebaseStatus();
    }

    checkFirebaseStatus() {
        // Firebase가 이미 설정되어 있는지 확인
        if (window.firebase && window.firebase.app) {
            console.log('Firebase가 이미 설정되어 있습니다.');
            return;
        }

        // localStorage에서 설정 확인
        const savedConfig = localStorage.getItem('firebaseConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.updateFirebaseConfig(config);
                console.log('저장된 Firebase 설정을 사용합니다.');
                return;
            } catch (error) {
                console.error('저장된 설정 오류:', error);
            }
        }

        // 설정이 없으면 선택적으로 안내
        setTimeout(() => {
            this.showSetupGuide();
        }, 2000);
    }

    showSetupGuide() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔥</div>
                    <h2 style="color: #03c75a; margin-bottom: 10px; font-size: 1.5rem;">데이터 동기화 설정</h2>
                    <p style="color: #666; font-size: 1rem;">PC와 모바일 간 실시간 동기화를 위한 설정입니다</p>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #333; margin-bottom: 15px; font-size: 1.2rem;">🎯 왜 필요한가요?</h3>
                    <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
                        <li><strong>실시간 동기화:</strong> PC에서 등록한 개체가 모바일에서 즉시 보임</li>
                        <li><strong>데이터 안전성:</strong> 기기 바뀌어도 데이터 안전</li>
                        <li><strong>오프라인 사용:</strong> 인터넷 없어도 계속 사용 가능</li>
                    </ul>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #333; margin-bottom: 15px; font-size: 1.2rem;">⚙️ 설정 방법</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border: 1px solid #e5e7eb;">
                        <ol style="color: #666; line-height: 1.6; padding-left: 20px;">
                            <li><strong>Firebase Console 접속:</strong> <a href="https://console.firebase.google.com/" target="_blank" style="color: #03c75a;">https://console.firebase.google.com/</a></li>
                            <li><strong>새 프로젝트 생성:</strong> "crested-gecko-breeding"</li>
                            <li><strong>Firestore Database 활성화</strong></li>
                            <li><strong>웹 앱 등록</strong></li>
                            <li><strong>설정 정보 복사 후 아래 입력</strong></li>
                        </ol>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <h3 style="color: #333; margin-bottom: 15px; font-size: 1.2rem;">📝 Firebase 설정 정보</h3>
                    <div style="display: grid; gap: 15px;">
                        <input type="text" id="apiKey" placeholder="API Key" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        <input type="text" id="authDomain" placeholder="Auth Domain" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        <input type="text" id="projectId" placeholder="Project ID" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        <input type="text" id="storageBucket" placeholder="Storage Bucket" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        <input type="text" id="messagingSenderId" placeholder="Messaging Sender ID" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        <input type="text" id="appId" placeholder="App ID" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                    </div>
                </div>

                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="saveConfig" style="
                        background: #03c75a;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">설정 저장</button>
                    <button id="skipSetup" style="
                        background: #f8f9fa;
                        color: #666;
                        border: 1px solid #e5e7eb;
                        padding: 12px 25px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">나중에 설정</button>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <p style="color: #999; font-size: 0.9rem;">
                        💡 나중에 설정해도 로컬에서 계속 사용 가능합니다
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 이벤트 리스너
        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfig();
            document.body.removeChild(modal);
        });

        document.getElementById('skipSetup').addEventListener('click', () => {
            document.body.removeChild(modal);
            console.log('Firebase 설정을 건너뜁니다.');
        });

        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    saveConfig() {
        const config = {
            apiKey: document.getElementById('apiKey').value,
            authDomain: document.getElementById('authDomain').value,
            projectId: document.getElementById('projectId').value,
            storageBucket: document.getElementById('storageBucket').value,
            messagingSenderId: document.getElementById('messagingSenderId').value,
            appId: document.getElementById('appId').value
        };

        // 필수 필드 확인
        if (!config.apiKey || !config.authDomain || !config.projectId) {
            alert('필수 설정 정보를 입력해주세요.');
            return;
        }

        // localStorage에 저장
        localStorage.setItem('firebaseConfig', JSON.stringify(config));
        
        // Firebase 설정 업데이트
        this.updateFirebaseConfig(config);
        
        alert('Firebase 설정이 저장되었습니다! 이제 PC와 모바일 간 실시간 동기화가 가능합니다.');
    }

    updateFirebaseConfig(config) {
        // Firebase SDK 로드
        if (!window.firebase) {
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
            script.onload = () => {
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
                authScript.onload = () => {
                    const firestoreScript = document.createElement('script');
                    firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
                    firestoreScript.onload = () => {
                        this.initializeFirebase(config);
                    };
                    document.head.appendChild(firestoreScript);
                };
                document.head.appendChild(authScript);
            };
            document.head.appendChild(script);
        } else {
            this.initializeFirebase(config);
        }
    }

    initializeFirebase(config) {
        try {
            // Firebase 초기화
            window.firebaseApp = window.firebase.initializeApp(config);
            window.db = window.firebase.firestore();
            window.auth = window.firebase.auth();

            // 서버 동기화 시스템 시작
            if (typeof window.ServerSync !== 'undefined') {
                window.serverSync = new window.ServerSync();
            }

            console.log('Firebase가 성공적으로 초기화되었습니다.');
        } catch (error) {
            console.error('Firebase 초기화 오류:', error);
        }
    }
}

// 자동 설정 시작
window.firebaseSetup = new FirebaseAutoSetup(); 