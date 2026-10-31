import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/images/services');
fs.mkdirSync(outDir, { recursive: true });

// High-detail realistic studio SVG-to-PNG scenes with warm Indian home interiors,
// depth-of-field lighting, authentic tools, and distinct Indian technicians for each category.
const scenes = [
  {
    name: 'hero_technician_banner',
    width: 1000,
    height: 520,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 520" width="1000" height="520">
      <defs>
        <linearGradient id="bgWall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#087F78"/>
          <stop offset="45%" stop-color="#0C6B65"/>
          <stop offset="100%" stop-color="#E6DFD3"/>
        </linearGradient>
        <linearGradient id="sunlight" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF7E6" stop-opacity="0.85"/>
          <stop offset="60%" stop-color="#F5E6CC" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#087F78" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="leftFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#087F78" stop-opacity="1"/>
          <stop offset="46%" stop-color="#087F78" stop-opacity="0.96"/>
          <stop offset="68%" stop-color="#087F78" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#087F78" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="bokeh1" cx="0.8" cy="0.25" r="0.35">
          <stop offset="0%" stop-color="#FFFBEB" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#FFFBEB" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Warm South Indian Living Room Interior on Right -->
      <rect width="1000" height="520" fill="url(#bgWall)"/>
      <rect x="420" y="0" width="580" height="520" fill="#EAE2D6"/>
      <!-- Window with warm Andhra daylight -->
      <rect x="760" y="40" width="190" height="240" rx="12" fill="#FFFDF9" stroke="#D5C7B2" stroke-width="8"/>
      <line x1="855" y1="40" x2="855" y2="280" stroke="#D5C7B2" stroke-width="6"/>
      <line x1="760" y1="160" x2="950" y2="160" stroke="#D5C7B2" stroke-width="6"/>
      <!-- Indoor plant & wooden shelf -->
      <rect x="500" y="90" width="180" height="12" rx="6" fill="#8B5A2B"/>
      <rect x="530" y="55" width="32" height="35" rx="4" fill="#D97706"/>
      <circle cx="546" cy="45" r="22" fill="#15803D"/>
      <circle cx="560" cy="52" r="16" fill="#22C55E"/>
      <rect width="1000" height="520" fill="url(#sunlight)"/>
      <circle cx="820" cy="130" r="180" fill="url(#bokeh1)"/>

      <!-- Friendly Indian Homeowner (Right) welcoming Technician -->
      <g transform="translate(795, 165)">
        <!-- Kurta / Saree shoulder -->
        <path d="M-65,355 C-65,240 65,240 65,355 Z" fill="#C2410C"/>
        <path d="M-45,255 L25,355 L65,355 L35,245 Z" fill="#F59E0B" opacity="0.85"/>
        <!-- Neck & Head -->
        <rect x="-14" y="195" width="28" height="36" rx="10" fill="#C68652"/>
        <ellipse cx="0" cy="155" rx="44" ry="52" fill="#D1905A"/>
        <!-- Hair -->
        <path d="M-44,150 C-48,100 48,95 44,155 C38,125 -32,125 -44,150 Z" fill="#1E1B18"/>
        <!-- Bindi & Warm Smile -->
        <circle cx="-4" cy="136" r="3.5" fill="#991B1B"/>
        <ellipse cx="-16" cy="150" rx="5" ry="3.5" fill="#1E1B18"/>
        <ellipse cx="10" cy="150" rx="5" ry="3.5" fill="#1E1B18"/>
        <path d="M-14,175 Q-2,188 12,175" fill="none" stroke="#7C2D12" stroke-width="3.5" stroke-linecap="round"/>
      </g>

      <!-- Professional Indian Technician in Teal Uniform (Center-Right) -->
      <g transform="translate(635, 115)">
        <!-- Torso in Deep Teal Polo Shirt -->
        <path d="M-95,405 C-95,255 95,255 95,405 Z" fill="#0F766E"/>
        <!-- Warm Orange Collar & Placket -->
        <path d="M-32,265 L0,305 L32,265 L18,255 L0,280 L-18,255 Z" fill="#FFFFFF"/>
        <rect x="-6" y="295" width="12" height="55" rx="4" fill="#087F78"/>
        <!-- Mana Experts ID Badge on Chest -->
        <rect x="24" y="315" width="38" height="26" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <rect x="29" y="321" width="14" height="14" rx="3" fill="#087F78"/>
        <line x1="47" y1="325" x2="57" y2="325" stroke="#10213A" stroke-width="2.5"/>
        <line x1="47" y1="332" x2="55" y2="332" stroke="#64748B" stroke-width="2"/>
        <!-- Neck & Face -->
        <rect x="-18" y="210" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="0" cy="162" rx="50" ry="60" fill="#C6824E"/>
        <!-- Neatly groomed hair & moustache -->
        <path d="M-50,152 C-54,92 54,88 50,152 C42,116 -38,116 -50,152 Z" fill="#18181B"/>
        <ellipse cx="-18" cy="156" rx="5.5" ry="4" fill="#18181B"/>
        <ellipse cx="18" cy="156" rx="5.5" ry="4" fill="#18181B"/>
        <path d="M-24,142 Q-18,137 -10,141" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M10,141 Q18,137 24,142" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Friendly Mustache & Smile -->
        <path d="M-18,180 Q0,173 18,180" fill="none" stroke="#18181B" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M-15,187 Q0,200 15,187" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
        <!-- Tool Kit Held in Hand -->
        <g transform="translate(-85, 325)">
          <rect x="0" y="20" width="110" height="65" rx="10" fill="#F97316" stroke="#C2410C" stroke-width="3"/>
          <path d="M35,20 L35,8 C35,4 75,4 75,8 L75,20" fill="none" stroke="#10213A" stroke-width="6" stroke-linecap="round"/>
          <rect x="12" y="42" width="86" height="10" rx="4" fill="#10213A" opacity="0.25"/>
          <rect x="46" y="36" width="18" height="22" rx="4" fill="#F8FAFC"/>
        </g>
      </g>

      <!-- Smooth Deep Teal Blend on Left for Hero Typography -->
      <rect width="1000" height="520" fill="url(#leftFade)"/>
    </svg>`
  },
  {
    name: 'electrician',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F5EFE6"/>
          <stop offset="100%" stop-color="#D8CFC2"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.35" cy="0.35" r="0.5">
          <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#FEF08A" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="480" fill="url(#wall)"/>
      <circle cx="220" cy="170" r="240" fill="url(#glow)"/>
      <!-- Electrical Distribution Board / MCB Panel on Wall -->
      <rect x="70" y="55" width="210" height="275" rx="12" fill="#CBD5E1" stroke="#64748B" stroke-width="5"/>
      <rect x="88" y="75" width="174" height="235" rx="6" fill="#1E293B"/>
      <!-- MCB Breakers & Copper/Insulated Wires -->
      <g transform="translate(105, 95)">
        <rect x="0" y="0" width="28" height="55" rx="4" fill="#E2E8F0"/>
        <rect x="34" y="0" width="28" height="55" rx="4" fill="#E2E8F0"/>
        <rect x="68" y="0" width="28" height="55" rx="4" fill="#E2E8F0"/>
        <rect x="102" y="0" width="38" height="55" rx="4" fill="#EF4444"/>
        <rect x="4" y="22" width="20" height="12" rx="2" fill="#087F78"/>
        <rect x="38" y="22" width="20" height="12" rx="2" fill="#087F78"/>
        <rect x="72" y="22" width="20" height="12" rx="2" fill="#F97316"/>
        <rect x="108" y="22" width="26" height="12" rx="2" fill="#10213A"/>
        <!-- Colorful Wiring Harness -->
        <path d="M14,55 C14,110 50,120 70,175" fill="none" stroke="#EF4444" stroke-width="6"/>
        <path d="M48,55 C48,105 75,120 85,175" fill="none" stroke="#EAB308" stroke-width="6"/>
        <path d="M82,55 C82,105 95,120 100,175" fill="none" stroke="#3B82F6" stroke-width="6"/>
        <path d="M120,55 C120,110 115,130 115,175" fill="none" stroke="#22C55E" stroke-width="6"/>
      </g>
      <!-- Digital Multimeter on Wall Shelf -->
      <rect x="105" y="255" width="62" height="44" rx="6" fill="#F59E0B" stroke="#1E293B" stroke-width="3"/>
      <rect x="113" y="263" width="46" height="18" rx="3" fill="#DCFCE7"/>
      <!-- Indian Electrician inspecting panel with Insulated Tester -->
      <g transform="translate(415, 95)">
        <path d="M-110,385 C-110,235 110,235 110,385 Z" fill="#087F78"/>
        <path d="M-38,245 L0,295 L38,245 Z" fill="#10213A"/>
        <rect x="-20" y="190" width="40" height="50" rx="14" fill="#B87644"/>
        <ellipse cx="-6" cy="142" rx="54" ry="62" fill="#C6824E"/>
        <path d="M-60,132 C-62,70 52,68 48,136 C36,100 -42,102 -60,132 Z" fill="#18181B"/>
        <ellipse cx="-24" cy="140" rx="5.5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="140" rx="5.5" ry="4" fill="#18181B"/>
        <path d="M-20,168 Q-8,162 6,168" fill="none" stroke="#18181B" stroke-width="4" stroke-linecap="round"/>
        <!-- Arm & Hand holding Voltage Screwdriver Tester to MCB -->
        <path d="M-75,275 L-195,185" fill="none" stroke="#087F78" stroke-width="38" stroke-linecap="round"/>
        <circle cx="-205" cy="178" r="18" fill="#C6824E"/>
        <line x1="-215" y1="172" x2="-270" y2="135" stroke="#F97316" stroke-width="10" stroke-linecap="round"/>
        <line x1="-270" y1="135" x2="-300" y2="115" stroke="#94A3B8" stroke-width="4" stroke-linecap="round"/>
        <circle cx="-300" cy="115" r="7" fill="#FEF08A"/>
      </g>
    </svg>`
  },
  {
    name: 'plumber',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <defs>
        <linearGradient id="tileBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E0F2FE"/>
          <stop offset="100%" stop-color="#BAE6FD"/>
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#tileBg)"/>
      <!-- Ceramic Tile Grid Lines -->
      <g stroke="#CBD5E1" stroke-width="2" opacity="0.65">
        <line x1="0" y1="120" x2="640" y2="120"/>
        <line x1="0" y1="240" x2="640" y2="240"/>
        <line x1="0" y1="360" x2="640" y2="360"/>
        <line x1="160" y1="0" x2="160" y2="480"/>
        <line x1="320" y1="0" x2="320" y2="480"/>
        <line x1="480" y1="0" x2="480" y2="480"/>
      </g>
      <!-- Washbasin & Chrome/PVC Pipe Assembly -->
      <path d="M50,150 L290,150 L265,225 L75,225 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="5"/>
      <path d="M170,95 L170,150" fill="none" stroke="#64748B" stroke-width="14" stroke-linecap="round"/>
      <path d="M170,95 L205,95" fill="none" stroke="#64748B" stroke-width="12" stroke-linecap="round"/>
      <!-- U-Trap & PVC Piping under sink -->
      <path d="M170,225 L170,320 C170,365 235,365 235,320 L235,285 L310,285" fill="none" stroke="#94A3B8" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="152" y="255" width="36" height="18" rx="4" fill="#475569"/>
      <rect x="217" y="295" width="36" height="18" rx="4" fill="#475569"/>
      <!-- Plumber tightening pipe joint with heavy Pipe Wrench -->
      <g transform="translate(455, 105)">
        <path d="M-110,375 C-110,235 110,235 110,375 Z" fill="#10213A"/>
        <path d="M-85,375 L-55,250 L55,250 L85,375 Z" fill="#087F78"/>
        <rect x="-20" y="190" width="40" height="48" rx="12" fill="#B87644"/>
        <ellipse cx="-8" cy="145" rx="52" ry="60" fill="#C6824E"/>
        <path d="M-60,136 C-60,75 48,75 44,138 C32,105 -42,105 -60,136 Z" fill="#18181B"/>
        <ellipse cx="-24" cy="142" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="6" cy="142" rx="5" ry="4" fill="#18181B"/>
        <path d="M-20,172 Q-8,180 6,172" fill="none" stroke="#7C2D12" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Arm & Red Heavy-Duty Pipe Wrench on Joint -->
        <path d="M-75,265 L-190,215" fill="none" stroke="#087F78" stroke-width="36" stroke-linecap="round"/>
        <line x1="-185" y1="212" x2="-275" y2="195" stroke="#DC2626" stroke-width="16" stroke-linecap="round"/>
        <rect x="-295" y="178" width="32" height="34" rx="5" fill="#334155"/>
        <circle cx="-185" cy="212" r="18" fill="#C6824E"/>
      </g>
    </svg>`
  },
  {
    name: 'carpenter',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <defs>
        <linearGradient id="woodShop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#78350F" stop-opacity="0.45"/>
        </linearGradient>
        <linearGradient id="teakTable" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#92400E"/>
          <stop offset="50%" stop-color="#B45309"/>
          <stop offset="100%" stop-color="#78350F"/>
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="#FEF3C7"/>
      <rect width="640" height="480" fill="url(#woodShop)"/>
      <!-- Wooden Door Frame & Teak Panel in Background -->
      <rect x="55" y="40" width="175" height="290" rx="8" fill="#B45309" stroke="#78350F" stroke-width="8"/>
      <rect x="78" y="65" width="129" height="105" rx="4" fill="#D97706"/>
      <rect x="78" y="190" width="129" height="115" rx="4" fill="#D97706"/>
      <!-- Carpenter Workbench & Teak Wood Plank -->
      <rect x="40" y="330" width="560" height="36" rx="6" fill="url(#teakTable)"/>
      <rect x="70" y="366" width="32" height="114" fill="#78350F"/>
      <rect x="530" y="366" width="32" height="114" fill="#78350F"/>
      <!-- Indian Carpenter Planing Wood with Hand Plane & Measuring Tape -->
      <g transform="translate(415, 85)">
        <path d="M-105,360 C-105,220 105,220 105,360 Z" fill="#D97706"/>
        <path d="M-75,360 L-50,240 L50,240 L75,360 Z" fill="#10213A"/>
        <rect x="-18" y="175" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="132" rx="50" ry="58" fill="#C6824E"/>
        <path d="M-56,122 C-58,66 48,66 44,125 C32,95 -38,95 -56,122 Z" fill="#18181B"/>
        <!-- Carpenter Pencil behind ear -->
        <line x1="28" y1="112" x2="56" y2="96" stroke="#EF4444" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="-22" cy="132" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="132" rx="5" ry="4" fill="#18181B"/>
        <path d="M-18,158 Q-6,166 8,158" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Arms pushing Wood Hand Plane on Workbench -->
        <path d="M-65,245 L-175,230" fill="none" stroke="#D97706" stroke-width="34" stroke-linecap="round"/>
        <rect x="-245" y="215" width="95" height="30" rx="6" fill="#475569" stroke="#1E293B" stroke-width="3"/>
        <rect x="-215" y="195" width="24" height="22" rx="4" fill="#92400E"/>
        <!-- Wood Shavings Curls -->
        <path d="M-255,235 Q-275,210 -290,235 T-320,230" fill="none" stroke="#FDE68A" stroke-width="6" stroke-linecap="round"/>
        <path d="M-265,242 Q-285,222 -300,242" fill="none" stroke="#FCD34D" stroke-width="5" stroke-linecap="round"/>
      </g>
    </svg>`
  },
  {
    name: 'ac_repair',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <rect width="640" height="480" fill="#F1F5F9"/>
      <!-- Wall-Mounted Split AC Unit (Open Service Cover) -->
      <g transform="translate(55, 50)">
        <rect x="0" y="0" width="360" height="125" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="5"/>
        <!-- Cooling Fins & Blue Mesh Filter Exposed -->
        <rect x="22" y="20" width="316" height="58" rx="6" fill="#0F172A"/>
        <rect x="28" y="26" width="145" height="46" rx="4" fill="#0284C7" opacity="0.85"/>
        <rect x="182" y="26" width="148" height="46" rx="4" fill="#0369A1" opacity="0.85"/>
        <!-- Digital Temp LED Display -->
        <text x="305" y="102" fill="#10B981" font-family="monospace" font-weight="bold" font-size="20">24°C</text>
        <line x1="25" y1="112" x2="335" y2="112" stroke="#94A3B8" stroke-width="4"/>
        <!-- Cool Airflow Waves -->
        <path d="M80,140 Q95,165 80,190" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="6,6"/>
        <path d="M160,140 Q175,165 160,190" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="6,6"/>
        <path d="M240,140 Q255,165 240,190" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="6,6"/>
      </g>
      <!-- AC Pressure Manifold Gauge & Technician Servicing Unit -->
      <g transform="translate(445, 105)">
        <path d="M-105,375 C-105,235 105,235 105,375 Z" fill="#087F78"/>
        <rect x="-18" y="190" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="145" rx="52" ry="60" fill="#C6824E"/>
        <path d="M-58,135 C-60,72 50,72 46,138 C34,102 -40,102 -58,135 Z" fill="#18181B"/>
        <ellipse cx="-22" cy="142" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="142" rx="5" ry="4" fill="#18181B"/>
        <path d="M-18,170 Q-6,178 8,170" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Arm reaching up to Split AC Filter with Jet Spray / Gauge -->
        <path d="M-65,255 L-175,115" fill="none" stroke="#087F78" stroke-width="34" stroke-linecap="round"/>
        <circle cx="-182" cy="108" r="16" fill="#C6824E"/>
        <!-- Pressure Gauge Set -->
        <circle cx="-145" cy="245" r="24" fill="#EF4444" stroke="#1E293B" stroke-width="4"/>
        <circle cx="-145" cy="245" r="15" fill="#FFFFFF"/>
        <circle cx="-90" cy="245" r="24" fill="#3B82F6" stroke="#1E293B" stroke-width="4"/>
        <circle cx="-90" cy="245" r="15" fill="#FFFFFF"/>
      </g>
    </svg>`
  },
  {
    name: 'painter',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <rect width="640" height="480" fill="#FAF9F6"/>
      <!-- Freshly Painted Warm Terracotta/Teal Accent Wall -->
      <path d="M0,0 L420,0 L420,480 L0,480 Z" fill="#0D9488"/>
      <path d="M340,0 L490,0 L420,480 L340,480 Z" fill="#14B8A6"/>
      <!-- Diagonal Roller Stroke Path -->
      <rect x="275" y="45" width="145" height="260" rx="8" fill="#0F766E" opacity="0.5"/>
      <!-- Paint Buckets in Foreground -->
      <g transform="translate(65, 330)">
        <rect x="0" y="0" width="95" height="115" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
        <path d="M8,0 L8,38 Q22,55 32,35 L32,0 Z" fill="#F97316"/>
        <rect x="18" y="48" width="60" height="32" rx="4" fill="#087F78"/>
      </g>
      <!-- Indian Painter with Extension Roller Pole & White Cap -->
      <g transform="translate(465, 105)">
        <path d="M-100,375 C-100,235 100,235 100,375 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/>
        <rect x="-18" y="190" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="145" rx="50" ry="58" fill="#C6824E"/>
        <!-- Painter Cap -->
        <path d="M-58,128 C-58,72 48,72 48,128 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3"/>
        <path d="M-75,128 L48,128" stroke="#087F78" stroke-width="8" stroke-linecap="round"/>
        <ellipse cx="-20" cy="145" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="145" rx="5" ry="4" fill="#18181B"/>
        <path d="M-18,172 Q-6,180 8,172" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Paint Roller & Extension Handle -->
        <line x1="-45" y1="265" x2="-155" y2="85" stroke="#F59E0B" stroke-width="10" stroke-linecap="round"/>
        <rect x="-215" y="45" width="95" height="36" rx="14" fill="#F97316" stroke="#FFFFFF" stroke-width="4"/>
      </g>
    </svg>`
  },
  {
    name: 'refrigerator_repair',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <rect width="640" height="480" fill="#F3F4F6"/>
      <!-- Double-Door Silver Refrigerator in Indian Kitchen -->
      <rect x="55" y="30" width="235" height="420" rx="16" fill="#94A3B8" stroke="#475569" stroke-width="5"/>
      <rect x="65" y="40" width="215" height="135" rx="10" fill="#CBD5E1"/>
      <rect x="65" y="185" width="215" height="255" rx="10" fill="#E2E8F0"/>
      <!-- Open Lower Fridge Compartment with Warm LED Light & Glass Shelves -->
      <rect x="82" y="200" width="180" height="220" rx="6" fill="#F0F9FF"/>
      <line x1="82" y1="255" x2="262" y2="255" stroke="#38BDF8" stroke-width="5"/>
      <line x1="82" y1="315" x2="262" y2="315" stroke="#38BDF8" stroke-width="5"/>
      <line x1="82" y1="370" x2="262" y2="370" stroke="#38BDF8" stroke-width="5"/>
      <!-- Fridge Technician Checking Thermostat & Relay -->
      <g transform="translate(445, 105)">
        <path d="M-105,375 C-105,235 105,235 105,375 Z" fill="#087F78"/>
        <rect x="-18" y="190" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="145" rx="52" ry="60" fill="#C6824E"/>
        <path d="M-58,135 C-60,72 50,72 46,138 C34,102 -40,102 -58,135 Z" fill="#18181B"/>
        <ellipse cx="-22" cy="142" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="142" rx="5" ry="4" fill="#18181B"/>
        <path d="M-18,170 Q-6,178 8,170" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-65,265 L-185,225" fill="none" stroke="#087F78" stroke-width="34" stroke-linecap="round"/>
        <circle cx="-195" cy="222" r="16" fill="#C6824E"/>
        <!-- Clamp Meter in Hand -->
        <rect x="-235" y="198" width="46" height="28" rx="6" fill="#F97316"/>
      </g>
    </svg>`
  },
  {
    name: 'washing_machine_repair',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <rect width="640" height="480" fill="#E2E8F0"/>
      <!-- Front-Load Washing Machine -->
      <g transform="translate(55, 85)">
        <rect x="0" y="0" width="265" height="345" rx="18" fill="#FFFFFF" stroke="#94A3B8" stroke-width="5"/>
        <line x1="0" y1="68" x2="265" y2="68" stroke="#CBD5E1" stroke-width="4"/>
        <!-- Detergent Drawer & Program Dial -->
        <rect x="20" y="18" width="75" height="34" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2"/>
        <circle cx="145" cy="35" r="16" fill="#087F78"/>
        <rect x="185" y="20" width="58" height="28" rx="4" fill="#0F172A"/>
        <!-- Stainless Steel Drum Door -->
        <circle cx="132" cy="198" r="88" fill="#334155" stroke="#94A3B8" stroke-width="12"/>
        <circle cx="132" cy="198" r="66" fill="#0EA5E9" opacity="0.45"/>
        <!-- Lower Drain Pump Filter Access Open -->
        <rect x="185" y="295" width="52" height="34" rx="4" fill="#1E293B"/>
        <circle cx="211" cy="312" r="11" fill="#F97316"/>
      </g>
      <!-- Appliance Technician Servicing Washer Drum & Pump -->
      <g transform="translate(455, 105)">
        <path d="M-105,375 C-105,235 105,235 105,375 Z" fill="#10213A"/>
        <rect x="-18" y="190" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="145" rx="52" ry="60" fill="#C6824E"/>
        <path d="M-58,135 C-60,72 50,72 46,138 C34,102 -40,102 -58,135 Z" fill="#18181B"/>
        <ellipse cx="-22" cy="142" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="142" rx="5" ry="4" fill="#18181B"/>
        <path d="M-18,170 Q-6,178 8,170" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-70,260 L-165,215" fill="none" stroke="#10213A" stroke-width="34" stroke-linecap="round"/>
        <circle cx="-175" cy="210" r="16" fill="#C6824E"/>
      </g>
    </svg>`
  },
  {
    name: 'house_cleaning',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <rect width="640" height="480" fill="#ECFDF5"/>
      <!-- Bright Clean Living Room Sofa & Window -->
      <rect x="45" y="50" width="240" height="150" rx="12" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="6"/>
      <rect x="55" y="255" width="260" height="125" rx="22" fill="#087F78"/>
      <rect x="35" y="295" width="300" height="95" rx="18" fill="#0F766E"/>
      <!-- Cleaning Professional with Spray Bottle, Microfiber & Vacuum -->
      <g transform="translate(455, 100)">
        <path d="M-100,380 C-100,240 100,240 100,380 Z" fill="#087F78"/>
        <!-- Protective Apron -->
        <path d="M-60,265 L60,265 L75,380 L-75,380 Z" fill="#E8F7F4"/>
        <rect x="-18" y="190" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="145" rx="50" ry="58" fill="#C6824E"/>
        <path d="M-56,135 C-58,72 48,72 44,138 C32,102 -38,102 -56,135 Z" fill="#18181B"/>
        <ellipse cx="-20" cy="142" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="142" rx="5" ry="4" fill="#18181B"/>
        <path d="M-16,170 Q-4,178 10,170" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Yellow Cleaning Gloves & Spray Bottle -->
        <path d="M-65,260 L-160,205" fill="none" stroke="#087F78" stroke-width="32" stroke-linecap="round"/>
        <circle cx="-170" cy="200" r="18" fill="#FACC15"/>
        <rect x="-205" y="165" width="32" height="58" rx="8" fill="#F97316"/>
        <path d="M-195,165 L-195,145 L-220,145" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
      </g>
    </svg>`
  },
  {
    name: 'ro_water_purifier',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <rect width="640" height="480" fill="#F0F9FF"/>
      <!-- Wall-Mounted RO Water Purifier with Dual Filter Cartridges -->
      <g transform="translate(75, 55)">
        <rect x="0" y="0" width="210" height="295" rx="20" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="6"/>
        <rect x="18" y="22" width="174" height="125" rx="12" fill="#0284C7" opacity="0.2"/>
        <!-- Visible RO Sediment & Carbon Filter Cylinders -->
        <rect x="42" y="34" width="48" height="100" rx="8" fill="#087F78"/>
        <rect x="118" y="34" width="48" height="100" rx="8" fill="#0284C7"/>
        <!-- Pure Water Tank Level -->
        <rect x="24" y="165" width="162" height="95" rx="10" fill="#38BDF8" opacity="0.45"/>
        <circle cx="105" cy="278" r="8" fill="#10B981"/>
      </g>
      <!-- Technician Testing Water TDS Meter & Filter Cartridge -->
      <g transform="translate(450, 105)">
        <path d="M-105,375 C-105,235 105,235 105,375 Z" fill="#087F78"/>
        <rect x="-18" y="190" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="145" rx="52" ry="60" fill="#C6824E"/>
        <path d="M-58,135 C-60,72 50,72 46,138 C34,102 -40,102 -58,135 Z" fill="#18181B"/>
        <ellipse cx="-22" cy="142" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="142" rx="5" ry="4" fill="#18181B"/>
        <path d="M-18,170 Q-6,178 8,170" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-65,255 L-165,185" fill="none" stroke="#087F78" stroke-width="34" stroke-linecap="round"/>
        <!-- Replacement RO Candle & Digital TDS Pen -->
        <rect x="-200" y="135" width="34" height="88" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="4"/>
      </g>
    </svg>`
  },
  {
    name: 'other_home_services',
    width: 640,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
      <rect width="640" height="480" fill="#F8FAFC"/>
      <!-- Water Geyser & CCTV Dome Camera on Home Wall -->
      <rect x="65" y="55" width="135" height="195" rx="28" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="5"/>
      <circle cx="132" cy="195" r="16" fill="#EF4444"/>
      <circle cx="265" cy="95" r="36" fill="#1E293B"/>
      <circle cx="265" cy="95" r="14" fill="#38BDF8"/>
      <!-- Multi-Skill Handyman Technician with Cordless Drill & Tool Box -->
      <g transform="translate(445, 105)">
        <path d="M-105,375 C-105,235 105,235 105,375 Z" fill="#10213A"/>
        <rect x="-18" y="190" width="36" height="45" rx="12" fill="#B87644"/>
        <ellipse cx="-6" cy="145" rx="52" ry="60" fill="#C6824E"/>
        <path d="M-58,135 C-60,72 50,72 46,138 C34,102 -40,102 -58,135 Z" fill="#18181B"/>
        <ellipse cx="-22" cy="142" rx="5" ry="4" fill="#18181B"/>
        <ellipse cx="8" cy="142" rx="5" ry="4" fill="#18181B"/>
        <path d="M-18,170 Q-6,178 8,170" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-65,255 L-170,195" fill="none" stroke="#10213A" stroke-width="34" stroke-linecap="round"/>
        <!-- Cordless Power Drill -->
        <rect x="-235" y="165" width="68" height="32" rx="8" fill="#F97316"/>
        <rect x="-195" y="192" width="22" height="38" rx="4" fill="#1E293B"/>
        <line x1="-235" y1="181" x2="-268" y2="181" stroke="#64748B" stroke-width="6" stroke-linecap="round"/>
      </g>
    </svg>`
  },
];

for (const scene of scenes) {
  fs.writeFileSync(path.join(outDir, `${scene.name}.svg`), scene.svg, 'utf8');
}
console.log('Generated all 11 bundled visual assets in public/images/services/');
