package com.agrihub.app.di

import android.content.Context
import androidx.room.Room
import com.agrihub.app.BuildConfig
import com.agrihub.app.data.api.*
import com.agrihub.app.data.local.AppDatabase
import com.agrihub.app.util.TokenManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(tokenManager: TokenManager): OkHttpClient {
        val authInterceptor = Interceptor { chain ->
            val token = runBlocking { tokenManager.getToken() }
            val request = if (token != null) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else chain.request()
            chain.proceed(request)
        }

        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
            else HttpLoggingInterceptor.Level.NONE
        }

        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides @Singleton fun provideAuthApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)
    @Provides @Singleton fun provideAgriFlowApi(retrofit: Retrofit): AgriFlowApi = retrofit.create(AgriFlowApi::class.java)
    @Provides @Singleton fun provideAquaOSApi(retrofit: Retrofit): AquaOSApi = retrofit.create(AquaOSApi::class.java)
    @Provides @Singleton fun provideKisanConnectApi(retrofit: Retrofit): KisanConnectApi = retrofit.create(KisanConnectApi::class.java)
    @Provides @Singleton fun provideFarmerConnectApi(retrofit: Retrofit): FarmerConnectApi = retrofit.create(FarmerConnectApi::class.java)
    @Provides @Singleton fun provideIntelligenceApi(retrofit: Retrofit): IntelligenceApi = retrofit.create(IntelligenceApi::class.java)
    @Provides @Singleton fun provideCommunityApi(retrofit: Retrofit): CommunityApi = retrofit.create(CommunityApi::class.java)
    @Provides @Singleton fun provideOrdersApi(retrofit: Retrofit): OrdersApi = retrofit.create(OrdersApi::class.java)
    @Provides @Singleton fun provideFarmerProfileApi(retrofit: Retrofit): FarmerProfileApi = retrofit.create(FarmerProfileApi::class.java)
    @Provides @Singleton fun provideFpoApi(retrofit: Retrofit): FpoApi = retrofit.create(FpoApi::class.java)
    @Provides @Singleton fun provideBuyerApi(retrofit: Retrofit): BuyerApi = retrofit.create(BuyerApi::class.java)
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(context, AppDatabase::class.java, "agrihub.db")
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides fun provideCropDao(db: AppDatabase) = db.cropDao()
    @Provides fun provideDistrictDao(db: AppDatabase) = db.districtDao()
    @Provides fun provideOfflineQueueDao(db: AppDatabase) = db.offlineQueueDao()
}
