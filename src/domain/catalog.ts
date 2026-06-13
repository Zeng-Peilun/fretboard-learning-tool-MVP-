import { makeChordTemplate, makeScaleTemplate } from "./intervals";

export const CHORD_TEMPLATES = [
  makeChordTemplate("major", "Major", "X", "0, +4, +3"),
  makeChordTemplate("power", "Power", "X5", "0, +7"),
  makeChordTemplate("minor", "Minor", "Xm", "0, +3, +4"),
  makeChordTemplate("augmented", "Augmented", "X+", "0, +4, +4"),
  makeChordTemplate("diminished", "Diminished", "X°", "0, +3, +3"),
  makeChordTemplate("sus4", "Suspended 4th", "Xsus4", "0, +5, +2"),
  makeChordTemplate("sus2", "Suspended 2nd", "Xsus2", "0, +2, +5"),
  makeChordTemplate("major-7", "Major 7th", "Xmaj7", "0, +4, +3, +4"),
  makeChordTemplate("minor-7", "Minor 7th", "Xm7", "0, +3, +4, +3"),
  makeChordTemplate("dominant-7", "Dominant 7th", "X7", "0, +4, +3, +3"),
  makeChordTemplate("diminished-7", "Diminished 7th", "X°7", "0, +3, +3, +3"),
  makeChordTemplate("minor-7-flat-5", "Minor 7th flat 5", "Xø7", "0, +3, +3, +4"),
  makeChordTemplate("minor-major-7", "Minor Major 7th", "Xmmaj7", "0, +3, +4, +4"),
  makeChordTemplate("add-9", "Add 9", "Xadd9", "0, +4, +3, +7"),
  makeChordTemplate("major-add-4", "Major Add 4", "Xadd4", "0, +4, +1, +2"),
  makeChordTemplate("minor-add-4", "Minor Add 4", "Xmadd4", "0, +3, +2, +2"),
  makeChordTemplate("major-add-6", "Major add 6", "X6", "0, +4, +3, +2"),
  makeChordTemplate("minor-add-6", "Minor add 6", "Xm6", "0, +3, +4, +2"),
  makeChordTemplate("dominant-7-sus-4", "Dominant 7th sus 4", "X7sus4", "0, +5, +2, +3"),
  makeChordTemplate("dominant-7-b5", "Dominant 7th b5", "X7b5", "0, +4, +2, +4"),
  makeChordTemplate("major-7-sharp-5", "Major 7th sharp 5", "Xmaj7#5", "0, +4, +4, +3"),
  makeChordTemplate("dominant-7-sharp-5", "Dominant 7th #5", "X7#5", "0, +4, +4, +2"),
  makeChordTemplate("major-9", "Major 9th", "Xmaj9", "0, +4, +3, +4, +3"),
  makeChordTemplate("dominant-9", "Dominant 9th", "X9", "0, +4, +3, +3, +4"),
  makeChordTemplate("minor-9", "Minor 9th", "Xm9", "0, +3, +4, +3, +4"),
  makeChordTemplate("major-6-9", "Major 6+9", "X6/9", "0, +4, +3, +2, +5"),
  makeChordTemplate("minor-6-9", "Minor 6+9", "Xm6/9", "0, +3, +4, +2, +5"),
  makeChordTemplate("dominant-7b9", "Dominant 7b9", "X7b9", "0, +4, +3, +3, +3"),
  makeChordTemplate("minor-major-9", "Minor Major 9th", "Xmmaj9", "0, +3, +4, +4, +3"),
  makeChordTemplate("dominant-7-sharp-9", "Dominant 7#9", "X7#9", "0, +4, +3, +3, +5"),
  makeChordTemplate("major-11", "Major 11th", "Xmaj11", "0, +4, +3, +4, +3, +3"),
  makeChordTemplate("dominant-11", "Dominant 11th", "X11", "0, +4, +3, +3, +4, +3"),
  makeChordTemplate("minor-11", "Minor 11th", "Xm11", "0, +3, +4, +3, +4, +3"),
  makeChordTemplate("major-9-sharp-11", "Major 9th sharp 11th", "Xmaj9#11", "0, +4, +3, +4, +3, +4"),
  makeChordTemplate("major-13", "Major 13th", "Xmaj13", "0, +4, +3, +4, +3, +3, +4"),
  makeChordTemplate("dominant-13", "Dominant 13th", "X13", "0, +4, +3, +3, +4, +3, +4"),
  makeChordTemplate("minor-13", "Minor 13th", "Xm13", "0, +3, +4, +3, +4, +3, +4"),
  makeChordTemplate("major-13-sharp-11", "Major 13th sharp 11", "Xmaj13#11", "0, +4, +3, +4, +3, +4, +3")
];

