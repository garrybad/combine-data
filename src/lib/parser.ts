import type { LkpRow, TbJuniRow } from "@/types";

function parseDelimitedLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === delimiter && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
}

function cleanHeader(value: string): string {
    return value.replace(/^\uFEFF/, "").trim();
}

function splitLines(content: string): string[] {
    return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

export function parseLkpFile(content: string): LkpRow[] {
    const lines = splitLines(content).filter((line) => line.trim().length > 0);

    return lines.map((line, index) => {
        const values = parseDelimitedLine(line, "|");

        if (values.length !== 8) {
            throw new Error(
                `Format file LKP tidak valid pada baris ${index + 1}. Ditemukan ${values.length} kolom, seharusnya 8 kolom.`
            );
        }

        const [f1, f2, f3, f4, f5, _unused, f7, f8] = values;
        return { f1, f2, f3, f4, f5, f7, f8 };
    });
}

export function parseTbJuniFile(content: string): TbJuniRow[] {
    const lines = splitLines(content).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
        throw new Error("File TB Juni kosong atau hanya memiliki header.");
    }

    const headers = parseDelimitedLine(lines[0], "\t").map(cleanHeader);
    const requiredHeaders = [
        "CONCATENATED_SEGMENTS",
        "PERIOD_NUM",
        "CURRENCY_CODE",
        "AMOUNT",
        "BASE_AMOUNT"
    ];

    for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
            throw new Error(`Kolom wajib '${required}' tidak ditemukan pada file TB Juni.`);
        }
    }

    return lines.slice(1).map((line, index) => {
        const values = parseDelimitedLine(line, "\t");

        if (values.length !== headers.length) {
            throw new Error(
                `Format file TB Juni tidak valid pada baris ${index + 2}. Ditemukan ${values.length} kolom, seharusnya ${headers.length} kolom.`
            );
        }

        const row: TbJuniRow = {
            CONCATENATED_SEGMENTS: "",
            PERIOD_NUM: "",
            CURRENCY_CODE: "",
            AMOUNT: "",
            BASE_AMOUNT: ""
        };

        headers.forEach((header, columnIndex) => {
            row[header] = values[columnIndex] ?? "";
        });

        return row;
    });
}

export function extractRincianAkun(concatenatedSegments: string): string {
    return (concatenatedSegments.split("-")[2] ?? "").trim();
}
