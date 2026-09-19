# 04 — Veri Modeli ve İndeksleme Stratejisi

**Sürüm:** 1.0 · **Tarih:** 19.09.2026
**İlgili ADR:** [`adr/0002-veri-katmani-statik-json.md`](adr/0002-veri-katmani-statik-json.md)

---

## 1. Tasarım ilkeleri

1. **Tek dosya yok.** Soru bankası çoğaldıkça tek JSON dosyası indirilebilir olmaktan çıkar. Veri, **manifest → indeks → parça (chunk)** hiyerarşisinde bölünür.
2. **İndeks hafif, parça ağır.** İndeks yalnızca filtreleme/seçim için gereken alanları taşır (soru metni yok). Deneme üretimi indeksten yapılır; yalnızca seçilen soruların bulunduğu parçalar indirilir.
3. **Dil-bağımsız kimlikler.** `FL-4.2.1` gibi LO kodları ve soru ID'leri hiçbir dilde değişmez. Çeviri, `i18n` nesnesinin içindedir — ayrı dosyada değil, çünkü soru ve çevirisi birlikte gözden geçirilir.
4. **Çok sertifikalı, ilk günden.** Kök dizin sertifika sürümüne göre ayrılır: `data/ctfl-v4.0.1/`, sonra `data/ctfl-at-v3.1/` vb. Uygulama kodu sertifikaya özel kod içermez.
5. **Sürüm bütünlüğü zorunlu alan.** Her soru hangi müfredat sürümü için yazıldığını taşır. Sürüm emekli olduğunda o sorular filtrelenir, silinmez (arşiv + şeffaflık).
6. **İçerik sürümlenir.** `manifest.json` bir `dataVersion` taşır; istemci önbelleği bununla geçersizleştirilir.

---

## 2. Dizin yapısı

```
data/
├── manifest.json                    # Kök indeks — sertifikalar, sürümler, veri sürümü
├── certifications.json              # Tüm ISTQB sertifikalarının sınav parametreleri (seed)
│
└── ctfl-v4.0.1/
    ├── meta.json                    # Bu sertifikanın sınav mekaniği + kaynak bağlantıları
    ├── syllabus.json                # Bölümler ve alt bölümler (TR/EN başlıklar)
    ├── objectives.json              # 64 öğrenme hedefi (LO) — kod, K-seviyesi, TR/EN metin
    ├── exam-blueprint.json          # Resmî LO-grubu → soru sayısı dağılımı
    │
    ├── questions/
    │   ├── index.json               # Hafif indeks: tüm soruların meta verisi
    │   ├── ch01-a.json              # Bölüm 1, parça a (≤40 soru)
    │   ├── ch01-b.json
    │   ├── ch02-a.json
    │   ├── ...
    │   └── ch06-a.json
    │
    ├── glossary/
    │   ├── index.json               # Terim listesi (slug, tr, en) — arama için
    │   ├── terms-a.json             # Tanımlar, alfabetik parçalar
    │   └── ...
    │
    └── exams/
        ├── index.json               # Hazır (küratörlü) deneme tanımları
        └── mock-001.json            # Soru ID listesi + sıra
```

