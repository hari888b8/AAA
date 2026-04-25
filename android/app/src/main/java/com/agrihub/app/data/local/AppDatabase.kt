package com.agrihub.app.data.local

import androidx.room.*
import com.agrihub.app.data.model.Crop
import com.agrihub.app.data.model.District
import com.agrihub.app.data.model.OfflineAction
import kotlinx.coroutines.flow.Flow

@Dao
interface CropDao {
    @Query("SELECT * FROM crops ORDER BY name")
    fun getAll(): Flow<List<Crop>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(crops: List<Crop>)

    @Query("DELETE FROM crops")
    suspend fun deleteAll()
}

@Dao
interface DistrictDao {
    @Query("SELECT * FROM districts ORDER BY name")
    fun getAll(): Flow<List<District>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(districts: List<District>)

    @Query("DELETE FROM districts")
    suspend fun deleteAll()
}

@Dao
interface OfflineQueueDao {
    @Query("SELECT * FROM offline_queue WHERE synced = 0 ORDER BY created_at")
    suspend fun getPending(): List<OfflineAction>

    @Insert
    suspend fun insert(action: OfflineAction)

    @Query("UPDATE offline_queue SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: Long)

    @Query("DELETE FROM offline_queue WHERE synced = 1")
    suspend fun clearSynced()
}

@Database(
    entities = [Crop::class, District::class, OfflineAction::class],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun cropDao(): CropDao
    abstract fun districtDao(): DistrictDao
    abstract fun offlineQueueDao(): OfflineQueueDao
}
