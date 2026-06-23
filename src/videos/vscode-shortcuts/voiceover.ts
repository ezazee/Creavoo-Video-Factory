export const VIDEO_ID = "vscode-shortcuts";

export type SceneId =
  | "intro"
  | "shortcut-1"
  | "shortcut-2"
  | "shortcut-3"
  | "shortcut-4"
  | "shortcut-5"
  | "outro";

export const SCENES: { id: SceneId; text: string }[] = [
  {
    id: "intro",
    text: "Masih klik-klik folder buat buka file? Lima shortcut VS Code ini bakal bikin kamu keliatan pro — dan cuma butuh enam puluh detik buat belajarnya. Gas!",
  },
  {
    id: "shortcut-1",
    text: "Pertama, Control P. Cari file apapun dengan fuzzy search. Ketik sebagian nama file, langsung lompat ke sana — nggak perlu scroll-scroll sidebar lagi.",
  },
  {
    id: "shortcut-2",
    text: "Kedua, Control Shift P. Command Palette — cheat code untuk semua yang bisa dilakukan VS Code. Jalankan task, ubah settings, install extension, semua tanpa sentuh mouse.",
  },
  {
    id: "shortcut-3",
    text: "Ketiga, Control D. Pilih kemunculan kata berikutnya. Terus pencet buat pilih lebih banyak, lalu ketik sekali untuk rename semuanya sekaligus.",
  },
  {
    id: "shortcut-4",
    text: "Keempat, Alt plus Klik. Taruh banyak kursor di mana saja. Edit sepuluh tempat sekaligus — cocok banget buat rename variabel atau benerin pola yang berulang.",
  },
  {
    id: "shortcut-5",
    text: "Kelima, Control Backtick. Toggle terminal langsung tanpa keluar dari editor. Kode dan terminal kamu, berdampingan.",
  },
  {
    id: "outro",
    text: "Lima shortcut, nol klik mouse. Yang mana yang paling bikin kamu wow? Tulis di komentar — dan follow buat tips dev tiap minggu!",
  },
];

export const audioPath = (id: SceneId) => `voiceover/${VIDEO_ID}/${id}.mp3`;
