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
fun BookingScreen(
    service: ServiceCategory,
    selectedArea: String,
    onConfirmBooking: (problem: String, address: String, landmark: String, date: String, slot: String) -> Unit,
    onCancel: () -> Unit
) {
    var problem by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var landmark by remember { mutableStateOf("") }
    var preferredDate by remember { mutableStateOf("2026-10-29") }
    var preferredSlot by remember { mutableStateOf("10:00 AM - 12:00 PM") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WarmIvory)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Book ${service.nameEn}", color = DarkNavy, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text("Area: $selectedArea · Phone & address protected until technician accepts", color = MutedGrey, fontSize = 12.sp)

        OutlinedTextField(
            value = problem,
            onValueChange = { problem = it },
            label = { Text("Describe the problem") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        )
        OutlinedTextField(
            value = address,
            onValueChange = { address = it },
            label = { Text("House / Street Address in Bapatla") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        )
        OutlinedTextField(
            value = landmark,
            onValueChange = { landmark = it },
            label = { Text("Nearby Landmark") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = preferredDate,
                onValueChange = { preferredDate = it },
                label = { Text("Date") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(14.dp)
            )
            OutlinedTextField(
                value = preferredSlot,
                onValueChange = { preferredSlot = it },
                label = { Text("Time Slot") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(14.dp)
            )
        }
        Spacer(modifier = Modifier.weight(1f))
        Button(
            onClick = { onConfirmBooking(problem, address, landmark, preferredDate, preferredSlot) },
            enabled = problem.trim().length >= 5 && address.trim().length >= 5,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DeepTeal)
        ) {
            Text("Confirm 100% Free Booking", fontWeight = FontWeight.Bold)
        }
    }
}
