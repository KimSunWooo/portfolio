import http from 'k6/http';
import { check, sleep } from 'k6';

// 테스트 시나리오 설정
export const options = {
    vus: 50,           // 50명의 가상 사용자(Virtual Users)가 동시에 접속
    duration: '30s',   // 30초 동안 지속적으로 API 호출
};

export default function () {
    // 스프링 부트 서버의 상품 조회 API 호출
    const res = http.get('http://localhost:8080/api/products');

    // 응답 상태가 200(정상)인지 체크
    check(res, {
        'is status 200': (r) => r.status === 200,
    });

    // 사용자의 실제 클릭 간격을 모사하기 위해 0.5초 대기
    sleep(0.5);
}