### Parçalama kuralı
- **Soru parçası:** Bölüm bazlı, parça başına **en fazla 40 soru** (≈ 50–60 KB gzip'siz).
- Parça dolduğunda `-b`, `-c` ile devam edilir. **Var olan parçadan soru silinmez**; kaldırılan soru `status: "retired"` alır.
- Dosya adı asla değişmez → tarayıcı önbelleği ve PWA için kararlı.

---

## 3. Şemalar

JSON Schema dosyaları: [`../schemas/`](../schemas/)
CI'da her veri dosyası bu şemalara karşı doğrulanır.

### 3.1 `manifest.json`

```json
{
  "dataVersion": "2026.09.19",
  "generatedAt": "2026-09-19T12:00:00Z",
  "certifications": [
    {
      "id": "ctfl-v4.0.1",
      "acronym": "CTFL",
      "syllabusVersion": "4.0.1",
      "status": "active",
      "path": "ctfl-v4.0.1",
      "languages": ["tr", "en"],
      "questionCount": 312,
      "coverage": { "objectivesTotal": 64, "objectivesCovered": 64, "minPerObjective": 3 }
    }
  ]
}
```

### 3.2 `meta.json` — sınav mekaniği

Kaynak: [`03-istqb-referans.md §3`](03-istqb-referans.md)

```json
{
  "id": "ctfl-v4.0.1",
  "name": { "tr": "Sertifikalı Test Uzmanı Temel Seviye", "en": "Certified Tester Foundation Level" },
  "acronym": "CTFL",
  "stream": "core",
  "level": "foundation",
  "syllabusVersion": "4.0.1",
  "syllabusReleaseDate": "2024-09-15",
  "exam": {
    "questionCount": 40,
    "totalPoints": 40,
    "passPoints": 26,
    "passPercent": 65,
    "durationMinutes": 60,
    "extendedDurationMinutes": 75,
    "pointsPerQuestion": 1,
    "negativeMarking": null,
    "questionKLevelDistribution": { "K1": 8, "K2": 24, "K3": 8 }
  },
  "sources": {
    "syllabusEn": "https://istqb.org/?sdm_process_download=1&download_id=3345",
    "syllabusTr": "https://www.turkishtestingboard.org/files/pdfs/ISTQB_CTFL_Syllabus-v4.0.1.pdf",
    "examRules": "https://istqb.org/?sdm_process_download=1&download_id=3829",
    "examTables": "https://istqb.org/?sdm_process_download=1&download_id=3832",
    "glossaryApi": "https://api.glossary.istqb.org/v1/terms"
  }
}
```

> `negativeMarking: null` bilinçlidir — `false` demek, doğrulanamamış bir iddiada bulunmak olur. UI bunu "resmî dokümanlarda belirtilmemiş" diye gösterir.

### 3.3 `syllabus.json` — bölümler

```json
{
  "chapters": [
    {
      "number": 1,
      "title": { "en": "Fundamentals of Testing", "tr": "Yazılım Testinin Temelleri" },
      "trainingMinutes": 180,
      "objectiveCount": 14,
      "objectiveKDistribution": { "K1": 3, "K2": 11, "K3": 0 },
      "examQuestions": 8,
      "examPoints": 8,
      "examKDistribution": { "K1": 2, "K2": 6, "K3": 0 },
      "sections": [
        { "id": "1.1", "title": { "en": "What is Testing?", "tr": "Test Nedir?" } }
      ]
    }
  ]
}
```

> **Not:** `objectiveKDistribution` (öğrenme hedeflerinin K dağılımı) ile `examKDistribution` (soruların K dağılımı) **farklıdır** ve ikisi de ayrı tutulur. Bkz. [`03-istqb-referans.md §2`](03-istqb-referans.md).

### 3.4 `objectives.json` — öğrenme hedefleri

```json
{
  "objectives": [
    {
      "code": "FL-4.2.1",
      "chapter": 4,
      "section": "4.2",
      "kLevel": "K3",
      "text": {
        "en": "Use equivalence partitioning to derive test cases",
        "tr": "Test senaryoları türetmek için eşdeğerlik bölümlemesini kullanmak"
      },
      "keywords": ["equivalence partitioning", "eşdeğerlik bölümlemesi"]
    }
  ]
}
```

> `code` **birincil anahtardır.** Türkçe müfredatta da `FL-x.y.z` olarak İngilizce kaldığı doğrulanmıştır.

### 3.5 `exam-blueprint.json` — resmî soru dağılımı

Bu dosya, **piyasadaki hiçbir rakibin yapmadığı** gerçekçi deneme üretimini mümkün kılar.

```json
{
  "syllabusVersion": "4.0.1",
  "source": "ISTQB Exam Structures & Rules tables v1.19 (2026-08-19)",
  "rule": "Bir grupta LO'dan çok soru varsa her LO'dan en az BİR soru gelir. Sorudan çok LO varsa her soru FARKLI bir LO'yu kapsar.",
  "groups": [
    { "id": "g1-1", "chapter": 1, "kLevel": "K1", "questions": 1, "objectives": ["FL-1.1.1", "FL-1.2.2"] },
    { "id": "g1-2", "chapter": 1, "kLevel": "K1", "questions": 1, "objectives": ["FL-1.5.2"] },
    { "id": "g1-3", "chapter": 1, "kLevel": "K2", "questions": 1,
      "objectives": ["FL-1.1.2", "FL-1.2.1", "FL-1.2.3", "FL-1.3.1", "FL-1.4.1", "FL-1.4.2"] },
    { "id": "g1-4", "chapter": 1, "kLevel": "K2", "questions": 3, "objectives": ["FL-1.4.3", "FL-1.4.4", "FL-1.4.5"] },
    { "id": "g1-5", "chapter": 1, "kLevel": "K2", "questions": 1, "objectives": ["FL-1.5.1", "FL-1.5.3"] },
    { "id": "g4-k3", "chapter": 4, "kLevel": "K3", "questions": 5,
      "objectives": ["FL-4.2.1", "FL-4.2.2", "FL-4.2.3", "FL-4.2.4", "FL-4.5.3"] },
    { "id": "g5-k3", "chapter": 5, "kLevel": "K3", "questions": 3,
      "objectives": ["FL-5.1.4", "FL-5.1.5", "FL-5.5.1"] },
    { "id": "g6-1", "chapter": 6, "kLevel": "K2", "questions": 1, "objectives": ["FL-6.1.1"] },
    { "id": "g6-2", "chapter": 6, "kLevel": "K1", "questions": 1, "objectives": ["FL-6.2.1"] }
  ]
}
```

> ⚠️ Yukarıdaki gruplar **örnektir**; tam liste resmî tablodan birebir çıkarılacaktır (TODO F0-05). Toplam soru sayısı 40, bölüm dağılımı 8/6/4/11/9/2, K dağılımı 8/24/8 olmalıdır — CI bunu doğrular.

### 3.6 `questions/index.json` — hafif indeks

**Soru metni yoktur.** Deneme üretimi, filtreleme ve istatistik bu dosyadan yapılır.

```json
{
  "dataVersion": "2026.09.19",
  "count": 312,
  "chunks": ["ch01-a", "ch01-b", "ch02-a", "ch03-a", "ch04-a", "ch04-b", "ch05-a", "ch06-a"],
  "questions": [
    {
      "id": "ctfl4-0001",
      "chunk": "ch01-a",
      "chapter": 1,
      "section": "1.4",
      "objectives": ["FL-1.4.3"],
      "kLevel": "K2",
      "type": "single",
      "selectCount": 1,
      "difficulty": 2,
      "hasMedia": false,
      "tags": ["seven-principles"],
      "languages": ["tr", "en"],
      "syllabusVersion": "4.0.1",
      "status": "published"
    }
  ]
}
```

Alan başına ~200 bayt → 1.000 soruda ~200 KB. Kabul edilebilir; 2.000 soruyu aşarsa indeks de bölümlere ayrılır (`index-ch01.json` …).

### 3.7 Soru nesnesi — `questions/ch01-a.json`

```json
{
  "chunk": "ch01-a",
  "chapter": 1,
  "dataVersion": "2026.09.19",
  "questions": [
    {
      "id": "ctfl4-0001",
      "revision": 2,
      "syllabusVersion": "4.0.1",
      "chapter": 1,
      "section": "1.4",
      "syllabusRef": "§1.4.3",
      "objectives": ["FL-1.4.3"],
      "kLevel": "K2",
      "type": "single",
      "selectCount": 1,
      "points": 1,
      "difficulty": 2,
      "tags": ["seven-principles", "pesticide-paradox"],
      "origin": "original",
      "status": "published",
      "correct": ["c"],
      "media": null,
      "i18n": {
        "tr": {
          "stem": "Aynı test senaryolarının defalarca tekrar edilmesi zamanla yeni hata bulma kapasitesini yitirir. Bu durumu EN İYİ açıklayan test prensibi hangisidir?",
          "options": [
            { "id": "a", "text": "Test, hataların varlığını gösterir" },
            { "id": "b", "text": "Kusursuz test imkânsızdır" },
            { "id": "c", "text": "Testlerin etkisi zamanla azalır" },
            { "id": "d", "text": "Test, bağlama bağlıdır" }
          ],
          "rationale": {
            "summary": "Testlerin etkisi zamanla azalır (pesticide paradox) prensibi, aynı testlerin tekrarlanmasının yeni kusur bulma oranını düşürdüğünü söyler.",
            "byOption": {
              "a": "Yanlış. Bu prensip, testin kusur bulabileceğini ama yokluğunu kanıtlayamayacağını söyler; tekrarla ilgisi yoktur.",
              "b": "Yanlış. Bu prensip her kombinasyonun test edilemeyeceğini söyler; test etkinliğinin zamanla azalmasını açıklamaz.",
              "c": "Doğru. Aynı testlerin tekrarı yeni kusur bulma kapasitesini düşürür; testler gözden geçirilmeli ve çeşitlendirilmelidir.",
              "d": "Yanlış. Bu prensip test yaklaşımının bağlama göre değiştiğini söyler; tekrar etkisiyle ilgili değildir."
            }
          },
          "hints": ["Prensip, tarım ilacına karşı direnç kazanan böceklere benzetilir."]
        },
        "en": {
          "stem": "Repeating the same test cases over time reduces their ability to find new defects. Which testing principle BEST describes this?",
          "options": [
            { "id": "a", "text": "Testing shows the presence of defects" },
            { "id": "b", "text": "Exhaustive testing is impossible" },
            { "id": "c", "text": "Tests wear out" },
            { "id": "d", "text": "Testing is context dependent" }
          ],
          "rationale": {
            "summary": "The 'tests wear out' principle (pesticide paradox) states that repeating the same tests lowers the rate of finding new defects.",
            "byOption": {
              "a": "Incorrect. This principle states testing can show defects exist but cannot prove their absence; it is unrelated to repetition.",
              "b": "Incorrect. This principle states not every combination can be tested; it does not explain declining effectiveness over time.",
              "c": "Correct. Repeating identical tests reduces new-defect yield; tests must be reviewed and varied.",
              "d": "Incorrect. This principle states the approach depends on context, not on repetition effects."
            }
          },
          "hints": ["The principle is compared to insects becoming resistant to pesticide."]
        }
      },
      "meta": {
        "author": "unal",
        "reviewedBy": "—",
        "createdAt": "2026-09-19",
        "updatedAt": "2026-09-19"
      }
    }
  ]
}
```

#### Alan sözlüğü

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | string | `ctfl4-NNNN`. Asla yeniden kullanılmaz. |
| `revision` | int | İçerik her değiştiğinde artar. SRS geçmişinde sorunun değiştiğini anlamak için. |
| `syllabusVersion` | string | **Zorunlu.** UI'da rozet olarak gösterilir. |
| `objectives` | string[] | En az bir LO kodu. Birden çoksa `kLevel` **en yükseği** olur (§5.4.2). |
| `kLevel` | `K1`\|`K2`\|`K3` | Sorunun hedeflediği bilişsel seviye. |
| `type` | `single`\|`multi` | `multi` → "HANGİ İKİSİ / Select TWO". |
| `selectCount` | int | `multi` için kaç şık seçilecek. |
| `points` | int | Foundation'da **daima 1**. Advanced modüllerde değişir. |
| `difficulty` | 1–3 | Editoryal tahmin. Pratik modunda kademeli zorluk için. |
| `origin` | `original`\|`adapted`\|`community` | **`official` değeri yoktur** — resmî soru kopyalanmaz. Bkz. [`08-hukuki-ve-telif.md`](08-hukuki-ve-telif.md). |
| `status` | `draft`\|`review`\|`published`\|`retired` | Yalnızca `published` olanlar sunulur. |
| `correct` | string[] | Şık ID'leri. Uzunluğu `selectCount` ile eşleşmeli (CI kontrolü). |
| `media` | object\|null | Tablo / diyagram. Bkz. §4. |
| `rationale.byOption` | object | **Her şık için zorunlu.** Eksikse CI kırılır. |
| `hints` | string[] | Kademeli ipucu. Opsiyonel. |

### 3.8 `media` — tablo ve diyagram

Kritik: piyasadaki ucuz araçların en çok şikâyet aldığı nokta "sorular için kritik diyagramlar eksik". Diyagramlar **görsel dosya olarak değil, yapısal veri olarak** tutulur → duyarlı, erişilebilir, karanlık modda çalışır, çeviri edilebilir.

```json
"media": {
  "kind": "decision-table",
  "caption": { "tr": "Karar tablosu", "en": "Decision table" },
  "headers": { "tr": ["Koşul", "K1", "K2", "K3"], "en": ["Condition", "R1", "R2", "R3"] },
  "rows": [["Üye mi?", "E", "E", "H"], ["Tutar > 500", "E", "H", "-"]]
}
```

```json
"media": {
  "kind": "state-transition",
  "states": ["Taslak", "Onayda", "Yayında"],
  "transitions": [
    { "from": "Taslak", "to": "Onayda", "event": "gönder" },
    { "from": "Onayda", "to": "Yayında", "event": "onayla" }
  ]
}
```

Desteklenen türler: `decision-table` · `state-transition` · `control-flow` · `code` · `table` · `image` (son çare; `alt` metni zorunlu).

### 3.9 Sözlük — `glossary/`

```json
// glossary/index.json
{ "terms": [ { "slug": "test-case", "tr": "test senaryosu", "en": "test case", "chunk": "terms-t" } ] }
```

```json
// glossary/terms-t.json
{
  "terms": [
    {
      "slug": "test-case",
      "en": { "term": "test case", "definition": "A set of preconditions, inputs, actions..." },
      "tr": { "term": "test senaryosu", "definition": "Bir ön koşullar, girdiler, eylemler... kümesi." },
      "usedIn": [{ "syllabus": "Foundation", "version": "v4.0" }],
      "source": "ISTQB Glossary",
      "sourceUrl": "https://glossary.istqb.org/en_US/term/test-case",
      "trSource": "TTB CTFL v4.0.1 TR müfredatı §1.x"
    }
  ]
}
```

> **Türkçe tanım kuralı:** Birincil kaynak **TTB'nin v4.0.1 Türkçe müfredatı**. TTB'nin ayrı sözlüğü (v3.7 tabanlı, 564 terim) yalnızca ikincil ve **doğrulanarak** kullanılır. Her Türkçe terim `trSource` ile hangi belgeden geldiğini taşır.

---

## 4. İstemci tarafı (kullanıcı) verisi — IndexedDB

Sunucu yok; tüm ilerleme cihazda. Dexie ile 5 tablo:

```ts
attempts      // Deneme oturumları
  { id, certId, mode, startedAt, finishedAt, durationSec, extended,
    questionIds[], answers: Record<qid, string[]>, flagged: qid[],
    score, passed, chapterBreakdown, objectiveBreakdown }

responses     // Soru bazında her cevap (analiz ve SRS için)
  { id, questionId, attemptId, answeredAt, given[], correct: bool,
    timeSpentMs, selfGrade?: 'again'|'hard'|'good'|'easy' }

srsCards      // FSRS durumu
  { questionId, due, stability, difficulty, reps, lapses, state, lastReview }

bookmarks     // İşaretlenen sorular ve notlar
  { questionId, note, createdAt }

settings      // Tercihen tek satır
  { uiLang, contentLang, sideBySide, theme, extendedTime, lastCertId, dataVersion }
```

### Veri sürümü değişince
`manifest.dataVersion` değiştiğinde: soru önbelleği temizlenir, **kullanıcı ilerlemesi korunur**. Bir sorunun `revision` değeri arttıysa o sorunun SRS kartı `state: 'relearning'` yapılır (içerik değişti, eski hafıza geçersiz).

### Dışa/içe aktarma
Tüm tablolar tek JSON olarak dışa aktarılır: `istqb-prep-yedek-2026-09-19.json`. İçe aktarmada `dataVersion` uyuşmazlığı uyarı verir ama engellemez.

---

## 5. Deneme üretim algoritması

```
GİRDİ:  blueprint (LO grupları), index.json, kullanıcı geçmişi, seçenekler
ÇIKTI:  40 soru ID'si

1. Her blueprint grubu için:
   a. Gruptaki LO'ları kapsayan, status=published, syllabusVersion eşleşen soruları indeksten süz.
   b. grup.questions > grup.objectives.length ise:
        → her LO'dan EN AZ bir soru seç, kalanı havuzdan rastgele tamamla
      değilse:
        → grup.questions kadar FARKLI LO seç, her birinden bir soru al
   c. Seçim ağırlığı (opsiyon "akıllı mod" açıksa):
        w = 1
        w *= 2.0  eğer kullanıcı bu soruyu hiç görmediyse
        w *= 1.5  eğer kullanıcı bu LO'da %60'ın altındaysa
        w *= 0.3  eğer son 7 günde bu soru sorulduysa
2. Toplam 40 soruyu birleştir.
3. DOĞRULA: bölüm dağılımı = 8/6/4/11/9/2 ve K dağılımı = 8/24/8. Değilse hata fırlat.
4. Soruları KARIŞTIR (resmî örnek sınavlar LO sırasına göre dizilidir; gerçek sınav değildir).
5. Her sorunun şıklarını da karıştır — ancak "yukarıdakilerin hepsi" gibi konumsal şıklar sabit kalır.
```

**Yetersiz soru durumu:** Bir grup için yeterli yayınlanmış soru yoksa, deneme üretilir ama kullanıcıya açıkça bildirilir: *"Bu deneme 40 yerine 34 soru içeriyor — 4. bölüm için henüz yeterli soru yok."* Sessizce eksik üretmek, eleştirdiğimiz kalibrasyon hatasının aynısıdır.

---

## 6. CI doğrulamaları

Her PR'da çalışacak kontroller (`npm run validate:data`):

| # | Kontrol | Sonuç |
|---|---|---|
| 1 | Tüm JSON dosyaları ilgili JSON Schema'ya uyuyor mu? | ❌ build kırılır |
| 2 | Her `objectives[]` kodu `objectives.json` içinde var mı? | ❌ |
| 3 | `correct[]` uzunluğu `selectCount` ile eşleşiyor mu? | ❌ |
| 4 | `correct[]` içindeki her ID, `options` içinde var mı? | ❌ |
| 5 | `rationale.byOption` her şık için dolu mu (TR ve EN)? | ❌ |
| 6 | `i18n` içinde hem `tr` hem `en` var mı ve şık sayıları eşit mi? | ❌ |
| 7 | Soru ID'leri benzersiz mi (tüm parçalar arasında)? | ❌ |
| 8 | `index.json` ile parça dosyaları tutarlı mı (sayı, chunk adı, chapter)? | ❌ |
| 9 | `exam-blueprint.json` toplamı 40 soru / 8-6-4-11-9-2 / K 8-24-8 mi? | ❌ |
| 10 | Her LO için en az 1 yayınlanmış soru var mı? | ⚠️ uyarı |
| 11 | Her LO için en az 3 yayınlanmış soru var mı? | ⚠️ uyarı |
| 12 | `kLevel`, sorunun LO'larının en yükseğiyle uyumlu mu? | ⚠️ uyarı |
| 13 | Türkçe metinde İngilizce terim sızıntısı var mı (sözlük kontrolü)? | ⚠️ uyarı |

---

## 7. Yeni sertifika eklemek

1. `data/<yeni-id>/` dizinini aç
2. `meta.json`, `syllabus.json`, `objectives.json`, `exam-blueprint.json` doldur
3. `manifest.json`'a girdi ekle
4. Soru parçalarını ekle
5. **Kod değişikliği yok.** Uygulama manifest'ten okur.

Hedef sıra: `CTFL v4.0.1` → `CTFL-AT` → `CT-AI v2.0` → `CT-PT` → `CTAL-TA v4.0`
