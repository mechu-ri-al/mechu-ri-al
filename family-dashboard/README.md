# 우리 가족의 하루 🌞 — 가족 대시보드

- 페이지: https://mechu-ri-al.github.io/mechu-ri-al/family-dashboard/
- 저장소: `family-dashboard/index.html` (검색 노출 방지를 위해 `noindex` 메타 포함)

## 가족 동기화 (2026-11-18 구축)

네 명(권좌실·김영택·김윤슬·김윤섭)의 폰에서 체크·추가·수정이 **실시간으로 함께 저장**됩니다.

| 구성 | 내용 |
| --- | --- |
| 저장 위치 | 구글 시트 `🏠 우리 가족 보드` → 숨김 탭 `🔄 대시보드_상태` (A2 = 상태 JSON, B2 = 마지막 저장 시각) |
| 서버 | Apps Script 웹앱 `가족 대시보드 동기화` (코드: `family-dashboard/apps-script.gs`) |
| 웹앱 URL | `https://script.google.com/macros/s/AKfycbwgXSToz5GzToRIMJ0cQWuq2ovbDi8pBHN32AvKfTEijzPbHX90H016CtOeCC32mF7IJA/exec` |
| 배포 설정 | 실행 주체: 나(whktlf@gmail.com) · 액세스: 모든 사용자 (가족이 로그인 없이 사용) |

### 동작 방식

- 페이지를 열 때 · 탭으로 돌아올 때 · 15초마다 서버 상태를 받아옵니다(`GET`).
- 체크·추가·수정·삭제 시 즉시 화면 반영 → `localStorage` 캐시 저장 → 서버에 저장(`POST`, `text/plain`으로 CORS preflight 회피).
- 상단 날짜 옆 배지: `가족 동기화 켜짐 ✓` / `저장 중...` / `오프라인 · 기기에만 저장`.
- 동시에 고칠 때는 마지막으로 저장한 내용이 남습니다(초 단위 충돌 잠금은 `LockService`).
- 날짜가 바뀌면 체크만 초기화되고 XP·할 일 목록은 그대로 유지됩니다.

### 코드를 고칠 때

1. https://script.google.com → `가족 대시보드 동기화` 프로젝트에서 코드 수정 → 저장
2. `배포` → `배포 관리` → 기존 배포의 연필(편집) → 버전 `새 버전` → `배포`
   (새 배포를 만들면 URL이 바뀌므로, 기존 배포를 편집하는 방식이 안전합니다.)
3. 웹앱 URL은 그대로 유지됩니다.
