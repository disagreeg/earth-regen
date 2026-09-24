






window.GG = window.GG || {};














const ALL_GRADES = [
  'trash', 'rtrash', 'light', 'heavy',
  'metal', 'alu', 'steel', 'lead', 'hazard', 'cell',
  'plastic', 'organic', 'fert', 'oil',
  'glass', 'aggregate', 'wood', 'coal',
  'blade', 'tonic', 'glazing', 'acid', 'advCell',
  

  'gold', 'slag', 'chip',
  
  'panel',
  
  'gear',
  
  'turbofuel',
  
  'paper',
];








const NOSALE = ['nukeWaste', 'rod', 'pluto', 'nfuel'];

















const FLUIDS = ['oil', 'water', 'dirtyWater', 'oilyWater', 'acid', 'turbofuel'];
const ROUTABLE = ALL_GRADES.concat(NOSALE).filter(function (g) { return FLUIDS.indexOf(g) === -1; });

GG.config = {
  saveKey: 'earthregen.save.v4',
  saveVersion: 4,

  time: { secondsPerGameHour: 60, hoursPerDay: 24 },

  sim: {
    tickRate: 20,
    maxCatchupSec: 1.0,
    


    autosaveSec: 5,           
    autosaveMarkSec: 300,     
    autosaveMarkHold: 2.2,    
    rateSmoothing: 1.5,       
  },

  






























  saveGuard: {
    enabled: true,
    retryBare: true,          
    notice: true,             
    repeatSec: 120,           
    

    refuseBroken: true,       
    refuseOlder: true,        
    olderSlackSec: 120,       
    backupSec: 600,           
    


    fileMirror: true,
  },

  






















  background: {
    enabled: true,
    card: true,               
    saveOnHide: true,         
    






    muteWhenHidden: true,
    





    muteWhenStalled: true,
    stallSec: 1.5,
  },

  





































  reveal: {
    enabled: true,
    items: {
      
      money: g => g.totalMoney > 0,
      
      






      gems: g => g.totalDiamonds > 0 || g.diamond > 0,
      




      goals: g => { for (const k in (g.goalsHit || {})) return true; return false; },
      





      codex: g => { for (const k in (g.skills || {})) return true; return false; },
      





      rate: g => { for (const k in (g.peakBuilt || {})) return true; return false; },
    },
  },

  





















  crashGuard: {
    enabled: true,
    banner: true,        
    


    maxSame: 3,
    saveOnError: true,   
  },

  












  offline: {
    rate: 0.1,                
    minSec: 60,               
    maxSec: 24 * 3600,        
                              
                              
    step: 1,                  
    



    maxSteps: 4000,
    showSec: 16,              
    




    hideWhenEmpty: false,
  },

  













  










  splash: {
    



























    enabled: false,
    




    bg:  '#0A0B0B',
    ink: '#F5F5F5',
    markPx: 200,              
    markPxNarrow: 128,
    namePx: 34,               
    namePxNarrow: 22,
    fadeMs: 520,              
    holdMs: 1250,             
    skippable: true,          
    hint: true,               
    hintAfterMs: 700,         
    





    fontWaitMs: 500,
  },

  


















  











  camera: {
    clamp: true,
    







    margin: 0.6,
    recentre: true,           
  },

  mobileGuard: {
    enabled: true,
    minWidth: 0,              
    allowAnyway: true,        
    rememberSec: 0,           
                              
  },

  loading: {
    enabled: true,
    


    minSteps: 240,
    sliceMs: 22,              
                              
    minShowMs: 420,           
                              
    fadeMs: 260,              
    tipEverySec: 2.6,         
    tips: true,               
    


    oneAtATime: true,
  },

  world: {
    




    grid: 40, snap: 10,
    minZoom: 0.3, maxZoom: 2.2, startZoom: 0.85,
  },

  














  touch: {
    enabled: true,
    pan: true,              
    pinch: true,            
    tapSlop: 8,             
    




    board: true,            

    


















    cutTap: true,
    portPad: 12,            
  },

  





  swipe: {
    




    ciPerEntry: 0.015,
    takesFromReserve: true,   
    



    puffs: 3,                 
    puffSpread: 0.62,         

    



























    drag: {
      
















      enabled: 'touch',
      perPx: 120,             
      tapEntries: 1,          
      maxPerMove: 8,          
      fxMinSec: 0.09,         
      touchEvents: true,      
    },
  },

  




  siteFx: {
    



    ring: {
      on: false,
      sec: 0.85,              
    },
    



    dent: {
      sec: 0.45,              
      depth: 11,              
      reach: 54,              
      wobble: 9,              
      decay: 5,               
    },
    

    flow: {
      sec: 1.6,               
      surfAmp: 6,             
      surfLen: 78,            
      surfWave: 20,           
      speed: 3.2,             
      bands: 3,               
      bandAlpha: 0.17,        
      bandSpeed: 30,          
      bandAmp: 4.5,           
    },
  },

  










  levelFx: {
    enabled: true,
    











    card: false,
    delta: true,              
    hex: true,                
    mapPulse: true,           
    sparks: true,             

    cardSec: 4.2,             
    

    maxPulse: 14,
    




    holdForBoard: true,
  },

  











  boostFx: {
    enabled: true,
    machines: true,           
    sites: true,              
    cursor: true,             

    pad: 6,                   
    width: 2.2,               
    alpha: 0.85,              
    alphaLow: 0.28,
    pulseSec: 1.5,            
    glow: 16,                 
    maxStack: 3,              
  },

  



  plant: {
    ciPerEntry: 0.02,         
  },

  








  locations: [
    {
      id: 'home', name: 'The Wastelands', icon: 'site', color: '#8a9a6b',
      desc: 'Where you started. Two old tips, nothing else, and a sky that never changes.',
      sites: [
        
        
        
        
        
        
        
        { type: 'trashSite', x: -420, y: 0 },
        { type: 'trashSite', x: 440, y: 120 },
      ],
    },
    {
      id: 'greenhaven', name: 'Greenhaven', icon: 'tree', color: '#5ecb8a',
      desc: 'Land worth saving. Two far bigger tips, and two plots where something ' +
            'can actually be planted.',
      requires: 'greenhaven',        
      







      sites: [
        








        { type: 'trashSite', x: -660, y: -300, reserve: 3000, demoReserve: 2000, w: 300, slots: 3 },
        { type: 'trashSite', x: -660, y: 300,  reserve: 3000, demoReserve: 2000, w: 300, slots: 3 },
        













































        















        { type: 'treeSite',  x: 300,  y: -190, capacity: 10000, demoCapacity: 3000 },
        { type: 'treeSite',  x: 300,  y: 250,  capacity: 10000, demoCapacity: 3000 },
      ],
    },
    
















    {
      id: 'mirewater', name: 'Mirewater', icon: 'pool', color: '#3fb8a6',
      desc: 'Where the runoff ended up. The two biggest tips left anywhere, a grove twice ' +
            'the size of Greenhaven\'s, and two pools of water nothing has lived in for a ' +
            'long time.',
      requires: 'mirewater',         
      




























      sites: [
        




        { type: 'trashSite', x: -980, y: -340, reserve: 12500, w: 300, slots: 3 },
        { type: 'trashSite', x: -980, y: 340,  reserve: 12500, w: 300, slots: 3 },
        





        



        { type: 'treeSite',  x: 0,    y: 0,    capacity: 24000, w: 300, slots: 4 },
        


        { type: 'waterSite', x: 960,  y: -260, capacity: 50000 },
        { type: 'waterSite', x: 960,  y: 260,  capacity: 50000 },
      ],
    },
    

























    {
      id: 'blackmere', name: 'Blackmere', icon: 'slick', color: '#a8853f',
      desc: 'Where the tankers came apart. Three tips, two groves, and three slicks lying ' +
            'flat on water that has not moved in years.',
      requires: 'blackmere',         
      

























      sites: [
        { type: 'trashSite', x: -980, y: -700, reserve: 25000, w: 300, slots: 3 },
        { type: 'trashSite', x: -980, y: 0,    reserve: 25000, w: 300, slots: 3 },
        { type: 'trashSite', x: -980, y: 700,  reserve: 25000, w: 300, slots: 3 },
        



        
        { type: 'treeSite',  x: 0,    y: -480, capacity: 36000, w: 300, slots: 4 },
        { type: 'treeSite',  x: 0,    y: 480,  capacity: 36000, w: 300, slots: 4 },
        
        
        
        
        { type: 'oilSite',   x: 960,  y: -400, capacity: 150000, raisedFrom: 90000 },
        { type: 'oilSite',   x: 960,  y: 400,  capacity: 150000, raisedFrom: 90000 },
        
        
        { type: 'oilSite',   x: 960,  y: 1200, capacity: 100000 },
      ],
    },
    







    {
      id: 'glowmoor', name: 'Glowmoor', icon: 'glow', color: '#b9e04a',
      desc: 'The old reactor country. Four tips, two groves, a pool, a spill, and two sites ' +
            'where the waste still glows.',
      requires: 'glowmoor',
      sites: [
        { type: 'trashSite', x: -1640, y: -1050, reserve: 50000, w: 300, slots: 3 },
        { type: 'trashSite', x: -1640, y: -350,  reserve: 50000, w: 300, slots: 3 },
        { type: 'trashSite', x: -1640, y: 350,   reserve: 50000, w: 300, slots: 3 },
        { type: 'trashSite', x: -1640, y: 1050,  reserve: 50000, w: 300, slots: 3 },
        




















        { type: 'waterSite', x: 320,   y: -400, capacity: 76000, volume: 1000 },
        { type: 'oilSite',   x: 320,   y: 400 },
        { type: 'wasteSite', x: 1300,  y: -350 },
        { type: 'wasteSite', x: 1300,  y: 350 },
      ],
    },
  ],

  




  
  

  groundRaise: { enabled: true, places: [{ id: 'blackmere', spillAddKg: 200 }, { id: 'greenhaven' },
                                         


                                         { id: 'glowmoor', key: 'glowmoor1600', lower: true },
                                         


                                         { id: 'mirewater', key: 'grove276', groveOnly: true },
                                         { id: 'blackmere', key: 'blackmereGrove276', groveOnly: true },
                                         { id: 'glowmoor', key: 'glowmoorGrove276', groveOnly: true },
                                         


                                         { id: 'blackmere', key: 'blackmereSpill3', addSites: ['oilSite'] }] },

  



















  demoGround: { enabled: true },

  

  
  demoRun: function (g) {
    const K = GG.config;
    if (!K.demo || !K.demo.enabled) return false;
    if (g === undefined || g === null) g = (GG.state && GG.state.g) || null;
    return !(g && g.fullGame);
  },
  
  siteReserve: function (cfg, g) {
    const K = GG.config;
    const v = (K.demoGround && K.demoGround.enabled && cfg.demoReserve !== undefined &&
               K.demoRun(g)) ? cfg.demoReserve : cfg.reserve;
    return K.circleSize(v, cfg, g, 'reserve');
  },
  siteCapacity: function (cfg, g) {
    const K = GG.config;
    const v = (K.demoGround && K.demoGround.enabled && cfg.demoCapacity !== undefined &&
               K.demoRun(g)) ? cfg.demoCapacity : cfg.capacity;
    return K.circleSize(v, cfg, g, 'capacity');
  },
  
  
  siteVolume: function (cfg, g) {
    return GG.config.circleSize(cfg.volume, cfg, g, 'volume');
  },
  




  siteMul: function (g) {
    const K = GG.config, F = K.fullCircle || {};
    if (g === undefined || g === null) g = (GG.state && GG.state.g) || null;
    const c = (g && g.cycle) || 0;
    return c > 0 ? Math.pow(F.siteMul || 1, c) : 1;
  },
  circleSize: function (v, cfg, g, field) {
    const K = GG.config, m = K.siteMul(g);
    if (m === 1) return v;
    if (v === undefined) {
      const t = K.nodeTypes[cfg.type] || {};
      
      if (field === 'reserve' && t.grow) return undefined;
      v = t[field];
    }
    return v === undefined ? undefined : v * m;
  },
  
  
  
  demoSized: function (L, g) {
    const K = GG.config;
    return !!(K.demoGround && K.demoGround.enabled && K.demoRun(g) &&
              (L.sites || []).some(s => s.demoReserve !== undefined || s.demoCapacity !== undefined));
  },

  




  robotShare: { enabled: true },

  


  























  dev: {
    enabled: false,          
    speeds: [1, 2, 5, 10, 25, 100],
    weather: true,          
    


    grants: [
      { cur: 'ci', amount: 1000 },
      { cur: 'money', amount: 10000 },
      { cur: 'diamond', amount: 50 },
    ],

    






    info: true,
    infoBatches: 8,         

    




    bestPlay: {
      show: true,
      topN: 6,              
      cardsOnChange: true,  
                            
      







      payTable: true,
      splitSweep: true,
      minSupply: 1e-9,      

      















































      liveExchange: false,
    },
  },

  









  goals: {
    






    hardAt: 3,              
    





    poweredMul: 2,
    





    fullShiftDeclared: true,
  },

  





































  weather: {
    enabled: true,
    










    watchToCount: true,
    































    wetDrawsMore: false,
    







    stormNeedsTill: true,
    


    


















    locs: [
      { loc: 'greenhaven' },
      { loc: 'mirewater', chance: { heat: 0, rain: 0.25 } },
      { loc: 'blackmere', chance: { storm: 0, heat: 0.30 } },
      

      { loc: 'glowmoor', chance: { rain: 0, lightning: 0.10 } },
    ],
    rollSec: 55.5,          
    



    leadSec: 30,
    


    blockChance: 0,
    fadeSec: 1.2,           
    


























    gridTrip: {
      enabled: true,
      recoverSec: 150,      
      


      floor: 0,
      

      restack: true,
      



      onlyWithGenerators: true,
    },
    events: [
      {
        id: 'rain', name: 'Rain', icon: 'rain', color: '#5fa8d3',
        chance: 0.10, sec: 30, sound: 'rain',
        desc: 'Everything is wet and heavy. Cleaners, Cleaner Drones and bare hands bring in ' +
              'half as much, while the trees have never been happier.',
        
        
        mul: { dig: 0.5, sweep: 0.5, plant: 2 },
      },
      {
        id: 'storm', name: 'Storm', icon: 'storm', color: '#7d6fd0',
        chance: 0.15, sec: 40, sound: 'storm',
        desc: 'Nothing will stay alight. Landfills and Incinerators stop burning completely, ' +
              'crew or no crew, while every turbine is having the time of its life.',
        mul: { burnRate: 0 },
        energy: { windTurbine: 2.5, stormTurbine: 2.5 },
      },
      {
        id: 'lightning', name: 'Lightning', icon: 'bolt', color: '#f0e24a',
        




        chance: 0.05, sec: 15, sound: 'lightning',
        desc: 'The grid is down completely. No generator makes a watt, and every battery ' +
              'holds what it has without giving up a drop. Everything burns and ' +
              'everything you pick up by hand is worth five times as much.',
        
        
        
        mul: { sweep: 5, burnValue: 5, battery: 0 },
        energy: { '*': 0 },
        
        
        blockable: true,
        


        trips: true,
      },
      {
        


        id: 'heat', name: 'Heatwave', icon: 'solar', color: '#f0904a',
        chance: 0.15, sec: 40, sound: 'heat',
        desc: 'The sun is straight overhead and it will not move. Solar Panels run at two ' +
              'and a half times, and nothing green, planted by hand or by machine, wants ' +
              'to be out in it.',
        mul: { plant: 1 / 3 },
        energy: { solarPanel: 2.5 },
        action: 'sunrise',
      },
    ],
    


    heatHoldsNight: true,
    



    reactorPauses: true,
    

    shortNotice: true,
  },

  














  tutorial: {
    enabled: true,

    







    dim: 0.2,

    


    hintScanSec: 1,
    




    hintGapSec: 45,
    















    hintSoftSec: 5,
    








    handPickAt: 2,
    











    layoutAt: 20,
    hints: true,             
    


    hintReplay: true,

    











    hintLateAt: 11,

    
















































    



    whyCards: true,

    machineNotes: {
      onBuild: true,
      keep: ['hiringAgency', 'wasteCleaner', 'robot', 'panelWorks', 'airCleaner', 'diamondPress', 'outreachHub', 'trashJunction',
             'printWorks',   
             'labourExchange',   

             'droneCleaner', 'gridFoundry', 'powerSplitter',
             






             'recycler', 'tradePost', 'incinerator',
             



             'powerStorage', 'treePlanter', 'magnetSeparator', 'eddySeparator',
             
             'fineSorter',
             
















             'solarPanel',
             'fuelPlant'],   
    },

    

























    


    cardClearsWire: true,
    wireFx: {
      enabled: true,
      






      color: '232, 176, 75',
      periodSec: 1.5,          
      

      widthMin: 7,
      widthMax: 13,
      alphaMin: 0.18,
      alphaMax: 0.42,
      cardGap: 18,             
    },

    steps: [
      {
        id: 'look',
        title: 'Getting around',
        text: 'Drag an empty bit of the map to move around, and scroll to zoom.',
        where: 'map',
        done: { kind: 'camera' },
      },
      {
        id: 'sweep',
        title: 'Clean by hand',
        text: 'That green patch is a Trash Site. Move your cursor into it to pick trash up by hand, ' +
              'until you can afford your first skill.',
        

        textDrag: 'That green patch is a Trash Site. Hold your finger on it and sweep back and forth to ' +
                  'pick trash up, until you can afford your first skill.',
        where: 'map',
        anchor: [{ site: true }],
        done: { kind: 'ci', forSkill: 'player' },
      },
      {
        id: 'volunteerSkill',
        title: 'Your first skill',
        text: 'Open CI Skills and take Volunteers.',
        where: 'tree',
        
        anchor: [{ el: '#tree-inner .skill[data-id="player"]' }, { el: '#tree-launch .tl-btn.ci' }],
        done: { kind: 'skill', skill: 'player' },
      },
      {
        id: 'placeVolunteer',
        title: 'Build a Volunteer',
        text: 'Close the skill board, pick Volunteer from the build dock, and click anywhere ' +
              'on the map.',
        where: 'map',
        anchor: [{ el: '.build-card[data-type="player"]' }],
        done: { kind: 'node', node: 'player' },
      },
      {
        id: 'placeCleaner',
        title: 'Build a Trash Cleaner',
        text: 'Now a Trash Cleaner. This one has to stand in one of the dashed slots inside ' +
              'the Trash Site.',
        where: 'map',
        anchor: [{ el: '.build-card[data-type="cleaner"]' }],
        done: { kind: 'node', node: 'cleaner' },
      },
      {
        id: 'inspect',
        title: 'Look inside a machine',
        text: 'Click any machine to open its panel: live rates, what it is waiting for, and ' +
              'DEMOLISH.',
        where: 'map',
        anchor: [{ node: 'cleaner' }],
        done: { kind: 'selected' },
      },
      {
        id: 'wireCrew',
        title: 'Run a wire',
        









        text: 'Drag from the Volunteer\'s Workforce socket to the Cleaner. Wires drag either way. ' +
              'Hold Ctrl as you let go for right angles instead of a curve.',
        textTouch: 'Drag from the Volunteer\'s Workforce socket across to the Cleaner. ' +
              'Wires drag either way.',
        where: 'map',
        anchor: [{ port: { type: 'player', dir: 'out', port: 'wf' } }],
        done: { kind: 'link', from: 'player', to: 'cleaner' },
      },
      {
        id: 'placeLandfill',
        title: 'Somewhere to put it',
        text: 'The Cleaner is digging, but the trash has nowhere to go. Put a Landfill down ' +
              'on open ground. It turns trash into Clean Index.',
        where: 'map',
        anchor: [{ el: '.build-card[data-type="landfill"]' }],
        done: { kind: 'node', node: 'landfill' },
      },
      {
        id: 'wireTrash',
        title: 'Complete the chain',
        text: 'Wire the Cleaner\'s Trash output into the Landfill.',
        where: 'map',
        anchor: [{ port: { type: 'cleaner', dir: 'out', port: 'out' } }],
        done: { kind: 'link', from: 'cleaner', to: 'landfill' },
      },
      {
        id: 'burn',
        title: 'Bank it',
        text: 'Press BURN on its card to collect.',
        where: 'map',
        anchor: [{ collect: 'landfill' }],
        done: { kind: 'counter', key: 'totalBurns' },
      },
      



      {
        id: 'diamond',
        title: 'A diamond',
        text: 'Every few minutes a diamond drops somewhere on the map and sits there ' +
              'waiting. Click it.',
        where: 'map',
        action: 'spawnGem',           
        anchor: [{ el: '#gem-layer .gem' }],
        done: { kind: 'counter', key: 'gemsTaken' },
      },
      








      {
        id: 'claim',
        title: 'Claim an objective',
        text: 'You have been finishing objectives without noticing. Press Goals, go to the ' +
              'OBJECTIVES tab, and press CLAIM to take the diamond.',
        where: 'map',
        anchor: [{ el: '#pn-body .pn-row.on .pn-claim' },
                 { el: '.pn-tabs .pn-tab[data-kind="goals"]' },
                 { el: '#btn-goals' }],
        done: { kind: 'claimed' },
      },
      {
        





        id: 'boost',
        title: 'Your first boost is free',
        boost: 'rally',
        text: 'Diamonds buy temporary boosts. They run for three real minutes. Your first ' +
              'one costs nothing.',
        



        textChosen: 'Diamonds buy temporary boosts. They run for three real minutes. ' +
              'Open Boosts and start %s.',
        where: 'map',
        anchor: [{ chosenBoost: true }, { el: '#boost-launch .tl-btn' }],
        done: { kind: 'boosted' },
      },
      {
        



        id: 'marketSkill',
        title: 'Now let it run',
        text: 'You can afford the Market now. Acquire it in CI Skills.',
        quietTitle: 'Earning the Market',
        quietText: 'Leave it running, or keep sweeping by hand, until you can afford the Market.',
        where: 'tree',
        waitFor: { kind: 'ci', forSkill: 'market' },
        anchor: [{ el: '#tree-inner .skill[data-id="market"]' }, { el: '#tree-launch .tl-btn.ci' }],
        done: { kind: 'skill', skill: 'market' },
      },
      {
        id: 'placeMarket',
        title: 'Build a Market',
        text: 'Place a Market. It sells trash for money.',
        where: 'map',
        anchor: [{ el: '.build-card[data-type="market"]' }],
        done: { kind: 'node', node: 'market' },
      },
      {
        id: 'wireMarket',
        title: 'Split the stream',
        text: 'Wire the Cleaner into the Market as well. Its Trash output can feed both of ' +
              'them.',
        where: 'map',
        anchor: [{ port: { type: 'cleaner', dir: 'out', port: 'out' } }],
        done: { kind: 'link', from: 'cleaner', to: 'market' },
      },
      

















      {
        id: 'cutWire',
        title: 'Cut a wire',
        text: 'Right-click a wire to cut it and send all of it one way. Money or Clean Index ' +
              'is your call, and you can wire it back any time.',
        





        textTouch: 'Press the input a wire runs into to cut it and send all of it one way. Money ' +
              'or Clean Index is your call, and you can wire it back any time.',
        where: 'map',
        



        








        wires: [{ from: 'cleaner', to: 'landfill' }],
        














        anchorTouch: [{ port: { type: 'landfill', dir: 'in', port: 'in' } }],
        done: { kind: 'cut' },
      },
      {
        id: 'collect',
        title: 'Take the money',
        text: 'Press COLLECT on the Market to empty its till.',
        where: 'map',
        anchor: [{ collect: 'market' }],
        done: { kind: 'counter', key: 'totalMoney' },
      },
      {
        id: 'moneySkill',
        title: 'Spend it',
        text: 'Open Money Skills and take Extra Hands. This tree unfolds as you go: each ' +
              'skill you buy reveals the next.',
        quietTitle: 'Earning your first upgrade',
        quietText: 'Money buys upgrades in a second tree. Keep the Market selling until you can ' +
              'afford Extra Hands.',
        where: 'tree',
        waitFor: { kind: 'money', forSkill: 'extraHands' },
        anchor: [{ el: '#tree-inner .skill[data-id="extraHands"]' },
                 { el: '#tree-launch .tl-btn.money' }],
        done: { kind: 'skillLevel', skill: 'extraHands' },
      },
      








      {
        id: 'done',
        title: 'That is the game',
        text: 'The rest is the same three moves: unlock a machine, work out what it wants, ' +
              'wire it in. Tricky ones get a short note when they arrive.',
        where: 'map',
      },
    ],

    







    hintList: [
      














      





      

































      { id: 'plan2', title: 'The Plan', needsTutor: true,
        










        






        when: (g, Sim) => !!g.tutorDone && Sim.storyOn() && !Sim.storyOver() &&
                          (function () { for (const k in (g.peakBuilt || {})) return true; return false; })(),
        anchor: [{ el: '#plan-tick' },
                 { el: '.pn-tabs .pn-tab[data-kind="plan"]' }, { el: '#btn-goals' }],
        





        text: 'The Plan tells you what to do next, one step at a time. It runs in four chapters, ' +
              'and finishing one pays you money.' },

      






      { id: 'trials2', title: 'Trials', needsTutor: true,
        when: g => { let n = 0; for (const k in (g.objectives || {})) if (++n >= 3) return true; return false; },
        anchor: [{ el: '.pn-tabs .pn-tab[data-kind="trials"]' }, { el: '#btn-goals' }],
        






        




        text: 'These are the hard ones. Finishing one pays diamonds and unlocks a machine.',
        textNoMachine: 'These are the hard ones. Finishing one pays diamonds.' },

      











      { id: 'gemsIdle', title: 'Diamonds are piling up', soft: true,
        








        needsTutor: true,
        when: g => (g.diamond || 0) >= 3 &&
                   !(g.skills && g.skills.powerStore) &&
                   (g.playtime || 0) - (g.lastBoostAt || 0) >= 600,
        anchor: [{ el: '#boost-launch .tl-btn' }],
        



        text: 'You have enough for a boost, and none has run in a while.' },

      







      { id: 'skillsNoBuild', title: 'Upgrades pay per machine', soft: true,
        

        needsTutor: true,
        when: g => {
          if (g.skills && g.skills.powerStore) return false;
          if ((g.builtCount && g.builtCount.player || 0) > 2) return false;
          let lv = 0;
          const sk = GG.config.skills;          
          for (let i = 0; i < sk.length; i++) {
            if (sk[i].tree !== 'money') continue;
            lv += (g.skills && g.skills[sk[i].id]) || 0;
            if (lv >= 8) return true;
          }
          return false;
        },
        anchor: [{ el: '.build-card[data-type="player"]' }, { el: '#dock-toggle' }],
        



        text: 'An upgrade adds to every machine of its kind you own. Build first, then upgrade.' },

      


      { id: 'caps2', title: 'A limit you can move', needsTutor: true,
        





        when: g => {
          const NT = GG.config.nodeTypes;
          for (const id in NT) {
            if (!NT[id].cap) continue;
            if ((g.builtCount && g.builtCount[id] || 0) >= 3) return true;
          }
          return false;
        },
        anchor: [{ el: '#pn-body .pn-tab[data-kind="caps"]' }, { el: '#boost-launch .tl-btn' }],
        text: 'Some machines can only be built so many times. Only diamonds raise that limit: open ' +
              'Boosts, CAPACITY tab.' },

      





      { id: 'codex2', title: 'Everything, written down', needsTutor: true,
        when: g => (g.storyAt || 0) >= 3,
        anchor: [{ el: '#btn-codex' }],
        text: 'The CODEX lists every machine with its real numbers, every material, the weather, ' +
              'the boosts and the goals.' },

      





      { id: 'practice1', title: 'Practice rooms', tryNode: 'recycler',
        when: g => !!(g.hintsSeen && g.hintsSeen.recycler && GG.practice &&
                      GG.practice.canPractise && GG.practice.canPractise('recycler')),
        anchor: [{ el: '#btn-codex' }],
        text: 'TRY IT opens a safe copy of a machine. Starve it or block it and see what happens; ' +
              'it costs nothing and your run waits. ★★ MUST TRY rooms teach the most. ' +
              'The Codex has every room.' },

      






      





      { id: 'rates2', title: 'Is it actually growing?', needsTutor: true,
        when: g => (g.storyAt || 0) >= 1,
        anchor: [{ el: '#ci-rate' }, { el: '#money-rate' }],
        text: 'Top of the screen: CI/h and $/h. That is how fast your machines are ' +
              'producing.' },

      


























      










      { id: 'group2', title: 'Arranging machines',
        when: g => {
          if (!(GG.config.ui || {}).bandSelect) return false;
          const NT = GG.config.nodeTypes;
          let n = 0;
          for (const nd of (g.nodes || [])) {
            const t = NT[nd.type];
            if (t && t.kind === 'machine' && ++n >= 8) return true;
          }
          return false;
        },
        text: 'Machines move in groups. Hold Shift and click to pick out several, or hold ' +
              'Shift and drag a box over empty ground to catch everything inside it.\n\n' +
              'Press F to turn the ones you have picked round, so their inputs sit on the ' +
              'right and their outputs on the left.',
        




        textTouch: 'Machines move in groups. Tap one, press SELECT MORE on its panel, then ' +
              'tap the others to add them.' },

      










      { id: 'group3', title: 'Picking several at once',
        when: g => {
          const C2 = GG.config, at = (C2.tutorial || {}).handPickAt | 0;
          if (!at || !(C2.ui || {}).bandSelect) return false;
          if (GG.input && GG.input.touchUi && GG.input.touchUi()) return false;
          return (g.handPicks | 0) >= at;
        },
        text: 'Instead of clicking them one at a time, hold Shift and drag a box over ' +
              'empty ground. Everything the box touches joins the group.' },

      













      { id: 'layout2', title: 'A tidier map',
        when: g => {
          const C2 = GG.config, at = (C2.tutorial || {}).layoutAt | 0;
          if (!at) return false;
          const U2 = C2.ui || {}, W2 = (C2.wire || {}).ortho || {};
          const touch = !!(GG.input && GG.input.touchUi && GG.input.touchUi());
          if (U2.flipPorts === false) return false;
          if (!touch && !W2.enabled) return false;
          if (!(U2.gridSnap || {}).enabled) return false;
          const NT = C2.nodeTypes;
          let n = 0;
          for (const nd of (g.nodes || [])) {
            const t = NT[nd.type];
            if (t && t.kind === 'machine' && ++n >= at) return true;
          }
          return false;
        },
        text: 'Three things make a big map easier to read.' + '\n\n' +
              'F turns the machines you have picked round, so their inputs face the wires ' +
              'coming in.' + '\n\n' +
              'Hold Ctrl while you drag a wire and it comes out square instead of curved. ' +
              'Ctrl and click a wire that is already there does the same to that one.' +
              '\n\n' +
              'Settings, Placing machines: on Grid every machine lands on a line of the ' +
              'grid you can see.',
        

        textTouch: 'Two things make a big map easier to read.' + '\n\n' +
              'Press the Sockets pill on a machine panel and it turns round, so its inputs ' +
              'face the wires coming in.' + '\n\n' +
              'Settings, Placing machines: on Grid every machine lands on a line of the ' +
              'grid you can see.' },

      



      





      { id: 'travel2', loc: 'greenhaven', title: 'Two places now',
        text: 'The bar at the top of the map is where you are. Press a name to fly there. ' +
              'Everything you left behind keeps running, so a line in the Wastelands earns while ' +
              'you build here.\n\nNumber keys do the same: 1 is the first name, 2 the second.' },
      { id: 'weather', loc: 'greenhaven', title: 'The weather here', action: 'rain',
        text: 'Greenhaven has weather. Roughly once a minute something blows in for half a ' +
              'minute. It is raining now, so you can see what one looks like.\nRAIN: ' +
              'trees x2, digging and bare hands x0.5.\nSTORM: turbines x2.5, but ' +
              'Landfills and Incinerators stop burning.\nLIGHTNING: no generator ' +
              'makes a watt and batteries freeze, but burning and bare hands are ' +
              'worth x5. The grid stays down afterwards and climbs back on its own; ' +
              'RESTART on the pill gives it all back at once.\nHEATWAVE: Solar x2.5, ' +
              'anything green x1/3.' },
      












      { id: 'relocate2', loc: 'greenhaven', title: 'Carry a factory over',
        anchor: [{ el: '.move-ctl .move-btn' }, { el: '#places .pl-btn:not(.on)' }],
        text: 'You do not have to build it again. Press THE WASTELANDS at the top to fly back, ' +
              'click any machine on open ground, then press MOVE TO ANOTHER PLACE and pick ' +
              'Greenhaven.\n\nShift-click for several, or Shift-drag a box round them. It costs ' +
              'NOTHING and destroys nothing: every wire, till, hired hand, recruit and array comes ' +
              'with them.\n\nQuicker, once you know it: select them, press M, press a number key to ' +
              'fly, and click to put them down.' },
      











      { id: 'rock2', title: 'A meteorite',
        when: g => g.rockFirstAt !== undefined && (g.playtime || 0) - g.rockFirstAt >= 3 &&
                   (g.nodes || []).some(n => n.type === 'meteorite' && n.loc === g.loc &&
                                             (n.reserve || 0) > 0),
        anchor: [{ site: 'meteorite' }],
        text: 'A meteorite just came down. Bare hands cannot break it. Build an Ore Digger ' +
              'on it, the new card in the build dock, and wire in power and workforce. More ' +
              'will fall now and then.' },
      { id: 'rare2', title: 'A rare meteorite',
        when: g => g.rareFirstAt !== undefined && (g.playtime || 0) - g.rareFirstAt >= 3 &&
                   (g.nodes || []).some(n => n.type === 'meteorite' && n.rare === 'rare' && n.loc === g.loc &&
                                             (n.reserve || 0) > 0),
        anchor: [{ site: 'meteorite', rare: true }],
        text: 'This one is rare, the one that shines. It is smaller and richer: more lead, a ' +
              'little gold, and no steel. A digger on it gets a gold output, so give that a ' +
              'wire too.' },
      { node: 'recycler', title: 'Recycler',
        text: 'It recycles 1 kg/h of trash per 1 KW/h in. Trash the energy could not cover passes ' +
              'out of the second output, so wire BOTH outputs somewhere.' },
      { node: 'weightSorter', title: 'Weight Sorter',
        text: 'It wants TWICE as much energy as trash: 2 KW/h for every 1 kg/h coming in. ' +
              'Give it that and you get a clean 50/50 light-heavy split, which is ' +
              'what you want, because light trash is worth 7.25 and heavy only ' +
              '2.80.' },
      { node: 'powerStorage', title: 'Power Storage',
        text: 'You can cap what it hands out. Set an OUTPUT LIMIT in its panel.' },
      









      { node: 'solarPanel', title: 'Solar Panel',
        text: 'It only makes power in the DAY. At night it stops dead, and that is not a fault.' },
      






      { node: 'fluidTank', title: 'Fluid Tank',
        text: 'It lets go slowly, so a machine behind it can look starved. The speed is ' +
              'yours to set: there is an OUTPUT LIMIT in its panel. Clear that box and it ' +
              'pours out as fast as anything asks.' },
      { node: 'powerSplitter', title: 'Power Splitter',
        text: 'The split is yours to change. Click the machine and type the two numbers in ' +
              'its panel.' },
      















      { node: 'trashJunction', title: 'Salvage Store',
        text: 'It is a junction as well as a store. Up to five wires of one material go ' +
              'in and one comes out, and whatever is not carried away stays stacked.' +
              '\n\n' +
              'The first material to arrive decides what it holds, and it keeps that ' +
              'until it has been emptied. Let the old material out before you send it ' +
              'something else.' },
      { node: 'droneCleaner', title: 'Cleaner Drone',
        text: 'It claims the site it stands on, so sweeping that site by hand stops working.' },
      { node: 'magnetSeparator', title: 'Magnet Separator',
        text: 'Heavy trash the energy could not cover is not lost: it passes straight out ' +
              'of the second output.' },
      






      









      




      

      { node: 'hiringAgency', title: 'Hiring Agency',
        text: 'It makes no workers itself. It hires at the Hiring Posts and Labour ' +
              'Exchanges in this place, cheapest first, and spends only what its Bank earns. ' +
              'A Bank you want no Agency on can hide its room in its panel.' },
      
      { node: 'labourExchange', title: 'Labour Exchange',
        text: 'Its panel sets how many hands to hire and for how long. Pick both there, ' +
              'then press HIRE.' },
      { node: 'robot', title: 'Robot',
        text: 'It charges before it works, so a robot with an empty cell gives nothing ' +
              'and that is not a fault. Overdrive is in its panel: more workforce, and ' +
              'more power for each unit of it.' },
      { node: 'panelWorks', title: 'Panel Works',
        text: 'The kits only work while the sun is up. At night a Robot goes back to ' +
              'the grid, so leave it something to draw on.' },
      
      { node: 'wasteCleaner', title: 'Waste Cleaner',
        text: 'People on it need gear, robots do not. With no gear, only its robots dig.' },
      


      { node: 'airCleaner', title: 'Air Cleaner',
        text: 'It has a ceiling, and power above it is wasted, so read Most power on ' +
              'its card before wiring more in.' },
      { node: 'outreachHub', title: 'Outreach Hub',
        text: 'It gives nothing until the first recruit lands, so everything downstream ' +
              'reads zero at first. Wire energy in as well, or the workforce pool fills ' +
              'and it stops for ever. Its recruits belong to the machine, so demolishing ' +
              'it loses every one.' },
      


      { node: 'forecastMast', title: 'Forecast Mast',
        text: 'A mast holding less than one warning stays quiet, so give it a wire '   +
              'well before you need it. Switch it off in the inspector and it keeps '  +
              'charging without spending, which is how you save several warnings '     +
              'for later.' },
      


      { id: 'ciFalling', title: 'Clean Index is falling',
        text: 'Something you have built is spending Clean Index faster than the rest ' +
              'of your machines make it. Watch the number in the top left. While '     +
              'that lasts, your next unlock is moving further away.',
        anchor: [{ el: '#ci-rate' }, { el: '#ci-value' }],
        nodim: true, snooze: true, sound: 'deny',
        when: function (g) {
          

          const w = GG.config.ciWarn;
          return !!(w && w.enabled) && (g.ciLowSec || 0) >= w.afterSec;
        } },
      






      { node: 'tradePost', title: 'Trade Post',
        text: 'It only empties as fast as the crew you give it. Wire in less than it ' +
              'earns and the till fills anyway, and then everything feeding it stops too.' },
      { node: 'incinerator', title: 'Incinerator',
        text: 'It only burns as fast as the crew you give it. Wire in less than it takes ' +
              'in and the pile builds up anyway, and then everything feeding it stops too.' },
      { node: 'eddySeparator', title: 'Eddy Separator',
        text: 'Starve it of energy and the split slides toward cheap steel.' },
      


      { node: 'fineSorter', title: 'Fine Sorter',
        text: 'Starve it of workforce and the split slides toward cheap organic waste.' },
      { node: 'hazardPlant', title: 'Hazard Plant',
        text: '2 WF/h turns 3 kg/h of light trash into 1 kg/h of hazardous waste, worth four times ' +
              'as much. Light trash the crew cannot cover passes out of the second output. ' +
              'Hazardous waste cannot be burned.' },
      { node: 'cellAssembler', title: 'Cell Assembler',
        text: 'It wants THREE things at once: 3 kg/h aluminium, 1 kg/h hazardous waste and 5 WF/h. ' +
              'All three give 1 kg/h of batteries. Halve any one and the output halves.' },
      







      



      { node: 'strikeVault', title: 'Strike Vault',
        text: 'Quiet between storms is normal, not a fault: a bolt falls about once a day. It drops ' +
              '80 KW into the cells at once, even if your arrestors grounded it. Nothing makes ' +
              'power during a strike, so what it caught comes out afterwards. One only, and only ' +
              'where there is weather.' },
      

      { node: 'fuelPlant', title: 'Plutonium',
        anchor: [{ el: '.fuel-sw' }],
        text: 'Plutonium rocks now fall in Glowmoor. They glow green, and the first one ' +
              'opens a Plutonium Digger. Skytrawlers and Nuclear Reactors now have a FUEL ' +
              'switch on their panel.' },
      { node: 'gridFoundry', title: 'Grid Foundry',
        text: 'Once a few arrays are standing, a batch outgrows what a supplier can ' +
              'hold, so the rest arrives as it is made. Every array this foundry has ' +
              'raised makes its next one dearer, so a second foundry starts fresh. Its ' +
              'arrays belong to the machine, so move it rather than demolishing it.' },
      



      

      { node: 'fibrePress', title: 'Fibre Press',
        text: 'A Fibre Press makes exactly the same scrap timber as a Timber Reclaimer, out ' +
              'of 4 kg/h of organic waste and 3 WF/h.' },
      




      


      



      { node: 'diamondPress', title: 'Diamond Press',
        text: 'It fills with charcoal first. Until it has some it draws no power at all.' },
      






      { node: 'printWorks', title: 'Print Works',
        text: 'It fills with paper and material first, and draws no power until both are ' +
              'in. Each print then costs more than the last.' },
      






      { node: 'oilGenerator', title: 'Oil Generator',
        text: 'When your Clean Index income cannot cover the drain it burns only the ' +
              'share it can pay for and reads SHORT. That is rationing rather than a fault.' },
      { node: 'treePlanter', title: 'Tree Planter',
        text: 'It stops the moment its basket is full, so press COLLECT to keep it working.' },
    ],
  },

  balance: { startCI: 0, startMoney: 0, startDiamonds: 0, refundRatio: 0.5 },

  
  currencies: {
    
    ci:      { name: 'Clean Index', short: 'CI', rate: 'CI/h', color: '#62d4e3' },
    money:   { name: 'Money',       short: '$',  rate: '$/h',  color: '#b478e8', prefixed: true },
    diamond: { name: 'Diamond',     short: '◆',  rate: '◆/h',  color: '#ff7eb6' },
  },

  






  










  gem: {
    everySec: 180,          
    reward: 1,              
    padX: 0.10, padY: 0.14, 

    
    worldAnchored: true,
    



    followYou: false,
    
    avoidUi: true,
    


    clearPx: 34,

    








    scaleWithZoom: true,
    minScale: 0.65,
    maxScale: 1.6,
    


    uiIds: ['dock', 'inspector', 'tree-launch', 'boost-launch', 'bp-launch',
            'places', 'left-rail', 'boost-bar', 'btn-home', 'palette'],
    


    tries: 40,
    












    shine: {
      enabled: true,
      sweep: false,           
      stars: 3,
      


      color: '255,247,214',
      size: 12,               
      sizeVar: 0.35,          
      inner: 0.55,            
      outer: 1.15,            
                              
      sec: 2.6,               
      alpha: 0.95,
      



      random: true,
    },
  },

  






















  audio: {
    enabled: true,
    












    volume: 0.55,           
    minGap: 0.045,          
    





    mixVersion: 3,

    



    




    musicVolume: 0.07,
    

    desktopAutoplay: true,
    music: {
      enabled: true,
      shuffle: true,        
      gapSec: 4,            
      fadeSec: 3,           
      switchFadeSec: 1.2,   
      





















      



























      liteOnTouch: true,
      menu: [
        
        { file: 'assets/audio/music/Menu/Grey%20Foundry%20Loop.mp3', name: 'Grey Foundry Loop', gain: 1.199,
          lite: 'assets/audio/music/lite/Menu/Grey%20Foundry%20Loop.mp3', liteGain: 1.259 },
      ],
      tracks: [
        










        
        { file: 'assets/audio/music/Grey%20Foundry%20Loop%20(1).mp3', name: 'Grey Foundry Loop II', gain: 1.172,
          lite: 'assets/audio/music/lite/Grey%20Foundry%20Loop%20(1).mp3', liteGain: 1.230 },
        
        { file: 'assets/audio/music/Grinding%20Halo.mp3', name: 'Grinding Halo', gain: 0.84,
          lite: 'assets/audio/music/lite/Grinding%20Halo.mp3', liteGain: 0.881 },
        
        { file: 'assets/audio/music/Silent%20Rust%20Halo.mp3', name: 'Silent Rust Halo', gain: 0.991,
          lite: 'assets/audio/music/lite/Silent%20Rust%20Halo.mp3', liteGain: 1.047 },
        
        { file: 'assets/audio/music/Warm%20Grey%20Loop%20(V2).mp3', name: 'Warm Grey Loop II', gain: 0.782,
          lite: 'assets/audio/music/lite/Warm%20Grey%20Loop%20(V2).mp3', liteGain: 0.822 },
        
        { file: 'assets/audio/music/Warm%20Grey%20Loop.mp3', name: 'Warm Grey Loop', gain: 0.891,
          lite: 'assets/audio/music/lite/Warm%20Grey%20Loop.mp3', liteGain: 0.933 },
      ],
    },

    











    ambience: {
      volume: 0.5,
      fadeIn: 1.5,
      fadeOut: 2.0,
      sounds: {

        rain:      { file: 'assets/audio/sfx/rain.mp3',      gain: 1.046, loop: true },
        storm:     { file: 'assets/audio/sfx/storm_sfx.mp3', gain: 1.052, loop: true },
        
        


        lightning: { file: 'assets/audio/sfx/start_lighting.mp3',
                     gain: 0.948, loop: false, fadeIn: 0.35, then: 'lightningEnd' },
        
        lightningEnd: { file: 'assets/audio/sfx/end_lighting.mp3',
                        gain: 0.948, loop: false, fadeIn: 0.35, fadeOut: 1.0 },
        
        
        
        
        heat:      { file: 'assets/audio/sfx/heatwave.mp3',
                     gain: 1.011, loop: true, fadeIn: 2.5, fadeOut: 2.5 },
      },
    },

    sounds: {
      
































      rockFall: {
        
        file: 'assets/audio/sfx/rock_fall_2.mp3',
        gain: 0.610,            
        notes: [
          { f: 900, to: 220, t: 0, d: 1.15, type: 'sawtooth', g: 0.10, q: 2.2, bp: 700 },
          { f: 520, to: 140, t: 0.05, d: 1.05, type: 'triangle', g: 0.07 },
        ],
      },
      







      









      rockCall: {
        file: 'assets/audio/sfx/rock_fall_1.mp3',
        gain: 0.832,            
        notes: [
          { f: 900, to: 220, t: 0, d: 1.15, type: 'sawtooth', g: 0.10, q: 2.2, bp: 700 },
          { f: 520, to: 140, t: 0.05, d: 1.05, type: 'triangle', g: 0.07 },
        ],
      },
      







      














      rocketLaunch: {
        file: 'assets/audio/sfx/rocket_launch.mp3',
        gain: 0.229,            
        minGap: 1,
        notes: [
          { f: 70, to: 110, t: 0, d: 1.6, type: 'sawtooth', g: 0.10, q: 0.7, bp: 160 },
          { f: 110, to: 45, t: 1.4, d: 3.0, type: 'sawtooth', g: 0.12, q: 0.6, bp: 200 },
        ],
      },
      rocketLand: {
        file: 'assets/audio/sfx/rocket_land.mp3',
        gain: 0.178,            
        minGap: 1,
        notes: [
          { f: 60, to: 90, t: 0, d: 2.0, type: 'sawtooth', g: 0.10, q: 0.7, bp: 160 },
          { f: 90, to: 32, t: 2.0, d: 0.5, type: 'sine', g: 0.30 },
        ],
      },
      rockHit: {
        gain: 1.6,
        files: [
          { file: 'assets/audio/sfx/rock_hit_1.mp3', gain: 0.221 },   
          { file: 'assets/audio/sfx/rock_hit_2.mp3', gain: 0.226 },   
          { file: 'assets/audio/sfx/rock_hit_3.mp3', gain: 0.263 },   
          { file: 'assets/audio/sfx/rock_hit_4.mp3', gain: 0.282 },   
        ],
        notes: [
          { f: 90,  to: 34, t: 0,    d: 0.55, type: 'sine',     g: 0.34 },
          { f: 240, to: 60, t: 0,    d: 0.30, type: 'square',   g: 0.11, q: 0.8, bp: 180 },
          { f: 1400, to: 300, t: 0.01, d: 0.22, type: 'sawtooth', g: 0.06, q: 0.5, bp: 900 },
        ],
      },
      




      








      















      

      sweep:    { files: [{ file: 'assets/audio/sfx/trash_clean_0.mp3', gain: 0.964 }, 
                          { file: 'assets/audio/sfx/trash_clean_1.mp3', weight: 3 }, 
                          { file: 'assets/audio/sfx/trash_clean_2.mp3', gain: 1.92 }], 
                  gain: 0.9,
                  notes: [{ f: 620, to: 980, d: 0.09, w: 'triangle', g: 0.30 }] },
      




      







      geiger:   { gain: 1.0, minGap: 0.5,
                  notes: [0, 0.05, 0.11, 0.135, 0.22, 0.30, 0.32, 0.40, 0.49, 0.53, 0.56, 0.66, 0.74]
                    .map(function (t, i) {
                      return { f: 3400 - (i % 3) * 500, t: t, d: 0.014, w: 'noise', g: 0.55, q: 1.6 };
                    }) },
      plant:    { files: [{ file: 'assets/audio/sfx/tree_plant_1.mp3', gain: 1.563 }, 
                          { file: 'assets/audio/sfx/tree_plant_2.mp3', gain: 1.598 }], gain: 1.5, 
                  notes: [{ f: 540, to: 340, d: 0.13, w: 'sine', g: 0.26 },
                          { f: 180, t: 0.06, d: 0.10, w: 'noise', g: 0.10, q: 0.8 }] },
      

      pop:      { files: [{ file: 'assets/audio/sfx/pop_sfx.mp3', gain: 0.949 },
                          'assets/audio/sfx/pop2_sfx.mp3'], gain: 0.9, minGap: 0.06 },
      



      


      burn:     { file: 'assets/audio/sfx/burn.mp3', gain: 1.0,
                  notes: [
                          { f: 420, to: 110, d: 0.50, w: 'noise', g: 0.22, q: 0.5 },
                          { f: 80,  to: 45,  d: 0.65, w: 'sine',  g: 0.20 },
                          
                          { f: 620, to: 280, t: 0.12, d: 0.42, w: 'noise', g: 0.26, q: 0.5 },
                          { f: 500, to: 230, t: 0.30, d: 0.42, w: 'noise', g: 0.28, q: 0.45 },
                          { f: 400, to: 190, t: 0.48, d: 0.42, w: 'noise', g: 0.30, q: 0.4 },
                          { f: 330, to: 150, t: 0.64, d: 0.36, w: 'noise', g: 0.26, q: 0.4 },
                          
                          { f: 2600, to: 1400, t: 0.06, d: 0.10, w: 'noise', g: 0.16, q: 9 },
                          { f: 2100, to: 1100, t: 0.26, d: 0.10, w: 'noise', g: 0.15, q: 9 },
                          { f: 2900, to: 1500, t: 0.46, d: 0.09, w: 'noise', g: 0.14, q: 9 },
                          { f: 1800, to: 900,  t: 0.66, d: 0.10, w: 'noise', g: 0.12, q: 9 }] },
      
      collect:  { gain: 1.15,
                  notes: [{ f: 880,  d: 0.07, w: 'square', g: 0.20 },
                          { f: 1320, t: 0.06, d: 0.09, w: 'square', g: 0.18 },
                          { f: 1760, t: 0.12, d: 0.12, w: 'square', g: 0.14 }] },
      build:    { gain: 1.25,                                 
                  notes: [{ f: 240, to: 420, d: 0.10, w: 'triangle', g: 0.32 },
                          { f: 1200, t: 0.05, d: 0.06, w: 'noise',   g: 0.18, q: 2 }] },
      
      


      demolish: { file: 'assets/audio/sfx/demolish.mp3', gain: 1.8,
                  notes: [{ f: 190, to: 52,  d: 0.30, w: 'sine',  g: 0.34 },
                          { f: 2600, to: 800, d: 0.13, w: 'noise', g: 0.16, q: 1.4 },
                          { f: 340, to: 95,  t: 0.05, d: 0.24, w: 'noise', g: 0.20, q: 0.5 }] },
      wire:     { gain: 1.30, notes: [{ f: 520, to: 780, d: 0.08, w: 'sine', g: 0.26 }] },  
      unwire:   { gain: 1.45, notes: [{ f: 700, to: 300, d: 0.09, w: 'sine', g: 0.22 }] },  
      skill:    { gain: 1.15,                                 
                  notes: [{ f: 523, d: 0.10, w: 'triangle', g: 0.26 },
                          { f: 659, t: 0.08, d: 0.10, w: 'triangle', g: 0.24 },
                          { f: 784, t: 0.16, d: 0.18, w: 'triangle', g: 0.22 }] },
      boost:    { file: 'assets/audio/sfx/boost_activation.mp3', gain: 1.05,  
                  notes: [{ f: 330, to: 990, d: 0.30, w: 'sawtooth', g: 0.24 },
                          { f: 1320, t: 0.22, d: 0.20, w: 'triangle', g: 0.18 }] },
      
      boostOff: { file: 'assets/audio/sfx/boost_finished.mp3', gain: 1.4,   
                  notes: [{ f: 880, to: 300, d: 0.34, w: 'sawtooth', g: 0.20 },
                          { f: 440, t: 0.24, d: 0.22, w: 'triangle', g: 0.14 }] },
      

      
      travel:   { file: 'assets/audio/sfx/between_locations.mp3', gain: 1.0,
                  notes: [{ f: 300, to: 900, d: 0.28, w: 'sine', g: 0.22 },
                          { f: 1200, t: 0.20, d: 0.20, w: 'triangle', g: 0.14 }] },
      
      gemDrop:  { gain: 1.20,                                 
                  notes: [{ f: 1400, to: 2100, d: 0.16, w: 'sine', g: 0.22 },
                          { f: 2100, t: 0.14, d: 0.22, w: 'sine', g: 0.16 }] },
      gemTake:  { file: 'assets/audio/sfx/diamond_collection.mp3', gain: 1.685, 
                  notes: [{ f: 1046, d: 0.08, w: 'sine', g: 0.26 },
                          { f: 1568, t: 0.07, d: 0.09, w: 'sine', g: 0.24 },
                          { f: 2093, t: 0.14, d: 0.22, w: 'sine', g: 0.20 }] },
      goal:     { gain: 1.15,                                 
                  notes: [{ f: 587, d: 0.11, w: 'triangle', g: 0.26 },
                          { f: 880, t: 0.10, d: 0.11, w: 'triangle', g: 0.24 },
                          { f: 1175, t: 0.20, d: 0.26, w: 'triangle', g: 0.22 }] },
      claim:    { gain: 1.05,                                 
                  notes: [{ f: 784, d: 0.09, w: 'square', g: 0.20 },
                          { f: 1046, t: 0.08, d: 0.09, w: 'square', g: 0.18 },
                          { f: 1568, t: 0.16, d: 0.20, w: 'sine',   g: 0.20 }] },
      hire:     { gain: 1.10,                                 
                  notes: [{ f: 300, to: 520, d: 0.12, w: 'square', g: 0.22 },
                          { f: 640, t: 0.10, d: 0.12, w: 'triangle', g: 0.20 }] },
      




      forecast: { gain: 1.0, minGap: 0.4,
                  notes: [{ f: 784, d: 0.13, w: 'triangle', g: 0.26 },
                          { f: 587, t: 0.15, d: 0.15, w: 'triangle', g: 0.26 },
                          { f: 784, t: 0.36, d: 0.13, w: 'triangle', g: 0.24 },
                          { f: 587, t: 0.51, d: 0.20, w: 'triangle', g: 0.24 },
                          
                          { f: 196, to: 150, d: 0.72, w: 'sine', g: 0.11 }] },
      



      


      deny:     { files: [{ file: 'assets/audio/sfx/acces_denied.mp3', gain: 0.947 }, 
                          { file: 'assets/audio/sfx/error_sfx.mp3', gain: 1.8 }], 
                  gain: 0.9,
                  notes: [{ f: 200, to: 130, d: 0.16, w: 'square', g: 0.22 }] },
      

      click:    { gain: 2.0, notes: [{ f: 900, d: 0.03, w: 'sine', g: 0.14 }], minGap: 0.02 },
    },
  },

  





















  ui: {
    





    fullSocket: { enabled: true, color: '#e06c6c', pad: 4, width: 2 },   
    

    iconGroupColor: { enabled: true, wholeCard: true, except: ['fluids', 'manufacture'] },
    


    balanceDown: true,
    

    siteMark: false,

    




    tutorReplay: false,
    














    flipPorts: true,
    













    flipAll: true,
    




    capsNote: false,
    








    routingBand: true,
    





    powerUpBand: true,
    




    fuelLoadBand: true,
    













    powerUpBandGated: true,
    













    outletBand: false,
    







    outletBandWorkEps: 0.001,
    














    outletRow: true,
    














    outletBar: { enabled: true, options: ['off', 'on'], def: 'off' },
    





















    



    gridSnap: { enabled: true, options: ['free', 'grid'], def: 'free', size: null, hot: 0.30 },

    


















    whatsNew: {
      enabled: true,
      id: 'update6',                 
      returningOnly: true,
      title: 'Update 6: practice rooms',
      text: 'Press TRY IT on a machine in the Codex to try it somewhere safe. ' +
            'The rest is in the devlog.',
    },
    

    pumpCountsTotal: true,
    


    beaconLocal: true,
    


    oneCursor: true,
    


    gradeFollowsCargo: true,
    






    blueprintSettings: ['wa', 'wb', 'outCap', 'outMul', 'flip', 'quiet', 'mastOff', 'overdrive', 'pillAlt', 'prio', 'autoPull',
      'lima', 'limb', 'limc', 'fuelMode'],   
    






    undo: { enabled: true, max: 20 },
    


    roadDoneHides: true,
    

    puRockChip: true,
    


    pumpAskPerHour: true,
    




    supplyShown: true,
    











    skinChoice: { enabled: true, options: ['classic', 'new'], def: 'new' },
    







    codexMystery: true,
    


    codexHidePorts: true,
    

    codexFold: true,
    

    tryQuiet: true,
    







    nameFit: { enabled: true, steps: [13.5, 12.5, 12] },
    





    cardCtlFirst: true,
    



    gemEta: true,
    





    capsByCategory: true,
    











    iconFit: { enabled: true, target: 18, min: 0.85, max: 1.25 },

    



















    dockAnim: {
      enabled: true,
      openMs: 260, closeMs: 190,
      openEase:  'cubic-bezier(.22, 1, .36, 1)',
      closeEase: 'cubic-bezier(.55, .06, .68, .19)',
      lift: 10,
      measure: true,
      


      maxPx: 220,
    },

    













    selectMore: 'touch',

    


















    noContextMenu: true,

    




    tapToDeselect: true,

    boostLauncher: { left: 18, bottom: 20 },

    

























    leftRail: { left: 16, top: 14, gap: 8, planTop: 14, planWidth: 320 },

    

    newPlace: true,

    


















    




    














    




    rate: { sampleSec: 0.5, smoothSec: 5, countHand: false, netAgency: true },
    



    dockFollowDrag: true,
    


    groupDocks: true,
    

    rodCount: true,
    

    agencyPlural: true,
    

    rocketLoss: true,
    

    shotWidth: 384,
    shotQuality: 0.55,

    




    skillRing: true,

    





    skillBuyRow: true,
    











    ownedMaxLabel: false,

    


















    treeZoom: { def: 1, touch: 0.5 },

    
















    










    treeFlow: { money: { dx: 300, dy: 330, bx: 260, by: 240 } },
    treeRecentre: {
      enabled: true,
      ms: 420,        
      


      deadZone: 0.22,
    },

    












    


    wheelScrollX: true,
    scrollSlop: 3,

    



















    dockMaxCards: 10,

    











    openRouting: true,

    









    hubSelfFeed: true,

    




    panKeepsWire: true,

    


    raiseAddsDirt: true,

    





    holdKeepsGrade: true,
    



    codexLink: true,

    








    powerUpRow: true,

    








    toastSkin: true,

    













    cull: { enabled: true, nodePad: 260, wirePad: 340 },

    






    bandSelect: true,

    







    glass: true,

    





















    skin: {
      

      enabled: true,

      




      corners: true,
      radius: { r1: 2, r2: 3, r3: 4, r4: 6 },

      



      edges: true,
      seam:  'rgba(0,0,0,.55)',
      crown: 'rgba(255,255,255,.10)',

      






      grain: true,
      grainAlpha: 0.06, grainFreq: 0.82, grainTile: 140, grainOctaves: 3,

      




































      tint: true,
      






      tone: 'deep',
      tones: {
        

        neutral: {
          bg: '#0b0b0c', panel: '#17181a', panel2: '#202124',
          text: '#e4e5e7', muted: '#989a9e',
          tbA: '#1b1c1e', tbB: '#131416',      
          tcA: '#1c1d20', tcB: '#141517',      
          panelRgb: '23,24,26',  panel2Rgb: '32,33,36', raiseRgb: '27,28,30',
          floorRgb: '22,23,25',  sunkRgb:   '16,17,19', voidRgb:  '8,9,10',
          bgRgb:    '11,11,12',
        },
        
        warm: {
          bg: '#0c0b0a', panel: '#191714', panel2: '#232019',
          text: '#e6e0d6', muted: '#9c9184',
          tbA: '#201d18', tbB: '#16130f',
          tcA: '#211d17', tcB: '#16130f',
          panelRgb: '25,23,20',  panel2Rgb: '35,32,25', raiseRgb: '30,27,22',
          floorRgb: '24,22,18',  sunkRgb:   '18,16,13', voidRgb:  '10,9,7',
          bgRgb:    '12,11,10',
        },
        
        deep: {
          bg: '#06080b', panel: '#0d1116', panel2: '#141922',
          text: '#d7e2ee', muted: '#7f8c9c',
          tbA: '#10161f', tbB: '#0b1017',
          tcA: '#121a26', tcB: '#0c121b',
          panelRgb: '13,17,22',  panel2Rgb: '20,25,34', raiseRgb: '17,22,29',
          floorRgb: '13,18,24',  sunkRgb:   '10,13,18', voidRgb:  '4,6,9',
          bgRgb:    '6,8,11',
        },
      },

      













      display: true,
    },

    















    treeWheel: 'zoom',

    




    treeZoomHideOnSummary: true,

    





























    hotkeys: {
      enabled: true,
      move:   'm',            
      places: 'digit',        
      dock:   '',             
      


      escDock: true,
      





      demolish: 'Delete',
      




      flip: 'f',
    },

    





    keyHints: true,

    







    demolishConfirm: { enabled: true, armSec: 5 },

    



    armSmooth: true,

    




    wireToasts: false,

    







    arriveToast: false,

    



    codexRate: false,

    



















    descSwap: false,

    





    priceRows: { onlyReachable: true },
  },

  




  menu: {
    slots: 3,
    
    nameMax: 24,

    






    newRunHints: false,

    


    controlsTab: true,

    








































    zoom: {
      options: [1, 1.25, 1.5],
      










      def: 1,
      auto: false,
      minStage: 620,          
      minW: 1000,             
      chrome: 64,             
    },

    









    earth: {
      enabled: true,
      stages: 10,          
      spinSec: 55,         
      morphSec: 0.55,      
      size: 360,           
      specks: 30,          
      tilt: 0.32,          

      





      detail: true,

      





      realWorld: true,
      detailPx: 200,       
      

      onHome: true,
      













      capOnHome: false,
      


      iceLat: 66, iceLoss: 12,
      clouds: 9,           
      cloudDrift: 1.35,    
      cloudAlpha: 0.34,    
      ice: 0.34,           

      











      glint: { power: 22, base: 60, gain: 120 },

      




      halo: 1.20,

      










      drag: {
        enabled: true,
        turnPerWidth: 1,     
        spin: true,          
        spinDecaySec: 1.1,   
        maxSpin: 7,          
      },

      







      preview: false,
      previewSec: 1.4,     

      
      



      dirty: { sea: '#5f5741', land: '#6b5c40', dry: '#7d6b48', rim: '#a8935f',
               smog: '#cbb47e', cloud: '#b7a892', ice: '#9c9384' },
      clean: { sea: '#1668c8', land: '#37a05e', dry: '#c9b177', rim: '#8fd8ff',
               smog: '#d6ecff', cloud: '#ffffff', ice: '#eaf7ff' },
      smogAlpha: 0.42,     
    },

    bg: {
      nodes: 26,            
      linkDist: 260,        
      speed: 7,             
      packetSpeed: 0.22,    
      packetChance: 0.4,    
      dotMin: 1.6, dotMax: 3.4,
      hue: ['#62d4e3', '#5ecb8a', '#b478e8'],   
      alpha: 0.5,           
    },
  },

  



  dock: {
    tierAfter: 'powerStore',
    sectionIcons: {
      workforce: 'crew', energy: 'battery', trash: 'bag', money: 'market', ci: 'landfill',
      manufacture: 'cell',
      fluids: 'drop',          
      
      
      special: 'special',
      
      
      trials: 'rosette',
    },
    




    newBadge: true,
    











    showFree: false,
  },

  












  heal: {
    




    enabled: false,
    

    full: 25000,            
    


    gamma: 0.55,
    ease: 1.5,              

    
    skyDirty: ['#1a1410', '#100c08'],   
    skyClean: ['#091a17', '#05100e'],   

    grid: { dirty: 'rgba(150,120,80,0.055)', clean: 'rgba(110,200,165,0.075)' },

    

    smog: { color: '#7a5c38', alpha: 0.34 },
    
    motes: { count: 70, color: '#8a7350', size: 1.9, speed: 7 },
  },

  



































  revive: {
    enabled: true,
    stages: 5,              
    ease: 1.2,              
    announce: true,         
    


    countGrove: true,

    

    ground: {
      dirty: ['#141210', '#0e0b09'],    
      clean: ['#0b1a15', '#06100d'],    
    },
    grid: { dirty: 'rgba(150,130,95,0.050)', clean: 'rgba(110,200,165,0.075)' },

    




    patch: { max: 6, r: 300, color: '#4e9c6e', alpha: 0.11 },
  },

  
































  pacing: {
    enabled: false,
    





    dropWhenOff: true,
    affordSec: 0.5,         
    sampleSec: 30,          
    


    maxSamples: 4000,
    forwardStep: 0.5,       
    forwardHours: 20,       
    maxSteps: 400000,       
    autoBuy: true,          
  },

  







  treeSummary: {
    enabled: true,
    minChange: 1e-9,        
  },

  
















  skillMystery: {
    enabled: true,
    money: false,
  },

  


















  skillAlert: {
    enabled: true,
    toast: true,
    badge: true,
    money: false,
    checkSec: 0.5,          
  },

  

































  autoOpen: {
    enabled: true,
    announce: true,
    






    doneAt: 0.999,
  },

  









































  planRescue: {
    enabled: true,
  },

  























  wxNotice: {
    enabled: true,
    options: ['all', 'here', 'off'],
    def: 'here',
    








    mast: true,
  },

  





  


















  stacking: {
    additive: true,
    zeroWins: true,         
  },

  

































  
































  





























  



























  


























  



























  













  splitter: { honourRatio: true, demandAware: true, spill: false, damp: 0.5,
              materialSpill: false, materialLockstep: false },

  























  


























  powerPush: {
    enabled: true,
    







































    
































    bankSurplus: false,
    






















    autoBank: true,
    
















    storageDeadEnd: true,

    










    honestAsk: true,
    







    shareByDemand: false,
    









    


    drainSteps: ['auto', null, 0],
    defaultDrain: null
  },

  mixer: { splitHopper: true },

  











  







  







  pool: { layers: true, seamAlpha: 0.5, tintGround: false,
          wave: { amp: 3.2, speed: 1.1, seamAmp: 2.0, seamSpeed: 0.62,
                  stir: 3.4, stirSec: 2.2 } },

  
























  





  practice: {
    enabled: true,

    

















    locked: true,

    




    supplyKg: 20,

    









    




    states: [
      { id: 'ideal',   kwMul: 1 },
      { id: 'starved', kwMul: 0.25 },
      { id: 'dead',    kwMul: 0 },
    ],
    def: 'ideal',

    











    lessons: true,
    sorters: ['weightSorter', 'eddySeparator', 'fineSorter'],

    









    
    fluids: FLUIDS.slice(),
    groups: {
      


      rubble: { machines: ['rubbleSorter'], labels: 'rb',
        states: [{ id: 'both', wf: 1, kw: 1 }, { id: 'moreCrew', wf: 2, kw: 1 },
                 { id: 'morePower', wf: 1, kw: 2 }, { id: 'crew', wf: 1, kw: 0 },
                 { id: 'power', wf: 0, kw: 1 }, { id: 'crew2', wf: 2, kw: 0 },
                 { id: 'power2', wf: 0, kw: 2 }] },
      filter: { machines: ['waterCleaner', 'oilSeparator'], labels: 'flt',
        states: [{ id: 'ideal', filter: 1 }, { id: 'starved', filter: 0.25 },
                 { id: 'dead', filter: 0 }] },
      







      
      hub: { machines: ['outreachHub'], labels: 'rb', perHour: 6,
        states: [{ id: 'both', wf: 1, kw: 1 }, { id: 'crew', wf: 1, kw: 0 },
                 { id: 'power', wf: 0, kw: 1 }] },
      


      forge: { machines: ['gridFoundry'], labels: 'frg', perHour: 3,
        states: [{ id: 'even', mat: {} }, { id: 'moreSteel', mat: { steel: 2 } },
                 { id: 'moreCell', mat: { cell: 2 } }] },
      perm: { machines: ['diamondPress', 'biodome', 'pavingTrain'], perHour: 3,
        labels: 'all',   
        states: [{ id: 'ideal', all: 1 }, { id: 'starved', all: 0.25 },
                 { id: 'dead', all: 0 }] },
      



      

      autoSell: { machines: ['tradePost', 'incinerator', 'tradingFloor', 'burnYard'], labels: 'half',
        states: [{ id: 'ideal', kwMul: 1 }, { id: 'starved', kwMul: 0.5 }, { id: 'dead', kwMul: 0 }] },
      store: { machines: ['trashJunction'], labels: 'lim',
        states: [{ id: 'none', limit: null }, { id: 'some', limit: 0.25 },
                 { id: 'zero', limit: 0 }] },
    },
    

    









    scenes: {
      
      prioPowerSplitter: { prio: 'outreachHub', other: 'droneCleaner', perHour: 3, trickle: 0.5,
        startFull: false,
        states: [{ id: 'first', prio: 'a' }, { id: 'second', prio: 'b' }] },
      
      prioCrewSplitter: { prio: 'outreachHub', other: 'cleaner', perHour: 3, trickle: 0.5,
        startFull: false,
        states: [{ id: 'first', prio: 'a' }, { id: 'second', prio: 'b' }] },
      








      powerStorage: { kind: 'battery', consumer: 'recycler', kgPerHour: 10, supplyMul: 2,
        onHours: 1, offHours: 1,
        states: [{ id: 'none', limit: null }, { id: 'some', limit: 0.5 }, { id: 'zero', limit: 0 },
                 { id: 'use', reserve: 'use' }, { id: 'hold', reserve: 'hold' }] },
      
      powerVault: { kind: 'battery', consumer: 'recycler', kgPerHour: 25, supplyMul: 2,
        onHours: 1, offHours: 1,
        states: [{ id: 'none', limit: null }, { id: 'some', limit: 0.5 }, { id: 'zero', limit: 0 },
                 { id: 'use', reserve: 'use' }, { id: 'hold', reserve: 'hold' }] },
      
















      meteorBeacon: { kind: 'beacon', loc: 'mirewater', perHour: 1,
        states: [{ id: 'manual', auto: false }, { id: 'auto', auto: true }] },
      strikeVault: { kind: 'strike', loc: 'mirewater', consumer: 'recycler', kgPerHour: 10,
        states: [], actions: ['bolt'] },
      
      hiringAgency: { kind: 'agency', goldKg: 1, posts: 2, exchanges: 1, money: 200, hands: 1, sec: 600,
        states: [{ id: 'posts', order: 'post' }, { id: 'exchange', order: 'exchange' }] },
      

      rocket: { kind: 'rocket', perHour: 1, flightSec: 120,
        states: [] },
      


      printWorks: { kind: 'print', perHour: 3,
        otherRes: ['coal', 'wood', 'lead', 'cell', 'glazing', 'advCell'],
        states: [{ id: 'boost', res: 'gold' }, { id: 'gem', res: 'other' }] },
      






      robot: { kind: 'robot',
        states: [{ id: 'enough', kw: 1 }, { id: 'double', kw: 2 }, { id: 'none', kw: 0 },
                 { id: 'steady', drive: false }, { id: 'over', drive: true }] },
    },
    


    noRoom: ['crewJunction', 'crewSplitter', 'powerSplitter', 'oilGenerator',
             'salvageSplitter',    
             'market', 'landfill'],   
    



    recommend: { enabled: true,
      top: ['prioPowerSplitter', 'prioCrewSplitter', 'powerStorage', 'weightSorter', 'recycler',
            'printWorks', 'rocket', 'robot', 'hiringAgency', 'meteorBeacon',
            'rubbleSorter'],   
      good: ['outreachHub', 'gridFoundry', 'diamondPress', 'trashJunction', 'hazardPlant',
             'fineSorter', 'eddySeparator', 'cellAssembler', 'fluidTank',
             'strikeVault', 'bank', 'biodome', 'reactor', 'waterCleaner', 'oilSeparator',
             'tradePost', 'incinerator', 'tradingFloor', 'burnYard'] },   
    



    fuelStates: [{ id: 'fuelMain', alt: false }, { id: 'fuelAlt', alt: true }],
    



    actions: { gemCollector: ['gem'] },
    
    gemFar: 600,
    

    sounds: true,
    startFull: { gemCollector: 'bank', meteorBeacon: 'bank', robot: 'halfBank' },   
    

    speeds: [0.5, 1, 2, 5],
    rowAt: 5,
    units: { outreachHub: 'recruit', gridFoundry: 'array', diamondPress: 'diamond',
             biodome: 'dome', pavingTrain: 'stretch' },

    
    layout: { inX: -430, outX: 430, gapY: 200 },
  },

  

















  wire: {
    



    hitWhole: true,
    ortho: {
      enabled: true,
      radius: 12,     
      stub: 26,       
      


      minJog: 26,
    },
    





    holdFull: true,
    




    glow: {
      enabled: true,
      width: 12,        
      alpha: 0.22,      
      breathe: 0.45,    
      periodSec: 2.4,   
      sweepSec: 1.8,    
      sweepLen: 0.22,   
    },
  },

  



















  













  ciWarn: {
    enabled: true,
    
















    afterSec: 60,            
    snoozeSec: 300,          
    sound: 'deny',
  },

  diagnose: {
    enabled: true,
    card: true,             
    inspector: true,        
    


    slowShare: 0.45,
    








    siteFullRel: 1e-9,
    





    overSupplySlack: 0.02,
    stopColor: '#e0a33a',   
    slowColor: '#8796a8',   

    














    counter: true,
    counterSlow: false,

    
















    mute: true,
    



    scanSec: 0.5,
    













    



    batchGathers: true,
    materialFirst: true,
    



















    stopWhenThrottled: true,
    



















    




    












    












    












    unwiredSec: 45,
    























    cardBand: true,
    bandTint: 0.07,         
    cardFrame: false,       
    cardWord: true,         
    cardMark: false,        
    

























    pillFlip: {
      enabled: true,
      






      pad: 9,               
      padTouch: 6,          
    },
    frameAlpha: 0.75,       
    tintAlpha: 0.10,        
  },

  
































  permanentLadder: { enabled: false },

  boostSec: 180,            
  

  boostUseStep: 2,          
  boostUseSurcharge: 1,     
  


  boostFirstFree: 1,
  boosts: [
    {
      id: 'overdrive', name: 'Overdrive', icon: 'boOverdrive', color: '#e8b04b',
      cost: 3,
      desc: 'Every energy generator runs at two and a half times its output.',
      












      effects: [{ stat: '*.energyRate', op: 'mul', value: 2.5 }],
    },
    {
      id: 'scrapSurge', name: 'Scrap Surge', icon: 'boScrapSurge', color: '#5ecb8a',
      cost: 3,
      desc: 'Every grade of trash is worth double at a Market, a Landfill and their staffed ' +
            'versions.',
      effects: [
        { stat: 'market.value.trash',    op: 'mul', value: 2 },
        { stat: 'market.value.rtrash',   op: 'mul', value: 2 },
        { stat: 'market.value.light',    op: 'mul', value: 2 },
        { stat: 'market.value.heavy',    op: 'mul', value: 2 },
        { stat: 'landfill.value.trash',  op: 'mul', value: 2 },
        { stat: 'landfill.value.rtrash', op: 'mul', value: 2 },
        { stat: 'landfill.value.light',  op: 'mul', value: 2 },
        { stat: 'landfill.value.heavy',  op: 'mul', value: 2 },
      ],
    },
    {
      id: 'goldenTouch', name: 'Golden Touch', icon: 'boGoldenTouch', color: '#62d4e3',
      cost: 3,
      



      desc: 'Sweeping a Trash Site by hand pays four times as much Clean Index.',
      effects: [{ stat: 'swipe.ciPerEntry', op: 'mul', value: 4 }],
    },
    {
      id: 'rally', name: 'Rally', icon: 'boRally', color: '#4a9fe0',
      cost: 3,
      desc: 'Every Volunteer and every hired hand produces 2.5x the workforce.',
      effects: [{ stat: 'player.wfRate', op: 'mul', value: 2.5 }],
      




      marks: ['hiringPost', 'labourExchange', 'outreachHub'],
    },
    {
      id: 'grove', name: 'Grove Rush', icon: 'boGroveRush', color: '#5ecb8a',
      cost: 3,
      desc: 'Everything on a Grove Plot grows twice as fast, planted by machine or by hand.',
      effects: [
        { stat: 'treePlanter.ciPerWF', op: 'mul', value: 2 },
        

        { stat: 'seedDrill.ciPerWF',   op: 'mul', value: 2 },
        { stat: 'plant.ciPerEntry',    op: 'mul', value: 2 },
      ],
    },
    {
      
      id: 'sunrise', name: 'Sunrise', icon: 'boSunrise', color: '#f0c04a',
      cost: 2, instant: true, nightOnly: true,
      
      requires: ['solarPanel'],
      desc: 'Drags the sun straight back over the horizon. Every Solar Panel starts working ' +
            'again this instant. Only usable at night.',
    },
  ],

  



  





  objectives: [
    { id: 'firstSweep',   name: 'Break Ground',  icon: 'site',    reward: 1, goal: 20,
      desc: 'Sweep a Trash Site by hand 20 times.' },
    { id: 'firstBurn',    name: 'Into the Fire', icon: 'landfill', reward: 1, goal: 1,
      desc: 'Burn your first trash at a Landfill.' },
    { id: 'firstCash',    name: 'First Payday',  icon: 'money',   reward: 1, goal: 1,
      desc: 'Earn your first cash from a Market.' },
    { id: 'firstPower',   name: 'Live Wire',     icon: 'turbine', reward: 1, goal: 1,
      desc: 'Unlock your first energy generator.' },
    { id: 'perfectSplit', name: 'Perfect Split', icon: 'sorter',  reward: 1, goal: 1,
      desc: 'Run a Weight Sorter at full force, so it splits an even 50/50.' },
    { id: 'evenPower',    name: 'Even Hands',    icon: 'split',   reward: 1, goal: 1,
      desc: 'Divide energy dead even with a Power Splitter: half to each output, with power ' +
            'flowing.' },
    { id: 'heavyMerge',   name: 'Heavy Traffic', icon: 'merge',   reward: 1, goal: 1,
      desc: 'Join two streams of heavy trash into one Salvage Store.' },
    












    { id: 'fullBloom',    name: 'Full Bloom',    icon: 'fert',    reward: 3, goal: 1,
      demo: false,
      desc: 'Feed one Tree Planter until its fertilizer multiplier will go no higher.' },
    { id: 'firstGem',     name: 'Lucky Find',    icon: 'diamond', reward: 1, goal: 1,
      desc: 'Catch a diamond as it appears on the map.' },
    { id: 'maxedSkill',   name: 'Mastery',       icon: 'obMastery',   reward: 1, goal: 1,
      desc: 'Take any one money skill all the way to level 5.' },
    { id: 'threeSources', name: 'Mixed Grid',    icon: 'battery', reward: 1, goal: 3,
      desc: 'Feed one Power Storage from three different kinds of generator at once.' },
    { id: 'halfSite',     name: 'Half Cleared',  icon: 'obHalfSite',    reward: 1, goal: 0.5,
      desc: 'Strip a Trash Site down to half its reserve.' },
    { id: 'handHundred',  name: 'Bare Hands',    icon: 'obHand',    reward: 1, goal: 100,
      desc: 'Clear 100 kg by hand-sweeping alone.' },
    { id: 'fullCrew',     name: 'Full Crew',     icon: 'hire',    reward: 1, goal: 3,
      desc: 'Have three hired hands working at one Hiring Post at the same time.' },
    { id: 'bigCrew',      name: 'Muster',        icon: 'crew',    reward: 1, goal: 5,
      desc: 'Feed one Crew Junction from five workforce sources at once.' },
    { id: 'powerKg',      name: 'Unmanned',      icon: 'cleaner', reward: 1, goal: 300,
      desc: 'Strip 300 kg out of the ground with Cleaner Drones alone.' },
    { id: 'firstMetal',   name: 'Scrap Value',   icon: 'magnet',  reward: 1, goal: 1,
      desc: 'Sell your first metal at a Market.' },
    { id: 'drainSite',    name: 'Scorched Earth', icon: 'obDrainSite',   reward: 1, goal: 1,
      desc: 'Strip a Trash Site all the way down to nothing.' },
    { id: 'hiredFive',    name: 'Whole Payroll', icon: 'obClipboard',    reward: 1, goal: 5,
      desc: 'Feed one Crew Junction from five Hiring Posts, every one of them with a full crew.' },
    { id: 'spendGems',    name: 'Big Spender',   icon: 'obSpendGems', reward: 1, goal: 20,
      desc: 'Spend 20 diamonds.' },
    { id: 'firstTree',    name: 'Take Root',     icon: 'tree',    reward: 1, goal: 1,
      desc: 'Put down your first Tree Planter.' },
    { id: 'newLand',      name: 'Greener Pastures', icon: 'world', reward: 1, goal: 1,
      desc: 'Open up Greenhaven.' },
    
    
    


    { id: 'allWeather',   name: 'Storm Chaser',  icon: 'storm',  reward: 1, goal: 0,
      desc: 'See every kind of weather for yourself. It only counts if you are in the place where it is happening.' },
    { id: 'yardBare',     name: 'Nothing Left',  icon: 'obYardBare',   reward: 1, goal: 0,
      desc: 'Strip every Trash Site in the Wastelands down to nothing.' },

    
    { id: 'firstCells',   name: 'Cell Block',    icon: 'cell',   reward: 1, goal: 1,
      desc: 'Build your first kilogram of batteries.' },
    


    





    { id: 'firstRock', demo: false,   name: 'Out of the Sky', icon: 'meteor', reward: 1, goal: 1,
      desc: 'Dig one Meteorite out completely.' },
    




    { id: 'tenCraters', demo: false,  name: 'Ten Craters',   icon: 'obCraters', reward: 3, goal: 10,
      desc: 'Dig ten Meteorites out completely.' },
    { id: 'bothTimber', demo: false,   name: 'Two Grains',    icon: 'timber', reward: 1, goal: 2,
      desc: 'Make scrap timber both ways: reclaimed from rubble, and pressed from organic ' +
            'waste.' },
    { id: 'charredWood', demo: false,  name: 'Charred',       icon: 'kiln',   reward: 1, goal: 15,
      desc: 'Char 15 kg of scrap timber down into charcoal at a Char Kiln.' },
    { id: 'bigArray',     name: 'Own Grid',      icon: 'forge',  reward: 1, goal: 3,
      desc: 'Have one Grid Foundry generating more than 3 KW/h.' },
    { id: 'bigOutreach',  name: 'A Movement',    icon: 'outreach', reward: 1, goal: 5,
      desc: 'Have one Outreach Hub putting out more than 5 WF/h of recruits.' },
    { id: 'fullVault',    name: 'Full Bank',     icon: 'vault',  reward: 1, goal: 10,
      desc: 'Feed one Power Vault from ten power sources at once.' },
    { id: 'splitChain',   name: 'Cascade',       icon: 'obCascade',  reward: 1, goal: 5,
      desc: 'Run five Power Splitters in a single chain.' },
    
    { id: 'kiloCI',       name: 'Clean Thousand', icon: 'ci',    reward: 1, goal: 1000,
      desc: 'Reach 1,000 Clean Index earned in total.' },
    { id: 'kiloMoney',    name: 'First Fortune', icon: 'obCoinStack',  reward: 1, goal: 1000,
      desc: 'Earn $1,000 in total.' },
    { id: 'boltBlocked',  name: 'Earthed',       icon: 'bolt',   reward: 3, goal: 1,
      desc: 'Have Surge Arrestors shrug a Lightning strike off your grid entirely.' },
    { id: 'fullGrove',    name: 'Full Canopy',   icon: 'obThreeTrees',   reward: 1, goal: 1,
      desc: 'Grow a Grove Plot all the way to 100%.' },
    { id: 'bigHire',      name: 'Full Shift',    icon: 'exchange', reward: 3, goal: 1,
      desc: 'Take on ten workers for a full hour at one Labour Exchange.' },
    



    { id: 'fiveSuns', demo: false, name: 'Five Suns', icon: 'robot', reward: 5, goal: 5,
      desc: 'Wire five Solar Robots straight into one Crew Junction.' },
    






    { id: 'robotWaste', demo: false, name: 'No Suits Needed', icon: 'hazmat', reward: 1, goal: 100,
      desc: 'Dig 100 kg of nuclear waste with a crew of robots only.' },
    { id: 'bankFull', demo: false, name: 'Gold Reserve', icon: 'bank', reward: 1, goal: 1,
      desc: 'Fill a Bank with as much gold as it can hold.' },
    { id: 'bankGold', demo: false, name: 'Gold Standard', icon: 'obGoldBars', reward: 5, goal: 3,
      desc: 'Hold 3 kg of gold in your Banks at once.' },
    





    



    { id: 'fleetStorm', demo: false, name: 'Fleet in the Storm', icon: 'rocket', reward: 5, goal: 3,
      desc: 'Launch all three of your Skytrawlers during one Storm.' },
    { id: 'warehouse', demo: false, name: 'Warehouse', icon: 'depot', reward: 5, goal: 200,
      kinds: 4, minKg: 25,
      desc: 'Hold 200 kg in Salvage Stores at once, with at least 25 kg each of four ' +
            'different materials.' },

    



    { id: 'oilSacrifice', demo: false, name: 'Paid in Kind',  icon: 'oilgen', reward: 1, goal: 300,
      





      desc: 'Give up 300 Clean Index in total to Oil Generator licences.' },
    { id: 'pureGlass',    name: 'Clear Run',     icon: 'rubble', reward: 1, goal: 1,
      desc: 'Run a Rubble Sorter on crew alone, so every gram comes out as glass and none as ' +
            'aggregate.' },
    




    { id: 'allGenerators', name: 'Every Mast',   icon: 'obEveryMast', reward: 1, goal: 5,
      desc: 'Stand FIVE of every kind of generator in the same place at once. Five Wind ' +
            'Turbines, five Solar Panels and five Storm Turbines together.' },
    { id: 'richPlanter', demo: false,  name: 'Deep Bed',      icon: 'obDeepBed',   reward: 1, goal: 1.5,
      desc: 'Feed one Tree Planter until fertilizer has it growing half again as fast: x1.5, five ' +
            'loads in.' },
    




    { id: 'oneCleaner',   name: 'Both Methods',  icon: 'obBothWays', reward: 3, goal: 500,
      kinds: ['cleaner', 'droneCleaner'],
      desc: 'Dig 500 kg with Trash Cleaners and 500 kg with Cleaner Drones. Hand-sweeping ' +
            'does not count.' },
    { id: 'twinFeed',     name: 'Two of a Kind', icon: 'floor',  reward: 1, goal: 1,
      desc: 'Feed both sockets of a Trading Floor or a Burn Yard with the same grade at once.' },
    { id: 'stampBlueprint', name: 'Stamped',     icon: 'blueprint', reward: 1, goal: 1,
      desc: 'Save a group of machines as a blueprint and put it back down somewhere else.' },
    { id: 'gemFifty',     name: 'Prospector',    icon: 'obPickaxe', reward: 1, goal: 50,
      desc: 'Catch 50 diamonds off the ground.' },
    { id: 'forgeCycle',   name: 'Self-Sufficient', icon: 'obSelfLoop', reward: 3, goal: 1,
      desc: 'Win an Outreach Hub a recruit on Grid Foundry power alone: no turbine, no panel, no ' +
            'battery, only the arrays you built.' },
    { id: 'allForecast', demo: false,  name: 'Read the Sky',  icon: 'forecast', reward: 1, goal: 1,
      desc: 'See every kind of weather coming, with one Forecast Mast warning for each.' },
    { id: 'soldCells',    name: 'Cashing Out',   icon: 'obCashOut',   reward: 1, goal: 1,
      desc: 'Sell both batteries and steel through one Trading Floor instead of feeding a Grid ' +
            'Foundry.' },

    




    { id: 'firstPressed', demo: false, name: 'First Facet',   icon: 'dpress', reward: 1, goal: 1,
      desc: 'Press your first diamond out of charcoal at a Diamond Press.' },

    




    { id: 'firstTonic', demo: false,   name: 'Second Wind',  icon: 'brewvat',    reward: 1, goal: 1,
      desc: 'Feed a Volunteer its first Field Tonic.' },
    { id: 'firstBlade', demo: false,   name: 'Fresh Blades', icon: 'bladeworks', reward: 1, goal: 1,
      desc: 'Feed a Wind Turbine its first Blade Kit.' },
    



    { id: 'firstGlazing', demo: false, name: 'First Light', icon: 'glazing',  reward: 1, goal: 1,
      desc: 'Feed a Solar Panel its first Glazing Kit.' },
    















    { id: 'acidDrum',     demo: false, name: 'Sealed and Stored', icon: 'acid', reward: 1, goal: 1,
      desc: 'Hold acid in a Fluid Tank.' },

    





    { id: 'openMire',   demo: false, name: 'Still Waters',  icon: 'pool',  reward: 1, goal: 1, loc: 'mirewater',
      desc: 'Open up Mirewater.' },
    { id: 'openBlack',  demo: false, name: 'Black Gold',    icon: 'slick', reward: 1, goal: 1, loc: 'blackmere',
      desc: 'Open up Blackmere.' },
    { id: 'openGlow',   demo: false, name: 'Into the Glow', icon: 'glow',  reward: 1, goal: 1, loc: 'glowmoor',
      desc: 'Open up Glowmoor.' },
    { id: 'clearPool',  demo: false, name: 'Clear Pool',    icon: 'obClearPool',  reward: 1, goal: 1, site: 'waterSite',
      desc: 'Bring a Polluted Pool all the way to 100%.' },
    { id: 'spillMopped', demo: false, name: 'Spill Mopped', icon: 'obMop', reward: 1, goal: 1, site: 'oilSite',
      desc: 'Bring an Oil Spill all the way to 100%.' },
    { id: 'fullCircle', demo: false, name: 'Full Circle',   icon: 'pump',  reward: 1, goal: 1,
      desc: 'Pour clean water back into a pool with a Water Pump.' },
    { id: 'clearSkies', demo: false, name: 'Clear Skies',   icon: 'aircleaner', reward: 1, goal: 1,
      desc: 'Have an Air Cleaner running in every place at once.' },
    { id: 'chargedAir', demo: false, name: 'Charged Air',   icon: 'etching', reward: 1, goal: 1,
      desc: 'Feed a Storm Turbine its first Advanced cell.' },
    { id: 'finePrint',  demo: false, name: 'Fine Print',    icon: 'circuit', reward: 1, goal: 1,
      desc: 'Make your first kilogram of microschemes.' },
    { id: 'glassGarden', demo: false, name: 'Glass Garden', icon: 'biodome', reward: 1, goal: 1,
      desc: 'Finish your first Biodome.' },
    { id: 'domeEverywhere', demo: false, name: 'A Dome Everywhere', icon: 'obThreeDomes', reward: 1, goal: 1,
      desc: 'Have a finished Biodome standing in every place at once.' },
    { id: 'splitAtom',  demo: false, name: 'Split the Atom', icon: 'reactor', reward: 1, goal: 1,
      desc: 'Start a Nuclear Reactor for the first time.' },
    

    { id: 'rainDance',  demo: false, name: 'Rain Dance',    icon: 'obRainDance', reward: 1, goal: 1,
      desc: 'Run Rally and Grove Rush together while rain falls on a working Tree Planter.' },
    { id: 'offPress',   demo: false, name: 'Off the Press', icon: 'printworks', reward: 1, goal: 1,
      desc: 'Print your first boost at a Print Works.' },
    { id: 'fullCatalogue', demo: false, name: 'Full Catalogue', icon: 'obCatalogue', reward: 1, goal: 0,
      desc: 'Print one of every boost a Print Works can make.' },

    





    { id: 'rareFind',    demo: false, name: 'Rare Find',       icon: 'obRareFind',   reward: 1, goal: 1,
      desc: 'Dig a rare, gold-bearing meteorite out completely.' },
    { id: 'longHaul',    demo: false, name: 'Long Haul',       icon: 'obTruck',    reward: 1, goal: 20,
      desc: 'Move 20 machines to another place in one move.' },
    { id: 'weatherStation', demo: false, name: 'Weather Station', icon: 'obAnemometer', reward: 1, goal: 1,
      desc: 'Have a fully charged Forecast Mast in every place that has weather.' },
    { id: 'printedStone', demo: false, name: 'Printed Stone',  icon: 'obPrintStone', reward: 1, goal: 1,
      desc: 'Print a diamond at a Print Works.' },
    { id: 'tripleStack', demo: false, name: 'Triple Stack',    icon: 'obTriple',     reward: 1, goal: 3,
      desc: 'Have three boosts running at the same time.' },
    { id: 'bottledBolt', demo: false, name: 'Lightning in a Bottle', icon: 'obBottle', reward: 1, goal: 1,
      desc: 'Fill a Strike Vault to the top.' },
    { id: 'greatArray',  demo: false, name: 'Great Array',     icon: 'obArrayGrid',    reward: 1, goal: 20,
      desc: 'Have one Grid Foundry making 20 KW/h with no boost running on it.' },
    { id: 'grassroots',  demo: false, name: 'Grassroots',      icon: 'obGrassroots', reward: 1, goal: 25,
      desc: 'Have one Outreach Hub putting out 25 WF/h of recruits with no boost running on it.' },
    { id: 'diamondMine', demo: false, name: 'Diamond Mine',    icon: 'obMineCart',   reward: 1, goal: 25,
      desc: 'Press 25 diamonds at Diamond Presses.' },
    { id: 'goldRush',    demo: false, name: 'Gold Rush',       icon: 'obNugget',     reward: 1, goal: 10,
      desc: 'Make 10 kg of gold.' },
    { id: 'reactorRow',  demo: false, name: 'Reactor Row',     icon: 'obTowers',  reward: 1, goal: 3,
      desc: 'Have three Nuclear Reactors running at the same time.' },
    { id: 'missionControl', demo: false, name: 'Mission Control', icon: 'obMission', reward: 1, goal: 5,
      desc: 'Launch 5 Skytrawlers.' },
    { id: 'fullCapacity', demo: false, name: 'Full Capacity',  icon: 'obGauge',  reward: 1, goal: 1,
      desc: 'Buy at least one level of every machine on the Capacity board.' },
    { id: 'strongVolunteer', demo: false, name: 'One Strong Pair of Hands', icon: 'player', reward: 1, goal: 50,
      desc: 'Have one Volunteer making 50 WF/h without Rally.' },
    { id: 'moneyMaster', demo: false, name: 'Money Master',    icon: 'obMoneyBag',    reward: 1, goal: 1,
      desc: 'Take every money skill to its top level.' },
    { id: 'allBoosts',   demo: false, name: 'Everything at Once', icon: 'obAllBoosts',  reward: 1, goal: 0,
      desc: 'Have every boost with a timer running together.' },
    { id: 'printingPress', demo: false, name: 'Printing Press', icon: 'obSheets', reward: 1, goal: 10,
      desc: 'Make 10 prints at Print Works.' },
    { id: 'worldReborn', demo: false, name: 'World Reborn',    icon: 'obReborn',    reward: 1, goal: 0,
      desc: 'Bring every place to its last stage of recovery.' },
    { id: 'nothingAnywhere', demo: false, name: 'Nothing Left Anywhere', icon: 'obNothingAll', reward: 1, goal: 0,
      desc: 'Strip every Trash Site in every place down to nothing.' },
    { id: 'glassCity',   demo: false, name: 'Glass City',      icon: 'obGlassCity',  reward: 1, goal: 10,
      desc: 'Finish 10 domes in one Biodome.' },
    { id: 'cleanTide',   demo: false, name: 'Clean Tide',      icon: 'obTide',     reward: 1, goal: 1000,
      desc: 'Put 1,000 kg of clean water back into pools.' },
    { id: 'crewRiver',   demo: false, name: 'River of Hands',  icon: 'obHandRiver',     reward: 1, goal: 1000,
      desc: 'Have 1,000 WF/h coming out of one Crew Junction.' },
    { id: 'powerRiver',  demo: false, name: 'Floodgate',       icon: 'obFloodgate',    reward: 1, goal: 2000,
      desc: 'Have 2,000 KW/h coming out of one Power Storage or Power Vault.' },
    { id: 'millionCI',   demo: false, name: 'Clean Million',   icon: 'obMillion',     reward: 1, goal: 1000000,
      desc: 'Reach 1,000,000 Clean Index earned in total.' },
    { id: 'allTrials',   demo: false, name: 'Trial by Fire',   icon: 'obTrophy',     reward: 1, goal: 0,
      desc: 'Finish every Trial.' },
    



    







    { id: 'allPowered', demo: false, off: true, name: 'Full Throttle', icon: 'turbine',
      reward: 3, goal: 5,
      desc: 'Feed five Volunteers and five Wind Turbines until every one of them is at ' +
            'double its own rate.' },
  ],

  








































  














  fullCircle: {
    enabled: true,
    siteMul: 5,          
    capMul: 2,           
    maxUses: 1,          
    rocks: true,         
    fixedToo: false,     
    armSec: 4,           
    

    swipeMul: 5,
    






    carryOn: false,
    carry: { outreachHub: 'recruits', gridFoundry: 'made' },
  },

  







  rocketFx: {
    enabled: true,
    



    style: 'v2',
    size: 70,             
    





    launchSec: 7.5,       
    igniteSec: 1.5,       
    rise: 1500,           
    landSec: 3.6,         
    touchAt: 0.56,        
    from: 950,            
    shake: 2.2,           
    smoke: { color: '200,204,210', perSec: 34, life: 2.2, size: 11, grow: 26 },
    dust: { color: '#c9bea8', count: 34, speed: 170, lift: 30, life: 1.1, size: 3.2 },
    


    sound: { launch: 'rocketLaunch', land: 'rocketLand' },
    



    atomic: { enabled: true, smoke: '150,215,165', sparksPerSec: 45,
              spark: { speed: 110, life: 0.8, size: 2.2 }, touchSparks: 22 },
    




    scrap: { enabled: false, delay: 0.35, sec: 5, fade: 0.9, side: 40, size: 1 },   
  },

  story: {
    enabled: true,

    




    ticker: { show: true, remember: 'save' },

    



    celebrate: true,
    celebrateSec: 4.2,
    






    cardV2: true,
    


    premise: true,

    


































    acts: [
      {
        
        id: 'act1', name: 'Deeper pays better', money: 50,
        steps: [
          { id: 'recycler', test: 'chain:recycler',
            text: 'Put a Recycler between the Cleaner and the Market, fed and emptied.',
            why: 'The same kilogram is worth more after a machine has touched it. That is ' +
                 'the whole economy in one wire.' },
          { id: 'turbine', test: 'node:windTurbine',
            text: 'Build a Wind Turbine and give the Recycler something to run on.',
            why: 'From here on a machine wants two different things at once, not one.' },
          { id: 'sorter', test: 'bothOut:weightSorter',
            text: 'Split recycled trash with a Weight Sorter and sell BOTH halves.',
            why: 'The cheap half is cheap on purpose. Starving the sorter is not a shortcut.' },
          { id: 'fiveVol', test: 'count:player:5',
            text: 'Put down a fifth Volunteer and hit the ceiling.',
            why: 'Everything that makes something out of nothing is capped. This is what ' +
                 'the Capacity shelf was for.' },
        ],
      },
      {
        


        id: 'act2', name: 'Five is not enough', money: 300,
        steps: [
          { id: 'hire', test: 'hired',
            text: 'Hire your first shift at a Hiring Post.',
            why: 'Labour can be rented by the minute instead of bought for ever.' },
          { id: 'battery', test: 'mixedBattery',
            text: 'Feed one Power Storage from two different kinds of generator.',
            why: 'The sun sets. A battery is what carries a line across the night.' },
          



          { id: 'split21', test: 'split21',
            text: 'Run a Power Splitter at 2 and 1, with power moving through it.',
            why: 'Those two boxes are a decision, and an even split is only one of the ' +
                 'answers.' },
          









          { id: 'halfSite', goal: 'halfSite',
            text: 'Strip one Trash Site down to half of what it held.',
            why: 'The ground is finite. That is a clock, not scenery.' },
          { id: 'staffed', test: 'staffed',
            text: 'Put a crew on a Trade Post or an Incinerator.',
            why: 'A till that empties itself. The button was never the point.' },
          { id: 'metal', goal: 'firstMetal',
            text: 'Pull your first metal out of heavy trash and sell it.',
            why: 'A material outside the trash economy: no burner takes it, no trash bonus ' +
                 'touches it.' },
          { id: 'recruit', test: 'recruit',
            text: 'Win your first permanent recruit at an Outreach Hub.',
            why: 'Workforce that never expires and pays no rent. It is also the first thing ' +
                 'your build cap cannot touch.' },
        ],
      },
      {
        




























        id: 'act3', name: 'The ground runs out', money: 800,
        steps: [
          




          { id: 'moveHub', test: 'moved:outreachHub:greenhaven',
            text: 'Carry an Outreach Hub over to Greenhaven. Move it rather than rebuilding ' +
                  'it.',
            why: 'Greenhaven opens on Clean Index alone. Moving costs nothing and every ' +
                 'recruit rides along; a hub built fresh over there starts again at zero.' },
          




          { id: 'fullSite', goal: 'drainSite',
            text: 'Strip one Trash Site all the way down to nothing.',
            why: 'The ground is finite and this is what the end of it looks like. The tip ' +
                 'stays where it is, empty, with its machines still standing on it.' },
          














          { id: 'drone', test: 'chain:droneCleaner',
            text: 'Set a Cleaner Drone digging: power in, trash out, no crew at all.',
            why: 'Energy can replace people on a tip. It is also the only digger that does ' +
                 'not care how many Volunteers your cap allows.' },
          { id: 'rubble', test: 'bothOut:rubbleSorter',
            text: 'Split heavy trash into glass and aggregate, both wired away.',
            why: 'The dross half of the Weight Sorter finally becomes something. Workforce ' +
                 'pulls toward glass and energy toward aggregate, and that is the dial.' },
          { id: 'hazard', test: 'chain:hazardPlant',
            text: 'Run a Hazard Plant: light trash in, hazardous waste out and sold.',
            why: 'The first half of a battery. Nothing burns it, so it is a market material, ' +
                 'and the Cell Assembler wants it later.' },
        ],
      },
      {
        




        



        id: 'act4', name: 'Scrap becomes a power station', money: 2000, gem: 1,
        steps: [
          { id: 'eddy', test: 'bothOut:eddySeparator',
            text: 'Split metal into aluminium and steel, both wired away.',
            why: 'The sorter trick again, two steps deeper, and deeper is where the money is.' },
          



          { id: 'grove', test: 'grove50',
            text: 'Take one Grove Plot to half full.',
            why: 'The first piece of the world that is coming back.' },
          { id: 'cells', goal: 'firstCells',
            text: 'Assemble your first kilogram of batteries.',
            why: 'The first thing in the game built out of two different branches at once.' },
          

          { id: 'array', test: 'array',
            text: 'Raise the first array at a Grid Foundry.',
            why: 'Rubbish just became a power station that never switches off. That is as ' +
                 'far as this build goes, and thank you for playing.',
            whyFull: 'Rubbish just became a power station that never switches off.' },
        ],
      },

      











      {
        id: 'act5', name: 'The air comes next', money: 3000, demo: false,
        steps: [
          { id: 'airHome', test: 'working:airCleaner:home',
            text: 'Build an Air Cleaner in the Wastelands and get it cleaning the air.',
            why: 'The first thing you clean that you cannot sweep. Power in, Clean Index out.' },
          { id: 'robotCell', test: 'cellFull:robot',
            text: 'Fill a Robot\'s power cell to the top.',
            why: 'A Robot works off its stored charge, so a full cell keeps it going when ' +
                 'the power dips.' },
          { id: 'mastWarn', test: 'forecast',
            text: 'Get a warning from a Forecast Mast before the weather turns.',
            why: 'Weather stops being a surprise once you pay to watch the sky.' },
          { id: 'pyrolysis', test: 'chain:pyrolysisPlant',
            text: 'Run a Pyrolysis Plant: plastic in, oil out and wired away.',
            why: 'Plastic was the cheap half. Heat without air makes it something much dearer.' },
          { id: 'charLine', test: 'line:rubbleSorter>timberReclaimer>charKiln',
            text: 'Build one chain: Rubble Sorter to Timber Reclaimer to Char Kiln.',
            why: 'Rubble becomes timber, and timber becomes nearly pure carbon.' },
          


          { id: 'airMax', test: 'atMax:airCleaner', skills: ['widerIntakes', 'fineFilters'],
            text: 'Run an Air Cleaner at its full limit, with Wider Intakes and Fine Filters ' +
                  'both bought to the top.',
            why: 'Money skills are how a machine grows past what it was built for.' },
        ],
      },
      {
        id: 'act6', name: 'Still waters', money: 5000, demo: false,
        steps: [
          { id: 'pumpMire', test: 'chainAt:waterPump:mirewater',
            text: 'Put a Water Pump on a Mirewater pool and wire its dirty water out.',
            why: 'Power pulls the dirt out of the water.' },
          { id: 'cleanWater', test: 'bothOut:waterCleaner',
            text: 'Run a Water Cleaner with both of its outputs wired away.',
            why: 'Charcoal holds the dirt, and what runs through is clean.' },
          { id: 'oilPyro', test: 'fedBy:oilGenerator:pyrolysisPlant',
            text: 'Run an Oil Generator on oil from your own Pyrolysis Plant.',
            why: 'The one place Clean Index is spent. Power this strong costs the score.' },
          { id: 'fertLoad', test: 'loaded:treePlanter:fertilizerPlant',
            text: 'Wire a Fertilizer Plant into a Tree Planter and give it one load.',
            why: 'Every load makes it grow faster, for ever.' },
          { id: 'tankCarry', test: 'carriedFull:fluidTank',
            text: 'Carry a Fluid Tank with fluid in it to another place.',
            why: 'A wire only reaches what you can see. A tank is how a fluid travels.' },
          { id: 'coalStore', test: 'fullInto:trashJunction:coal:waterCleaner',
            text: 'Fill a Salvage Store to the top with charcoal and wire it into a Water ' +
                  'Cleaner.',
            why: 'A full store is a reserve. The cleaner keeps working when the kiln stops.' },
        ],
      },
      {
        

        id: 'act7', name: 'Everything can be fed', money: 8000, demo: false,
        steps: [
          { id: 'rockLead', test: 'outFlow:oreDigger:lead',
            text: 'Break a fallen meteorite with an Ore Digger and wire its lead away.',
            why: 'Lead only comes from the sky.' },
          { id: 'fibreKiln', test: 'fedBy:charKiln:fibrePress',
            text: 'Wire a Fibre Press into a Char Kiln.',
            why: 'Plant fibre makes timber too, and the kiln does not care where it came from.' },
          { id: 'kilnShare', test: 'feedsBoth:charKiln:diamondPress:waterCleaner',
            text: 'Feed one Char Kiln\'s charcoal to a Diamond Press and a Water Cleaner at ' +
                  'the same time, both working.',
            why: 'One kiln, two hungry machines. You decide who gets how much.' },
          { id: 'bladeKits', test: 'chain:bladeWorks',
            text: 'Run a Blade Works with its kits wired away.',
            why: 'Plastic and aluminium turned into a part for an old machine.' },
          { id: 'tonicBrew', test: 'chain:brewVat',
            text: 'Run a Brew Vat with its tonic wired away.',
            why: 'Waste turned into something a person can drink.' },
          { id: 'threeFed', test: 'takingAll:player.tonic,windTurbine.blade,treePlanter.fert',
            text: 'Feed a Volunteer, a Wind Turbine and a Tree Planter at the same time, each ' +
                  'from its own maker.',
            why: 'Three lines running at once, each feeding a machine you built hours ago.' },
        ],
      },
      {
        id: 'act8', name: 'Oil, lead and acid', money: 12000, demo: false,
        steps: [
          { id: 'oilSplit', test: 'bothOut:oilSeparator',
            text: 'Split oily water into oil and water, both wired away.',
            why: 'A spill is worth money once it comes apart.' },
          { id: 'rareGold', test: 'outFlow:oreDigger:gold',
            text: 'Break a rare meteorite with an Ore Digger and wire its gold away.',
            why: 'Gold only falls in the rare rocks, and there is very little of it.' },
          { id: 'panelDouble', test: 'kitMul:solarPanel:2',
            text: 'Double one Solar Panel\'s power with Glazing Kits.',
            why: 'Each load adds power for good, and each one costs a little more than the last.' },
          { id: 'acidLoop', test: 'fedBy:acidWorks:waterCleaner:hazard',
            text: 'Make acid out of the hazardous waste your own Water Cleaner throws off.',
            why: 'The dirt you took out of the water becomes a chemical you need.' },
          { id: 'acidShare', test: 'acidSplit',
            text: 'Use a Fluid Splitter to share one Acid Works between an Etching Works and a ' +
                  'Fluid Tank.',
            why: 'Acid for now and acid for later. The split is your call.' },
          { id: 'oilTank', test: 'fullInto:fluidTank:oil:oilGenerator',
            text: 'Fill a Fluid Tank to the top with oil and wire it into an Oil Generator.',
            why: 'Stored oil is power you can burn later, when you need it.' },
        ],
      },
      {
        id: 'act9', name: 'Gold under glass', money: 15000, demo: false,
        steps: [
          { id: 'goldLeach', test: 'bothOut:leachingPlant',
            text: 'Split scrap into gold and slag at a Leaching Plant, both wired away.',
            why: 'Almost all of it is slag. That is what gold really costs.' },
          { id: 'chips', test: 'chain:circuitWorks',
            text: 'Run a Circuit Works with its microschemes wired away.',
            why: 'Gold, glass and acid in one small part.' },
          { id: 'robotKit', test: 'kitLoads:robot:1',
            text: 'Feed a Robot a Solar Kit.',
            why: 'A Robot that pays for part of its own power while the sun is up.' },
          { id: 'prioDome', test: 'prioDome',
            text: 'Staff a Biodome from the priority side of a Priority Crew Splitter.',
            why: 'The dome gets its crew first. Everything else gets what is left.' },
          
          { id: 'domes100', test: 'domesCi:100',
            text: 'Have your Biodomes make more than 100 Clean Index an hour together.',
            why: 'Every dome keeps paying for ever. Enough of them is a steady income.' },
        ],
      },
      {
        id: 'act10', name: 'The glowing ground', money: 20000, gem: 1, demo: false,
        steps: [
          
          { id: 'wasteDig', test: 'busy:wasteCleaner',
            text: 'Get a Waste Cleaner digging. Give its crew suits from a Gear Works, or send ' +
                  'Robots, who need none.',
            why: 'People need shielding here. Machines do not.' },
          { id: 'bury', test: 'fedBy:repository:wasteCleaner',
            text: 'Dig nuclear waste and bury it in a Deep Repository.',
            why: 'Some rubbish cannot be cleaned, only sealed away.' },
          { id: 'bankGold', test: 'fedBy:bank:leachingPlant',
            text: 'Wire gold from a Leaching Plant into a Bank.',
            why: 'Money that grows while it sits there.' },
          { id: 'reactorRepo', test: 'fedBy:repository:reactor:kw',
            text: 'Power a Deep Repository from a Nuclear Reactor.',
            why: 'The waste you dug up now pays for burying the rest.' },
          { id: 'rocketMetal', test: 'rocketMetal',
            text: 'Launch a Skytrawler and wire the metal it brings back into a machine.',
            why: 'Some of the scrap was never on the ground.' },
          { id: 'printLine', test: 'printLine',
            text: 'Run Blade Works, Paper Mill and Print Works as one chain, with a print made.',
            why: 'Blades cut the pulp, the pulp makes paper, and paper makes prints.' },
          






          { id: 'cleanFive', test: 'totalCI:5000000', noRescue: true,
            text: 'Earn 5,000,000 Clean Index in total.',
            why: 'The ground alone will not get you there. Domes you built and scrap pulled ' +
                 'out of orbit will.' },
        ],
      },
    ],
  },

  

















  demo: {
    enabled: true,
    lastCi: 'gridForging',
    















    followNote: true,
  },

  
  resources: {
    wf:     { name: 'Workforce',      unit: 'WF', rate: 'WF/h', color: '#4a9fe0', flow: 'rate' },
    energy: { name: 'Energy',         unit: 'KW', rate: 'KW/h', color: '#e8b04b', flow: 'rate' },
    
    trash:  { name: 'Trash',          unit: 'kg', rate: 'kg/h', color: '#5ecb8a', flow: 'material' },
    rtrash: { name: 'Recycled trash', unit: 'kg', rate: 'kg/h', color: '#5ecb8a', flow: 'material' },
    light:  { name: 'Light trash',    unit: 'kg', rate: 'kg/h', color: '#5ecb8a', flow: 'material' },
    heavy:  { name: 'Heavy trash',    unit: 'kg', rate: 'kg/h', color: '#5ecb8a', flow: 'material' },
    
    
    metal:  { name: 'Metal',          unit: 'kg', rate: 'kg/h', color: '#aebfd0', flow: 'material' },
    



    alu:    { name: 'Aluminium',      unit: 'kg', rate: 'kg/h', color: '#cddce8', flow: 'material' },
    steel:  { name: 'Steel',          unit: 'kg', rate: 'kg/h', color: '#8fa1b3', flow: 'material' },
    







    lead:   { name: 'Lead',           unit: 'kg', rate: 'kg/h', color: '#6b7a99', flow: 'material' },
    

    nukeWaste: { name: 'Nuclear waste', unit: 'kg', rate: 'kg/h', color: '#c6f04a', flow: 'material',
                 radioactive: true },   
    gear:      { name: 'Hazmat Gear',   unit: 'kg', rate: 'kg/h', color: '#e89a3c', flow: 'material' },
    
    rod:       { name: 'Uranium Rods',  unit: 'kg', rate: 'kg/h', color: '#f0d24a', flow: 'material',
                 radioactive: true },
    

    pluto:     { name: 'Plutonium',     unit: 'kg', rate: 'kg/h', color: '#6dffa8', flow: 'material',
                 hideUntil: 'fleetStorm', radioactive: true },
    nfuel:     { name: 'Plutonium Pellets', unit: 'kg', rate: 'kg/h', color: '#3fe07a', flow: 'material',
                 hideUntil: 'fleetStorm', radioactive: true },
    
    turbofuel: { name: 'Turbofuel',     unit: 'kg', rate: 'kg/h', color: '#ff9f5a', flow: 'material' },
    


    hazard: { name: 'Hazardous waste', unit: 'kg', rate: 'kg/h', color: '#b7e04a', flow: 'material' },
    cell:   { name: 'Batteries',      unit: 'kg', rate: 'kg/h', color: '#88c22e', flow: 'material' },
    





    plastic: { name: 'Plastic',        unit: 'kg', rate: 'kg/h', color: '#4fc3e8', flow: 'material' },
    organic: { name: 'Organic waste',  unit: 'kg', rate: 'kg/h', color: '#b98a4a', flow: 'material' },
    
    fert:    { name: 'Fertilizer',     unit: 'kg', rate: 'kg/h', color: '#b98a4a', flow: 'material' },
    



    



    oil:     { name: 'Oil',  unit: 'kg', rate: 'kg/h', color: '#c9762b', flow: 'material' },
    


    glass:     { name: 'Glass',      unit: 'kg', rate: 'kg/h', color: '#9fd8d0', flow: 'material' },
    aggregate: { name: 'Aggregate',  unit: 'kg', rate: 'kg/h', color: '#b9a487', flow: 'material' },
    




    wood:      { name: 'Scrap Timber', unit: 'kg', rate: 'kg/h', color: '#a9793f', flow: 'material' },
    coal:      { name: 'Charcoal',     unit: 'kg', rate: 'kg/h', color: '#5c5750', flow: 'material' },
    


    paper:     { name: 'Paper',        unit: 'kg', rate: 'kg/h', color: '#d8cfb8', flow: 'material' },
    




    





    dirtyWater:{ name: 'Polluted Water', unit: 'kg', rate: 'kg/h', color: '#6f7f52', flow: 'material' },
    water:     { name: 'Clean Water', unit: 'kg', rate: 'kg/h', color: '#4fc3e8', flow: 'material' },
    











    oilyWater: { name: 'Oily Water', unit: 'kg', rate: 'kg/h', color: '#8a6b3f', flow: 'material' },
    







    blade:     { name: 'Blade Kit',    unit: 'kg', rate: 'kg/h', color: '#e8b04b', flow: 'material' },
    tonic:     { name: 'Field Tonic',  unit: 'kg', rate: 'kg/h', color: '#4a9fe0', flow: 'material' },
    


    glazing:   { name: 'Glazing Kit',  unit: 'kg', rate: 'kg/h', color: '#ffd76a', flow: 'material' },
    


    advCell:   { name: 'Advanced Cell', unit: 'kg', rate: 'kg/h', color: '#8fe3c4', flow: 'material' },
    panel:     { name: 'Solar Kit', unit: 'kg', rate: 'kg/h', color: '#4a9fe0', flow: 'material' },
    



    acid:      { name: 'Acid',         unit: 'kg', rate: 'kg/h', color: '#b6e02f', flow: 'material' },
    gold:      { name: 'Gold',         unit: 'kg', rate: 'kg/h', color: '#e8c14a', flow: 'material' },
    slag:      { name: 'Slag',         unit: 'kg', rate: 'kg/h', color: '#6b6257', flow: 'material' },
    chip:      { name: 'Microschemes', unit: 'kg', rate: 'kg/h', color: '#7fd4b0', flow: 'material' },
  },

  






  



























  




















































  gradePricing: {
    enabled: true,

    


    anchor: { res: 'trash', value: 1 },

    





























    depthGrowth: 1.18,

    

    wfPerKw: null,

    role: { sell: 1.00, ingredient: 0.85 },

    








    dross: { heavy: 0.25, organic: 0.40, steel: 0.55 },
    


































    rare: { lead: 6 },

    

    rounding: [[3, 0.05], [20, 0.25], [200, 1], [Infinity, 5]],
  },

  




























































  rebalance: {
    enabled: true,

    












































    







    dross: { heavy: 0.33, organic: 0.44, steel: 0.44 },

    




    nodes: {
      fineSorter: { wfPerKg: 3 },        

      









































































    },

    



























    skills: {
      willingHands: { effect: 0.15 },    
    },
  },

  



















  asteroid: {
    enabled: true,
    






















    locs: [
      { loc: 'mirewater', chance: 0.015, kg: 100 },   
      







      { loc: 'blackmere', chance: 0.015, kg: 100 },   
      
      { loc: 'glowmoor', chance: 0.015, kg: 100,
        variants: [],     
        



        after: { goal: 'fleetStorm', variants: [
          { id: 'pluto', chance: 0.5, kg: 30, mix: { pluto: 1 }, fill: 'pluto', leadSkill: false,
            radiation: {
              color: '109,255,168',
              glow:  { on: true, sec: 2.6, min: 0.08, max: 0.26, edge: 0.45 },
              motes: { on: true, count: 10, riseSec: 4.0, size: 2.2, alpha: 0.8 },
              sparks: { on: false },
            } },
        ] } },   
    ],
    


    maxDown: 3,
    


















    intro: {
      enabled: true,
      




      viewInset: { x: 0.06, top: 0.14, bottom: 0.30 },
      




      minStaySec: 3,
      locs: {
        mirewater: { afterSec: 600, variant: null },
        blackmere: { afterSec: 6,   variant: 'rare' },
        glowmoor:  { afterSec: 6,   variant: null },   
      },
    },
    









    rareHold: true,
    



    rockPorts: true,
    






    mix: { lead: 0.10, alu: 0.30 },
    spread: { lead: 0.03, alu: 0.06 },
    






























    variants: [
      {
        id: 'rare', chance: 0.10, kg: 50,
        mix: { gold: 0.01, lead: 0.40 },
        spread: { lead: 0.05 },
        fill: 'alu',
        


        leadSkill: false,
      },
    ],
    









    spawn: { edgePad: 80, siteGap: 60, machineGap: 120, tries: 60,
      

      wide: true, reach: 350,
      

      beaconNeedsGround: false },
    


    pullOneWhistle: true,
    














    shine: {
      enabled: true,
      






      color: '255,247,214',   
      




      sweep: false,
      sec: 3.4,               
      sweepSec: 0.9,          
      width: 0.30,            
      alpha: 0.32,
      

      


      glints: 5,
      glintSize: 12,          
      glintAlpha: 0.72,
      glintGlow: 1.8,         
      glowAlpha: 0.35,        
      glintWaist: 0.16,   
      glintSizeVar: 0.35, 
      







      glintInner: 0.30,
      glintOuter: 0.94,
    },
    


    notice: true,
    



    pullSec: 4,
    









    hitDelaySec: 1.4,
    






















    fall: {
      enabled: true,
      
      sec: null,
      

      from: 1000, tilt: 0.42,
      

      




      streak: { len: 120, w: 6, head: 16, color: '#ffe6b8', glow: '#ff8a3d' },
      
      flash: { sec: 0.5, r: 210, color: '255,206,140' },
      

      dust: { count: 30, speed: 165, lift: 55, life: 1.15, size: 3.4, color: '#cbbb96' },
      



      settleSec: 0.55,
    },
  },

  gradeValue: {
    trash: 1, rtrash: 2, light: 6, heavy: 2 / 3, metal: 6,
    alu: 22, steel: 6, hazard: 36, cell: 160,
    


    lead: 60,
    
    plastic: 18, organic: 3,
    
    fert: 600,
    


    oil: 60,
    glass: 6, aggregate: 6,
    


    



    wood: 52, coal: 141,
    


    


    blade: 24, tonic: 21,
    


    glazing: 65,
    acid: 172,
    






    gold: 1,
    slag: 8,
    chip: 1,
    





    advCell: 114,
    

    panel: 151,
    



    gear: 1,
    
    turbofuel: 1,
    





    paper: 1,
  },

  


  categories: [
    { id: 'workforce',   name: 'Workforce',   sub: 'WF/h', color: '#4a9fe0' },
    { id: 'energy',      name: 'Energy',      sub: 'KW/h', color: '#e8b04b' },
    { id: 'trash',       name: 'Trash',       sub: 'kg/h', color: '#5ecb8a' },
    { id: 'money',       name: 'Money',       sub: '$/h',  color: '#b478e8' },
    { id: 'ci',          name: 'Clean Index', sub: 'CI/h', color: '#62d4e3' },
    { id: 'manufacture', name: 'Manufacture', sub: 'kg/h', color: '#aebfd0' },
    










    { id: 'fluids',      name: 'Fluids',      sub: 'kg/h', color: '#4fc3e8' },
    






    



    { id: 'special',     name: 'Specialist',  color: '#ff7eb6' },
    








    { id: 'trials',      name: 'Trials',      color: '#7ee0c0' },
  ],

  










  capShop: {
    perLevel: 1,
    maxLevel: 5,
    currency: 'diamond',
    




    costs: [15, 30, 45, 60, 75],

    













    










    costsBy: {
      player:      [10, 20, 30, 40, 50],
      windTurbine: [10, 20, 30, 40, 50],
      outreachHub: [20, 30, 40, 50, 60],
      gridFoundry: [20, 30, 40, 50, 60],   
    },
  },

  






















  relocate: {
    enabled: true,
    








    carryOnSite: true,
  },

  




  cardWidth: 220,

  nodeTypes: {
    trashSite: {
      id: 'trashSite', name: 'Trash Site', kind: 'site', icon: 'site',
      desc: 'Holds two Cleaners, and runs dry as you strip it.',
      color: '#8a9a6b',
      







      w: 260, slotGap: 16, slotMargin: 24,
      slots: 2,
      reserve: 500,
      deplete: true,
      





      hand: 'sweep',
      





      vanishWhenEmpty: false, fadeSec: 2.2,
      buildable: false,
      




      skin: {
        pit:     'rgba(16,21,17,0.72)',
        fillTop: 'rgba(150,170,105,0.30)', fillBot: 'rgba(96,112,64,0.16)',
        band:    'rgba(205,225,150,',      surface: 'rgba(190,214,140,0.42)',
        mark:    'rgba(190,214,140,0.10)', markIcon: 'site',
        edge:    '168,190,120',            edge2:   '190,214,140',
        chipIcon: '#bcd68c', chipName: '#c9dfa2', chipVal: '#e6f2cc',
        slotLabel: 'MACHINE SLOT',
      },
    },

    



    treeSite: {
      id: 'treeSite', name: 'Grove Plot', kind: 'site', icon: 'tree',
      desc: 'Two Tree Planters fit, and it greens over as they work. Your bare hands work here too.',
      color: '#5ecb8a',
      w: 260, slotGap: 16, slotMargin: 24,
      slots: 2,
      grow: true,
      


      capacity: 3000,          
      




      readout: 'ci',
      




      hand: 'plant',
      buildable: false,
      skin: {
        pit:     'rgba(14,24,18,0.72)',
        fillTop: 'rgba(94,203,138,0.34)',  fillBot: 'rgba(46,120,80,0.18)',
        band:    'rgba(150,245,190,',      surface: 'rgba(140,240,180,0.46)',
        mark:    'rgba(140,240,180,0.09)', markIcon: 'tree',
        edge:    '94,203,138',             edge2:   '140,240,180',
        chipIcon: '#8ce8b4', chipName: '#a8ecc6', chipVal: '#dbf7e6',
        




        slotLabel: 'GROVE SLOT',
      },
    },

    
















    waterSite: {
      id: 'waterSite', name: 'Polluted Pool', kind: 'site', icon: 'pool',
      desc: 'Standing runoff. Holds two Water Pumps, and comes back as clean water is put ' +
              'into it. Bare hands are no use here.',
      color: '#8fae4a',
      w: 260, slotGap: 16, slotMargin: 24,
      slots: 2,
      grow: true,
      





      volume: 500,
      


      water: 'dirtyWater',
      



      












      





















      capacity: 38000,         
      readout: 'ciPct',
      buildable: false,
      skin: {
        pit:     'rgba(16,20,10,0.72)',
        fillTop: 'rgba(126,150,58,0.40)',  fillBot: 'rgba(62,82,34,0.24)',
        band:    'rgba(170,196,96,',       surface: 'rgba(176,200,104,0.46)',
        mark:    'rgba(170,196,96,0.09)',  markIcon: 'pool',
        edge:    '138,158,74',             edge2:   '176,200,104',
        chipIcon: '#b6cc6a', chipName: '#c6d891', chipVal: '#e4eec4',
        slotLabel: 'PUMP SLOT',
        

        clean: {
          pit:     'rgba(10,18,26,0.72)',
          fillTop: 'rgba(118,204,240,0.40)', fillBot: 'rgba(38,106,150,0.24)',
          band:    'rgba(170,228,250,',      surface: 'rgba(176,230,250,0.46)',
          mark:    'rgba(170,228,250,0.09)',
          edge:    '92,170,205',             edge2:   '176,230,250',
          chipIcon: '#7fd0ea', chipName: '#a6e0f2', chipVal: '#dcf3fb',
        },
      },
    },

    




















    oilSite: {
      id: 'oilSite', name: 'Oil Spill', kind: 'site', icon: 'slick',
      desc: 'Crude spread thin over standing water. Holds two Water Pumps, and comes back ' +
              'as clean water is put into it. Bare hands are no use here.',
      color: '#a8853f',
      w: 260, slotGap: 16, slotMargin: 24,
      slots: 2,
      grow: true,
      













      











      














      volume: 600,
      water: 'oilyWater',      
      capacity: 90000,         
      readout: 'ciPct',
      buildable: false,
      skin: {
        pit:     'rgba(20,15,8,0.76)',
        fillTop: 'rgba(138,107,63,0.40)',  fillBot: 'rgba(58,44,26,0.26)',
        band:    'rgba(190,156,96,',       surface: 'rgba(198,166,108,0.46)',
        mark:    'rgba(190,156,96,0.09)',  markIcon: 'slick',
        edge:    '150,118,70',             edge2:   '198,166,108',
        chipIcon: '#c8a56a', chipName: '#d6bd92', chipVal: '#efe2c6',
        


        slotLabel: 'PUMP SLOT',
        
        clean: {
          pit:     'rgba(10,18,26,0.72)',
          fillTop: 'rgba(118,204,240,0.40)', fillBot: 'rgba(38,106,150,0.24)',
          band:    'rgba(170,228,250,',      surface: 'rgba(176,230,250,0.46)',
          mark:    'rgba(170,228,250,0.09)',
          edge:    '92,170,205',             edge2:   '176,230,250',
          chipIcon: '#7fd0ea', chipName: '#a6e0f2', chipVal: '#dcf3fb',
        },
      },
    },

    






























    meteorite: {
      id: 'meteorite', name: 'Meteorite', kind: 'site', icon: 'meteor',
      desc: 'A metal-rich rock, still warm from the fall. One Ore Digger works it, and once ' +
              'it is empty the crater closes over.',
      color: '#9a8f7d',
      w: 260, slotGap: 16, slotMargin: 24,
      slots: 1,
      

      reserve: 100,
      deplete: true,
      vanishWhenEmpty: true, fadeSec: 1.6,
      
      revive: false,
      countsDrained: false,
      buildable: false,
      skin: {
        pit:     'rgba(14,12,10,0.78)',
        fillTop: 'rgba(154,143,125,0.34)', fillBot: 'rgba(84,76,64,0.18)',
        band:    'rgba(214,198,168,',      surface: 'rgba(206,192,164,0.44)',
        mark:    'rgba(206,192,164,0.10)', markIcon: 'meteor',
        edge:    '176,162,136',            edge2:   '214,198,168',
        chipIcon: '#cbbb96', chipName: '#d8caa8', chipVal: '#f0e7cf',
        slotLabel: 'DIGGER SLOT',
      },
    },

    



    wasteSite: {
      id: 'wasteSite', name: 'Nuclear Waste Site', kind: 'site', icon: 'radsite',
      desc: 'Holds three machines, and runs dry as you dig it.',
      color: '#b9e04a',
      w: 300, slotGap: 16, slotMargin: 24,
      slots: 3,
      


      reserve: 1600,
      deplete: true,
      vanishWhenEmpty: false, fadeSec: 2.2,
      buildable: false,
      
      handSound: 'geiger',
      


      handSoundIdleOnly: true,
      








      radiation: {
        color: '214,246,120',
        glow:    { on: true, sec: 3.2, min: 0.06, max: 0.22, edge: 0.45 },
        motes:   { on: true, count: 14, riseSec: 4.5, size: 2.2, alpha: 0.75 },
        
        sparks:  { on: false, perSec: 1.4, sec: 0.35 },
        
      },
      skin: {
        pit:     'rgba(14,18,8,0.78)',
        fillTop: 'rgba(185,224,74,0.32)',  fillBot: 'rgba(98,122,38,0.18)',
        band:    'rgba(214,246,120,',      surface: 'rgba(206,240,110,0.46)',
        mark:    'rgba(206,240,110,0.10)', markIcon: 'radsite',
        edge:    '170,206,78',             edge2:   '214,246,120',
        chipIcon: '#cfee7a', chipName: '#dcf29c', chipVal: '#f0fbd2',
        slotLabel: 'MACHINE SLOT',
      },
    },

    



















































    
    player: {
      id: 'player', name: 'Volunteer', kind: 'machine', icon: 'player', category: 'workforce',
      desc: 'A pair of hands, for ever.',
      
      descMore: 'Wire a Brew Vat into one and every kilogram of Field Tonic it drinks ' +
                'makes it faster, for good.',
      descNeeds: 'brewVat',
      color: '#4a9fe0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: { base: 5, growth: 1.5, freeStock: 1, currency: 'money' },
      cap: 5,                        
      ports: {
        
        in: [{ id: 'tonic', res: 'tonic', accepts: ['tonic'], label: 'Field tonic',
               requires: 'brewing' }],
        out: [{ id: 'wf', res: 'wf', label: 'Workforce' }],
      },
      wfRate: 1,
      


      buffer: 12, intakeRate: Infinity,
      

      powerUp: { res: 'tonic', port: 'tonic', kg: 1, growth: 0.2, boost: 0.25,
                 stat: 'wfRate', boostMax: null },
    },

    


































    foreman: {
      id: 'foreman', name: 'Foreman', kind: 'machine', icon: 'foreman', category: 'trials',
      desc: 'A crew boss who works like four Volunteers. Every upgrade you buy for ' +
            'them reaches him four times over.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      
      trial: 'bigHire',
      
      
      demo: false,
      cap: 1, capFixed: true,        
      ports: { in: [], out: [{ id: 'wf', res: 'wf', label: 'Workforce' }] },
      
      wfMult: 4,
    },

    












    gemCollector: {
      id: 'gemCollector', name: 'Diamond Collector', kind: 'machine', icon: 'gemarm',
      category: 'trials',
      desc: 'A jointed arm that reaches out, grabs diamonds lying nearby and drops them in ' +
            'its tray.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      trial: 'fiveSuns',
      demo: false,
      capPerLoc: 1,
      ports: { in: [{ id: 'wf', res: 'wf', label: 'Workforce' }], out: [] },
      bank: 150,               
      bankRes: 'wf',           
      intakeRate: Infinity,
      






      gemArm: { perGem: 15, reachSec: 1.2, perThousand: 1.0 },
      collect: { cur: 'diamond', cap: 10, label: 'COLLECT', holdLabel: 'Till' },
    },

    

















    hiringAgency: {
      id: 'hiringAgency', name: 'Hiring Agency', kind: 'machine', icon: 'agency',
      category: 'trials',
      desc: 'Keeps nearby hiring offices staffed, signing hands on as soon as there is room.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      trial: 'bankGold',
      demo: false,
      cap: 3, capFixed: true,
      cardW: 180,
      ports: { in: [], out: [] },
      autoHire: { snapRange: 170, gap: 16, budgetCap: 2, hands: 10, sec: 3600 },
    },

    































    strikeVault: {
      id: 'strikeVault', name: 'Strike Vault', kind: 'machine', icon: 'strikevault',
      category: 'trials',
      flippable: true,
      desc: 'A mast and a deep earth rod with a bank of cells at the bottom of it. ' +
            'A strike goes down the rod and the cells take the charge instead of the ground.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      trial: 'boltBlocked',          
      demo: false,                   
      cap: 1, capFixed: true,        
      
      
      weatherOnly: 'No weather falls here',   
      ports: {
        in: [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' }],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      store: 160,                    
      idleDrain: 0.1,                
      


      strikeCharge: 80,              
      strikeEvent: 'lightning',      
    },

    




























    clearingHouse: {
      id: 'clearingHouse', name: 'Clearing House', kind: 'machine', icon: 'clearing',
      category: 'trials',
      desc: 'Two wires are sold and the third is burned. Each side keeps its own till, ' +
            'and one crew clears both.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      trial: 'oneCleaner',           
      demo: false,                   
      












      cap: 3, capFixed: true,        
      ports: {
        in: [
          { id: 'in', res: 'trash', accepts: ALL_GRADES.slice(), label: 'Salvage A' },
          { id: 'in2', res: 'trash', accepts: ALL_GRADES.slice(), label: 'Salvage B' },
          

          { id: 'burn', res: 'trash', accepts: ['trash','rtrash','light','heavy'],
            label: 'Trash', mode: 'burn' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Money', cur: 'money' }, { label: 'Clean Index', cur: 'ci' }],
      collect:  { cur: 'money', cap: 75,   label: 'COLLECT', holdLabel: 'Till' },
      
      collectB: { cur: 'ci',    cap: 37.5, label: 'BURN',    holdLabel: 'Unburned' },
      valueGroup: 'market',          
      valueGroupB: 'landfill',       
      autoCollect: [{ port: 'wf', perUnit: 2 }],
      







      buffer: 10, bufferB: 8, intakeRate: Infinity, processRate: Infinity,
    },

    





















































    pavingTrain: {
      id: 'pavingTrain', name: 'Paving Train', kind: 'machine', icon: 'paver',
      category: 'trials',
      desc: 'Heats crushed stone, coats it with oil until it binds, and lays it hot in ' +
            'a strip that is rolled flat behind the machine.',
      descMore: 'Every stretch it finishes reaches further out, so another crew walks ' +
                'in along it and the poles follow the verge.',
      

      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      trial: 'forgeCycle',           
      

      doneName: 'Paved Road',
      demo: false,                   
      cap: 1, capFixed: true,        
      ports: {
        in: [
          { id: 'oil', res: 'oil', accepts: ['oil'], label: 'Oil' },
          { id: 'aggregate', res: 'aggregate', accepts: ['aggregate'], label: 'Aggregate' },
        ],
        out: [
          { id: 'kw', res: 'energy', label: 'Energy' },
          { id: 'wf', res: 'wf', label: 'Workforce' },
        ],
      },
      recipe: {
        inputs: { oil: 9, aggregate: 26 },   
        


        growth: { oil: 0, aggregate: 0 },
        power: 'windTurbine',        
        crew: 'player',              
        


        maxMade: 10,
      },
      buffer: 26, intakeRate: Infinity,
    },

    windTurbine: {
      id: 'windTurbine', name: 'Wind Turbine', kind: 'machine', icon: 'turbine', category: 'energy',
      desc: 'Wind pushes the blades round, and the shaft behind them turns a generator.',
      descMore: 'Wire a Blade Works into one and every kilogram of Blade Kit it takes ' +
                'makes it spin faster, for good.',
      descNeeds: 'bladeWorks',
      color: '#e8b04b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: { base: 8, growth: 1.5, freeStock: 1, currency: 'money' },
      cap: 5,                        
      ports: {
        in: [{ id: 'blade', res: 'blade', accepts: ['blade'], label: 'Blade kit',
               requires: 'bladeFitting' }],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      energyRate: 1,
      buffer: 12, intakeRate: Infinity,
      



























      powerUp: { res: 'blade', port: 'blade', kg: 1, growth: 0.3, boost: 0.25,
                 stat: 'energyRate', boostMax: null },
    },

    solarPanel: {
      id: 'solarPanel', name: 'Solar Panel', kind: 'machine', icon: 'solar', category: 'energy',
      desc: 'Cells turn daylight straight into current. They make nothing at all after dark.',
      descMore: 'Wire a Glazing Works into one and every kilogram of Glazing Kit it ' +
                'takes makes it stronger, for good.',
      descNeeds: 'glazingWorks',
      color: '#f0c04a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: { base: 20, growth: 1.5, freeStock: 1, currency: 'money' },
      cap: 5,                        
      ports: {
        in: [{ id: 'glazing', res: 'glazing', accepts: ['glazing'], label: 'Glazing kit',
               requires: 'glazing' }],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      energyRate: 4,
      















      buffer: 12, intakeRate: Infinity,
      









      duty: { onSec: 600, offSec: 240, startOnFirst: true },
      






      powerUp: { res: 'glazing', port: 'glazing', kg: 1, growth: 0.3, boost: 0.25,
                 stat: 'energyRate', boostMax: null },
    },

    powerStorage: {
      id: 'powerStorage', name: 'Power Storage', kind: 'machine', icon: 'battery', category: 'energy',
      flippable: true,
      desc: 'A bank of cells. It takes in whatever the line cannot use and gives it back ' +
          'later.',
      color: '#e8b04b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      maxInputs: 5,
      ports: {
        
        in: [
          { id: 'k1', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k2', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k3', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k4', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k5', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
        ],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      store: 10,               
      idleDrain: 0.1,          
    },

    



    powerVault: {
      id: 'powerVault', name: 'Power Vault', kind: 'machine', icon: 'vault', category: 'energy',
      flippable: true,
      desc: 'The same cells racked five deep, with twice as many wires coming in.',
      color: '#f0c04a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      maxInputs: 10,
      ports: {
        in: [
          { id: 'k1', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k2', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k3', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k4', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k5', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k6', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k7', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k8', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k9', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
          { id: 'k10', res: 'energy', accepts: ['energy'], label: 'Energy', dynamic: true },
        ],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      store: 50,               
      idleDrain: 0.1,          
    },

    





    labourExchange: {
      id: 'labourExchange', name: 'Labour Exchange', kind: 'machine', icon: 'exchange',
      category: 'workforce',
      desc: 'An office that signs a whole crew on at once, for a fixed stretch of hours.',
      color: '#6fa8e8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      




      cap: 3,
      ports: { in: [], out: [{ id: 'wf', res: 'wf', label: 'Workforce' }] },
      hire: {
        max: 10,
        


        priceOf: 'player', priceRatio: 0.5,
        





        mult: 1.8,
        






        growth: 1.15,               
        unitSec: 600,               
        sec: 600,                   
        maxSec: 3600,               
        stepSec: 600,               
        longSec: 1800, longOff: 0.05,   
        manyAt: 6, manyOff: 0.05,       
        currency: 'money',
      },
      action: { label: 'HIRE' },
    },

    cleaner: {
      id: 'cleaner', name: 'Trash Cleaner', kind: 'machine', icon: 'cleaner', category: 'trash',
      desc: 'Hands digging a tip. It has to stand on one.',
      color: '#5ecb8a',
      placement: 'onSite', siteType: 'trashSite', buildable: true, unlockedFromStart: true,
      cost: null,
      ports: {
        in:  [{ id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce', requires: 'player' }],
        out: [{ id: 'out', res: 'trash', label: 'Trash' }],
      },
      buffer: 5,
      kgPerWF: 1,
    },

    




    treePlanter: {
      id: 'treePlanter', name: 'Tree Planter', kind: 'machine', icon: 'tree', category: 'ci',
      desc: 'People with spades, putting saplings into ground that has been cleared. It ' +
          'stands on a Grove Plot.',
      color: '#5ecb8a',
      placement: 'onSite', siteType: 'treeSite', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in:  [
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
          
          { id: 'fert', res: 'fert', accepts: ['fert'], label: 'Fertilizer',
            requires: 'fertilising' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      




      ciPerWF: 2.25,
      















      stopWhenFull: true,
      



      


      intakeRate: Infinity,
      recipe: {
        inputs: { fert: 1 },
        growth: { fert: 0.5 },
        boost: 0.1,               
        

















        boostMax: 2,
      },
      



















      





      collect: { cur: 'ci', cap: 75, label: 'COLLECT', holdLabel: 'Grown', burns: false,
                 scaleWith: 'plantMul' },
    },

    



































    

















































    





















    seedDrill: {
      id: 'seedDrill', name: 'Seed Drill', kind: 'machine', icon: 'drill',
      category: 'trials',
      




      cap: 1, capFixed: true, demo: false, trial: 'fullBloom',
      desc: 'Cuts a furrow, drops seed into it at an even depth and closes the soil ' +
          'over. It stands on a Grove Plot.',
      color: '#7fcf6a',
      placement: 'onSite', siteType: 'treeSite', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'wf',   res: 'wf',   accepts: ['wf'],   label: 'Workforce' },
          { id: 'fert', res: 'fert', accepts: ['fert'], label: 'Fertilizer',
            requires: 'fertilising' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      

      ciPerWF: 2,
      stopWhenFull: true,
      






      intakeRate: Infinity,
      

      recipe: { inputs: { fert: 1 }, growth: { fert: 0.5 }, boost: 0.1, boostMax: 2 },   
    },

    




























    meteorBeacon: {
      id: 'meteorBeacon', name: 'Meteor Beacon', kind: 'machine', icon: 'beacon',
      why: 'A meteorite falls when it feels like it. With a beacon you decide when, so ' +
           'the metal it carries becomes something you can plan a factory around.',
      category: 'trials',
      desc: 'A dish that leans on a falling rock and brings it down early. It holds a ' +
          'charge, and each pull spends a lump of it.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in:  [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' }],
        out: [],
      },
      



      










      bank: 1500,
      















      pullCost: 200,
      





      range: 700,
      


      energyDemand: { bank: true },
      action: { kind: 'pull', label: 'PULL' },
      
      cap: 1, capFixed: true, demo: false, trial: 'tenCraters',
    },

    


















    waterPump: {
      id: 'waterPump', name: 'Water Pump', kind: 'machine', icon: 'pump',
      category: 'ci',
      desc: 'Drops a pipe into the standing water and drags it out under power. The same ' +
              'pipe carries clean water back down.',
      color: '#4fc3e8',
      

      placement: 'onSite', siteType: ['waterSite', 'oilSite'],
      buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy', group: 'lift' },
          


          { id: 'water', res: 'water', accepts: ['water'], label: 'Clean water',
            optional: true, group: 'give' },
        ],
        out: [
          



          { id: 'dirty', res: 'dirtyWater', poolRes: true, label: 'Polluted water',
            group: 'lift' },
        ],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci', group: 'give' }],
      













      cardGroups: [{ id: 'lift', label: 'Lifting' }, { id: 'give', label: 'Putting back' }],
      buffer: 12, outBuffer: 12, intakeRate: Infinity, processRate: Infinity,
      






      pumpPerKw: 0.2,          
      energyDemand: { pump: true },
      stopWhenFull: true,
    },

    hiringPost: {
      id: 'hiringPost', name: 'Hiring Post', kind: 'machine', icon: 'hire', category: 'workforce',
      desc: 'A board by the gate where casual hands sign on for a shift. Each one costs more ' +
          'than the last.',
      color: '#6fa8e8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,                     
      cap: 5,                        
      ports: { in: [], out: [{ id: 'wf', res: 'wf', label: 'Workforce' }] },
      
      
      hire: {
        max: 3,
        





        priceOf: 'player', priceRatio: 0.5,
        growth: 1.35,               
        
        bulkDiscount: [0, 0.05, 0.10],
        sec: 600, currency: 'money',
      },
      action: { label: 'HIRE' },
    },

    stormTurbine: {
      id: 'stormTurbine', name: 'Storm Turbine', kind: 'machine', icon: 'turbine', category: 'energy',
      desc: 'Braced low and built heavy, so hard weather spins it instead of stopping it.',
      

      descMore: 'Wire an Etching Works into one and every kilogram of Advanced Cell it ' +
          'takes makes it spin faster, for good.',
      descNeeds: 'etchingWorks',
      color: '#e8b04b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      


      cost: { base: 45, growth: 1.6, freeStock: 1, currency: 'money' },
      cap: 5,                        
      ports: {
        in: [{ id: 'cell', res: 'advCell', accepts: ['advCell'], label: 'Advanced cell',
               requires: 'advCells' }],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      energyRate: 3,
      



      powerUp: { res: 'advCell', port: 'cell', kg: 1, growth: 0.3, boost: 0.25,
                 stat: 'energyRate', boostMax: null },
      








      buffer: 12, intakeRate: Infinity,
    },

    droneCleaner: {
      id: 'droneCleaner', name: 'Cleaner Drone', kind: 'machine', icon: 'cleaner', category: 'trash',
      desc: 'Digs a tip on power instead of people.',
      color: '#6fc9c0',
      placement: 'onSite', siteType: 'trashSite', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in:  [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' }],
        out: [{ id: 'out', res: 'trash', label: 'Trash' }],
      },
      buffer: 5,
      




      energyPerKg: 1,         
      



      digRate: Infinity,
      energyDemand: { dig: true },
    },

    tradePost: {
      id: 'tradePost', name: 'Trade Post', kind: 'machine', icon: 'tradepost', category: 'money',
      desc: 'A Market that empties itself, once you wire a crew in.',
      color: '#c98ff0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          
          { id: 'in', res: 'trash', accepts: ALL_GRADES.slice(), label: 'Salvage' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Money', cur: 'money' }],
      collect: { cur: 'money', cap: 25, label: 'COLLECT', holdLabel: 'Till' },
      
      
      valueGroup: 'market',
      




      autoCollect: [{ port: 'wf', perUnit: 1.5 }],   
      buffer: 8, intakeRate: Infinity, processRate: Infinity,
    },

    incinerator: {
      id: 'incinerator', name: 'Incinerator', kind: 'machine', icon: 'incinerator', category: 'ci',
      desc: 'A Landfill that empties itself, once you wire a crew in.',
      color: '#8ce4f0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          
          
          { id: 'in', res: 'trash', accepts: ['trash','rtrash','light','heavy'], label: 'Trash' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      collect: { cur: 'ci', cap: 25, label: 'BURN', holdLabel: 'Unburned' },
      valueGroup: 'landfill',        
      
      autoCollect: [{ port: 'wf', perUnit: 1.5 }],
      buffer: 10, intakeRate: Infinity, processRate: Infinity,
    },

    recycler: {
      id: 'recycler', name: 'Recycler', kind: 'machine', icon: 'recycler', category: 'trash',
      desc: 'Shreds and washes raw trash into stock clean enough to work with. What the power ' +
          'could not cover passes straight through.',
      color: '#7fd4a8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'trash', res: 'trash', accepts: ['trash'], label: 'Trash' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [
          { id: 'rec', res: 'rtrash', label: 'Recycled trash' },
          { id: 'pass', res: 'trash', label: 'Trash' },
        ],
      },
      










      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      energyPerKg: 1,          
      
      energyDemand: { res: 'trash' },
    },

    weightSorter: {
      
      throttlesTogether: true,
      id: 'weightSorter', name: 'Weight Sorter', kind: 'machine', icon: 'sorter', category: 'trash',
      




      lightSplit: true,
      desc: 'Air lifts the light material off the belt and the heavy stays on. Starve it of ' +
          'power and the split slides toward heavy.',
      


      spec: 'Short of energy it makes heavy trash instead, never nothing. Half the energy ' +
            'does not mean half the output, it means a worse split.',
      color: '#9ad8c4',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        
        in: [
          { id: 'rec', res: 'rtrash', accepts: ['rtrash'], label: 'Recycled trash' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [
          { id: 'light', res: 'light', label: 'Light trash' },
          { id: 'heavy', res: 'heavy', label: 'Heavy trash' },
        ],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      



      energyPerKg: 2,
      energyDemand: { res: 'rtrash' },
    },

    







    



    pracFeed: {
      id: 'pracFeed', name: 'Supply', kind: 'machine', icon: 'supply', category: 'practice',
      desc: 'A stack that never runs out. Drag its rate to see what the machine does with less.',
      color: '#6ee7c6',
      placement: 'free', buildable: false, unlockedFromStart: false,
      outBuffer: 9999, intakeRate: Infinity, processRate: Infinity,
      ports: { out: [{ id: 'out', res: 'trash', label: 'Out' }] },
    },

    



    pracPower: {
      id: 'pracPower', name: 'Power Supply', kind: 'machine', icon: 'supply', category: 'practice',
      desc: 'Power out of nothing, at whatever rate you set. Turn it down and watch what changes.',
      color: '#f2c14e',
      placement: 'free', buildable: false, unlockedFromStart: false,
      energyRate: 0,
      ports: { out: [{ id: 'kw', res: 'energy', label: 'Energy' }] },
    },

    










    pracCrew: {
      id: 'pracCrew', name: 'Crew Supply', kind: 'machine', icon: 'supply', category: 'practice',
      desc: 'Workforce out of nothing, at whatever rate you set.',
      color: '#4a9fe0',
      placement: 'free', buildable: false, unlockedFromStart: false,
      wfRate: 0,
      ports: { out: [{ id: 'wf', res: 'wf', label: 'Workforce' }] },
    },

    


    pracDrain: {
      id: 'pracDrain', name: 'Drain', kind: 'machine', icon: 'drain', category: 'practice',
      desc: 'Everything wired in disappears. Nothing here backs up.',
      color: '#8894a6',
      placement: 'free', buildable: false, unlockedFromStart: false,
      buffer: 9999, intakeRate: Infinity, processRate: Infinity,
      ports: { in: [{ id: 'in', res: 'trash', accepts: ['trash'], label: 'In' }] },
    },

    trashJunction: {
      










      
























      id: 'trashJunction', name: 'Salvage Store', kind: 'machine', icon: 'merge', category: 'trash',
      flippable: true,
      desc: 'Several lines tip onto one floor, and what is not carried away stays stacked. ' +
            'It lets go no faster than you set.',
      color: '#5ecb8a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      
















      merge: true, mergeLock: true, mergeFlow: 'material', holdLock: true,
      minInputs: 2, maxInputs: 5,
      ports: {
        in: [
          { id: 'i1', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', dynamic: true },
          { id: 'i2', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', dynamic: true },
          { id: 'i3', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', dynamic: true },
          { id: 'i4', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', dynamic: true },
          { id: 'i5', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', dynamic: true },
        ],
        out: [{ id: 'out', res: 'trash', label: 'Salvage' }],
      },
      






      buffer: 20, outBuffer: 20, intakeRate: Infinity, processRate: Infinity,
    },

    








    depot: {
      id: 'depot', name: 'Salvage Depot', kind: 'machine', icon: 'depot', category: 'trials',
      why: 'A factory that surges and then starves is hard to wire around. Three ' +
           'shelves, each letting its material out at a speed you set, is what turns a ' +
           'lumpy supply into a steady one.',
      flippable: true,
      desc: 'Three stores stacked in one frame. Each shelf keeps one material and ' +
            'lets it go no faster than you set.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      trial: 'warehouse',            
      demo: false,                   
      cap: 5, capFixed: true,        
      lanes: ['a', 'b', 'c'],
      laneInputs: 3,                 
      buffer: 100,                   
      intakeRate: Infinity,
      cardGroups: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      ports: {
        in: [
          { id: 'a1', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'a', group: 'a', dynamic: true },
          { id: 'a2', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'a', group: 'a', dynamic: true },
          { id: 'a3', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'a', group: 'a', dynamic: true },
          { id: 'b1', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'b', group: 'b', dynamic: true },
          { id: 'b2', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'b', group: 'b', dynamic: true },
          { id: 'b3', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'b', group: 'b', dynamic: true },
          { id: 'c1', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'c', group: 'c', dynamic: true },
          { id: 'c2', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'c', group: 'c', dynamic: true },
          { id: 'c3', res: 'trash', accepts: ROUTABLE.slice(), label: 'Salvage', lane: 'c', group: 'c', dynamic: true },
        ],
        out: [
          { id: 'oa', res: 'trash', label: 'Salvage', lane: 'a', group: 'a' },
          { id: 'ob', res: 'trash', label: 'Salvage', lane: 'b', group: 'b' },
          { id: 'oc', res: 'trash', label: 'Salvage', lane: 'c', group: 'c' },
        ],
      },
    },

    




















    fluidTank: {
      id: 'fluidTank', name: 'Fluid Tank', kind: 'machine', icon: 'tank',
      

      why: 'Bank oil in a drum while the grid is healthy and you do not need it. When ' +
           'power runs short later, open the tap and an Oil Generator has its fuel ' +
           'already waiting.',
      whyNeeds: 'oilGenerator',
      category: 'fluids', flippable: true,
      desc: 'A sealed drum on a pallet. The first fluid to reach it is the one it '
          + 'holds, and it will take nothing else until it has been drained.',
      color: '#4aa3c7',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      merge: true, mergeLock: true, mergeFlow: 'material', holdLock: true,
      minInputs: 1, maxInputs: 3,
      ports: {
        in: [
          { id: 'i1', res: 'oil', accepts: FLUIDS.slice(), label: 'Fluid', dynamic: true },
          { id: 'i2', res: 'oil', accepts: FLUIDS.slice(), label: 'Fluid', dynamic: true },
          { id: 'i3', res: 'oil', accepts: FLUIDS.slice(), label: 'Fluid', dynamic: true },
        ],
        out: [{ id: 'out', res: 'oil', label: 'Fluid' }],
      },
      





      buffer: 20, outBuffer: 20, intakeRate: Infinity, processRate: Infinity,
      














      outRate: 5,
    },

    



































    fluidSplitter: {
      id: 'fluidSplitter', name: 'Fluid Splitter', kind: 'machine', icon: 'split',
      category: 'fluids',
      desc: 'One fluid wire into two. It carries one fluid at a time.',
      color: '#4fc3e8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      
      
      splitter: true, passesMaterial: true, mergeLock: true,
      


      defaultWeights: { a: 1, b: 1 },
      ports: {
        



        in: [{ id: 'in', res: 'oil', accepts: FLUIDS.slice(), label: 'Fluid' }],
        out: [
          { id: 'a', res: 'oil', label: 'Output A' },
          { id: 'b', res: 'oil', label: 'Output B' },
        ],
      },
      










      buffer: 2.5, outBuffer: 2.5, intakeRate: Infinity, processRate: Infinity,
    },

    crewJunction: {
      id: 'crewJunction', name: 'Crew Junction', kind: 'machine', icon: 'crew', category: 'workforce',
      flippable: true,
      desc: 'Merges workforce, five wires into one.',
      color: '#4a9fe0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      merge: true, mergeFlow: 'rate',
      minInputs: 2, maxInputs: 5,
      ports: {
        in: [
          { id: 'i1', res: 'wf', accepts: ['wf'], label: 'Workforce', dynamic: true },
          { id: 'i2', res: 'wf', accepts: ['wf'], label: 'Workforce', dynamic: true },
          { id: 'i3', res: 'wf', accepts: ['wf'], label: 'Workforce', dynamic: true },
          { id: 'i4', res: 'wf', accepts: ['wf'], label: 'Workforce', dynamic: true },
          { id: 'i5', res: 'wf', accepts: ['wf'], label: 'Workforce', dynamic: true },
        ],
        out: [{ id: 'out', res: 'wf', label: 'Workforce' }],
      },
    },

    powerSplitter: {
      id: 'powerSplitter', name: 'Power Splitter', kind: 'machine', icon: 'split', category: 'energy',
      
























      why: 'A battery with several wires out of it divides evenly, so an idle machine ' +
           'takes as much as a busy one. This is the first tool you get for aiming ' +
           'power where it is needed.',
      desc: 'One energy wire feeding two machines instead of an even share.',
      color: '#e8b04b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      
      
      splitter: true, passesEnergy: true,
      defaultWeights: { a: 1, b: 1 },
      ports: {
        in: [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' }],
        out: [
          { id: 'a', res: 'energy', label: 'Output A' },
          { id: 'b', res: 'energy', label: 'Output B' },
        ],
      },
    },

    



    crewSplitter: {
      id: 'crewSplitter', name: 'Crew Splitter', kind: 'machine', icon: 'split', category: 'workforce',
      desc: 'One workforce wire feeding two machines instead of an even share.',
      color: '#4a9fe0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      splitter: true, passesWf: true,
      defaultWeights: { a: 1, b: 1 },
      ports: {
        in: [{ id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' }],
        out: [
          { id: 'a', res: 'wf', label: 'Output A' },
          { id: 'b', res: 'wf', label: 'Output B' },
        ],
      },
    },

    











    prioPowerSplitter: {
      id: 'prioPowerSplitter', name: 'Priority Power Splitter', kind: 'machine', icon: 'prioSplit',
      

      why: 'A machine that works in batches wants power only part of the time. Put it ' +
           'on the priority side and it is fed first, then the supply goes down the ' +
           'other wire the moment it stops. A Diamond Press there runs itself.',
      category: 'energy',
      desc: 'Sends all its power to the priority side while that side can use any. When it ' +
            'cannot, all of it goes to the other side.',
      color: '#e8b04b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null, demo: false,
      splitter: true, passesEnergy: true, priority: true,
      defaultWeights: { a: 1, b: 1 },
      ports: {
        in: [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' }],
        out: [
          { id: 'a', res: 'energy', label: 'Output A' },
          { id: 'b', res: 'energy', label: 'Output B' },
        ],
      },
    },
    prioCrewSplitter: {
      id: 'prioCrewSplitter', name: 'Priority Crew Splitter', kind: 'machine', icon: 'prioSplit',
      category: 'workforce',
      desc: 'Sends all its workforce to the priority side while that side can use any. When it ' +
            'cannot, all of it goes to the other side.',
      color: '#4a9fe0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null, demo: false,
      splitter: true, passesWf: true, priority: true,
      defaultWeights: { a: 1, b: 1 },
      ports: {
        in: [{ id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' }],
        out: [
          { id: 'a', res: 'wf', label: 'Output A' },
          { id: 'b', res: 'wf', label: 'Output B' },
        ],
      },
    },

    




    outreachHub: {
      id: 'outreachHub', name: 'Outreach Hub', kind: 'machine', icon: 'outreach', category: 'workforce',
      why: 'Every other crew costs money or goes home at the end of the shift. A hub ' +
           'buys people once and keeps them, out of power and labour you already make. ' +
           'It is slow, so build it early and be patient.',
      desc: 'Knocks on doors and runs stalls until people sign up. The ones it finds stay for ' +
          'good.',
      





      




      color: '#7ec4ff',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      recruit: true,
      ladderShared: true,   
      















      cap: 10,
      
















      need: 70,             
      




















      needGrowth: 1.1,      
      



      needGrowthPaid: 1.12,
      



      
      
      
      
      




      intakeRate: Infinity,
      ports: {
        in: [
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'wf', label: 'Workforce' }],
      },
      
      
      energyDemand: { pool: true },
    },

    


    magnetSeparator: {
      id: 'magnetSeparator', name: 'Magnet Separator', kind: 'machine', icon: 'magnet', category: 'manufacture',
      desc: 'A magnet drum runs over the heavy trash and lifts the metal straight out of it.',
      color: '#aebfd0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'heavy', res: 'heavy', accepts: ['heavy'], label: 'Heavy trash' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        
        out: [
          { id: 'metal', res: 'metal', label: 'Metal' },
          { id: 'pass', res: 'heavy', label: 'Heavy trash' },
        ],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      energyPerKg: 3,          
      energyDemand: { res: 'heavy' },
    },

    





    eddySeparator: {
      
      throttlesTogether: true,
      id: 'eddySeparator', name: 'Eddy Separator', kind: 'machine', icon: 'eddy', category: 'manufacture',
      




      lightSplit: true,
      desc: 'A spinning field throws the aluminium clear and lets the steel drop straight ' +
          'down.',
      color: '#9fb6c9',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'metal', res: 'metal', accepts: ['metal'], label: 'Metal' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [
          { id: 'alu', res: 'alu', label: 'Aluminium' },
          { id: 'steel', res: 'steel', label: 'Steel' },
        ],
      },
      



      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      energyPerKg: 4,          
      energyDemand: { res: 'metal' },
    },

    































    oreDigger: {
      throttlesTogether: true,
      rockNot: ['pluto'],            
      id: 'oreDigger', name: 'Ore Digger', kind: 'machine', icon: 'oredig', category: 'trash',
      desc: 'Breaks a fallen rock apart and sorts the metal out of the rubble by hand and by ' +
          'machine.',
      color: '#c2b48f',
      placement: 'onSite', siteType: 'meteorite', buildable: true, unlockedFromStart: false,
      cost: null,
      
      capBand: false,
      ports: {
        in: [
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        










        out: [
          { id: 'steel', res: 'steel', label: 'Steel', rockOut: true },
          { id: 'alu',   res: 'alu',   label: 'Aluminium', rockOut: true },
          { id: 'lead',  res: 'lead',  label: 'Lead', rockOut: true },
          









          { id: 'gold',  res: 'gold',  label: 'Gold', rockOut: true },
        ],
      },
      






      digKw: 4,
      












      digWf: 3,
      






      digMix: { steel: 0.6, alu: 0.3, lead: 0.1 },
      outBuffer: 8,
      digRate: Infinity,
      





      demo: false,
      energyDemand: { dig: true },
    },

    



    hazardPlant: {
      id: 'hazardPlant', name: 'Hazard Plant', kind: 'machine', icon: 'hazard', category: 'manufacture',
      desc: 'Hands pick the toxic fraction out of light trash and seal it into drums. What ' +
          'the crew could not cover passes straight through.',
      color: '#b7e04a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'light', res: 'light', accepts: ['light'], label: 'Light trash' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [
          { id: 'haz', res: 'hazard', label: 'Hazardous waste' },
          { id: 'pass', res: 'light', label: 'Light trash' },
        ],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      wfPerKg: 2 / 3,          
      hazPerKg: 1 / 3,         
    },

    



    fineSorter: {
      
      throttlesTogether: true,
      id: 'fineSorter', name: 'Fine Sorter', kind: 'machine', icon: 'fine', category: 'manufacture',
      




      lightSplit: true,
      desc: 'Hands work through light trash piece by piece, plastics into one bin and ' +
          'anything that once grew into the other.',
      color: '#4fc3e8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'light', res: 'light', accepts: ['light'], label: 'Light trash' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [
          { id: 'plastic', res: 'plastic', label: 'Plastic' },
          { id: 'organic', res: 'organic', label: 'Organic waste' },
        ],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      wfPerKg: 4,                    
      splitField: 'wfPerKg',         
    },

    



    fertilizerPlant: {
      id: 'fertilizerPlant', name: 'Fertilizer Plant', kind: 'machine', icon: 'fert',
      category: 'manufacture',
      desc: 'Heats organic waste together with hazardous sludge until what is left is stable ' +
          'enough to spread on soil.',
      color: '#b98a4a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'haz', res: 'hazard', accepts: ['hazard'], label: 'Hazardous waste' },
          { id: 'org', res: 'organic', accepts: ['organic'], label: 'Organic waste' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'fert', label: 'Fertilizer' }],
      },
      buffer: 8, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      mix: ['hazard', 'organic'],    
      energyPerKg: 5,                
      fertPerKg: 0.1,                
      
      energyDemand: { res: ['hazard', 'organic'] },
    },

    
















    cellAssembler: {
      id: 'cellAssembler', name: 'Cell Assembler', kind: 'machine', icon: 'cell', category: 'manufacture',
      desc: 'Rolls aluminium into casings and fills them with the hazardous chemistry a cell ' +
          'needs to hold charge.',
      color: '#88c22e',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'alu', res: 'alu', accepts: ['alu'], label: 'Aluminium' },
          { id: 'haz', res: 'hazard', accepts: ['hazard'], label: 'Hazardous waste' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [{ id: 'out', res: 'cell', label: 'Batteries' }],
      },
      convert: {
        inputs: { alu: 3, hazard: 1 },       
        wf: 5,                               
        out: { res: 'cell', kg: 1 },
      },
      



      buffer: 12, outBuffer: 10, intakeRate: Infinity,
    },

    









    












    waterCleaner: {
      id: 'waterCleaner', name: 'Water Cleaner', kind: 'machine', icon: 'clean',
      category: 'fluids',
      desc: 'Pushes dirty water through a bed of charcoal. The carbon holds on to what was ' +
              'in the water, and comes out loaded with it.',
      color: '#3fb8a6',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'dirty', res: 'dirtyWater', accepts: ['dirtyWater'], label: 'Polluted water' },
          { id: 'coal', res: 'coal', accepts: ['coal'], label: 'Charcoal' },
        ],
        out: [
          { id: 'out', res: 'water', label: 'Clean water' },
          { id: 'haz', res: 'hazard', label: 'Hazardous waste' },
        ],
      },
      buffer: 22, outBuffer: 12, intakeRate: Infinity, processRate: Infinity,
      





      convert: {
        inputs: { dirtyWater: 1, coal: 0.1 },
        out: { res: 'water', kg: 1 },
      },
      outPerKg: { res: 'hazard', kg: 0.1 },   
    },

    
































    oilSeparator: {
      id: 'oilSeparator', name: 'Oil Separator', kind: 'machine', icon: 'separator',
      category: 'fluids',
      desc: 'Oil and water come apart on their own once they are slowed enough. Plate ' +
              'packs do the slowing, and polypropylene sorbent lifts the film left on top.',
      color: '#a8853f',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'oily', res: 'oilyWater', accepts: ['oilyWater'], label: 'Oily water' },
          { id: 'plastic', res: 'plastic', accepts: ['plastic'], label: 'Plastic' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [
          { id: 'out', res: 'water', label: 'Clean water' },
          { id: 'oil', res: 'oil', label: 'Oil' },
        ],
      },
      buffer: 22, outBuffer: 12, intakeRate: Infinity, processRate: Infinity,
      






      convert: {
        inputs: { oilyWater: 1, plastic: 0.25 },
        kw: 5,
        out: { res: 'water', kg: 1 },
      },
      outPerKg: { res: 'oil', kg: 0.1 },   
      


      energyDemand: { conv: true },
    },

    















































    diamondPress: {
      id: 'diamondPress', name: 'Diamond Press', kind: 'machine', icon: 'dpress',
      category: 'special',
      desc: 'Squeezes charcoal at a pressure and heat that leave the carbon no choice but to ' +
          'crystallise.',
      








      color: '#7fe3ff',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'coal', res: 'coal', accepts: ['coal'], label: 'Charcoal' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Diamonds', cur: 'diamond' }],
      





























      cap: 3,
      












      








      collect: { cur: 'diamond', cap: 10, label: 'COLLECT', holdLabel: 'Cut',
                 scaleWith: 'gemYield' },
      recipe: {
        inputs: { coal: 4 },       
        kw: 400,                   
        growth: { coal: 0.8, kw: 80 },   
        
        
        gem: { cur: 'diamond', base: 1, every: 5 },
      },
      intakeRate: Infinity,
      
      
      energyDemand: { kwPool: true },
    },

    







    paperMill: {
      id: 'paperMill', name: 'Paper Mill', kind: 'machine', icon: 'papermill',
      category: 'manufacture',
      desc: 'Chips scrap timber, boils it down to pulp, and presses the wet sheets flat to dry.',
      color: '#d8cfb8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null, demo: false,
      ports: {
        in: [
          { id: 'wood', res: 'wood', accepts: ['wood'], label: 'Scrap timber' },
          { id: 'blade', res: 'blade', accepts: ['blade'], label: 'Blade kit' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [{ id: 'out', res: 'paper', label: 'Paper' }],
      },
      convert: { inputs: { wood: 2, blade: 0.2 }, wf: 6, out: { res: 'paper', kg: 1 } },
      buffer: 12, outBuffer: 6, intakeRate: Infinity,
      energyDemand: { conv: true },
    },

    

































    printWorks: {
      id: 'printWorks', name: 'Print Works', kind: 'machine', icon: 'printworks',
      category: 'special',
      desc: 'Grinds whatever is loaded into it down to a pigment, then prints with that ' +
            'under heat and pressure.',
      why: 'Six materials each print their own boost, so whatever your factory has most ' +
           'of decides which one you get.',
      color: '#e8a0c8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null, demo: false,
      ports: {
        in: [
          { id: 'paper', res: 'paper', accepts: ['paper'], label: 'Paper' },
          



          

          { id: 'mat', res: 'trash', accepts: ROUTABLE.filter(r => r !== 'paper'), label: 'Material' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [],
      },
      mergeLock: true,
      




      virtualOut: [{ label: 'Printed', cur: 'diamond' }],
      


      buffer: 400, intakeRate: Infinity,
      print: {
        paper: 2,          
        kw: 400,           
        kwGrow: 100,       
        value: 2200,       
        

        boosts: {
          chip:   { boost: 'overdrive',   kg: 7,    grow: 2 },
          tonic:  { boost: 'rally',       kg: 20,   grow: 5 },
          gold:   { boost: 'scrapSurge',  kg: 0.25, grow: 0.05 },
          panel:  { boost: 'sunrise',     kg: 6,    grow: 1.5 },
          fert:   { boost: 'grove',       kg: 0.75, grow: 0.25 },
          rtrash: { boost: 'goldenTouch', kg: 90,   grow: 25 },
        },
        





        gem: { cur: 'diamond', mul: 3, grow: 0.1 },
        



        stock: true,
      },
      
      energyDemand: { kwPool: true },
    },

    




    gridFoundry: {
      id: 'gridFoundry', name: 'Grid Foundry', kind: 'machine', icon: 'forge', category: 'energy',
      

      why: 'A generator has a build limit, and diamonds only lift it so far. The arrays ' +
           'this raises have no limit at all, so it is what keeps a grid growing after that.',
      ladderShared: true,   
      




















      cap: 10,
      desc: 'Casts salvaged steel into a frame and racks the cells into it, one whole array ' +
          'at a time.',
      


      


      color: '#e8b04b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'cell', res: 'cell', accepts: ['cell'], label: 'Batteries' },
          { id: 'steel', res: 'steel', accepts: ['steel'], label: 'Steel' },
        ],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      














      recipe: {
        




        inputs: { cell: 4 / 1.5, steel: 16 / 1.5 },      
        























        growthMul: 1.1,                      
        power: 'windTurbine',                
      },
      intakeRate: Infinity,
    },

    market: {
      id: 'market', name: 'Market', kind: 'machine', icon: 'market', category: 'money',
      desc: 'Sells anything. Press COLLECT before the till fills, or the line behind it jams.',
      color: '#b478e8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        
        in: [{ id: 'in', res: 'trash', accepts: ALL_GRADES.slice(), label: 'Salvage' }],
        out: [],
      },
      virtualOut: [{ label: 'Money', cur: 'money' }],
      
      collect: { cur: 'money', cap: 25, label: 'COLLECT', holdLabel: 'Till' },
      
      
      buffer: 8, intakeRate: Infinity, processRate: Infinity,
      valuePerKg: null,        
    },

    landfill: {
      id: 'landfill', name: 'Landfill', kind: 'machine', icon: 'landfill', category: 'ci',
      desc: 'Press BURN before the pile fills, or the line behind it jams.',
      color: '#62d4e3',
      placement: 'free', buildable: true, unlockedFromStart: true,
      cost: null,
      ports: {
        





        in: [{ id: 'in', res: 'trash', accepts: ['trash', 'rtrash', 'light', 'heavy'], label: 'Trash' }],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      
      collect: { cur: 'ci', cap: 25, label: 'BURN', holdLabel: 'Unburned' },
      buffer: 10, intakeRate: Infinity, processRate: Infinity,
      valuePerKg: null,        
    },

    





    




    salvageSplitter: {
      id: 'salvageSplitter', name: 'Salvage Splitter', kind: 'machine', icon: 'split',
      category: 'trash',
      desc: 'One material wire into two. It carries one grade at a time.',
      color: '#5ecb8a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      
      
      splitter: true, passesMaterial: true, mergeLock: true,
      



      defaultWeights: { a: 1, b: 1 },
      ports: {
        in: [{ id: 'in', res: 'trash', accepts: ROUTABLE.slice(), label: 'Material' }],
        out: [
          { id: 'a', res: 'trash', label: 'Output A' },
          { id: 'b', res: 'trash', label: 'Output B' },
        ],
      },
      










      buffer: 2.5, outBuffer: 2.5, intakeRate: Infinity, processRate: Infinity,
    },

    



    tradingFloor: {
      id: 'tradingFloor', name: 'Trading Floor', kind: 'machine', icon: 'floor',
      category: 'money',
      desc: 'A Trade Post with a second input wire and twice the till.',
      color: '#d9a2ff',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'in', res: 'trash', accepts: ALL_GRADES.slice(), label: 'Salvage A' },
          { id: 'in2', res: 'trash', accepts: ALL_GRADES.slice(), label: 'Salvage B' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Money', cur: 'money' }],
      
      
      collect: { cur: 'money', cap: 50, label: 'COLLECT', holdLabel: 'Till' },
      valueGroup: 'market',          
      autoCollect: [{ port: 'wf', perUnit: 2 }],
      buffer: 8, intakeRate: Infinity, processRate: Infinity,
    },

    

    burnYard: {
      id: 'burnYard', name: 'Burn Yard', kind: 'machine', icon: 'furnace', category: 'ci',
      desc: 'An Incinerator with a second input wire and twice the pile.',
      color: '#a6ecf5',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          
          { id: 'in', res: 'trash', accepts: ['trash','rtrash','light','heavy'], label: 'Trash A' },
          { id: 'in2', res: 'trash', accepts: ['trash','rtrash','light','heavy'], label: 'Trash B' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      
      collect: { cur: 'ci', cap: 50, label: 'BURN', holdLabel: 'Unburned' },
      valueGroup: 'landfill',
      autoCollect: [{ port: 'wf', perUnit: 2 }],
      buffer: 10, intakeRate: Infinity, processRate: Infinity,
    },

    


    pyrolysisPlant: {
      id: 'pyrolysisPlant', name: 'Pyrolysis Plant', kind: 'machine', icon: 'pyro',
      category: 'fluids',
      desc: 'Heats plastic with no oxygen in the vessel, until it breaks down and runs off as ' +
          'oil.',
      color: '#c9762b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'plastic', res: 'plastic', accepts: ['plastic'], label: 'Plastic' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'oil', label: 'Oil' }],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      energyPerKg: 4,          
      oilPerKg: 0.5,           
      energyDemand: { res: 'plastic' },
    },

    













    

    timberReclaimer: {
      id: 'timberReclaimer', name: 'Timber Reclaimer', kind: 'machine', icon: 'timber',
      category: 'manufacture',
      desc: 'Timber out of aggregate.',
    


    flowNote: false,
      color: '#a9793f',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'aggregate', res: 'aggregate', accepts: ['aggregate'], label: 'Aggregate' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [{ id: 'out', res: 'wood', label: 'Scrap timber' }],
      },
      buffer: 9, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      wfPerKg: 1,              
      yieldPerKg: 1 / 3,       
    },

    



    fibrePress: {
      id: 'fibrePress', name: 'Fibre Press', kind: 'machine', icon: 'press',
      category: 'manufacture',
      desc: 'Presses plant fibre into board under heat, until it holds together like sawn ' +
          'timber.',
      color: '#8f9a5b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'organic', res: 'organic', accepts: ['organic'], label: 'Organic waste' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [{ id: 'out', res: 'wood', label: 'Scrap timber' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      





      wfPerKg: 0.75,           
      













      yieldPerKg: 1 / 4,       
    },

    



    charKiln: {
      id: 'charKiln', name: 'Char Kiln', kind: 'machine', icon: 'kiln',
      category: 'manufacture',
      




      desc: 'Bakes scrap timber with almost no air to burn in. The water and gases cook '
          + 'off and leave nearly pure carbon.',
      color: '#5c5750',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'wood', res: 'wood', accepts: ['wood'], label: 'Scrap timber' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'coal', label: 'Charcoal' }],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      flowNote: false,         
      energyPerKg: 5,          
      yieldPerKg: 0.5,         
      energyDemand: { res: 'wood' },
    },

    






































    bladeWorks: {
      id: 'bladeWorks', name: 'Blade Works', kind: 'machine', icon: 'bladeworks',
      category: 'energy',
      desc: 'Lays up a blade shell in plastic and bonds an aluminium spar down the ' +
          'middle of it, then balances the set by hand.',
      color: '#d8a94f',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'plastic', res: 'plastic', accepts: ['plastic'], label: 'Plastic' },
          { id: 'alu', res: 'alu', accepts: ['alu'], label: 'Aluminium' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [{ id: 'out', res: 'blade', label: 'Blade kits' }],
      },
      buffer: 9, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      



      convert: {
        inputs: { plastic: 1, alu: 0.5 },   
        wf: 4,                              
        out: { res: 'blade', kg: 1 },
      },
    },

    




































    














    


























    leachingPlant: {
      id: 'leachingPlant',
      name: 'Leaching Plant',
      kind: 'machine',
      icon: 'leach',
      category: 'manufacture',
      desc: 'Dissolves scrap metal in hot acid. The gold goes into the liquor and drops ' +
            'out clean, and everything else settles as slag.',
      color: '#e8c14a',
      placement: 'free',
      buildable: true,
      unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'acid',  res: 'acid',   accepts: ['acid'],   label: 'Acid' },
          { id: 'metal', res: 'metal',  accepts: ['metal'],  label: 'Metal' },
          { id: 'kw',    res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        


        out: [
          { id: 'out',  res: 'gold', label: 'Gold' },
          { id: 'slag', res: 'slag', label: 'Slag' },
        ],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      convert: {
        inputs: { acid: 1, metal: 2 },   
        kw: 5,                           
        out: { res: 'gold', kg: 0.05 },  
      },
      outPerKg: { res: 'slag', kg: 30 },  
      


      energyDemand: { conv: true },
    },

    
























    circuitWorks: {
      id: 'circuitWorks',
      name: 'Circuit Works',
      kind: 'machine',
      icon: 'circuit',
      category: 'manufacture',
      desc: 'Grinds glass down into wafers, etches the pattern into them with acid, and ' +
            'lays gold threads along it.',
      color: '#7fd4b0',
      placement: 'free',
      buildable: true,
      unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'gold',  res: 'gold',  accepts: ['gold'],  label: 'Gold' },
          { id: 'glass', res: 'glass', accepts: ['glass'], label: 'Glass' },
          { id: 'acid',  res: 'acid',  accepts: ['acid'],  label: 'Acid' },
          { id: 'wf',    res: 'wf',    accepts: ['wf'],    label: 'Workforce' },
        ],
        out: [{ id: 'out', res: 'chip', label: 'Microschemes' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      convert: {
        inputs: { gold: 0.05, glass: 1, acid: 0.25 },
        wf: 16,
        out: { res: 'chip', kg: 1 },
      },
    },

    etchingWorks: {
      id: 'etchingWorks', name: 'Etching Works', kind: 'machine', icon: 'etching',
      category: 'energy',
      desc: 'Etches aluminium foil in acid until the surface is a forest of tunnels, ' +
          'then winds the foil wet into a cell.',
      color: '#8fe3c4',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'acid', res: 'acid', accepts: ['acid'], label: 'Acid' },
          { id: 'alu', res: 'alu', accepts: ['alu'], label: 'Aluminium' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'advCell', label: 'Advanced cells' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      

      convert: {
        









































        inputs: { acid: 1, alu: 1.8 },      
        kw: 12,                             
        out: { res: 'advCell', kg: 3 },
      },
      




      energyDemand: { conv: true },
    },

    glazingWorks: {
      id: 'glazingWorks', name: 'Glazing Works', kind: 'machine', icon: 'glazing',
      

      why: 'You cannot build more than a handful of solar panels, but you can make the ' +
           'ones you have permanently better. A kit is the upgrade a capped generator ' +
           'can still take.',
      category: 'energy',
      desc: 'Draws a sheet of glass thin and flat and runs a lead ribbon down every ' +
          'seam. Heat bakes the two together until they set as one pane.',
      color: '#ffd76a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'lead', res: 'lead', accepts: ['lead'], label: 'Lead' },
          { id: 'glass', res: 'glass', accepts: ['glass'], label: 'Glass' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'glazing', label: 'Glazing kits' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      

      convert: {
        






















        inputs: { lead: 0.5, glass: 1.5 },  
        kw: 10,                             
        out: { res: 'glazing', kg: 1 },
      },
      






      energyDemand: { conv: true },
    },

    































    acidWorks: {
      id: 'acidWorks',
      name: 'Acid Works',
      kind: 'machine',
      icon: 'acid',
      








      category: 'fluids',
      desc: 'Cooks spent acid sludge with charcoal until it cracks back into hot gas. ' +
            'Washing that gas through water makes it acid again.',
      color: '#b6e02f',
      placement: 'free',
      buildable: true,
      unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'hazard', res: 'hazard', accepts: ['hazard'], label: 'Hazardous waste' },
          { id: 'coal',   res: 'coal',   accepts: ['coal'],   label: 'Charcoal' },
          { id: 'kw',     res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'acid', label: 'Acid' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      convert: {
        inputs: { hazard: 2, coal: 0.25 },   
        kw: 6,                               
        out: { res: 'acid', kg: 1 },
      },
      energyDemand: { conv: true },
    },

    




    





























    panelWorks: {
      id: 'panelWorks', name: 'Panel Works', kind: 'machine', icon: 'panelworks',
      category: 'workforce',
      desc: 'Lays microschemes in a grid and seals them under a glass pane, where light ' +
          'falling on them lifts a current.',
      color: '#4a9fe0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'chip', res: 'chip', accepts: ['chip'], label: 'Microschemes' },
          { id: 'glass', res: 'glass', accepts: ['glass'], label: 'Glass' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [
          { id: 'out', res: 'panel', label: 'Solar Kit' },
        ],
      },
      

      buffer: 12, outBuffer: 6, intakeRate: Infinity,
      convert: { inputs: { chip: 0.1, glass: 1 }, wf: 11, out: { res: 'panel', kg: 1 } },
      

    },

    brewVat: {
      id: 'brewVat', name: 'Brew Vat', kind: 'machine', icon: 'brewvat',
      category: 'workforce',
      desc: 'Ferments organic waste in a heated glass vessel until it cooks down into ' +
          'a thick, bitter tonic.',
      color: '#5f9ec6',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'organic', res: 'organic', accepts: ['organic'], label: 'Organic waste' },
          { id: 'glass', res: 'glass', accepts: ['glass'], label: 'Glass' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'tonic', label: 'Field tonic' }],
      },
      buffer: 9, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      





      convert: {
        inputs: { organic: 1, glass: 0.5 },
        kw: 2,                              
        out: { res: 'tonic', kg: 1 },
      },
      
      
      energyDemand: { conv: true },
    },

    






    oilGenerator: {
      id: 'oilGenerator', name: 'Oil Generator', kind: 'machine', icon: 'oilgen',
      why: 'By the time you can build one, power is what holds the factory back and ' +
           'Clean Index arrives faster than there is anything to spend it on. This is ' +
           'the trade between the two.',
      category: 'energy',
      desc: 'Sacrifices Clean Index for a lot of power, and goes on paying for every hour it runs.',
      color: '#e09a3c',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [{ id: 'oil', res: 'oil', accepts: ['oil'], label: 'Oil' }],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      






      buffer: 1, intakeRate: Infinity, processRate: Infinity,
      







      kwPerKg: 30,             
      




      


















      ciPerKw: 0.4,            
    },

    




    rubbleSorter: {
      
      throttlesTogether: true,
      id: 'rubbleSorter', name: 'Rubble Sorter', kind: 'machine', icon: 'rubble',
      category: 'manufacture',
      desc: 'Rubble goes under the crusher and over the screens. Hands pull the split toward ' +
          'glass, power pulls it toward aggregate.',
      color: '#9fd8d0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'heavy', res: 'heavy', accepts: ['heavy'], label: 'Heavy trash' },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [
          { id: 'glass', res: 'glass', label: 'Glass' },
          { id: 'agg', res: 'aggregate', label: 'Aggregate' },
        ],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      wfPerKg: 2,              
      energyPerKg: 2,          
      energyDemand: { res: 'heavy' },
    },

    




    forecastMast: {
      id: 'forecastMast', name: 'Forecast Mast', kind: 'machine', icon: 'forecast',
      

      why: 'It makes nothing, so the point is the thirty seconds. That is enough to ' +
           'hold a battery back before lightning freezes the grid, or to have Overdrive ' +
           'already running when a storm lands on your turbines.',
      category: 'special',
      desc: 'It produces nothing. What it buys is warning, before the sky turns.',
      color: '#7fb2e0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' }],
        out: [],
      },
      



      bank: 50,                
      intakeRate: Infinity,
      predict: {
        cost: 10,              
        


        canPause: true,
      },
      

      capPerLoc: 1,
      weatherOnly: true,
      energyDemand: { bank: true },   
    },

    


































    airCleaner: {
      id: 'airCleaner', name: 'Air Cleaner', kind: 'machine', icon: 'aircleaner',
      


      why: 'This is the first way to earn Clean Index out of power alone. Nothing goes ' +
           'in but electricity, and there is no patch of ground under it to run out.',
      category: 'ci',
      desc: 'Draws the air through wet scrubbers and washes the soot out of it.',
      color: '#7ad7c8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      





      cost: { base: 120, growth: 1.5, freeStock: 1, currency: 'money' },
      ports: {
        in: [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' }],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      



      ciPerKW: 1,
      


      wxKey: 'air',
      

















      maxKw: 10,
      



      capPerLoc: 1,
      intakeRate: Infinity,
      energyDemand: { capKw: true },  
    },

    







    wasteCleaner: {
      id: 'wasteCleaner', name: 'Waste Cleaner', kind: 'machine', icon: 'hazmat', category: 'trash',
      desc: 'Digs radioactive waste out of the ground. It has to stand on a Nuclear Waste Site.',
      color: '#8fd66a',
      placement: 'onSite', siteType: 'wasteSite', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
          

          { id: 'gear', res: 'gear', accepts: ['gear'], label: 'Hazmat Gear', optional: true },
        ],
        out: [{ id: 'out', res: 'nukeWaste', label: 'Nuclear waste' }],
      },
      buffer: 5, outBuffer: 5, intakeRate: Infinity,
      wastePerWf: 1,     
      gearPerWf: 0.1,    
    },

    

    gearWorks: {
      id: 'gearWorks', name: 'Gear Works', kind: 'machine', icon: 'gearworks', category: 'manufacture',
      desc: 'Lines suits with lead sheet and sews them from treated fibre.',
      color: '#c9b98a',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'lead', res: 'lead', accepts: ['lead'], label: 'Lead' },
          { id: 'organic', res: 'organic', accepts: ['organic'], label: 'Organic waste' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'gear', label: 'Hazmat Gear' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      convert: { inputs: { lead: 0.1, organic: 1 }, kw: 5, out: { res: 'gear', kg: 1 } },
      
      energyDemand: { conv: true },
    },

    




    repository: {
      id: 'repository', name: 'Deep Repository', kind: 'machine', icon: 'repository', category: 'ci',
      desc: 'Melts radioactive waste into glass, seals it in steel and buries it deep in rock.',
      color: '#5fc7b8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'waste', res: 'nukeWaste', accepts: ['nukeWaste'], label: 'Nuclear waste' },
          { id: 'glass', res: 'glass', accepts: ['glass'], label: 'Glass' },
          { id: 'steel', res: 'steel', accepts: ['steel'], label: 'Steel' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      


      buffer: 12, intakeRate: Infinity,
      


      convert: { inputs: { nukeWaste: 1, glass: 0.5, steel: 0.2 }, kw: 10, ci: 540 },
      energyDemand: { conv: true },
    },

    


    rodWorks: {
      id: 'rodWorks', name: 'Uranium Rod Works', kind: 'machine', icon: 'rodworks', category: 'manufacture',
      desc: 'Dissolves nuclear waste in acid and packs what is left into aluminium tubes.',
      color: '#6fd6b8',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'waste', res: 'nukeWaste', accepts: ['nukeWaste'], label: 'Nuclear waste' },
          { id: 'acid', res: 'acid', accepts: ['acid'], label: 'Acid' },
          { id: 'alu', res: 'alu', accepts: ['alu'], label: 'Aluminium' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'rod', label: 'Uranium Rods' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      convert: { inputs: { nukeWaste: 1, acid: 0.5, alu: 1 }, kw: 20, out: { res: 'rod', kg: 1 } },
      
      energyDemand: { conv: true },
    },

    







    reactor: {
      id: 'reactor', name: 'Nuclear Reactor', kind: 'machine', icon: 'reactor', category: 'energy',
      desc: 'Rods sit in water while their atoms split. The heat boils the water and turns a turbine.',
      color: '#e8c44b',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      cap: 3, capFixed: true,
      


      cost: { base: 5000, growth: 1.5, freeStock: 1, currency: 'money' },
      ports: {
        in: [
          { id: 'rod', res: 'rod', accepts: ['rod'], label: 'Uranium Rods' },
          { id: 'nfuel', res: 'nfuel', accepts: ['nfuel'], label: 'Plutonium Pellets', fuelAlt: true },
        ],
        out: [{ id: 'kw', res: 'energy', label: 'Energy' }],
      },
      

      fuelSwitch: 'fleetStorm', fuelPort: 'rod',
      fissionAlt: { res: 'nfuel', kg: 1, sec: 7200 },
      
      



      buffer: 2, intakeRate: Infinity,
      fission: { res: 'rod', kg: 2, sec: 3600, kw: 50 },
      action: { kind: 'fission', label: 'START' },
    },

    

    turbofuelRefinery: {
      id: 'turbofuelRefinery', name: 'Turbofuel Refinery', kind: 'machine', icon: 'refinery',
      category: 'manufacture',
      desc: 'Cracks oil over hot charcoal into a light, fast-burning fuel.',
      color: '#f0a060',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      ports: {
        in: [
          { id: 'oil', res: 'oil', accepts: ['oil'], label: 'Oil' },
          { id: 'coal', res: 'coal', accepts: ['coal'], label: 'Charcoal' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'turbofuel', label: 'Turbofuel' }],
      },
      buffer: 12, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      convert: { inputs: { oil: 1, coal: 0.2 }, kw: 6, out: { res: 'turbofuel', kg: 1 } },
      energyDemand: { conv: true },     
    },

    













    




    fuelPlant: {
      id: 'fuelPlant', name: 'Plutonium Fuel Plant', kind: 'machine', icon: 'nfuel',
      category: 'trials',
      desc: 'Presses plutonium into small pellets and seals them in aluminium cladding.',
      color: '#7ee0c0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      trial: 'fleetStorm',           
      demo: false,
      cap: 3, capFixed: true,
      ports: {
        in: [
          { id: 'pluto', res: 'pluto', accepts: ['pluto'], label: 'Plutonium' },
          { id: 'alu', res: 'alu', accepts: ['alu'], label: 'Aluminium' },
          { id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
        ],
        out: [{ id: 'out', res: 'nfuel', label: 'Plutonium Pellets' }],
      },
      buffer: 6, outBuffer: 6, intakeRate: Infinity, processRate: Infinity,
      convert: { inputs: { pluto: 1, alu: 0.5 }, kw: 30, out: { res: 'nfuel', kg: 1 } },
      energyDemand: { conv: true },     
    },

    



    puDigger: {
      id: 'puDigger', name: 'Plutonium Digger', kind: 'machine', icon: 'pudig', category: 'trash',
      desc: 'Breaks a glowing rock apart behind shielding and picks the plutonium out.',
      color: '#8fd66a',
      placement: 'onSite', siteType: 'meteorite', buildable: true, unlockedFromStart: false,
      rockKinds: ['pluto'],            
      unlockFlag: 'plutoSeen',         
      demo: false,
      cost: null,
      ports: {
        in: [
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
          { id: 'gear', res: 'gear', accepts: ['gear'], label: 'Hazmat Gear', optional: true },
        ],
        out: [{ id: 'out', res: 'pluto', label: 'Plutonium' }],
      },
      buffer: 5, outBuffer: 5, intakeRate: Infinity,
      wastePerWf: 0.25,  
      gearPerWf: 0.1,    
    },

    rocket: {
      id: 'rocket', name: 'Skytrawler', kind: 'machine', icon: 'rocket', category: 'special',   
      desc: 'Flies up into orbit, nets drifting scrap and brings the metal back down.',
      color: '#ff7eb6',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cap: 3, capFixed: true,
      cost: { base: 20000, growth: 1.5, freeStock: 1, currency: 'money' },   
      ports: {
        in: [
          { id: 'cell', res: 'cell', accepts: ['cell'], label: 'Batteries' },
          { id: 'glass', res: 'glass', accepts: ['glass'], label: 'Glass' },
          { id: 'steel', res: 'steel', accepts: ['steel'], label: 'Steel' },
          { id: 'chip', res: 'chip', accepts: ['chip'], label: 'Microschemes' },
          { id: 'turbofuel', res: 'turbofuel', accepts: ['turbofuel'], label: 'Turbofuel' },
          { id: 'nfuel', res: 'nfuel', accepts: ['nfuel'], label: 'Plutonium Pellets', fuelAlt: true },
          { id: 'wf', res: 'wf', accepts: ['wf'], label: 'Workforce' },
        ],
        out: [{ id: 'metal', res: 'metal', label: 'Metal' }],
      },
      
      outBuffer: 250, intakeRate: Infinity,
      capBand: false,
      rocket: {
        build:  { cell: 20, glass: 40, steel: 60, chip: 4 },
        flight: { fuel: 25, wf: 120, sec: 1800, metal: 250, ci: 60000 },
        

        flightAlt: { res: 'nfuel', fuel: 2, sec: 900 },
      },
      fuelSwitch: 'fleetStorm', fuelPort: 'turbofuel',
      action: { kind: 'launch', label: 'LAUNCH' },
    },

    











    bank: {
      id: 'bank', name: 'Bank', kind: 'machine', icon: 'bank', category: 'money',
      
      why: 'The first money income in the game with no factory behind it.',
      desc: 'Keeps gold locked in a vault and earns interest on it every minute.',
      color: '#a66de0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      cap: 3, capFixed: true,
      demo: false,
      ports: {
        in: [{ id: 'gold', res: 'gold', accepts: ['gold'], label: 'Gold' }],
        out: [],
      },
      virtualOut: [{ label: 'Money', cur: 'money' }],
      buffer: 1, intakeRate: Infinity,
      interestRes: 'gold',
      

      interestPct: 4,
    },

    

































    biodome: {
      id: 'biodome', name: 'Biodome', kind: 'machine', icon: 'biodome',
      why: 'Everything else that earns Clean Index has a supply line behind it. A ' +
           'finished dome has none, so its income keeps arriving while you take the ' +
           'rest of the factory apart.',
      category: 'ci',
      



      color: '#62d4e3',
      desc: 'Glass sealed over cleared ground. A crew works the beds inside, where the ' +
          'dome keeps its own air and its own weather.',
      placement: 'free', buildable: true, unlockedFromStart: false,
      cost: null,
      


      capPerLoc: 1,
      




      demo: false,
      ports: {
        in: [
          { id: 'wood',  res: 'wood',  accepts: ['wood'],  label: 'Scrap timber' },
          { id: 'steel', res: 'steel', accepts: ['steel'], label: 'Steel' },
          { id: 'glass', res: 'glass', accepts: ['glass'], label: 'Glass' },
          { id: 'fert',  res: 'fert',  accepts: ['fert'],  label: 'Fertilizer' },
          { id: 'wf',    res: 'wf',    accepts: ['wf'],    label: 'Workforce' },
        ],
        out: [],
      },
      virtualOut: [{ label: 'Clean Index', cur: 'ci' }],
      recipe: {
        inputs: { wood: 20, steel: 30, glass: 20, fert: 4 },
        wf: 200,                 
        growthMul: 1.15,         
        ci: 15,                  
      },
      



      intakeRate: Infinity,      
    },

    































    robot: {
      id: 'robot', name: 'Robot', kind: 'machine', icon: 'robot', category: 'workforce',
      desc: 'Draws power into its cells, then spends the charge working.',
      



      color: '#4a9fe0',
      placement: 'free', buildable: true, unlockedFromStart: false,
      




      cost: { base: 40, growth: 1.5, freeStock: 1, currency: 'money' },
      cap: 5,
      ports: {
        in:  [{ id: 'kw', res: 'energy', accepts: ['energy'], label: 'Energy' },
               




               { id: 'panel', res: 'panel', accepts: ['panel'], label: 'Solar Kit',
                 requires: 'panelFitting' }],
        out: [{ id: 'wf', res: 'wf', label: 'Workforce' }],
      },
      


      wfRate: 4,              
      kwPerWf: 0.7,           
      


      bank: 26,               
      intakeRate: Infinity,
      









      


      



      

      overdrive: { enabled: true, out: 2, drain: 2.5, sunDrive: true, dropKitSocket: true,
                   sunName: 'Solar Robot',
                   



                   dropPowerSocket: true },
      







































      powerUp: { res: 'panel', port: 'panel', kg: 1, growth: 0.3, boost: 0,
                 solarShare: 0.5, dayOnly: true, loadsMax: 7, boostMax: null },
      energyDemand: { cell: true },   
    },
  },

  




























  



















  skillPricing: {
    base: 2.15,           
    











    levelGrowth: 1.3,
    
































    depthGrowth: 1.80,
    




    rounding: [[2, 0.25], [5, 0.5], [20, 1], [100, 5], [500, 10], [2000, 25], [Infinity, 100]],
  },

  





























  ciPricing: {
    enabled: true,
    



    









    base: [1.5, 5, 16, 32, 45, 65, 85, 105, 130],
    


    growth: 1.18,
    
































    lateFrom: 'automation',
    lateGrowth: 1.25,
    









    


    bump: { staffing: 1.45, crewDispatch: 1.4 },
    rounding: [[100, 1], [1000, 5], [Infinity, 5]],
    order: [
      'player', 'market', 'recycling', 'trashRouting', 'crewRouting', 'solar',
      'weightSorting', 'hiring', 'powerStore',
      
      'staffing', 'powerRouting',
      




























      'crewDispatch', 'materialRouting',
      'stormPower',
      'magnetics', 'outreach', 'greenhaven', 'automation', 'rubbleSorting',
      'hazardHandling', 'bulkTrade', 'eddyCurrents', 'fineSorting',
      





      









      'cellAssembly', 'labourHire', 'bigStorage', 'gridForging', 'cleanAir', 'robotics', 'forecasting', 'refining',
      




      'timberReclaiming', 'charring',
      
























      








      'mirewater', 'oilPower', 'fertilising',
      






      'fluidStorage',
      



      'fibrePressing',
      








      'diamondPressing',
      









      


      'bladeFitting', 'brewing',
      


      'blackmere',
      

      'glazing',
      

      'acidRecovery',
      


      'advCells',
      





      'goldRecovery',
      







      'panelFitting',
      






      'biodomes',
      
      'glowmoor',
      
      'banking',
      
      'nuclearPower',
      
      'rocketry',
      




      'printing',
      









    ],
  },

  















  skills: [
    
    {
      id: 'player', tree: 'ci', currency: 'ci', name: 'Volunteers', icon: 'player',
      cost: 2, x: 60, y: 810, req: [],
      




      desc: 'Makes 1 WF/h out of nothing, for ever.',
      unlocks: ['player'],
    },
    {
      id: 'market', tree: 'ci', currency: 'ci', name: 'Market', icon: 'market',
      cost: 5, x: 360, y: 810, req: ['player'],
      desc: 'Sells what you dig up: 1 kg/h of plain trash for $1/h, and more for anything a ' +
            'machine has touched.',
      unlocks: ['market'],
    },
    {
      id: 'recycling', tree: 'ci', currency: 'ci', name: 'Recycling', icon: 'recycler',
      cost: 20, x: 660, y: 810, req: ['market'],
      desc: 'A Wind Turbine and a Recycler. Energy turns trash into recycled trash at 2.85 a ' +
            'kg.',
      unlocks: ['windTurbine', 'recycler'],
    },
    {
      id: 'weightSorting', tree: 'ci', currency: 'ci', name: 'Weight Sorting', icon: 'sorter',
      cost: 75, x: 960, y: 1050, req: ['recycling'],
      desc: 'Splits recycled trash into light at 7.25 and heavy at 2.80. Starve it of power ' +
            'and you get almost all heavy.',
      unlocks: ['weightSorter'],
    },
    {
      id: 'solar', tree: 'ci', currency: 'ci', name: 'Solar Power', icon: 'solar',
      cost: 63, x: 960, y: 570, req: ['recycling'],
      desc: 'Four times a Wind Turbine\'s power, and only by day. Something has to ' +
            'carry the night.',
      unlocks: ['solarPanel'],
    },
    {
      id: 'powerStore', tree: 'ci', currency: 'ci', name: 'Power Storage', icon: 'battery',
      cost: 125, x: 1260, y: 570, req: ['solar'],
      desc: 'A battery. It charges from every energy wire you run into it, then gives ' +
            'whatever it is wired to.',
      unlocks: ['powerStorage'],
    },

    {
      





      id: 'stormPower', tree: 'ci', currency: 'ci', name: 'Storm Power', icon: 'turbine',
      cost: 188, x: 1260, y: 330, req: ['solar'],
      desc: 'Three times a Wind Turbine\'s energy out of one mast, and a good deal dearer to ' +
            'put up.',
      unlocks: ['stormTurbine'],
    },
    {
      id: 'automation', tree: 'ci', currency: 'ci', name: 'Automation', icon: 'cleaner',
      cost: 250, x: 1560, y: 90, req: ['stormPower'],
      desc: 'A Trash Cleaner that runs on power: 1 KW/h for every kg/h it digs.',
      unlocks: ['droneCleaner'],
    },
    {
      id: 'staffing', tree: 'ci', currency: 'ci', name: 'Staffing', icon: 'crew',
      cost: 188, x: 660, y: 1290, req: ['crewRouting'],
      desc: 'A Market and a Landfill that empty themselves. Every WF/h wired in banks 1.5 ' +
            'units an hour.',
      unlocks: ['tradePost', 'incinerator'],
    },
    {
      id: 'hiring', tree: 'ci', currency: 'ci', name: 'Day Labour', icon: 'hire',
      cost: 88, x: 660, y: 2010, req: ['crewRouting'],
      desc: 'Up to three casual workers at a time, ten real minutes each, counting as ' +
            'Volunteers.',
      unlocks: ['hiringPost'],
    },
    {
      id: 'crewRouting', tree: 'ci', currency: 'ci', name: 'Crew Routing', icon: 'crew',
      cost: 50, x: 360, y: 1290, req: ['player'],
      










      desc: 'Adds up to five workforce wires together and sends them down one line.',
      unlocks: ['crewJunction'],
    },
    {
      id: 'trashRouting', tree: 'ci', currency: 'ci', name: 'Salvage Storage', icon: 'merge',
      cost: 31, x: 960, y: 330, req: ['recycling'],
      desc: 'Joins up to five lines of one material into one, and stores what has not ' +
          'moved on yet.',
      unlocks: ['trashJunction'],
    },
    


    {
      




      id: 'crewDispatch', tree: 'ci', currency: 'ci', name: 'Crew Dispatch', icon: 'split',
      cost: 215, x: 960, y: 1290, req: ['staffing'],
      desc: 'Divides one workforce wire between two, in whatever proportion you type.',
      unlocks: ['crewSplitter'],
    },
    {
      id: 'materialRouting', tree: 'ci', currency: 'ci', name: 'Salvage Routing', icon: 'split',
      cost: 250, x: 1260, y: 90, req: ['trashRouting'],
      desc: 'Divides one stream of material between two, in whatever proportion you type. One ' +
            'grade at a time.',
      unlocks: ['salvageSplitter'],
    },
    {
      id: 'outreach', tree: 'ci', currency: 'ci', name: 'Outreach', icon: 'outreach',
      cost: 250, x: 960, y: 2010, req: ['hiring'],
      





      





      desc: 'Banked workforce and power together buy a permanent recruit. Each recruit ' +
            'a hub raises makes its next one dearer, so a second hub starts its own ' +
            'count.',
      unlocks: ['outreachHub'],
    },
    {
      


      id: 'greenhaven', tree: 'ci', currency: 'ci', name: 'Greenhaven', icon: 'world',
      cost: 400, x: 960, y: 1770, req: ['staffing'],
      altUnlock: 'yardBare',
      desc: 'Opens Greenhaven: two 3,000 kg tips, two Grove Plots and the Tree Planter. Free ' +
            'once the Wastelands are bare.',
      unlocks: ['treePlanter'],
    },
    {
      id: 'magnetics', tree: 'ci', currency: 'ci', name: 'Magnetics', icon: 'magnet',
      cost: 250, x: 1260, y: 1050, req: ['weightSorting'],
      desc: '3 KW/h turns 1 kg/h of heavy trash into metal at 15.50 a kg.',
      unlocks: ['magnetSeparator'],
    },
    {
      id: 'powerRouting', tree: 'ci', currency: 'ci', name: 'Power Routing', icon: 'split',
      cost: 175, x: 1560, y: 330, req: ['powerStore'],
      desc: 'Divides one energy wire between two, in whatever proportion you type.',
      unlocks: ['powerSplitter'],
    },

    





    {
      id: 'eddyCurrents', tree: 'ci', currency: 'ci', name: 'Eddy Currents', icon: 'eddy',
      cost: 313, x: 1560, y: 1050, req: ['magnetics'],
      desc: '4 KW/h splits 1 kg/h of metal into aluminium at 29 and steel at 15. Starve it ' +
            'and you get the steel.',
      unlocks: ['eddySeparator'],
    },
    {
      id: 'hazardHandling', tree: 'ci', currency: 'ci', name: 'Hazard Handling', icon: 'hazard',
      cost: 375, x: 1260, y: 1530, req: ['weightSorting'],
      desc: '2 WF/h works 3 kg/h of light trash into 1 kg/h of hazardous waste at 29 a kg. ' +
            'Nothing burns it.',
      unlocks: ['hazardPlant'],
    },
    {
      id: 'cellAssembly', tree: 'ci', currency: 'ci', name: 'Cell Assembly', icon: 'cell',
      cost: 438, x: 1860, y: 1290, req: ['eddyCurrents', 'hazardHandling'],
      desc: '3 kg/h aluminium, 1 kg/h hazardous waste and 5 WF/h make 1 kg/h of batteries at ' +
            '155 a kg.',
      unlocks: ['cellAssembler'],
    },
    {
      id: 'bigStorage', tree: 'ci', currency: 'ci', name: 'Deep Storage', icon: 'vault',
      cost: 1000, x: 1860, y: 90, req: ['powerRouting'],
      desc: '50 KW instead of 10, and ten sockets instead of five.',
      unlocks: ['powerVault'],
    },
    {
      id: 'labourHire', tree: 'ci', currency: 'ci', name: 'Labour Exchange', icon: 'exchange',
      cost: 875, x: 1260, y: 2010, req: ['outreach'],
      desc: 'Up to ten hands for up to an hour, at 80% more per hand than a Hiring Post, with ' +
            'discounts for length and size.',
      unlocks: ['labourExchange'],
    },
    {
      id: 'fineSorting', tree: 'ci', currency: 'ci', name: 'Fine Sorting', icon: 'fine',
      cost: 250, x: 1560, y: 1770, req: ['hazardHandling'],
      desc: '3 WF/h picks 1 kg/h of light trash apart into plastic at 13.50 and organic waste ' +
            'at 7. Short of hands, you get the compost.',
      unlocks: ['fineSorter'],
    },
    {
      id: 'fertilising', tree: 'ci', currency: 'ci', name: 'Fertilising', icon: 'fert',
      cost: 1125, x: 1860, y: 1530, req: ['fineSorting', 'hazardHandling'],
      desc: 'Hazardous and organic waste with 5 KW make fertilizer. A load fed to a Tree ' +
            'Planter is +10% to what it grows and to what its basket holds, up to double.',
      unlocks: ['fertilizerPlant'],
    },
    {
      id: 'gridForging', tree: 'ci', currency: 'ci', name: 'Grid Forging', icon: 'forge',
      cost: 563, x: 2160, y: 1050, req: ['cellAssembly'],
      







      desc: 'Batteries and steel raise a permanent array that makes what a Wind Turbine ' +
            'makes. Each array after it wants a fifth more than the first.',
      unlocks: ['gridFoundry'],
    },
    {
      







      id: 'cleanAir', tree: 'ci', currency: 'ci', name: 'Clean Air', icon: 'aircleaner',
      cost: 5690, x: 2460, y: 1050, req: ['gridForging'],
      desc: 'The sky can be cleaned too, slowly, for as long as there is power.',
      unlocks: ['airCleaner'],
    },
    {
      












      id: 'robotics', tree: 'ci', currency: 'ci', name: 'Robotics', icon: 'robot',
      cost: 7110, x: 2760, y: 1050, req: ['cleanAir'],
      desc: 'Hands that run on power instead of wages.',
      unlocks: ['robot'],
    },

    





    {
      id: 'rubbleSorting', tree: 'ci', currency: 'ci', name: 'Rubble Sorting', icon: 'rubble',
      cost: 300, x: 1260, y: 810, req: ['weightSorting'],
      





      desc: '2 WF/h and 2 KW/h break 1 kg/h of heavy trash into glass and aggregate, worth ' +
            'the same. Crew pulls toward glass, power toward aggregate.',
      unlocks: ['rubbleSorter'],
    },
    



    {
      id: 'timberReclaiming', tree: 'ci', currency: 'ci', name: 'Timber Reclaiming',
      icon: 'timber',
      cost: 5200, x: 1560, y: 810, req: ['rubbleSorting'],
      desc: '3 kg/h of aggregate and 3 WF/h make 1 kg/h of scrap timber at 64 a kg.',
      unlocks: ['timberReclaimer'],
    },
    {
      id: 'charring', tree: 'ci', currency: 'ci', name: 'Charring', icon: 'kiln',
      cost: 6300, x: 1860, y: 330, req: ['timberReclaiming'],
      desc: '5 KW/h bakes 1 kg/h of scrap timber down into 0.5 kg/h of charcoal. Half the ' +
            'weight goes, and the rest is worth far more a kilo.',
      unlocks: ['charKiln'],
    },
    {
      id: 'fibrePressing', tree: 'ci', currency: 'ci', name: 'Fibre Pressing', icon: 'press',
      cost: 33905, x: 2160, y: 90, req: ['charring'],
      desc: 'A second road to timber, from 4 kg/h of organic waste and 3 WF/h, out of the ' +
            'half you were throwing away.',
      unlocks: ['fibrePress'],
    },
    





    





    








    {
      id: 'fluidStorage', tree: 'ci', currency: 'ci', name: 'Fluid Storage', icon: 'tank',
      cost: 10335, x: 2160, y: 2010, req: ['refining'],
      desc: 'A drum that holds one fluid and keeps it when you carry it. Nothing else moves a ' +
            'fluid between places.',
      unlocks: ['fluidTank'],
    },
    





    {
      id: 'mirewater', tree: 'ci', currency: 'ci', name: 'Mirewater', icon: 'pool',
      cost: 21700, x: 2160, y: 570, req: ['charring'],
      







      altUnlock: 'placesBelowDone',
      




      



      desc: 'Opens Mirewater: two big tips, a double grove and two Polluted Pools. A Pump ' +
            'lifts the dirty water out, a Cleaner runs it through charcoal, and the Clean Index ' +
            'is paid when it goes back.',
      unlocks: ['waterPump', 'waterCleaner'],
    },
    






    {
      id: 'blackmere', tree: 'ci', currency: 'ci', name: 'Blackmere', icon: 'slick',
      cost: 82781, x: 2460, y: 570, req: ['mirewater'],
      

      altUnlock: 'placesBelowDone',
      desc: 'Three tips, two groves, three Oil Spills. Take the crude, put the water back for Clean ' +
            'Index.',
      unlocks: ['oilSeparator'],
    },
    




    






    {
      id: 'diamondPressing', tree: 'ci', currency: 'ci', name: 'Diamond Pressing', icon: 'dpress',
      cost: 14880, x: 2460, y: 330, req: ['charring'],
      










      desc: 'A press that squeezes charcoal into diamonds, a batch at a time. Each batch ' +
            'is bigger than the last, and every fifth pays a stone more. A diamond ends ' +
            'up costing what the first one did.',
      unlocks: ['diamondPress', 'prioPowerSplitter'],   
    },
    












    {
      id: 'brewing', tree: 'ci', currency: 'ci', name: 'Field Brewing', icon: 'brewvat',
      cost: 17856, x: 1860, y: 1770, req: ['fineSorting'],
      
      desc: 'A Brew Vat, which ferments organic waste in a heated glass vessel into Field ' +
            'Tonic. Every kilogram a Volunteer drinks makes it permanently faster, and the ' +
            'next one costs a little more.',
      unlocks: ['brewVat'],
    },
    {
      id: 'bladeFitting', tree: 'ci', currency: 'ci', name: 'Blade Fitting', icon: 'bladeworks',
      cost: 21427, x: 1860, y: 810, req: ['eddyCurrents'],
      desc: 'A Blade Works, laying up Blade Kits from plastic and aluminium. Every kilogram a ' +
            'Wind Turbine takes makes it permanently stronger; the next costs a little more.',
      unlocks: ['bladeWorks'],
    },
    {
      id: 'glazing', tree: 'ci', currency: 'ci', name: 'Glazing', icon: 'glazing',
      cost: 26783, x: 2160, y: 810, req: ['bladeFitting'],
      desc: 'Kits pressed from lead and glass. Each load makes a Solar Panel stronger for good.',
      unlocks: ['glazingWorks'],
    },
    






    {
      id: 'acidRecovery', tree: 'ci', currency: 'ci', name: 'Acid Recovery', icon: 'acid',
      cost: 33479, x: 2460, y: 810, req: ['glazing'],
      desc: 'Hazardous waste and charcoal, cracked back into acid. It pours, so it needs a Fluid ' +
            'Tank.',
      unlocks: ['acidWorks'],
    },
    





    {
      id: 'advCells', tree: 'ci', currency: 'ci', name: 'Advanced Cells', icon: 'etching',
      cost: 41849, x: 2760, y: 810, req: ['acidRecovery'],
      desc: 'Cells etched from acid and aluminium. Each load makes a Storm Turbine stronger for ' +
            'good. Fluids get a splitter of their own.',
      




      unlocks: ['etchingWorks', 'fluidSplitter'],
    },
    {
      


      id: 'goldRecovery', tree: 'ci', currency: 'ci', name: 'Gold Recovery', icon: 'leach',
      cost: 52311, x: 3060, y: 570, req: ['advCells'],
      desc: 'Scrap metal dissolved in acid until the gold drops out.',
      unlocks: ['leachingPlant', 'circuitWorks'],
    },
    {
      







      id: 'panelFitting', tree: 'ci', currency: 'ci', name: 'Panel Fitting', icon: 'panelworks',
      cost: 65389, x: 3360, y: 570, req: ['goldRecovery'],
      desc: 'Kits of glass and microschemes. Each one a Robot takes covers more of its ' +
            'own power, while the sun is up.',
      unlocks: ['panelWorks'],
    },
    





















    



















    {
      id: 'biodomes', tree: 'ci', currency: 'ci', name: 'Biodomes', icon: 'biodome',
      cost: 81736, x: 3060, y: 1050, req: ['robotics'],
      desc: 'Domes you build once. They keep working after the ground is bare.',
      unlocks: ['biodome', 'prioCrewSplitter'],   
    },
    





    {
      id: 'glowmoor', tree: 'ci', currency: 'ci', name: 'Glowmoor', icon: 'glow',
      cost: 102170, x: 2760, y: 570, req: ['blackmere'],
      altUnlock: 'placesBelowDone',
      desc: 'Four tips, two groves, a pool, a spill and two Nuclear Waste Sites.',
      unlocks: ['wasteCleaner', 'gearWorks', 'repository'],
    },
    




    {
      id: 'banking', tree: 'ci', currency: 'ci', name: 'Banking', icon: 'bank',
      cost: 125000, x: 3360, y: 810, req: ['goldRecovery'],
      desc: 'Gold kept in a vault earns money for as long as it stays there.',
      unlocks: ['bank'],
    },
    



    {
      id: 'nuclearPower', tree: 'ci', currency: 'ci', name: 'Nuclear Power', icon: 'reactor',
      cost: 156000, x: 3060, y: 330, req: ['glowmoor'],
      desc: 'Uranium rods recovered from nuclear waste, and a reactor to burn them.',
      unlocks: ['rodWorks', 'reactor'],
    },
    

    {
      id: 'rocketry', tree: 'ci', currency: 'ci', name: 'Orbital Cleanup', icon: 'rocket',   
      cost: 190000, x: 3360, y: 330, req: ['nuclearPower'],
      desc: 'Turbofuel, and a rocket that flies up to clear orbital scrap and brings the metal home.',
      unlocks: ['turbofuelRefinery', 'rocket'],
    },
    




    {
      id: 'printing', tree: 'ci', currency: 'ci', name: 'Printing', icon: 'printworks',
      cost: 240000, x: 3720, y: 330, req: ['rocketry'],
      desc: 'Timber into paper, and a press that turns materials into boosts and diamonds.',
      unlocks: ['paperMill', 'printWorks'],
    },
    {
      id: 'bulkTrade', tree: 'ci', currency: 'ci', name: 'Bulk Trade', icon: 'floor',
      cost: 450, x: 960, y: 1530, req: ['staffing'],
      desc: 'A Market and a Landfill with two sockets each. Every WF/h banks 2 $/h at the one ' +
            'and 2 CI/h at the other.',
      unlocks: ['tradingFloor', 'burnYard'],
    },
    {
      id: 'refining', tree: 'ci', currency: 'ci', name: 'Refining', icon: 'pyro',
      cost: 600, x: 1860, y: 2010, req: ['fineSorting'],
      desc: '4 KW/h cooks 1 kg/h of plastic into 0.5 kg/h of oil at $54 a kilogram.',
      







      unlocks: ['pyrolysisPlant'],
    },
    {
      id: 'forecasting', tree: 'ci', currency: 'ci', name: 'Forecasting', icon: 'forecast',
      cost: 400, x: 1260, y: 1770, req: ['greenhaven'],
      desc: 'Thirty seconds of warning before every cataclysm, and each warning costs 10 KW.',
      unlocks: ['forecastMast'],
    },
    {
      id: 'oilPower', tree: 'ci', currency: 'ci', name: 'Oil Power', icon: 'oilgen',
      cost: 750, x: 2160, y: 1770, req: ['refining'],
      desc: '1 kg/h of oil becomes 30 KW/h, and every KW-hour gives up 0.4 Clean Index.',
      unlocks: ['oilGenerator'],
    },

    















































    {
      id: 'extraHands', tree: 'money', currency: 'money', name: 'Extra Hands', icon: 'player',
      x: 2760, y: 3340, req: [],
      



      maxLevel: 5, weight: 0.35,
      desc: 'Every Volunteer works a little harder.',
      effects: [{ stat: 'player.wfRate', op: 'add', value: 0.15 }],
    },

    
    {
      id: 'keenEye', tree: 'money', currency: 'money', name: 'Keen Eye', icon: 'help',
      x: 2460, y: 3340, req: ['extraHands'],
      maxLevel: 5, weight: 0.6,
      







      desc: 'You spot the good stuff faster.',
      effects: [{ stat: 'swipe.ciPerEntry', op: 'add', value: 0.001 }],
    },
    {
      id: 'strongBacks', tree: 'money', currency: 'money', name: 'Strong Backs', icon: 'msStrongBacks',
      x: 2160, y: 3970, req: ['keenEye'],
      maxLevel: 5, weight: 3.24,
      



      desc: 'A second wind for the crew.',
      effects: [{ stat: 'player.wfRate', op: 'add', value: 0.25 }],
    },

    
    {
      id: 'haggling', tree: 'money', currency: 'money', name: 'Haggling', icon: 'market',
      x: 3060, y: 3340, req: ['extraHands'],
      maxLevel: 5, weight: 1.2,
      desc: 'Talk up the ordinary stuff.',
      effects: [{ stat: 'market.value.trash', op: 'add', value: 0.05 }],
    },
    {
      id: 'greenPremium', tree: 'money', currency: 'money', name: 'Green Premium', icon: 'recycler',
      x: 3360, y: 2695, req: ['haggling'],
      maxLevel: 5, weight: 1.2,
      desc: 'Buyers pay more for recycled goods.',
      effects: [{ stat: 'market.value.rtrash', op: 'add', value: 0.1 }],
    },
    {
      id: 'fairTrade', tree: 'money', currency: 'money', name: 'Fair Trade', icon: 'money',
      x: 3660, y: 2695, req: ['greenPremium'],
      maxLevel: 5, weight: 0.88,
      desc: 'A better name in the market lifts every price at once.',
      
      
      effects: [
        { stat: 'market.value.trash',  op: 'add', value: 0.02 },
        { stat: 'market.value.rtrash', op: 'add', value: 0.04 },
        { stat: 'market.value.light',  op: 'add', value: 0.12 },
        { stat: 'market.value.heavy',  op: 'add', value: 0.015 },
      ],
    },
    {
      id: 'wideStalls', tree: 'money', currency: 'money', name: 'Wide Stalls', icon: 'msWideStalls',
      x: 3960, y: 3220, req: ['fairTrade'],
      maxLevel: 5, weight: 0.32,
      desc: 'A bigger cash box, so the Market runs longer without you.',
      effects: [{ stat: 'market.collect.cap', op: 'add', value: 5 }],
    },

    
    {
      id: 'densePacking', tree: 'money', currency: 'money', name: 'Dense Packing', icon: 'landfill',
      x: 2760, y: 3670, req: ['extraHands'],
      maxLevel: 5, weight: 1.5,
      desc: 'Squeeze more out of ordinary trash.',
      effects: [{ stat: 'landfill.value.trash', op: 'add', value: 0.05 }],
    },
    {
      id: 'purityBonus', tree: 'money', currency: 'money', name: 'Purity Bonus', icon: 'sorter',
      x: 3020, y: 4000, req: ['densePacking'],
      maxLevel: 5, weight: 1.5,
      desc: 'The cleaner the feedstock, the better it burns.',
      effects: [{ stat: 'landfill.value.rtrash', op: 'add', value: 0.1 }],
    },
    {
      id: 'richSoil', tree: 'money', currency: 'money', name: 'Rich Soil', icon: 'msRichSoil',
      x: 3020, y: 4330, req: ['purityBonus'],
      maxLevel: 5, weight: 0.88,
      desc: 'Better ground chemistry lifts every grade at once.',
      effects: [
        { stat: 'landfill.value.trash',  op: 'add', value: 0.02 },
        { stat: 'landfill.value.rtrash', op: 'add', value: 0.04 },
        { stat: 'landfill.value.light',  op: 'add', value: 0.12 },
        { stat: 'landfill.value.heavy',  op: 'add', value: 0.015 },
      ],
    },
    {
      id: 'deepFill', tree: 'money', currency: 'money', name: 'Deep Fill', icon: 'msDeepFill',
      x: 2890, y: 4660, req: ['richSoil'],
      maxLevel: 5, weight: 0.32,
      desc: 'Room for a bigger fire before the pile jams.',
      effects: [{ stat: 'landfill.collect.cap', op: 'add', value: 5 }],
    },

    
    {
      id: 'tallerMasts', tree: 'money', currency: 'money', name: 'Taller Masts', icon: 'turbine',
      x: 2760, y: 3010, req: ['extraHands'],
      maxLevel: 5, weight: 1.8,
      desc: 'Higher masts, steadier wind.',
      effects: [{ stat: 'windTurbine.energyRate', op: 'add', value: 0.15 }],
    },
    {
      id: 'brightPanels', tree: 'money', currency: 'money', name: 'Bright Panels', icon: 'solar',
      x: 1769, y: 2680, req: ['tallerMasts'],
      maxLevel: 5, weight: 2.3,
      desc: 'Cleaner glass and better tracking.',
      effects: [{ stat: 'solarPanel.energyRate', op: 'add', value: 0.2 }],
    },
    





    {
      id: 'longerBlades', tree: 'money', currency: 'money', name: 'Longer Blades', icon: 'msLongerBlades',
      x: 2760, y: 2680, req: ['tallerMasts'],
      maxLevel: 5, weight: 2,
      desc: 'Longer blades sweep a wider circle.',
      effects: [{ stat: 'windTurbine.energyRate', op: 'add', value: 0.2 }],
    },
    



















    {
      id: 'balancedBlades', tree: 'money', currency: 'money', name: 'Balanced Blades',
      icon: 'bladeworks',
      x: 2760, y: 2350, req: ['longerBlades'], gate: 'bladeWorks',
      maxLevel: 5, weight: 0.9,
      desc: 'Weigh every blade before it goes up, and a Blade Kit goes further.',
      effects: [{ stat: 'windTurbine.powerUp.boost', op: 'add', value: 0.01 }],
    },
    {
      id: 'mirrorBanks', tree: 'money', currency: 'money', name: 'Mirror Banks', icon: 'msMirrorBanks',
      x: 2110, y: 2350, req: ['brightPanels'],
      maxLevel: 5, weight: 2.6,
      desc: 'Mirrors either side, throwing the light back onto the cells.',
      effects: [{ stat: 'solarPanel.energyRate', op: 'add', value: 0.3 }],
    },
    











    {
      id: 'lowIron', tree: 'money', currency: 'money', name: 'Low Iron', icon: 'glazing',
      x: 2240, y: 2020, req: ['mirrorBanks'], gate: 'glazingWorks',
      



      maxLevel: 5, weight: 0.83,
      desc: 'Less iron in the melt. The pane passes more light.',
      effects: [{ stat: 'solarPanel.powerUp.boost', op: 'add', value: 0.01 }],
    },
    












    {
      id: 'fineEtch', tree: 'money', currency: 'money', name: 'Fine Etch', icon: 'etching',
      x: 2500, y: 2020, req: ['galeRigging'], gate: 'etchingWorks',
      maxLevel: 5, weight: 0.89,
      desc: 'Finer tunnels fit more surface in the same foil.',
      effects: [{ stat: 'stormTurbine.powerUp.boost', op: 'add', value: 0.01 }],
    },
    {
      id: 'galeRigging', tree: 'money', currency: 'money', name: 'Gale Rigging', icon: 'msGaleRigging',
      x: 2500, y: 2350, req: ['stormChasers'],
      maxLevel: 5, weight: 2,
      desc: 'Rigging that holds in a full gale, so the big masts stay up.',
      effects: [{ stat: 'stormTurbine.energyRate', op: 'add', value: 0.25 }],
    },
    {
      id: 'denseCells', tree: 'money', currency: 'money', name: 'Dense Cells', icon: 'battery',
      x: 1428, y: 2350, req: ['brightPanels'],
      maxLevel: 5, weight: 1.3,
      desc: 'Pack the cells tighter and the night lasts longer.',
      effects: [{ stat: 'powerStorage.store', op: 'add', value: 0.5 }],
    },
    {
      id: 'bigCells', tree: 'money', currency: 'money', name: 'Big Cells', icon: 'msBigCells',
      x: 1135, y: 2020, req: ['denseCells'],
      maxLevel: 5, weight: 2.1,
      desc: 'A second bank of cells.',
      effects: [{ stat: 'powerStorage.store', op: 'add', value: 1 }],
    },

    





    {
      id: 'lightFreight', tree: 'money', currency: 'money', name: 'Light Freight', icon: 'msLightFreight',
      x: 3960, y: 2170, req: ['fairTrade'],
      maxLevel: 5, weight: 0.48,
      desc: 'Light trash travels cheap and sells dear.',
      effects: [{ stat: 'market.value.light', op: 'add', value: 0.3 }],
    },
    {
      id: 'scrapBroker', tree: 'money', currency: 'money', name: 'Scrap Broker', icon: 'msScrapBroker',
      x: 4260, y: 1480, req: ['lightFreight'],
      maxLevel: 5, weight: 0.26,
      desc: 'Even the heavy dregs a Weight Sorter leaves behind are worth selling.',
      effects: [{ stat: 'market.value.heavy', op: 'add', value: 0.07 }],
    },
    {
      id: 'cleanAsh', tree: 'money', currency: 'money', name: 'Clean Ash', icon: 'msCleanAsh',
      x: 3150, y: 4660, req: ['richSoil'],
      maxLevel: 5, weight: 0.48,
      desc: 'Light trash burns clean.',
      effects: [{ stat: 'landfill.value.light', op: 'add', value: 0.3 }],
    },
    {
      id: 'deepCompaction', tree: 'money', currency: 'money', name: 'Deep Compaction', icon: 'msDeepCompaction',
      x: 3020, y: 4990, req: ['cleanAsh'],
      maxLevel: 5, weight: 0.26,
      desc: 'Crush the heavy stuff down before it goes in.',
      effects: [{ stat: 'landfill.value.heavy', op: 'add', value: 0.07 }],
    },
    {
      id: 'stormChasers', tree: 'money', currency: 'money', name: 'Storm Chasers', icon: 'msStormChasers',
      x: 2500, y: 2680, req: ['tallerMasts'],
      maxLevel: 5, weight: 1.7,
      desc: 'Point the big masts at the weather.',
      effects: [{ stat: 'stormTurbine.energyRate', op: 'add', value: 0.15 }],
    },
    {
      id: 'practisedHands', tree: 'money', currency: 'money', name: 'Practised Hands', icon: 'msPractisedHands',
      x: 1860, y: 4600, req: ['strongBacks'],
      maxLevel: 5, weight: 2.88,
      

      desc: 'You know exactly where to look now.',
      effects: [{ stat: 'swipe.ciPerEntry', op: 'add', value: 0.003 }],
    },
    {
      id: 'greenThumb', tree: 'money', currency: 'money', name: 'Green Thumb', icon: 'tree',
      x: 1560, y: 4600, req: ['practisedHands'],
      maxLevel: 5, weight: 1.404,
      


      desc: 'Better saplings and better soil.',
      effects: [{ stat: 'treePlanter.ciPerWF', op: 'add', value: 0.15 }],
    },

    





    {
      



      id: 'scrapTrade', tree: 'money', currency: 'money', name: 'Scrap Trade', icon: 'magnet',
      x: 4560, y: 1480, req: ['scrapBroker'], gate: 'magnetSeparator',
      maxLevel: 5, weight: 0.47,
      desc: 'Metal sits outside the trash trade, and this is your way in.',
      effects: [{ stat: 'market.value.metal', op: 'add', value: 0.5 }],
    },
    {
      














      id: 'fasterServos', tree: 'money', currency: 'money', name: 'Faster Servos',
      icon: 'robot',
      x: 960, y: 4060, req: ['longContracts'],
      maxLevel: 5, weight: 1.8,
      desc: 'Quicker joints get through more work in the same hour.',
      effects: [{ stat: 'robot.wfRate', op: 'add', value: 0.5 }],
    },
    {
      













      id: 'efficientAutodrive', tree: 'money', currency: 'money', name: 'Efficient Autodrive',
      icon: 'msAutodrive',
      x: 660, y: 4060, req: ['fasterServos'],
      maxLevel: 5, weight: 0.72,
      desc: 'Smoother control wastes less of the push.',
      effects: [{ stat: 'robot.overdrive.drain', op: 'add', value: -0.05 }],
    },
    {
      







      id: 'chargeBanks', tree: 'money', currency: 'money', name: 'Charge Banks',
      icon: 'msChargeBanks',
      x: 360, y: 4060, req: ['efficientAutodrive'],
      maxLevel: 5, weight: 0.45,
      desc: 'More cells inside, so it holds a longer run.',
      effects: [{ stat: 'robot.bank', op: 'add', value: 3 }],
    },
    {
      

















      id: 'thinFilm', tree: 'money', currency: 'money', name: 'Thin Film',
      icon: 'panelworks',
      x: 60, y: 4060, req: ['chargeBanks'],
      maxLevel: 5, weight: 0.36,
      desc: 'Thinner cells spread further, so a fitting takes less.',
      effects: [{ stat: 'robot.powerUp.kg', op: 'mul', value: 0.96 }],
    },
    {
      

      id: 'extraShift', tree: 'money', currency: 'money', name: 'Extra Shift', icon: 'hire',
      x: 1860, y: 3760, req: ['strongBacks'],
      maxLevel: 1, weight: 21.6,
      desc: 'One more hand at the gate, so a single post can carry a crew.',
      effects: [{ stat: 'hiringPost.hire.max', op: 'add', value: 1 }],
    },
    {
      id: 'persuasiveOutreach', tree: 'money', currency: 'money', name: 'Persuasive Outreach',
      icon: 'outreach',
      x: 1560, y: 3580, req: ['extraShift'],
      maxLevel: 3, weight: 3.78,
      desc: 'A better pitch brings people in for less.',
      effects: [{ stat: 'outreachHub.need.wf', op: 'mul', value: 0.98 }],
    },
    {
      id: 'efficientOutreach', tree: 'money', currency: 'money', name: 'Efficient Outreach',
      icon: 'msPlugSaver',
      x: 1260, y: 3580, req: ['persuasiveOutreach'],
      maxLevel: 3, weight: 2.100001,
      desc: 'Less kit to power, so a recruit costs less energy.',
      effects: [{ stat: 'outreachHub.need.kw', op: 'mul', value: 0.98 }],
    },
    {
      id: 'bulkHaulage', tree: 'money', currency: 'money', name: 'Bulk Haulage', icon: 'msBulkHaulage',
      x: 4260, y: 2620, req: ['lightFreight'],
      
      
      maxLevel: 5, weight: 0.16,
      desc: 'Move the light stuff by the pallet.',
      effects: [{ stat: 'market.value.light', op: 'add', value: 0.1 }],
    },
    {
      id: 'fineAsh', tree: 'money', currency: 'money', name: 'Fine Ash', icon: 'msFineAsh',
      x: 3280, y: 4990, req: ['cleanAsh'],
      maxLevel: 5, weight: 0.16,       
      desc: 'Grind it finer before it goes on the fire.',
      effects: [{ stat: 'landfill.value.light', op: 'add', value: 0.1 }],
    },
    






    {
      



      id: 'marketStanding', tree: 'money', currency: 'money', name: 'Market Standing',
      icon: 'msMarketStanding',
      x: 4260, y: 3100, req: ['wideStalls'],
      maxLevel: 3, weight: 6.2,   
      
      
      desc: 'A name that carries, and everything you sell is worth more for it.',
      effects: [
        { stat: 'market.value.trash',   op: 'mul', value: 1.01 },
        { stat: 'market.value.rtrash',  op: 'mul', value: 1.01 },
        { stat: 'market.value.light',   op: 'mul', value: 1.01 },
        { stat: 'market.value.heavy',   op: 'mul', value: 1.01 },
        { stat: 'market.value.metal',   op: 'mul', value: 1.01 },
        { stat: 'market.value.alu',     op: 'mul', value: 1.01 },
        { stat: 'market.value.steel',   op: 'mul', value: 1.01 },
        { stat: 'market.value.hazard',  op: 'mul', value: 1.01 },
        { stat: 'market.value.cell',    op: 'mul', value: 1.01 },
        { stat: 'market.value.plastic', op: 'mul', value: 1.01 },
        { stat: 'market.value.organic', op: 'mul', value: 1.01 },
        { stat: 'market.value.fert',    op: 'mul', value: 1.01 },
      ],
    },
    {
      id: 'alloyBroker', tree: 'money', currency: 'money', name: 'Alloy Broker', icon: 'eddy',
      x: 4860, y: 1480, req: ['scrapTrade'], gate: 'eddySeparator',
      maxLevel: 5, weight: 0.88,   
      
      desc: 'Somebody who can tell aluminium from steel, and pays for both.',
      effects: [
        { stat: 'market.value.alu',   op: 'mul', value: 1.03 },
        { stat: 'market.value.steel', op: 'mul', value: 1.03 },
      ],
    },
    {
      id: 'refinedFreight', tree: 'money', currency: 'money', name: 'Refined Freight',
      icon: 'fine',
      x: 4560, y: 2620, req: ['bulkHaulage'], gate: 'hazardPlant',
      maxLevel: 5, weight: 1.48,   
      desc: 'The specialists pay properly for what comes out of light trash.',
      effects: [
        { stat: 'market.value.plastic', op: 'mul', value: 1.03 },
        { stat: 'market.value.organic', op: 'mul', value: 1.03 },
        { stat: 'market.value.hazard',  op: 'mul', value: 1.03 },
      ],
    },
    {
      






















      id: 'sealedFreight', tree: 'money', currency: 'money', name: 'Sealed Freight',
      icon: 'acid',
      x: 4860, y: 2740, req: ['refinedFreight'], gate: 'acidWorks',
      maxLevel: 5, weight: 0.5,
      desc: 'Sealed drums grade better.',
      effects: [
        { stat: 'market.value.acid',   op: 'mul', value: 1.01 },
        { stat: 'market.value.hazard', op: 'mul', value: 1.01 },
      ],
    },
    {
      


      id: 'tighterCells', tree: 'money', currency: 'money', name: 'Tighter Cells', icon: 'cell',
      x: 940, y: 1690, req: ['bigCells'], gate: 'gridFoundry',
      maxLevel: 5, weight: 2.16,
      desc: 'Waste less of every cell.',
      effects: [{ stat: 'gridFoundry.recipe.cell', op: 'mul', value: 0.97 }],
    },
    





    {
      id: 'leanFrames', tree: 'money', currency: 'money', name: 'Lean Frames', icon: 'forge',
      x: 940, y: 1360, req: ['tighterCells'], gate: 'gridFoundry',
      maxLevel: 5, weight: 1.368,
      desc: 'A lighter mast holds up just as well.',
      effects: [{ stat: 'gridFoundry.recipe.steel', op: 'mul', value: 0.97 }],
    },
    

























    





    {
      id: 'pureCarbon', tree: 'money', currency: 'money', name: 'Pure Carbon', icon: 'msPureCarbon',
      x: 940, y: 1030, req: ['leanFrames'], gate: 'diamondPress',
      maxLevel: 5, weight: 0.756,
      desc: 'Screen the ash out and press what is left.',
      effects: [{ stat: 'diamondPress.recipe.coal', op: 'mul', value: 0.97 }],
    },
    {
      id: 'tunedPress', tree: 'money', currency: 'money', name: 'Tuned Press', icon: 'dpress',
      x: 940, y: 700, req: ['pureCarbon'], gate: 'diamondPress',
      maxLevel: 5, weight: 0.9,
      desc: 'Squarer platens waste less of the push.',
      effects: [{ stat: 'diamondPress.recipe.kw', op: 'mul', value: 0.97 }],
    },
    




    





    {
      id: 'cleanTraces', tree: 'money', currency: 'money', name: 'Clean Traces', icon: 'circuit',
      x: 5160, y: 1600, req: ['alloyBroker'], gate: 'circuitWorks',
      maxLevel: 3, weight: 20.412,
      desc: 'Fewer flawed traces, so buyers pay more for each microscheme.',
      effects: [{ stat: 'market.value.chip', op: 'mul', value: 1.02 }],
    },
    {
      id: 'lightCut', tree: 'money', currency: 'money', name: 'Light Cut', icon: 'refinery',
      x: 5160, y: 2860, req: ['crudePremium'], gate: 'turbofuelRefinery',
      maxLevel: 5, weight: 20.9952,
      desc: 'A cleaner cut of turbofuel, and buyers pay more for it.',
      effects: [{ stat: 'market.value.turbofuel', op: 'mul', value: 1.02 }],
    },
    {
      id: 'domeGardens', tree: 'money', currency: 'money', name: 'Dome Gardens', icon: 'biodome',
      x: 960, y: 4540, req: ['canopyCover'], gate: 'biodome',
      maxLevel: 5, weight: 39.680928,
      desc: 'Denser beds inside every finished dome.',
      
      effects: [{ stat: 'biodome.recipe.ci', op: 'add', value: 1 }],
    },
    {
      id: 'widerNets', tree: 'money', currency: 'money', name: 'Wider Nets', icon: 'rknet',
      x: 5460, y: 1780, req: ['leadSeam'], gate: 'rocket',
      maxLevel: 5, weight: 6.9984,
      desc: 'A wider net catches more scrap on every flight.',
      

      effects: [{ stat: 'rocket.flight.metal', op: 'add', value: 25 },
                { stat: 'rocket.outBuffer', op: 'add', value: 25, quiet: true }],
    },
    {
      id: 'quickTurnaround', tree: 'money', currency: 'money', name: 'Quick Turnaround', icon: 'rkturn',
      x: 5760, y: 1780, req: ['widerNets'], gate: 'rocket',
      maxLevel: 5, weight: 4.0824,
      desc: 'A trimmed flight path brings each rocket home sooner.',
      
      effects: [{ stat: 'rocket.flight.sec', op: 'mul', value: 0.97 }],
    },
    






    {
      id: 'busySky', tree: 'money', currency: 'money', name: 'Busy Sky', icon: 'mkBusy',
      x: 5460, y: 940, req: ['leadSeam'], gate: 'oreDigger', demo: false,
      maxLevel: 5, weight: 1.2,
      desc: 'Meteorites fall more often.',
      
      effects: [{ stat: 'asteroid.chancePct', op: 'add', value: 0.2 }],
    },
    {
      id: 'heavierRocks', tree: 'money', currency: 'money', name: 'Heavier Rocks', icon: 'mkHeavy',
      x: 5760, y: 1060, req: ['busySky'], gate: 'oreDigger', demo: false,
      maxLevel: 5, weight: 0.8,
      desc: 'Every meteorite that lands is heavier.',
      
      effects: [{ stat: 'asteroid.kg', op: 'add', value: 10 }],
    },
    {
      id: 'luckySky', tree: 'money', currency: 'money', name: 'Lucky Sky', icon: 'mkLucky',
      x: 5760, y: 820, req: ['busySky'], gate: 'oreDigger', demo: false,
      maxLevel: 5, weight: 0.9,
      desc: 'More of the meteorites that fall are the rare kind.',
      
      effects: [{ stat: 'asteroid.rarePct', op: 'add', value: 1 }],
    },
    {
      id: 'openGround', tree: 'money', currency: 'money', name: 'Open Ground', icon: 'mkGround',
      x: 6060, y: 820, req: ['luckySky'], gate: 'oreDigger', demo: false,
      maxLevel: 1, weight: 4,
      desc: 'One more meteorite can lie on the ground at once.',
      
      effects: [{ stat: 'asteroid.maxDown', op: 'add', value: 1 }],
    },
    {
      id: 'longDay', tree: 'money', currency: 'money', name: 'Long Day', icon: 'mkDay',
      x: 1980, y: 2020, req: ['mirrorBanks'], demo: false,
      maxLevel: 5, weight: 1.8,
      desc: 'Longer days and shorter nights over every Solar Panel.',
      



      effects: [{ stat: 'solarPanel.duty.onSec', op: 'add', value: 6 },
                { stat: 'solarPanel.duty.offSec', op: 'add', value: -6, quiet: true }],
    },
    {
      id: 'keenGlint', tree: 'money', currency: 'money', name: 'Keen Glint', icon: 'mkGlint',
      x: 810, y: 370, req: ['tunedPress'], gate: 'diamondPress', demo: false,
      maxLevel: 5, weight: 1.6,
      desc: 'Diamonds turn up sooner.',
      
      effects: [{ stat: 'gem.everySec', op: 'add', value: -3 }],
    },
    {
      id: 'lastingBoosts', tree: 'money', currency: 'money', name: 'Lasting Boosts', icon: 'mkLasting',
      x: 810, y: 40, req: ['keenGlint'], gate: 'diamondPress', demo: false,
      maxLevel: 5, weight: 1.6,
      desc: 'Every boost with a timer runs longer.',
      
      effects: [{ stat: 'boost.sec', op: 'add', value: 6 }],
    },
    {
      id: 'nightShift', tree: 'money', currency: 'money', name: 'Night Shift', icon: 'mkNight',
      x: 1260, y: 3820, req: ['longShifts'], demo: false,
      maxLevel: 5, weight: 2,
      desc: 'The factory gets more done while you are away.',
      
      effects: [{ stat: 'offline.ratePct', op: 'add', value: 1 }],
    },
    {
      id: 'warmRollers', tree: 'money', currency: 'money', name: 'Warm Rollers', icon: 'printworks',
      x: 1070, y: 370, req: ['tunedPress'], gate: 'printWorks',
      maxLevel: 5, weight: 7.2,
      desc: 'Heated rollers set the ink faster, so each print needs less power.',
      effects: [{ stat: 'printWorks.print.kw', op: 'mul', value: 0.97 }],
    },
    {
      id: 'seedStock', tree: 'money', currency: 'money', name: 'Seed Stock', icon: 'msSeedStock',
      x: 960, y: 5020, req: ['canopyCover'],
      
      desc: 'A pocketful of better seed.',
      
      
      
      maxLevel: 5, weight: 1.08,
      effects: [{ stat: 'plant.ciPerEntry', op: 'add', value: 0.004 }],
    },
    {
      id: 'deepBanks', tree: 'money', currency: 'money', name: 'Deep Banks', icon: 'vault',
      x: 1330, y: 1690, req: ['bigCells'], gate: 'powerVault',
      maxLevel: 5, weight: 2.3,
      
      desc: 'A deeper bank, in the big Vault only.',
      effects: [{ stat: 'powerVault.store', op: 'add', value: 2.5 }],
    },
    {
      id: 'willingHands', tree: 'money', currency: 'money', name: 'Willing Hands', icon: 'msWillingHands',
      x: 1860, y: 3340, req: ['strongBacks'],
      maxLevel: 5, weight: 5.76,
      












      desc: 'Word gets round that you are worth helping.',
      effects: [{ stat: 'player.wfRate', op: 'add', value: 0.3 }],
    },
    








    {
      id: 'strongBrew', tree: 'money', currency: 'money', name: 'Strong Brew', icon: 'brewvat',
      x: 1560, y: 3340, req: ['willingHands'], gate: 'brewVat',
      maxLevel: 5, weight: 0.9,
      desc: 'Brew it thicker and a Field Tonic goes further.',
      effects: [{ stat: 'player.powerUp.boost', op: 'add', value: 0.01 }],
    },
    {
      

      id: 'longShifts', tree: 'money', currency: 'money', name: 'Long Shifts', icon: 'msLongShifts',
      x: 1560, y: 3940, req: ['extraShift'],
      maxLevel: 5, weight: 2.34,
      desc: 'Every hand stays a little longer, for the same money.',
      effects: [{ stat: 'hiringPost.hire.sec', op: 'add', value: 15 }],
    },
    {
      



      id: 'surgeArrestors', tree: 'money', currency: 'money', name: 'Surge Arrestors',
      icon: 'bolt',
      x: 1720, y: 2020, req: ['denseCells'], gate: 'powerStorage',
      









      maxLevel: 3, weight: 5,
      desc: 'Rods on every mast, and now and then a strike passes straight through.',
      effects: [{ stat: 'weather.blockChance', op: 'add', value: 0.01 }],
    },
    {
      

























      id: 'deepEarthing', tree: 'money', currency: 'money', name: 'Deep Earthing',
      icon: 'msDeepEarthing',
      x: 1850, y: 1690, req: ['surgeArrestors'], gate: 'powerStorage',
      maxLevel: 3, weight: 4,
      


      desc: 'The rods go deeper and the straps get thicker. More strikes find the ' +
            'ground instead of your grid.',
      effects: [{ stat: 'weather.blockChance', op: 'add', value: 0.02 }],
    },
    {
      id: 'canopyCover', tree: 'money', currency: 'money', name: 'Canopy Cover', icon: 'msCanopyCover',
      x: 1260, y: 4900, req: ['greenThumb'],
      maxLevel: 3, weight: 1.8,
      desc: 'Plant them close and let them shelter each other.',
      











      











      effects: [{ stat: 'treePlanter.ciPerWF', op: 'add', value: 0.3 },
                { stat: 'seedDrill.ciPerWF',   op: 'add', value: 0.2 }],
    },
    {
      



      





      id: 'steadyFeed', tree: 'money', currency: 'money', name: 'Steady Feed', icon: 'drill',
      x: 960, y: 4780, req: ['canopyCover'],
      maxLevel: 3, weight: 1.8,
      desc: 'The seed comes out at the same rate however fast you go.',
      effects: [{ stat: 'seedDrill.ciPerWF', op: 'add', value: 0.4 }],
    },
    {
      










      id: 'widerIntakes', tree: 'money', currency: 'money', name: 'Wider Intakes',
      icon: 'aircleaner',
      x: 960, y: 5260, req: ['canopyCover'],
      maxLevel: 5, weight: 1.8,
      desc: 'It can pull more air through at once.',
      effects: [{ stat: 'airCleaner.maxKw', op: 'add', value: 3 }],
    },
    {
      



















      id: 'fineFilters', tree: 'money', currency: 'money', name: 'Fine Filters',
      icon: 'msFineMesh',
      x: 660, y: 5260, req: ['widerIntakes'],
      maxLevel: 5, weight: 0.99,
      desc: 'A finer mesh takes more out of the same air.',
      effects: [{ stat: 'airCleaner.ciPerKW', op: 'add', value: 0.05 }],
    },
    


















    {
      id: 'deeperVaults', tree: 'money', currency: 'money', name: 'Deeper Vaults',
      icon: 'repository', x: 5460, y: 1540, req: ['leadSeam'],
      maxLevel: 5, weight: 6,
      desc: 'Shafts cut deeper into older, drier rock.',
      effects: [{ stat: 'repository.convert.ci', op: 'add', value: 40 }],
    },
    {
      id: 'betterRates', tree: 'money', currency: 'money', name: 'Better Rates',
      icon: 'msInterest', x: 5460, y: 1300, req: ['leadSeam'],
      maxLevel: 5, weight: 6,
      desc: 'The gold in the vault earns a higher rate.',
      effects: [{ stat: 'bank.interestPct', op: 'add', value: 0.5 }],
    },
    {
      id: 'biggerVaults', tree: 'money', currency: 'money', name: 'Bigger Vaults',
      icon: 'bank', x: 5760, y: 1300, req: ['betterRates'],
      maxLevel: 5, weight: 3.5,
      desc: 'More shelf room inside the vault.',
      effects: [{ stat: 'bank.buffer', op: 'add', value: 0.1 }],
    },
    



    {
      id: 'hotCore', tree: 'money', currency: 'money', name: 'Hotter Core',
      icon: 'reactor', x: 5760, y: 1540, req: ['deeperVaults'],
      maxLevel: 5, weight: 6,
      desc: 'Rods sit closer together, so more atoms split at once.',
      
      effects: [{ stat: 'reactor.fission.kw', op: 'add', value: 5 }],
    },
    {
      

















      id: 'leadSeam', tree: 'money', currency: 'money', name: 'Lead Seam', icon: 'oredig',
      x: 5160, y: 1360, req: ['alloyBroker'],
      gate: 'oreDigger',
      maxLevel: 5, weight: 1.1,
      desc: 'Reading the rock before breaking it, so the heavy seam is followed instead of ' +
          'crushed in with the rest.',
      effects: [{ stat: 'asteroid.mix.lead', op: 'add', value: 0.01 }],
    },
    {
      id: 'fullBaskets', tree: 'money', currency: 'money', name: 'Full Baskets', icon: 'msFullBaskets',
      x: 1260, y: 4300, req: ['greenThumb'],
      maxLevel: 3, weight: 0.576,
      desc: 'Somewhere to put them while nobody is looking.',
      effects: [{ stat: 'treePlanter.collect.cap', op: 'add', value: 15 }],
    },

    









    {
      id: 'leanBurn', tree: 'money', currency: 'money', name: 'Lean Burn', icon: 'msLeanBurn',
      x: 1200, y: 1360, req: ['deepBanks'], gate: 'oilGenerator',
      maxLevel: 5, weight: 0.6,
      desc: 'A cleaner burn gives up less of what you have earned.',
      effects: [{ stat: 'oilGenerator.ciPerKw', op: 'add', value: -0.01 }],
    },
    {
      id: 'hotBurn', tree: 'money', currency: 'money', name: 'Hot Burn', icon: 'oilgen',
      x: 1200, y: 1030, req: ['leanBurn'], gate: 'oilGenerator',
      maxLevel: 5, weight: 0.55,
      desc: 'Run it hotter and get more out of every kilo.',
      effects: [{ stat: 'oilGenerator.kwPerKg', op: 'add', value: 0.5 }],
    },
    {
      id: 'longContracts', tree: 'money', currency: 'money', name: 'Long Contracts',
      icon: 'exchange',
      x: 1260, y: 4060, req: ['longShifts'], gate: 'labourExchange',
      maxLevel: 3, weight: 1.62,
      desc: 'A Labour Exchange will write you a longer shift.',
      effects: [{ stat: 'labourExchange.hire.maxSec', op: 'add', value: 600 }],
    },
    {
      id: 'bankedEmbers', tree: 'money', currency: 'money', name: 'Banked Embers', icon: 'furnace',
      x: 3280, y: 5320, req: ['fineAsh'], gate: 'burnYard',
      maxLevel: 5, weight: 0.5,
      desc: 'Bank the heat overnight and the morning shift starts hot.',
      effects: [{ stat: 'burnYard.auto.wf.cost', op: 'add', value: 0.02 }],
    },
    {
      id: 'counterHands', tree: 'money', currency: 'money', name: 'Counter Hands', icon: 'floor',
      x: 4260, y: 3340, req: ['wideStalls'], gate: 'tradingFloor',
      maxLevel: 5, weight: 0.7,
      desc: 'A till they can work without looking.',
      effects: [{ stat: 'tradingFloor.auto.wf.cost', op: 'add', value: 0.02 }],
    },
    {
      




      id: 'sortedLoads', tree: 'money', currency: 'money', name: 'Sorted Loads', icon: 'rubble',
      x: 4260, y: 2860, req: ['lightFreight'],
      maxLevel: 3, weight: 1.2,
      desc: 'Everything light, sorted and stacked properly.',
      effects: [
        { stat: 'market.value.light',       op: 'mul', value: 1.02 },
        { stat: 'market.value.glass',       op: 'mul', value: 1.02 },
        { stat: 'market.value.aggregate',   op: 'mul', value: 1.02 },
        { stat: 'landfill.value.light',     op: 'mul', value: 1.02 },
      ],
    },
    {
      id: 'crudePremium', tree: 'money', currency: 'money', name: 'Crude Premium', icon: 'pyro',
      x: 4860, y: 2500, req: ['refinedFreight'], gate: 'pyrolysisPlant',
      maxLevel: 5, weight: 0.45,
      desc: 'Sell it by the barrel to people who need it.',
      effects: [{ stat: 'market.value.oil', op: 'mul', value: 1.02 }],
    },
    










    




















    {
      id: 'deepBays', tree: 'money', currency: 'money', name: 'Deep Bays', icon: 'merge',
      x: 2760, y: 4000, req: ['densePacking'], gate: 'trashJunction',
      maxLevel: 5, weight: 1,
      desc: 'Higher walls on the bays, so more can be stacked before anything has to move.',
      effects: [{ stat: 'trashJunction.buffer', op: 'add', value: 2 }],
    },
    







    {
      id: 'vaultRacks', tree: 'money', currency: 'money', name: 'Vault Racks', icon: 'msVaultRacks',
      x: 1460, y: 1360, req: ['deepBanks'], gate: 'powerVault', demo: false,
      maxLevel: 5, weight: 2.3,
      desc: 'More racks of cells in the big Vault.',
      effects: [{ stat: 'powerVault.store', op: 'add', value: 5 }],
    },
    {
      id: 'widerBaskets', tree: 'money', currency: 'money', name: 'Wider Baskets', icon: 'msWiderBaskets',
      x: 960, y: 4300, req: ['fullBaskets'], demo: false,
      maxLevel: 3, weight: 0.9,
      desc: 'Wider baskets hold more before anyone empties them.',
      effects: [{ stat: 'treePlanter.collect.cap', op: 'add', value: 25 }],
    },
    {
      id: 'stackedBays', tree: 'money', currency: 'money', name: 'Stacked Bays', icon: 'msStackedBays',
      x: 2760, y: 4330, req: ['deepBays'], gate: 'trashJunction', demo: false,
      maxLevel: 5, weight: 1.5,
      desc: 'Bays stacked two high, so far more fits before anything moves.',
      effects: [{ stat: 'trashJunction.buffer', op: 'add', value: 4 }],
    },
    {
      id: 'deepDrums', tree: 'money', currency: 'money', name: 'Deep Drums', icon: 'tank',
      x: 5160, y: 2620, req: ['crudePremium'], gate: 'fluidTank',
      maxLevel: 5, weight: 0.5,
      desc: 'A taller drum, so it carries more fluid.',
      effects: [{ stat: 'fluidTank.buffer', op: 'add', value: 2 }],
    },
    






    {
      id: 'timberTrade', tree: 'money', currency: 'money', name: 'Timber Trade', icon: 'timber',
      x: 5160, y: 2140, req: ['crudePremium'], gate: 'timberReclaimer',
      maxLevel: 5, weight: 0.5,
      desc: 'Reclaimed beams fetch more than firewood.',
      effects: [{ stat: 'market.value.wood', op: 'mul', value: 1.02 }],
    },
    {
      id: 'charPremium', tree: 'money', currency: 'money', name: 'Char Premium', icon: 'kiln',
      x: 5460, y: 2140, req: ['timberTrade'], gate: 'charKiln',
      maxLevel: 5, weight: 0.6,
      desc: 'Burn it slower and it grades better.',
      effects: [{ stat: 'market.value.coal', op: 'mul', value: 1.02 }],
    },
    {
      




























      












      id: 'wideBore', tree: 'money', currency: 'money', name: 'Dense Draw', icon: 'pump',
      x: 5760, y: 2260, req: ['charPremium'], gate: 'waterPump',
      maxLevel: 5, weight: 0.40,
      desc: 'The intake sits low, where the dirt is thickest, so each kilogram lifted carries more of it out.',
      effects: [{ stat: 'waterPump.returnBonus', op: 'add', value: 10 }],
    },
    {
      



      



      id: 'packedBed', tree: 'money', currency: 'money', name: 'Tall Column', icon: 'clean',
      x: 5760, y: 2020, req: ['charPremium'], gate: 'waterCleaner',
      maxLevel: 3, weight: 0.18,
      desc: 'A taller carbon column. More water and charcoal wait inside before it is full.',
      effects: [{ stat: 'waterCleaner.buffer', op: 'add', value: 6 }],
    },
    {
      










      



      id: 'plateStack', tree: 'money', currency: 'money', name: 'Thick Skim', icon: 'separator',
      x: 6060, y: 2260, req: ['wideBore'], gate: 'oilSeparator',
      maxLevel: 5, weight: 0.05,
      desc: 'The skimmers ride lower in the slick and bring up more crude with each kilogram.',
      effects: [{ stat: 'oilSeparator.byKg', op: 'add', value: 0.005 }],
    },
    {
      





      



      id: 'wrungPads', tree: 'money', currency: 'money', name: 'Big Shell', icon: 'msBigShell',
      x: 6060, y: 2020, req: ['packedBed'], gate: 'oilSeparator',
      maxLevel: 3, weight: 0.15,
      desc: 'A bigger shell around the plates. More oily water and sorbent wait inside before it is full.',
      effects: [{ stat: 'oilSeparator.buffer', op: 'add', value: 6 }],
    },
    {
      id: 'richBlend', tree: 'money', currency: 'money', name: 'Rich Blend', icon: 'fert',
      x: 5160, y: 2380, req: ['crudePremium'], gate: 'fertilizerPlant',
      maxLevel: 3, weight: 0.4,
      desc: 'Blend it properly and it is worth more by the sack.',
      effects: [{ stat: 'market.value.fert', op: 'mul', value: 1.02 }],
    },
    {
      id: 'deepRoots', tree: 'money', currency: 'money', name: 'Deep Roots', icon: 'msDeepRoots',
      x: 660, y: 5020, req: ['seedStock'], gate: 'fertilizerPlant',
      maxLevel: 3, weight: 0.72,
      desc: 'Roots that go looking for it need less of it.',
      effects: [{ stat: 'treePlanter.recipe.fert.add', op: 'add', value: -0.05 }],
    },
    {
      id: 'clearCargo', tree: 'money', currency: 'money', name: 'Clear Cargo', icon: 'msClearCargo',
      x: 4560, y: 2860, req: ['sortedLoads'], gate: 'fineSorter',
      maxLevel: 5, weight: 1.3,   
      desc: 'Plastic and glass both travel well.',
      effects: [
        { stat: 'market.value.plastic', op: 'mul', value: 1.02 },
        { stat: 'market.value.glass',   op: 'mul', value: 1.02 },
      ],
    },
    {
      id: 'longRange', tree: 'money', currency: 'money', name: 'Long Range', icon: 'forecast',
      x: 1590, y: 1690, req: ['surgeArrestors'], gate: 'forecastMast',
      maxLevel: 5, weight: 3.888,
      desc: 'A taller mast sees further out.',
      effects: [{ stat: 'forecastMast.leadSec', op: 'add', value: 2 }],
    },
    {
      




      id: 'fullManifest', tree: 'money', currency: 'money', name: 'Full Manifest', icon: 'msFullManifest',
      x: 4560, y: 3100, req: ['marketStanding'],
      maxLevel: 3, weight: 3.6,   
      desc: 'One ledger for the whole yard.',
      effects: [
        { stat: 'market.value.rtrash',    op: 'mul', value: 1.01 },
        { stat: 'market.value.light',     op: 'mul', value: 1.01 },
        { stat: 'market.value.heavy',     op: 'mul', value: 1.01 },
        { stat: 'market.value.metal',     op: 'mul', value: 1.01 },
        { stat: 'market.value.alu',       op: 'mul', value: 1.01 },
        { stat: 'market.value.steel',     op: 'mul', value: 1.01 },
        { stat: 'market.value.hazard',    op: 'mul', value: 1.01 },
        { stat: 'market.value.cell',      op: 'mul', value: 1.01 },
        { stat: 'market.value.plastic',   op: 'mul', value: 1.01 },
        { stat: 'market.value.organic',   op: 'mul', value: 1.01 },
        { stat: 'market.value.fert',      op: 'mul', value: 1.01 },
        { stat: 'market.value.oil',       op: 'mul', value: 1.01 },
        { stat: 'market.value.glass',     op: 'mul', value: 1.01 },
        { stat: 'market.value.aggregate', op: 'mul', value: 1.01 },
      ],
    },
  ],

};











GG.config.buildSkillCosts = function () {
  const C = GG.config, P = C.skillPricing;
  const by = {};
  C.skills.forEach(s => { by[s.id] = s; });

  
  
  function depth(s) {
    let d = 0, c = s, guard = 0;
    while (c && c.req && c.req.length && guard++ < 64) { c = by[c.req[0]]; if (c) d++; }
    return d;
  }
  
  
  function stepFor(v) {
    for (const [under, step] of P.rounding) if (v < under) return step;
    return 1;
  }
  function nice(v) {
    const step = stepFor(v);
    return step ? Math.round(v / step) * step : Math.round(v);
  }

  C.skills.forEach(s => {
    if (s.tree !== 'money' || s.costs) return;      
    const b = P.base * Math.pow(P.depthGrowth, depth(s)) * (s.weight === undefined ? 1 : s.weight);
    const out = [];
    for (let i = 0; i < (s.maxLevel || 1); i++) {
      let v = nice(b * Math.pow(P.levelGrowth, i));
      



      if (i && v <= out[i - 1]) v = out[i - 1] + stepFor(out[i - 1]);
      out.push(+v.toFixed(2));
    }
    s.costs = out;
    s.depth = depth(s);        
  });
};
GG.config.buildSkillCosts();














GG.config.buildCiCosts = function () {
  const C = GG.config, P = C.ciPricing;
  if (!P || !P.enabled) return;
  const by = {};
  C.skills.forEach(s => { by[s.id] = s; });

  function nice(v) {
    for (const [under, step] of P.rounding) if (v < under) return Math.round(v / step) * step;
    return Math.round(v);
  }

  
  const lateAt = P.lateFrom ? P.order.indexOf(P.lateFrom) : -1;

  let raw = 0, prev = 0;
  P.order.forEach(function (id, i) {
    const s = by[id];
    if (!s) { console.warn('[ReGen] ciPricing.order names an unknown skill:', id); return; }
    const grow = (lateAt >= 0 && i >= lateAt && P.lateGrowth) ? P.lateGrowth : P.growth;
    raw = i < P.base.length ? P.base[i] : raw * grow;
    let v = i < P.base.length ? P.base[i] : nice(raw);
    
    
    if (v <= prev) v = prev + (P.rounding[0] ? P.rounding[0][1] : 1);
    
    
    prev = v;
    const b = P.bump && P.bump[id];
    if (b) v = nice(v * b);
    s.cost = v;
    s.ciOrder = i;                 
  });

  


  C.skills.forEach(function (s) {
    if (s.tree === 'money' || s.ciOrder === undefined) return;
    (s.req || []).forEach(function (r) {
      const p = by[r];
      if (p && p.ciOrder !== undefined && p.cost >= s.cost) {
        console.warn('[ReGen] CI ladder: ' + s.id + ' (' + s.cost + ') is not dearer than its ' +
                     'prerequisite ' + r + ' (' + p.cost + ') — reorder ciPricing.order');
      }
    });
  });
};
GG.config.buildCiCosts();













































GG.config.byProduct = function (t, perKg) {
  if (t.outPerCI) {
    const d = t.outPerCI.ci;
    return d > 0 ? { res: t.outPerCI.res, kg: (perKg || 0) / d } : null;
  }
  return t.outPerKg ? { res: t.outPerKg.res, kg: t.outPerKg.kg || 1 } : null;
};
















GG.config.driveIns = function (t) {
  const ins = (t && t.ports && t.ports.in) || [];
  if (!t || !t.powerUp) return ins;
  return ins.filter(p => p.id !== t.powerUp.port);
};


















GG.config.pumpGrounds = function (t) {
  const C = GG.config;
  if (!t || !t.pumpPerKw) return [];
  const ids = (GG.state && GG.state.siteTypes) ? GG.state.siteTypes(t)
                                               : [].concat(t.siteType || []);
  return ids.map(function (id) {
    const st = C.nodeTypes[id];
    if (!st || !st.grow || !st.volume) return null;
    return { site: id, siteName: st.name,
             res: st.water || 'dirtyWater',
             ciPerKg: st.capacity / st.volume };
  }).filter(Boolean);
};














GG.config.rockOuts = function () {
  const A = GG.config.asteroid || {};
  const seen = [];
  const add = function (r) { if (r && seen.indexOf(r) < 0) seen.push(r); };
  const kinds = [{ mix: A.mix, fill: 'steel' }].concat(A.variants || []);
  kinds.forEach(function (k) {
    Object.keys(k.mix || {}).forEach(add);
    add(k.fill || 'steel');
  });
  return seen;
};

GG.config.rockOutMax = function () {
  const A = GG.config.asteroid || {};
  const kinds = [{ mix: A.mix, fill: 'steel' }].concat(A.variants || []);
  return kinds.reduce(function (m, k) {
    const names = Object.keys(k.mix || {});
    const fill = k.fill || 'steel';
    return Math.max(m, names.length + (names.indexOf(fill) < 0 ? 1 : 0));
  }, 0);
};




GG.config.rockOutCap = function () {
  const A = GG.config.asteroid || {};
  return A.rockPorts === false ? Infinity : GG.config.rockOutMax();
};

GG.config.gradeFlow = function (t, io) {
  const C = GG.config;
  io = io || {};
  const read = io.read || function (f) { return t[f]; };
  const rate = io.rate || function (id, f) { return (C.nodeTypes[id] || {})[f]; };
  




  const share = io.share || function () { return 0.5; };
  const recipeNeed = io.recipeNeed || function (res) { return t.recipe.inputs[res]; };
  const recipeWf = io.recipeWf || function () { return t.recipe.wf || 0; };
  
  
  const recipeKw = io.recipeKw || function () { return t.recipe.kw || 0; };
  




  const recipeCi = io.recipeCi || function () { return t.recipe.ci || 0; };
  const convNeed = io.convNeed || function (res) { return t.convert.inputs[res]; };
  const convWf = io.convWf || function () { return t.convert.wf || 0; };

  const resOf = r => C.resources[r] || {};
  const outs = (t.ports && t.ports.out) || [];
  const mats = outs.filter(p => resOf(p.res).flow === 'material');
  
  const ins = C.driveIns(t);
  const matIn = ins.filter(p => resOf(p.res).flow === 'material');
  const list = [];

  



  if (t.convert && t.convert.inputs) {
    const cv = t.convert, inp = {};
    Object.keys(cv.inputs).forEach(k => { inp[k] = convNeed(k); });
    
    const o = {}; if (cv.out) o[cv.out.res] = cv.out.kg;
    



    const cbp = C.byProduct(t, 0);
    const cside = {};
    if (cbp && cbp.kg > 0) cside[cbp.res] = cbp.kg * (cv.out.kg || 1);
    const cf = { in: inp, kw: cv.kw || 0, wf: convWf(), out: o, side: cside,
                note: 'a steady flow rather than a batch. Short of any one of them it ' +
                      'simply makes less, and the rest waits in the hopper' };
    if (cv.ci) cf.gives = { ci: cv.ci };
    list.push(cf);
    return list;
  }

  









  if (t.recipe && t.recipe.inputs) {
    const rec = t.recipe, inp = {};
    Object.keys(rec.inputs).forEach(k => { inp[k] = recipeNeed(k); });
    const f = { in: inp, kw: recipeKw(), wf: recipeWf(), out: {}, side: {},
                


                note: (Object.keys(rec.inputs).some(k => ((rec.growth || {})[k] || 0) > 0)
                       || (rec.growthMul || 1) > 1
                  ? 'one batch, the FIRST one. Every batch after costs more'
                  : 'one batch, and every batch costs the same') };
    if (rec.out) f.out[rec.out.res] = rec.out.kg;
    else if (rec.gem) {
      
      
      
      f.gives = {}; f.gives[rec.gem.cur] = rec.gem.base;
      f.note = 'one batch, the FIRST one. Every batch costs a fifth of this one more ' +
               'than the last, and every ' + rec.gem.every + ' batches press one more stone';
    } else if (rec.power && rec.crew) {
      



      f.gives = { kw: rate(rec.power, 'energyRate'), wf: rate(rec.crew, 'wfRate') };
      f.note = 'one stretch of road, paying that much for ever at a ' +
               C.nodeTypes[rec.power].name + "'s rate and a " +
               C.nodeTypes[rec.crew].name + "'s, so every skill on either machine " +
               'reaches it';
    } else if (rec.power) {
      f.gives = { kw: rate(rec.power, 'energyRate') };
      f.note = 'one array, giving that much energy for ever at a ' +
               C.nodeTypes[rec.power].name + '\'s rate, so every skill on that ' +
               'machine reaches it';
      




      if (rec.growthMul > 1)
        f.note2 = 'every array this machine has raised makes its next one ' +
                  Math.round((rec.growthMul - 1) * 100) + '% dearer';
    } else if (rec.ci) {
      





      f.gives = { ci: recipeCi() };
      







      f.perHour = true;
      f.note = 'one dome, paying that much Clean Index for ever and consuming nothing ' +
               'afterwards';
      if (rec.growthMul > 1)
        f.note2 = 'every dome this machine has built makes its next one ' +
                  Math.round((rec.growthMul - 1) * 100) + '% dearer, in materials and ' +
                  'in labour alike';
    } else if (rec.boost) {
      f.note = 'one load: x' + (1 + rec.boost) + ' on everything it grows, for ever';
    }
    list.push(f);
    if (!(t.ciPerWF || t.ciPerKW)) return list;    
  }

  






  if (t.powerUp) {
    const pu = t.powerUp, inp = {};
    inp[pu.res] = pu.kg;
    list.push({ in: inp, kw: 0, wf: 0, out: {},
                note: 'every kilogram it eats is worth +' + pu.boost + ' on this machine ' +
                      'for good, and the load after it wants ' + pu.growth + ' kg more' });
  }

  
  if (t.energyRate && !ins.length) {
    list.push({ in: {}, kw: 0, wf: 0, out: {}, gives: { kw: read('energyRate') },
                
                note: t.duty ? (dd => 'while the sun is up, ' + dd.onSec + 's on and ' + dd.offSec +
                                 's off')(io.node && GG.sim && GG.sim.solarDuty ? GG.sim.solarDuty() : t.duty)
                             : 'always' });
    return list;
  }
  if (t.wfRate && !ins.length) {
    list.push({ in: {}, kw: 0, wf: 0, out: {}, gives: { wf: read('wfRate') }, note: 'always' });
    return list;
  }
  



  if (t.wfMult && !ins.length) {
    list.push({ in: {}, kw: 0, wf: 0, out: {},
                gives: { wf: (rate('player', 'wfRate') || 0) * t.wfMult },
                note: 'four times whatever a Volunteer makes, so every upgrade to ' +
                      'them reaches it' });
    return list;
  }

  










  if (t.digMix) {
    const mix = {};
    





    let own = null;
    try {
      const S = GG.state, site = io.node && S && S.siteOf ? S.siteOf(io.node) : null;
      if (site && site.type === 'meteorite' && GG.sim && GG.sim.mixOf) own = GG.sim.mixOf(site);
    } catch (e) { own = null; }
    const src = own || t.digMix;
    Object.keys(src).forEach(function (r) {
      if (src[r] > 0) mix[r] = own ? Math.round(src[r] * 100) / 100 : src[r];
    });
    list.push({ in: {}, kw: read('digKw') || 0, wf: read('digWf') || 0, out: mix,
                note: own ? 'straight out of the rock it stands on, and the rock pays the mass'
                    : 'straight out of the rock, and the rock pays the mass. Every ' +
                      'meteorite carries its own mix, so these are averages' });
    return list;
  }

  


  if (t.wastePerWf) {
    list.push({ in: { gear: read('gearPerWf') || 0 }, kw: 0, wf: 1,
                
                out: { [(((t.ports || {}).out || [])[0] || {}).res || 'nukeWaste']: read('wastePerWf') },
                note: 'straight out of the ground, and the site pays the mass' });
    return list;
  }

  
  if (t.kgPerWF) {
    list.push({ in: {}, kw: 0, wf: 1, out: { trash: read('kgPerWF') },
                note: 'straight out of the ground, and the site pays the mass' });
    return list;
  }
  if (t.energyPerKg && !matIn.length) {
    list.push({ in: {}, kw: read('energyPerKg'), wf: 0, out: { trash: 1 },
                note: 'straight out of the ground, and the site pays the mass' });
    return list;
  }

  








  if (t.pumpPerKw) {
    const per = read('pumpPerKw') || 0;
    list.push({ in: {}, kw: per > 0 ? 1 / per : 0, wf: 0,
                out: { dirtyWater: 1 },
                






                note: 'lifted out of the ground it stands on, and that ground pays the mass' });
    return list;
  }

  






  if (t.virtualOut && t.collect && t.processRate) return list;

  
  if (t.mix) {
    const inp = {};
    t.mix.forEach(r => { inp[r] = 1; });
    const o = {}, outRes = mats.length ? mats[0].res : null;
    if (outRes) o[outRes] = read('fertPerKg');
    list.push({ in: inp, kw: read('energyPerKg'), wf: 0, out: o,
                note: 'one kilo of EACH, not one kilo between them' });
    return list;
  }

  



  const yieldField = t.hazPerKg ? 'hazPerKg'
                   : (t.oilPerKg ? 'oilPerKg'
                   : (t.yieldPerKg ? 'yieldPerKg' : null));
  if (yieldField) {
    const inRes = matIn[0] && matIn[0].res;
    const main = mats.find(p => p.res !== inRes) || mats[0];
    const drive = t.wfPerKg ? { wf: read('wfPerKg'), kw: 0 }
                            : { wf: 0, kw: read('energyPerKg') };
    const o = {}; o[main.res] = read(yieldField);
    



    const y = read(yieldField);
    list.push({ in: inRes ? { [inRes]: 1 } : {}, kw: drive.kw, wf: drive.wf, out: o, side: {},
                note: t.flowNote === false ? ''
                  : (y < 1
                  ? 'the rest of the kilo is gone, because this step is a step UP rather than a filter'
                  : 'one kilogram in makes more than a kilogram out, because this step is a step UP') });
    return list;
  }

  



  const inRes0 = matIn.length ? matIn[0].res : null;
  const prods = mats.filter(p => p.res !== inRes0);

  
  if (prods.length === 2 && matIn.length === 1 && (t.energyPerKg || t.wfPerKg)) {
    const inRes = matIn[0].res, a = prods[0].res, b = prods[1].res;
    const kw = t.energyPerKg ? read('energyPerKg') : 0;
    const wf = t.wfPerKg ? read('wfPerKg') : 0;
    const s = share(t, a, b);
    const o = {}; o[a] = s; o[b] = 1 - s;
    list.push({ in: { [inRes]: 1 }, kw: kw, wf: wf, out: o,
                note: t.wfPerKg && t.energyPerKg
                  ? 'a tug of war: workforce pulls toward ' + resOf(a).name.toLowerCase() +
                    ', energy toward ' + resOf(b).name.toLowerCase()
                  : 'the best split there is; short of it you get ' +
                    resOf(b).name.toLowerCase() + ' instead' });
    return list;
  }

  
  if (prods.length && matIn.length === 1 && (t.energyPerKg || t.wfPerKg)) {
    const isWf = !t.energyPerKg, per = read(isWf ? 'wfPerKg' : 'energyPerKg');
    const o = {}; o[prods[0].res] = 1;
    list.push({ in: { [matIn[0].res]: 1 }, kw: isWf ? 0 : per, wf: isWf ? per : 0, out: o,
                note: 'mass is conserved; anything the supply cannot cover passes ' +
                      'straight out of the second socket' });
    return list;
  }

  


  


  











  if (t.print) {
    const P = t.print;
    const rows = [];
    const plan = io.node && GG.sim && GG.sim.printPlan ? GG.sim.printPlan(io.node) : null;
    const one = function (res, def, made) {
      const kg = def.kg + (def.grow || 0) * made;
      const b = (C.boosts || []).find(function (x) { return x.id === def.boost; });
      rows.push({ in: { paper: P.paper, [res]: kg }, kw: P.kw + (P.kwGrow || 0) * made,
                  wf: 0, out: {}, gives: {},
                  note: 'prints ' + ((b && b.name) || def.boost) +
                        ', and each one costs more than the last' });
    };
    if (plan && P.boosts[plan.res]) one(plan.res, P.boosts[plan.res], plan.made);
    else if (plan) {
      rows.push({ in: { paper: P.paper, [plan.res]: plan.kg }, kw: plan.kw, wf: 0,
                  out: {}, gives: { diamond: plan.gem },
                  note: 'anything it has no print for becomes a diamond, at a penalty' });
    } else {
      Object.keys(P.boosts).forEach(function (res) { one(res, P.boosts[res], 0); });
      rows.push({ in: { paper: P.paper }, kw: P.kw, wf: 0, out: {}, gives: { diamond: 1 },
                  note: 'any other material prints a diamond instead, at ' +
                        P.gem.mul + ' times the cost' });
    }
    return rows;
  }

  if (t.rocket) {
    const F = t.rocket.flight;
    


    if (io.node && !io.node.built) {
      list.push({ in: Object.assign({}, t.rocket.build), kw: 0, wf: 0, out: {}, build: true,
                  note: 'after that, every flight needs only turbofuel and crew' });
      return list;
    }
    

    const Sm = io.node && GG.sim && GG.sim.rocketMetal;
    const metal = Sm ? GG.sim.rocketMetal(io.node) : F.metal;
    const sec = Sm ? F.sec * GG.sim.rocketTime() : F.sec;
    list.push({ in: { turbofuel: F.fuel }, kw: 0, wf: F.wf, out: { metal: metal },
                gives: { ci: F.ci },
                note: 'built once; each flight is away ' + Math.round(sec / 60) + ' real minutes' });
    return list;
  }

  if (t.fission) {
    const F = t.fission;
    let kw = F.kw;
    try { if (GG.sim && GG.sim.reactorKw && GG.state && GG.state.g) kw = GG.sim.reactorKw(t); } catch (e) {}
    list.push({ in: { [F.res || 'rod']: F.kg }, kw: 0, wf: 0, out: {}, gives: { kw: kw },
                note: 'one load runs it for ' + Math.round(F.sec / 60) + ' real minutes' });
    return list;
  }

  
  if (t.kwPerKg) {
    const inRes = matIn[0] && matIn[0].res;
    









    list.push({ in: inRes ? { [inRes]: 1 } : {}, kw: 0, wf: 0, out: {},
                gives: { kw: read('kwPerKg') },
                costs: t.ciPerKw ? { ci: read('ciPerKw') } : null,
                note: t.licence ? 'only while a licence is running, and ' +
                      (io.licenceCost ? io.licenceCost() : t.licence.cost) + ' ' +
                      t.licence.cur.toUpperCase() + ' buys ' + (t.licence.sec / 60) +
                      ' real minutes' : '' });
    return list;
  }

  










  if (t.ciPerWF || t.ciPerKW) {
    const byKw = !t.ciPerWF;
    const per = read(byKw ? 'ciPerKW' : 'ciPerWF');
    const perKg = t.ciPerKg ? read('ciPerKg') : 0;
    const fuel = perKg ? (matIn.find(p => p.res !== 'energy') || {}).res : null;
    if (fuel) {
      const supply = perKg / per;                 
      const side = {};
      const bp = C.byProduct(t, perKg);
      if (bp) side[bp.res] = bp.kg;
      list.push({ in: { [fuel]: 1 }, kw: byKw ? supply : 0, wf: byKw ? 0 : supply,
                  out: {}, side: side, gives: { ci: perKg },
                  note: 'one kilogram of ' + resOf(fuel).name.toLowerCase() +
                        ' is worth that much Clean Index, and the ' +
                        (byKw ? 'power' : 'crew') + ' only sets how fast it is worked ' +
                        'through. With none of it the machine does nothing at all' });
      return list;
    }
    



    




    const onGround = t.placement === 'onSite';
    list.push({ in: {}, kw: byKw ? 1 : 0, wf: byKw ? 0 : 1, out: {}, gives: { ci: per },
                note: t.collect
                  ? 'it piles up in a till of ' + t.collect.cap + ' and JAMS when full, so ' +
                    'press ' + (t.collect.label || 'COLLECT') +
                    (onGround ? '; the plot fills as it goes' : '')
                  : (onGround ? 'banked the instant it is made; a plot fills as it goes'
                              : 'banked the instant it is made') });
    return list;
  }

  return list;
};











































GG.config.iconColor = function (t) {
  const C = GG.config, o = (C.ui && C.ui.iconGroupColor) || {};
  if (!t) return '#8296ab';
  if (!o.enabled || (o.except || []).indexOf(t.category) >= 0) return t.color;
  const cat = (C.categories || []).find(function (c) { return c.id === t.category; });
  return (cat && cat.color) || t.color;
};





(function () {
  const C = GG.config, o = (C.ui && C.ui.iconGroupColor) || {};
  if (!o.enabled || !o.wholeCard) return;
  Object.values(C.nodeTypes).forEach(function (t) {
    if (t.kind !== 'machine' || (o.except || []).indexOf(t.category) >= 0) return;
    const cat = (C.categories || []).find(function (c) { return c.id === t.category; });
    if (cat && cat.color && t.color !== cat.color) { t.ownColor = t.color; t.color = cat.color; }
  });
})();
GG.config.descOf = function (t) {
  if (!t) return '';
  const base = t.desc || '';
  if (!t.descMore) return base;
  const Sim = GG.sim;
  if (t.descNeeds && Sim && Sim.demoNode && Sim.demoNode(t.descNeeds)) return base;
  return base + ' ' + t.descMore;
};












GG.config.ownerSkill = function (id) {
  const C = GG.config;
  if (!C._ownerSkill) {
    const m = {};
    C.skills.forEach(function (s) {
      if ((s.tree || 'ci') !== 'ci') return;
      (s.unlocks || []).forEach(function (u) {
        const t = C.nodeTypes[u];
        if (t && t.buildable && !m[u]) m[u] = s;
      });
    });
    C._ownerSkill = m;
  }
  return C._ownerSkill[id] || null;
};















GG.config.treeDescOf = function (sk) {
  const C = GG.config;
  if (!sk) return '';
  if (C.ui.descSwap === false || (sk.tree || 'ci') !== 'ci') return sk.desc || '';
  const opens = (sk.unlocks || [])
    .map(function (u) { return C.nodeTypes[u]; })
    .filter(function (t) { return t && t.buildable; });
  if (opens.length !== 1) return sk.desc || '';
  return C.descOf(opens[0]) || sk.desc || '';
};






GG.config.codexDescOf = function (t) {
  const C = GG.config;
  if (!t) return '';
  if (C.ui.descSwap === false) return C.descOf(t);
  const sk = C.ownerSkill(t.id);
  const only = sk && (sk.unlocks || []).filter(function (u) {
    const n = C.nodeTypes[u];
    return n && n.buildable;
  }).length === 1;
  return (only && sk.desc) ? sk.desc : C.descOf(t);
};












GG.config.SPEC_PROSE = ['Note', 'Watch out'];





GG.config.isSpecProse = function (r) {
  return GG.config.SPEC_PROSE.indexOf(r[0]) >= 0 &&
         String(r[1] || '').trim().split(/\s+/).length >= 3;
};



GG.config.specCard  = function (t, io) { return GG.config.specOf(t, io).filter(r => !GG.config.isSpecProse(r)); };
GG.config.specProse = function (t, io) { return GG.config.specOf(t, io).filter(r => GG.config.isSpecProse(r)); };

GG.config.specOf = function (t, io) {
  const C = GG.config, U = GG.util;
  const rows = [];
  const resOf = r => C.resources[r] || { name: r };
  


  const n = v => (v >= 1000 ? String(Math.round(v)) : U.small(v));
  const kg = (r, v) => n(v) + ' kg ' + resOf(r).name;
  const join = a => a.filter(Boolean).join(' + ');
  const add = (k, v) => { if (v) rows.push([k, v]); };

  
  const supply = f => join([f.wf ? n(f.wf) + ' WF' : '', f.kw ? n(f.kw) + ' KW' : '']);
  const gives = f => join(Object.keys(f.gives || {}).map(g =>
    g === 'kw' ? n(f.gives[g]) + ' KW/h'
    : g === 'wf' ? n(f.gives[g]) + ' WF/h'
    : g === 'ci' ? n(f.gives[g]) + (f.perHour ? ' CI/h' : ' CI')
    : n(f.gives[g]) + ' ' + (C.currencies[g] ? C.currencies[g].name : g)));

  let flows = [];
  try { flows = C.gradeFlow(t, io) || []; } catch (e) { flows = []; }
  




  










  if (t.print) {
    const PR = t.print;
    const pl = (io && io.node && GG.sim && GG.sim.printPlan) ? GG.sim.printPlan(io.node) : null;
    const bName = function (id) {
      const b = (C.boosts || []).find(function (x) { return x.id === id; });
      return (b && b.name) || id;
    };
    const curName = (C.currencies[PR.gem.cur] || {}).name || PR.gem.cur;
    if (pl && PR.boosts[pl.res]) {
      

      add('Takes', join([kg('paper', pl.paper), kg(pl.res, pl.kg)]) + ' + ' + n(pl.kw) + ' KW');
      add('Makes', 'one ' + bName(pl.boost));
      add('Note', 'it gathers both before it draws any power, and each print costs more than the last');
    } else if (pl) {
      add('Takes', join([kg('paper', pl.paper), kg(pl.res, pl.kg)]) + ' + ' + n(pl.kw) + ' KW');
      add('Makes', n(pl.gem) + ' ' + curName);
      add('Note', 'it has no print for that material, so it presses a diamond instead, at ' +
                  n(PR.gem.mul) + ' times the cost');
    } else {
      

      add('Takes', kg('paper', PR.paper) + ' + one material + ' + n(PR.kw) + ' KW');
      Object.keys(PR.boosts).forEach(function (res) {
        add('Prints', bName(PR.boosts[res].boost) + ' from ' + kg(res, PR.boosts[res].kg));
      });
      add('Otherwise', 'any other material, for one ' + curName + ' at ' + n(PR.gem.mul) + ' times the cost');
      add('Note', 'each print costs more than the last, counted separately for each boost and ' +
                  'for diamonds, and kept across every Print Works you build');
    }
    if (t.spec) add('Watch out', t.spec);
    return rows;
  }

  const isDose = f => !Object.keys(f.out || {}).length && !Object.keys(f.gives || {}).length;
  const work = flows.filter(f => !isDose(f));
  






  const hiddenRes = function (r) {
    const Sim = GG.sim;
    return !!(Sim && Sim.demoRes && Sim.demoRes(r));
  };
  const doses = flows.filter(f => isDose(f) && !Object.keys(f.in || {}).some(hiddenRes));

  











  const pumpAt = (function () {
    if (!t.pumpPerKw || !C.pumpGrounds) return null;
    let all = C.pumpGrounds(t);
    if (!all.length) return null;
    const node = io && io.node;
    const site = node && GG.state && GG.state.siteOf ? GG.state.siteOf(node) : null;
    if (site) all = all.filter(gr => gr.site === site.type) || all;
    

    if (site && GG.sim && GG.sim.poolCiPerKg) {
      all = all.map(gr => Object.assign({}, gr, { ciPerKg: GG.sim.poolCiPerKg(site) }));
    }
    








    const vis = all.filter(gr => !hiddenRes(gr.res));
    return vis.length ? vis : null;
  })();

  work.forEach(f => {
    const takes = join([
      ...Object.keys(f.in || {}).map(r => kg(r, f.in[r])),
      supply(f)
    ]);
    const makes = pumpAt
      ? n(Object.values(f.out || {})[0] || 1) + ' kg ' +
        (GG.state && GG.state.orList
          ? GG.state.orList(pumpAt.map(gr => resOf(gr.res).name))
          : resOf(pumpAt[0].res).name)
      : join([
        ...Object.keys(f.out || {}).map(r => kg(r, f.out[r])),
        gives(f)
      ]);
    add('Takes', takes);
    add('Makes', makes);
    






    if (t.maxKw) add('Most power', n(t.maxKw) + ' KW/h');
    




    if (pumpAt) add('Pays back',
      (GG.state && GG.state.orList
        ? GG.state.orList(pumpAt.map(gr => n(gr.ciPerKg)))
        : n(pumpAt[0].ciPerKg)) + ' CI per kg');
    

    if (f.costs && f.costs.ci) add('Costs', n(f.costs.ci) + ' CI per KW/h');
    const side = Object.keys(f.side || {});
    if (side.length) add('Also out', side.map(r => kg(r, f.side[r])).join(' + '));
    add('Note', f.note);
    add('Then', f.note2);   
  });

  


  if (!work.length) {
    if (t.grow || t.reserve || t.capacity) {
      add('What it is', 'Ground rather than a machine, and you build on it');
      if (t.grow) add('Fills to', n(t.capacity || 0) + ' CI');
    } else if (t.store) {
      add('Holds', n(t.store) + ' KW');
      




      





      add('Gives', !(C.powerPush && C.powerPush.enabled)
        ? 'what the machines downstream ask for, until it runs dry'
        : C.powerPush.bankSurplus
          ? 'what the machines downstream can use, and its reserve on top when they want more'
          : 'everything that reaches it, and its reserve on top when more is wanted');
      if (C.powerPush && C.powerPush.enabled)
        add('To bank it', C.powerPush.bankSurplus
          ? 'nothing to do, whatever downstream cannot use stays in the cells'
          : 'set an output limit, and it keeps back whatever is over that');
      
      if (t.strikeCharge) add('Every strike', n(t.strikeCharge) + ' KW straight into the cells');
      if (t.idleDrain) add('Note', 'bleeds ' + n(t.idleDrain) + ' KW/h with nothing wired out');
    } else if (t.interestPct) {
      
      
      
      const live = f => { try { return GG.sim.stat(t.id, f); } catch (e) { return t[f]; } };
      add('Holds', kg(t.interestRes || 'gold', live('buffer') || 0));
      add('Pays', n(Math.round(live('interestPct') * 100) / 100) + '% of its value a minute');
      add('Note', 'the gold is kept, never used up');
    } else if (t.hire) {
      const h = t.hire;
      add('Hires', 'up to ' + n(h.max) + ' hands, for up to ' + n((h.maxSec || h.sec) / 60) + ' min');
      add('Each hand', 'works like a Volunteer while the contract runs');
      add('Note', 'a contract signed while hands are working costs more for every one of them');
    } else if (t.autoHire) {
      
      add('Hires at', 'the Hiring Posts and Labour Exchanges in its place');
      add('Pays with', 'only what the Bank under it earns');
    } else if (t.recruit) {
      add('Takes', 'workforce AND energy, into two separate pools');
      add('Makes', 'one recruit when BOTH pools reach ' + n(t.need) +
                   ', and it works like a Volunteer for ever');
      



      add('Then', 'every recruit this machine has raised makes its next one ' +
                  n(Math.round((((GG.sim && GG.sim.hubGrowth) ? GG.sim.hubGrowth(t)
                                                              : t.needGrowth) - 1) * 100)) + '% dearer');
    } else if (t.lanes) {
      
      let kg = t.buffer;
      try { kg = GG.sim.stat(t.id, 'buffer'); } catch (e) {  }
      add('Takes', 'up to ' + n(t.laneInputs) + ' wires into each of ' + n(t.lanes.length) + ' shelves');
      add('Makes', 'each shelf out of its own wire');
      add('Holds', n(kg) + ' kg on each shelf, one material a shelf');
    } else if (t.merge) {
      add('Takes', 'up to ' + n(t.maxInputs || 5) + ' wires of the same thing');
      add('Makes', 'their sum, out of one wire');
      




      if (t.holdLock) {
        




        const acc = ((((t.ports || {}).in || [])[0] || {}).accepts) || [];
        const wet = acc.length > 0 && acc.every(r => FLUIDS.indexOf(r) !== -1);
        











        let holds = t.buffer;
        try { holds = GG.sim.stat(t.id, 'buffer'); } catch (e) {  }
        add('Holds', n(holds) + ' kg of one ' + (wet ? 'fluid' : 'material'));
        



        if (typeof t.outRate === 'number') add('Gives', n(t.outRate) + ' kg/h, set in its panel');
      }
    } else if (t.splitter) {
      add('Takes', 'one wire in');
      
      if (t.priority) add('Makes', 'two wires out, all of it to one side');
      else {
      add('Makes', 'two wires out, split by the two weights you type');
      


      add('Note', t.passesMaterial ? 'if one output is full, the other keeps its share'
                                   : 'a blocked output throttles both sides, so the ratio you typed is the promise');
      }
    } else if (t.collectB) {
      






      const mat = ((t.ports && t.ports.in) || [])
        .filter(p => (C.resources[p.res] || {}).flow === 'material');
      const sell = mat.filter(p => p.mode !== 'burn').length;
      const burn = mat.length - sell;
      const curA = C.currencies[t.collect.cur] || { name: t.collect.cur };
      const curB = C.currencies[t.collectB.cur] || { name: t.collectB.cur };
      add('Sells', sell + (sell > 1 ? ' wires' : ' wire') + ' into ' + curA.name +
                   ', a till of ' + n(t.collect.cap));
      add('Burns', burn + (burn > 1 ? ' wires' : ' wire') + ' into ' + curB.name +
                   ', a till of ' + n(t.collectB.cap));
      add('Note', 'each till JAMS its own half when it fills, so the other side ' +
                  'carries on working');
    } else if (t.collect) {
      const cur = C.currencies[t.collect.cur] || { name: t.collect.cur };
      const socks = (t.ports && t.ports.in) || [];
      add('Takes', socks.length + (socks.length > 1 ? ' wires' : ' wire') +
                   ', and every grade below has a price');
      add('Pays', cur.name + ' into a till of ' + n(t.collect.cap));
      add('Note', 'it JAMS when the till is full, so press ' +
                  (t.collect.label || 'COLLECT') + ' to empty it');
    } else if (t.pullCost && (GG.config.ui || {}).beaconLocal) {
      
      add('Takes', 'energy, into a bank of ' + n(t.bank) + ' KW');
      add('Makes', 'a meteorite for ' + n(t.pullCost) + ' KW, in its own place and within ' +
                   n(t.range) + ' of it');
    } else if (t.predict) {
      add('Takes', 'energy, into a bank of ' + n(t.bank) + ' KW');
      add('Makes', 'nothing, and it spends ' + n(t.predict.cost) +
                   ' KW to name the next weather before it lands');
    }
  }

  












  if (t.autoCollect) {
    const ac = (t.autoCollect || [])[0] || {};
    const acCur = C.currencies[(t.collect || {}).cur] || {};
    const acCurB = t.collectB ? (C.currencies[t.collectB.cur] || {}) : null;
    





    if (ac.perUnit && acCur.rate && acCurB && acCurB.rate) {
      add('Crew', 'each 1 WF/h clears ' + n(ac.perUnit) + ' ' + acCur.rate + ' and ' +
                  n(ac.perUnit) + ' ' + acCurB.rate + ' at once, so give it less crew ' +
                  'than it earns and it still fills up');
    } else if (ac.perUnit && acCur.rate) {
      add('Crew', 'each 1 WF/h clears ' + n(ac.perUnit) + ' ' + acCur.rate +
                  ', so give it less crew than it earns and it still fills up');
    } else {
      add('Crew', 'the crew you wire in sets how fast it empties');
    }
  }
  doses.forEach(d => {
    
    add(d.build ? 'Built from' : 'Also takes', join(Object.keys(d.in || {}).map(r => kg(r, d.in[r]))));
    add(d.build ? 'Then' : 'Which does', d.note);
  });
  
  if (t.spec) add('Watch out', t.spec);
  return rows;
};



















GG.config.applyRebalance = function () {
  const C = GG.config, R = C.rebalance;
  if (!R || !R.enabled) return null;
  const done = { dross: {}, nodes: {}, skills: {} };
  Object.keys(R.dross || {}).forEach(k => {
    done.dross[k] = [C.gradePricing.dross[k], R.dross[k]];
    C.gradePricing.dross[k] = R.dross[k];
  });
  Object.keys(R.nodes || {}).forEach(id => {
    const t = C.nodeTypes[id];
    if (!t) return;
    done.nodes[id] = {};
    Object.keys(R.nodes[id]).forEach(f => {
      done.nodes[id][f] = [t[f], R.nodes[id][f]];
      t[f] = R.nodes[id][f];
    });
  });
  


  Object.keys(R.skills || {}).forEach(id => {
    const s = (C.skills || []).filter(x => x.id === id)[0];
    const p = R.skills[id];
    if (!s || !s.effects || s.effects.length !== 1 || p.effect === undefined) {
      console.warn('[ReGen] rebalance.skills: "' + id + '" is missing, or does not have ' +
                   'exactly one effect — left alone');
      return;
    }
    done.skills[id] = { effect: [s.effects[0].value, p.effect] };
    s.effects[0].value = p.effect;
  });
  return done;                      
};
























GG.config.exchangeRate = function (opts) {
  const C = GG.config, P = C.gradePricing || {};
  const live = !!(opts && opts.live) && !!(GG.sim && GG.sim.statNoBoost);
  function cheapestPerUnit(field) {
    let best = null;
    Object.keys(C.nodeTypes).forEach(k => {
      const t = C.nodeTypes[k];
      
      
      
      
      
      if (!t[field] || !t.cost || C.driveIns(t).length) return;
      const n = t.cap || 5;
      let tot = 0;
      for (let i = 0; i < n; i++) {
        if (t.cost.freeStock && i < t.cost.freeStock) continue;
        tot += t.cost.base * Math.pow(t.cost.growth, i - (t.cost.freeStock || 0));
      }
      
      let rate = live ? GG.sim.statNoBoost(k, field) : t[field];
      if (t.duty) rate = rate * t.duty.onSec / (t.duty.onSec + t.duty.offSec);
      if (tot <= 0 || !(rate > 0)) return;                  
      const per = tot / (rate * n);
      if (best === null || per < best.per) best = { per: per, id: k };
    });
    return best;
  }
  const wfSrc = cheapestPerUnit('wfRate'), kwSrc = cheapestPerUnit('energyRate');
  const wfPerKw = P.wfPerKw !== null && P.wfPerKw !== undefined ? P.wfPerKw
    : (wfSrc && kwSrc ? wfSrc.per / kwSrc.per : 1);
  return { wfPerKw: wfPerKw, wfSrc: wfSrc, kwSrc: kwSrc, live: live };
};






GG.config.buildGradeValues = function (opts) {
  const C = GG.config, P = C.gradePricing;
  if (!P || !P.enabled) return null;
  const quiet = opts && opts.quiet;

  

  const X = C.exchangeRate();
  const wfSrc = X.wfSrc, kwSrc = X.kwSrc, wfPerKw = X.wfPerKw;
  const supply = (kw, wf) => (kw || 0) + wfPerKw * (wf || 0);

  

  const madeBy = {};
  Object.keys(C.nodeTypes).forEach(k => {
    const t = C.nodeTypes[k];
    C.gradeFlow(t).forEach(f => {
      const real = Object.keys(f.out || {}).filter(r => !(f.in || {})[r] && f.out[r] > 0);
      if (!real.length) return;
      const mass = real.reduce((s, r) => s + f.out[r], 0);
      real.forEach(r => { if (!madeBy[r]) madeBy[r] = { id: k, t: t, f: f, mass: mass }; });
    });
  });

  
  const costMemo = {};
  function costOf(r, seen) {
    if (costMemo[r] !== undefined) return costMemo[r];
    seen = seen || {};
    if (seen[r]) return 0;                       
    seen[r] = 1;
    const p = madeBy[r];
    if (!p) return 0;                            
    let c = supply(p.f.kw, p.f.wf);
    Object.keys(p.f.in || {}).forEach(i => {
      c += p.f.in[i] * costOf(i, Object.assign({}, seen));
    });
    const v = c / p.mass;
    costMemo[r] = v;
    return v;
  }

  
  function depthOf(r, seen) {
    seen = seen || {};
    if (seen[r]) return 0;
    seen[r] = 1;
    const p = madeBy[r];
    if (!p) return 1;
    const ins = Object.keys(p.f.in || {});
    return 1 + Math.max.apply(null, [0].concat(ins.map(i => depthOf(i, Object.assign({}, seen)))));
  }

  



  function hasUse(r) {
    return Object.keys(C.nodeTypes).some(k => {
      const t = C.nodeTypes[k];
      










      if (t.merge || t.passesMaterial) return false;
      



      const isEnd = !!(t.virtualOut && t.collect && t.processRate);
      const viaPort = !isEnd && ((t.ports && t.ports.in) || [])
        .some(p => (p.accepts || [p.res]).indexOf(r) >= 0);
      const viaRecipe = !!(t.recipe && t.recipe.inputs && t.recipe.inputs[r]);
      return viaPort || viaRecipe;
    });
  }

  function roleOf(r) {
    if (P.dross && P.dross[r] !== undefined) return { name: 'dross', f: P.dross[r] };
    

    if (P.rare && P.rare[r] !== undefined) return { name: 'rare', f: P.rare[r] };
    return hasUse(r) ? { name: 'ingredient', f: P.role.ingredient }
                     : { name: 'sell', f: P.role.sell };
  }

  function nice(v) {
    for (const [under, step] of P.rounding) if (v < under) return Math.round(v / step) * step;
    return Math.round(v);
  }

  
  const grades = Object.keys(C.gradeValue);
  const info = {};
  grades.forEach(r => {
    info[r] = { cost: costOf(r), depth: depthOf(r), role: roleOf(r) };
  });
  const a = info[P.anchor.res];
  if (!a || !a.cost) {
    console.warn('[ReGen] gradePricing: the anchor "' + P.anchor.res + '" has no derivable ' +
                 'cost — prices left as written');
    return null;
  }
  const R1 = P.anchor.value /
             (a.cost * a.role.f * Math.pow(P.depthGrowth, a.depth - 1));

  const table = {};
  grades.forEach(r => {
    const x = info[r];
    if (!x.cost) { table[r] = C.gradeValue[r]; x.kept = true; return; }   
    const raw = x.cost * R1 * Math.pow(P.depthGrowth, x.depth - 1) * x.role.f;
    x.raw = raw;
    table[r] = r === P.anchor.res ? P.anchor.value : +nice(raw).toFixed(2);
  });
  Object.keys(table).forEach(r => { C.gradeValue[r] = table[r]; });

  



  const warn = [];
  Object.keys(C.nodeTypes).forEach(k => {
    const t = C.nodeTypes[k];
    C.gradeFlow(t).forEach(f => {
      const os = Object.keys(f.out || {}).filter(r => C.gradeValue[r] !== undefined);
      if (!os.length) return;
      let vIn = 0, vOut = 0;
      Object.keys(f.in || {}).forEach(r => { vIn += f.in[r] * (C.gradeValue[r] || 0); });
      os.forEach(r => { vOut += f.out[r] * (C.gradeValue[r] || 0); });
      if (vOut < vIn - 1e-9) warn.push(t.name + ' turns $' + vIn.toFixed(2) +
        ' of material into $' + vOut.toFixed(2));
    });
  });
  

















  const free = [];
  Object.keys(P.dross || {}).forEach(r => {
    const p = madeBy[r];
    if (!p) return;
    const src = Object.keys(p.f.in || {})[0];
    if (!src || C.gradeValue[src] === undefined) return;
    if (C.gradeValue[r] >= C.gradeValue[src]) {
      free.push(p.t.name + ': starved, it turns ' + src + ' (' + C.gradeValue[src] +
                ') into ' + r + ' (' + C.gradeValue[r] + ') for NO supply — free money');
    }
  });
  if (free.length && !quiet) {
    console.warn('[ReGen] gradePricing: A STARVED SPLITTER IS PRINTING MONEY. Every ' +
                 'dross grade must be worth LESS than what it is made from:\n  ' +
                 free.join('\n  '));
  }

  return { wfPerKw: wfPerKw, wfSrc: wfSrc, kwSrc: kwSrc, R1: R1, info: info,
           table: table, warn: warn, free: free };
};
GG.config.applyRebalance();      
GG.config.buildGradeValues();
