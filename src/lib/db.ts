import mysql, { type Pool } from "mysql2/promise";
import type { MappingRow } from "@/types";

let pool: Pool | undefined;

function getPool(): Pool {
    if (pool) return pool;

    const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
    for (const key of required) {
        if (!process.env[key]) {
            throw new Error(`Environment variable ${key} belum diatur.`);
        }
    }

    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 5),
        charset: "utf8mb4"
    });

    return pool;
}

export async function getMappingEfs(): Promise<MappingRow[]> {
    const connection = getPool();
    const [rows] = await connection.query("SELECT * FROM mappingEfs");

    if (!Array.isArray(rows)) {
        throw new Error("Data mappingEfs tidak dapat dibaca.");
    }

    const objectRows = rows as Record<string, unknown>[];
    if (objectRows.length === 0) return [];

    const findColumn = (target: string) =>
        Object.keys(objectRows[0]).find(
            (column) => column.toLowerCase() === target.toLowerCase()
        );

    const rincianColumn = findColumn("rincianAkun");
    const namaCoaColumn = findColumn("namaCOA");
    const penjelasanColumn = findColumn("penjelasanCOA");
    const coaColumn = findColumn("coaF1");

    const missing = [
        ["rincianAkun", rincianColumn],
        ["namaCOA", namaCoaColumn],
        ["penjelasanCOA", penjelasanColumn],
        ["coaF1", coaColumn]
    ]
        .filter(([, column]) => !column)
        .map(([name]) => name);

    if (missing.length > 0) {
        throw new Error(
            `Kolom mappingEfs tidak lengkap. Dibutuhkan: ${missing.join(", ")}.`
        );
    }

    return objectRows.map((row) => {
        const normalized: MappingRow = {} as MappingRow;

        for (const [key, value] of Object.entries(row)) {
            normalized[key] = value == null ? "" : String(value).trim();
        }

        normalized.rincianAkun = String(row[rincianColumn!] ?? "").trim();
        normalized.namaCOA = String(row[namaCoaColumn!] ?? "").trim();
        normalized.penjelasanCOA = String(row[penjelasanColumn!] ?? "").trim();
        normalized.coaF1 = String(row[coaColumn!] ?? "").trim();

        return normalized;
    });
}
