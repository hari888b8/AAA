package com.agrihub.app.workers

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.agrihub.app.data.local.OfflineQueueDao
import com.agrihub.app.data.repository.AgriFlowRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class OfflineSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val offlineQueueDao: OfflineQueueDao,
    private val agriFlowRepo: AgriFlowRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            // Sync pending offline actions
            val pending = offlineQueueDao.getPending()
            for (action in pending) {
                try {
                    // Process action based on type
                    when (action.action_type) {
                        "create_listing" -> {
                            // Parse and submit listing (simplified)
                        }
                        "create_declaration" -> {
                            // Parse and submit declaration
                        }
                    }
                    offlineQueueDao.markSynced(action.id)
                } catch (_: Exception) {
                    // Keep in queue for next sync
                }
            }

            // Refresh cached data
            try {
                agriFlowRepo.refreshCrops()
                agriFlowRepo.refreshDistricts()
            } catch (_: Exception) {}

            offlineQueueDao.clearSynced()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    companion object {
        const val WORK_NAME = "offline_sync"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<OfflineSyncWorker>(
                repeatInterval = 15,
                repeatIntervalTimeUnit = TimeUnit.MINUTES,
            ).setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }

        fun scheduleImmediate(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<OfflineSyncWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueue(request)
        }
    }
}
