"use client";

import { useState } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/ui/section-shell";

export default function PipelineUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload/pipeline", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            setResult(data);

            if (response.ok) {
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            }
        } catch (error) {
            console.error("Upload error:", error);
            setResult({ message: "Upload failed", errors: 1 });
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch("/api/download/pipeline-template");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Pipeline_Upload_Template.xlsx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
        }
    };

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold mb-2">Upload Pipeline Data</h1>
                    <p className="text-primary-subtle">Upload data pipeline dari file Excel</p>
                </div>

                {/* Download Template */}
                <SectionShell
                    title="1. Download Template"
                    description="Download template Excel terlebih dahulu"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                            <div>
                                <p className="font-medium">Pipeline Upload Template.xlsx</p>
                                <p className="text-sm text-primary-subtle">
                                    Template dengan contoh data dan instruksi
                                </p>
                            </div>
                        </div>
                        <Button onClick={handleDownloadTemplate} variant="secondary">
                            <Download className="w-4 h-4" />
                            Download Template
                        </Button>
                    </div>
                </SectionShell>

                {/* Upload File */}
                <SectionShell
                    title="2. Upload File Excel"
                    description="Pilih file Excel yang sudah diisi"
                >
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="file-upload"
                                className="block text-sm font-medium mb-2"
                            >
                                Pilih File Excel
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-primary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-accent file:text-white
                  hover:file:bg-accent/90
                  file:cursor-pointer cursor-pointer"
                            />
                            {file && (
                                <p className="mt-2 text-sm text-primary-subtle">
                                    File terpilih: {file.name}
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            isLoading={uploading}
                        >
                            <Upload className="w-4 h-4" />
                            {uploading ? "Uploading..." : "Upload Data"}
                        </Button>
                    </div>
                </SectionShell>

                {/* Result */}
                {result && (
                    <SectionShell
                        title="3. Hasil Upload"
                        description="Status upload data"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {result.errors === 0 ? (
                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-amber-500" />
                                )}
                                <div>
                                    <p className="font-medium">{result.message}</p>
                                    <p className="text-sm text-primary-subtle">
                                        Berhasil: {result.success || 0} | Gagal: {result.errors || 0}
                                    </p>
                                </div>
                            </div>

                            {result.errorDetails && result.errorDetails.length > 0 && (
                                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                                    <p className="font-medium text-amber-900 mb-2">
                                        Error Details:
                                    </p>
                                    <ul className="text-sm text-amber-800 space-y-1">
                                        {result.errorDetails.map((error: string, index: number) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.success > 0 && (
                                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                    <p className="text-sm text-emerald-800">
                                        ✓ {result.success} data pipeline berhasil diupload ke database
                                    </p>
                                </div>
                            )}
                        </div>
                    </SectionShell>
                )}

                {/* Instructions */}
                <SectionShell
                    title="Petunjuk Penggunaan"
                    description="Cara menggunakan fitur upload"
                >
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Download template Excel dengan klik tombol "Download Template"</li>
                        <li>Buka file template dan isi data pipeline sesuai format</li>
                        <li>Pastikan kode SBU sudah terdaftar di master SBU</li>
                        <li>Simpan file Excel yang sudah diisi</li>
                        <li>Upload file dengan klik tombol "Upload Data"</li>
                        <li>Tunggu proses upload selesai dan lihat hasilnya</li>
                    </ol>

                    <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                            Catatan Penting:
                        </p>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Field yang wajib diisi: sbu_code, customer_name, nama_layanan, est_revenue</li>
                            <li>• Kode SBU harus sudah ada di master data SBU</li>
                            <li>• Customer akan dibuat otomatis jika belum ada</li>
                            <li>• Status potensi: HIJAU (high), KUNING (medium), MERAH (low)</li>
                            <li>• Format angka revenue: tanpa titik atau koma (contoh: 50000000)</li>
                        </ul>
                    </div>
                </SectionShell>
            </div>
        </main>
    );
}
