import Decimal from "decimal.js";
import type {
    LkpRow,
    MappingRow,
    ProcessedRow,
    ProcessingStats,
    TbJuniRow
} from "@/types";
import { extractRincianAkun } from "@/lib/parser";

function normalizeKey(value: string | number | null | undefined): string {
    return String(value ?? "").trim();
}

function subtractAmounts(baseAmount: string, f7: string): string {
    try {
        return new Decimal(baseAmount || 0).minus(new Decimal(f7 || 0)).toFixed();
    } catch {
        throw new Error(`Nilai amount tidak valid: BASE_AMOUNT='${baseAmount}', f7='${f7}'.`);
    }
}

export function processRows(
    tbRows: TbJuniRow[],
    mappingRows: MappingRow[],
    lkpRows: LkpRow[]
): { rows: ProcessedRow[]; stats: ProcessingStats } {
    const mappingByRincian = new Map<string, MappingRow[]>();

    for (const row of mappingRows) {
        const key = normalizeKey(row.rincianAkun);
        if (!key) continue;

        const list = mappingByRincian.get(key) ?? [];
        list.push(row);
        mappingByRincian.set(key, list);
    }

    const allLkpByF2 = new Map<string, LkpRow[]>();
    const validLkpByF2 = new Map<string, LkpRow[]>();

    for (const row of lkpRows) {
        const key = normalizeKey(row.f2);
        if (!key) continue;

        const all = allLkpByF2.get(key) ?? [];
        all.push(row);
        allLkpByF2.set(key, all);

        // Requirement: filter LKP by f5 = 0000, NOT f8.
        if (normalizeKey(row.f5) === "0000") {
            const valid = validLkpByF2.get(key) ?? [];
            valid.push(row);
            validLkpByF2.set(key, valid);
        }
    }

    const duplicateMappingKeys = [...mappingByRincian.values()].filter(
        (rows) => rows.length > 1
    ).length;

    const duplicateLkpF2Keys = [...allLkpByF2.values()].filter(
        (rows) => rows.length > 1
    ).length;

    const output: ProcessedRow[] = [];
    let unmatchedRincianAkun = 0;
    let unmatchedCoaF1 = 0;
    let filteredByF5 = 0;
    let mappedRows = 0;

    for (const tbRow of tbRows) {
        const rincianAkun = extractRincianAkun(tbRow.CONCATENATED_SEGMENTS);
        const mappings = mappingByRincian.get(normalizeKey(rincianAkun)) ?? [];

        if (mappings.length === 0) {
            unmatchedRincianAkun += 1;
            continue;
        }

        mappedRows += 1;

        for (const mapping of mappings) {
            const coaF1 = normalizeKey(mapping.coaF1);
            const allLkp = allLkpByF2.get(coaF1) ?? [];
            const validLkp = validLkpByF2.get(coaF1) ?? [];

            if (allLkp.length === 0) {
                unmatchedCoaF1 += 1;
                continue;
            }

            // Rows that have an f2 match but do not satisfy f5 = 0000 are excluded.
            if (validLkp.length === 0) {
                filteredByF5 += allLkp.length;
                continue;
            }

            for (const lkp of validLkp) {
                output.push({
                    PERIOD_NUM: tbRow.PERIOD_NUM,
                    rincianAkun_tb: rincianAkun,
                    rincianAkun: mapping.rincianAkun,
                    namaCOA: mapping.namaCOA,
                    penjelasanCOA: mapping.penjelasanCOA,
                    coaF1: mapping.coaF1,
                    f1: lkp.f1,
                    f2: lkp.f2,
                    f3: lkp.f3,
                    f4: lkp.f4,
                    f5: lkp.f5,
                    f8: lkp.f8,
                    BASE_AMOUNT: tbRow.BASE_AMOUNT,
                    f7: lkp.f7,
                    selisih: subtractAmounts(tbRow.BASE_AMOUNT, lkp.f7)
                });
            }
        }
    }

    return {
        rows: output,
        stats: {
            tbRows: tbRows.length,
            mappedRows,
            unmatchedRincianAkun,
            unmatchedCoaF1,
            filteredByF5,
            resultRows: output.length,
            duplicateMappingKeys,
            duplicateLkpF2Keys
        }
    };
}
