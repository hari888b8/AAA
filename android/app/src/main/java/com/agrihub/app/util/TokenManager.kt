package com.agrihub.app.util

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "agrihub_prefs")

@Singleton
class TokenManager @Inject constructor(@ApplicationContext private val context: Context) {

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val REFRESH_KEY = stringPreferencesKey("refresh_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_ROLE_KEY = stringPreferencesKey("user_role")
        private val USER_PHONE_KEY = stringPreferencesKey("user_phone")
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[TOKEN_KEY] }

    suspend fun getToken(): String? = context.dataStore.data.first()[TOKEN_KEY]
    suspend fun getRefreshToken(): String? = context.dataStore.data.first()[REFRESH_KEY]

    suspend fun saveTokens(token: String, refreshToken: String) {
        context.dataStore.edit {
            it[TOKEN_KEY] = token
            it[REFRESH_KEY] = refreshToken
        }
    }

    suspend fun saveUser(id: String, name: String, role: String, phone: String) {
        context.dataStore.edit {
            it[USER_ID_KEY] = id
            it[USER_NAME_KEY] = name
            it[USER_ROLE_KEY] = role
            it[USER_PHONE_KEY] = phone
        }
    }

    suspend fun getUserName(): String? = context.dataStore.data.first()[USER_NAME_KEY]
    suspend fun getUserRole(): String? = context.dataStore.data.first()[USER_ROLE_KEY]
    suspend fun getUserPhone(): String? = context.dataStore.data.first()[USER_PHONE_KEY]
    suspend fun getUserId(): String? = context.dataStore.data.first()[USER_ID_KEY]

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
