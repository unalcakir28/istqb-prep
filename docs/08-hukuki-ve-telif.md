# 08 — Hukuki Çerçeve ve Telif

**Sürüm:** 1.0 · **Tarih:** 19.09.2026
**Durum:** ⚠️ Bu döküman hukuki tavsiye değildir. Ticari bir adım atılmadan önce bir avukata danışılmalıdır.

> **Bu dökümanın tek cümlelik özeti:** Resmî ISTQB örnek sınav soruları siteye konulamaz. Tüm sorular özgün yazılacaktır. Öğrenme hedefi kodları, bölüm başlıkları ve sınav parametreleri kaynak gösterilerek alıntılanabilir.

---

## 1. ISTQB müfredat telif maddesi (birebir)

CTFL v4.0.1 müfredatı, sayfa 2:

> "All rights reserved. The authors hereby transfer the copyright to the ISTQB®. The authors (as current copyright holders) and ISTQB® (as the future copyright holder) have agreed to the following conditions of use:
>
> • **Extracts, for non-commercial use, from this document may be copied if the source is acknowledged.** Any Accredited Training Provider may use this syllabus as the basis for a training course if the authors and the ISTQB® are acknowledged as the source and copyright owners of the syllabus and provided that any advertisement of such a training course may mention the syllabus only after official accreditation of the training materials has been received from an ISTQB®-recognized Member Board.
>
> • **Any individual or group of individuals may use this syllabus as the basis for articles and books, if the authors and the ISTQB® are acknowledged as the source and copyright owners of the syllabus.**
>
> • **Any other use of this syllabus is prohibited without first obtaining the approval in writing of the ISTQB®.**
>
> • Any ISTQB®-recognized Member Board may translate this syllabus provided they reproduce the abovementioned Copyright Notice in the translated version of the syllabus."

## 2. Örnek sınav telif maddesi (birebir)

Sample Exam A v1.7, sayfa 2 — **kelimesi kelimesine aynı yapı**:

> • **Extracts, for non-commercial use, from this document may be copied if the source is acknowledged.**
>
> • Any Accredited Training Provider may **use this sample exam in their training course** if the authors and the ISTQB® are acknowledged as the source and copyright owners of the sample exam [...]
>
> • **Any individual or group of individuals may use this sample exam in articles and books, if the authors and the ISTQB® are acknowledged as the source and copyright owners of the sample exam.**
>
> • **Any other use of this sample exam is prohibited without first obtaining the approval in writing of the ISTQB®.**
>
> • Any ISTQB®-recognized Member Board may translate this sample exam [...]

*Exam Structures & Rules* ve *Exam Tables* dokümanları da aynı 5 maddeyi taşıyor.

---

## 3. Analiz: neyi yapabiliriz, neyi yapamayız

| İşlem | Durum | Gerekçe |
|---|:---:|---|
| Bölüm başlıkları, LO kodları ve metinleri, K-seviyeleri, sınav dağılım tablosunu göstermek | ✅ | *"Extracts, for non-commercial use ... if the source is acknowledged"* — sınırlı alıntı, kaynak gösterilerek |
| Sınav mekaniğini anlatmak (40 soru / 26 puan / 60 dk) | ✅ | Olgusal bilgi; telif konusu değil |
| **Kendi yazdığımız özgün sorular** | ✅ | Türev eser değil. **Ana içerik stratejimiz budur.** |
| Resmî PDF'lere bağlantı vermek | ✅ | Bağlantı vermek kopyalama değil |
| Sözlük terimlerini göstermek | ⚠️→✅ | Muhtemelen CC BY 4.0 — §5'e bakınız, **teyit gerekli** |
| Birkaç resmî soruyu örnek olarak kaynak göstererek göstermek | ⚠️ | "Extract" savunulabilir, ama izin verilen kullanım listesinde **web sitesi yok** |
| **186 resmî örnek sorunun tamamını siteye koymak** | ❌ | "Extract" değil, dokümanın bütünü. Ayrıca izin verilen kullanımlar *akredite eğitim kursu* ve *makale/kitap* ile sınırlı |
| Reklam veya abonelik geliri | ❌ | İzin açıkça **non-commercial** ile sınırlı |
| Müfredatın tam metnini yeniden yayınlamak | ❌ | "Extract" değil |
| TTB Türkçe çevirisini kopyalamak | ❌ | Çeviri hakkı Member Board'a ait; aynı telif bildirimi geçerli |

