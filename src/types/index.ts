export type StringRecord = Record<string, string>;

export interface TbJuniRow {
    CONCATENATED_SEGMENTS: string;
    PERIOD_NUM: string;
    CURRENCY_CODE: string;
    AMOUNT: string;
    BASE_AMOUNT: string;
    [key: string]: string;
}

/**
 * File LKP has 8 physical fields:
 * f1 | f2 | f3 | f4 | f5 | unused field | f7 | f8
 * The unused field is parsed only to preserve column positions and is not
 * exposed in the application output.
 */
export interface LkpRow {
    f1: string;
    f2: string;
    f3: string;
    f4: string;
    f5: string;
    f7: string;
    f8: string;
}

export interface MappingRow extends StringRecord {
    rincianAkun: string;
    namaCOA: string;
    penjelasanCOA: string;
    coaF1: string;
}

export interface ProcessedRow {
    PERIOD_NUM: string;
    rincianAkun_tb: string;
    rincianAkun: string;
    namaCOA: string;
    penjelasanCOA: string;
    coaF1: string;
    f1: string;
    f2: string;
    f3: string;
    f4: string;
    f5: string;
    f8: string;
    BASE_AMOUNT: string;
    f7: string;
    selisih: string;
}

export interface ProcessingStats {
    tbRows: number;
    mappedRows: number;
    unmatchedRincianAkun: number;
    unmatchedCoaF1: number;
    filteredByF5: number;
    resultRows: number;
    duplicateMappingKeys: number;
    duplicateLkpF2Keys: number;
}
