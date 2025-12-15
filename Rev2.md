
# Rekomendasi Aplikasi (Updated with Full Queries & API Design)

## 1. Query Nyata untuk Tabel `pipeline_potensi`

### Ambil Semua Pipeline
```sql
SELECT 
  p.id,
  s.code AS sbu_code,
  c.name AS customer_name,
  p.nama_layanan,
  p.est_revenue,
  p.current_status,
  p.warna_status_potensi,
  p.periode_snapshot
FROM pipeline_potensi p
LEFT JOIN master_sbu s ON p.sbu_id = s.id
LEFT JOIN master_customer c ON p.customer_id = c.id
ORDER BY p.updated_at DESC;
```

### Insert Pipeline Baru
```sql
INSERT INTO pipeline_potensi 
(sbu_id, customer_id, nama_layanan, est_revenue, warna_status_potensi, current_status, periode_snapshot)
VALUES ($1,$2,$3,$4,$5,$6,$7)
RETURNING id;
```

### Filter Pipeline per SBU
```sql
SELECT * FROM pipeline_potensi WHERE sbu_id = $1;
```

### Filter Pipeline per Warna Status
```sql
SELECT * FROM pipeline_potensi WHERE warna_status_potensi = $1;
```

---

## 2. Query Nyata untuk Revenue

### Target Revenue Tahunan
```sql
SELECT 
  year,
  s.code AS sbu_code,
  kategori,
  target_amount
FROM revenue_target_yearly r
LEFT JOIN master_sbu s ON s.id = r.sbu_id
WHERE year = $1;
```

### Revenue Aktual per Bulan
```sql
SELECT 
  t.year,
  t.month,
  s.code AS sbu_code,
  a.type_pendapatan,
  a.amount
FROM revenue_actual_monthly a
JOIN master_time_month t ON t.id = a.time_month_id
LEFT JOIN master_sbu s ON s.id = a.sbu_id
WHERE t.year = $1 AND t.month = $2;
```

### Total Revenue Year-to-Date
```sql
SELECT 
  SUM(a.amount) AS total_ytd
FROM revenue_actual_monthly a
JOIN master_time_month t ON t.id = a.time_month_id
WHERE t.year = $1;
```

---

## 3. Mapping Field Excel → API → Form

| Excel Column | API Field | Form Field | DB Column |
|--------------|-----------|------------|-----------|
| SBU | `sbuId` | Dropdown | `sbu_id` |
| Customer | `customerId` | Input / Dropdown | `customer_id` |
| Nama Layanan | `namaLayanan` | Text input | `nama_layanan` |
| Est Revenue | `estRevenue` | Number field | `est_revenue` |
| Warna Status | `warnaStatus` | Select (Hijau/Kuning/Merah) | `warna_status_potensi` |
| Status | `currentStatus` | Select | `current_status` |
| Periode Snapshot | `periodeSnapshot` | Auto (Today) | `periode_snapshot` |

---

## 4. API Endpoint Lanjutan

### GET `/api/pipeline?month=&sbu=&status=`
Filter pipeline secara fleksibel.

### GET `/api/revenue/summary?year=2025`
Return format:
```json
{
  "target": 1000000000,
  "actual": 745000000,
  "percentage": 74.5
}
```

### GET `/api/revenue/monthly?year=2025&month=2`
Monthly revenue breakdown.

### GET `/api/dashboard/full`
Mengembalikan:
- Target tahunan
- Realisasi YTD
- Pipeline by color (Hijau, Kuning, Merah)
- 3 pelanggan terbesar
- Tren 12 bulan

---

## 5. Contoh Route Handler Next.js

### `/app/api/pipeline/route.ts`
```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sbu = searchParams.get("sbu");
  const status = searchParams.get("status");

  let sql = "SELECT * FROM pipeline_potensi WHERE 1=1";
  const params: any[] = [];

  if (sbu) {
    sql += " AND sbu_id = $1";
    params.push(Number(sbu));
  }

  if (status) {
    sql += params.length ? " AND warna_status_potensi = $" + (params.length+1)
                         : " AND warna_status_potensi = $1";
    params.push(status);
  }

  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const sql = `
    INSERT INTO pipeline_potensi 
    (sbu_id, customer_id, nama_layanan, est_revenue, warna_status_potensi, current_status, periode_snapshot)
    VALUES ($1,$2,$3,$4,$5,$6,NOW())
    RETURNING id;
  `;

  const params = [
    body.sbuId,
    body.customerId,
    body.namaLayanan,
    body.estRevenue,
    body.warnaStatus,
    body.currentStatus,
  ];

  const result = await query(sql, params);
  return NextResponse.json({ id: result[0].id });
}
```

---

## 6. Tambahan Query Filtering

### Filter By Segment PLN Group
```sql
SELECT 
  p.*, seg.name AS segmen
FROM pipeline_potensi p
JOIN master_customer c ON c.id = p.customer_id
JOIN master_segment_pln_group seg ON seg.id = c.pln_group_segment_id
WHERE seg.code = $1;
```

### Filter By Industri
```sql
SELECT p.* 
FROM pipeline_potensi p
JOIN master_customer c ON p.customer_id = c.id
WHERE c.segment_industri = $1;
```

