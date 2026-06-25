# MongoDB Base64 Image Cleanup Runbook + Hardening Plan

Dokumen ini menggabungkan:
- plan hardening exact
- migrasi cleanup exact
- runbook backup → verify → cleanup → verify → restore
- checklist `mongosh` copy-paste

Target utama:
- admin upload full `file-only`
- backend blok base64 baru
- cleanup base64 lama dari MongoDB
- UI admin tidak lagi menampilkan `data:image/...`

---

## 1. Plan Exact, No Eksekusi

### 1. UI hardening — admin file-only penuh

#### `frontend/src/pages/Admin/components/ui/index.tsx`
- tambah mode `fileOnly`
- saat `fileOnly=true`:
  - sembunyikan textarea URL di area uploader
  - jangan expose/persist `data:image/...` ke `value`
  - preview pakai thumbnail saja
  - kalau user pilih file, simpan `File` untuk upload + preview URL lokal

#### Pakai `fileOnly` di:
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx`
- `frontend/src/pages/Admin/pages/ProfilePage.tsx`
- `frontend/src/pages/Admin/pages/HomePage.tsx`

---

### 2. Backend validator — blok base64 baru

#### `backend/services/media.py`
Tambahkan helper:
- `is_data_image_url(value: str) -> bool`
- `is_allowed_image_reference(value: str) -> bool`

Rule:
- allow:
  - `""`
  - `/uploads/...`
  - `http://...`
  - `https://...`
- deny:
  - `data:image/...`
  - base64 blob mentah

#### `backend/routes/project_routes.py`
- validate `images` di create/update

#### `backend/routes/settings_routes.py`
- validate `profile.avatar`
- validate `home.lanyardImage`

---

### 3. Migrasi exact — collection `projects`

Target field:
- `images`

Rule:
- kalau item array mulai `data:image/` → buang
- kalau item bukan URL valid `/uploads/...` atau `http(s)://...` → buang
- sisakan hanya URL valid

Query identifikasi:
```javascript
db.projects.find({
  images: { $elemMatch: { $regex: "^data:image/" } }
})
```

Query cleanup konsep:
- ambil doc satu-satu
- filter `images`
- update hasil akhir

Hasil:
- project bisa jadi `images: []`
- atau tetap punya URL valid saja

---

### 4. Migrasi exact — collection `settings` profile

Target doc:
```javascript
{ key: "profile" }
```

Target field:
- `value.avatar`

Query identifikasi:
```javascript
db.settings.find({
  key: "profile",
  "value.avatar": { $regex: "^data:image/" }
})
```

Query cleanup konsep:
```javascript
db.settings.updateOne(
  { key: "profile", "value.avatar": { $regex: "^data:image/" } },
  { $set: { "value.avatar": "" } }
)
```

---

### 5. Migrasi exact — collection `settings` home

Target doc:
```javascript
{ key: "home" }
```

Target field:
- `value.lanyardImage`

Query identifikasi:
```javascript
db.settings.find({
  key: "home",
  "value.lanyardImage": { $regex: "^data:image/" }
})
```

Query cleanup konsep:
```javascript
db.settings.updateOne(
  { key: "home", "value.lanyardImage": { $regex: "^data:image/" } },
  { $set: { "value.lanyardImage": "" } }
)
```

---

### 6. Frontend save-flow hardening

#### `frontend/src/pages/Admin/pages/ProjectsPage.tsx`
- save jangan pernah fallback kirim preview/base64
- kalau upload file gagal, stop save
- kalau edit tanpa file baru, kirim URL lama saja

#### `frontend/src/pages/Admin/pages/ProfilePage.tsx`
- kalau avatar file baru ada, upload dulu
- kalau gagal, jangan patch profile

#### `frontend/src/pages/Admin/pages/HomePage.tsx`
- kalau lanyard file baru ada, upload dulu
- kalau gagal, jangan patch home

---

### 7. Urutan implementasi paling aman
1. backend validator
2. frontend file-only UI
3. frontend save-flow guard
4. migrasi cleanup DB
5. manual retest admin upload

---

### 8. Manual verifikasi setelah nanti eksekusi
- tambah project + 1 cover + 2 gallery
- edit project tanpa ganti file
- edit project dengan ganti file
- upload avatar
- upload lanyard
- pastikan UI tidak pernah tampil `data:image/...`
- pastikan Mongo tidak lagi punya field base64

---

## 2. Runbook Aman

Runbook ini untuk membersihkan data image base64 lama dari MongoDB dengan alur aman:
- backup
- verify backup
- cleanup
- verify cleanup
- restore bila perlu

Target field:
- `projects.images[]`
- `settings.value.avatar` untuk `key: "profile"`
- `settings.value.lanyardImage` untuk `key: "home"`

Aturan cleanup:
- hapus semua string yang diawali `data:image/`
- sisakan hanya path `/uploads/...` atau URL `http(s)://...`
- untuk `profile.avatar` dan `home.lanyardImage`, jika masih base64 maka set `""`

---

## 3. Runbook Langkah-per-Langkah

### 1. Backup
1. connect ke Mongo shell / mongosh
2. cek DB aktif:
   ```javascript
   db.getName()
   ```
3. buat collection backup
4. backup project terdampak
5. backup settings `profile` + `home` terdampak

### 2. Verify backup
1. hitung jumlah doc sumber terdampak
2. bandingkan dengan jumlah doc backup
3. sample 1–2 doc backup, pastikan field `document` utuh

