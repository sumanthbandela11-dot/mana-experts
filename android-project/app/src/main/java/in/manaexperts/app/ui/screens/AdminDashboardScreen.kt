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
import `in`.manaexperts.app.model.ApprovalStatus
import `in`.manaexperts.app.model.TechnicianProfile
import `in`.manaexperts.app.ui.theme.*

@Composable
fun AdminDashboardScreen(
    technicians: List<TechnicianProfile>,
    onApproveTechnician: (String) -> Unit
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
            Text("Admin Console · Bapatla", color = DarkNavy, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        }
        items(technicians, key = { it.uid }) { tech ->
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(tech.name, color = DarkNavy, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text("${tech.area} · Status: ${tech.approvalStatus} · Coins: ${tech.coinBalance}", color = MutedGrey, fontSize = 13.sp)
                    if (tech.approvalStatus == ApprovalStatus.PENDING.name) {
                        Button(
                            onClick = { onApproveTechnician(tech.uid) },
                            colors = ButtonDefaults.buttonColors(containerColor = DeepTeal),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text("Approve (+3 Free Trial Coins)")
                        }
                    }
                }
            }
        }
    }
}
