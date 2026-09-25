import ExcelJS from "exceljs";
import type { ProcessedRow } from "@/types";

const OUTPUT_HEADERS: Array<keyof ProcessedRow> = [
    "PERIOD_NUM",
    "rincianAkun_tb",
    "rincianAkun",
    "namaCOA",
    "penjelasanCOA",
    "coaF1",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f8",
    "BASE_AMOUNT",
    "f7",
    "selisih"
];

export async function createXlsx(rows: ProcessedRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Reconciliation Automation";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Hasil");

    worksheet.columns = OUTPUT_HEADERS.map((header) => ({
        header,
        key: header,
        width:
            header === "penjelasanCOA"
                ? 40
                : Math.min(Math.max(header.length + 2, 14), 30)
    }));

    for (const row of rows) {
        worksheet.addRow(OUTPUT_HEADERS.map((header) => row[header] ?? ""));
    }

    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: OUTPUT_HEADERS.length }
    };

    const numericColumns = [
        "BASE_AMOUNT",
        "f7",
        "selisih"
    ];

    for (const header of numericColumns) {
        const columnIndex = OUTPUT_HEADERS.indexOf(header as keyof ProcessedRow) + 1;
        worksheet.getColumn(columnIndex).numFmt = "#,##0.00";
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