### 3. Cleanup
1. jalankan cleanup `projects.images`
2. jalankan cleanup `profile.avatar`
3. jalankan cleanup `home.lanyardImage`

### 4. Verify cleanup
1. pastikan count base64 sisa = 0
2. spot check:
   - 2–3 project random
   - doc `profile`
   - doc `home`
3. cek frontend nanti:
   - project image tampil
   - profile avatar tampil / kosong
   - lanyard tampil / kosong

### 5. Restore
1. kalau ada masalah, restore per collection dari backup
2. restore project dari backup
3. restore settings dari backup
4. verify lagi count base64 balik sesuai backup bila rollback penuh dibutuhkan

---

## 4. Checklist Mongosh Copy-Paste

```javascript
// 0) Optional: pilih DB dulu kalau belum
// use portfolio_new

// 1) Verify DB aktif
db.getName()

// 2) Count doc terdampak sebelum backup
db.projects.countDocuments({
  images: { $elemMatch: { $regex: "^data:image/", $options: "i" } }
})

db.settings.countDocuments({
  key: "profile",
  "value.avatar": { $regex: "^data:image/", $options: "i" }
})

db.settings.countDocuments({
  key: "home",
  "value.lanyardImage": { $regex: "^data:image/", $options: "i" }
})

// 3) Backup collection
db.createCollection("projects_backup_before_image_cleanup")
db.createCollection("settings_backup_before_image_cleanup")

// 4) Backup projects terdampak
db.projects.find({
  images: { $elemMatch: { $regex: "^data:image/", $options: "i" } }
}).forEach((doc) => {
  db.projects_backup_before_image_cleanup.insertOne({
    backupAt: new Date().toISOString(),
    sourceId: doc._id,
    sourceCollection: "projects",
    document: doc
  });
});

// 5) Backup settings terdampak
db.settings.find({
  $or: [
    { key: "profile", "value.avatar": { $regex: "^data:image/", $options: "i" } },
    { key: "home", "value.lanyardImage": { $regex: "^data:image/", $options: "i" } }
  ]
}).forEach((doc) => {
  db.settings_backup_before_image_cleanup.insertOne({
    backupAt: new Date().toISOString(),
    sourceId: doc._id,
    sourceCollection: "settings",
    document: doc
  });
});

// 6) Verify backup count
db.projects_backup_before_image_cleanup.countDocuments()
db.settings_backup_before_image_cleanup.countDocuments()

// 7) Spot check backup sample
db.projects_backup_before_image_cleanup.findOne()
db.settings_backup_before_image_cleanup.findOne()

// 8) Cleanup projects.images
db.projects.find({
  images: { $exists: true, $type: "array" }
}).forEach((doc) => {
  const nextImages = (doc.images || []).filter((value) => {
    if (typeof value !== "string") return false;
    if (/^data:image\//i.test(value)) return false;
    if (/^\/uploads\//i.test(value)) return true;
    if (/^https?:\/\//i.test(value)) return true;
    return false;
  });

  if (JSON.stringify(nextImages) !== JSON.stringify(doc.images || [])) {
    db.projects.updateOne(
      { _id: doc._id },
      {
        $set: {
          images: nextImages,
          updatedAt: new Date().toISOString()
        }
      }
    );
  }
});

// 9) Cleanup profile.avatar
db.settings.updateMany(
  {
    key: "profile",
    "value.avatar": { $regex: "^data:image/", $options: "i" }
  },
  {
    $set: {
      "value.avatar": "",
      updatedAt: new Date().toISOString()
    }
  }
)

// 10) Cleanup home.lanyardImage
db.settings.updateMany(
  {
    key: "home",
    "value.lanyardImage": { $regex: "^data:image/", $options: "i" }
  },
  {
    $set: {
      "value.lanyardImage": "",
      updatedAt: new Date().toISOString()
    }
  }
)

// 11) Verify akhir: harus 0
db.projects.countDocuments({
  images: { $elemMatch: { $regex: "^data:image/", $options: "i" } }
})

db.settings.countDocuments({
  key: "profile",
  "value.avatar": { $regex: "^data:image/", $options: "i" }
})

db.settings.countDocuments({
  key: "home",
  "value.lanyardImage": { $regex: "^data:image/", $options: "i" }
})

// 12) Spot check hasil
db.projects.find(
  {},
  { id: 1, title: 1, images: 1 }
).limit(5)

db.settings.findOne(
  { key: "profile" },
  { key: 1, "value.avatar": 1 }
)

db.settings.findOne(
  { key: "home" },
  { key: 1, "value.lanyardImage": 1 }
)

// 13) Full restore projects kalau rollback
db.projects_backup_before_image_cleanup.find().forEach((backup) => {
  db.projects.replaceOne(
    { _id: backup.document._id },
    backup.document,
    { upsert: true }
  );
});

// 14) Full restore settings kalau rollback
db.settings_backup_before_image_cleanup.find().forEach((backup) => {
  db.settings.replaceOne(
    { _id: backup.document._id },
    backup.document,
    { upsert: true }
  );
});
```

---

## 5. Rule Operasi

- stop kalau count backup tidak masuk akal
- stop kalau sample backup kosong
- cleanup jalan hanya setelah backup verified
- jalankan di maintenance window kalau bisa
- setelah cleanup, cek UI admin dan halaman publik untuk memastikan image tampil normal atau kosong sesuai hasil cleanup
