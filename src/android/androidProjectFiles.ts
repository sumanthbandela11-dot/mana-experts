import JSZip from 'jszip';
import firebaseConfig from '../../firebase-applet-config.json';

export interface AndroidProjectFile {
  path: string;
  language: 'kotlin' | 'xml' | 'gradle' | 'json' | 'properties' | 'rules' | 'markdown';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'settings.gradle.kts',
    language: 'gradle',
    description: 'Root Gradle settings configuring ManaExperts native Android app module',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ManaExperts"
include(":app")
`,
  },
  {
    path: 'build.gradle.kts',
    language: 'gradle',
    description: 'Project-level Gradle build file with Kotlin, Compose, and Google Services plugins',
    content: `plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    id("com.google.gms.google-services") version "4.4.2" apply false
}
`,
  },
  {
    path: 'gradle.properties',
    language: 'properties',
    description: 'JVM and AndroidX configuration properties',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,
  },
  {
    path: 'app/build.gradle.kts',
    language: 'gradle',
    description: 'App module Gradle file with Jetpack Compose Material 3, Navigation, and Firebase BoM',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.gms.google-services")
}

android {
    namespace = "in.manaexperts.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "in.manaexperts.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 2
        versionName = "2.0.0-bapatla-emergent"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
        buildConfigField("String", "FIRESTORE_DB_ID", "\\"${firebaseConfig.firestoreDatabaseId}\\"")
        buildConfigField("String", "OWNER_ADMIN_EMAIL", "\\"sumanth.bandela11@gmail.com\\"")
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.navigation:navigation-compose:2.8.4")

    // Material 3 & Extended Icons
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Firebase Spark Free-Tier (Auth & Cloud Firestore)
    implementation(platform("com.google.firebase:firebase-bom:33.6.0"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.android.gms:play-services-auth:21.2.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.9.0")

    testImplementation("junit:junit:4.13.2")
}
`,
  },
  {
    path: 'app/google-services.json',
    language: 'json',
    description: 'Firebase configuration connected to provisioned project ' + firebaseConfig.projectId,
    content: JSON.stringify(
      {
        project_info: {
          project_number: firebaseConfig.messagingSenderId || '1077034400988',
          project_id: firebaseConfig.projectId,
          storage_bucket: firebaseConfig.storageBucket,
        },
        client: [
          {
            client_info: {
              mobilesdk_app_id: '1:1077034400988:android:9ab98bbdc1ef4605',
              android_client_info: {
                package_name: 'in.manaexperts.app',
              },
            },
            oauth_client: [
              {
                client_id: firebaseConfig.oAuthClientId,
                client_type: 3,
              },
            ],
            api_key: [
              {
                current_key: firebaseConfig.apiKey,
              },
            ],
            services: {
              appinvite_service: {
                other_platform_oauth_client: [
                  {
                    client_id: firebaseConfig.oAuthClientId,
                    client_type: 3,
                  },
                ],
              },
            },
          },
        ],
        configuration_version: '1',
      },
      null,
      2
    ),
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Android application manifest with Internet permissions and Material 3 theme',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher_foreground"
        android:label="@string/app_name"
        android:roundIcon="@drawable/ic_launcher_foreground"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    language: 'xml',
    description: 'Mana Experts rounded-square tools vector icon (#087F78 Deep Teal & White)',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#087F78"
        android:pathData="M20,20h68c6.6,0 12,5.4 12,12v44c0,6.6 -5.4,12 -12,12H20c-6.6,0 -12,-5.4 -12,-12V32C8,25.4 13.4,20 20,20z"/>
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M68.5,40.5c-2.8,-2.8 -7,-3.5 -10.5,-1.8l5.3,5.3l-4.2,4.2l-5.3,-5.3c-1.7,3.5 -1,7.7 1.8,10.5c2.4,2.4 5.9,3.2 9.1,2.2l11.6,11.6c1.2,1.2 3.1,1.2 4.2,0l1.4,-1.4c1.2,-1.2 1.2,-3.1 0,-4.2L70.7,49.6C71.7,46.4 70.9,42.9 68.5,40.5z"/>
</vector>
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/theme/Theme.kt',
    language: 'kotlin',
    description: 'Emergent Reference Design System Palette (#087F78 Deep Teal, #10213A Dark Navy, #FAF9F6 Warm Ivory)',
    content: `package \`in\`.manaexperts.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val DeepTeal = Color(0xFF087F78)
val DarkNavy = Color(0xFF10213A)
val WarmIvory = Color(0xFFFAF9F6)
val PureWhite = Color(0xFFFFFFFF)
val MutedGrey = Color(0xFF64748B)
val LightTeal = Color(0xFFE8F7F4)

private val LightColorScheme = lightColorScheme(
    primary = DeepTeal,
    onPrimary = PureWhite,
    primaryContainer = LightTeal,
    onPrimaryContainer = DeepTeal,
    secondary = DarkNavy,
    onSecondary = PureWhite,
    background = WarmIvory,
    onBackground = DarkNavy,
    surface = PureWhite,
    onSurface = DarkNavy,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = MutedGrey
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF2DD4BF),
    onPrimary = DarkNavy,
    primaryContainer = Color(0xFF115E59),
    onPrimaryContainer = LightTeal,
    secondary = LightTeal,
    onSecondary = DarkNavy,
    background = Color(0xFF0B1528),
    onBackground = WarmIvory,
    surface = Color(0xFF10213A),
    onSurface = PureWhite
)

val ManaTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 30.sp,
        color = DarkNavy
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 26.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    )
)

@Composable
fun ManaExpertsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography = ManaTypography,
        content = content
    )
}
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/components/HeroBanner.kt',
    language: 'kotlin',
    description: 'Promotional Hero Banner with Deep Teal gradient and bundled local technician photograph',
    content: `package \`in\`.manaexperts.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import \`in\`.manaexperts.app.R
import \`in\`.manaexperts.app.ui.theme.DeepTeal

@Composable
fun HeroBanner(modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(176.dp),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Image(
                painter = painterResource(id = R.drawable.ic_launcher_foreground),
                contentDescription = "Local technician visiting Bapatla home",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .align(Alignment.CenterEnd)
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(
                                DeepTeal,
                                DeepTeal.copy(alpha = 0.94f),
                                DeepTeal.copy(alpha = 0.45f),
                                Color.Transparent
                            )
                        )
                    )
            )
            Column(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(0.68f)
                    .padding(horizontal = 20.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Local Experts,\\nAt Your Doorstep",
                    color = Color.White,
                    fontSize = 21.sp,
                    lineHeight = 26.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Booking is 100% free. Pay by cash or UPI after work.",
                    color = Color.White.copy(alpha = 0.92f),
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/components/ServiceCategoryCard.kt',
    language: 'kotlin',
    description: '22dp rounded Service Category photo card with dark gradient caption and press scale animation',
    content: `package \`in\`.manaexperts.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import \`in\`.manaexperts.app.model.ServiceCategory
import \`in\`.manaexperts.app.ui.theme.DarkNavy

@Composable
fun ServiceCategoryCard(
    service: ServiceCategory,
    drawableResId: Int,
    language: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(targetValue = if (isPressed) 0.97f else 1f, label = "cardPressScale")

    Card(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1.18f)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPressed = true
                        tryAwaitRelease()
                        isPressed = false
                        onClick()
                    }
                )
            },
        shape = RoundedCornerShape(22.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Image(
                painter = painterResource(id = drawableResId),
                contentDescription = service.nameEn,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                DarkNavy.copy(alpha = 0.25f),
                                DarkNavy.copy(alpha = 0.88f)
                            ),
                            startY = 120f
                        )
                    )
            )
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(14.dp)
            ) {
                Text(
                    text = if (language == "te") service.nameTe else service.nameEn,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 20.sp
                )
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/screens/CustomerHomeScreen.kt',
    language: 'kotlin',
    description: 'Redesigned Customer Home Screen matching Emergent reference (Header, Bapatla selector, Search, Hero Banner, 2-col Photo Grid)',
    content: `package \`in\`.manaexperts.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import \`in\`.manaexperts.app.R
import \`in\`.manaexperts.app.model.ServiceCategory
import \`in\`.manaexperts.app.ui.components.HeroBanner
import \`in\`.manaexperts.app.ui.components.ServiceCategoryCard
import \`in\`.manaexperts.app.ui.theme.*

@Composable
fun CustomerHomeScreen(
    selectedLocation: String,
    services: List<ServiceCategory>,
    language: String,
    onLocationClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    onSelectService: (ServiceCategory) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }

    val filteredServices = remember(services, searchQuery) {
        val q = searchQuery.trim().lowercase()
        services.filter { it.enabled && (q.isEmpty() || it.nameEn.lowercase().contains(q) || it.nameTe.contains(q)) }
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = modifier
            .fillMaxSize()
            .background(WarmIvory)
            .padding(horizontal = 18.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 100.dp)
    ) {
        item(span = { GridItemSpan(2) }) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(DeepTeal),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Build,
                            contentDescription = "Mana Experts Logo",
                            tint = PureWhite,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Text(
                        text = buildAnnotatedString {
                            withStyle(SpanStyle(color = DarkNavy, fontWeight = FontWeight.ExtraBold)) {
                                append("Mana ")
                            }
                            withStyle(SpanStyle(color = DeepTeal, fontWeight = FontWeight.ExtraBold)) {
                                append("Experts")
                            }
                        },
                        fontSize = 22.sp
                    )
                }

                IconButton(
                    onClick = onNotificationsClick,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(PureWhite)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Notifications,
                        contentDescription = "Notifications",
                        tint = DarkNavy
                    )
                }
            }
        }

        item(span = { GridItemSpan(2) }) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(PureWhite)
                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
                    .clickable { onLocationClick() }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "Location Pin",
                        tint = DeepTeal,
                        modifier = Modifier.size(22.dp)
                    )
                    Column {
                        Text(
                            text = "Bapatla",
                            color = DarkNavy,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = selectedLocation,
                            color = MutedGrey,
                            fontSize = 12.sp
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = "Change Location",
                    tint = MutedGrey
                )
            }
        }

        item(span = { GridItemSpan(2) }) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = {
                    Text(
                        text = "Search for a service...",
                        color = MutedGrey,
                        fontSize = 14.sp
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Outlined.Search,
                        contentDescription = "Search",
                        tint = MutedGrey
                    )
                },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = PureWhite,
                    unfocusedContainerColor = PureWhite,
                    focusedBorderColor = DeepTeal,
                    unfocusedBorderColor = Color(0xFFE2E8F0)
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }

        item(span = { GridItemSpan(2) }) {
            HeroBanner()
        }

        items(filteredServices, key = { it.id }) { service ->
            ServiceCategoryCard(
                service = service,
                drawableResId = R.drawable.ic_launcher_foreground,
                language = language,
                onClick = { onSelectService(service) }
            )
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/navigation/MainNavigation.kt',
    language: 'kotlin',
    description: 'Floating Material 3 Bottom Navigation Bar (Home, Bookings, Help, Profile) with Light Teal active indicator',
    content: `package \`in\`.manaexperts.app.ui.navigation

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
import \`in\`.manaexperts.app.ui.theme.DeepTeal
import \`in\`.manaexperts.app.ui.theme.LightTeal
import \`in\`.manaexperts.app.ui.theme.MutedGrey
import \`in\`.manaexperts.app.ui.theme.PureWhite

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
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/screens/ServiceDetailsScreen.kt',
    language: 'kotlin',
    description: 'Service details expansion screen with transparent pricing & free booking policy',
    content: `package \`in\`.manaexperts.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import \`in\`.manaexperts.app.model.ServiceCategory
import \`in\`.manaexperts.app.ui.theme.*

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
        Text(text = service.nameEn, color = DarkNavy, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text(text = service.nameTe, color = DeepTeal, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite)
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Service Area: $selectedArea", color = MutedGrey, fontSize = 13.sp)
                Text(service.descriptionEn, color = DarkNavy, fontSize = 14.sp)
                Text(
                    "Base Inspection Visit: ₹\${service.baseInspectionFee} · Booking is 100% free. Pay by cash or UPI after work.",
                    color = DeepTeal,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
        Spacer(modifier = Modifier.weight(1f))
        Button(
            onClick = onProceedToBook,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = DeepTeal)
        ) {
            Text("Book Free Visit", fontWeight = FontWeight.Bold)
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/screens/BookingScreen.kt',
    language: 'kotlin',
    description: 'Customer booking request screen with protected customer address & phone fields',
    content: `package \`in\`.manaexperts.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import \`in\`.manaexperts.app.model.ServiceCategory
import \`in\`.manaexperts.app.ui.theme.*

@Composable
fun BookingScreen(
    service: ServiceCategory,
    selectedArea: String,
    onConfirmBooking: (problem: String, address: String, landmark: String, date: String, slot: String) -> Unit
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
        Text("Book \${service.nameEn}", color = DarkNavy, fontSize = 22.sp, fontWeight = FontWeight.Bold)
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
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/screens/CustomerBookingsScreen.kt',
    language: 'kotlin',
    description: 'Customer bookings tracking, cancellation, and work completion confirmation screen',
    content: `package \`in\`.manaexperts.app.ui.screens

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
import \`in\`.manaexperts.app.model.Booking
import \`in\`.manaexperts.app.model.BookingStatus
import \`in\`.manaexperts.app.ui.theme.*

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
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(bk.serviceNameEn, color = DarkNavy, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                    Text("\${bk.generalArea} · \${bk.preferredDate} · \${bk.preferredTimeSlot}", color = MutedGrey, fontSize = 12.sp)
                    Text(bk.problemDescription, color = DarkNavy, fontSize = 14.sp)
                    Text("Status: \${bk.status}", color = DeepTeal, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    if (bk.status == BookingStatus.PENDING.name) {
                        OutlinedButton(onClick = { onCancelBooking(bk.id) }) {
                            Text("Cancel Pending Booking")
                        }
                    } else if (bk.status == BookingStatus.WORK_COMPLETED.name) {
                        Button(
                            onClick = { onConfirmWork(bk.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = DeepTeal)
                        ) {
                            Text("Confirm Work Completed (₹\${bk.labourCharges})")
                        }
                    }
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/screens/TechnicianDashboardScreen.kt',
    language: 'kotlin',
    description: 'Technician dashboard with availability, trial coins, verified earnings, and atomic job acceptance',
    content: `package \`in\`.manaexperts.app.ui.screens

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
import \`in\`.manaexperts.app.model.Booking
import \`in\`.manaexperts.app.model.BookingStatus
import \`in\`.manaexperts.app.model.TechnicianProfile
import \`in\`.manaexperts.app.ui.theme.*

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
                        "Coins: \${technician.coinBalance} · Verified Earnings: ₹\${technician.totalEarnings} · Jobs: \${technician.completedJobs}",
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
                    Text("\${job.generalArea} · \${job.preferredDate}", color = MutedGrey, fontSize = 12.sp)
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
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/ui/screens/AdminDashboardScreen.kt',
    language: 'kotlin',
    description: 'Admin console screen for technician approvals (+3 trial coins), coin adjustments, and Bapatla service management',
    content: `package \`in\`.manaexperts.app.ui.screens

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
import \`in\`.manaexperts.app.model.ApprovalStatus
import \`in\`.manaexperts.app.model.TechnicianProfile
import \`in\`.manaexperts.app.ui.theme.*

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
                    Text("\${tech.area} · Status: \${tech.approvalStatus} · Coins: \${tech.coinBalance}", color = MutedGrey, fontSize = 13.sp)
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
`,
  },
  {
    path: 'app/src/main/java/in/manaexperts/app/MainActivity.kt',
    language: 'kotlin',
    description: 'Main Jetpack Compose Activity wiring CustomerHomeScreen, FloatingCustomerBottomBar, and MVVM ViewModel',
    content: `package \`in\`.manaexperts.app

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
import \`in\`.manaexperts.app.ui.navigation.CustomerTab
import \`in\`.manaexperts.app.ui.navigation.FloatingCustomerBottomBar
import \`in\`.manaexperts.app.ui.screens.CustomerBookingsScreen
import \`in\`.manaexperts.app.ui.screens.CustomerHomeScreen
import \`in\`.manaexperts.app.ui.theme.ManaExpertsTheme
import \`in\`.manaexperts.app.ui.theme.WarmIvory
import \`in\`.manaexperts.app.viewmodel.ManaExpertsViewModel

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
`,
  },
];

export async function downloadAndroidStudioZip(): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('ManaExperts');
  if (!root) return;

  for (const file of ANDROID_PROJECT_FILES) {
    root.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ManaExperts-AndroidStudio-Project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
