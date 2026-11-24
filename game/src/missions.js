// AZURA BAY — missions, districts and game state. Classic script, no imports.
// Written fresh for the v12 entry. Four staged missions, one per screenshot,
// each with its own HUD values, police response, dialogue and district.
(function () {
  var AZ = (window.AZURA = window.AZURA || {});

  AZ.CITY = 'AZURA BAY';
  AZ.TAGLINE = 'CITY OF GLASS AND GOLD';

  AZ.MISSIONS = [
    {
      id: 6, stage: 'STAGE 3/4', title: 'LOSE THE REGENT',
      objective: "Outrun the Regent's convoy before it reaches the marina.",
      next: 'Vanish into the night market',
      district: 'GOLDEN STRAND', street: 'Strand Boulevard',
      time: '16:00', speed: 111, dented: 62, cash: 18450,
      units: [
        ['KITE-1', 'MARKSMAN', '15 m'], ['MARLIN-3', 'SHORE WATCH', '187 m'],
        ['CORAL-48', 'RAMMING', '7 m'], ['CORAL-85', 'FLANKING', '14 m'],
        ['CORAL-43', 'RAMMING', '15 m']
      ],
      unitCount: 6, speaker: 'KIRA VOSS', initials: 'KV', color: '#3ec6ff',
      dialogue: "He's making for the marina! Cut the Regent off before he reaches the water!",
      car: 'SOLARA GT', weapon: 3
    },
    {
      id: 2, stage: 'STAGE 2/4', title: 'THREAD THE MARKET',
      objective: 'Cut through Neon Row market without wrecking a stall.',
      next: 'Reach the customs garage',
      district: 'NEON ROW', street: 'Lantern Avenue',
      time: '20:24', speed: 87, dented: 12, cash: 18450,
      units: [['KITE-1', 'MARKSMAN', '15 m'], ['MARLIN-3', 'SHORE WATCH', '187 m']],
      unitCount: 2, speaker: 'KIKI', initials: 'K', color: '#ff8ac2',
      dialogue: 'Two units on Lantern, one chopper overhead. Market crowd is your cover.',
      car: 'SOLARA GT', weapon: 3
    },
    {
      id: 3, stage: 'STAGE 3/4', title: 'PAINT IT GOLD',
      objective: 'Get the Solara resprayed in 24-karat gold at Azura Customs.',
      next: 'Show it off on the Strand',
      district: 'GOLDEN STRAND', street: 'Azura Customs',
      time: '18:40', speed: 0, dented: 0, cash: 18450,
      units: [],
      unitCount: 0, speaker: 'RIO', initials: 'R', color: '#ffd23e',
      dialogue: 'Gold paint is still wet, boss. One scratch and I charge you double.',
      car: 'SOLARA GT · 24K GOLD', weapon: 3
    },
    {
      id: 6, stage: 'STAGE 3/4', title: 'LOSE THE REGENT',
      objective: "Outrun the Regent's convoy before it reaches the marina.",
      next: 'Vanish into the night market',
      district: 'AZURA BAY', street: 'Whole city · live',
      time: '17:12', speed: 86, dented: 34, cash: 18450,
      units: [
        ['KITE-1', 'MARKSMAN', '15 m'], ['MARLIN-3', 'SHORE WATCH', '187 m'],
        ['CORAL-48', 'RAMMING', '7 m'], ['CORAL-85', 'FLANKING', '14 m'],
        ['CORAL-43', 'RAMMING', '15 m']
      ],
      unitCount: 6, speaker: 'KIRA VOSS', initials: 'KV', color: '#3ec6ff',
      dialogue: "He's making for the marina! Cut the Regent off before he reaches the water!",
      car: 'SOLARA GT', weapon: 3,
      route: 'Customs → Neon Row → Golden Strand → Marina Quay · 4.2 km · 2:41 best'
    }
  ];

  AZ.DISTRICTS = [
    { name: 'AZURA CUSTOMS', sub: '24K GOLD PAINT', x: 38, y: 30 },
    { name: 'NEON ROW', sub: 'NIGHT MARKET', x: 30, y: 48 },
    { name: 'GOLDEN STRAND', sub: 'BEACH BOULEVARD', x: 60, y: 55 },
    { name: 'MARINA QUAY', sub: 'HARBOUR DRIVE', x: 33, y: 74 }
  ];

  AZ.WEAPONS = [
    { n: 1, icon: '✊', name: 'FISTS', ammo: '∞' },
    { n: 2, icon: '🔫', name: '.38', ammo: '60' },
    { n: 3, icon: '🔫', name: 'SMG', ammo: '30/60' },
    { n: 4, icon: '💥', name: '12G', ammo: '18' },
    { n: 5, icon: '🎯', name: 'AR-9', ammo: '—' }
  ];
  AZ.CREW = [
    { key: 'Z', name: 'SWAP PLATES', who: 'Zara · Driver', color: '#ffd23e' },
    { key: 'X', name: 'QUICK FIX', who: 'Rio · Mechanic', color: '#3ec6ff' },
    { key: 'C', name: 'EYES OUT', who: 'Kiki · Lookout', color: '#ff8ac2' }
  ];

  // Live play state (driving mode updates these; staged shots set them).
  AZ.state = {
    cash: 18450, speed: 0, dented: 0, wanted: 5, health: 72, armour: 55,
    rank: 'B', title: 'FIXER', rp: 3900, rpMax: 5200,
    radio: 'AZURA 98.4 — Island Pop', mission: 0, driving: false
  };
})();
