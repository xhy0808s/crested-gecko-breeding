// 플랜 선택 및 결제 시스템
class PaymentSystem {
    constructor() {
        this.plans = {
            free: {
                name: 'Free',
                price: 0,
                features: ['최대 10개체', 'F1 세대만', '기본 혈통 트리', '모프 계산기 (2개 조합)', '광고 포함'],
                limits: {
                    animals: 10,
                    generations: ['f1'],
                    imagesPerAnimal: 1,
                    morphCombinations: 2,
                    pdfExport: false,
                    dataExport: false,
                    ads: true,
                    activityLog: false,
                    customerFields: false
                }
            },
            starter: {
                name: 'Starter',
                price: 9900,
                features: ['최대 50개체', 'F1~F2 세대', 'PDF 리포트', '광고 제거', 'Excel 내보내기'],
                limits: {
                    animals: 50,
                    generations: ['f1', 'f2'],
                    imagesPerAnimal: 3,
                    morphCombinations: -1, // 무제한
                    pdfExport: true,
                    dataExport: 'excel',
                    ads: false,
                    activityLog: false,
                    customerFields: false
                }
            },
            pro: {
                name: 'Pro',
                price: 29000,
                features: ['무제한 개체', 'F5까지 세대', '활동 로그', '입양서 자동 출력', '고객 관리'],
                limits: {
                    animals: -1, // 무제한
                    generations: ['f1', 'f2', 'f3', 'f4', 'f5'],
                    imagesPerAnimal: 5,
                    morphCombinations: -1,
                    pdfExport: true,
                    dataExport: 'all',
                    ads: false,
                    activityLog: true,
                    customerFields: true
                }
            },
            enterprise: {
                name: 'Enterprise',
                price: 100000,
                features: ['5,000~10,000개체', '다중 계정', 'API 연동', '바코드/RFID', '맞춤형 지원'],
                limits: {
                    animals: 10000,
                    generations: ['f1', 'f2', 'f3', 'f4', 'f5'],
                    imagesPerAnimal: -1,
                    morphCombinations: -1,
                    pdfExport: true,
                    dataExport: 'all',
                    ads: false,
                    activityLog: true,
                    customerFields: true,
                    multiUser: true,
                    apiAccess: true
                }
            },
            lifetime: {
                name: 'Lifetime Pro',
                price: 129000,
                features: ['Pro 기능 평생 이용', '평생 업데이트', '다중 기기', '수동 백업 지원'],
                limits: {
                    animals: -1,
                    generations: ['f1', 'f2', 'f3', 'f4', 'f5'],
                    imagesPerAnimal: 5,
                    morphCombinations: -1,
                    pdfExport: true,
                    dataExport: 'all',
                    ads: false,
                    activityLog: true,
                    customerFields: true
                }
            },
            admin: {
                name: '관리자',
                price: 0,
                features: ['모든 기능 무제한', '사용자 관리', '시스템 설정', '통계 대시보드', '데이터 백업'],
                limits: {
                    animals: -1,
                    generations: ['f1', 'f2', 'f3', 'f4', 'f5'],
                    imagesPerAnimal: -1,
                    morphCombinations: -1,
                    pdfExport: true,
                    dataExport: 'all',
                    ads: false,
                    activityLog: true,
                    customerFields: true,
                    adminAccess: true
                }
            }
        };
    }
    
    // 플랜 선택 처리
    selectPlan(planType) {
        const plan = this.plans[planType];
        if (!plan) {
            alert('잘못된 플랜입니다.');
            return;
        }
        
        if (planType === 'free') {
            this.activateFreePlan();
        } else {
            this.processPayment(planType, plan);
        }
    }
    
