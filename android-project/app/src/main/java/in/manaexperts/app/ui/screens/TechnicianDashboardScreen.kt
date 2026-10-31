package `in`.manaexperts.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.manaexperts.app.model.Booking
import `in`.manaexperts.app.model.BookingStatus
import `in`.manaexperts.app.model.TechnicianProfile
import `in`.manaexperts.app.ui.theme.*

@Composable
fun TechnicianDashboardScreen(
    technician: TechnicianProfile,
    availableBookings: List<Booking>,
    onAcceptJob: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(WarmIvory)
            .padding(horizontal = 18.dp),
        contentPadding = PaddingValues(top = 18.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = DarkNavy),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(technician.name, color = PureWhite, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "Coins: ${technician.coinBalance} · Verified Earnings: ₹${technician.totalEarnings} · Jobs: ${technician.completedJobs}",
                        color = LightTeal,
                        fontSize = 13.sp
                    )
                }
            }
        }
        items(availableBookings.filter { it.status == BookingStatus.PENDING.name }, key = { it.id }) { job ->
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(job.serviceNameEn, color = DarkNavy, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text("${job.generalArea} · ${job.preferredDate}", color = MutedGrey, fontSize = 12.sp)
                    Text(job.problemDescription, color = DarkNavy, fontSize = 14.sp)
                    Button(
                        onClick = { onAcceptJob(job.id) },
                        colors = ButtonDefaults.buttonColors(containerColor = DeepTeal),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Accept Booking (Uses 1 Coin)")
                    }
                }
            }
        }
    }
}
