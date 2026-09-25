import { NextResponse } from "next/server";
import { getMappingEfs } from "@/lib/db";
import { parseLkpFile, parseTbJuniFile } from "@/lib/parser";
import { processRows } from "@/lib/process";
import { createXlsx } from "@/lib/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 150 * 1024 * 1024);

function errorResponse(message: string, status = 400) {
    return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const lkpFile = formData.get("lkpFile");
        const tbFile = formData.get("tbFile");

        if (!(lkpFile instanceof File) || !(tbFile instanceof File)) {
            return errorResponse("Kedua file wajib di-upload.");
        }

        if (lkpFile.size === 0 || tbFile.size === 0) {
            return errorResponse("File tidak boleh kosong.");
        }

        if (lkpFile.size > MAX_UPLOAD_BYTES || tbFile.size > MAX_UPLOAD_BYTES) {
            return errorResponse(
                `Ukuran masing-masing file tidak boleh lebih dari ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`
            );
        }

        const [lkpContent, tbContent] = await Promise.all([
            lkpFile.text(),
            tbFile.text()
        ]);

        const lkpRows = parseLkpFile(lkpContent);
        const tbRows = parseTbJuniFile(tbContent);
        const mappingRows = await getMappingEfs();

        if (mappingRows.length === 0) {
            return errorResponse("Tabel mappingEfs tidak memiliki data.", 422);
        }

        const { rows, stats } = processRows(tbRows, mappingRows, lkpRows);
        const xlsx = await createXlsx(rows);

        return new Response(xlsx, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="hasil-rekonsiliasi.xlsx"',
                "Content-Length": String(xlsx.length),
                "Cache-Control": "no-store",
                "X-Processing-Stats": encodeURIComponent(JSON.stringify(stats))
            }
        });
    } catch (error) {
        console.error("PROCESS_ERROR", error);

        const message =
            error instanceof Error ? error.message : "Terjadi kesalahan saat memproses data.";

        return errorResponse(message, 500);
    }
}