    // 무료 플랜 활성화
    activateFreePlan() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            currentUser.plan = 'free';
            currentUser.planActivatedAt = new Date().toISOString();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // 사용자 목록 업데이트
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[currentUser.email]) {
                users[currentUser.email].plan = 'free';
                users[currentUser.email].planActivatedAt = new Date().toISOString();
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            alert('Free 플랜이 활성화되었습니다!');
            window.location.href = 'index.html';
        } else {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
        }
    }
    
    // 결제 처리 (시뮬레이션)
    processPayment(planType, plan) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
            return;
        }
        
        // 결제 확인 다이얼로그
        const confirmPayment = confirm(
            `${plan.name} 플랜 (₩${plan.price.toLocaleString()}/월)을 구독하시겠습니까?\n\n` +
            `주요 기능:\n${plan.features.join('\n')}\n\n` +
            `* 실제 결제 시스템과 연동하여 처리됩니다.`
        );
        
        if (confirmPayment) {
            // 결제 시뮬레이션
            this.simulatePayment(planType, plan);
        }
    }
    
    // 결제 시뮬레이션
    simulatePayment(planType, plan) {
        // 로딩 표시
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '결제 처리 중...';
        button.disabled = true;
        
        // 결제 처리 시뮬레이션 (3초)
        setTimeout(() => {
            // 성공적으로 결제 완료
            const currentUser = this.getCurrentUser();
            currentUser.plan = planType;
            currentUser.planActivatedAt = new Date().toISOString();
            currentUser.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30일 후
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // 사용자 목록 업데이트
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[currentUser.email]) {
                users[currentUser.email].plan = planType;
                users[currentUser.email].planActivatedAt = new Date().toISOString();
                users[currentUser.email].subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            button.textContent = '결제 완료!';
            button.style.background = '#28a745';
            
            setTimeout(() => {
                alert(`${plan.name} 플랜이 성공적으로 활성화되었습니다!\n\n구독 기간: 30일\n다음 결제일: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
                window.location.href = 'index.html';
            }, 1000);
            
        }, 3000);
    }
    
    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    }
    
    // 플랜 제한 확인
    checkPlanLimits(planType, feature) {
        const plan = this.plans[planType];
        if (!plan) return false;
        
        switch (feature) {
            case 'animals':
                return plan.limits.animals === -1 || this.getAnimalCount() < plan.limits.animals;
            case 'imageSize':
                return plan.limits.imageSize === -1;
            case 'storage':
                return plan.limits.storage === -1;
            default:
                return false;
        }
    }
    
    // 현재 개체 수 가져오기
    getAnimalCount() {
        const allAnimals = this.getAllAnimals();
        return allAnimals.length;
    }
    
    // 모든 개체 가져오기
    getAllAnimals() {
        const data = JSON.parse(localStorage.getItem('geckoBreedingData') || '{}');
        const allAnimals = [];
        
        ['f1', 'f2', 'f3', 'f4', 'f5'].forEach(generation => {
            if (data[generation]) {
                allAnimals.push(...data[generation]);
            }
        });
        
        return allAnimals;
    }
}

// 전역 결제 시스템 인스턴스
const paymentSystem = new PaymentSystem();

// 플랜 선택 함수 (전역으로 노출)
function selectPlan(planType) {
    paymentSystem.selectPlan(planType);
}

// 탭 전환 함수
function showTab(tabName) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 모든 탭 콘텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// 기업 문의 함수
function contactEnterprise() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px; color: var(--enterprise-color);">
                <i class="fas fa-building"></i> Enterprise 문의
            </h3>
            <p style="margin-bottom: 20px; color: #666;">
                대형 브리더나 기업을 위한 맞춤형 솔루션을 제공합니다.
            </p>
            <div style="margin-bottom: 20px;">
                <h4>Enterprise 혜택:</h4>
                <ul style="margin-left: 20px; color: #555;">
                    <li>무제한 사용자 및 개체 관리</li>
                    <li>전용 서버 및 데이터베이스</li>
                    <li>맞춤형 기능 개발</li>
                    <li>24/7 전담 지원</li>
                    <li>SLA 보장</li>
                </ul>
            </div>
            <div style="text-align: center;">
                <p style="margin-bottom: 15px; font-weight: 600;">
                    문의: <a href="mailto:enterprise@geckobreeding.com" style="color: var(--enterprise-color);">enterprise@geckobreeding.com</a>
                </p>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-enterprise">
                    닫기
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 페이지 로드 시 현재 사용자 플랜 표시
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = paymentSystem.getCurrentUser();
    if (currentUser) {
        // 현재 플랜 정보 표시
        const planInfo = document.createElement('div');
        planInfo.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        planInfo.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 5px;">현재 플랜: ${currentUser.plan || 'Free'}</div>
            <div style="font-size: 0.9rem; color: #666;">
                ${currentUser.plan === 'free' ? '무료 플랜' : '프리미엄 플랜'}
            </div>
        `;
        document.body.appendChild(planInfo);
    }
}); 