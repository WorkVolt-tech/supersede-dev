export const CX = 900, CY = 900   // canvas center

export const SKILL_NODES = [
    // ── CENTER ──
    { id:'center', label:'Origin', type:'start', branch:'center', x:CX, y:CY, cost:0, requires:[] },

    // ═══════════════════════════════════════════════════════════════
    // ⚔️ OFFENSE  (upward) — ATK × Power × Insight
    // Theme: How you deal damage. Bruiser / Mage / Spellblade
    // ═══════════════════════════════════════════════════════════════
    // Spine
    { id:'of1', label:'+2 ATK',      type:'small', branch:'offense', x:CX,      y:CY-90,  cost:1, stat:'atk_bonus',   val:2, requires:['center'] },
    { id:'of2', label:'+3 ATK',      type:'small', branch:'offense', x:CX,      y:CY-170, cost:1, stat:'atk_bonus',   val:3, requires:['of1'] },
    { id:'of3', label:'+2 ATK',      type:'small', branch:'offense', x:CX,      y:CY-250, cost:1, stat:'atk_bonus',   val:2, requires:['of2'] },
    // Power fork (left)
    { id:'ofp1', label:'+2 Power',   type:'small', branch:'offense', x:CX-100,  y:CY-185, cost:1, stat:'power_bonus',  val:2, requires:['of2'] },
    { id:'ofp2', label:'+3 Power',   type:'small', branch:'offense', x:CX-100,  y:CY-265, cost:1, stat:'power_bonus',  val:3, requires:['ofp1'] },
    { id:'ofp3', label:'+2 Power',   type:'small', branch:'offense', x:CX-175,  y:CY-285, cost:1, stat:'power_bonus',  val:2, requires:['ofp2'] },
    { id:'ofp4', label:'+2 ATK',     type:'small', branch:'offense', x:CX-190,  y:CY-355, cost:1, stat:'atk_bonus',   val:2, requires:['ofp3'] },
    // Insight fork (right)
    { id:'ofi1', label:'+2 Insight', type:'small', branch:'offense', x:CX+100,  y:CY-185, cost:1, stat:'insight_bonus', val:2, requires:['of2'] },
    { id:'ofi2', label:'+3 Insight', type:'small', branch:'offense', x:CX+100,  y:CY-265, cost:1, stat:'insight_bonus', val:3, requires:['ofi1'] },
    { id:'ofi3', label:'+2 Power',   type:'small', branch:'offense', x:CX+175,  y:CY-285, cost:1, stat:'power_bonus',  val:2, requires:['ofi2'] },
    { id:'ofi4', label:'+2 Insight', type:'small', branch:'offense', x:CX+190,  y:CY-355, cost:1, stat:'insight_bonus', val:2, requires:['ofi3'] },
    // Notable tier 1
    { id:'ofn1', label:'Warbound',   type:'notable', battleType:'active',  branch:'offense', x:CX,      y:CY-330, cost:2, stat:'atk_bonus', val:6, requires:['of3'],
      desc:'◆ OFFENSE NOTABLE: +6 ATK. Your attacks deal bonus damage equal to 12% of your ATK. Stacks with Power multiplier — raw strength finds the crack.' },
    { id:'ofn2', label:'Amplifier',  type:'notable', battleType:'passive', branch:'offense', x:CX-220,  y:CY-375, cost:2, stat:'power_bonus', val:5, requires:['ofp4'],
      desc:'◆ OFFENSE NOTABLE: +5 Power. Power now contributes +0.5 ATK per Power point. Invest in amplification and physical hits follow. The Bruiser path.' },
    { id:'ofn3', label:'Spellblade', type:'notable', battleType:'passive', branch:'offense', x:CX+220,  y:CY-375, cost:2, stat:'insight_bonus', val:5, requires:['ofi4'],
      desc:'◆ SYNERGY — OFFENSE × ARCANE: +5 Insight. ATK and Insight both feed your damage formula: Damage = (ATK + Insight×0.6) × Power. The hybrid path.' },
    // Deep spine
    { id:'of4',  label:'+3 ATK',     type:'small', branch:'offense', x:CX,      y:CY-420, cost:1, stat:'atk_bonus',   val:3, requires:['ofn1'] },
    { id:'of5',  label:'+2 Power',   type:'small', branch:'offense', x:CX,      y:CY-500, cost:1, stat:'power_bonus',  val:2, requires:['of4'] },
    { id:'of6',  label:'+3 ATK',     type:'small', branch:'offense', x:CX,      y:CY-580, cost:1, stat:'atk_bonus',   val:3, requires:['of5'] },
    // Power deep
    { id:'ofp5', label:'+3 Power',   type:'small', branch:'offense', x:CX-90,   y:CY-470, cost:1, stat:'power_bonus',  val:3, requires:['ofn2','of4'] },
    { id:'ofp6', label:'+2 Power',   type:'small', branch:'offense', x:CX-90,   y:CY-550, cost:1, stat:'power_bonus',  val:2, requires:['ofp5'] },
    // Insight deep
    { id:'ofi5', label:'+3 Insight', type:'small', branch:'offense', x:CX+90,   y:CY-470, cost:1, stat:'insight_bonus', val:3, requires:['ofn3','of4'] },
    { id:'ofi6', label:'+2 Insight', type:'small', branch:'offense', x:CX+90,   y:CY-550, cost:1, stat:'insight_bonus', val:2, requires:['ofi5'] },
    // Notable tier 2
    { id:'ofn4', label:"Executioner", type:'notable', battleType:'active',  branch:'offense', x:CX-140,  y:CY-620, cost:2, stat:'atk_bonus',    val:8, requires:['ofp6'],
      desc:'◆ OFFENSE NOTABLE: +8 ATK. Deal 25% more damage to enemies below 35% HP. Power multiplier doubles on killing blows. Finish what you started.' },
    { id:'ofn5', label:'Hex Cannon', type:'notable', battleType:'active',  branch:'offense', x:CX+140,  y:CY-620, cost:2, stat:'insight_bonus', val:8, requires:['ofi6'],
      desc:'◆ SYNERGY — OFFENSE × ARCANE: +8 Insight. Spells now scale off both Insight and ATK. Each Control debuff on the enemy boosts your damage by 8%. The Hexblade path.' },
    { id:'ofn6', label:'Predator',   type:'notable', battleType:'active',  branch:'offense', x:CX,      y:CY-650, cost:2, stat:'atk_bonus',    val:6, requires:['of6'],
      desc:'◆ SYNERGY — OFFENSE × FLOW: +6 ATK. Gain +15 ATK for 2 turns after an enemy falls. Speed determines who strikes first into the gap — invest in both.' },
    // Pre-keystone
    { id:'of7',  label:'+3 ATK',     type:'small', branch:'offense', x:CX-70,   y:CY-720, cost:1, stat:'atk_bonus',   val:3, requires:['ofn4','ofn6'] },
    { id:'of8',  label:'+4 ATK',     type:'small', branch:'offense', x:CX+70,   y:CY-720, cost:1, stat:'atk_bonus',   val:4, requires:['ofn5','ofn6'] },
    { id:'ofp7', label:'+3 Power',   type:'small', branch:'offense', x:CX-160,  y:CY-690, cost:1, stat:'power_bonus',  val:3, requires:['of7'] },
    { id:'ofi7', label:'+3 Insight', type:'small', branch:'offense', x:CX+160,  y:CY-690, cost:1, stat:'insight_bonus', val:3, requires:['of8'] },
    // Keystones
    { id:'of_ks1', label:'Bloodthirst', type:'keystone', battleType:'active',  branch:'offense', x:CX-150, y:CY-820, cost:3, requires:['of7'],
      desc:'★ KEYSTONE — OFFENSE: ATK scales with missing HP. For every 10% HP missing, gain +10% ATK. At low HP you hit nearly double. High risk, maximum output.' },
    { id:'of_ks2', label:'Spell Surge', type:'keystone', battleType:'active',  branch:'offense', x:CX+150, y:CY-820, cost:3, requires:['of8'],
      desc:'★ KEYSTONE — OFFENSE × ARCANE: Insight now directly scales ATK at +2 ATK per Insight point. A pure mage out-damages brute force. Magic is violence.' },

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ DEFENSE  (lower-right) — DEF × Guard × HP scaling
    // Theme: How you survive. Tank / Shield / Thorns
    // ═══════════════════════════════════════════════════════════════
    // Spine
    { id:'df1',  label:'+3 DEF',     type:'small', branch:'defense', x:CX+53, y:CY+73,  cost:1, stat:'def_bonus',   val:3, requires:['center'] },
    { id:'df2',  label:'+4 DEF',     type:'small', branch:'defense', x:CX+100, y:CY+138, cost:1, stat:'def_bonus',   val:4, requires:['df1'] },
    { id:'df3',  label:'+3 DEF',     type:'small', branch:'defense', x:CX+147, y:CY+202, cost:1, stat:'def_bonus',   val:3, requires:['df2'] },
    // Guard fork (left)
    { id:'dfg1', label:'+2 Guard',   type:'small', branch:'defense', x:CX+190, y:CY+91, cost:1, stat:'guard_bonus', val:2, requires:['df2'] },
    { id:'dfg2', label:'+3 Guard',   type:'small', branch:'defense', x:CX+237, y:CY+156, cost:1, stat:'guard_bonus', val:3, requires:['dfg1'] },
    { id:'dfg3', label:'+2 Guard',   type:'small', branch:'defense', x:CX+309, y:CY+128, cost:1, stat:'guard_bonus', val:2, requires:['dfg2'] },
    { id:'dfg4', label:'+3 Guard',   type:'small', branch:'defense', x:CX+362, y:CY+176, cost:1, stat:'guard_bonus', val:3, requires:['dfg3'] },
    // ATK fork (right — DEF×ATK synergy)
    { id:'dfa1', label:'+2 DEF',     type:'small', branch:'defense', x:CX+28, y:CY+208,  cost:1, stat:'def_bonus',   val:2, requires:['df2'] },
    { id:'dfa2', label:'+3 DEF',     type:'small', branch:'defense', x:CX+75, y:CY+273, cost:1, stat:'def_bonus',   val:3, requires:['dfa1'] },
    { id:'dfa3', label:'+2 ATK',     type:'small', branch:'defense', x:CX+26, y:CY+333, cost:1, stat:'atk_bonus',   val:2, requires:['dfa2'] },
    { id:'dfa4', label:'+3 ATK',     type:'small', branch:'defense', x:CX+55, y:CY+399, cost:1, stat:'atk_bonus',   val:3, requires:['dfa3'] },
    // Notable tier 1
    { id:'dfn1', label:'Iron Tide',  type:'notable', battleType:'passive', branch:'defense', x:CX+194, y:CY+267, cost:2, stat:'def_bonus',   val:8, requires:['df3'],
      desc:'◆ DEFENSE NOTABLE: +8 DEF. First time you fall below 50% HP, gain +20 DEF for 2 turns. DEF softens the blow — Guard absorbs the rest — HP pays the remainder.' },
    { id:'dfn2', label:'Absorption', type:'notable', battleType:'passive', branch:'defense', x:CX+398, y:CY+174, cost:2, stat:'guard_bonus', val:5, requires:['dfg4'],
      desc:'◆ DEFENSE NOTABLE: +5 Guard. Each hit charges a stack. At 3 stacks, next Defend heals 15 HP. Guard becomes a resource — patience is your weapon.' },
    { id:'dfn3', label:'Thorns',     type:'notable', battleType:'passive', branch:'defense', x:CX+42, y:CY+433, cost:2, stat:'def_bonus',   val:6, requires:['dfa4'],
      desc:'◆ SYNERGY — DEFENSE × OFFENSE: +6 DEF, +4 ATK. When hit, reflect 20% of absorbed Guard damage back as physical damage. DEF feeds ATK. The Thorns build.' },
    // Deep spine
    { id:'df4',  label:'+4 DEF',     type:'small', branch:'defense', x:CX+247, y:CY+340, cost:1, stat:'def_bonus',   val:4, requires:['dfn1'] },
    { id:'df5',  label:'+3 Guard',   type:'small', branch:'defense', x:CX+294, y:CY+405, cost:1, stat:'guard_bonus', val:3, requires:['df4'] },
    { id:'df6',  label:'+4 DEF',     type:'small', branch:'defense', x:CX+341, y:CY+469, cost:1, stat:'def_bonus',   val:4, requires:['df5'] },
    // Guard deep
    { id:'dfg5', label:'+3 Guard',   type:'small', branch:'defense', x:CX+349, y:CY+327, cost:1, stat:'guard_bonus', val:3, requires:['dfn2','df4'] },
    { id:'dfg6', label:'+4 Guard',   type:'small', branch:'defense', x:CX+396, y:CY+392, cost:1, stat:'guard_bonus', val:4, requires:['dfg5'] },
    // ATK deep
    { id:'dfa5', label:'+3 ATK',     type:'small', branch:'defense', x:CX+203, y:CY+433, cost:1, stat:'atk_bonus',   val:3, requires:['dfn3','df4'] },
    { id:'dfa6', label:'+4 DEF',     type:'small', branch:'defense', x:CX+250, y:CY+498, cost:1, stat:'def_bonus',   val:4, requires:['dfa5'] },
    // Notable tier 2
    { id:'dfn4', label:'Fortress',   type:'notable', battleType:'active',  branch:'defense', x:CX+478, y:CY+419, cost:2, stat:'guard_bonus', val:8, requires:['dfg6'],
      desc:'◆ DEFENSE NOTABLE: +8 Guard. Guard now scales with current HP — the fuller your HP pool, the more Guard you generate passively each turn. HP becomes your fuel.' },
    { id:'dfn5', label:'Retaliation',type:'notable', battleType:'passive', branch:'defense', x:CX+251, y:CY+584, cost:2, stat:'def_bonus',   val:8, requires:['dfa6'],
      desc:'◆ SYNERGY — DEFENSE × OFFENSE: +8 DEF. After taking 3 consecutive hits, automatically counter-strike for 60% ATK ignoring 40% DEF. Pressure builds, then breaks.' },
    { id:'dfn6', label:'Bulwark',    type:'notable', battleType:'passive', branch:'defense', x:CX+382, y:CY+526, cost:2, stat:'def_bonus',   val:8, requires:['df6'],
      desc:'◆ DEFENSE NOTABLE: +8 DEF. After 2 consecutive hits, DEF is doubled for the following turn. Stack this with Guard absorption for near-invulnerability windows.' },
    // Pre-keystone
    { id:'df7',  label:'+4 DEF',     type:'small', branch:'defense', x:CX+480, y:CY+541, cost:1, stat:'def_bonus',   val:4, requires:['dfn4','dfn6'] },
    { id:'df8',  label:'+4 Guard',   type:'small', branch:'defense', x:CX+367, y:CY+624, cost:1, stat:'guard_bonus', val:4, requires:['dfn5','dfn6'] },
    { id:'dfg7', label:'+3 Guard',   type:'small', branch:'defense', x:CX+535, y:CY+464, cost:1, stat:'guard_bonus', val:3, requires:['df7'] },
    { id:'dfa7', label:'+3 ATK',     type:'small', branch:'defense', x:CX+276, y:CY+652, cost:1, stat:'atk_bonus',   val:3, requires:['df8'] },
    // Keystones
    { id:'df_ks1', label:'Deep Current', type:'keystone', battleType:'active',  branch:'defense', x:CX+603, y:CY+575, cost:3, requires:['df7'],
      desc:'★ KEYSTONE — DEFENSE: DEF scales with current HP. The more HP you have, the harder you are to dent. Max HP items now also boost DEF. Flow adapts to pressure.' },
    { id:'df_ks2', label:'Iron Mirror',  type:'keystone', battleType:'active',  branch:'defense', x:CX+361, y:CY+752, cost:3, requires:['df8'],
      desc:'★ KEYSTONE — DEFENSE × OFFENSE: Reflect 40% of all damage taken back as pure unblockable damage. Metal returns everything. Every hit you take is a hit you land.' },

    // ═══════════════════════════════════════════════════════════════
    // ⚡ FLOW  (leftward) — Speed × Agility × Control
    // Theme: Who controls the fight. Tempo / Dodge / Debuff
    // ═══════════════════════════════════════════════════════════════
    // Spine
    { id:'fl1',  label:'+2 SPD',     type:'small', branch:'flow', x:CX-86, y:CY-28,  cost:1, stat:'speed_bonus',   val:2, requires:['center'] },
    { id:'fl2',  label:'+3 SPD',     type:'small', branch:'flow', x:CX-162, y:CY-53,  cost:1, stat:'speed_bonus',   val:3, requires:['fl1'] },
    { id:'fl3',  label:'+2 SPD',     type:'small', branch:'flow', x:CX-238, y:CY-77,  cost:1, stat:'speed_bonus',   val:2, requires:['fl2'] },
    // Agility fork (upper)
    { id:'fla1', label:'+2 AGI',     type:'small', branch:'flow', x:CX-207, y:CY+38, cost:1, stat:'speed_bonus',   val:2, requires:['fl2'] },
    { id:'fla2', label:'+3 AGI',     type:'small', branch:'flow', x:CX-283, y:CY+13, cost:1, stat:'speed_bonus',   val:3, requires:['fla1'] },
    { id:'fla3', label:'+2 AGI',     type:'small', branch:'flow', x:CX-325, y:CY+78, cost:1, stat:'speed_bonus',   val:2, requires:['fla2'] },
    { id:'fla4', label:'+3 SPD',     type:'small', branch:'flow', x:CX-396, y:CY+71, cost:1, stat:'speed_bonus',   val:3, requires:['fla3'] },
    // Control fork (lower)
    { id:'flc1', label:'+2 CTR',     type:'small', branch:'flow', x:CX-145, y:CY-152,  cost:1, stat:'control_bonus', val:2, requires:['fl2'] },
    { id:'flc2', label:'+3 CTR',     type:'small', branch:'flow', x:CX-221, y:CY-177,   cost:1, stat:'control_bonus', val:3, requires:['flc1'] },
    { id:'flc3', label:'+2 CTR',     type:'small', branch:'flow', x:CX-217, y:CY-255,  cost:1, stat:'control_bonus', val:2, requires:['flc2'] },
    { id:'flc4', label:'+3 SPD',     type:'small', branch:'flow', x:CX-279, y:CY-290,  cost:1, stat:'speed_bonus',   val:3, requires:['flc3'] },
    // Notable tier 1
    { id:'fln1', label:'Razor Tempo',type:'notable', battleType:'passive', branch:'flow', x:CX-314, y:CY-102, cost:2, stat:'speed_bonus',   val:6, requires:['fl3'],
      desc:'◆ FLOW NOTABLE: +6 SPD. Your Strike always resolves first regardless of enemy Speed. You set the tempo — the enemy reacts to you.' },
    { id:'fln2', label:'Ghost Step',  type:'notable', battleType:'passive', branch:'flow', x:CX-425, y:CY+93, cost:2, stat:'speed_bonus',   val:5, requires:['fla4'],
      desc:'◆ SYNERGY — FLOW × OFFENSE: +5 SPD. 20% dodge chance. On dodge, counter-strike for 60% ATK immediately. Agility becomes offense — the dodge counter build.' },
    { id:'fln3', label:'Lockdown',   type:'notable', battleType:'active',  branch:'flow', x:CX-289, y:CY-325,  cost:2, stat:'control_bonus', val:5, requires:['flc4'],
      desc:'◆ SYNERGY — FLOW × ARCANE: +5 CTR. Reduce enemy SPD by 8 permanently per battle and apply Slow on first hit (enemy skips a turn). Control denies their game.' },
    // Deep spine
    { id:'fl4',  label:'+3 SPD',     type:'small', branch:'flow', x:CX-399, y:CY-130, cost:1, stat:'speed_bonus',   val:3, requires:['fln1'] },
    { id:'fl5',  label:'+2 CTR',     type:'small', branch:'flow', x:CX-476, y:CY-155, cost:1, stat:'control_bonus', val:2, requires:['fl4'] },
    { id:'fl6',  label:'+3 SPD',     type:'small', branch:'flow', x:CX-552, y:CY-179, cost:1, stat:'speed_bonus',   val:3, requires:['fl5'] },
    // Agility deep
    { id:'fla5', label:'+3 SPD',     type:'small', branch:'flow', x:CX-475, y:CY-60, cost:1, stat:'speed_bonus',   val:3, requires:['fln2','fl4'] },
    { id:'fla6', label:'+2 CTR',     type:'small', branch:'flow', x:CX-551, y:CY-84, cost:1, stat:'control_bonus', val:2, requires:['fla5'] },
    // Control deep
    { id:'flc5', label:'+3 CTR',     type:'small', branch:'flow', x:CX-419, y:CY-231,  cost:1, stat:'control_bonus', val:3, requires:['fln3','fl4'] },
    { id:'flc6', label:'+2 SPD',     type:'small', branch:'flow', x:CX-495, y:CY-256,  cost:1, stat:'speed_bonus',   val:2, requires:['flc5'] },
    // Notable tier 2
    { id:'fln4', label:'Flicker',    type:'notable', battleType:'passive', branch:'flow', x:CX-633, y:CY-58, cost:2, stat:'speed_bonus',  val:8,  requires:['fla6'],
      desc:'◆ FLOW NOTABLE: +8 SPD. On dodge, your next Strike deals double damage. If you have Arcane nodes, the proc also triggers a free spell hit. Agility becomes your opener.' },
    { id:'fln5', label:'Stagger',    type:'notable', battleType:'passive', branch:'flow', x:CX-546, y:CY-325,  cost:2, stat:'control_bonus', val:6, requires:['flc6'],
      desc:'◆ SYNERGY — FLOW × ARCANE: +6 CTR. 25% chance each turn to stagger the enemy — they miss their attack. Control debuffs further reduce their hit chance by 5% per stack.' },
    { id:'fln6', label:'Momentum',   type:'notable', battleType:'active', branch:'flow', x:CX-618, y:CY-201, cost:2, stat:'speed_bonus',  val:8,  requires:['fl6'],
      desc:'◆ SYNERGY — FLOW × OFFENSE: +8 SPD. Gain +1 ATK per SPD point above the enemy — moving faster translates directly into hitting harder. Speed is damage.' },
    // Pre-keystone
    { id:'fl7',  label:'+3 SPD',     type:'small', branch:'flow', x:CX-706, y:CY-156, cost:1, stat:'speed_bonus',   val:3, requires:['fln4','fln6'] },
    { id:'fl8',  label:'+3 CTR',     type:'small', branch:'flow', x:CX-663, y:CY-289, cost:1, stat:'control_bonus', val:3, requires:['fln5','fln6'] },
    { id:'fla7', label:'+2 SPD',     type:'small', branch:'flow', x:CX-706, y:CY-61, cost:1, stat:'speed_bonus',   val:2, requires:['fl7'] },
    { id:'flc7', label:'+2 CTR',     type:'small', branch:'flow', x:CX-607, y:CY-365, cost:1, stat:'control_bonus', val:2, requires:['fl8'] },
    // Keystones
    { id:'fl_ks1', label:'Phantom Step', type:'keystone', battleType:'active',  branch:'flow', x:CX-826, y:CY-111, cost:3, requires:['fl7'],
      desc:'★ KEYSTONE — FLOW: Dodge becomes a flat 40% chance. On every dodge, deal a free counter hit AND reset your turn cooldown. Nearly untouchable — the ultimate Agility build.' },
    { id:'fl_ks2', label:'Time Lock',    type:'keystone', battleType:'active',  branch:'flow', x:CX-734, y:CY-396, cost:3, requires:['fl8'],
      desc:'★ KEYSTONE — FLOW × ARCANE: Control debuffs compound — each debuff on the enemy reduces their SPD by 5 and ATK by 3 additionally. Stack Control to freeze the enemy in time.' },

    // ═══════════════════════════════════════════════════════════════
    // 🔮 ARCANE  (rightward) — Insight × Control × Luck
    // Theme: Magic & manipulation. Mage / Hex / Chaos
    // ═══════════════════════════════════════════════════════════════
    // Spine
    { id:'ar1',  label:'+2 Insight', type:'small', branch:'arcane', x:CX+86, y:CY-28,  cost:1, stat:'insight_bonus', val:2, requires:['center'] },
    { id:'ar2',  label:'+3 Insight', type:'small', branch:'arcane', x:CX+162, y:CY-53,  cost:1, stat:'insight_bonus', val:3, requires:['ar1'] },
    { id:'ar3',  label:'+2 Insight', type:'small', branch:'arcane', x:CX+238, y:CY-77,  cost:1, stat:'insight_bonus', val:2, requires:['ar2'] },
    // Control fork (upper)
    { id:'arc1', label:'+2 CTR',     type:'small', branch:'arcane', x:CX+145, y:CY-152, cost:1, stat:'control_bonus', val:2, requires:['ar2'] },
    { id:'arc2', label:'+3 CTR',     type:'small', branch:'arcane', x:CX+221, y:CY-177, cost:1, stat:'control_bonus', val:3, requires:['arc1'] },
    { id:'arc3', label:'+2 Insight', type:'small', branch:'arcane', x:CX+217, y:CY-255, cost:1, stat:'insight_bonus', val:2, requires:['arc2'] },
    { id:'arc4', label:'+3 CTR',     type:'small', branch:'arcane', x:CX+279, y:CY-290, cost:1, stat:'control_bonus', val:3, requires:['arc3'] },
    // Luck fork (lower)
    { id:'arl1', label:'+2 Luck',    type:'small', branch:'arcane', x:CX+207, y:CY+38,  cost:1, stat:'luck_bonus',    val:2, requires:['ar2'] },
    { id:'arl2', label:'+3 Luck',    type:'small', branch:'arcane', x:CX+283, y:CY+13,   cost:1, stat:'luck_bonus',    val:3, requires:['arl1'] },
    { id:'arl3', label:'+2 Luck',    type:'small', branch:'arcane', x:CX+325, y:CY+78,  cost:1, stat:'luck_bonus',    val:2, requires:['arl2'] },
    { id:'arl4', label:'+3 Insight', type:'small', branch:'arcane', x:CX+396, y:CY+71,  cost:1, stat:'insight_bonus', val:3, requires:['arl3'] },
    // Notable tier 1
    { id:'arn1', label:'Sharp Mind',  type:'notable', battleType:'passive', branch:'arcane', x:CX+314, y:CY-102, cost:2, stat:'insight_bonus', val:6, requires:['ar3'],
      desc:'◆ ARCANE NOTABLE: +6 Insight. Insight now grants +1 ATK per 3 Insight points. A mage who studies combat hits harder than a fighter who never thinks.' },
    { id:'arn2', label:'Hex Weave',  type:'notable', battleType:'active',  branch:'arcane', x:CX+289, y:CY-325, cost:2, stat:'control_bonus', val:5, requires:['arc4'],
      desc:'◆ SYNERGY — ARCANE × FLOW: +5 CTR. Each Control debuff on the enemy increases your spell damage by 10%. Debuff to amplify — the Hex build.' },
    { id:'arn3', label:'Wild Proc',  type:'notable', battleType:'passive', branch:'arcane', x:CX+425, y:CY+93,  cost:2, stat:'luck_bonus',    val:5, requires:['arl4'],
      desc:'◆ ARCANE NOTABLE: +5 Luck. Each Luck point increases crit chance by 0.5% and crit damage by 1%. Chaos magic rewards the unpredictable.' },
    // Deep spine
    { id:'ar4',  label:'+3 Insight', type:'small', branch:'arcane', x:CX+399, y:CY-130, cost:1, stat:'insight_bonus', val:3, requires:['arn1'] },
    { id:'ar5',  label:'+2 Luck',    type:'small', branch:'arcane', x:CX+476, y:CY-155, cost:1, stat:'luck_bonus',    val:2, requires:['ar4'] },
    { id:'ar6',  label:'+3 Insight', type:'small', branch:'arcane', x:CX+552, y:CY-179, cost:1, stat:'insight_bonus', val:3, requires:['ar5'] },
    // Control deep
    { id:'arc5', label:'+3 CTR',     type:'small', branch:'arcane', x:CX+419, y:CY-231, cost:1, stat:'control_bonus', val:3, requires:['arn2','ar4'] },
    { id:'arc6', label:'+2 Insight', type:'small', branch:'arcane', x:CX+495, y:CY-256, cost:1, stat:'insight_bonus', val:2, requires:['arc5'] },
    // Luck deep
    { id:'arl5', label:'+3 Luck',    type:'small', branch:'arcane', x:CX+475, y:CY-60,  cost:1, stat:'luck_bonus',    val:3, requires:['arn3','ar4'] },
    { id:'arl6', label:'+2 CTR',     type:'small', branch:'arcane', x:CX+551, y:CY-84,  cost:1, stat:'control_bonus', val:2, requires:['arl5'] },
    // Notable tier 2
    { id:'arn4', label:'Prescience', type:'notable', battleType:'passive', branch:'arcane', x:CX+546, y:CY-325, cost:2, stat:'insight_bonus', val:8, requires:['arc6'],
      desc:'◆ ARCANE NOTABLE: +8 Insight. Insight reduces enemy crit chance by 2% per point. Once per combat, predict an attack — reduce that hit by 90%. Mind sees before the body acts.' },
    { id:'arn5', label:'Ricochet',   type:'notable', battleType:'passive', branch:'arcane', x:CX+633, y:CY-58,  cost:2, stat:'luck_bonus',    val:6, requires:['arl6'],
      desc:'◆ SYNERGY — ARCANE × OFFENSE: +6 Luck. Spells have 25% chance to bounce — hit twice, second hit at 50% power. Luck chains crits. The Chaos Caster path.' },
    { id:'arn6', label:'Mind Pierce', type:'notable', battleType:'active', branch:'arcane', x:CX+618, y:CY-201, cost:2, stat:'insight_bonus', val:8, requires:['ar6'],
      desc:'◆ SYNERGY — ARCANE × OFFENSE: +8 Insight. Crit chance equals Insight÷4%. Crits deal ×2.0 and cannot be shielded — pure magic bypasses Guard entirely.' },
    // Pre-keystone
    { id:'ar7',  label:'+3 Insight', type:'small', branch:'arcane', x:CX+663, y:CY-289, cost:1, stat:'insight_bonus', val:3, requires:['arn4','arn6'] },
    { id:'ar8',  label:'+3 Luck',    type:'small', branch:'arcane', x:CX+706, y:CY-156, cost:1, stat:'luck_bonus',    val:3, requires:['arn5','arn6'] },
    { id:'arc7', label:'+2 CTR',     type:'small', branch:'arcane', x:CX+607, y:CY-365, cost:1, stat:'control_bonus', val:2, requires:['ar7'] },
    { id:'arl7', label:'+2 Luck',    type:'small', branch:'arcane', x:CX+706, y:CY-61, cost:1, stat:'luck_bonus',    val:2, requires:['ar8'] },
    // Keystones
    { id:'ar_ks1', label:'Sixth Sense',  type:'keystone', battleType:'active',  branch:'arcane', x:CX+734, y:CY-396, cost:3, requires:['ar7'],
      desc:'★ KEYSTONE — ARCANE × OFFENSE: Insight adds +2 ATK per point. Magic and martial become one — this is the Spellblade pinnacle. Out-damage brute force with pure mind.' },
    { id:'ar_ks2', label:'Chaos Engine', type:'keystone', battleType:'active',  branch:'arcane', x:CX+826, y:CY-111, cost:3, requires:['ar8'],
      desc:'★ KEYSTONE — ARCANE: Every attack and spell has a random bonus effect (burn, slow, drain, chain, or double damage). Luck determines frequency. Chaos cannot be predicted — even by you.' },

    // ═══════════════════════════════════════════════════════════════
    // 🌑 DECAY  (lower-left, 225°) — Speed × Power × Guard (hybrid)
    // Theme: Sustain & scaling over time. Assassin / Immortal / Sustain
    // ═══════════════════════════════════════════════════════════════
    // Spine
    { id:'dc1',  label:'+2 SPD',     type:'small', branch:'decay', x:CX-53, y:CY+73,  cost:1, stat:'speed_bonus',  val:2, requires:['center'] },
    { id:'dc2',  label:'+3 SPD',     type:'small', branch:'decay', x:CX-100, y:CY+138, cost:1, stat:'speed_bonus',  val:3, requires:['dc1'] },
    { id:'dc3',  label:'+2 Power',   type:'small', branch:'decay', x:CX-147, y:CY+202, cost:1, stat:'power_bonus',  val:2, requires:['dc2'] },
    // Kill-chain fork (left — Speed/Power)
    { id:'dck1', label:'+3 SPD',     type:'small', branch:'decay', x:CX-28, y:CY+208, cost:1, stat:'speed_bonus',  val:3, requires:['dc2'] },
    { id:'dck2', label:'+2 Power',   type:'small', branch:'decay', x:CX-75, y:CY+273, cost:1, stat:'power_bonus',  val:2, requires:['dck1'] },
    { id:'dck3', label:'+3 SPD',     type:'small', branch:'decay', x:CX-26, y:CY+333, cost:1, stat:'speed_bonus',  val:3, requires:['dck2'] },
    { id:'dck4', label:'+2 Power',   type:'small', branch:'decay', x:CX-55, y:CY+399, cost:1, stat:'power_bonus',  val:2, requires:['dck3'] },
    // Sustain fork (right — Guard/Control)
    { id:'dcs1', label:'+2 Guard',   type:'small', branch:'decay', x:CX-190, y:CY+91,  cost:1, stat:'guard_bonus',  val:2, requires:['dc2'] },
    { id:'dcs2', label:'+3 Guard',   type:'small', branch:'decay', x:CX-237, y:CY+156, cost:1, stat:'guard_bonus',  val:3, requires:['dcs1'] },
    { id:'dcs3', label:'+2 CTR',     type:'small', branch:'decay', x:CX-309, y:CY+128, cost:1, stat:'control_bonus', val:2, requires:['dcs2'] },
    { id:'dcs4', label:'+3 Guard',   type:'small', branch:'decay', x:CX-362, y:CY+176, cost:1, stat:'guard_bonus',  val:3, requires:['dcs3'] },
    // Notable tier 1
    { id:'dcn1', label:'Nightshroud',type:'notable', battleType:'active',  branch:'decay', x:CX-194, y:CY+267, cost:2, stat:'speed_bonus',  val:6, requires:['dc3'],
      desc:'◆ DECAY NOTABLE: +6 SPD. On the first turn of combat, gain a free dodge and deal a free Strike at 80% ATK. Decay rewards the opening — the kill-chain begins here.' },
    { id:'dcn2', label:'Umbral Veil',type:'notable', battleType:'passive', branch:'decay', x:CX-42, y:CY+433, cost:2, stat:'speed_bonus',  val:5, requires:['dck4'],
      desc:'◆ SYNERGY — DECAY × FLOW: +5 SPD. On kill, gain +15 SPD and +8 Power for 2 turns. Chain kills become a blur — the Assassin build scales with momentum.' },
    { id:'dcn3', label:'Thornwall',  type:'notable', battleType:'passive', branch:'decay', x:CX-398, y:CY+174, cost:2, stat:'guard_bonus',  val:6, requires:['dcs4'],
      desc:'◆ SYNERGY — DECAY × DEFENSE: +6 Guard. When you Defend, reflect 20% of absorbed damage back as thorns. The longer you survive, the more damage you return.' },
    // Deep spine
    { id:'dc4',  label:'+3 SPD',     type:'small', branch:'decay', x:CX-247, y:CY+340, cost:1, stat:'speed_bonus',  val:3, requires:['dcn1'] },
    { id:'dc5',  label:'+2 Guard',   type:'small', branch:'decay', x:CX-294, y:CY+405, cost:1, stat:'guard_bonus',  val:2, requires:['dc4'] },
    { id:'dc6',  label:'+3 Power',   type:'small', branch:'decay', x:CX-341, y:CY+469, cost:1, stat:'power_bonus',  val:3, requires:['dc5'] },
    // Kill-chain deep
    { id:'dck5', label:'+3 Power',   type:'small', branch:'decay', x:CX-203, y:CY+433, cost:1, stat:'power_bonus',  val:3, requires:['dcn2','dc4'] },
    { id:'dck6', label:'+4 SPD',     type:'small', branch:'decay', x:CX-250, y:CY+498, cost:1, stat:'speed_bonus',  val:4, requires:['dck5'] },
    // Sustain deep
    { id:'dcs5', label:'+3 Guard',   type:'small', branch:'decay', x:CX-349, y:CY+327, cost:1, stat:'guard_bonus',  val:3, requires:['dcn3','dc4'] },
    { id:'dcs6', label:'+2 CTR',     type:'small', branch:'decay', x:CX-396, y:CY+392, cost:1, stat:'control_bonus', val:2, requires:['dcs5'] },
    // Notable tier 2
    { id:'dcn4', label:'Shade Walk', type:'notable', battleType:'passive', branch:'decay', x:CX-251, y:CY+584, cost:2, stat:'speed_bonus',  val:6,  requires:['dck6'],
      desc:'◆ DECAY NOTABLE: +6 SPD. Each kill permanently raises your Power by 1 this combat (max +8). The assassin who keeps moving becomes exponentially stronger.' },
    { id:'dcn5', label:'Enduring Root',type:'notable', battleType:'passive', branch:'decay', x:CX-478, y:CY+419, cost:2, stat:'guard_bonus', val:8, requires:['dcs6'],
      desc:'◆ SYNERGY — DECAY × DEFENSE: +8 Guard. You cannot be stunned. Guard regenerates 2 per turn passively. Time is on your side — the Immortal Tank path.' },
    { id:'dcn6', label:'Dread Pulse', type:'notable', battleType:'active',  branch:'decay', x:CX-382, y:CY+526, cost:2, stat:'power_bonus',  val:6,  requires:['dc6'],
      desc:'◆ SYNERGY — DECAY × ARCANE: +6 Power. Each hit reduces enemy ATK by 2, stacking up to 4 times. Combine with Control debuffs to fully neutralize a threat over time.' },
    // Pre-keystone
    { id:'dc7',  label:'+4 SPD',     type:'small', branch:'decay', x:CX-367, y:CY+624, cost:1, stat:'speed_bonus',  val:4, requires:['dcn4','dcn6'] },
    { id:'dc8',  label:'+4 Guard',   type:'small', branch:'decay', x:CX-480, y:CY+541, cost:1, stat:'guard_bonus',  val:4, requires:['dcn5','dcn6'] },
    { id:'dck7', label:'+3 Power',   type:'small', branch:'decay', x:CX-276, y:CY+652, cost:1, stat:'power_bonus',  val:3, requires:['dc7'] },
    { id:'dcs7', label:'+3 Guard',   type:'small', branch:'decay', x:CX-535, y:CY+464, cost:1, stat:'guard_bonus',  val:3, requires:['dc8'] },
    // Keystones
    { id:'dc_ks1', label:'Soul Sever',   type:'keystone', battleType:'active',  branch:'decay', x:CX-361, y:CY+752, cost:3, requires:['dc7'],
      desc:'★ KEYSTONE — DECAY: Every kill restores 25% max HP and grants +10 Power for the rest of combat. The more enemies fall, the stronger and healthier you become. Momentum is survival.' },
    { id:'dc_ks2', label:'Ancient Root', type:'keystone', battleType:'passive', branch:'decay', x:CX-603, y:CY+575, cost:3, requires:['dc8'],
      desc:'★ KEYSTONE — DECAY × DEFENSE: Max HP is doubled. Guard regenerates 3 per turn. You always act last — but you are effectively unkillable given time. Patience wins.' },
  ]

