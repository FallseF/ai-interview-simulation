// Interview scenario configuration
export interface Scenario {
  facility: FacilityInfo;
  position: PositionInfo;
  candidate: CandidateProfile;
}

export interface FacilityInfo {
  name: string;
  type: string;
  location: string;
  capacity: number;
  description: string;
}

export interface PositionInfo {
  title: string;
  department: string;
  requirements: string[];
  benefits: string[];
  workHours: string;
  salary: string;
}

export interface CandidateProfile {
  name: string;
  age: number;
  nationality: string;
  japaneseLevel: string;
  experience: string;
  strengths: string[];
  weaknesses: string[];
}

// Default scenario
export const DEFAULT_SCENARIO: Scenario = {
  facility: {
    name: "さくら苑",
    type: "特別養護老人ホーム",
    location: "東京都",
    capacity: 100,
    description: "地域密着型の介護施設。家庭的な雰囲気を大切にしています。",
  },
  position: {
    title: "介護職員",
    department: "介護部",
    requirements: [
      "介護経験者優遇",
      "日本語でのコミュニケーション能力",
      "夜勤可能な方",
    ],
    benefits: [
      "社会保険完備",
      "交通費支給",
      "資格取得支援制度",
    ],
    workHours: "シフト制（早番・日勤・遅番・夜勤）",
    salary: "月給18万円〜25万円（経験による）",
  },
  candidate: {
    name: "グエン・ミン",
    age: 28,
    nationality: "ベトナム",
    japaneseLevel: "N4相当",
    experience: "母国の高齢者施設で介助補助2年",
    strengths: [
      "まじめで時間を守る",
      "体力がある",
      "学ぶ意欲が高い",
    ],
    weaknesses: [
      "日本語の敬語が苦手",
      "早口の日本語が聞き取れない",
      "記録や報連相に慣れていない",
    ],
  },
};

// Get scenario description for prompt context
export function getScenarioContext(scenario: Scenario = DEFAULT_SCENARIO): string {
  return `
【施設情報】
- 施設名: ${scenario.facility.name}
- 種類: ${scenario.facility.type}
- 所在地: ${scenario.facility.location}
- 定員: ${scenario.facility.capacity}名
- 特徴: ${scenario.facility.description}

【募集ポジション】
- 職種: ${scenario.position.title}
- 部署: ${scenario.position.department}
- 勤務時間: ${scenario.position.workHours}
- 給与: ${scenario.position.salary}

【応募者情報】
- 名前: ${scenario.candidate.name}
- 年齢: ${scenario.candidate.age}歳
- 国籍: ${scenario.candidate.nationality}
- 日本語: ${scenario.candidate.japaneseLevel}
- 経験: ${scenario.candidate.experience}
`.trim();
}
