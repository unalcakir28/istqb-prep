/**
 * data/ -> public/data/ kopyalar.
 *
 * Kaynak veri `data/` altinda tutulur ve Git'te gozden gecirilir; tarayiciya
 * servis edilen kopya `public/data/` altindadir ve .gitignore'dadir
 * (docs/05-teknik-mimari.md §3). Iki yerde ayni JSON'u elle tutmak yerine
 * dev ve build oncesi kopyalanir.
 *
 * Kullanim:  yarn sync:data   (predev ve prebuild'den otomatik calisir)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "data");
const TARGET = path.join(ROOT, "public", "data");

function main(): void {
  if (!fs.existsSync(SOURCE)) {
    console.error("HATA: data/ dizini yok.");
    process.exit(1);
  }

  // Silinen bir soru parcasi public/ altinda kalmasin diye once temizlenir.
  fs.rmSync(TARGET, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.cpSync(SOURCE, TARGET, { recursive: true });

  const count = fs
    .readdirSync(TARGET, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile()).length;

  console.log(`data/ -> public/data/ (${count} dosya)`);
}

main();
