import { NextResponse } from 'next/server';

export async function GET() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccount) {
    return NextResponse.json({
      status: 'error',
      message: 'FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.',
      hint: '.env.local 파일을 생성하고 Firebase 서비스 계정 키를 설정해주세요.'
    });
  }

  try {
    const serviceAccountObj = JSON.parse(serviceAccount);
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccountObj[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
        hint: 'Firebase Console에서 다운로드한 서비스 계정 키 JSON 파일의 전체 내용을 확인해주세요.'
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Firebase 설정이 올바릅니다.',
      projectId: serviceAccountObj.project_id,
      serviceAccountEmail: serviceAccountObj.client_email
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'JSON 파싱 실패',
      hint: 'FIREBASE_SERVICE_ACCOUNT_KEY의 JSON 형식이 올바른지 확인해주세요. 줄바꿈이 제거되어야 합니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
} 