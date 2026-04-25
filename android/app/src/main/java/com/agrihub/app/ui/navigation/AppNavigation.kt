package com.agrihub.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.agrihub.app.ui.agriflow.*
import com.agrihub.app.ui.aquaos.*
import com.agrihub.app.ui.auth.*
import com.agrihub.app.ui.community.*
import com.agrihub.app.ui.farmerconnect.*
import com.agrihub.app.ui.home.*
import com.agrihub.app.ui.intelligence.*
import com.agrihub.app.ui.kisanconnect.*
import com.agrihub.app.ui.notifications.*
import com.agrihub.app.ui.orders.*
import com.agrihub.app.ui.profile.*
import com.agrihub.app.ui.theme.AppColor

// ─── Route Definitions ─────────────────────────────────────
object Routes {
    // Auth
    const val PHONE = "auth/phone"
    const val OTP = "auth/otp/{phone}"
    fun otp(phone: String) = "auth/otp/$phone"

    // Tabs
    const val HOME = "home"
    const val AGRIFLOW = "agriflow"
    const val AQUAOS = "aquaos"
    const val KISAN = "kisan"
    const val PROFILE = "profile"

    // AgriFlow sub-screens
    const val LISTINGS = "agriflow/listings"
    const val LISTING_DETAIL = "agriflow/listing/{id}"
    fun listingDetail(id: String) = "agriflow/listing/$id"
    const val CREATE_LISTING = "agriflow/create-listing"
    const val DECLARATIONS = "agriflow/declarations"
    const val CREATE_DECLARATION = "agriflow/create-declaration"
    const val INQUIRIES = "agriflow/inquiries"

    // AquaOS sub-screens
    const val PONDS = "aquaos/ponds"
    const val POND_DETAIL = "aquaos/pond/{id}"
    fun pondDetail(id: String) = "aquaos/pond/$id"
    const val ADD_POND = "aquaos/add-pond"
    const val HARVEST_LISTINGS = "aquaos/harvest-listings"
    const val WATER_LOG = "aquaos/water-log/{pondId}"
    fun waterLog(pondId: String) = "aquaos/water-log/$pondId"
    const val ADVISORIES = "aquaos/advisories"

    // KisanConnect sub-screens
    const val EQUIPMENT = "kisan/equipment"
    const val BOOK_EQUIPMENT = "kisan/book/{id}"
    fun bookEquipment(id: String) = "kisan/book/$id"
    const val JOBS = "kisan/jobs"
    const val POST_JOB = "kisan/post-job"

    // FarmerConnect sub-screens
    const val FARMER_CONNECT_HOME = "farmerconnect/home"
    const val PROPERTIES = "farmerconnect/properties"
    const val ADD_PROPERTY = "farmerconnect/add-property"

    // Intelligence sub-screens
    const val INTELLIGENCE_HOME = "intelligence/home"
    const val PRICES = "intelligence/prices"
    const val HEATMAP = "intelligence/heatmap"

    // Others
    const val COMMUNITY = "community"
    const val CREATE_POST = "community/create"
    const val ORDERS = "orders"
    const val NOTIFICATIONS = "notifications"
}

// ─── Bottom Tab Items ──────────────────────────────────────
data class BottomTab(val route: String, val label: String, val iconSelected: ImageVector, val iconUnselected: ImageVector)

val bottomTabs = listOf(
    BottomTab(Routes.HOME, "Home", Icons.Filled.Home, Icons.Outlined.Home),
    BottomTab(Routes.AGRIFLOW, "AgriFlow", Icons.Filled.Eco, Icons.Outlined.Eco),
    BottomTab(Routes.AQUAOS, "AquaOS", Icons.Filled.Water, Icons.Outlined.Water),
    BottomTab(Routes.KISAN, "Kisan", Icons.Filled.People, Icons.Outlined.People),
    BottomTab(Routes.PROFILE, "Profile", Icons.Filled.Person, Icons.Outlined.Person),
)

val tabRoutes = bottomTabs.map { it.route }.toSet()

// ─── Root Composable ───────────────────────────────────────
@Composable
fun AgriHubNavHost() {
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsStateWithLifecycle()

    when (isLoggedIn) {
        null -> com.agrihub.app.ui.components.LoadingScreen("Starting AgriHub...")
        false -> AuthNavHost(authViewModel)
        true -> MainNavHost()
    }
}

