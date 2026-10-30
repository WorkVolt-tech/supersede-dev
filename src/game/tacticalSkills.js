// Position rules for all 101 existing class actives and 30 elemental attacks.
// Self effects can be used in any tile. Direct and ranged effects inherit
// the same grid coordinate system as src/game/tacticalGrid.js.
// This is targeting metadata, NOT alternate damage/status formulas.
import { isTacticalTargetValid } from './tacticalGrid.js'

const BY_KIND = {
  class: {
    self: ["cataclysm","last_engine","final_massacre","summon_retainer","the_throne","mass_decree","stance_solar","stance_lunar","totality","dual_horizon","possession_surge","true_vessel","ghost_step","phase_strike","shadowmeld","murder_strike","read_error","caught_exception","buffer","try_catch","segfault","compile_time_error","garbage_collection","final_standard","anchor_pulse","living_wall","healing_wave","dawnward_light","disappear","the_empty_one","great_hunger","memory_of_steel","speak_to_dead","shift_beast","shift_coil","shift_storm","true_beast","eternal_coil","stormlord","erasure","disowned_hit","no_such_person","break_wall","break_hunt","reswear_fury","final_oath_sanctuary","final_oath_hunt","quiet_court","eyes_of_equilibrium","inexorable","one_step_more","walking_tomb","anchor_line","climb","surface_memory","hollow_sea","return_from_below","twilight_shift"],
    close: ["fury_slam","devour_soul","void_flurry","final_witness_gb","final_massacre_r","bleeding_cascade","final_riposte","all_that_remains","endless_hollow","cleansing_devour","last_course","survivors_end"],
    mid: ["conquest","final_eclipse","kernel_panic","bit_flip","radiant_burst","dawnbreaker","break_fury","final_oath_wrath","render_verdict","final_verdict_sj","hammer_falls","drowned","all_crowns_worn","last_mercy","court_adjourned","fatal_exception"],
    long: ["sentence_mark","final_decree","execution_thread","erase_mark","singularity","final_erasure","throne_speaks","apex_sovereign","skip","the_unmoved","bury_the_hour","long_silence","all_written_out","silent_court","the_inevitable"],
  },
  elemental: {
    self: ["wind_ultimate_tornado_field","metal_ultimate_iron_domain"],
    close: ["fire_skill_fire_blast","wind_skill_dash_strike","metal_skill_blade_arc","earth_ultimate_earthquake"],
    mid: ["water_skill_water_jet","fire_ultimate_inferno_zone","plant_skill_thorn_volley","plant_ultimate_nature_overgrowth","poison_skill_venom_spit","shadow_skill_umbral_burst","poison_skill_blight_nova","wind_mastery_cyclone"],
    long: ["fire_mastery_cinderstorm","water_ultimate_tsunami","water_mastery_maelstrom","lightning_skill_lightning_strike","lightning_ultimate_thunderstorm","lightning_mastery_tempest","arcane_skill_resonant_bolt","arcane_ultimate_standing_chord","arcane_mastery_resonance","shadow_skill_shadow_lance","shadow_mastery_eclipse","earth_skill_stone_throw","earth_mastery_tectonic","plant_mastery_bloom","metal_mastery_annihilate","poison_mastery_pandemic"],
  },
}

const PATTERNS = {
  self:  { label:'Self / support', target:'self', reach:'self' },
  close: { label:'Close · front/mid', target:'enemy', reach:'short',
           from:[0,1], to:[0,1], cols:'near', shape:'single' },
  mid:   { label:'Mid · nearby column', target:'enemy', reach:'mid',
           from:[0,1,2], to:[0,1,2], cols:'near', shape:'single' },
  long:  { label:'Long · any position', target:'enemy', reach:'long',
           from:[0,1,2], to:[0,1,2], cols:'any', shape:'single' },
}

function rulesFor(group) {
  return Object.fromEntries(Object.entries(group).flatMap(([mode, ids]) =>
    ids.map(id => [id, Object.freeze({id, ...PATTERNS[mode]})])))
}

export const CLASS_SKILL_TARGETING = Object.freeze(rulesFor(BY_KIND.class))
export const ELEMENTAL_SKILL_TARGETING = Object.freeze(rulesFor(BY_KIND.elemental))

// Future skills remain playable until they have been explicitly assigned.
export function getTacticalSkillRule(skillId) {
  return CLASS_SKILL_TARGETING[skillId] || ELEMENTAL_SKILL_TARGETING[skillId] || null
}

export function canUseTacticalSkill(skillId, from, enemyPosition) {
  const rule=getTacticalSkillRule(skillId)
  if(!rule || rule.target==='self')return true
  return isTacticalTargetValid(rule, from, enemyPosition)
}
