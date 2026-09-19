import { test, expect, type Page } from "@playwright/test";

/**
 * F1-15 — tam deneme akisi: ana sayfa -> kurulum -> oturum -> sonuc ->
 * inceleme. Secici olarak erisilebilir rol/ad kullanilir; boylece test
 * ayni zamanda ekran okuyucunun gordugu seyi dogrular. `data-testid`
 * eklemek bu bagi koparirdi.
 */

/** Her test temiz bir tarayici durumundan baslar: yarim deneme sizmasin. */
async function clearStorage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases?.();
    await Promise.all(
      (dbs ?? []).map(
        (info) =>
          new Promise<void>((resolve) => {
            if (!info.name) return resolve();
            const request = indexedDB.deleteDatabase(info.name);
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          }),
      ),
    );
  });
  await page.reload();
}

/** Sik denetimleri: tek secimli soruda radio, cok secimlide checkbox. */
function options(page: Page) {
  return page.getByRole("radio").or(page.getByRole("checkbox"));
}

/** Gorunen sorunun gerektirdigi kadar sik isaretler. */
async function answerCurrentQuestion(page: Page): Promise<void> {
  const checkboxes = page.getByRole("checkbox");
  const isMulti = (await checkboxes.count()) > 0;

  if (!isMulti) {
    await page.getByRole("radio").first().check();
    return;
  }

  // "HANGI IKISI" sorusu — tam olarak iki sik isaretlenir.
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
}

test.beforeEach(async ({ page }) => {
  await clearStorage(page);
});

test("ana sayfadan tam bir deneme kurulur, çözülür ve incelenir", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Deneme sınavına başla" }).click();
  await expect(page).toHaveURL(/\/deneme$/);

  await page.getByRole("button", { name: "Denemeyi başlat" }).click();
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);

  // Toplam soru sayisi meta.json'dan gelir, teste gomulmez.
  const counter = page.getByText(/^Soru 1 \/ \d+$/);
  await expect(counter).toBeVisible();
  const total = Number((await counter.innerText()).match(/\/ (\d+)$/)![1]);
  expect(total).toBeGreaterThan(0);

  for (let index = 1; index <= total; index += 1) {
    await expect(page.getByText(`Soru ${index} / ${total}`)).toBeVisible();
    await answerCurrentQuestion(page);
    if (index < total) await page.getByRole("button", { name: "Sonraki" }).click();
  }

  await page.getByRole("button", { name: "Sınavı bitir" }).click();
  await expect(page.getByText("Tüm sorular cevaplanmış.")).toBeVisible();
  await page.getByRole("button", { name: "Evet, bitir" }).click();

  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);
  await expect(page.getByRole("heading", { name: "Sonuç", level: 1 })).toBeVisible();
  // Hepsi cevaplandi: puan toplam soru sayisini asamaz ve cevapsiz sifirdir.
  await expect(page.getByText(new RegExp(`\\b\\d+ / ${total}\\b`)).first()).toBeVisible();

  await page.getByRole("link", { name: "Cevapları incele" }).click();
  await expect(page).toHaveURL(/\/inceleme\/[\w-]+$/);
  await expect(page.getByRole("heading", { name: "İnceleme", level: 1 })).toBeVisible();
  // Urunun ana farklilastiricisi: sik sik gerekce her soruda gorunur.
  await expect(page.getByText("Şık şık gerekçe").first()).toBeVisible();
});

test("yarim kalan deneme ana sayfadan kaldigi yerden surer", async ({ page }) => {
  await page.getByRole("link", { name: "Deneme sınavına başla" }).click();
  await page.getByRole("button", { name: "Denemeyi başlat" }).click();
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);

  await answerCurrentQuestion(page);
  await page.getByRole("button", { name: "Sonraki" }).click();
  await expect(page.getByText(/^Soru 2 \/ \d+$/)).toBeVisible();
  const sessionUrl = page.url();

  await page.goto("/");
  await expect(page.getByText("Yarım kalan denemen var")).toBeVisible();
  await page.getByRole("link", { name: "Devam et" }).click();

  await expect(page).toHaveURL(sessionUrl);

  // Tam yenileme: durum bellekten degil IndexedDB'den geri gelir, yani
  // cevabin gercekten diske yazildigi dogrulanmis olur.
  await page.reload();

  // Yarim kalan deneme ILK CEVAPSIZ sorudan devam eder (resumeAttempt);
  // 1. soruyu cevapladigimiz icin 2. sorudan acilmasi beklenir.
  await expect(page.getByText(/^Soru 2 \/ \d+$/)).toBeVisible();

  await page.getByRole("button", { name: "Önceki" }).click();
  await expect(page.getByText(/^Soru 1 \/ \d+$/)).toBeVisible();
  await expect(options(page).first()).toBeChecked();
});

test("soru dili degistiginde isaretli cevap korunur", async ({ page }) => {
  await page.getByRole("link", { name: "Deneme sınavına başla" }).click();
  await page.getByRole("button", { name: "Denemeyi başlat" }).click();
  // Kurulum ekraninda da radio var (sure ve dil secimi) ve React Router
  // yeni ekran yuklenene kadar onu ekranda tutuyor. Once oturuma gectigimizi
  // dogrulamazsak `.check()` yanlislikla sure radiosuna basabiliyor.
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);
  await expect(page.getByText(/^Soru 1 \/ \d+$/)).toBeVisible();

  const first = options(page).first();
  await first.check();

  // Dil degisikligi SORU METNINDEN okunur, siktan degil: sayisal siklari
  // olan sorularda ("19", "%67") iki dilin sik metni ayni oluyor.
  const stem = page.locator(".prose-question").first();
  const trStem = await stem.innerText();

  // Butonun erisilebilir adi sr-only metindir; "EN" rozeti aria-hidden.
  await page.getByRole("button", { name: "İngilizce göster" }).click();
  await expect(stem).not.toHaveText(trStem);

  await expect(options(page).first()).toBeChecked();
});
