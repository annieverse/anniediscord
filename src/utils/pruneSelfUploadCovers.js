"use strict"
const fs = require(`fs/promises`)
const path = require(`path`)
const { Client } = require(`pg`)

const SELF_UPLOAD_DIR = path.resolve(process.cwd(), `src/assets/selfupload`)

/**
 * Prune self-uploaded cover files that no longer exist in user_self_covers.
 *
 * The database is the source of truth. If the query fails, no files are
 * deleted.
 *
 * @param {object} options
 * @param {import('pino').Logger} options.logger
 * @param {string} [options.assetsPath]
 * @return {Promise<void>}
 */
module.exports = async function pruneSelfUploadCovers({ logger, assetsPath = SELF_UPLOAD_DIR }) {
	const pruneLogger = logger.child({ module: `self_upload_cover_pruner` })
	const startedAt = Date.now()
	pruneLogger.info({ action: `self_upload_cover_prune_started`, assetsPath })

	let activeCoverIds
	try {
		activeCoverIds = await fetchActiveCoverIds()
	} catch (error) {
		const msg = error && error.message ? error.message : String(error)
		pruneLogger.error({ action: `self_upload_cover_prune_db_failed`, msg, assetsPath })
		return
	}

	const activeCoverIdSet = new Set(activeCoverIds)
	const duplicateCoverIds = activeCoverIds.length - activeCoverIdSet.size
	pruneLogger.info({
		action: `self_upload_cover_prune_db_loaded`,
		activeCoverIdRows: activeCoverIds.length,
		activeCoverIds: activeCoverIdSet.size,
		duplicateCoverIds
	})

	let files
	try {
		files = await listSelfUploadFiles(assetsPath)
	} catch (error) {
		const msg = error && error.message ? error.message : String(error)
		pruneLogger.error({ action: `self_upload_cover_prune_directory_failed`, msg, assetsPath })
		return
	}

	const fileCoverIds = new Set(files.map(file => file.coverId))
	const staleFiles = files.filter(file => !activeCoverIdSet.has(file.coverId))
	const missingActiveCoverIds = [...activeCoverIdSet].filter(coverId => !fileCoverIds.has(coverId))
	const stalePercentage = percentage(staleFiles.length, files.length)
	const missingPercentage = percentage(missingActiveCoverIds.length, activeCoverIdSet.size)
	const countDifference = files.length - activeCoverIdSet.size
	const countDifferencePercentage = percentage(Math.abs(countDifference), activeCoverIdSet.size || files.length)
	const staleBytes = staleFiles.reduce((sum, file) => sum + file.size, 0)

	pruneLogger.info({
		action: `self_upload_cover_prune_diff`,
		activeCoverIds: activeCoverIdSet.size,
		availableFiles: files.length,
		staleFiles: staleFiles.length,
		stalePercentage,
		missingActiveCoverFiles: missingActiveCoverIds.length,
		missingPercentage,
		countDifference,
		countDifferencePercentage,
		staleBytes,
		staleSize: formatBytes(staleBytes)
	})

	let deletedFiles = 0
	let failedFiles = 0
	let savedBytes = 0
	for (const file of staleFiles) {
		try {
			await fs.unlink(file.path)
			deletedFiles++
			savedBytes += file.size
			pruneLogger.info({
				action: `self_upload_cover_prune_deleted_file`,
				file: file.name,
				coverId: file.coverId,
				bytes: file.size,
				size: formatBytes(file.size)
			})
		} catch (error) {
			failedFiles++
			const msg = error && error.message ? error.message : String(error)
			pruneLogger.warn({
				action: `self_upload_cover_prune_delete_failed`,
				file: file.name,
				coverId: file.coverId,
				bytes: file.size,
				size: formatBytes(file.size),
				msg
			})
		}
	}

	pruneLogger.info({
		action: `self_upload_cover_prune_finished`,
		activeCoverIds: activeCoverIdSet.size,
		availableFilesBeforePrune: files.length,
		availableFilesAfterPrune: files.length - deletedFiles,
		staleFiles: staleFiles.length,
		stalePercentage,
		countDifference,
		countDifferencePercentage,
		deletedFiles,
		failedFiles,
		savedBytes,
		savedSize: formatBytes(savedBytes),
		durationMs: Date.now() - startedAt
	})
}

async function fetchActiveCoverIds() {
	const client = new Client({
		host: process.env.PG_HOST,
		database: process.env.PG_DB,
		user: process.env.PG_USER,
		password: process.env.PG_PASS,
		port: process.env.PG_PORT
	})
	try {
		await client.connect()
		const res = await client.query(`
			SELECT cover_id
			FROM user_self_covers
			WHERE cover_id IS NOT NULL
		`)
		return res.rows.map(row => row.cover_id)
	} finally {
		await client.end().catch(() => {})
	}
}

async function listSelfUploadFiles(assetsPath) {
	const entries = await fs.readdir(assetsPath, { withFileTypes: true })
	const files = []
	for (const entry of entries) {
		if (!entry.isFile()) continue
		const filePath = path.join(assetsPath, entry.name)
		const stat = await fs.stat(filePath)
		files.push({
			name: entry.name,
			path: filePath,
			coverId: path.parse(entry.name).name,
			size: stat.size
		})
	}
	return files
}

function percentage(part, total) {
	if (!total) return 0
	return Number(((part / total) * 100).toFixed(2))
}

function formatBytes(bytes) {
	if (bytes === 0) return `0 Bytes`
	const k = 1024
	const sizes = [`Bytes`, `KB`, `MB`, `GB`, `TB`]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
