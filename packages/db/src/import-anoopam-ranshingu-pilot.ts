/**
 * Import pilot PDF: Anoopam Swagat Utsav bhajan (licensing: pilot agreement).
 * Source PDF: https://anoopam.org/wp-content/uploads/2026/03/Ranshingu_Funkayu-Swagat_Utsav_Bhajan.pdf
 *
 * Run (repo root): DATABASE_URL=... pnpm exec tsx packages/db/src/import-anoopam-ranshingu-pilot.ts
 */
import { createHash } from "node:crypto";
import { IngestRecordSchema } from "@ngb/content-schema";
import { disconnectDb, upsertIngestRecord } from "./index.js";

/** Lyrics cleaned from PDF text extraction; verify with Anoopam before wider publish. */
const GUJARATI_LYRICS = `આનંદ છાયો રે...

રણિશંગુ ફૂંકાયું મારા ગુરુ પધાર્યા,
રણિશંગુ ફૂંકાયું ગુરુહર પધાર્યા,
રણિશંગુ ફૂંકાયું સાહેબદાદા પધાર્યા,
હૃદયે આનંદ છાયો રે, આનંદ છાયો રે... (2)

હરખે સૌના આત્મ ઉજાળા, જીવન ધન્ય ભાગ્ય અમારાં,
સગટ્યા સ્નેહના ઝગમગ દીવડા... (2)
આકાશે આંગણિયાં અજવાળાં... (2)
કૃપાનો સિંધુ છલકાયો, આનંદ છાયો રે,
હૃદયે આનંદ છાયો રે, આનંદ છાયો રે... (2)

વારી જાઉં રે.. બલિહારી જાઉં રે... (2)
મારા ગુરુહર આંગણ આવ્યા, મેં વારી જાઉં રે...(2)

સર્વેશ્વર છો આપ અમારા, નિત નવાં દર્શન થાય તમારાં,
રંગબેરંગી જીવન બનાવ્યાં,(2)
ગુરુ શરણમાં શાંતિ પામ્યા...(2)
ભક્તનો લૂંટીને લહાવો, આનંદ છાયો રે,
હૃદયે આનંદ છાયો રે, આનંદ છાયો રે... (2)

રચિયતા : વસંતભાઈ પટેલ
(મોગરી)

— સપાખરું —

અદ્ભુત નો સ્નેહ છે ને આત્મનું હેત છે,
નામ જપ સદા તેના મુખે છે રટાય;
ધૂનમાં એ લાગી જાય એકવાર એ તો તો,
શું ન જાણે ક્યારે જપ પૂરા એના થાય…

સ્વામિનારાયણ સ્વામિનારાયણ રટ્યા કરે,
સાહેબ છે પ્યારા સૌને હૈયે વસનાર;
ભલે પછી દુનિયા તો આખી ડોલી જાય,
પણ સાહેબ મોજીલા મારા મને વસનાર….

હોઠે છે યોગીજી, હૈયે યોગીજી,
કિસ્મતમાં યોગીજી, ધ્યાનમાં યોગીજી...

સંપ સુહૃદભાવ એકતાનો નારો લઈ,
ગુરુ ગુણ ગાન કરી થયા ભવપાર;
યુગલ ઉપાસનાનો ગૌરવ કરીને એણે,
જગતમાં નામ ક્યાં ઉજળાં અપાર…

અમ સખા સંગે ધરમની ધજા લઈ,
ભગવાં હૃદયના સાધુ સરદાર;
કરુણાસભર એવી પ્રેમની મૂર્તિ,
આનંદબ્રહ્મના સ્વરૂપ સાકાર…

સ્વામીજી ધામ છે, સઘળું સમાણું છે,
ધન્ય ગુરુ સહ યોગી વારસદાર;
અદભુત છે, અનુપમ તે,
વહાલો મારો છે સૌનો ઠાણાધાર…
`;

async function main() {
  const checksumSha256 = createHash("sha256")
    .update(GUJARATI_LYRICS, "utf8")
    .digest("hex");

  const record = IngestRecordSchema.parse({
    source: {
      slug: "anoopam-pilot",
      name: "Anoopam Mission (pilot)",
      description:
        "Pilot corpus for Next Gen Bhajanavali; confirm redistribution with Anoopam for production.",
      baseUrl: "https://anoopam.org",
      type: "MANUAL",
      metadata: {
        pilotPdf:
          "https://anoopam.org/wp-content/uploads/2026/03/Ranshingu_Funkayu-Swagat_Utsav_Bhajan.pdf",
      },
    },
    kirtan: {
      slug: "anoopam-ranshingu-swagat-utsav-bhajan",
      title: "આનંદ છાયો રે (રણિશંગુ ફૂંકાયું)",
      titleTransliterated: "Ānanda chāyo re (Raṇiśaṃgu phūṃkāyuṃ)",
      summary:
        "Swāgat Utsav bhajan (PDF); lyricist: વસંતભાઈ પટેલ (મોગરી). Includes સપાખરું section from same PDF.",
      externalId: "anoopam:pdf:ranshingu-swagat-2026-03",
      metadata: {
        author: "વસંતભાઈ પટેલ",
        authorLatin: "Vasantbhai Patel (Mogri)",
        categoryEnglish: "Utsav",
        categoryGujarati: "સ્વાગત ઉત્સવ",
        checksumSha256,
        sourceDocument:
          "https://anoopam.org/wp-content/uploads/2026/03/Ranshingu_Funkayu-Swagat_Utsav_Bhajan.pdf",
      },
    },
    texts: [
      {
        kind: "GUJARATI_LYRICS",
        content: GUJARATI_LYRICS,
        locale: "gu",
        sortOrder: 0,
      },
    ],
    audios: [],
  });

  const out = await upsertIngestRecord(record);
  console.log("Upserted Anoopam pilot kirtan:", out);
}

main()
  .then(() => disconnectDb())
  .catch(async (e) => {
    console.error(e);
    await disconnectDb();
    process.exit(1);
  });
