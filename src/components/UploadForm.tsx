"use client";

import type { ProcessingStats } from "@/types";
import { FormEvent, type ReactNode, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

function formatNumber(value: number) {
    return new Intl.NumberFormat("id-ID").format(value);
}

const swalOptions = {
    confirmButtonColor: "#FF6E00",
};

export default function UploadForm() {
    const [lkpFile, setLkpFile] = useState<File | null>(null);
    const [tbFile, setTbFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ProcessingStats | null>(null);

    const canSubmit = Boolean(lkpFile && tbFile) && !loading;
    const readyCount = Number(Boolean(lkpFile)) + Number(Boolean(tbFile));

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setStats(null);

        if (!lkpFile || !tbFile) {
            await Swal.fire({
                ...swalOptions,
                icon: "warning",
                title: "File belum lengkap",
                text: "Silakan upload kedua file terlebih dahulu.",
            });
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
            anchor.download = "hasil-kombinasi.xlsx";

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            URL.revokeObjectURL(url);

            await Swal.fire({
                ...swalOptions,
                icon: "success",
                title: "Proses selesai",
                text: "File hasil-kombinasi.xlsx sudah diunduh.",
            });
        } catch (err) {
            await Swal.fire({
                ...swalOptions,
                icon: "error",
                title: "Proses tidak dapat dilanjutkan",
                text:
                    err instanceof Error
                        ? err.message
                        : "Terjadi kesalahan.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <main
            className={`relative bg-[#f6f3ef] px-4 py-4 sm:px-6 sm:py-5 dark:bg-neutral-950 ${
                stats
                    ? "min-h-dvh overflow-y-auto"
                    : "h-dvh overflow-hidden"
            }`}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(255,110,0,0.16),_transparent_60%)]"
            />

            <div
                className={`relative mx-auto flex w-full max-w-5xl flex-col ${
                    stats ? "" : "h-full"
                }`}
            >
                <header className="mb-4 shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6E00] text-white shadow-lg shadow-orange-500/25">
                                <UploadIcon />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
                                    Combined Data
                                </h1>
                                <p className="mt-0.5 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
                                    Gabungkan data LKP dan data bulanan,
                                    lalu unduh hasil selisih dalam format Excel.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>Output .XLSX</Badge>
                            <Badge muted>
                                {readyCount}/2 file siap
                            </Badge>
                        </div>
                    </div>

                    <ol className="mt-4 grid gap-2 sm:grid-cols-3">
                        <Step
                            number="1"
                            title="Unggah LKP"
                            done={Boolean(lkpFile)}
                            active={!lkpFile}
                        />
                        <Step
                            number="2"
                            title="Unggah bulanan"
                            done={Boolean(tbFile)}
                            active={Boolean(lkpFile) && !tbFile}
                        />
                        <Step
                            number="3"
                            title="Proses & unduh"
                            done={Boolean(stats)}
                            active={Boolean(lkpFile && tbFile) && !stats}
                        />
                    </ol>
                </header>

                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
                    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-6 dark:border-neutral-800">
                        <div>
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                                Unggah berkas
                            </h2>
                            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                                Seret file ke kartu, atau klik untuk memilih dari perangkat.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col justify-between gap-4 p-5 sm:p-6"
                    >
                        <div className="grid gap-4 lg:grid-cols-2">
                            <FileCard
                                number="01"
                                label="File LKP"
                                description="Data LKP."
                                formats="20260630, TXT, DAT, CSV"
                                file={lkpFile}
                                onChange={setLkpFile}
                                accept=".20260630,.txt,.dat,.csv"
                                disabled={loading}
                            />

                            <FileCard
                                number="02"
                                label="File Bulanan"
                                description="Data bulanan per periode."
                                formats="TSV, TXT"
                                file={tbFile}
                                onChange={setTbFile}
                                accept=".tsv,.txt"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                            <p className="text-xs leading-5 text-neutral-500 sm:max-w-sm">
                                <span className="font-medium text-neutral-700 dark:text-neutral-200">
                                    hasil-kombinasi.xlsx
                                </span>
                            </p>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-2xl bg-[#FF6E00] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#e86200] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
                            >
                                {loading ? (
                                    <>
                                        <Spinner />
                                        Memproses data…
                                    </>
                                ) : (
                                    <>
                                        <ProcessIcon />
                                        Proses & unduh .XLSX
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}

function Badge({
    children,
    muted = false,
}: {
    children: ReactNode;
    muted?: boolean;
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                muted
                    ? "bg-white text-neutral-600 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800"
                    : "bg-[#FF6E00]/10 text-[#c75300] ring-1 ring-[#FF6E00]/20 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/50"
            }`}
        >
            {children}
        </span>
    );
}

function Step({
    number,
    title,
    done,
    active,
}: {
    number: string;
    title: string;
    done: boolean;
    active: boolean;
}) {
    return (
        <li
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                done
                    ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    : active
                      ? "border-[#FF6E00]/30 bg-white dark:border-orange-900/50 dark:bg-neutral-900"
                      : "border-neutral-200/80 bg-white/70 dark:border-neutral-800 dark:bg-neutral-900/50"
            }`}
        >
            <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-[#FF6E00] text-white"
                          : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
            >
                {done ? <CheckIcon size={14} /> : number}
            </span>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                {title}
            </span>
        </li>
    );
}

function FileCard({
    number,
    label,
    description,
    formats,
    file,
    onChange,
    accept,
    disabled,
}: {
    number: string;
    label: string;
    description: string;
    formats: string;
    file: File | null;
    onChange: (file: File | null) => void;
    accept: string;
    disabled?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const selected = Boolean(file);

    function applyFile(next: File | null) {
        onChange(next);
        if (!next && inputRef.current) {
            inputRef.current.value = "";
        }
    }

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                if (!disabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (disabled) return;
                const dropped = event.dataTransfer.files?.[0];
                if (dropped) applyFile(dropped);
            }}
            className={`rounded-2xl border-2 border-dashed p-4 transition ${
                dragging
                    ? "border-[#FF6E00] bg-[#FF6E00]/8"
                    : selected
                      ? "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/10"
                      : "border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950/30"
            } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                            selected
                                ? "bg-[#FF6E00] text-white"
                                : "bg-white text-neutral-500 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700"
                        }`}
                    >
                        {selected ? <CheckIcon size={15} /> : number}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                            {description}
                        </p>
                    </div>
                </div>

                {selected && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Siap
                    </span>
                )}
            </div>

            <p className="mt-4 text-[11px] text-neutral-400">
                Format: {formats}
            </p>

            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t border-neutral-200/70 pt-4 dark:border-neutral-800">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 transition hover:ring-[#FF6E00] hover:text-[#c75300] dark:bg-neutral-900 dark:text-neutral-200 dark:ring-neutral-700"
                >
                    <FolderIcon />
                    {selected ? "Ganti file" : "Pilih file"}
                </button>

                {selected && (
                    <button
                        type="button"
                        onClick={() => applyFile(null)}
                        className="inline-flex shrink-0 items-center rounded-xl px-3 py-2 text-xs font-medium text-neutral-500 transition hover:bg-white hover:text-red-600 dark:hover:bg-neutral-800"
                    >
                        Hapus
                    </button>
                )}

                <p className="min-w-0 flex-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {file ? (
                        <>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                {file.name}
                            </span>
                            {" · "}
                            {formatBytes(file.size)}
                        </>
                    ) : dragging ? (
                        "Lepaskan file di sini"
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
                    applyFile(event.target.files?.[0] ?? null)
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
        "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/40";

    if (highlight) {
        box =
            "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20";
    } else if (warn) {
        box =
            "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20";
    } else if (variant === "success") {
        box =
            "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20";
    }

    return (
        <div className={`rounded-2xl border p-4 ${box}`}>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {label}
            </dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {formatNumber(value)}
            </dd>
        </div>
    );
}

function Spinner() {
    return (
        <span
            className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
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

function UploadIcon({ size = 20 }: { size?: number }) {
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

