# Message Time

SillyTavern 메시지마다 보낸 시간을 표시하고, 날짜가 바뀌는 곳에 날짜 구분선을 넣는 UI 확장입니다. 시간은 `bubblechat` 모드에서는 말풍선 옆에, 그 밖의 테마에서는 메시지 아래에 `오후 3:07`처럼 작게 나옵니다.

특정 테마 전용이 아니며 SillyTavern의 SmartTheme 색상 변수(`--SmartThemeUnderlineColor`)를 사용하므로, 지금 쓰는 테마에 맞춰 글자 색이 바뀝니다.

## 기능

- 메시지마다 보낸 시간 표시(스와이프마다 그 답장의 시간)
- `bubblechat` 모드: 캐릭터 메시지는 말풍선 오른쪽, 내 메시지는 왼쪽에 표시하고 이름 옆 기본 타임스탬프는 숨김
- 일반 테마: 메시지 아래에 표시
- 날짜 구분선: 그날의 첫 메시지 위에 `2026년 10월 11일`처럼 표시
- AI에서 숨긴 일반 메시지에도 같은 형식 적용(실제 시스템 알림은 제외)

## 설치

SillyTavern → 확장(Extensions) → **Install extension**에 이 저장소 주소를 넣습니다.

```text
https://github.com/STLoft/Message-Time
```

설치 후 페이지를 새로 고칩니다.
