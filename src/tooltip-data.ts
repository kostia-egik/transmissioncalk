// src/tooltip-data.ts
export interface TooltipContent {
  title: string;
  description: string;
  unit?: string;
}

export interface TooltipContentKeys {
    titleKey: string;
    descriptionKey: string;
    unit?: string;
}

export const TOOLTIP_DATA: Record<string, TooltipContentKeys> = {
  // --- Input parameters ---
  z1: { titleKey: 'tooltip_z1_title', descriptionKey: 'tooltip_z1_description' },
  z2: { titleKey: 'tooltip_z2_title', descriptionKey: 'tooltip_z2_description' },
  m: { titleKey: 'tooltip_m_title', descriptionKey: 'tooltip_m_description', unit: 'мм' },
  eta: { titleKey: 'tooltip_eta_title', descriptionKey: 'tooltip_eta_description' },
  p: { titleKey: 'tooltip_p_title', descriptionKey: 'tooltip_p_description', unit: 'мм' },
  zSun: { titleKey: 'tooltip_zSun_title', descriptionKey: 'tooltip_zSun_description' },
  zRing: { titleKey: 'tooltip_zRing_title', descriptionKey: 'tooltip_zRing_description' },
  shaftConfig: { titleKey: 'tooltip_shaftConfig_title', descriptionKey: 'tooltip_shaftConfig_description' },
  d1_input: { titleKey: 'tooltip_d1_input_title', descriptionKey: 'tooltip_d1_input_description', unit: 'мм' },
  d2_input: { titleKey: 'tooltip_d2_input_title', descriptionKey: 'tooltip_d2_input_description', unit: 'мм' },
  config_bevel: { titleKey: 'tooltip_config_bevel_title', descriptionKey: 'tooltip_config_bevel_description' },
  b: { titleKey: 'tooltip_b_title', descriptionKey: 'tooltip_b_description', unit: 'мм' },
  q: { titleKey: 'tooltip_q_title', descriptionKey: 'tooltip_q_description' },
  config_worm: { titleKey: 'tooltip_config_worm_title', descriptionKey: 'tooltip_config_worm_description' },
  m_te: { titleKey: 'tooltip_m_te_title', descriptionKey: 'tooltip_m_te_description', unit: 'мм' },

  // --- Calculated parameters ---
  u: { titleKey: 'tooltip_u_title', descriptionKey: 'tooltip_u_description' },
  a: { titleKey: 'tooltip_a_title', descriptionKey: 'tooltip_a_description', unit: 'мм' },
  d1: { titleKey: 'tooltip_d1_title', descriptionKey: 'tooltip_d1_description', unit: 'мм' },
  d2: { titleKey: 'tooltip_d2_title', descriptionKey: 'tooltip_d2_description', unit: 'мм' },
  da1: { titleKey: 'tooltip_da1_title', descriptionKey: 'tooltip_da1_description', unit: 'мм' },
  da2: { titleKey: 'tooltip_da2_title', descriptionKey: 'tooltip_da2_description', unit: 'мм' },
  df1: { titleKey: 'tooltip_df1_title', descriptionKey: 'tooltip_df1_description', unit: 'мм' },
  df2: { titleKey: 'tooltip_df2_title', descriptionKey: 'tooltip_df2_description', unit: 'мм' },
  epsilonAlpha: { titleKey: 'tooltip_epsilonAlpha_title', descriptionKey: 'tooltip_epsilonAlpha_description' },

  chain_d1: { titleKey: 'tooltip_chain_d1_title', descriptionKey: 'tooltip_chain_d1_description', unit: 'мм' },
  chain_d2: { titleKey: 'tooltip_chain_d2_title', descriptionKey: 'tooltip_chain_d2_description', unit: 'мм' },
  chain_da1: { titleKey: 'tooltip_chain_da1_title', descriptionKey: 'tooltip_chain_da1_description', unit: 'мм' },
  chain_da2: { titleKey: 'tooltip_chain_da2_title', descriptionKey: 'tooltip_chain_da2_description', unit: 'мм' },
  chain_amin: { titleKey: 'tooltip_chain_amin_title', descriptionKey: 'tooltip_chain_amin_description', unit: 'мм' },
  
  zPlanet: { titleKey: 'tooltip_zPlanet_title', descriptionKey: 'tooltip_zPlanet_description' },
  assemblyPossible: { titleKey: 'tooltip_assemblyPossible_title', descriptionKey: 'tooltip_assemblyPossible_description' },
  fixedShaft: { titleKey: 'tooltip_fixedShaft_title', descriptionKey: 'tooltip_fixedShaft_description' },
  planetary_dSun: { titleKey: 'tooltip_planetary_dSun_title', descriptionKey: 'tooltip_planetary_dSun_description', unit: 'мм' },
  planetary_dPlanet: { titleKey: 'tooltip_planetary_dPlanet_title', descriptionKey: 'tooltip_planetary_dPlanet_description', unit: 'мм' },
  planetary_dRing: { titleKey: 'tooltip_planetary_dRing_title', descriptionKey: 'tooltip_planetary_dRing_description', unit: 'мм' },
  planetary_a: { titleKey: 'tooltip_planetary_a_title', descriptionKey: 'tooltip_planetary_a_description', unit: 'мм' },
  epsilon_sp: { titleKey: 'tooltip_epsilon_sp_title', descriptionKey: 'tooltip_epsilon_sp_description' },
  epsilon_pr: { titleKey: 'tooltip_epsilon_pr_title', descriptionKey: 'tooltip_epsilon_pr_description' },

  tb_d1: { titleKey: 'tooltip_tb_d1_title', descriptionKey: 'tooltip_tb_d1_description', unit: 'мм' },
  tb_d2: { titleKey: 'tooltip_tb_d2_title', descriptionKey: 'tooltip_tb_d2_description', unit: 'мм' },
  tb_amin: { titleKey: 'tooltip_tb_amin_title', descriptionKey: 'tooltip_tb_amin_description', unit: 'мм' },

  belt_amin: { titleKey: 'tooltip_belt_amin_title', descriptionKey: 'tooltip_belt_amin_description', unit: 'мм' },
  actual_d1: { titleKey: 'tooltip_actual_d1_title', descriptionKey: 'tooltip_actual_d1_description', unit: 'мм' },
  actual_d2: { titleKey: 'tooltip_actual_d2_title', descriptionKey: 'tooltip_actual_d2_description', unit: 'мм' },

  bevel_d1: { titleKey: 'tooltip_bevel_d1_title', descriptionKey: 'tooltip_bevel_d1_description', unit: 'мм' },
  bevel_d2: { titleKey: 'tooltip_bevel_d2_title', descriptionKey: 'tooltip_bevel_d2_description', unit: 'мм' },
  bevel_delta1: { titleKey: 'tooltip_bevel_delta1_title', descriptionKey: 'tooltip_bevel_delta1_description', unit: '°' },
  bevel_delta2: { titleKey: 'tooltip_bevel_delta2_title', descriptionKey: 'tooltip_bevel_delta2_description', unit: '°' },
  bevel_Re: { titleKey: 'tooltip_bevel_Re_title', descriptionKey: 'tooltip_bevel_Re_description', unit: 'мм' },
  bevel_dm1: { titleKey: 'tooltip_bevel_dm1_title', descriptionKey: 'tooltip_bevel_dm1_description', unit: 'мм' },
  bevel_dm2: { titleKey: 'tooltip_bevel_dm2_title', descriptionKey: 'tooltip_bevel_dm2_description', unit: 'мм' },
  bevel_epsilonAlpha: { titleKey: 'tooltip_bevel_epsilonAlpha_title', descriptionKey: 'tooltip_bevel_epsilonAlpha_description' },
  
  worm_a: { titleKey: 'tooltip_worm_a_title', descriptionKey: 'tooltip_worm_a_description', unit: 'мм' },
  worm_d1: { titleKey: 'tooltip_worm_d1_title', descriptionKey: 'tooltip_worm_d1_description', unit: 'мм' },
  worm_d2: { titleKey: 'tooltip_worm_d2_title', descriptionKey: 'tooltip_worm_d2_description', unit: 'мм' },
  worm_da1: { titleKey: 'tooltip_worm_da1_title', descriptionKey: 'tooltip_worm_da1_description', unit: 'мм' },
  worm_da2: { titleKey: 'tooltip_worm_da2_title', descriptionKey: 'tooltip_worm_da2_description', unit: 'мм' },
  worm_df2: { titleKey: 'tooltip_worm_df2_title', descriptionKey: 'tooltip_worm_df2_description', unit: 'мм' },
  worm_gamma: { titleKey: 'tooltip_worm_gamma_title', descriptionKey: 'tooltip_worm_gamma_description', unit: '°' },
  
  // --- Engine parameters ---
  initialTorque: { titleKey: 'tooltip_initialTorque_title', descriptionKey: 'tooltip_initialTorque_description', unit: 'Нм' },
  initialMinRpm: { titleKey: 'tooltip_initialMinRpm_title', descriptionKey: 'tooltip_initialMinRpm_description', unit: 'об/мин' },
  initialMaxRpm: { titleKey: 'tooltip_initialMaxRpm_title', descriptionKey: 'tooltip_initialMaxRpm_description', unit: 'об/мин' },
};