import version from '../../version.json'

/**
 * GET /version
 * Endpoint identitas versi wajib untuk project web
 * (SOP/GRC/DEV-VER/2026/001 — Identitas & Aksesibilitas Versi).
 *
 * Nilai diambil dari file version.json di root repository,
 * sehingga selalu sinkron dengan CHANGELOG.md saat rilis.
 */
export default defineEventHandler(() => version)
