import client from './client'

/** 카카오 로컬 키워드 검색 (서버 프록시). query 2글자 이상 권장 */
export const searchKakaoPlaces = (params) =>
  client.get('/places/kakao-search', { params })
