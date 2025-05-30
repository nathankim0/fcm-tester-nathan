# FCM 테스트 서비스

Firebase Cloud Messaging (FCM) 푸시 알림을 쉽게 테스트할 수 있는 웹 서비스입니다.

## 주요 기능

- 🔑 FCM 토큰 입력
- 📱 두 가지 메시지 타입 지원
  - **Data만 사용**: notification 필드 제거, data 필드만 전송
  - **Notification + Data**: 표준 FCM 구조 사용
- 👀 실시간 메시지 미리보기
- ✅ Firebase 연결 상태 자동 확인
- ✅ 전송 결과 확인

## 설정 방법

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. 프로젝트 설정 > 서비스 계정으로 이동
3. "새 비공개 키 생성" 클릭하여 JSON 파일 다운로드

### 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

**중요**: 다운로드받은 JSON 파일의 전체 내용을 한 줄로 복사해서 넣어주세요.

### 3. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

## 사용 방법

### 1. FCM 토큰 받기

모바일 앱이나 웹에서 FCM 토큰을 받는 방법:

**웹 (JavaScript):**
```javascript
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging();
getToken(messaging, { vapidKey: 'your-vapid-key' }).then((token) => {
  console.log('FCM Token:', token);
});
```

**Android:**
```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (!task.isSuccessful) {
        Log.w(TAG, "토큰 가져오기 실패", task.exception)
        return@addOnCompleteListener
    }
    val token = task.result
    Log.d(TAG, "FCM Token: $token")
}
```

### 2. 메시지 타입 선택

#### Data만 사용 (추천)
```json
{
  "data": {
    "title": "새로운 메시지가 도착했습니다",
    "body": "확인해보세요",
    "link": "https://example.com"
  }
}
```

#### Notification + Data
```json
{
  "notification": {
    "title": "새로운 메시지가 도착했습니다",
    "body": "확인해보세요"
  },
  "data": {
    "link": "https://example.com"
  }
}
```

## 문제해결

### 토큰 오류
- FCM 토큰이 만료되었거나 잘못된 경우
- 앱이 삭제되거나 재설치된 경우

### Firebase 설정 오류
- `FIREBASE_SERVICE_ACCOUNT_KEY` 환경변수 확인
- JSON 형식이 올바른지 확인
- Firebase 프로젝트에서 FCM이 활성화되어 있는지 확인

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **FCM**: Firebase Admin SDK

## 개발자

Made by **Nathan** (jinyeob07@gmail.com)

## 라이선스

MIT