---

## 7. Integrasi Dashboard

### Dashboard API Query
```sql
SELECT 
  (SELECT SUM(target_amount) FROM revenue_target_yearly WHERE year = $1) AS target,
  (SELECT SUM(a.amount) 
   FROM revenue_actual_monthly a 
   JOIN master_time_month t ON t.id = a.time_month_id 
   WHERE t.year = $1) AS actual,
  (SELECT SUM(est_revenue) FROM pipeline_potensi WHERE warna_status_potensi = 'HIJAU') AS pipeline_most_likely;
```

---

## 8. Instruksi ke AI Coder Lain

1. Gunakan semua query di atas sebagai *source of truth*.
2. Pastikan endpoint API membaca parameter (year, month, sbu, segment).
3. Gunakan **Next.js Route Handlers** (`route.ts`) untuk seluruh API.
4. Koneksi database wajib melalui `lib/db.ts`.
5. Semua form input mengikuti mapping Excel → API → DB.


## 9. Desain API Lengkap (Next.js Route Handlers)

> Catatan: Semua contoh kode menggunakan:
> - **Next.js 15 App Router**
> - **Route Handlers** (`app/api/**/route.ts`)
> - Helper database `query()` dari `lib/db.ts`
> - Response JSON dengan pola sederhana: langsung mengembalikan array/objek (tanpa wrapper `data`)

---

### 9.1. Konvensi Umum

- Base URL API: relatif ke aplikasi Next.js, misalnya:
  - `GET /api/pipeline`
  - `POST /api/pipeline`
- Error handling:
  - Gunakan `NextResponse.json({ message: "error message" }, { status: 400/500 })`
- Semua endpoint:
  - Hanya menerima/return **JSON**
  - Tidak melakukan formatting angka (format dilakukan di frontend)

---

### 9.2. API Master Data

#### 9.2.1. Master Region

**Route:**

- `GET /api/master/region` → list region
- `POST /api/master/region` → create region
- `GET /api/master/region/[id]` → detail region
- `PUT /api/master/region/[id]` → update region
- `DELETE /api/master/region/[id]` → soft/hard delete (disarankan set `is_active = false`)

**Struktur data (TypeScript):**

```ts
export interface Region {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}
```

