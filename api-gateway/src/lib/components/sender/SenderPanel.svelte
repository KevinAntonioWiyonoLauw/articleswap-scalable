<script lang="ts">
  import { slide } from "svelte/transition";

  // Form states
  let title = $state("");
  let content = $state("");
  let sender = $state("");
  let receiver = $state("");
  let uploadType = $state<"text" | "pdf">("text");
  let selectedFile: File | null = $state(null);
  let fileBase64 = $state("");
  let status = $state<"idle" | "submitting" | "success" | "error">("idle");
  let statusMessage = $state("");
  let articleId = $state("");

  let fileInputEl = $state<HTMLInputElement | null>(null);

  /**
   * Handles user selecting a PDF file, reading it into a Base64-encoded string.
   *
   * @param e Triggering change event from input element.
   */
  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        fileBase64 = result.split(",")[1];
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  /**
   * Submits the current form data to the api/submit endpoint.
   *
   * @param e Form submit event.
   */
  async function handleSubmit(e: Event) {
    e.preventDefault();
    status = "submitting";
    statusMessage = "Sedang mengirim artikel...";
    try {
      const bodyPayload: any = {
        title,
        sender,
        receiver,
      };

      if (uploadType === "text") {
        bodyPayload.content = content;
      } else {
        if (!selectedFile) {
          status = "error";
          statusMessage = "Harap pilih file PDF terlebih dahulu.";
          return;
        }
        bodyPayload.fileData = fileBase64;
        bodyPayload.fileName = selectedFile.name;
      }

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const result = await response.json();
      if (response.ok) {
        status = "success";
        statusMessage = result.message || "Artikel berhasil dikirim!";
        articleId = result.articleId;
        title = "";
        content = "";
        selectedFile = null;
        fileBase64 = "";
        if (fileInputEl) {
          fileInputEl.value = "";
        }
      } else {
        status = "error";
        statusMessage = result.error || "Gagal mengirim artikel.";
      }
    } catch (err: any) {
      status = "error";
      statusMessage = err.message || "Koneksi internet bermasalah.";
    }
  }
</script>

<section class="card panel">
  <div class="panel-header-badge sender-badge">Pengirim</div>
  <h2>Kirim Artikel Baru</h2>
  <p class="section-desc">
    Kirim artikel (berupa teks langsung atau file PDF) ke dalam sistem
    pemrosesan.
  </p>

  <div class="tab-group">
    <div class="tab-slider" class:slide-right={uploadType === "pdf"}></div>
    <button
      type="button"
      class="tab-btn"
      class:active={uploadType === "text"}
      onclick={() => (uploadType = "text")}
    >
      Teks Langsung
    </button>
    <button
      type="button"
      class="tab-btn"
      class:active={uploadType === "pdf"}
      onclick={() => (uploadType = "pdf")}
    >
      File PDF
    </button>
  </div>

  <form onsubmit={handleSubmit}>
    <div class="form-grid">
      <div class="field">
        <label for="sender">Username Pengirim</label>
        <input
          type="text"
          id="sender"
          name="sender"
          autocomplete="username"
          bind:value={sender}
          placeholder="Contoh: alice"
          required
        />
      </div>
      <div class="field">
        <label for="receiver">Username Penerima</label>
        <input
          type="text"
          id="receiver"
          name="receiver"
          autocomplete="username"
          bind:value={receiver}
          placeholder="Contoh: bob"
          required
        />
      </div>
    </div>

    <div class="field">
      <label for="title">Judul Artikel</label>
      <input
        type="text"
        id="title"
        name="title"
        autocomplete="on"
        bind:value={title}
        placeholder="Tulis judul artikel..."
        required
      />
    </div>

    {#if uploadType === "text"}
      <div class="field" transition:slide={{ duration: 200 }}>
        <label for="content">Isi Artikel</label>
        <textarea
          id="content"
          bind:value={content}
          rows="5"
          placeholder="Tulis atau tempel isi artikel di sini..."
          required
        ></textarea>
      </div>
    {:else}
      <div class="field" transition:slide={{ duration: 200 }}>
        <label for="file">Pilih Dokumen PDF</label>
        <div class="file-upload-box">
          <input
            type="file"
            id="file"
            accept=".pdf"
            onchange={handleFileChange}
            bind:this={fileInputEl}
            required
          />
          <div class="file-info-text">
            {#if selectedFile}
              <span class="file-selected"
                >Selected: {selectedFile.name} ({(
                  selectedFile.size / 1024
                ).toFixed(1)} KB)</span
              >
            {:else}
              <span>Tarik & lepas file atau klik untuk memilih PDF</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <button
      type="submit"
      class="submit-btn"
      class:submitting={status === "submitting"}
      disabled={status === "submitting"}
    >
      {#if status === "submitting"}
        <span class="spinner"></span> Mengirim...
      {:else}
        Kirim ke Sistem
      {/if}
    </button>
  </form>

  {#if status !== "idle"}
    <div class="alert {status}" transition:slide={{ duration: 250 }}>
      <div class="alert-icon">
        {#if status === "success"}[OK]{:else if status === "error"}[ERROR]{:else}[INFO]{/if}
      </div>
      <div class="alert-content">
        <p class="alert-message">{statusMessage}</p>
        {#if articleId && status === "success"}
          <code class="article-id">ID Artikel: {articleId}</code>
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  @import "./SenderPanel.css";
</style>
