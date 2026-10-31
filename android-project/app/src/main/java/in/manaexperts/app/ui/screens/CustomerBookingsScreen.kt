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
import `in`.manaexperts.app.ui.theme.*

@Composable
fun CustomerBookingsScreen(
    bookings: List<Booking>,
    onCancelBooking: (String) -> Unit,
    onConfirmWork: (String) -> Unit
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
            Text("My Bookings", color = DarkNavy, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        }
        items(bookings, key = { it.id }) { bk ->
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(bk.serviceNameEn, color = DarkNavy, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                    Text("${bk.generalArea} · ${bk.preferredDate} · ${bk.preferredTimeSlot}", color = MutedGrey, fontSize = 12.sp)
                    Text(bk.problemDescription, color = DarkNavy, fontSize = 14.sp)
                    Text("Status: ${bk.status}", color = DeepTeal, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    if (bk.status == BookingStatus.PENDING.name) {
                        OutlinedButton(onClick = { onCancelBooking(bk.id) }) {
                            Text("Cancel Pending Booking")
                        }
                    } else if (bk.status == BookingStatus.WORK_COMPLETED.name) {
                        Button(
                            onClick = { onConfirmWork(bk.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = DeepTeal)
                        ) {
                            Text("Confirm Work Completed (₹${bk.labourCharges})")
                        }
                    }
                }
            }
        }
    }
}
