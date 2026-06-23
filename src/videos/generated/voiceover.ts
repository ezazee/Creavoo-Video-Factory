export const VIDEO_ID = "generated";

export type SceneId =
  | "intro"
  | "tip-1"
  | "tip-2"
  | "tip-3"
  | "tip-4"
  | "tip-5"
  | "outro";

export const SCENE_IDS: SceneId[] = [
  "intro", "tip-1", "tip-2", "tip-3", "tip-4", "tip-5", "outro",
];

export const audioPath = (id: SceneId) => `voiceover/${VIDEO_ID}/${id}.mp3`;
