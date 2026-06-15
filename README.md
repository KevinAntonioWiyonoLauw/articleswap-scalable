# Distributed Article Swap

ArticleSwap adalah distributed platform untuk bertukar artikel secara real-time menggunakan SvelteKit, Nginx Load Balancer, dan Apache Kafka.


## Cara Menjalankan Layanan

### Prerequisites
- **Node.js** (v18+)
- **Nginx**

### Langkah Menjalankan
Jalankan script di root direktori untuk mengaktifkan dua instance API Gateway dan Nginx load balancer secara otomatis:
```bash
./run.sh
```

**Untuk Pengguna Windows / OS Lain:**

> **Git Bash / WSL / macOS:** Jalankan perintah `./run.sh` yang sama.

> **Windows (Command Prompt / PowerShell - Manual):**
1. `cd api-gateway && npm run dev -- --port 5173`
2. `cd api-gateway && npm run dev -- --port 5174`
3. `nginx -p <path_ke_project> -c <path_ke_project>/nginx.conf`


- **Dashboard (Load Balanced)**: [http://localhost:8080](http://localhost:8080)

Tekan `Ctrl+C` di terminal untuk menghentikan semua service.

---

## Endpoint API Utama

### 1. Kirim Artikel (`POST /api/submit`)
Menerima artikel berupa teks biasa atau dokumen PDF.
```json
{
  "title": "Judul Artikel",
  "sender": "alice",
  "receiver": "bob",
  "content": "Isi artikel..."
}
```

### 2. Terima SSE (`GET /api/receive?receiver=<nama_penerima>`)
Koneksi streaming SSE (`text/event-stream`) untuk menerima artikel secara real-time.