// ─── Auth Navigation ───────────────────────────────────────
@Composable
fun AuthNavHost(authViewModel: AuthViewModel) {
    val navController = rememberNavController()
    NavHost(navController, startDestination = Routes.PHONE) {
        composable(Routes.PHONE) {
            PhoneScreen(
                viewModel = authViewModel,
                onOtpSent = { phone -> navController.navigate(Routes.otp(phone)) },
            )
        }
        composable(
            Routes.OTP,
            arguments = listOf(navArgument("phone") { type = NavType.StringType }),
        ) { entry ->
            val phone = entry.arguments?.getString("phone") ?: ""
            OtpScreen(viewModel = authViewModel, phone = phone)
        }
    }
}

// ─── Main Navigation (with bottom bar) ─────────────────────
@Composable
fun MainNavHost() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showBottomBar = currentRoute in tabRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = AppColor.Surface) {
                    bottomTabs.forEach { tab ->
                        val selected = currentRoute == tab.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    if (selected) tab.iconSelected else tab.iconUnselected,
                                    contentDescription = tab.label,
                                )
                            },
                            label = { Text(tab.label, fontSize = 10.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AppColor.Primary,
                                selectedTextColor = AppColor.Primary,
                                indicatorColor = AppColor.Primary.copy(alpha = 0.1f),
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(padding),
        ) {
            // ── Tab roots ──
            composable(Routes.HOME) { HomeScreen(navController) }
            composable(Routes.AGRIFLOW) { AgriFlowHomeScreen(navController) }
            composable(Routes.AQUAOS) { AquaOSHomeScreen(navController) }
            composable(Routes.KISAN) { KisanHomeScreen(navController) }
            composable(Routes.PROFILE) { ProfileScreen(navController) }

            // ── AgriFlow ──
            composable(Routes.LISTINGS) { ListingsScreen(navController) }
            composable(Routes.LISTING_DETAIL, arguments = listOf(navArgument("id") { type = NavType.StringType })) {
                ListingDetailScreen(navController, it.arguments?.getString("id") ?: "")
            }
            composable(Routes.CREATE_LISTING) { CreateListingScreen(navController) }
            composable(Routes.DECLARATIONS) { DeclarationsScreen(navController) }
            composable(Routes.CREATE_DECLARATION) { CreateDeclarationScreen(navController) }
            composable(Routes.INQUIRIES) { InquiriesScreen(navController) }

            // ── AquaOS ──
            composable(Routes.PONDS) { PondsScreen(navController) }
            composable(Routes.POND_DETAIL, arguments = listOf(navArgument("id") { type = NavType.StringType })) {
                PondDetailScreen(navController, it.arguments?.getString("id") ?: "")
            }
            composable(Routes.ADD_POND) { AddPondScreen(navController) }
            composable(Routes.HARVEST_LISTINGS) { HarvestListingsScreen(navController) }
            composable(Routes.WATER_LOG, arguments = listOf(navArgument("pondId") { type = NavType.StringType })) {
                WaterLogScreen(navController, it.arguments?.getString("pondId") ?: "")
            }
            composable(Routes.ADVISORIES) { AdvisoriesScreen(navController) }

            // ── KisanConnect ──
            composable(Routes.EQUIPMENT) { EquipmentScreen(navController) }
            composable(Routes.BOOK_EQUIPMENT, arguments = listOf(navArgument("id") { type = NavType.StringType })) {
                BookEquipmentScreen(navController, it.arguments?.getString("id") ?: "")
            }
            composable(Routes.JOBS) { JobsScreen(navController) }
            composable(Routes.POST_JOB) { PostJobScreen(navController) }

            // ── FarmerConnect ──
            composable(Routes.FARMER_CONNECT_HOME) { FarmerConnectHomeScreen(navController) }
            composable(Routes.PROPERTIES) { PropertiesScreen(navController) }
            composable(Routes.ADD_PROPERTY) { AddPropertyScreen(navController) }

            // ── Intelligence ──
            composable(Routes.INTELLIGENCE_HOME) { IntelligenceHomeScreen(navController) }
            composable(Routes.PRICES) { PricesScreen(navController) }
            composable(Routes.HEATMAP) { HeatmapScreen(navController) }

            // ── Community ──
            composable(Routes.COMMUNITY) { CommunityScreen(navController) }
            composable(Routes.CREATE_POST) { CreatePostScreen(navController) }

            // ── Orders ──
            composable(Routes.ORDERS) { OrdersScreen(navController) }

            // ── Notifications ──
            composable(Routes.NOTIFICATIONS) { NotificationsScreen(navController) }
        }
    }
}
