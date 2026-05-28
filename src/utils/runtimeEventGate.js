"use strict"

function initialize(client) {
	client.managerSpawnComplete = false
	client.readyTasksComplete = false
	client.eventProcessingLocked = true
	client.eventProcessingLockReason = `manager_spawn_in_progress`
	client.eventProcessingBlockedLogs = new Map()
}

function lock(client, reason = `startup_in_progress`) {
	client.eventProcessingLocked = true
	client.eventProcessingLockReason = reason
}

function markReadyTasksComplete(client, metadata = {}) {
	client.readyTasksComplete = true
	return unlockIfReady(client, `ready_tasks_complete`, metadata)
}

function markManagerSpawnComplete(client, metadata = {}) {
	client.managerSpawnComplete = true
	return unlockIfReady(client, `manager_spawn_complete`, metadata)
}

function shouldProcess(client, eventName = `unknown`, now = Date.now()) {
	if (!client.eventProcessingLocked) return true
	const lastLoggedAt = client.eventProcessingBlockedLogs.get(eventName) || 0
	if ((now - lastLoggedAt) > 15000) {
		client.eventProcessingBlockedLogs.set(eventName, now)
		client.logger.warn({
			action: `runtime_event_processing_blocked`,
			eventName,
			reason: client.eventProcessingLockReason,
			managerSpawnComplete: client.managerSpawnComplete,
			readyTasksComplete: client.readyTasksComplete
		})
	}
	return false
}

function unlockIfReady(client, trigger = `unknown`, metadata = {}) {
	if (!client.managerSpawnComplete || !client.readyTasksComplete) {
		client.logger.debug({
			action: `runtime_event_processing_waiting`,
			trigger,
			reason: client.eventProcessingLockReason,
			managerSpawnComplete: client.managerSpawnComplete,
			readyTasksComplete: client.readyTasksComplete,
			...metadata
		})
		return false
	}
	if (!client.eventProcessingLocked) return true
	client.eventProcessingLocked = false
	client.eventProcessingLockReason = null
	client.eventProcessingBlockedLogs.clear()
	client.logger.info({
		action: `runtime_event_processing_unlocked`,
		trigger,
		managerSpawnComplete: client.managerSpawnComplete,
		readyTasksComplete: client.readyTasksComplete,
		...metadata
	})
	return true
}

module.exports = {
	initialize,
	lock,
	markReadyTasksComplete,
	markManagerSpawnComplete,
	shouldProcess
}
