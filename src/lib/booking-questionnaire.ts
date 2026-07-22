export type QuestionType = "text" | "textarea" | "select" | "address" | "time" | "number";

export type Question = {
  key: string;
  label: string;
  type: QuestionType;
  options?: readonly string[];
  placeholder?: string;
  min?: number;
  max?: number;
};

export const WEDDING_QUESTIONS: Question[] = [
  { key: "venue_ceremony", label: "Where is the ceremony taking place?", type: "address", placeholder: "Search for a venue or address…" },
  { key: "venue_reception", label: "Where is the reception? (if different from ceremony)", type: "address", placeholder: "Search for a venue or address…" },
  { key: "ceremony_time", label: "What time does the ceremony start?", type: "time" },
  { key: "guest_count", label: "How many guests are you expecting?", type: "number", min: 1, max: 2000 },
  { key: "hours_coverage", label: "How many hours of coverage are you looking for?", type: "number", min: 1, max: 24 },
  { key: "first_look", label: "Are you planning a first look?", type: "select", options: ["Yes", "No", "Undecided"] },
  { key: "vibe", label: "What's the overall vibe or aesthetic of your wedding?", type: "textarea", placeholder: "e.g. romantic, bohemian, moody, classic, timeless…" },
  { key: "priority_moments", label: "Any specific moments or people you want prioritized?", type: "textarea" },
  { key: "formal_portraits", label: "How many family portrait groupings are you planning? Any large groups to know about?", type: "textarea" },
  { key: "film_experience", label: "Have you worked with a film photographer before?", type: "select", options: ["Yes", "No"] },
  { key: "inspiration", label: "Do you have a Pinterest board or inspiration images? Drop a link or describe your vision.", type: "textarea" },
  { key: "additional", label: "Anything else important Lucy should know about your day?", type: "textarea" },
  { key: "questions_for_lucy", label: "Any questions for Lucy?", type: "textarea" },
];

export const GENERAL_QUESTIONS: Question[] = [
  { key: "occasion", label: "What's the occasion for this shoot?", type: "text", placeholder: "e.g. anniversary, family portraits, personal branding, graduation…" },
  { key: "location", label: "Do you have a location in mind? If so, where?", type: "address", placeholder: "Search for a location or address…" },
  { key: "indoor_outdoor", label: "Indoor or outdoor preference?", type: "select", options: ["Outdoor", "Indoor", "No preference"] },
  { key: "group_size", label: "How many people will be in the shoot?", type: "text" },
  { key: "vibe", label: "What mood or vibe are you going for?", type: "textarea", placeholder: "e.g. candid and natural, editorial, romantic, moody…" },
  { key: "must_have_shots", label: "Any specific shots you definitely want captured?", type: "textarea" },
  { key: "film_experience", label: "Have you worked with a film photographer before?", type: "select", options: ["Yes", "No"] },
  { key: "inspiration", label: "Pinterest board or inspiration images? Drop a link or describe your vision.", type: "textarea" },
  { key: "additional", label: "Anything else Lucy should know?", type: "textarea" },
  { key: "questions_for_lucy", label: "Any questions for Lucy?", type: "textarea" },
];

export function getQuestionsForEventType(eventType: string): Question[] {
  return eventType.toLowerCase() === "wedding" ? WEDDING_QUESTIONS : GENERAL_QUESTIONS;
}

export function getQuestionLabel(eventType: string, key: string): string | undefined {
  return getQuestionsForEventType(eventType).find((q) => q.key === key)?.label;
}