### En büyük risk
İzin verilen kullanım biçimleri **açıkça sayılmış** (akredite eğitim sağlayıcısının kursu, makaleler ve kitaplar) ve madde şu cümleyle kapanıyor:

> *"Any other use ... is prohibited without first obtaining the approval in writing of the ISTQB®."*

**Bir pratik-sınav web uygulaması bu listede yok.** Bu, projeyi otomatik olarak yasa dışı yapmaz — kısa alıntı (LO kodları, başlıklar) savunulabilir — ama **resmî soruların toplu kullanımı savunulamaz.**

---

## 4. Alınan kararlar

### K-1 — Tüm sorular özgündür
Resmî ISTQB veya TTB örnek sınav soruları **hiçbir biçimde** (kopya, yeniden ifade, çeviri, "uyarlama") soru bankasına girmez. Veri modelinde `origin` alanının `official` değeri **yoktur**; yalnızca `original`, `adapted` (kamuya açık bir standarttan uyarlanmış senaryo), `community`.

> **"Adapted" ne demek değildir:** Resmî bir soruyu alıp sayıları değiştirmek uyarlama değil, türev eserdir. `adapted` yalnızca *ISO 29119 gibi kamuya açık bir standarttan alınan bir senaryo tanımı* gibi durumlar içindir.

### K-2 — Ticari kullanım yok
Site ücretsizdir. Reklam yok, abonelik yok, bağış düğmesi bile v1'de yok. Bu, *"for non-commercial use"* koşulunu karşılar ve telif tartışmasının ana dayanağıdır. **Bu karar değişirse tüm bu analiz yeniden yapılmalıdır.**

### K-3 — Kaynak gösterimi her yerde
- Her sayfanın altında: *"Bu proje ISTQB® ve Turkish Testing Board ile ilişkili değildir. ISTQB® tescilli bir markadır."*
- Her LO/bölüm başlığı alıntısında: *"Kaynak: ISTQB® CTFL Syllabus v4.0.1 © ISTQB®"*
- `/kaynaklar` sayfasında tüm resmî dokümanlara doğrudan bağlantı ve telif bildirimi tam metni

### K-4 — Marka kullanımı
- "ISTQB" adı **yalnızca tanımlayıcı** olarak kullanılır ("ISTQB sınavına hazırlık"), marka gibi değil.
- ISTQB veya TTB **logosu kullanılmaz**.
- Ürün adı ISTQB'yi çağrıştıran bir marka olmamalı — *"ISTQB Prep"* ismi bile riskli olabilir. **Bu, D-01 (isim kararı) için ek bir kısıttır.**
- Alan adı alınırsa "istqb" kelimesi içermemeli.

### K-5 — Yazılı izin başvurusu (paralel yürütülür)
ISTQB'ye ve TTB'ye, projenin ücretsiz ve açık kaynaklı olduğunu belirten bir izin başvurusu yapılır. Cevap beklenmeden K-1 ile geliştirmeye devam edilir; olumlu cevap gelirse resmî soruların gösterimi yeniden değerlendirilir.

### K-6 — Lisanslama
| Varlık | Lisans |
|---|---|
| Kaynak kod | **MIT** |
| Sorular, gerekçeler, çeviriler (bizim yazdıklarımız) | **CC BY-SA 4.0** |
| Alıntılanan ISTQB materyali (LO kodları, başlıklar) | © ISTQB, alıntı hakkı kapsamında |
| Sözlük terimleri | Kaynağına göre — §5 |

> **Neden CC BY-SA, CC BY-NC değil?** NC kısıtı, ISTQB'nin non-commercial koşulunu tekrarlar gibi görünse de bizim *kendi* içeriğimize uygulanır ve katkıyı caydırır. SA (share-alike) ise içeriğin dump çiftliklerine kapatılmadan alınıp kapalı bir ürüne konmasını engeller. Alternatif görüş ve bu kararın yeniden tartışılması için bkz. D-03.

---

## 5. ISTQB Glossary lisansı ⚠️

