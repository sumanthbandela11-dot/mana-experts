package `in`.manaexperts.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.manaexperts.app.model.ServiceCategory
import `in`.manaexperts.app.ui.theme.*

@Composable
fun ServiceDetailsScreen(
    service: ServiceCategory,
    selectedArea: String,
    onProceedToBook: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WarmIvory)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = service.nameEn,
            color = DarkNavy,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = service.nameTe,
            color = DeepTeal,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold
        )
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite)
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Service Area: $selectedArea", color = MutedGrey, fontSize = 13.sp)
                Text(service.descriptionEn, color = DarkNavy, fontSize = 14.sp)
                Text(
                    "Base Inspection Visit: ₹${service.baseInspectionFee} · Booking is 100% free. Pay by cash or UPI after work.",
                    color = DeepTeal,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
        Spacer(modifier = Modifier.weight(1f))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = onBack,
                modifier = Modifier.weight(1f).height(52.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Back")
            }
            Button(
                onClick = onProceedToBook,
                modifier = Modifier.weight(2f).height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DeepTeal)
            ) {
                Text("Book Free Visit", fontWeight = FontWeight.Bold)
            }
        }
    }
}
