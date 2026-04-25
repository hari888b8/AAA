package com.agrihub.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.agrihub.app.ui.navigation.AgriHubNavHost
import com.agrihub.app.ui.theme.AgriHubTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AgriHubTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AgriHubNavHost()
                }
            }
        }
    }
}