Glossary sitesinin kendi yerelleştirme dosyasında (`https://api.glossary.istqb.org/assets/translations/en_US.json`) şu footer metni bulundu:

> *"Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution 4.0 International license"*

**Doğruysa CC BY 4.0** — 1128 terimin tanımları atıf vererek, ticari olarak bile kullanılabilir. Bu, en güvenli içerik kaynağımız olur.

⚠️ **TAM DOĞRULANMADI.** Bu metin yalnızca i18n JSON'unda bulundu; Glossary bir JavaScript SPA olduğu için footer'ın canlı sayfada render edildiği teyit edilemedi, JS bundle'larında `creativecommons.org` bağlantısı bulunamadı, Wayback arşivi de yalnızca SPA kabuğunu saklamış.

> **Eylem (TODO F0-02):** Tarayıcıda `https://glossary.istqb.org/en_US/home` açılıp footer **gözle doğrulanacak** ve ekran görüntüsü `docs/kanit/` altına kaydedilecektir. Doğrulanana kadar sözlük tanımları **kendi ifademizle yeniden yazılır**, birebir kopyalanmaz.

---

## 6. Diğer hukuki maddeler

### 6.1 Kişisel veri (KVKK / GDPR)
- Sunucuya **hiçbir kişisel veri gönderilmez**. Tüm ilerleme kullanıcının cihazında (IndexedDB).
- Çerez kullanılmaz → çerez bandı gerekmez.
- Analitik kullanılacaksa çerezsiz ve IP'yi saklamayan bir sayaç seçilir (Umami / GoatCounter).
- Gizlilik politikası sayfası yine de yayımlanır: "hiçbir şey toplamıyoruz" da bir politikadır ve güven işaretidir.

### 6.2 Sorumluluk reddi
Sitede görünür şekilde:
> *"Bu platform bağımsız bir topluluk projesidir; ISTQB® veya Turkish Testing Board ile hiçbir bağlantısı yoktur, onlar tarafından onaylanmamıştır. İçerik resmî müfredata dayanılarak özgün olarak hazırlanmıştır ancak sınavda çıkacak soruları yansıtmaz. Sınav sonucunuza dair hiçbir garanti verilmez. Resmî ve güncel bilgi için istqb.org ve turkishtestingboard.org adreslerine başvurunuz."*

### 6.3 Katkı sağlayanlardan beyan
Soru katkısı kabul edilirse (Faz 4), PR şablonunda zorunlu onay kutusu:
> ☐ Bu soruyu **kendim yazdım**. Herhangi bir resmî ISTQB/TTB örnek sınavından, ücretli bir kurstan veya "dump" kaynağından kopyalamadım/uyarlamadım.

### 6.4 "Dump" karşıtı duruş
ISTQB'nin etik kuralları, gerçek sınav sorularının paylaşılmasını yasaklar. Rakiplerin bir kısmı bunu açıkça ihlal ediyor (*"Questions taken exclusively from the previous real exams"*). Bizim konumlandırmamız bunun tam tersidir ve **bu bir pazarlama avantajıdır, sadece bir kısıt değil**:

> *"Bu sitedeki hiçbir soru gerçek ISTQB sınavından alınmamıştır. Hepsi müfredattaki öğrenme hedeflerine göre sıfırdan yazılmıştır ve hangi hedefe ait olduğu her soruda yazar."*

---

## 7. Yapılacaklar kontrol listesi

- [ ] (F0-02) Glossary footer lisansını tarayıcıda gözle doğrula, ekran görüntüsü al
- [ ] (F0-03) ISTQB'ye yazılı izin e-postası gönder
- [ ] (F0-04) TTB'ye Türkçe içerik ve işbirliği için e-posta gönder
- [ ] Ürün adının ISTQB markasını çağrıştırmadığından emin ol (D-01)
- [ ] `/kaynaklar` sayfası: telif bildirimi tam metni + resmî bağlantılar
- [ ] Gizlilik politikası sayfası
- [ ] Sorumluluk reddi footer'ı
- [ ] PR şablonuna özgünlük beyanı
- [ ] `LICENSE` (MIT) + `CONTENT-LICENSE` (CC BY-SA 4.0)
