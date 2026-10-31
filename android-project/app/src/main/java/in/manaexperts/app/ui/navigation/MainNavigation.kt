package `in`.manaexperts.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material.icons.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import `in`.manaexperts.app.ui.theme.DeepTeal
import `in`.manaexperts.app.ui.theme.LightTeal
import `in`.manaexperts.app.ui.theme.MutedGrey
import `in`.manaexperts.app.ui.theme.PureWhite

enum class CustomerTab(val label: String) {
    HOME("Home"),
    BOOKINGS("Bookings"),
    HELP("Help"),
    PROFILE("Profile")
}

@Composable
fun FloatingCustomerBottomBar(
    selectedTab: CustomerTab,
    onSelectTab: (CustomerTab) -> Unit,
    modifier: Modifier = Modifier
) {
    NavigationBar(
        modifier = modifier
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .shadow(elevation = 12.dp, shape = RoundedCornerShape(24.dp)),
        containerColor = PureWhite,
        tonalElevation = 0.dp
    ) {
        CustomerTab.entries.forEach { tab ->
            val isSelected = selectedTab == tab
            NavigationBarItem(
                selected = isSelected,
                onClick = { onSelectTab(tab) },
                icon = {
                    val icon = when (tab) {
                        CustomerTab.HOME -> if (isSelected) Icons.Filled.Home else Icons.Outlined.Home
                        CustomerTab.BOOKINGS -> if (isSelected) Icons.Filled.CalendarToday else Icons.Outlined.CalendarToday
                        CustomerTab.HELP -> if (isSelected) Icons.Filled.HelpOutline else Icons.Outlined.HelpOutline
                        CustomerTab.PROFILE -> if (isSelected) Icons.Filled.Person else Icons.Outlined.PersonOutline
                    }
                    Icon(imageVector = icon, contentDescription = tab.label)
                },
                label = { Text(tab.label) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = DeepTeal,
                    selectedTextColor = DeepTeal,
                    indicatorColor = LightTeal,
                    unselectedIconColor = MutedGrey,
                    unselectedTextColor = MutedGrey
                )
            )
        }
    }
}
