package `in`.manaexperts.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import `in`.manaexperts.app.ui.navigation.CustomerTab
import `in`.manaexperts.app.ui.navigation.FloatingCustomerBottomBar
import `in`.manaexperts.app.ui.screens.CustomerBookingsScreen
import `in`.manaexperts.app.ui.screens.CustomerHomeScreen
import `in`.manaexperts.app.ui.theme.ManaExpertsTheme
import `in`.manaexperts.app.ui.theme.WarmIvory
import `in`.manaexperts.app.viewmodel.ManaExpertsViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ManaExpertsTheme {
                ManaExpertsRootApp()
            }
        }
    }
}

@Composable
fun ManaExpertsRootApp(vm: ManaExpertsViewModel = viewModel()) {
    val state by vm.uiState.collectAsState()
    var activeTab by remember { mutableStateOf(CustomerTab.HOME) }
    var selectedArea by remember { mutableStateOf("Bapatla - Railpet") }

    Scaffold(
        containerColor = WarmIvory,
        bottomBar = {
            FloatingCustomerBottomBar(
                selectedTab = activeTab,
                onSelectTab = { activeTab = it }
            )
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when (activeTab) {
                CustomerTab.HOME -> CustomerHomeScreen(
                    selectedLocation = selectedArea,
                    services = state.services,
                    language = state.language,
                    onLocationClick = {},
                    onNotificationsClick = {},
                    onSelectService = {}
                )
                CustomerTab.BOOKINGS -> CustomerBookingsScreen(
                    bookings = state.bookings,
                    onCancelBooking = {},
                    onConfirmWork = {}
                )
                CustomerTab.HELP -> CustomerHomeScreen(
                    selectedLocation = selectedArea,
                    services = state.services,
                    language = state.language,
                    onLocationClick = {},
                    onNotificationsClick = {},
                    onSelectService = {}
                )
                CustomerTab.PROFILE -> CustomerHomeScreen(
                    selectedLocation = selectedArea,
                    services = state.services,
                    language = state.language,
                    onLocationClick = {},
                    onNotificationsClick = {},
                    onSelectService = {}
                )
            }
        }
    }
}
