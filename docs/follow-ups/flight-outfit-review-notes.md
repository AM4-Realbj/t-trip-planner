# flight-outfit 코드 리뷰 메모

- `Outfit.outerShort`(features/flight-outfit/types.ts)는 값만 채우고 화면에서 쓰지 않는다. 쓰지 않기로 하면 필드와 outfit.ts의 `short` 값을 지운다.
- `FlightResult`(components/flight-result.tsx)가 `invalid` 상태를 조회 실패 안내로 묶는다. page.tsx가 먼저 검증해 도달하지 않지만, 검증 기준이 어긋나면 입력 오류가 연결 문제로 보인다.
- `lookupFlightOutfit`(features/flight-outfit/lookup.ts)는 `flights`가 빈 배열이면 검증을 통과해 `fetchFlight(undefined, …)`를 호출한다. page.tsx가 항상 한 칸을 넣어 막지만, 공개 함수에서 "편명을 입력해 주세요."로 막는 편이 안전하다.
