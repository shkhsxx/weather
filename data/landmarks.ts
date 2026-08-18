export type Region =
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania";

export interface Landmark {
  id: string;
  nameKo: string;
  nameEn: string;
  city: string;
  country: string;
  countryCode: string;
  region: Region;
  lat: number;
  lon: number;
}

export const LANDMARKS: Landmark[] = [
  { id: "gyeongbokgung", nameKo: "경복궁", nameEn: "Gyeongbokgung Palace", city: "서울", country: "대한민국", countryCode: "KR", region: "asia", lat: 37.5796, lon: 126.977 },
  { id: "tokyo-tower", nameKo: "도쿄 타워", nameEn: "Tokyo Tower", city: "도쿄", country: "일본", countryCode: "JP", region: "asia", lat: 35.6586, lon: 139.7454 },
  { id: "great-wall", nameKo: "만리장성 (팔달령)", nameEn: "Great Wall (Badaling)", city: "베이징", country: "중국", countryCode: "CN", region: "asia", lat: 40.4319, lon: 116.5704 },
  { id: "taj-mahal", nameKo: "타지마할", nameEn: "Taj Mahal", city: "아그라", country: "인도", countryCode: "IN", region: "asia", lat: 27.1751, lon: 78.0421 },
  { id: "marina-bay-sands", nameKo: "마리나 베이 샌즈", nameEn: "Marina Bay Sands", city: "싱가포르", country: "싱가포르", countryCode: "SG", region: "asia", lat: 1.2834, lon: 103.8607 },
  { id: "burj-khalifa", nameKo: "부르즈 할리파", nameEn: "Burj Khalifa", city: "두바이", country: "UAE", countryCode: "AE", region: "asia", lat: 25.1972, lon: 55.2744 },
  { id: "angkor-wat", nameKo: "앙코르 와트", nameEn: "Angkor Wat", city: "시엠레아프", country: "캄보디아", countryCode: "KH", region: "asia", lat: 13.4125, lon: 103.867 },
  { id: "eiffel-tower", nameKo: "에펠탑", nameEn: "Eiffel Tower", city: "파리", country: "프랑스", countryCode: "FR", region: "europe", lat: 48.8584, lon: 2.2945 },
  { id: "colosseum", nameKo: "콜로세움", nameEn: "Colosseum", city: "로마", country: "이탈리아", countryCode: "IT", region: "europe", lat: 41.8902, lon: 12.4922 },
  { id: "sagrada-familia", nameKo: "사그라다 파밀리아", nameEn: "Sagrada Familia", city: "바르셀로나", country: "스페인", countryCode: "ES", region: "europe", lat: 41.4036, lon: 2.1744 },
  { id: "tower-bridge", nameKo: "타워 브리지", nameEn: "Tower Bridge", city: "런던", country: "영국", countryCode: "GB", region: "europe", lat: 51.5055, lon: -0.0754 },
  { id: "oia", nameKo: "이아 마을", nameEn: "Oia", city: "산토리니", country: "그리스", countryCode: "GR", region: "europe", lat: 36.4618, lon: 25.3753 },
  { id: "tromso", nameKo: "트롬쇠", nameEn: "Tromsø", city: "트롬쇠", country: "노르웨이", countryCode: "NO", region: "europe", lat: 69.6492, lon: 18.9553 },
  { id: "hagia-sophia", nameKo: "하기아 소피아", nameEn: "Hagia Sophia", city: "이스탄불", country: "튀르키예", countryCode: "TR", region: "europe", lat: 41.0086, lon: 28.9802 },
  { id: "statue-of-liberty", nameKo: "자유의 여신상", nameEn: "Statue of Liberty", city: "뉴욕", country: "미국", countryCode: "US", region: "north-america", lat: 40.6892, lon: -74.0445 },
  { id: "grand-canyon", nameKo: "그랜드 캐니언", nameEn: "Grand Canyon", city: "애리조나", country: "미국", countryCode: "US", region: "north-america", lat: 36.1069, lon: -112.1129 },
  { id: "golden-gate", nameKo: "금문교", nameEn: "Golden Gate Bridge", city: "샌프란시스코", country: "미국", countryCode: "US", region: "north-america", lat: 37.8199, lon: -122.4783 },
  { id: "chichen-itza", nameKo: "치첸이트사", nameEn: "Chichen Itza", city: "유카탄", country: "멕시코", countryCode: "MX", region: "north-america", lat: 20.6843, lon: -88.5678 },
  { id: "machu-picchu", nameKo: "마추픽추", nameEn: "Machu Picchu", city: "쿠스코", country: "페루", countryCode: "PE", region: "south-america", lat: -13.1631, lon: -72.545 },
  { id: "christ-the-redeemer", nameKo: "그리스도상", nameEn: "Christ the Redeemer", city: "리우데자네이루", country: "브라질", countryCode: "BR", region: "south-america", lat: -22.9519, lon: -43.2105 },
  { id: "iguazu-falls", nameKo: "이구아수 폭포", nameEn: "Iguazu Falls", city: "미시오네스", country: "아르헨티나", countryCode: "AR", region: "south-america", lat: -25.6953, lon: -54.4367 },
  { id: "giza-pyramids", nameKo: "기자 피라미드", nameEn: "Pyramids of Giza", city: "기자", country: "이집트", countryCode: "EG", region: "africa", lat: 29.9792, lon: 31.1342 },
  { id: "victoria-falls", nameKo: "빅토리아 폭포", nameEn: "Victoria Falls", city: "리빙스턴", country: "잠비아", countryCode: "ZM", region: "africa", lat: -17.9243, lon: 25.8572 },
  { id: "table-mountain", nameKo: "테이블 마운틴", nameEn: "Table Mountain", city: "케이프타운", country: "남아프리카공화국", countryCode: "ZA", region: "africa", lat: -33.9628, lon: 18.4098 },
  { id: "sydney-opera-house", nameKo: "시드니 오페라 하우스", nameEn: "Sydney Opera House", city: "시드니", country: "호주", countryCode: "AU", region: "oceania", lat: -33.8568, lon: 151.2153 },
  { id: "milford-sound", nameKo: "밀포드 사운드", nameEn: "Milford Sound", city: "피오르드랜드", country: "뉴질랜드", countryCode: "NZ", region: "oceania", lat: -44.6414, lon: 167.8974 },
];

export const REGION_LABELS: Record<Region, string> = {
  asia: "아시아",
  europe: "유럽",
  "north-america": "북미",
  "south-america": "남미",
  africa: "아프리카",
  oceania: "오세아니아",
};