**`app/api/master/region/route.ts`:**

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const rows = await query<{
    id: number;
    code: string;
    name: string;
    is_active: boolean;
  }>("SELECT id, code, name, is_active FROM master_region ORDER BY code");

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.code || !body.name) {
    return NextResponse.json(
      { message: "code dan name wajib diisi" },
      { status: 400 }
    );
  }

  const sql = `
    INSERT INTO master_region (code, name, is_active)
    VALUES ($1, $2, COALESCE($3, TRUE))
    RETURNING id, code, name, is_active
  `;
  const params = [body.code, body.name, body.is_active];

  const rows = await query(sql, params);
  return NextResponse.json(rows[0]);
}
```

**`app/api/master/region/[id]/route.ts`:**

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const id = Number(params.id);
  const rows = await query(
    "SELECT id, code, name, is_active FROM master_region WHERE id = $1",
    [id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ message: "Region tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(req: Request, { params }: Params) {
  const id = Number(params.id);
  const body = await req.json();

  const sql = `
    UPDATE master_region
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           is_active = COALESCE($3, is_active)
     WHERE id = $4
     RETURNING id, code, name, is_active
  `;
  const values = [body.code ?? null, body.name ?? null, body.is_active ?? null, id];

  const rows = await query(sql, values);
  if (rows.length === 0) {
    return NextResponse.json({ message: "Region tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const id = Number(params.id);
  // soft delete: set is_active = false
  const rows = await query(
    "UPDATE master_region SET is_active = FALSE WHERE id = $1 RETURNING id",
    [id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ message: "Region tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

#### 9.2.2. Master SBU, Customer, Service Category, Time Month

- Pola API **sama** dengan Region:
  - `GET /api/master/sbu`
  - `POST /api/master/sbu`
  - `GET /api/master/sbu/[id]`
  - `PUT /api/master/sbu/[id]`
  - `DELETE /api/master/sbu/[id]`
- Hanya berbeda di nama tabel dan kolom:
  - `master_sbu` → `code`, `name`, `region_id`, `is_active`
  - `master_customer` → `name`, `segment_industri`, `status_pelanggan`, `pln_group_segment_id`, `alamat`, `is_active`
  - `master_service_category` → `code`, `name`, `level`, `parent_id`
  - `master_time_month` → `year`, `month`, `month_name`, `start_date`, `end_date`

AI Coder dapat men-*generate* file `route.ts` yang identik strukturnya dengan contoh Region di atas.

---

### 9.3. API Pipeline (Potensi)

#### 9.3.1. Endpoint

- `GET /api/pipeline`
  - Query params (opsional):
    - `sbu` (id SBU)
    - `status` (warna_status_potensi: HIJAU/KUNING/MERAH)
    - `year` (tahun dari `periode_snapshot`)
    - `month` (bulan dari `periode_snapshot`)
- `POST /api/pipeline`
  - Body JSON: data potensi baru.
- `GET /api/pipeline/[id]`
  - Detail satu potensi.
- `PUT /api/pipeline/[id]`
  - Update potensi.
- `DELETE /api/pipeline/[id]`
  - Soft delete (direkomendasikan menambah kolom `is_deleted` jika diperlukan).

#### 9.3.2. Struktur Request/Response

**Request `POST /api/pipeline`:**

```json
{
  "sbuId": 1,
  "customerId": 10,
  "jenisLayanan": "Connectivity",
  "serviceCategoryId": 2,
  "serviceCategory2Id": 5,
  "segmentIndustri": "Distribusi",
  "b2bFlag": "B2B",
  "typePendapatan": "NR",
  "namaLayanan": "Fiber Optic Backbone",
  "kapasitas": "10 Gbps",
  "satuanKapasitas": "Mbps",
  "originating": "GI X",
  "terminating": "GI Y",
  "nilaiOtc": 100000000,
  "nilaiMrc": 5000000,
  "estRevenue": 160000000,
  "mappingRevenue": 160000000,
  "sumberAnggaran": "CAPEX",
  "fungsi": "Distribusi",
  "noInvoice": null,
  "warnaStatusPotensi": "HIJAU",
  "currentStatus": "Proses BA"
}
```

**Response `GET /api/pipeline`:**

```json
[
  {
    "id": 1,
    "sbuCode": "JKB",
    "customerName": "PLN UID JBB",
    "namaLayanan": "Fiber Optic Backbone",
    "estRevenue": 160000000,
    "currentStatus": "Proses BA",
    "warnaStatusPotensi": "HIJAU",
    "periodeSnapshot": "2025-08-01"
  }
]
```

#### 9.3.3. `app/api/pipeline/route.ts` (Full)

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sbu = searchParams.get("sbu");
  const status = searchParams.get("status");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let sql = `
    SELECT 
      p.id,
      s.code AS "sbuCode",
      c.name AS "customerName",
      p.nama_layanan AS "namaLayanan",
      p.est_revenue AS "estRevenue",
      p.current_status AS "currentStatus",
      p.warna_status_potensi AS "warnaStatusPotensi",
      p.periode_snapshot AS "periodeSnapshot"
    FROM pipeline_potensi p
    LEFT JOIN master_sbu s ON p.sbu_id = s.id
    LEFT JOIN master_customer c ON p.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (sbu) {
    params.push(Number(sbu));
    sql += ` AND p.sbu_id = $${params.length}`;
  }

  if (status) {
    params.push(status);
    sql += ` AND p.warna_status_potensi = $${params.length}`;
  }

  if (year) {
    params.push(Number(year));
    sql += ` AND EXTRACT(YEAR FROM p.periode_snapshot) = $${params.length}`;
  }

  if (month) {
    params.push(Number(month));
    sql += ` AND EXTRACT(MONTH FROM p.periode_snapshot) = $${params.length}`;
  }

  sql += " ORDER BY p.updated_at DESC";

  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.sbuId || !body.customerId || !body.namaLayanan || !body.estRevenue || !body.warnaStatusPotensi) {
    return NextResponse.json(
      { message: "sbuId, customerId, namaLayanan, estRevenue, warnaStatusPotensi wajib diisi" },
      { status: 400 }
    );
  }

  const sql = `
    INSERT INTO pipeline_potensi
    (
      sbu_id,
      customer_id,
      jenis_layanan,
      service_category_id,
      service_category2_id,
      segment_industri,
      b2b_flag,
      type_pendapatan,
      nama_layanan,
      kapasitas,
      satuan_kapasitas,
      originating,
      terminating,
      nilai_otc,
      nilai_mrc,
      est_revenue,
      mapping_revenue,
      sumber_anggaran,
      fungsi,
      no_invoice,
      warna_status_potensi,
      current_status,
      periode_snapshot
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
      $14,$15,$16,$17,$18,$19,$20,$21,$22, NOW()
    )
    RETURNING id
  `;

  const params = [
    body.sbuId,
    body.customerId,
    body.jenisLayanan ?? null,
    body.serviceCategoryId ?? null,
    body.serviceCategory2Id ?? null,
    body.segmentIndustri ?? null,
    body.b2bFlag ?? null,
    body.typePendapatan ?? null,
    body.namaLayanan,
    body.kapasitas ?? null,
    body.satuanKapasitas ?? null,
    body.originating ?? null,
    body.terminating ?? null,
    body.nilaiOtc ?? null,
    body.nilaiMrc ?? null,
    body.estRevenue,
    body.mappingRevenue ?? null,
    body.sumberAnggaran ?? null,
    body.fungsi ?? null,
    body.noInvoice ?? null,
    body.warnaStatusPotensi,
    body.currentStatus ?? null,
  ];

  const rows = await query(sql, params);
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
```

#### 9.3.4. `app/api/pipeline/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  const id = Number(params.id);
  const rows = await query(
    `
    SELECT 
      p.*,
      s.code AS "sbuCode",
      c.name AS "customerName"
    FROM pipeline_potensi p
    LEFT JOIN master_sbu s ON p.sbu_id = s.id
    LEFT JOIN master_customer c ON p.customer_id = c.id
    WHERE p.id = $1
    `,
    [id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ message: "Pipeline tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function PUT(req: Request, { params }: Params) {
  const id = Number(params.id);
  const body = await req.json();

  const sql = `
    UPDATE pipeline_potensi
       SET sbu_id = COALESCE($1, sbu_id),
           customer_id = COALESCE($2, customer_id),
           nama_layanan = COALESCE($3, nama_layanan),
           est_revenue = COALESCE($4, est_revenue),
           warna_status_potensi = COALESCE($5, warna_status_potensi),
           current_status = COALESCE($6, current_status),
           updated_at = NOW()
     WHERE id = $7
     RETURNING id
  `;
  const paramsSql = [
    body.sbuId ?? null,
    body.customerId ?? null,
    body.namaLayanan ?? null,
    body.estRevenue ?? null,
    body.warnaStatusPotensi ?? null,
    body.currentStatus ?? null,
    id,
  ];

  const rows = await query(sql, paramsSql);
  if (rows.length === 0) {
    return NextResponse.json({ message: "Pipeline tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ id });
}

export async function DELETE(_req: Request, { params }: Params) {
  const id = Number(params.id);
  const rows = await query("DELETE FROM pipeline_potensi WHERE id = $1 RETURNING id", [id]);
  if (rows.length === 0) {
    return NextResponse.json({ message: "Pipeline tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

---

### 9.4. API Revenue Target & Actual

#### 9.4.1. Endpoint

- `GET /api/revenue/target/yearly?year=2025`
- `POST /api/revenue/target/yearly`
- `GET /api/revenue/target/monthly?year=2025&sbu=1`
- `POST /api/revenue/target/monthly`
- `GET /api/revenue/actual/monthly?year=2025&month=1&sbu=1`
- `POST /api/revenue/actual/monthly`

#### 9.4.2. `app/api/revenue/target/yearly/route.ts`

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  const sql = `
    SELECT 
      r.id,
      r.year,
      s.code AS "sbuCode",
      r.kategori,
      r.target_amount AS "targetAmount"
    FROM revenue_target_yearly r
    LEFT JOIN master_sbu s ON r.sbu_id = s.id
    WHERE r.year = $1
    ORDER BY s.code, r.kategori
  `;
  const rows = await query(sql, [year]);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  const sql = `
    INSERT INTO revenue_target_yearly (year, sbu_id, kategori, target_amount)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (year, sbu_id, kategori)
    DO UPDATE SET target_amount = EXCLUDED.target_amount
    RETURNING id
  `;
  const params = [body.year, body.sbuId, body.kategori, body.targetAmount];

  const rows = await query(sql, params);
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
```

#### 9.4.3. `app/api/revenue/actual/monthly/route.ts`

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const sbuId = searchParams.get("sbu") ? Number(searchParams.get("sbu")) : null;

  let sql = `
    SELECT 
      t.year,
      t.month,
      s.code AS "sbuCode",
      a.type_pendapatan AS "typePendapatan",
      a.amount
    FROM revenue_actual_monthly a
    JOIN master_time_month t ON t.id = a.time_month_id
    LEFT JOIN master_sbu s ON s.id = a.sbu_id
    WHERE t.year = $1
  `;
  const params: any[] = [year];

  if (month) {
    params.push(month);
    sql += ` AND t.month = $${params.length}`;
  }

  if (sbuId) {
    params.push(sbuId);
    sql += ` AND a.sbu_id = $${params.length}`;
  }

  sql += " ORDER BY t.month, s.code";

  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();

  const sqlFindMonth = `
    SELECT id FROM master_time_month
    WHERE year = $1 AND month = $2
  `;
  const monthRows = await query(sqlFindMonth, [body.year, body.month]);
  if (monthRows.length === 0) {
    return NextResponse.json(
      { message: "master_time_month untuk year & month tersebut belum ada" },
      { status: 400 }
    );
  }
  const timeMonthId = monthRows[0].id;

  const sql = `
    INSERT INTO revenue_actual_monthly
    (time_month_id, sbu_id, type_pendapatan, amount, source_reference, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (time_month_id, sbu_id, type_pendapatan)
    DO UPDATE SET amount = EXCLUDED.amount,
                  source_reference = EXCLUDED.source_reference,
                  notes = EXCLUDED.notes
    RETURNING id
  `;
  const params = [
    timeMonthId,
    body.sbuId,
    body.typePendapatan,
    body.amount,
    body.sourceReference ?? null,
    body.notes ?? null,
  ];

  const rows = await query(sql, params);
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
```

---

### 9.5. API Dashboard

#### 9.5.1. Endpoint

- `GET /api/dashboard/summary?year=2025`
  - Return: target vs actual vs pipeline most likely.
- `GET /api/dashboard/full?year=2025`
  - Return:
    - Target tahunan
    - Realisasi YTD
    - Pipeline (HIJAU/KUNING/MERAH)
    - Top N pelanggan berdasarkan est_revenue
    - Revenue bulanan (untuk grafik)

#### 9.5.2. `app/api/dashboard/summary/route.ts` (Final)

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  const rows = await query<{
    target: string | number | null;
    actual: string | number | null;
    pipeline_most_likely: string | number | null;
  }>(
    `
    SELECT 
      COALESCE((
        SELECT SUM(target_amount) FROM revenue_target_yearly WHERE year = $1
      ), 0) AS target,
      COALESCE((
        SELECT SUM(a.amount)
        FROM revenue_actual_monthly a
        JOIN master_time_month t ON t.id = a.time_month_id
        WHERE t.year = $1
      ), 0) AS actual,
      COALESCE((
        SELECT SUM(est_revenue)
        FROM pipeline_potensi
        WHERE warna_status_potensi = 'HIJAU'
      ), 0) AS pipeline_most_likely
    `,
    [year]
  );

  const row = rows[0];

  const target = Number(row.target ?? 0);
  const actual = Number(row.actual ?? 0);
  const pipelineMostLikely = Number(row.pipeline_most_likely ?? 0);

  return NextResponse.json({
    year,
    targetYearly: target,
    realizationYearly: actual,
    pipelineMostLikely,
    achievementPct: target > 0 ? (actual / target) * 100 : 0,
  });
}
```

#### 9.5.3. `app/api/dashboard/full/route.ts` (Contoh)

```ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  const [summary] = await query(
    `
    SELECT 
      COALESCE((
        SELECT SUM(target_amount) FROM revenue_target_yearly WHERE year = $1
      ), 0) AS target,
      COALESCE((
        SELECT SUM(a.amount)
        FROM revenue_actual_monthly a
        JOIN master_time_month t ON t.id = a.time_month_id
        WHERE t.year = $1
      ), 0) AS actual
    `,
    [year]
  );

  const pipelineColors = await query(
    `
    SELECT warna_status_potensi AS color,
           SUM(est_revenue) AS value
    FROM pipeline_potensi
    WHERE EXTRACT(YEAR FROM periode_snapshot) = $1
    GROUP BY warna_status_potensi
    `,
    [year]
  );

  const topCustomers = await query(
    `
    SELECT c.name AS "customerName",
           SUM(p.est_revenue) AS "totalEstRevenue"
    FROM pipeline_potensi p
    JOIN master_customer c ON c.id = p.customer_id
    WHERE EXTRACT(YEAR FROM p.periode_snapshot) = $1
    GROUP BY c.name
    ORDER BY SUM(p.est_revenue) DESC
    LIMIT 5
    `,
    [year]
  );

  const monthly = await query(
    `
    SELECT 
      t.month,
      SUM(CASE WHEN a.type_pendapatan = 'NR' THEN a.amount ELSE 0 END) AS "nr",
      SUM(CASE WHEN a.type_pendapatan = 'CO' THEN a.amount ELSE 0 END) AS "co"
    FROM revenue_actual_monthly a
    JOIN master_time_month t ON t.id = a.time_month_id
    WHERE t.year = $1
    GROUP BY t.month
    ORDER BY t.month
    `,
    [year]
  );

  return NextResponse.json({
    year,
    targetYearly: Number(summary.target ?? 0),
    realizationYearly: Number(summary.actual ?? 0),
    pipelineByColor: pipelineColors.map((r: any) => ({
      color: r.color,
      value: Number(r.value ?? 0),
    })),
    topCustomers: topCustomers.map((r: any) => ({
      customerName: r.customerName,
      totalEstRevenue: Number(r.totalEstRevenue ?? 0),
    })),
    monthly: monthly.map((r: any) => ({
      month: r.month,
      nr: Number(r.nr ?? 0),
      co: Number(r.co ?? 0),
    })),
  });
}
```

---

### 9.6. Checklist Implementasi untuk AI Coder

1. **Pastikan schema database** sudah dibuat di PostgreSQL sesuai DDL.
2. Implementasikan `lib/db.ts` dengan `pg.Pool` seperti contoh sebelumnya.
3. Buat folder API:
   - `app/api/master/region`
   - `app/api/master/sbu`
   - `app/api/master/customer`
   - `app/api/master/service-category`
   - `app/api/master/time-month`
   - `app/api/pipeline`
   - `app/api/pipeline/[id]`
   - `app/api/revenue/target/yearly`
   - `app/api/revenue/target/monthly`
   - `app/api/revenue/actual/monthly`
   - `app/api/dashboard/summary`
   - `app/api/dashboard/full`
4. Copy & sesuaikan kode dari contoh di atas:
   - Tabel & kolom disesuaikan.
   - Validasi minimal: field wajib tidak boleh kosong.
5. Pada sisi UI (Next.js pages):
   - Konsumsi endpoint:
     - Dashboard → `/api/dashboard/summary` dan `/api/dashboard/full`
     - List Pipeline → `/api/pipeline`
     - Form Pipeline → `POST /api/pipeline`
   - Semua formatting angka (rupiah, persen) dilakukan di frontend.
6. Gunakan `.env`:
   - `DATABASE_URL=postgresql://user:password@host:5432/revenue_db`
   - `NEXT_PUBLIC_BASE_URL=http://localhost:3000` (opsional).

Dengan seluruh bagian ini, API dapat dianggap **lengkap** untuk:
- Master data
- Pipeline potensi (full CRUD)
- Target & actual revenue
- Dashboard manajemen (ringkas & penuh).


## 10. Desain UI Dashboard (Layout Card & Chart)

> Tujuan: memberikan guideline yang sangat jelas agar AI Coder bisa membangun halaman dashboard dengan tampilan **dark themed**, rapi, dan fokus KPI.

---

### 10.1. Struktur Halaman Dashboard

Layout utama (dalam `app/page.tsx`):

1. **Row 1 – KPI Cards (3–4 cards)**
   - Card 1: **Target Yearly**
   - Card 2: **Realisasi Yearly**
   - Card 3: **Achievement %**
   - Card 4 (opsional): **Pipeline Most Likely**

2. **Row 2 – Grafik Utama**
   - Kiri: **Bar/Line Chart** target vs realisasi per bulan.
   - Kanan: **Donut/Pie Chart** komposisi pipeline berdasarkan warna potensi (HIJAU/KUNING/MERAH).

3. **Row 3 – Tabel Ringkasan**
   - Tabel 1: **Top 5 Customers by Est Revenue**.
   - (Opsional) Tabel 2: **Ringkasan per SBU** (target vs realisasi vs pipeline).

Semua ditempatkan dalam **grid** dengan gap yang konsisten, mengikuti dark theme (bg `bg-bg`, card `bg-surface`, border `border-surface-border`).

---

### 10.2. Rekomendasi Komponen & Layout (Tailwind + Dark Theme)

#### 10.2.1. KPI Cards Row

Konsep:

- 3 atau 4 card sejajar (`md:grid-cols-3` atau `md:grid-cols-4`).
- Setiap card:
  - Title (teks kecil, `text-xs text-primary-subtle`).
  - Value utama (angka besar, `text-2xl font-semibold`).
  - (Opsional) badge kecil untuk perubahan (% vs last month).

Contoh JSX (server component):

```tsx
<section className="grid gap-4 md:grid-cols-4">
  <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
    <p className="text-xs text-primary-subtle mb-1">Target Yearly</p>
    <p className="text-2xl font-semibold">
      Rp {summary.targetYearly.toLocaleString("id-ID")}
    </p>
  </div>
  <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
    <p className="text-xs text-primary-subtle mb-1">Realisasi Yearly</p>
    <p className="text-2xl font-semibold">
      Rp {summary.realizationYearly.toLocaleString("id-ID")}
    </p>
  </div>
  <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
    <p className="text-xs text-primary-subtle mb-1">Achievement</p>
    <p className="text-2xl font-semibold">
      {summary.achievementPct.toFixed(1)}%
    </p>
  </div>
  <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
    <p className="text-xs text-primary-subtle mb-1">Pipeline Most Likely</p>
    <p className="text-2xl font-semibold">
      Rp {summary.pipelineMostLikely.toLocaleString("id-ID")}
    </p>
  </div>
</section>
```

---

#### 10.2.2. Grafik Utama (Monthly Revenue & Pipeline Composition)

**Rekomendasi library chart:**

- Disarankan: **Recharts** (lebih natural di React/Next).
- Alternatif: **Chart.js** (via `react-chartjs-2`) jika tim sudah biasa.

**Data sumber:**

- `GET /api/dashboard/full?year=2025`
  - Field `monthly` → untuk grafik bar/line.
  - Field `pipelineByColor` → untuk donut chart.

**Layout row:**

```tsx
<section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
    {/* Chart 1: Monthly NR & CO */}
  </div>
  <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
    {/* Chart 2: Pipeline by Color */}
  </div>
</section>
```

##### 10.2.2.1. Contoh Struktur Chart Bulanan (pseudo-code Recharts)

```tsx
// pseudo-code, AI Coder boleh ganti implementasi detail sesuai library
<ResponsiveContainer width="100%" height={260}>
  <ComposedChart data={monthly}>
    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
    <XAxis dataKey="month" stroke="#9ca3af" />
    <YAxis stroke="#9ca3af" />
    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b" }} />
    <Legend />
    <Bar dataKey="nr" name="NR" /* warna soft */ />
    <Bar dataKey="co" name="CO" /* warna soft lain */ />
  </ComposedChart>
</ResponsiveContainer>
```

**Catatan untuk AI Coder:**

- Warna bar sebaiknya tetap konsisten:
  - NR → tone **cyan/blue** lembut.
  - CO → tone **violet/indigo** lembut.
- Background chart mengikuti card (`bg-surface`).

##### 10.2.2.2. Donut Chart Pipeline by Color

Data:

- `pipelineByColor = [{ color: "HIJAU", value: 100000000 }, { color: "KUNING", ... }, { color: "MERAH", ... }]`

Mapping warna:

- HIJAU → hijau terang (mis. `#22c55e`)
- KUNING → kuning (`#eab308`)
- MERAH → merah (`#ef4444`)

---

#### 10.2.3. Tabel Top Customers

**Tujuan:** memperlihatkan 5 pelanggan dengan nilai est_revenue tertinggi sebagai prioritas follow-up.

Sumber data: `topCustomers` dari `/api/dashboard/full`.

Layout:

```tsx
<section className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-semibold">Top 5 Customers by Est Revenue</h2>
  </div>
  <table className="min-w-full text-sm">
    <thead className="border-b border-surface-border/60">
      <tr>
        <th className="px-3 py-2 text-left text-xs font-medium text-primary-subtle">Customer</th>
        <th className="px-3 py-2 text-right text-xs font-medium text-primary-subtle">Est Revenue</th>
      </tr>
    </thead>
    <tbody>
      {topCustomers.length === 0 ? (
        <tr>
          <td colSpan={2} className="px-3 py-4 text-center text-primary-subtle">
            Belum ada data.
          </td>
        </tr>
      ) : (
        topCustomers.map((row) => (
          <tr key={row.customerName} className="border-t border-surface-border/40">
            <td className="px-3 py-2">{row.customerName}</td>
            <td className="px-3 py-2 text-right">
              Rp {row.totalEstRevenue.toLocaleString("id-ID")}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</section>
```

---

### 10.3. Alur Data Dashboard

1. **Server Component `app/page.tsx`:**
   - Panggil `GET /api/dashboard/summary?year=2025` untuk KPI di card.
   - Panggil `GET /api/dashboard/full?year=2025` untuk:
     - `pipelineByColor`
     - `topCustomers`
     - `monthly`

2. **Props Chart & Table:**
   - Oper `monthly`, `pipelineByColor`, `topCustomers` ke komponen child:
     - `<MonthlyRevenueChart data={monthly} />`
     - `<PipelineCompositionChart data={pipelineByColor} />`
     - `<TopCustomersTable data={topCustomers} />`

3. **Front-end formatting:**
   - Rupiah: `toLocaleString("id-ID")`.
   - Persen: `toFixed(1) + "%"`.
   - Month: boleh mapping 1–12 → Jan–Dec di UI.

---

### 10.4. Checklist Implementasi UI Dashboard (Untuk AI Coder)

1. Buat komponen dashboard di `app/page.tsx` dengan struktur:
   - Section KPI cards.
   - Section charts.
   - Section top customers table.
2. Buat helper component (opsional):
   - `components/ui/kpi-card.tsx`
   - `components/ui/section-shell.tsx` (wrapper card dengan title).
3. Integrasikan dengan API:
   - Gunakan `await fetch("/api/dashboard/summary?year=2025", { cache: "no-store" })`.
   - Gunakan `await fetch("/api/dashboard/full?year=2025", { cache: "no-store" })`.
4. Pastikan:
   - Menggunakan **dark theme**:
     - Background: `bg-bg`.
     - Card: `bg-surface`, border `border-surface-border`.
   - **Focus state jelas** untuk tombol/aksi:
     - `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`.
5. Jangan melakukan hit API yang sama dua kali:
   - Bisa digabung: panggil `/api/dashboard/full` dan hitung `achievementPct` di sisi server component (opsional).


## 11. Komponen UI Reusable

> Tujuan: menyediakan komponen UI generik agar tampilan konsisten dan development lebih cepat.  
> Semua contoh menggunakan:
> - **Next.js 15 (App Router)**
> - **TailwindCSS v4** dengan Linear Dark Theme (bg/surface/primary)
> - **TypeScript + React**
> - Lokasi komponen: `components/ui/*`

---

### 11.1. `<KpiCard />`

**Fungsi:**

- Menampilkan informasi KPI dalam bentuk kartu kecil:
  - Label kecil (judul).
  - Nilai utama (angka).
  - (Opsional) sublabel (misal “vs bulan lalu”).
  - (Opsional) icon kecil dan warna status.

**API Props (disarankan):**

```ts
interface KpiCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon?: React.ReactNode;
  tone?: "default" | "positive" | "warning" | "negative";
}
```

**Implementasi: `components/ui/kpi-card.tsx`**

```tsx
"use client";

import * as React from "react";
import clsx from "clsx";

export interface KpiCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon?: React.ReactNode;
  tone?: "default" | "positive" | "warning" | "negative";
}

const toneBorder: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "border-surface-border",
  positive: "border-emerald-500/60",
  warning: "border-amber-500/60",
  negative: "border-red-500/60",
};

const toneText: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-primary-subtle",
  positive: "text-emerald-400",
  warning: "text-amber-300",
  negative: "text-red-400",
};

export function KpiCard({
  label,
  value,
  subLabel,
  icon,
  tone = "default",
}: KpiCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border bg-surface p-4 shadow-sm",
        toneBorder[tone]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs text-primary-subtle">{label}</p>
          <p className="text-2xl font-semibold text-primary">{value}</p>
        </div>
        {icon && (
          <div
            className={clsx(
              "inline-flex h-8 w-8 items-center justify-center rounded-full bg-bg/80",
              toneText[tone]
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {subLabel && (
        <p className={clsx("mt-1 text-xs", toneText[tone])}>{subLabel}</p>
      )}
    </div>
  );
}
```

**Contoh penggunaan di Dashboard:**

```tsx
import { Target, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";

<section className="grid gap-4 md:grid-cols-4">
  <KpiCard
    label="Target Yearly"
    value={`Rp ${summary.targetYearly.toLocaleString("id-ID")}`}
    icon={<Target className="w-4 h-4" />}
  />
  <KpiCard
    label="Realisasi Yearly"
    value={`Rp ${summary.realizationYearly.toLocaleString("id-ID")}`}
  />
  <KpiCard
    label="Achievement"
    value={`${summary.achievementPct.toFixed(1)}%`}
    tone="positive"
    icon={<TrendingUp className="w-4 h-4" />}
    subLabel="vs target tahunan"
  />
  <KpiCard
    label="Pipeline Most Likely"
    value={`Rp ${summary.pipelineMostLikely.toLocaleString("id-ID")}`}
  />
</section>
```

---

### 11.2. `<SectionShell />`

**Fungsi:**

- Wrapper card generik untuk section seperti:
  - Chart.
  - Table.
  - List ringkasan.
- Mengatur:
  - Title.
  - Description (optional).
  - Actions (button di kanan atas).
  - Body berisi children.

**API Props:**

```ts
interface SectionShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}
```

**Implementasi: `components/ui/section-shell.tsx`**

```tsx
"use client";

import * as React from "react";

export interface SectionShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionShell({
  title,
  description,
  actions,
  children,
}: SectionShellProps) {
  return (
    <section className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-primary">{title}</h2>
          {description && (
            <p className="text-xs text-primary-subtle">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div>{children}</div>
    </section>
  );
}
```

**Contoh penggunaan di Dashboard:**

```tsx
import { SectionShell } from "@/components/ui/section-shell";

<SectionShell
  title="Monthly Revenue"
  description="NR dan CO per bulan sepanjang tahun berjalan"
>
  {/* Chart component di sini */}
</SectionShell>

<SectionShell
  title="Top 5 Customers by Est Revenue"
  actions={
    <button
      className="inline-flex items-center rounded-full border border-surface-border bg-bg px-3 py-1.5 text-xs text-primary hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      Lihat semua
    </button>
  }
>
  {/* Table component di sini */}
</SectionShell>
```

---

### 11.3. `<FormField />` (Wrapper untuk Input)

**Fungsi:**

- Membungkus elemen form (input/select/textarea) dengan:
  - Label.
  - Optional description/hint.
  - Optional error message.
- Memastikan style form **dark themed** dan konsisten.

**API Props:**

```ts
interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
}
```

**Implementasi: `components/ui/form-field.tsx`**

```tsx
"use client";

import * as React from "react";
import clsx from "clsx";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
}

export function FormField({
  label,
  htmlFor,
  children,
  description,
  error,
  required,
}: FormFieldProps) {
  const describedById = React.useId();
  const hasDescription = Boolean(description || error);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-xs font-medium text-primary"
      >
        <span>{label}</span>
        {required && (
          <span className="text-red-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div
        className={clsx(
          "rounded-xl border bg-bg",
          error ? "border-red-500/70" : "border-surface-border",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/70"
        )}
      >
        {React.cloneElement(children as React.ReactElement, {
          id: htmlFor,
          className: clsx(
            "w-full rounded-xl bg-transparent px-3 py-2 text-sm text-primary placeholder:text-primary-subtle",
            (children as any).props?.className
          ),
          "aria-invalid": error ? "true" : undefined,
          "aria-describedby": hasDescription ? describedById : undefined,
        })}
      </div>
      {(description || error) && (
        <p
          id={describedById}
          className={clsx(
            "text-[11px]",
            error ? "text-red-400" : "text-primary-subtle"
          )}
        >
          {error || description}
        </p>
      )}
    </div>
  );
}
```

**Contoh penggunaan di Form Pipeline:**

```tsx
import { FormField } from "@/components/ui/form-field";

<FormField
  label="Pelanggan"
  htmlFor="customer"
  required
  description="Masukkan nama atau pilih dari master pelanggan."
  error={errors.customerName}
>
  <input
    id="customer"
    placeholder="Nama pelanggan"
  />
</FormField>

<FormField
  label="Type Pendapatan"
  htmlFor="typePendapatan"
  required
>
  <select id="typePendapatan">
    <option value="">Pilih</option>
    <option value="NR">NR</option>
    <option value="CO">CO</option>
    <option value="LAIN_LAIN">Lain-lain</option>
  </select>
</FormField>
```

---

### 11.4. Checklist Penerapan di UI

1. Tambahkan file berikut di proyek Next.js:
   - `components/ui/kpi-card.tsx`
   - `components/ui/section-shell.tsx`
   - `components/ui/form-field.tsx`
2. Pastikan **TailwindCSS** sudah mengenali kelas:
   - `bg-bg`, `bg-surface`, `border-surface-border`, `text-primary`, `text-primary-subtle`, `bg-accent`.
3. Ganti card-card manual di dashboard menjadi `<KpiCard />`.
4. Ganti section chart & tabel menjadi `<SectionShell />` agar konsisten.
5. Ganti label + input manual di form pipeline menjadi kombinasi `<FormField>` + `<input>/<select>` agar:
   - Label, error, dan hint rapi.
   - Focus state konsisten dan dark theme friendly.
