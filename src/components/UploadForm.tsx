"use client";

import type { ProcessingStats } from "@/types";
import { FormEvent, useRef, useState } from "react";

function formatNumber(value: number) {
    return new Intl.NumberFormat("id-ID").format(value);
}

export default function UploadForm() {
    const [lkpFile, setLkpFile] = useState<File | null>(null);
    const [tbFile, setTbFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [stats, setStats] = useState<ProcessingStats | null>(null);

    const canSubmit = Boolean(lkpFile && tbFile) && !loading;

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
                body: formData,
            });

            if (!response.ok) {
                const body = await response.json().catch(() => null);

                throw new Error(
                    body?.message ?? "Gagal memproses file."
                );
            }

            const statsHeader =
                response.headers.get("X-Processing-Stats");

            if (statsHeader) {
                try {
                    setStats(
                        JSON.parse(
                            decodeURIComponent(statsHeader)
                        ) as ProcessingStats
                    );
                } catch {
                    // Ignore malformed optional stats header.
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
            setError(
                err instanceof Error
                    ? err.message
                    : "Terjadi kesalahan."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen overflow-y-auto bg-neutral-50 px-4 py-8 sm:px-6 sm:py-12 dark:bg-neutral-950">
            <div className="mx-auto w-full max-w-5xl">
                {/* Header */}
        <header className="mb-7">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                Combined Data
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500 sm:text-base dark:text-neutral-400">
                Menggabungkan data LKP dan data bulanan untuk menemukan selisih data secara otomatis.
            </p>
        </div>

        <div className="hidden shrink-0 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm sm:block dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Output
            </p>

            <p className="mt-1 text-sm font-bold text-neutral-800 dark:text-neutral-100">
                Excel .XLSX
            </p>
        </div>
    </div>
</header>

                {/* Upload Card */}
                <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Card Header */}
                    <div className="border-b border-neutral-100 px-5 py-5 sm:px-7 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
                                <UploadIcon />
                            </div>

                            <div>
                                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                                    Upload Data
                                </h2>

                                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                    Pilih dua file yang akan diproses
                                </p>
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 p-5 sm:p-7"
                    >
                        {/* File Upload */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            <FileCard
                                number="01"
                                label="File LKP"
                                description="Upload data LKP."
                                file={lkpFile}
                                onChange={setLkpFile}
                                accept=".20260630,.txt,.dat,.csv"
                            />

                            <FileCard
                                number="02"
                                label="File Bulanan"
                                description="Upload data bulanan perperiode."
                                file={tbFile}
                                onChange={setTbFile}
                                accept=".tsv,.txt"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                            >
                                <div className="mt-0.5 shrink-0">
                                    <AlertIcon />
                                </div>

                                <div>
                                    <p className="font-semibold">
                                        Proses tidak dapat dilanjutkan
                                    </p>

                                    <p className="mt-1 leading-5">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="border-t border-neutral-100 pt-5 dark:border-neutral-800">
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-950 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                            >
                                {loading ? (
                                    <>
                                        <Spinner />
                                        Memproses data…
                                    </>
                                ) : (
                                    <>
                                        <ProcessIcon />
                                        Proses & Unduh XLSX
                                    </>
                                )}
                            </button>

                            <p className="mt-2.5 text-center text-[11px] text-neutral-400">
                                Pastikan kedua file sudah dipilih
                                sebelum memulai proses.
                            </p>
                        </div>
                    </form>
                </section>

                {/* Statistics */}
                {stats && (
                    <section className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="border-b border-neutral-100 px-5 py-5 sm:px-7 dark:border-neutral-800">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        <CheckIcon />
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                                            Processing Result
                                        </p>

                                        <h2 className="mt-0.5 text-lg font-bold text-neutral-900 dark:text-white">
                                            Proses selesai
                                        </h2>
                                    </div>
                                </div>

                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    XLSX terunduh
                                </span>
                            </div>
                        </div>

                        <dl className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-7">
                            <Stat
                                label="Baris TB"
                                value={stats.tbRows}
                            />

                            <Stat
                                label="Terpetakan"
                                value={stats.mappedRows}
                                variant="success"
                            />

                            <Stat
                                label="Akun tidak cocok"
                                value={stats.unmatchedRincianAkun}
                                warn={stats.unmatchedRincianAkun > 0}
                            />

                            <Stat
                                label="COA F1 tidak cocok"
                                value={stats.unmatchedCoaF1}
                                warn={stats.unmatchedCoaF1 > 0}
                            />

                            <Stat
                                label="Filter F5"
                                value={stats.filteredByF5}
                            />

                            <Stat
                                label="Baris hasil"
                                value={stats.resultRows}
                                highlight
                            />

                            <Stat
                                label="Duplikat mapping"
                                value={stats.duplicateMappingKeys}
                                warn={stats.duplicateMappingKeys > 0}
                            />

                            <Stat
                                label="Duplikat F2 LKP"
                                value={stats.duplicateLkpF2Keys}
                                warn={stats.duplicateLkpF2Keys > 0}
                            />
                        </dl>
                    </section>
                )}
            </div>
        </main>
    );
}

function FileCard({
    number,
    label,
    description,
    file,
    onChange,
    accept,
}: {
    number: string;
    label: string;
    description: string;
    file: File | null;
    onChange: (file: File | null) => void;
    accept: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const selected = Boolean(file);

    return (
        <div
            className={`rounded-2xl border p-5 transition-colors ${
                selected
                    ? "border-orange-300 bg-orange-50/40 dark:border-orange-800 dark:bg-orange-950/10"
                    : "border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950/30"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            selected
                                ? "bg-orange-500 text-white"
                                : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                    >
                        {selected ? (
                            <CheckIcon size={15} />
                        ) : (
                            number
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                            {label}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                            {description}
                        </p>
                    </div>
                </div>

                {selected && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Ready
                    </span>
                )}
            </div>

            <div className="mt-5 flex min-w-0 items-center gap-3 border-t border-neutral-200/70 pt-4 dark:border-neutral-800">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-orange-500 dark:hover:text-orange-300"
                >
                    <FolderIcon />
                    {selected ? "Ganti file" : "Pilih file"}
                </button>

                <p className="min-w-0 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {file ? (
                        <>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                {file.name}
                            </span>

                            {" · "}

                            {formatBytes(file.size)}
                        </>
                    ) : (
                        "Belum ada file dipilih"
                    )}
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(event) =>
                    onChange(event.target.files?.[0] ?? null)
                }
            />
        </div>
    );
}

function Stat({
    label,
    value,
    warn,
    highlight,
    variant,
}: {
    label: string;
    value: number;
    warn?: boolean;
    highlight?: boolean;
    variant?: "success";
}) {
    let box =
        "border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950/40";

    if (highlight) {
        box =
            "border-orange-200 bg-orange-50/60 dark:border-orange-900/50 dark:bg-orange-950/20";
    } else if (warn) {
        box =
            "border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20";
    } else if (variant === "success") {
        box =
            "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20";
    }

    return (
        <div
            className={`rounded-xl border p-4 ${box}`}
        >
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {label}
            </dt>

            <dd className="mt-2 text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
                {formatNumber(value)}
            </dd>
        </div>
    );
}

function Spinner() {
    return (
        <span
            className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900"
            aria-hidden
        />
    );
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* Icons */

function UploadIcon({ size = 19 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 3v12" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
    );
}

function ProcessIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 3v18" />
            <path d="M5 12h14" />
            <path d="m18 8 4 4-4 4" />
            <path d="m6 8-4 4 4 4" />
        </svg>
    );
}

function CheckIcon({ size = 17 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    );
}
