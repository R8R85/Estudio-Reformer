package es.estudioreformer.app.ui.theme

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import es.estudioreformer.app.R

/** The persistent top bar every screen in the prototype shares: mark logo,
 * studio name + a per-role subtitle, and an avatar with the user's
 * initials. */
@Composable
fun StudioHeader(subtitle: String, avatarText: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(Theme.bg)
            .padding(horizontal = 16.dp)
            .padding(top = 8.dp, bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Theme.bg)
                .border(1.dp, Theme.neutral800, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Image(
                painter = painterResource(R.drawable.logo_mark),
                contentDescription = "Estudio Reformer",
                modifier = Modifier.size(28.dp),
                contentScale = ContentScale.Fit,
            )
        }
        Column(Modifier.weight(1f)) {
            Text("Estudio Reformer", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Theme.text)
            Text(subtitle, fontSize = 11.sp, color = Theme.neutral500)
        }
        Box(
            Modifier.size(32.dp).clip(CircleShape).background(Theme.accent800),
            contentAlignment = Alignment.Center,
        ) {
            Text(avatarText, fontSize = 12.sp, color = Theme.accent100)
        }
    }
}

/** Helper shared by member + admin ficha screens. */
fun initials(name: String): String =
    name.trim().split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString("").uppercase()
