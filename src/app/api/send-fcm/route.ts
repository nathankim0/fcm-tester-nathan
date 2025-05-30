import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps, deleteApp } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';

// Firebase Admin SDK 초기화 상태 추적
let firebaseInitialized = false;
let initializationError: string | null = null;

async function initializeFirebase() {
  if (firebaseInitialized || getApps().length > 0) {
    console.log('✅ Firebase Admin SDK 이미 초기화됨');
    return true;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccount) {
    initializationError = 'FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.';
    console.error('❌', initializationError);
    return false;
  }

  try {
    // JSON 파싱 검증
    let serviceAccountObj;
    try {
      serviceAccountObj = JSON.parse(serviceAccount);
      console.log('✅ JSON 파싱 성공');
    } catch (parseError) {
      initializationError = `JSON 파싱 실패: ${parseError instanceof Error ? parseError.message : '알 수 없는 파싱 오류'}`;
      console.error('❌', initializationError);
      return false;
    }

    // 필수 필드 검증
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccountObj[field]);
    
    if (missingFields.length > 0) {
      initializationError = `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`;
      console.error('❌', initializationError);
      return false;
    }

    console.log('✅ 필수 필드 검증 완료');
    console.log('📋 Project ID:', serviceAccountObj.project_id);

    // private_key 개행 문자 처리
    if (serviceAccountObj.private_key) {
      serviceAccountObj.private_key = serviceAccountObj.private_key.replace(/\\n/g, '\n');
      console.log('✅ private_key 개행 문자 처리 완료');
    }

    // Firebase Admin 초기화 - 최신 모듈식 방식
    try {
      // 기존 앱이 있는지 확인하고 삭제
      const existingApps = getApps();
      if (existingApps.length > 0) {
        await Promise.all(existingApps.map(app => deleteApp(app)));
        console.log('🔄 기존 Firebase 앱 삭제 완료');
      }

      // 새로운 방식으로 Firebase 앱 초기화
      const app = initializeApp({
        credential: cert({
          projectId: serviceAccountObj.project_id,
          clientEmail: serviceAccountObj.client_email,
          privateKey: serviceAccountObj.private_key,
        }),
        projectId: serviceAccountObj.project_id,
      });
      
      console.log('✅ Firebase 앱 객체 생성:', app.name);
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK 초기화 성공');
      return true;
      
    } catch (initError) {
      console.error('❌ Firebase 앱 초기화 실패:', initError);
      initializationError = `Firebase 앱 초기화 실패: ${initError instanceof Error ? initError.message : '알 수 없는 초기화 오류'}`;
      return false;
    }
    
  } catch (error) {
    initializationError = `Firebase Admin 초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    console.error('❌', initializationError);
    return false;
  }
}

interface RequestBody {
  token: string;
  messageType: 'data-only' | 'notification-data';
  customTitle: string;
  customBody: string;
  customLink: string;
}

export async function POST(request: NextRequest) {
  try {
    // Firebase 초기화 확인
    if (!await initializeFirebase()) {
      return NextResponse.json(
        { 
          error: initializationError || 'Firebase 초기화 실패',
          hint: '.env.local 파일에 올바른 FIREBASE_SERVICE_ACCOUNT_KEY를 설정했는지 확인해주세요.'
        },
        { status: 500 }
      );
    }

    const body: RequestBody = await request.json();
    
    if (!body.token) {
      return NextResponse.json(
        { error: 'FCM 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('📨 FCM 메시지 전송 요청 받음');
    console.log('🎯 메시지 타입:', body.messageType);

    // 메시지 구성
    let message: Message;

    if (body.messageType === 'data-only') {
      message = {
        token: body.token,
        data: {
          title: body.customTitle,
          body: body.customBody,
          link: body.customLink,
        },
      };
    } else {
      message = {
        token: body.token,
        notification: {
          title: body.customTitle,
          body: body.customBody,
        },
        data: {
          link: body.customLink,
        },
      };
    }

    console.log('📋 전송할 메시지:', JSON.stringify(message, null, 2));

    // FCM 메시지 전송
    const messageId = await getMessaging().send(message);
    console.log('✅ FCM 메시지 전송 성공, ID:', messageId);

    return NextResponse.json({
      success: true,
      messageId,
      sentMessage: message,
    });

  } catch (error) {
    console.error('❌ FCM 전송 오류:', error);
    
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    let hint = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 일반적인 오류에 대한 힌트 제공
      if (error.message.includes('registration-token-not-registered')) {
        hint = 'FCM 토큰이 유효하지 않거나 만료되었습니다. 새로운 토큰을 발급받아 주세요.';
      } else if (error.message.includes('invalid-registration-token')) {
        hint = 'FCM 토큰 형식이 올바르지 않습니다.';
      } else if (error.message.includes('permission')) {
        hint = 'Firebase 프로젝트 권한을 확인해주세요.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(hint && { hint })
      },
      { status: 500 }
    );
  }
} 