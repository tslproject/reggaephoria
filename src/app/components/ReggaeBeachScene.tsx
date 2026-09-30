export default function ReggaeBeachScene() {
  return <div className="beach-scene-wrap">
    <svg className="beach-scene" viewBox="0 0 640 400" role="img" aria-labelledby="beach-title beach-description" xmlns="http://www.w3.org/2000/svg">
      <title id="beach-title">Pantai tropis REGGAEPHORIA</title>
      <desc id="beach-description">Ilustrasi matahari terbenam, laut, pasir, dan pohon kelapa dengan warna merah, kuning, dan hijau reggae.</desc>
      <defs>
        <linearGradient id="beach-sky" x2="0" y2="1">
          <stop stopColor="#f05b45"/>
          <stop offset="1" stopColor="#ffbb55"/>
        </linearGradient>
        <linearGradient id="beach-sea" x2="0" y2="1">
          <stop stopColor="#238e68"/>
          <stop offset="1" stopColor="#104f49"/>
        </linearGradient>
        <linearGradient id="beach-sand" x2="0" y2="1">
          <stop stopColor="#ffd66d"/>
          <stop offset="1" stopColor="#d99b4a"/>
        </linearGradient>
        <clipPath id="beach-frame"><rect width="640" height="400" rx="24"/></clipPath>
      </defs>
      <g clipPath="url(#beach-frame)">
        <rect width="640" height="225" fill="url(#beach-sky)"/>
        <circle className="beach-sun" cx="144" cy="108" r="52" fill="#ffe36e"/>
        <circle cx="144" cy="108" r="67" fill="none" stroke="#ffe36e" strokeOpacity=".25" strokeWidth="2"/>
        <path d="M0 213 88 160l67 44 70-62 104 74 78-48 91 55 66-44 76 43v55H0Z" fill="#6e6042" opacity=".6"/>
        <path d="M0 228 89 183l74 36 73-47 93 57 80-42 99 47 68-38 64 31v39H0Z" fill="#315c43"/>
        <path d="M0 224c86-14 145 13 228 0s149-12 225 0 125 11 187-2v178H0Z" fill="url(#beach-sea)"/>
        <path className="beach-wave beach-wave-back" d="M-30 255c72-19 118 18 193 0s120-17 194 0 125 18 196 0 113-14 137-5" fill="none" stroke="#72d19b" strokeOpacity=".62" strokeWidth="5" strokeLinecap="round"/>
        <path className="beach-wave beach-wave-front" d="M-20 289c74-16 121 16 191 0s121-15 197 0 124 17 194 0 111-12 128-4" fill="none" stroke="#d4e588" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round"/>
        <path d="M0 315c92-21 164-2 249 4 102 7 170-25 259-12 60 9 98 10 132-1v94H0Z" fill="url(#beach-sand)"/>
        <path d="M0 342c106-20 165 7 259 10 107 4 191-22 275-12 43 5 77 7 106 0v60H0Z" fill="#bd8040" opacity=".5"/>
        <g className="beach-palm">
          <path d="M493 364c19-70 28-140 4-254" fill="none" stroke="#72452d" strokeWidth="22" strokeLinecap="round"/>
          <path d="M493 364c19-70 28-140 4-254" fill="none" stroke="#aa7040" strokeWidth="12" strokeLinecap="round"/>
          <path d="M490 172 410 119q-37-25-58-8 22 41 109 78-66-10-94 10 44 32 124 2-52 31-60 61 61-2 84-57 8 57 44 79 26-40-13-97 45 37 91 24-20-36-107-55 71 4 99-28-46-22-119 7 40-40 33-70-49 15-69 82-6-68-43-87-17 39 16 92-38-44-83-42 11 43 77 70-66-16-97 5 37 31 111 16" fill="#245e3f" stroke="#1b472f" strokeWidth="3" strokeLinejoin="round"/>
          <path d="M491 169q-49-41-91-50m93 51q-34-53-20-86m19 86q20-55 65-69m-65 69q58-22 105-8m-106 8q56 20 72 62m-72-62q-44 15-62 53" fill="none" stroke="#9dcc59" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="484" cy="173" r="13" fill="#ffcf48"/>
          <circle cx="505" cy="169" r="12" fill="#ee5940"/>
          <circle cx="495" cy="188" r="11" fill="#39a85e"/>
        </g>
        <g className="beach-cloud" fill="#fff4ce" opacity=".8">
          <ellipse cx="335" cy="77" rx="36" ry="11"/>
          <circle cx="318" cy="70" r="14"/><circle cx="338" cy="65" r="18"/><circle cx="357" cy="72" r="13"/>
        </g>
        <g className="beach-note" fill="#fff4ce">
          <path d="M251 108v34a10 10 0 1 1-6-9V99l34-8v43a10 10 0 1 1-6-9v-28Z"/>
        </g>
        <g fill="#fff3d0" opacity=".82">
          <circle cx="53" cy="271" r="3"/><circle cx="115" cy="302" r="2"/><circle cx="371" cy="267" r="3"/><circle cx="305" cy="330" r="2"/><circle cx="430" cy="315" r="2"/>
        </g>
        <path d="M0 0h640v9H0Z" fill="#ee3b32"/><path d="M0 9h640v8H0Z" fill="#ffd447"/><path d="M0 17h640v8H0Z" fill="#39b765"/>
      </g>
    </svg>
    <div className="beach-scene-caption"><span className="beach-equalizer" aria-hidden="true"><i/><i/><i/><i/><i/></span><span>Good music · Good people</span></div>
  </div>;
}