export const SCALE_TEMPLATES = [
  makeScaleTemplate("ionian", "Ionian（自然大调）", "中古调式", "0, +2, +2, +1, +2, +2, +2"),
  makeScaleTemplate("dorian", "Dorian", "中古调式", "0, +2, +1, +2, +2, +2, +1"),
  makeScaleTemplate("phrygian", "Phrygian", "中古调式", "0, +1, +2, +2, +2, +1, +2"),
  makeScaleTemplate("lydian", "Lydian", "中古调式", "0, +2, +2, +2, +1, +2, +2"),
  makeScaleTemplate("mixolydian", "Mixolydian", "中古调式", "0, +2, +2, +1, +2, +2, +1"),
  makeScaleTemplate("aeolian", "Aeolian（自然小调）", "中古调式", "0, +2, +1, +2, +2, +1, +2"),
  makeScaleTemplate("locrian", "Locrian", "中古调式", "0, +1, +2, +2, +1, +2, +2"),
  makeScaleTemplate("melodic-minor", "旋律小调一级 (Melodic Minor)", "旋律小调调式", "0, +2, +1, +2, +2, +2, +2"),
  makeScaleTemplate("dorian-flat-2", "多利亚♭2调式 (Dorian ♭2)", "旋律小调调式", "0, +1, +2, +2, +2, +2, +1"),
  makeScaleTemplate("lydian-augmented", "利底亚增调式 (Lydian Augmented)", "旋律小调调式", "0, +2, +2, +2, +2, +1, +2"),
  makeScaleTemplate("lydian-dominant", "利底亚♭7调式 (Lydian Dominant)", "旋律小调调式", "0, +2, +2, +2, +1, +2, +1"),
  makeScaleTemplate(
    "mixolydian-flat-6",
    "米索利底亚♭6调式 (Mixolydian ♭6)",
    "旋律小调调式",
    "0, +2, +2, +1, +2, +1, +2"
  ),
  makeScaleTemplate("locrian-sharp-2", "洛克里亚♯2调式 (Locrian ♯2)", "旋律小调调式", "0, +2, +1, +2, +1, +2, +2"),
  makeScaleTemplate("altered", "变化调式 (Altered Scale / Super Locrian)", "旋律小调调式", "0, +1, +2, +1, +2, +2, +2"),
  makeScaleTemplate("harmonic-minor", "和声小调一级 (Harmonic Minor)", "和声小调调式", "0, +2, +1, +2, +2, +1, +3"),
  makeScaleTemplate("locrian-natural-6", "洛克里亚♮6调式 (Locrian ♮6)", "和声小调调式", "0, +1, +2, +2, +1, +3, +1"),
  makeScaleTemplate("ionian-sharp-5", "伊奥尼亚♯5调式 (Ionian ♯5)", "和声小调调式", "0, +2, +2, +1, +3, +1, +2"),
  makeScaleTemplate("dorian-sharp-4", "多利亚♯4调式 (Dorian ♯4)", "和声小调调式", "0, +2, +1, +3, +1, +2, +1"),
  makeScaleTemplate(
    "phrygian-dominant",
    "弗里吉亚主调式 (Phrygian Dominant)",
    "和声小调调式",
    "0, +1, +3, +1, +2, +1, +2"
  ),
  makeScaleTemplate("lydian-sharp-2", "利底亚♯2调式 (Lydian ♯2)", "和声小调调式", "0, +3, +1, +2, +1, +2, +2"),
  makeScaleTemplate("ultralocrian", "超洛克里亚♭7调式 (Ultralocrian)", "和声小调调式", "0, +1, +2, +1, +2, +2, +1"),
  makeScaleTemplate("major-pentatonic", "大调五声 (Major Pentatonic)", "五声音阶与蓝调调式", "0, +2, +2, +3, +2"),
  makeScaleTemplate("minor-pentatonic", "小调五声 (Minor Pentatonic)", "五声音阶与蓝调调式", "0, +3, +2, +2, +3"),
  makeScaleTemplate("major-blues", "大调蓝调 (Major Blues)", "五声音阶与蓝调调式", "0, +2, +1, +1, +3, +2"),
  makeScaleTemplate("minor-blues", "小调蓝调 (Minor Blues)", "五声音阶与蓝调调式", "0, +3, +2, +1, +1, +3"),
  makeScaleTemplate("whole-tone", "全音阶 (Whole-Tone Scale)", "对称调式", "0, +2, +2, +2, +2, +2"),
  makeScaleTemplate("diminished", "减音阶 (Diminished Scale / 全半减)", "对称调式", "0, +2, +1, +2, +1, +2, +1, +2"),
  makeScaleTemplate(
    "dominant-diminished",
    "半全减音阶 (Dominant Diminished / 半全减)",
    "对称调式",
    "0, +1, +2, +1, +2, +1, +2, +1"
  ),
  makeScaleTemplate(
    "chromatic",
    "色调/半音阶 (Chromatic Scale)",
    "对称调式",
    "0, +1, +1, +1, +1, +1, +1, +1, +1, +1, +1, +1"
  ),
  makeScaleTemplate(
    "hungarian-minor",
    "吉普赛/匈牙利小调 (Gypsy/Hungarian Minor)",
    "世界音乐、异域调式",
    "0, +2, +1, +3, +1, +1, +3"
  ),
  makeScaleTemplate(
    "double-harmonic-major",
    "双和声大调 (Double Harmonic Major)",
    "世界音乐、异域调式",
    "0, +1, +3, +1, +2, +1, +3"
  ),
  makeScaleTemplate("persian", "波斯调式 (Persian Scale)", "世界音乐、异域调式", "0, +1, +3, +1, +1, +2, +3"),
  makeScaleTemplate("harmonic-major", "和声大调一级 (Harmonic Major)", "和声大调音乐调式", "0, +2, +2, +1, +2, +1, +3"),
  makeScaleTemplate("dorian-flat-5", "多利亚♭5调式 (Dorian ♭5)", "和声大调音乐调式", "0, +2, +1, +2, +1, +3, +1"),
  makeScaleTemplate("phrygian-flat-4", "弗里吉亚♭4调式 (Phrygian ♭4)", "和声大调音乐调式", "0, +1, +2, +1, +3, +1, +2"),
  makeScaleTemplate(
    "lydian-flat-3",
    "利底亚♭3调式 (Lydian ♭3 / Melodic Minor ♯4)",
    "和声大调音乐调式",
    "0, +2, +1, +3, +1, +2, +2"
  ),
  makeScaleTemplate(
    "mixolydian-flat-2",
    "米索利底亚♭2调式 (Mixolydian ♭2)",
    "和声大调音乐调式",
    "0, +1, +3, +1, +2, +2, +1"
  ),
  makeScaleTemplate(
    "lydian-augmented-sharp-2",
    "利底亚增♯2调式 (Lydian Augmented ♯2)",
    "和声大调音乐调式",
    "0, +3, +1, +2, +2, +1, +2"
  ),
  makeScaleTemplate(
    "locrian-double-flat-7",
    "洛克里亚𝄫7调式 (Locrian 𝄫7)",
    "和声大调音乐调式",
    "0, +1, +2, +1, +2, +2, +1"
  )
];
