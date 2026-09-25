"use client";

import { FormEvent, useState } from "react";

interface Stats {
    tbRows: number;
    mappedRows: number;
    unmatchedRincianAkun: number;
    unmatchedCoaF1: number;
    filteredByF5: number;
    resultRows: number;
    duplicateMappingKeys: number;
    duplicateLkpF2Keys: number;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("id-ID").format(value);
}

export default function UploadForm() {
    const [lkpFile, setLkpFile] = useState<File | null>(null);
    const [tbFile, setTbFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [stats, setStats] = useState<Stats | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setStats(null);

        if (!lkpFile || !tbFile) {
            setError("Silakan upload kedua file terlebih dahulu.");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("lkpFile", lkpFile);
            formData.append("tbFile", tbFile);

            const response = await fetch("/api/process", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.message ?? "Gagal memproses file.");
            }

            const statsHeader = response.headers.get("X-Processing-Stats");
            if (statsHeader) {
                try {
                    setStats(JSON.parse(decodeURIComponent(statsHeader)) as Stats);
                } catch {
                    // Ignore malformed optional stats header; download can still continue.
                }
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "hasil-rekonsiliasi.xlsx";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-6 py-10">
            <div className="mb-8 border-b border-zinc-800 pb-6">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Data Processing
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Reconciliation Automation
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    Upload file LKP dan TB Juni. Sistem akan mengambil rincianAkun dari
                    CONCATENATED_SEGMENTS, mencocokkannya ke mappingEfs, mencari f2 yang sesuai, memfilter f5 = 0000, menghitung BASE_AMOUNT - f7, lalu membuat XLSX.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <FileCard
                    label="File LKP"
                    hint="Format pipe-delimited 8 field: f1|f2|f3|f4|f5|unused|f7|f8"
                    file={lkpFile}
                    onChange={setLkpFile}
                    accept=".20260630,.txt,.dat,.csv"
                />

                <FileCard
                    label="File TB Juni"
                    hint="Format TSV dengan header CONCATENATED_SEGMENTS, PERIOD_NUM, CURRENCY_CODE, AMOUNT, BASE_AMOUNT"
                    file={tbFile}
                    onChange={setTbFile}
                    accept=".tsv,.txt"
                />

                {error ? (
                    <div className="border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                        {error}
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full border border-zinc-700 bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Process & Download XLSX"}
                </button>
            </form>

            {stats ? (
                <section className="mt-8 border border-zinc-800 p-5">
                    <div className="mb-4 flex items-end justify-between border-b border-zinc-800 pb-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Result</p>
                            <h2 className="mt-1 text-lg font-medium">Processing selesai</h2>
                        </div>
                        <span className="text-xs text-zinc-500">XLSX downloaded</span>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-zinc-800 md:grid-cols-4">
                        <Stat label="TB rows" value={stats.tbRows} />
                        <Stat label="Mapped" value={stats.mappedRows} />
                        <Stat label="Unmatched akun" value={stats.unmatchedRincianAkun} />
                        <Stat label="Unmatched coaF1" value={stats.unmatchedCoaF1} />
                        <Stat label="Filtered f5" value={stats.filteredByF5} />
                        <Stat label="Result rows" value={stats.resultRows} />
                        <Stat label="Duplicate mapping" value={stats.duplicateMappingKeys} />
                        <Stat label="Duplicate f2" value={stats.duplicateLkpF2Keys} />
                    </div>
                </section>
            ) : null}
        </div>
    );
}

function FileCard({
    label,
    hint,
    file,
    onChange,
    accept
}: {
    label: string;
    hint: string;
    file: File | null;
    onChange: (file: File | null) => void;
    accept: string;
}) {
    return (
        <label className="block cursor-pointer border border-zinc-800 p-5 transition hover:border-zinc-600">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{hint}</p>
                </div>
                <span className="text-xs text-zinc-600">Choose</span>
            </div>

            <input
                className="mt-4 block w-full text-sm text-zinc-400 file:mr-4 file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:text-zinc-100 hover:file:bg-zinc-700"
                type="file"
                accept={accept}
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            />

            {file ? (
                <p className="mt-3 truncate border-t border-zinc-900 pt-3 text-xs text-zinc-400">
                    Selected: <span className="text-zinc-200">{file.name}</span> — {formatBytes(file.size)}
                </p>
            ) : null}
        </label>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-zinc-950 p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-lg font-medium">{formatNumber(value)}</p>
        </div>
    );
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
